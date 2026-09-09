// GajiMarketApp의 화면/상태에서 공용으로 쓰는 타입 모음.
//
// 여기 있는 타입들은 거의 안 바뀌는 편이라, 새 화면·기능을 추가할 때 이 파일과
// 충돌할 일은 드물다 — GajiMarketApp.tsx 맨 위에 다 몰려있던 걸 분리한 이유도
// 그 부분(타입 + 목업 데이터 + import문)이 여러 PR에서 자주 동시에 건드려져서
// 머지 충돌이 반복됐기 때문.
import type { LucideIcon } from "lucide-react";
import type { TogetherCategory } from "@/types";
import type { DreamFacility } from "@/services";

export type TabId = "home" | "community" | "map" | "chats" | "my";
export type TradeStatus = "SALE" | "RESERVED" | "SOLD";
export type TradeType = "SALE" | "FREE";
export type ChatType = "TRADE" | "COMMUNITY" | "GROUP" | "SYSTEM";
export type TradeRole = "SELLER" | "BUYER";
export type SheetId = null | "write" | "region" | "notifications" | "status";

export interface AlbaItem {
  id: string;
  title: string;
  companyName: string;
  neighborhoodName: string;
  detailLocation: string;
  payType: "연봉" | "일급" | "시급" | "월급";
  payAmount: number;
  payLabel: string;
  workingDays: string;
  workingHours: string;
  category: "이웃알바" | "걸어서10분" | "단기알바" | "식당/카페" | "물류/현장" | "레슨/과외";
  badges: string[];
  reviewCount?: number;
  thumbnailTone: string;
  thumbnailEmoji?: string;
  thumbnailUrl?: string;
  bgGradient: string;
  descriptionBullets: string[];
  details: string;
  applicantCount: number;
  viewCount: number;
  isFavorite: boolean;
  hasApplied: boolean;
  phoneContact: string;
  isAd?: boolean;
  createdAt: string;
}

export type SubPage =
  | null
  | { type: "product-detail"; id: string }
  | { type: "product-form"; editId?: string }
  | { type: "community-detail"; id: string }
  | { type: "community-form" }
  | { type: "chat-room"; id: string }
  | { type: "chat-room-list"; productId: string; productTitle: string }
  | { type: "payment-amount"; chatRoomId: string }
  | { type: "payment-detail"; chatRoomId: string; transactionId: string }
  | { type: "my-menu" }
  | { type: "all-services" }
  | { type: "merge-game" }
  | { type: "real-estate" }
  | { type: "dream-dashboard" }
  | { type: "dream-notice" }
  | { type: "alba"; tab?: "home" | "search" | "applications" | "manage"; category?: string }
  | { type: "alba-detail"; id: string }
  | { type: "alba-form" }
  | { type: "together-intro" }
  | { type: "together-category" }
  | { type: "together-form"; category?: TogetherCategory }
  | { type: "together-detail"; id: string }
  | { type: "settings" }
  | { type: "sales" }
  | { type: "favorites" }
  | { type: "recently-viewed" }
  | { type: "apartment-verification" }
  | { type: "apartment-community"; apartmentName?: string }
  | { type: "search" }
  | { type: "region-search"; returnTo?: "dream-dashboard" };

export type ProductListItem = {
  id: string;
  title: string;
  thumbnailLabel: string;
  thumbnailTone: string;
  neighborhoodName: string;
  distanceKm?: number;
  createdAt: string;
  price: number | null;
  tradeStatus: TradeStatus;
  tradeType: TradeType;
  purchaseMode?: "NORMAL" | "DIRECT";
  chatCount: number;
  favoriteCount: number;
  viewCount: number;
  interestCount: number;
  isFavorite: boolean;
  mine: boolean;
  description: string;
  tradePlace?: string;
  sellerNickname?: string;
  sellerMannerTemp?: number;
  category: string;
  thumbnailUrl?: string;
};

export type ChatMessageUi = {
  mine: boolean;
  text: string;
  time: string;
  imageUrl?: string;
  // 당근페이 송금 메시지에만 실린다 — 채팅방 버블/상세내역 화면 둘 다 이 값 하나로 그린다.
  payment?: { transactionId: string; amount: number; balanceAfter: number; createdAt: string };
};

export type CommunityPost = {
  id: string;
  categoryName: string;
  title: string;
  contentPreview: string;
  thumbnailTone?: string;
  thumbnailCount?: number;
  neighborhoodName: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
};

export type ChatRoom = {
  id: string;
  type: ChatType;
  tradeRole?: TradeRole;
  title: string;
  avatarTone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  verified: boolean;
  muted: boolean;
  productId?: string;
  onClick?: () => void;
  // 채팅방 헤더/물품카드용 — 백엔드가 ChatRoomResponse에 얹어준 상대방/물품 요약.
  counterpartNickname?: string;
  counterpartMannerTemp?: number;
  counterpartNeighborhoodName?: string;
  productThumbnailUrl?: string;
  productPrice?: number | null;
  productTradeStatus?: TradeStatus;
};

export type DangerTone = "fire" | "accident" | "construction" | "failure" | "control" | "flood" | "default";

export type LocalBusiness = {
  id: string;
  name: string;
  category: string;
  neighborhoodName: string;
  districtName?: string;
  distance: string;
  openNow: boolean;
  liked: boolean;
  summary: string;
  lat: number;
  lng: number;
  riskType?: string | null;
  dangerTone?: DangerTone;
  observedAt?: string | null;
  sourceUrl?: string | null;
  source?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
};

export type DangerVisual = {
  label: string;
  emoji: string;
  tone: DangerTone;
  badgeLabel?: string;
  subLabel?: string;
  helperEmoji?: string;
};

export type DonationFacility = DreamFacility;

export type LocalCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  tone: string;
};

export type IconItem = {
  label: string;
  icon: LucideIcon;
  tone?: string;
  onClick?: () => void;
};

export type MapSearchBounds = { south: number; north: number; west: number; east: number };

export type NaverMapInstance = {
  autoResize?: () => void;
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => {
    getSW: () => { lat: () => number; lng: () => number };
    getNE: () => { lat: () => number; lng: () => number };
  };
};

export type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
  setIcon?: (icon: any) => void;
  setZIndex?: (zIndex: number) => void;
  getPosition?: () => { lat: () => number; lng: () => number };
};

export type NaverMapsNamespace = {
  Event?: {
    addListener: (target: any, eventName: string, listener: (...args: any[]) => void) => unknown;
    removeListener: (listener: unknown) => void;
  };
  LatLng: new (lat: number, lng: number) => unknown;
  Point?: new (x: number, y: number) => unknown;
  LatLngBounds?: new (sw: unknown, ne: unknown) => unknown;
  Map: new (
    element: HTMLElement,
    options: {
      center: unknown;
      zoom: number;
      logoControl?: boolean;
      mapDataControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      zoomControl?: boolean;
    },
  ) => NaverMapInstance;
  Marker: new (options: {
    position: unknown;
    map: NaverMapInstance;
    title?: string;
    opacity?: number;
    zIndex?: number;
    icon?: { content: HTMLElement | string; anchor?: unknown };
  }) => NaverMarkerInstance;
};

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsNamespace;
    };
    // 카카오맵 SDK 타입은 이 파일 안 딱 한 컴포넌트(TradePlaceMap)에서만 쓰여서
    // NaverMapsNamespace처럼 따로 안 만들고 느슨하게 any로 둔다.
    kakao?: any;
  }
}

export type Region = { id: number; dongName: string; guName: string };

export type DangerSignalApiItem = {
  id?: string | number;
  name?: string | null;
  risk_name?: string | null;
  category?: string | null;
  neighborhood_name?: string | null;
  sigungu?: string | null;
  district_name?: string | null;
  distance?: string | null;
  open_now?: boolean | null;
  liked?: boolean | null;
  summary?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  risk_type?: string | null;
  observed_at?: string | null;
  source_url?: string | null;
};

export type DangerSignalApiResponse = { items?: DangerSignalApiItem[] } | DangerSignalApiItem[];

export type ThemeMode = "dark" | "light";

export type ProductSort = "latest" | "price_asc" | "price_desc";

export interface ProductFilters {
  category?: string;
  tradeType?: "SALE" | "FREE";
  priceMin?: number;
  priceMax?: number;
  sort: ProductSort;
  excludeSold?: boolean;
}
