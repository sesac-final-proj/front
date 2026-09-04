import type { TradeProduct, TradeProductPage, TradeProductQuery } from "@/types/trade";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface ApiProductListItem {
  id: number;
  title: string;
  neighborhood_name: string;
  created_at: string;
  price: number | null;
  trade_status: TradeProduct["tradeStatus"];
  trade_type: TradeProduct["tradeType"];
  chat_count: number;
  favorite_count: number;
  view_count?: number;
  interest_count?: number;
  category?: string;
  search_keyword?: string | null;
  description?: string | null;
  trade_place?: string | null;
  seller_nickname?: string | null;
  seller_manner_temp?: number | null;
}

interface ApiProductPage {
  items: ApiProductListItem[];
  total: number;
}

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

// src/app/auth/callback/page.tsx의 소셜 로그인 콜백이 이 키들에 토큰을 저장한다.
export const AUTH_TOKEN_STORAGE_KEY = "carrot_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "carrot_refresh_token";

export class AuthRequiredError extends Error {
  constructor() {
    super("로그인이 필요합니다.");
    this.name = "AuthRequiredError";
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

// 설정 > 로그아웃에서 호출. 백엔드 세션(리프레시 토큰) 폐기 요청은 best-effort로만
// 보내고, 실패하더라도 로컬 토큰은 항상 지워서 클라이언트는 확실히 로그아웃 상태가 되게 한다.
export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  try {
    if (refreshToken) {
      await fetch(apiUrl("/api/v1/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch {
    // ponytail: 네트워크 실패해도 로컬 로그아웃은 진행
  } finally {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

function toTradeProduct(item: ApiProductListItem): TradeProduct {
  return {
    id: item.id,
    title: item.title,
    neighborhoodName: item.neighborhood_name,
    createdAt: item.created_at,
    price: item.price,
    tradeStatus: item.trade_status,
    tradeType: item.trade_type,
    chatCount: item.chat_count,
    favoriteCount: item.favorite_count,
    // ponytail: 백엔드에 view_count가 아직 없을 수 있어 방어적으로 0 처리
    viewCount: item.view_count ?? 0,
    // 크롤링 원본 "관심" 스냅샷 — 실서비스 찜(favorite_count)과는 별개 값, 화면엔 합산해서 보여준다.
    interestCount: item.interest_count ?? 0,
    category: item.category ?? "중고거래",
    searchKeyword: item.search_keyword ?? undefined,
    description: item.description ?? undefined,
    tradePlace: item.trade_place ?? undefined,
    sellerNickname: item.seller_nickname ?? undefined,
    sellerMannerTemp: item.seller_manner_temp ?? undefined,
  };
}

// 중고거래 상품 목록. 공개 엔드포인트라 로그인 없이도 조회 가능.
export async function listProducts(
  query: TradeProductQuery = {},
  signal?: AbortSignal,
): Promise<TradeProductPage> {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.tradeStatus) params.set("trade_status", query.tradeStatus);
  if (query.q) params.set("q", query.q);
  if (query.regionId !== undefined) params.set("region_id", String(query.regionId));
  params.set("page", String(query.page ?? 1));
  params.set("size", String(query.size ?? 60));

  const response = await fetch(apiUrl(`/api/v1/trades/products?${params}`), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("상품 목록을 불러오지 못했습니다.");
  }

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 내 판매내역. "판매내역에 예전 글이 안 보임" 버그의 원인이 여기 있었다 —
// 원래는 listProducts로 받은 전체 목록을 클라이언트에서 product.mine으로
// 걸렀는데, 그 mine 값이 실서버 데이터에 대해 항상 false로 고정돼 있어서
// 새로고침(새 세션)하면 항상 빈 목록이었다. 서버가 이미 created_by로
// 걸러주는 전용 엔드포인트가 있어서 그걸 쓴다. Bearer 토큰이 필요.
export async function getMyProducts(signal?: AbortSignal): Promise<TradeProductPage> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const params = new URLSearchParams({ page: "1", size: "60" });
  const response = await fetch(apiUrl(`/api/v1/trades/products/mine?${params}`), {
    signal,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("판매내역을 불러오지 못했습니다.");

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 내 찜 목록. myProducts와 같은 이유로 전용 엔드포인트를 쓴다 — 일반 목록의
// isFavorite도 실서버 데이터에 대해 항상 false라 새로고침하면 찜한 상품이
// 안 보였다.
export async function getMyFavorites(signal?: AbortSignal): Promise<TradeProductPage> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const params = new URLSearchParams({ page: "1", size: "60" });
  const response = await fetch(apiUrl(`/api/v1/trades/products/favorites?${params}`), {
    signal,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("찜 목록을 불러오지 못했습니다.");

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 목록 API는 description을 안 내려줘서(상세 API만 채워짐) 상세 화면 진입 시 따로 조회.
export async function getProduct(id: number, signal?: AbortSignal): Promise<TradeProduct> {
  const response = await fetch(apiUrl(`/api/v1/trades/products/${id}`), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("상품 상세를 불러오지 못했습니다.");
  }

  const payload: ApiProductListItem = await response.json();
  return toTradeProduct(payload);
}

interface ApiProductCreateRequest {
  title: string;
  category: string;
  description?: string | null;
  desired_price?: number | null;
  trade_type?: TradeProduct["tradeType"];
}

interface ApiProductCreated {
  id: number;
}

// 중고거래 글쓰기. Bearer 토큰이 필요한 엔드포인트라 토큰이 없으면(로그인 전) AuthRequiredError.
export async function createProduct(input: {
  title: string;
  category: string;
  description: string;
  desiredPrice: number | null;
  tradeType: TradeProduct["tradeType"];
}): Promise<{ id: number }> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const body: ApiProductCreateRequest = {
    title: input.title,
    category: input.category,
    description: input.description,
    desired_price: input.desiredPrice,
    trade_type: input.tradeType,
  };

  const response = await fetch(apiUrl("/api/v1/trades/products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("글을 등록하지 못했습니다.");

  const payload: ApiProductCreated = await response.json();
  return { id: payload.id };
}

interface ApiFavoriteToggleResponse {
  favorited: boolean;
  favorite_count: number;
}

// 찜 추가/해제. Bearer 토큰이 필요한 엔드포인트라 토큰이 없으면(로그인 전) AuthRequiredError.
export async function setFavorite(
  productId: number,
  favorited: boolean,
): Promise<{ favorited: boolean; favoriteCount: number }> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/trades/products/${productId}/favorite`), {
    method: favorited ? "POST" : "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("찜 상태를 바꾸지 못했습니다.");

  const payload: ApiFavoriteToggleResponse = await response.json();
  return { favorited: payload.favorited, favoriteCount: payload.favorite_count };
}
