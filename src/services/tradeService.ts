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
  trade_place_lat?: number | null;
  trade_place_lng?: number | null;
  seller_nickname?: string | null;
  seller_manner_temp?: number | null;
  is_mine?: boolean;
  thumbnail_url?: string | null;
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
// 결제 QR(/carrot?pay=<id>)처럼 로그인이 필요한 딥링크로 비로그인 상태에서 들어오면
// AuthGate가 /onboarding으로 풀 페이지 이동시키면서 쿼리스트링을 통째로 잃어버린다.
// OAuth 왕복(카카오/네이버) 동안 유지되도록 URL 대신 localStorage에 목적지를 잠깐 적어두고,
// 로그인 완료 콜백(auth/callback)에서 이 값을 읽어 원래 화면으로 되돌린다.
export const POST_LOGIN_REDIRECT_STORAGE_KEY = "carrot_post_login_redirect";

// AuthGate.saveRedirectTarget()이 남겨둔 목적지를 한 번 읽고 지운다 — 로그인
// 완료 지점(auth/callback, onboarding/profile) 두 곳에서 공통으로 쓴다.
export function consumePostLoginRedirect(): string | null {
  try {
    const target = window.localStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
    if (target) window.localStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
    return target;
  } catch {
    return null;
  }
}

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

interface ApiRefreshResponse {
  access_token: string;
  refresh_token: string;
}

// 동시에 여러 요청이 401을 맞아도 refresh 호출은 한 번만 나가게 공유한다 — 백엔드가
// refresh 성공 시 이전 jti를 즉시 폐기하는 로테이션 구조라, 동시에 두 번 호출하면
// 뒤에 도착한 쪽이 이미 폐기된 refresh_token으로 실패해 불필요하게 로그아웃될 수 있다.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (!refreshToken) throw new AuthRequiredError();

      const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        throw new AuthRequiredError();
      }
      const payload: ApiRefreshResponse = await response.json();
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.access_token);
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, payload.refresh_token);
      return payload.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// 로그인 필요한 API 공통 래퍼 — access token(30분) 만료로 401을 받으면 refresh
// token으로 한 번 자동 재발급받아 재요청한다. 그마저 401/실패면(refresh token도
// 만료·폐기됨) AuthRequiredError를 던져서 호출부가 로그인 필요 처리를 하게 한다.
export async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const withAuth = (t: string): RequestInit => ({
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${t}` },
  });

  let response = await fetch(apiUrl(path), withAuth(token));
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    response = await fetch(apiUrl(path), withAuth(newToken));
    if (response.status === 401) throw new AuthRequiredError();
  }
  return response;
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

// 설정 > 탈퇴하기. 실패하면(네트워크 오류 등) 로컬 토큰은 그대로 둬서 로그인 상태를 유지한다 —
// 탈퇴는 로그아웃과 달리 되돌릴 수 없으니 서버가 실제로 처리했을 때만 로컬 세션을 지운다.
export async function withdrawAccount(): Promise<void> {
  const refreshToken = typeof window !== "undefined" ? window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) : null;
  const response = await authorizedFetch("/api/v1/auth/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error("회원 탈퇴에 실패했습니다.");
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
    tradePlaceLat: item.trade_place_lat ?? undefined,
    tradePlaceLng: item.trade_place_lng ?? undefined,
    sellerNickname: item.seller_nickname ?? undefined,
    sellerMannerTemp: item.seller_manner_temp ?? undefined,
    isMine: item.is_mine ?? false,
    thumbnailUrl: item.thumbnail_url ?? undefined,
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
  if (query.tradeType) params.set("trade_type", query.tradeType);
  if (query.priceMin !== undefined) params.set("price_min", String(query.priceMin));
  if (query.priceMax !== undefined) params.set("price_max", String(query.priceMax));
  if (query.sort) params.set("sort", query.sort);
  if (query.excludeSold) params.set("exclude_sold", "true");
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

// 실제 존재하는 카테고리 목록. 프론트에 하드코딩하면 데이터가 바뀔 때마다
// 같이 배포해야 해서, 서버에서 그때그때 실제 값을 받아온다.
export async function listCategories(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(apiUrl("/api/v1/trades/products/categories"), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("카테고리 목록을 불러오지 못했습니다.");
  }
  const payload: { items: string[] } = await response.json();
  return payload.items;
}

// 내 판매내역. "판매내역에 예전 글이 안 보임" 버그의 원인이 여기 있었다 —
// 원래는 listProducts로 받은 전체 목록을 클라이언트에서 product.mine으로
// 걸렀는데, 그 mine 값이 실서버 데이터에 대해 항상 false로 고정돼 있어서
// 새로고침(새 세션)하면 항상 빈 목록이었다. 서버가 이미 created_by로
// 걸러주는 전용 엔드포인트가 있어서 그걸 쓴다. Bearer 토큰이 필요.
export async function getMyProducts(signal?: AbortSignal): Promise<TradeProductPage> {
  const params = new URLSearchParams({ page: "1", size: "60" });
  const response = await authorizedFetch(`/api/v1/trades/products/mine?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("판매내역을 불러오지 못했습니다.");

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 내 찜 목록. myProducts와 같은 이유로 전용 엔드포인트를 쓴다 — 일반 목록의
// isFavorite도 실서버 데이터에 대해 항상 false라 새로고침하면 찜한 상품이
// 안 보였다.
export async function getMyFavorites(signal?: AbortSignal): Promise<TradeProductPage> {
  const params = new URLSearchParams({ page: "1", size: "60" });
  const response = await authorizedFetch(`/api/v1/trades/products/favorites?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("찜 목록을 불러오지 못했습니다.");

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 최근 본 상품(최대 20개, 계정별). 로그인 계정 기준으로 서버가 관리 —
// 로그아웃/재로그인해도 유지되고, 다른 계정으로 로그인하면 그 계정 것만 보인다.
export async function getRecentlyViewed(signal?: AbortSignal): Promise<TradeProductPage> {
  const response = await authorizedFetch("/api/v1/trades/products/recently-viewed", {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("최근 본 목록을 불러오지 못했습니다.");

  const payload: ApiProductPage = await response.json();
  return { items: payload.items.map(toTradeProduct), total: payload.total };
}

// 상품 상세 진입 시 조회 기록 — best-effort. 비로그인(게스트)이면 조용히 무시.
export async function recordProductView(id: number): Promise<void> {
  try {
    await authorizedFetch(`/api/v1/trades/products/${id}/view`, { method: "POST" });
  } catch {
    // ponytail: 비로그인(게스트)이거나 조회 기록 실패해도 화면엔 영향 없다 — 조용히 무시.
  }
}

// 목록 API는 description을 안 내려줘서(상세 API만 채워짐) 상세 화면 진입 시 따로 조회.
// 비로그인도 볼 수 있는 공개 API(get_current_user_optional)라 authorizedFetch(토큰 없으면
// AuthRequiredError)는 못 쓰지만, 로그인 상태면 토큰을 실어 보내야 is_mine이 제대로 나온다 —
// 안 보내면 백엔드가 항상 user=None으로 보고 본인 글도 "삭제하기"가 안 뜸(버그 리포트).
export async function getProduct(id: number, signal?: AbortSignal): Promise<TradeProduct> {
  const token = getAuthToken();
  const response = await fetch(apiUrl(`/api/v1/trades/products/${id}`), {
    signal,
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
  trade_place?: string | null;
  trade_place_lat?: number | null;
  trade_place_lng?: number | null;
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
  tradePlace?: string;
  tradePlaceLat?: number;
  tradePlaceLng?: number;
}): Promise<{ id: number }> {
  const body: ApiProductCreateRequest = {
    title: input.title,
    category: input.category,
    description: input.description,
    desired_price: input.desiredPrice,
    trade_type: input.tradeType,
    trade_place: input.tradePlace,
    trade_place_lat: input.tradePlaceLat,
    trade_place_lng: input.tradePlaceLng,
  };

  const response = await authorizedFetch("/api/v1/trades/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("글을 등록하지 못했습니다.");

  const payload: ApiProductCreated = await response.json();
  return { id: payload.id };
}

// 글 수정. title/category/description/desiredPrice 등 값이 있는 필드만 부분 갱신된다.
export async function updateProduct(
  productId: number,
  input: {
    title?: string;
    category?: string;
    description?: string;
    desiredPrice?: number | null;
    tradePlace?: string;
    tradePlaceLat?: number;
    tradePlaceLng?: number;
  },
): Promise<TradeProduct> {
  const response = await authorizedFetch(`/api/v1/trades/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      title: input.title,
      category: input.category,
      description: input.description,
      desired_price: input.desiredPrice,
      trade_place: input.tradePlace,
      trade_place_lat: input.tradePlaceLat,
      trade_place_lng: input.tradePlaceLng,
    }),
  });
  if (!response.ok) throw new Error("글을 수정하지 못했습니다.");

  const payload: ApiProductListItem = await response.json();
  return toTradeProduct(payload);
}

// 본인 글 삭제. 서버가 찜/최근본/가격분석/걸려있던 채팅방 참조까지 같이 정리한다
// (연결된 채팅 기록 자체는 보존 — trades/service.py delete_product 참고).
export async function deleteProduct(productId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/trades/products/${productId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("글을 삭제하지 못했습니다.");
}

// 상품 이미지는 1장만 유지(재업로드하면 덮어씀). NCP Object Storage에 서버를 거치지
// 않고 직접 PUT — presign → 브라우저에서 NCP로 PUT → object_key 등록, 3단계.
export async function uploadProductImage(productId: number, file: File): Promise<string> {
  const presignResponse = await authorizedFetch(`/api/v1/trades/products/${productId}/images/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ filename: file.name, content_type: file.type }),
  });
  if (!presignResponse.ok) throw new Error("이미지 업로드 URL을 받지 못했습니다.");
  const { upload_url, object_key }: { upload_url: string; object_key: string; image_url: string } =
    await presignResponse.json();

  const putResponse = await fetch(upload_url, {
    method: "PUT",
    // 백엔드 presign이 ACL(public-read)까지 서명에 포함시켜서, 이 헤더가 빠지면
    // NCP가 SignatureDoesNotMatch(403)로 거부한다 — 반드시 같이 보내야 한다.
    headers: { "Content-Type": file.type, "x-amz-acl": "public-read" },
    body: file,
  });
  if (!putResponse.ok) throw new Error("이미지를 업로드하지 못했습니다.");

  const registerResponse = await authorizedFetch(`/api/v1/trades/products/${productId}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ object_key }),
  });
  if (!registerResponse.ok) throw new Error("이미지 등록에 실패했습니다.");

  const payload: { image_url: string } = await registerResponse.json();
  return payload.image_url;
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
  const response = await authorizedFetch(`/api/v1/trades/products/${productId}/favorite`, {
    method: favorited ? "POST" : "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("찜 상태를 바꾸지 못했습니다.");

  const payload: ApiFavoriteToggleResponse = await response.json();
  return { favorited: payload.favorited, favoriteCount: payload.favorite_count };
}
