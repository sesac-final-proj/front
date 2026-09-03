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

// 로그인 플로우가 아직 없어서(온보딩 화면만 있음) 지금은 이 키에 토큰이 없다 — 실제
// 로그인이 붙으면 여기에 access_token만 저장해주면 찜 API가 바로 동작한다.
export const AUTH_TOKEN_STORAGE_KEY = "carrot_access_token";

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
