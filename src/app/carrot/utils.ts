// 상태를 안 갖는 순수 변환/포맷 함수 모음 + 네이버맵 스크립트 로더, 테마 저장소.
// GajiMarketApp.tsx 맨 위에 있던 걸 분리 — 로직 변경 없이 그대로 옮긴 것.
import { getKakaoPlaceUrl } from "@/services";
import type { CommunityFeedPost } from "@/types/community";
import type { CongestionZone, Restaurant, TradeProduct } from "@/types";
import type { ChatMessageDto, ChatRoomDto } from "@/services/chatService";
import {
  API_BASE_URL,
  DANGER_VISUALS,
  NAVER_MAP_SCRIPT_ID,
  NEIGHBORHOOD_DISTRICTS,
  NEIGHBORHOOD_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "./constants";
import type {
  ChatMessageUi,
  ChatRoom,
  CommunityPost,
  DangerSignalApiItem,
  LocalBusiness,
  ProductFilters,
  ProductListItem,
  Region,
  ThemeMode,
} from "./types";

// "당산 2동"(목업 동네 이름) ↔ "당산제2동"(실제 크롤링 지역명) 처럼 띄어쓰기/"제" 표기가
// 달라서 그냥 문자열 비교로는 절대 안 맞음 — 둘 다 같은 형태로 접어서 비교.
export function normalizeDongName(name: string) {
  return name.replace(/\s+/g, "").replace(/제(\d)/g, "$1");
}

// 목업 동네 4개 중 실제 시드 데이터(영등포구)와 겹치는 건 "문래동"·"당산 2동" 둘 —
// 나머지(위례/공릉)는 매칭되는 region이 아예 없어서 undefined를 반환하고, 호출 쪽에서
// region 필터 없이 전체 목록을 보여주는 걸로 폴백한다.
export function matchRegionId(regions: Region[], neighborhoodName: string): number | undefined {
  const target = normalizeDongName(neighborhoodName);
  return regions.find((r) => normalizeDongName(r.dongName) === target)?.id;
}

let naverMapScriptPromise: Promise<void> | null = null;

export function loadNaverMapScript(keyId: string) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.naver?.maps) {
    return Promise.resolve();
  }
  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  naverMapScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Naver map script failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = NAVER_MAP_SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Naver map script failed to load")), { once: true });
    document.head.appendChild(script);
  });

  return naverMapScriptPromise;
}

export function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

export function parseCoordinate(value: number | string | null | undefined) {
  const coordinate = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(coordinate) ? coordinate : null;
}

export function formatObservedAt(value: string | null | undefined) {
  if (!value) return "실시간";
  const observedAt = new Date(value);
  if (Number.isNaN(observedAt.getTime())) return "실시간";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(observedAt);
}

export function dangerToneForText(value: string) {
  if (/화재|불|연기/.test(value)) return "fire";
  if (/침수|호우|홍수|빗물|하천/.test(value)) return "flood";
  if (/통제|차단|금지|폐쇄/.test(value)) return "control";
  if (/고장|장애/.test(value)) return "failure";
  if (/공사|보수|작업/.test(value)) return "construction";
  if (/사고|추돌|전도|충돌/.test(value)) return "accident";
  return "default";
}

export function getDangerVisual(business: Pick<LocalBusiness, "category" | "dangerTone" | "riskType" | "name" | "summary">) {
  if (business.category !== "danger") return null;
  const tone = business.dangerTone ?? dangerToneForText(`${business.riskType ?? ""} ${business.name} ${business.summary}`);
  return DANGER_VISUALS[tone] ?? DANGER_VISUALS.default;
}

export function toDangerBusiness(item: DangerSignalApiItem): LocalBusiness | null {
  const lat = parseCoordinate(item.lat ?? item.latitude);
  const lng = parseCoordinate(item.lng ?? item.longitude);
  if (lat === null || lng === null) return null;

  const districtName = item.sigungu ?? item.district_name ?? item.neighborhood_name ?? "서울";
  const name = item.name ?? item.risk_name ?? item.risk_type ?? "서울안전누리 위험신호";
  const summary = item.summary ?? item.risk_type ?? "서울안전누리 위험신호";
  const dangerTone = dangerToneForText(`${item.risk_type ?? ""} ${name} ${summary}`);

  return {
    id: `nuri-${String(item.id ?? `${lat}-${lng}-${name}`)}`,
    name,
    category: "danger",
    neighborhoodName: districtName,
    districtName,
    distance: item.distance ?? formatObservedAt(item.observed_at),
    openNow: item.open_now ?? true,
    liked: item.liked ?? false,
    summary,
    lat,
    lng,
    riskType: item.risk_type,
    dangerTone,
    observedAt: item.observed_at,
    sourceUrl: item.source_url,
  };
}

export function matchesNeighborhood(business: LocalBusiness, neighborhood: string) {
  const district = NEIGHBORHOOD_DISTRICTS[neighborhood];
  return business.neighborhoodName === neighborhood || Boolean(district && business.districtName === district);
}

export function formatRestaurantDistance(distance?: string) {
  const meters = Number(distance);
  if (!Number.isFinite(meters) || meters <= 0) return "현 지도";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

export function restaurantToLocalBusiness(
  restaurant: Restaurant,
  neighborhoodName: string,
  index: number,
): LocalBusiness {
  const address = restaurant.roadAddress || restaurant.address || "카카오 지도 음식점";
  const districtName = address.split(/\s+/)[1] || NEIGHBORHOOD_DISTRICTS[neighborhoodName] || neighborhoodName;

  return {
    id: restaurant.id || `restaurant-${index}`,
    name: restaurant.name,
    category: "food",
    neighborhoodName,
    districtName,
    distance: restaurant.category || formatRestaurantDistance(restaurant.distance),
    openNow: true,
    liked: false,
    summary: address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    sourceUrl: getKakaoPlaceUrl(restaurant),
    source: restaurant.source,
    imageUrl: restaurant.imageUrl || restaurant.thumbnailUrl,
    thumbnailUrl: restaurant.thumbnailUrl || restaurant.imageUrl,
  };
}

export function matchesBusinessQuery(business: LocalBusiness, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return true;
  return (
    business.name.includes(trimmedQuery) ||
    business.summary.includes(trimmedQuery) ||
    business.neighborhoodName.includes(trimmedQuery) ||
    (business.districtName?.includes(trimmedQuery) ?? false) ||
    (business.riskType?.includes(trimmedQuery) ?? false)
  );
}

export function matchesCongestionQuery(zone: CongestionZone, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return true;
  return (
    zone.name.includes(trimmedQuery) ||
    zone.summary.includes(trimmedQuery) ||
    zone.neighborhoodName.includes(trimmedQuery) ||
    zone.districtName.includes(trimmedQuery)
  );
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function toProductListItem(item: TradeProduct): ProductListItem {
  return {
    id: String(item.id),
    title: item.title,
    thumbnailLabel: item.title.slice(0, 2),
    thumbnailTone: "",
    neighborhoodName: item.neighborhoodName,
    createdAt: formatRelativeTime(item.createdAt),
    price: item.price,
    tradeStatus: item.tradeStatus,
    tradeType: item.tradeType,
    chatCount: item.chatCount,
    favoriteCount: item.favoriteCount,
    viewCount: item.viewCount,
    interestCount: item.interestCount,
    isFavorite: false,
    mine: item.isMine ?? false,
    // ponytail: 백엔드 상세 카테고리(예: "청소기")는 검색어로만 노출 — 목록 상단 탭 필터는
    // "중고거래"(이 API가 다루는 섹션 자체) 기준으로 매칭시킴
    description: item.description ?? (item.searchKeyword ? `연관 검색어: ${item.searchKeyword}` : ""),
    category: "중고거래",
    thumbnailUrl: item.thumbnailUrl,
  };
}

export function toCommunityPost(item: CommunityFeedPost): CommunityPost {
  return {
    id: String(item.id),
    authorId: item.authorId,
    authorNickname: item.authorNickname,
    mine: item.isMine,
    categoryName: item.category,
    title: item.title,
    contentPreview: item.content,
    neighborhoodName: item.neighborhoodName,
    createdAt: formatRelativeTime(item.createdAt),
    viewCount: item.viewCount,
    commentCount: item.commentCount,
    reactionCount: item.reactionCount,
    isReacted: item.isReacted,
    thumbnailUrl: item.thumbnailUrl,
    thumbnailTone: item.thumbnailUrl ? "article" : undefined,
    thumbnailCount: item.thumbnailUrl ? 1 : undefined,
  };
}

export function toChatRoomUi(dto: ChatRoomDto): ChatRoom {
  return {
    id: String(dto.id),
    type: dto.type,
    tradeRole: dto.isSeller ? "SELLER" : "BUYER",
    title: dto.title,
    avatarTone: "product",
    lastMessage: dto.lastMessage ?? "",
    lastMessageAt: dto.lastMessageAt ? formatRelativeTime(dto.lastMessageAt) : "",
    lastMessageAtRaw: dto.lastMessageAt ?? "",
    unreadCount: dto.unreadCount,
    verified: dto.verified,
    muted: false,
    productId: dto.productId !== null ? String(dto.productId) : undefined,
    counterpartNickname: dto.counterpartNickname ?? undefined,
    counterpartMannerTemp: dto.counterpartMannerTemp ?? undefined,
    counterpartNeighborhoodName: dto.counterpartNeighborhoodName ?? undefined,
    productThumbnailUrl: dto.productThumbnailUrl ?? undefined,
    productPrice: dto.productPrice,
    productTradeStatus: dto.productTradeStatus ?? undefined,
  };
}

export function toChatMessageUi(dto: ChatMessageDto, myUserId: number | undefined): ChatMessageUi {
  return {
    mine: dto.senderId === myUserId,
    text: dto.content ?? "",
    time: formatRelativeTime(dto.createdAt),
    createdAt: dto.createdAt,
    imageUrl: dto.messageType === "IMAGE" ? (dto.imageUrl ?? undefined) : undefined,
    payment:
      dto.messageType === "PAYMENT" && dto.payment
        ? {
            transactionId: String(dto.payment.transactionId),
            amount: dto.payment.amount,
            balanceAfter: dto.payment.balanceAfter,
            createdAt: dto.createdAt,
          }
        : undefined,
  };
}

let sessionTheme: ThemeMode = "dark";

export function readTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Retain the in-memory selection when browser storage is unavailable.
  }
  return sessionTheme;
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("carrot-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("carrot-theme-change", onChange);
  };
}

// 모듈 스코프 sessionTheme은 import한 쪽에서 직접 재할당할 수 없어서(ESM 라이브
// 바인딩 제약) setter로 감싼다 — GajiMarketApp.tsx의 changeTheme이 이걸 호출한다.
export function setSessionTheme(value: ThemeMode) {
  sessionTheme = value;
}

export interface NeighborhoodCache {
  primary: string;
  secondary: string | null;
}

// 로그인 유저는 대표 동네가 서버(User.region)에도 저장되지만, 게스트는 저장할
// 계정이 없어 이 로컬 캐시가 유일한 저장소다. 부동네(secondary)는 서버에 아예
// 대응 개념이 없어 로그인 여부와 무관하게 항상 이 캐시로만 유지된다.
export function readNeighborhoodCache(): NeighborhoodCache | null {
  try {
    const saved = window.localStorage.getItem(NEIGHBORHOOD_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (typeof parsed?.primary !== "string") return null;
    return { primary: parsed.primary, secondary: typeof parsed.secondary === "string" ? parsed.secondary : null };
  } catch {
    return null;
  }
}

export function writeNeighborhoodCache(cache: NeighborhoodCache) {
  try {
    window.localStorage.setItem(NEIGHBORHOOD_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 저장 불가(프라이빗 모드 등)면 이번 세션만 상태로 유지 — 조용히 넘어간다.
  }
}

export function formatPrice(product: ProductListItem) {
  if (product.tradeType === "FREE" || product.price === null || product.price === 0) {
    return "나눔";
  }
  return `${product.price.toLocaleString("ko-KR")}원`;
}

export function formatBadge(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

export function hasActiveProductFilters(filters: ProductFilters): boolean {
  return (
    Boolean(filters.category) ||
    Boolean(filters.tradeType) ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.sort !== "latest" ||
    Boolean(filters.excludeSold)
  );
}
