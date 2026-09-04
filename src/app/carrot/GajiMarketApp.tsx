"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Calendar,
  EllipsisVertical,
  FileText,
  Footprints,
  Package,
  Share2,
  BadgePercent,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building,
  Building2,
  CakeSlice,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Crosshair,
  Dumbbell,
  Eye,
  Gem,
  Gamepad2,
  GraduationCap,
  Headphones,
  Heart,
  Home,
  House,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Menu,
  MessageCircle,
  MoreVertical,
  NotebookTabs,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  SprayCan,
  Store,
  Tag,
  Truck,
  EyeOff,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./GajiMarketApp.module.css";
import { MarkerClustering } from "@/lib/naver-map/MarkerClustering";
import {
  getCongestionDelta,
  getCongestionLevelLabel,
  getCongestionZonesForNeighborhood,
  getCongestionZonesForBounds,
  getCongestionZonesNearCenter,
  getSeedPastelTheme,
  SEED_PASTEL_COLOR_BOARD,
  summarizeCongestion,
  type CongestionZone,
} from "@/services/congestionService";
import { getKakaoPlaceUrl, getRestaurantsByBounds, type Restaurant } from "@/services/restaurantService";
import { getMe, updateRegion, type Me } from "@/services/authService";
import {
  AuthRequiredError,
  createProduct,
  getMyFavorites,
  getMyProducts,
  getProduct,
  listProducts,
  logout as logoutRequest,
  setFavorite,
} from "@/services/tradeService";
import type { TradeProduct } from "@/types/trade";
import {
  createOrGetChatRoom,
  leaveChatRoom as leaveChatRoomRequest,
  listChatRooms,
  listMessages as listChatMessages,
  sendMessage as sendChatMessage,
  updateChatTradeStatus,
  type ChatMessageDto,
  type ChatRoomDto,
  type ChatTradeStatus,
} from "@/services/chatService";
import { blockUser, reportUser } from "@/services/safetyService";
import {
  getRentTransactions,
  groupBuildingsByDong,
  groupTransactionsByBuilding,
} from "@/services/realEstateService";
import type {
  HouseTypeFilter,
  PropertyBuilding,
  RealEstateBounds,
  RentTransaction,
  RentTypeFilter,
} from "@/types/realEstate";
import { TogetherIntroView } from "./components/together/TogetherIntroView";
import { TogetherCategoryView } from "./components/together/TogetherCategoryView";
import { TogetherFormView } from "./components/together/TogetherFormView";
import { TogetherFeedCard } from "./components/together/TogetherFeedCard";
import { TogetherDetailView } from "./components/together/TogetherDetailView";
import type { TogetherCategory, TogetherPost, CreateTogetherPostInput } from "@/types/together";
import {
  getTogetherPosts,
  createTogetherPost,
  toggleTogetherJoin,
} from "@/services/togetherService";
import { KakaoMapLayer, KAKAO_MAP_KEY, loadKakaoMapScript } from "./components/map/KakaoMapLayer";
import { RestaurantDetailSheet } from "./components/map/RestaurantDetailSheet";
import { GajiMergeGameScreen } from "./components/merge-game/GajiMergeGameScreen";


type TabId = "home" | "community" | "map" | "chats" | "my";
type TradeStatus = "SALE" | "RESERVED" | "SOLD";
type TradeType = "SALE" | "FREE";
type ChatType = "TRADE" | "COMMUNITY" | "GROUP" | "SYSTEM";
type TradeRole = "SELLER" | "BUYER";
type SheetId = null | "write" | "region" | "notifications" | "status";

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

type SubPage =
  | null
  | { type: "product-detail"; id: string }
  | { type: "product-form"; editId?: string }
  | { type: "community-detail"; id: string }
  | { type: "community-form" }
  | { type: "chat-room"; id: string }
  | { type: "chat-room-list"; productId: string; productTitle: string }
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
  | { type: "apartment-verification" }
  | { type: "apartment-community"; apartmentName?: string }
  | { type: "search" }
  | { type: "region-search" };

type ProductListItem = {
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
};

type CommunityPost = {
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

type ChatRoom = {
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
};

type LocalBusiness = {
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

type DangerTone = "fire" | "accident" | "construction" | "failure" | "control" | "flood" | "default";

type DangerVisual = {
  label: string;
  emoji: string;
  tone: DangerTone;
};

type DonationFacility = {
  id: string;
  name: string;
  facilityType: string;
  neighborhoodName: string;
  lat: number;
  lng: number;
  donationCount: number;
  currentAmount: number;
  targetAmount: number;
};

type LocalCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  tone: string;
};

type IconItem = {
  label: string;
  icon: LucideIcon;
  tone?: string;
  onClick?: () => void;
};

const PRODUCT_FILTERS = ["전체", "중고차", "알바", "중고거래", "부동산", "기타 서비스"];
const COMMUNITY_TABS = ["전체", "자유 주제", "같이해요", "질문", "동네 정보"];
const COMMUNITY_FILTERS = ["추천", "인기", "취미/여가", "운동/스포츠", "맛집/음식", "동네친구", "일반"];
const CHAT_FILTERS = ["전체", "판매", "구매", "안읽음", "모임", "알바"];

type MapSearchBounds = { south: number; north: number; west: number; east: number };

type NaverMapInstance = {
  autoResize?: () => void;
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => {
    getSW: () => { lat: () => number; lng: () => number };
    getNE: () => { lat: () => number; lng: () => number };
  };
};

type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
  setIcon?: (icon: any) => void;
  setZIndex?: (zIndex: number) => void;
  getPosition?: () => { lat: () => number; lng: () => number };
};

type NaverMapsNamespace = {
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

const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
const NAVER_MAP_KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID ?? "";
const KAKAO_MAP_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  송파삼성래미안: { lat: 37.504744, lng: 127.118295 },
  위례: { lat: 37.4772, lng: 127.1437 },
  공릉: { lat: 37.6257, lng: 127.0731 },
  "당산 2동": { lat: 37.5351, lng: 126.9028 },
  문래동: { lat: 37.5177, lng: 126.8945 },
};
const NEIGHBORHOOD_DISTRICTS: Record<string, string> = {
  송파삼성래미안: "송파구",
  위례: "송파구",
  공릉: "노원구",
  "당산 2동": "영등포구",
  문래동: "영등포구",
};

type Region = { id: number; dongName: string; guName: string };

// "당산 2동"(목업 동네 이름) ↔ "당산제2동"(실제 크롤링 지역명) 처럼 띄어쓰기/"제" 표기가
// 달라서 그냥 문자열 비교로는 절대 안 맞음 — 둘 다 같은 형태로 접어서 비교.
function normalizeDongName(name: string) {
  return name.replace(/\s+/g, "").replace(/제(\d)/g, "$1");
}

// 목업 동네 4개 중 실제 시드 데이터(영등포구)와 겹치는 건 "문래동"·"당산 2동" 둘 —
// 나머지(위례/공릉)는 매칭되는 region이 아예 없어서 undefined를 반환하고, 호출 쪽에서
// region 필터 없이 전체 목록을 보여주는 걸로 폴백한다.
function matchRegionId(regions: Region[], neighborhoodName: string): number | undefined {
  const target = normalizeDongName(neighborhoodName);
  return regions.find((r) => normalizeDongName(r.dongName) === target)?.id;
}

const DANGER_VISUALS: Record<DangerTone, DangerVisual> = {
  fire: { label: "화재", emoji: "🔥", tone: "fire" },
  accident: { label: "사고", emoji: "⚠️", tone: "accident" },
  construction: { label: "공사", emoji: "🚧", tone: "construction" },
  failure: { label: "고장", emoji: "🔧", tone: "failure" },
  control: { label: "통제", emoji: "⛔", tone: "control" },
  flood: { label: "침수", emoji: "🌊", tone: "flood" },
  default: { label: "위험", emoji: "🚨", tone: "default" },
};

let naverMapScriptPromise: Promise<void> | null = null;

function loadNaverMapScript(keyId: string) {
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

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

type DangerSignalApiItem = {
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

type DangerSignalApiResponse = { items?: DangerSignalApiItem[] } | DangerSignalApiItem[];

function parseCoordinate(value: number | string | null | undefined) {
  const coordinate = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(coordinate) ? coordinate : null;
}

function formatObservedAt(value: string | null | undefined) {
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

function dangerToneForText(value: string) {
  if (/화재|불|연기/.test(value)) return "fire";
  if (/침수|호우|홍수|빗물|하천/.test(value)) return "flood";
  if (/통제|차단|금지|폐쇄/.test(value)) return "control";
  if (/고장|장애/.test(value)) return "failure";
  if (/공사|보수|작업/.test(value)) return "construction";
  if (/사고|추돌|전도|충돌/.test(value)) return "accident";
  return "default";
}

function getDangerVisual(business: Pick<LocalBusiness, "category" | "dangerTone" | "riskType" | "name" | "summary">) {
  if (business.category !== "danger") return null;
  const tone = business.dangerTone ?? dangerToneForText(`${business.riskType ?? ""} ${business.name} ${business.summary}`);
  return DANGER_VISUALS[tone] ?? DANGER_VISUALS.default;
}

function toDangerBusiness(item: DangerSignalApiItem): LocalBusiness | null {
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

function matchesNeighborhood(business: LocalBusiness, neighborhood: string) {
  const district = NEIGHBORHOOD_DISTRICTS[neighborhood];
  return business.neighborhoodName === neighborhood || Boolean(district && business.districtName === district);
}

function formatRestaurantDistance(distance?: string) {
  const meters = Number(distance);
  if (!Number.isFinite(meters) || meters <= 0) return "현 지도";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

function restaurantToLocalBusiness(
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

function matchesBusinessQuery(business: LocalBusiness, query: string) {
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

function matchesCongestionQuery(zone: CongestionZone, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return true;
  return (
    zone.name.includes(trimmedQuery) ||
    zone.summary.includes(trimmedQuery) ||
    zone.neighborhoodName.includes(trimmedQuery) ||
    zone.districtName.includes(trimmedQuery)
  );
}

function formatRelativeTime(iso: string) {
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

function toProductListItem(item: TradeProduct): ProductListItem {
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
    mine: false,
    // ponytail: 백엔드 상세 카테고리(예: "청소기")는 검색어로만 노출 — 목록 상단 탭 필터는
    // "중고거래"(이 API가 다루는 섹션 자체) 기준으로 매칭시킴
    description: item.description ?? (item.searchKeyword ? `연관 검색어: ${item.searchKeyword}` : ""),
    category: "중고거래",
  };
}

function toChatRoomUi(dto: ChatRoomDto): ChatRoom {
  return {
    id: String(dto.id),
    type: dto.type,
    tradeRole: dto.isSeller ? "SELLER" : "BUYER",
    title: dto.title,
    avatarTone: "product",
    lastMessage: dto.lastMessage ?? "",
    lastMessageAt: dto.lastMessageAt ? formatRelativeTime(dto.lastMessageAt) : "",
    unreadCount: dto.unreadCount,
    verified: dto.verified,
    muted: false,
    productId: dto.productId !== null ? String(dto.productId) : undefined,
  };
}

function toChatMessageUi(dto: ChatMessageDto, myUserId: number | undefined): { mine: boolean; text: string; time: string } {
  return {
    mine: dto.senderId === myUserId,
    text: dto.content,
    time: formatRelativeTime(dto.createdAt),
  };
}

const initialProducts: ProductListItem[] = [
  {
    id: "p1",
    title: "삼성 갤럭시 탭 A7 SM-T505N",
    thumbnailLabel: "A7",
    thumbnailTone: "tablet",
    neighborhoodName: "위례",
    distanceKm: 3,
    createdAt: "17시간 전",
    price: 50000,
    tradeStatus: "RESERVED",
    tradeType: "SALE",
    purchaseMode: "NORMAL",
    chatCount: 1,
    favoriteCount: 9,
    viewCount: 214,
    interestCount: 0,
    isFavorite: true,
    mine: false,
    category: "중고거래",
    description: "케이스와 충전 케이블 함께 드립니다. 생활 기스는 조금 있지만 화면과 배터리 상태는 양호합니다.",
  },
  {
    id: "p2",
    title: "갤럭시 탭 a7 라이트",
    thumbnailLabel: "TAB",
    thumbnailTone: "screen",
    neighborhoodName: "공릉",
    distanceKm: 2,
    createdAt: "2일 전",
    price: 100000,
    tradeStatus: "SALE",
    tradeType: "SALE",
    purchaseMode: "DIRECT",
    chatCount: 4,
    favoriteCount: 4,
    viewCount: 96,
    interestCount: 0,
    isFavorite: false,
    mine: false,
    category: "중고거래",
    description: "필름 부착 상태로 사용했습니다. 영상 감상용으로 좋아요. 직거래는 지하철역 근처를 선호합니다.",
  },
  {
    id: "p3",
    title: "버거킹 할인 쿠폰 무료나눔",
    thumbnailLabel: "쿠폰",
    thumbnailTone: "coupon",
    neighborhoodName: "당산 2동",
    distanceKm: 1,
    createdAt: "2일 전",
    price: null,
    tradeStatus: "SALE",
    tradeType: "FREE",
    chatCount: 5,
    favoriteCount: 0,
    viewCount: 58,
    interestCount: 0,
    isFavorite: false,
    mine: true,
    category: "기타 서비스",
    description: "오늘 안에 사용 가능한 쿠폰입니다. 필요하신 분께 채팅으로 전달드릴게요.",
  },
  {
    id: "p4",
    title: "(세차) 세린이 모여라",
    thumbnailLabel: "세차",
    thumbnailTone: "carwash",
    neighborhoodName: "위례",
    createdAt: "17시간 전",
    price: null,
    tradeStatus: "SALE",
    tradeType: "FREE",
    chatCount: 0,
    favoriteCount: 9,
    viewCount: 131,
    interestCount: 0,
    isFavorite: false,
    mine: false,
    category: "중고차",
    description: "동네 셀프세차장 같이 가실 분을 찾습니다. 초보 환영입니다.",
  },
  {
    id: "p5",
    title: "원목 사이드 테이블",
    thumbnailLabel: "테이블",
    thumbnailTone: "wood",
    neighborhoodName: "공릉",
    distanceKm: 1,
    createdAt: "방금 전",
    price: 28000,
    tradeStatus: "SALE",
    tradeType: "SALE",
    chatCount: 0,
    favoriteCount: 2,
    viewCount: 19,
    interestCount: 0,
    isFavorite: false,
    mine: true,
    category: "중고거래",
    description: "작은 흠집이 있어 저렴하게 올립니다. 엘리베이터 앞 거래 가능합니다.",
  },
];

const initialPosts: CommunityPost[] = [
  {
    id: "cpost1",
    categoryName: "일반",
    title: "이 사람 조심하세요",
    contentPreview: "별의별 사람이 다 있네요. 거래 전에 약속 장소와 시간을 꼭 확인해보세요.",
    thumbnailTone: "memo",
    thumbnailCount: 2,
    neighborhoodName: "위례",
    createdAt: "10분 전",
    viewCount: 139,
    commentCount: 0,
    reactionCount: 4,
  },
  {
    id: "cpost2",
    categoryName: "카페",
    title: "반년 전에 일했던 알바가 10만원 달라고 함",
    contentPreview: "신중하게 확인해야 할 일이 생겼어요. 비슷한 경험 있으신 분들 의견 부탁드려요.",
    thumbnailTone: "article",
    thumbnailCount: 1,
    neighborhoodName: "공릉",
    createdAt: "2시간 전",
    viewCount: 438,
    commentCount: 2,
    reactionCount: 12,
  },
  {
    id: "cpost3",
    categoryName: "동네친구",
    title: "영화 보러 갈 사람",
    contentPreview: "오디세이 보고 싶은데 친구가 없어요. 저 또래가 편해서 20대 환영해요.",
    neighborhoodName: "당산 2동",
    createdAt: "58분 전",
    viewCount: 72,
    commentCount: 0,
    reactionCount: 1,
  },
  {
    id: "cpost4",
    categoryName: "취미",
    title: "오늘 시간 되는 분",
    contentPreview: "동네 산책하고 커피 마실 분 있나요. 가볍게 이야기 나눌 수 있으면 좋아요.",
    neighborhoodName: "당산 2동",
    createdAt: "1시간 전",
    viewCount: 54,
    commentCount: 4,
    reactionCount: 9,
  },
];

const LOCAL_CATEGORIES: LocalCategory[] = [
  { id: "food", name: "음식점", icon: Utensils, tone: "orange" },
  { id: "congestion", name: "혼잡도 분석", icon: Footprints, tone: "cyan" },
  { id: "cafe", name: "카페", icon: Coffee, tone: "yellow" },
  { id: "takeout", name: "포장주문", icon: Utensils, tone: "amber" },
  { id: "danger", name: "위험", icon: ShieldAlert, tone: "rose" },
  { id: "sale", name: "할인중", icon: BadgePercent, tone: "orange" },
  { id: "workout", name: "운동", icon: Dumbbell, tone: "cyan" },
  { id: "lesson", name: "레슨/과외", icon: BookOpen, tone: "rose" },
  { id: "class", name: "클래스", icon: CakeSlice, tone: "amber" },
  { id: "academy", name: "학원", icon: GraduationCap, tone: "sky" },
  { id: "clean", name: "청소", icon: SprayCan, tone: "green" },
  { id: "delivery", name: "용달", icon: Truck, tone: "blue" },
];

const LOCAL_BUSINESSES: LocalBusiness[] = [
  {
    id: "danger1",
    name: "송파구 침수·집중호우 주의구역",
    category: "danger",
    neighborhoodName: "송파삼성래미안",
    distance: "120m",
    openNow: true,
    liked: false,
    summary: "실시간 재난안전: 하천변 발자국 및 보행 유의",
    lat: 37.5052,
    lng: 127.1188,
  },
  {
    id: "danger2",
    name: "공릉동 야간 통행 위험구역",
    category: "danger",
    neighborhoodName: "공릉",
    distance: "350m",
    openNow: true,
    liked: false,
    summary: "안전정보: 도로 가스배관 공사 중 (서행 필요)",
    lat: 37.6262,
    lng: 127.0741,
  },
  {
    id: "b1",
    name: "당산 2동 작은식탁",
    category: "food",
    neighborhoodName: "당산 2동",
    distance: "320m",
    openNow: true,
    liked: true,
    summary: "오늘 포장 주문 10% 할인",
    lat: 37.5351,
    lng: 126.9028,
  },
  {
    id: "b2",
    name: "위례 코드 과외",
    category: "lesson",
    neighborhoodName: "위례",
    distance: "850m",
    openNow: true,
    liked: false,
    summary: "초등부터 성인까지 1:1 수업",
    lat: 37.4775,
    lng: 127.1452,
  },
  {
    id: "b3",
    name: "공릉 클린홈",
    category: "clean",
    neighborhoodName: "공릉",
    distance: "1.1km",
    openNow: false,
    liked: false,
    summary: "입주 청소와 정기 청소 예약 가능",
    lat: 37.6257,
    lng: 127.0731,
  },
  {
    id: "b4",
    name: "위례 모닝카페",
    category: "cafe",
    neighborhoodName: "위례",
    distance: "540m",
    openNow: true,
    liked: true,
    summary: "아메리카노 테이크아웃 쿠폰 제공",
    lat: 37.4788,
    lng: 127.1418,
  },
  {
    id: "b5",
    name: "송파 래미안 픽업",
    category: "takeout",
    neighborhoodName: "송파삼성래미안",
    distance: "120m",
    openNow: true,
    liked: false,
    summary: "단지 근처 포장 주문 가능",
    lat: 37.5051,
    lng: 127.1187,
  },
];

const DREAM_FACILITIES: DonationFacility[] = [
  {
    id: "df1",
    name: "송파 아동복지센터",
    facilityType: "아동복지센터",
    neighborhoodName: "송파삼성래미안",
    lat: 37.5063,
    lng: 127.1198,
    donationCount: 5,
    currentAmount: 384000,
    targetAmount: 600000,
  },
  {
    id: "df2",
    name: "송파 발달지원센터",
    facilityType: "발달장애센터",
    neighborhoodName: "송파삼성래미안",
    lat: 37.5036,
    lng: 127.1166,
    donationCount: 2,
    currentAmount: 216000,
    targetAmount: 500000,
  },
];

const baseMessages = [
  { mine: false, text: "안녕하세요. 아직 거래 가능할까요?", time: "오후 5:11" },
  { mine: true, text: "네 가능해요. 오늘 저녁에도 괜찮습니다.", time: "오후 5:14" },
  { mine: false, text: "그럼 7시에 위례 주민센터 앞에서 뵐게요.", time: "오후 5:18" },
];

type ThemeMode = "dark" | "light";
const THEME_STORAGE_KEY = "carrot-theme";
let sessionTheme: ThemeMode = "dark";

function readTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Retain the in-memory selection when browser storage is unavailable.
  }
  return sessionTheme;
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("carrot-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("carrot-theme-change", onChange);
  };
}


const ALBA_MOCK_DATA: AlbaItem[] = [
  {
    id: "alba-1",
    title: "[무신사스탠다드] 명동중앙점 풀타임 스태프 채용",
    companyName: "무신사 스탠다드 명동중앙점",
    neighborhoodName: "중구 충무로1가",
    detailLocation: "명동역 6번 출구 도보 2분",
    payType: "연봉",
    payAmount: 27600000,
    payLabel: "연봉 2,760만원",
    workingDays: "주 5일 (스케줄 근무)",
    workingHours: "09:30 ~ 19:30 (휴게 1시간)",
    category: "이웃알바",
    badges: ["정직원", "모범구인"],
    reviewCount: 4,
    thumbnailTone: "musinsa",
    thumbnailEmoji: "🏢",
    bgGradient: "linear-gradient(135deg, #1c1d22 0%, #363942 100%)",
    descriptionBullets: [
      "1. 매장 상품 진열 및 고객 응대",
      "2. 피팅룸 안내 및 재고 관리",
      "3. 4대보험, 퇴직금, 유니폼 지원",
      "4. 무신사 패밀리 임직원 할인 혜택"
    ],
    details: "트렌디한 패션 브랜드 무신사 스탠다드 명동점에서 함께할 열정적인 스태프를 모십니다. 패션에 관심이 많고 친절한 분들의 많은 지원 바랍니다!",
    applicantCount: 8,
    viewCount: 412,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "02-1544-7199",
    isAd: true,
    createdAt: "방금 전",
  },
  {
    id: "alba-2",
    title: "명동뷰티매장 질서유지 및 고객응대",
    companyName: "휴먼코드",
    neighborhoodName: "중구 충무로1가",
    detailLocation: "명동역 6번출구 도보 1분거리 올리브영 명동본점",
    payType: "일급",
    payAmount: 65000,
    payLabel: "일급 65,000원",
    workingDays: "월~금",
    workingHours: "18:00 ~ 22:30",
    category: "단기알바",
    badges: ["후기 1"],
    reviewCount: 1,
    thumbnailTone: "oliveyoung",
    thumbnailEmoji: "💄",
    bgGradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
    descriptionBullets: [
      "1. 대기줄 및 매장 질서유지",
      "2. 고객 응대지원",
      "3. 휴게시간 30분 제공",
      "4. 상시 근무 및 당일/익일 지급 가능"
    ],
    details: "명동 중심 뷰티 매장에서 저녁 시간대 고객 질서유지 및 동선 안내를 도와주실 친절한 이웃 알바님을 구합니다. 초보자도 바로 가능합니다!",
    applicantCount: 12,
    viewCount: 520,
    isFavorite: true,
    hasApplied: false,
    phoneContact: "010-8921-4321",
    isAd: true,
    createdAt: "10분 전",
  },
  {
    id: "alba-3",
    title: "[무신사스토어] 대림창고 성수 주말 피킹/물류 스태프",
    companyName: "무신사 스토어 성수점",
    neighborhoodName: "성동구 성수동2가",
    detailLocation: "성수역 3번 출구 인근",
    payType: "시급",
    payAmount: 12384,
    payLabel: "시급 12,384원",
    workingDays: "주말 (토, 일)",
    workingHours: "11:00 ~ 20:00",
    category: "걸어서10분",
    badges: ["모범구인"],
    thumbnailTone: "musinsa_dark",
    thumbnailEmoji: "📦",
    bgGradient: "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
    descriptionBullets: [
      "1. 입출고 상품 분류 및 피킹",
      "2. 쾌적한 실내 창고 환경",
      "3. 주휴수당 별도 지급, 식대 지원"
    ],
    details: "성수동 핫플레이스 무신사스토어 대림창고에서 주말 동안 활기차게 함께 일할 파트타이머를 모집합니다.",
    applicantCount: 15,
    viewCount: 680,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "02-6959-1122",
    createdAt: "30분 전",
  },
  {
    id: "alba-4",
    title: "홀서빙 가족 구합니다 (초보 환영)",
    companyName: "진주꽃돼지",
    neighborhoodName: "용산구 한남동",
    detailLocation: "순천향대병원 앞 먹자골목",
    payType: "월급",
    payAmount: 3400000,
    payLabel: "월급 340만원",
    workingDays: "주 5일",
    workingHours: "16:00 ~ 02:00",
    category: "식당/카페",
    badges: ["정직원", "후기 18"],
    reviewCount: 18,
    thumbnailTone: "bbq",
    thumbnailEmoji: "🥩",
    bgGradient: "linear-gradient(135deg, #842323 0%, #d32f2f 100%)",
    descriptionBullets: [
      "1. 숯불구이 전문점 홀 서빙 및 테이블 정리",
      "2. 맛있는 저녁 식사 제공",
      "3. 팁 및 성과급 추가 지급"
    ],
    details: "동네에서 오랫동안 사랑받는 고깃집입니다. 가족처럼 편안한 분위기에서 서로 도우며 근무하실 성실한 분 환영합니다!",
    applicantCount: 6,
    viewCount: 340,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "010-3342-9988",
    createdAt: "1시간 전",
  },
  {
    id: "alba-5",
    title: "[자라] 명동 눈스퀘어점 풀타임 어드바이저 채용",
    companyName: "인디텍스코리아 자라",
    neighborhoodName: "중구 명동2가",
    detailLocation: "을지로입구역 6번 출구 연결",
    payType: "연봉",
    payAmount: 30980000,
    payLabel: "연봉 3,098만원",
    workingDays: "주 5일 (스케줄)",
    workingHours: "09:00 ~ 18:30",
    category: "이웃알바",
    badges: ["모범구인", "후기 10"],
    reviewCount: 10,
    thumbnailTone: "zara",
    thumbnailEmoji: "👗",
    bgGradient: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
    descriptionBullets: [
      "1. 글로벌 SPA 브랜드 자라 고객 어드바이징",
      "2. 디스플레이 및 매장 운영 관리",
      "3. 인센티브 및 글로벌 교육 프로그램"
    ],
    details: "글로벌 패션 그룹 인디텍스 자라에서 패션 리더로 성장할 스태프를 채용합니다.",
    applicantCount: 19,
    viewCount: 890,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "02-3783-5000",
    createdAt: "2시간 전",
  },
  {
    id: "alba-6",
    title: "디저트 전문점 카페 주5일 바리스타/스태프 모집",
    companyName: "AVA 아바",
    neighborhoodName: "성동구 성수동1가",
    detailLocation: "서울숲역 5번 출구 도보 3분",
    payType: "시급",
    payAmount: 13500,
    payLabel: "시급 13,500원",
    workingDays: "주 5일",
    workingHours: "10:00 ~ 18:00",
    category: "식당/카페",
    badges: ["모범구인", "후기 37"],
    reviewCount: 37,
    thumbnailTone: "cafe",
    thumbnailEmoji: "☕",
    bgGradient: "linear-gradient(135deg, #4b3832 0%, #854442 100%)",
    descriptionBullets: [
      "1. 스페셜티 커피 추출 및 음료 제조",
      "2. 디저트 플레이팅 및 카운터 포스 응대",
      "3. 쾌적하고 감성적인 인테리어 근무환경"
    ],
    details: "디저트와 스페셜티 커피를 사랑하는 분들의 지원을 기다립니다. 초보자도 꼼꼼한 레시피 교육 후 바로 근무 가능합니다.",
    applicantCount: 24,
    viewCount: 1040,
    isFavorite: true,
    hasApplied: true,
    phoneContact: "010-4491-0102",
    createdAt: "3시간 전",
  },
  {
    id: "alba-7",
    title: "논현 세차원 구합니다 (초보 환영, 단기 가능)",
    companyName: "텐미닛워시",
    neighborhoodName: "강남구 논현동",
    detailLocation: "학동역 1번 출구 도보 5분",
    payType: "시급",
    payAmount: 12000,
    payLabel: "시급 12,000원",
    workingDays: "협의 가능 (주 3~5일)",
    workingHours: "09:00 ~ 18:00",
    category: "물류/현장",
    badges: ["단기", "초보가능"],
    thumbnailTone: "carwash",
    thumbnailEmoji: "🚗",
    bgGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    descriptionBullets: [
      "1. 실내외 프리미엄 디테일링 세차 보조",
      "2. 장비 사용법 1대1 맞춤 교육",
      "3. 간식 및 식사 제공"
    ],
    details: "손세차 보조 인원을 충원합니다. 땀 흘린 만큼 보람 있는 작업이며 밝고 활기찬 분위기입니다.",
    applicantCount: 4,
    viewCount: 220,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "010-9988-1234",
    createdAt: "4시간 전",
  },
  {
    id: "alba-8",
    title: "[5년연속 미슐랭] 이태원 우육미엔 홀/주방 직원",
    companyName: "우육미엔",
    neighborhoodName: "용산구 이태원동",
    detailLocation: "한강진역 1번 출구 도보 4분",
    payType: "월급",
    payAmount: 2800000,
    payLabel: "월급 280만원",
    workingDays: "주 5일 (화요일 정기휴무)",
    workingHours: "10:30 ~ 21:30 (브레이크타임 2시간)",
    category: "식당/카페",
    badges: ["정직원", "후기 1"],
    reviewCount: 1,
    thumbnailTone: "noodle",
    thumbnailEmoji: "🍜",
    bgGradient: "linear-gradient(135deg, #e52d27 0%, #b31217 100%)",
    descriptionBullets: [
      "1. 미슐랭 빕구르망 선정 대만식 우육면 전문점",
      "2. 홀 서빙 및 주방 보조",
      "3. 4대보험, 퇴직금, 유니폼 제공"
    ],
    details: "정통 대만 요리를 선보이는 우육미엔에서 성실하고 책임감 있는 팀원을 모십니다.",
    applicantCount: 7,
    viewCount: 450,
    isFavorite: false,
    hasApplied: false,
    phoneContact: "02-798-5556",
    createdAt: "5시간 전",
  }
];

export default function GajiMarketApp() {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as ThemeMode);

  function handleLogout() {
    logoutRequest().finally(() => router.replace("/onboarding"));
  }

  function changeTheme(value: ThemeMode) {
    sessionTheme = value;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Keep the selection usable for this session when persistence is blocked.
    }
    window.dispatchEvent(new Event("carrot-theme-change"));
  }

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [myProducts, setMyProducts] = useState<ProductListItem[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductListItem[]>([]);

  // 로그인된 상태면 내 닉네임/프사를 받아온다 — 비로그인(게스트)이면 조용히 무시하고
  // 기존 플레이스홀더("주황가지님")를 그대로 보여준다.
  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => {});
  }, []);

  // 판매내역/찜 목록은 일반 목록(products)을 mine/isFavorite로 거르는 방식으로는
  // 못 만든다 — 그 두 값이 실서버 데이터에 대해 항상 false라 새로고침(새 세션)마다
  // 빈 목록이 됐었다(버그). 서버가 이미 created_by/찜 여부로 걸러주는 전용
  // 엔드포인트를 그대로 쓴다.
  useEffect(() => {
    // me는 로그아웃 전환 없이 null -> 값으로만 바뀌므로(로그아웃은 페이지 리로드),
    // 로그인 전 상태는 그냥 초기값([])을 쓰면 된다 — 여기서 다시 비울 필요 없음.
    if (!me) return;
    const controller = new AbortController();
    getMyProducts(controller.signal)
      .then((page) => setMyProducts(page.items.map((item) => ({ ...toProductListItem(item), mine: true }))))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("판매내역을 불러오지 못했습니다.", error);
      });
    getMyFavorites(controller.signal)
      .then((page) =>
        setFavoriteProducts(page.items.map((item) => ({ ...toProductListItem(item), isFavorite: true }))),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("찜 목록을 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [me]);

  const [activeNeighborhood, setActiveNeighborhood] = useState("문래동");
  const [secondaryNeighborhood, setSecondaryNeighborhood] = useState("공릉");
  // "내 동네 설정" 화면에서 X 눌러 뺀 슬롯이 primary인지 secondary인지 — 항상 두 슬롯 다
  // 채워져 있어야(빈 문자열이면 곳곳에서 쓰는 NEIGHBORHOOD_COORDS[secondaryNeighborhood] 등이
  // 깨짐) X는 "빈 슬롯"이 아니라 "검색해서 바로 교체"로 이어진다.
  const [regionSearchTarget, setRegionSearchTarget] = useState<"primary" | "secondary">("secondary");
  const [recentNeighborhoods, setRecentNeighborhoods] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function pickNeighborhood(dongName: string, target: "primary" | "secondary") {
    if (target === "primary") {
      setSecondaryNeighborhood(activeNeighborhood === dongName ? secondaryNeighborhood : activeNeighborhood);
      setActiveNeighborhood(dongName);
    } else {
      setSecondaryNeighborhood(dongName);
    }
    setRecentNeighborhoods((current) => [dongName, ...current.filter((n) => n !== dongName)].slice(0, 5));
    setToastMessage(`동네를 '${dongName}'으로 변경했어요.`);
    setSheet(null);
    setSubPage(null);
  }
  const [productFilter, setProductFilter] = useState("전체");
  const [communityTab, setCommunityTab] = useState("동네생활");
  const [communityFilter, setCommunityFilter] = useState("추천");
  const [chatFilter, setChatFilter] = useState("전체");
  const [mapCategory, setMapCategory] = useState<string>("food");
  const [mapSheetState, setMapSheetState] = useState<"collapsed" | "half" | "expanded">("half");
  const [mapQuery, setMapQuery] = useState("");
  const [mapSearchArea, setMapSearchArea] = useState<{ neighborhood: string; bounds: MapSearchBounds } | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [productsTotal, setProductsTotal] = useState(initialProducts.length);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const productPageRef = useRef(1);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [albaList, setAlbaList] = useState<AlbaItem[]>(ALBA_MOCK_DATA);
  const [dangerSignals, setDangerSignals] = useState<LocalBusiness[]>([]);
  const [dangerSignalsLoaded, setDangerSignalsLoaded] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [roomMessages, setRoomMessages] = useState<Record<string, typeof baseMessages>>({});
  // 차단/신고엔 상대방 user id가 필요한데 채팅방 응답엔 없어서, 메시지에 실려오는
  // sender_id로부터 알아낸다 — 아직 메시지가 하나도 없으면 모르는 채로 남는다.
  const [roomOtherUserId, setRoomOtherUserId] = useState<Record<string, number>>({});
  const [isBooting, setIsBooting] = useState(true);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  // 찜 API가 401(로그인 필요)을 돌려줬을 때만 true — isGuestMode 스위치와 별개로,
  // 지금은 실제 로그인 세션이 없어서 찜을 시도하면 항상 여기로 떨어진다.
  const [authRequired, setAuthRequired] = useState(false);
  const [verifiedApartment, setVerifiedApartment] = useState<string | null>(null);

  const openApartmentFlow = useCallback(() => {
    if (verifiedApartment) {
      setSubPage({ type: "apartment-community", apartmentName: verifiedApartment });
    } else {
      setSubPage({ type: "apartment-verification" });
    }
  }, [verifiedApartment]);

  // 채팅방 목록. 로그인 전엔 서버가 401을 주므로 me가 로드된 뒤에만 시도한다.
  useEffect(() => {
    if (!me) return;
    const controller = new AbortController();
    listChatRooms(controller.signal)
      .then((page) => setChats(page.items.map(toChatRoomUi)))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("채팅 목록을 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [me]);

  function recordOtherUserId(chatId: string, items: ChatMessageDto[]) {
    const other = items.find((m) => m.senderId !== me?.id);
    if (!other) return;
    setRoomOtherUserId((current) => (current[chatId] ? current : { ...current, [chatId]: other.senderId }));
  }

  // 채팅방을 보고 있는 동안엔 몇 초마다 다시 불러와서 상대방 메시지를 반영한다
  // (웹소켓 없이 폴링으로 처리 — ponytail: 트래픽 커지면 그때 웹소켓 도입 고려).
  useEffect(() => {
    if (subPage?.type !== "chat-room") return;
    const chatId = subPage.id;
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    const interval = window.setInterval(() => {
      listChatMessages(numericId)
        .then((page) => {
          setRoomMessages((current) => ({
            ...current,
            [chatId]: page.items.map((m) => toChatMessageUi(m, me?.id)),
          }));
          recordOtherUserId(chatId, page.items);
        })
        .catch(() => {});
    }, 3000);
    return () => window.clearInterval(interval);
  }, [subPage, me?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function syncTabFromHash() {
      if (window.location.hash === "#map" || window.location.hash === "#map-pointers") {
        setActiveTab("map");
        setSubPage(null);
        setMapCategory("danger");
        setMapSheetState(window.location.hash === "#map-pointers" ? "half" : "expanded");
      } else if (window.location.hash === "#dream") {
        setActiveTab("my");
        setSubPage({ type: "dream-dashboard" });
      }
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/v1/local/danger-signals?limit=120"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("danger signals failed");
        return response.json() as Promise<DangerSignalApiResponse>;
      })
      .then((payload) => {
        const items = Array.isArray(payload) ? payload : payload.items ?? [];
        setDangerSignals(items.map(toDangerBusiness).filter((item): item is LocalBusiness => Boolean(item)));
        setDangerSignalsLoaded(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDangerSignalsLoaded(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/v1/local/regions"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("regions failed");
        return response.json() as Promise<{ items: { id: number; dong_name: string; gu_name: string }[] }>;
      })
      .then((payload) => {
        setRegions(payload.items.map((r) => ({ id: r.id, dongName: r.dong_name, guName: r.gu_name })));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // 실패하면 동네 필터 없이(전체 목록) 동작 — 아래 regionId가 계속 undefined로 남음
      });
    return () => controller.abort();
  }, []);

  // 지금 시드 데이터(영등포구)와 실제로 겹치는 목업 동네는 "당산 2동"뿐 — matchRegionId 주석 참고.
  const regionId = useMemo(() => matchRegionId(regions, activeNeighborhood), [regions, activeNeighborhood]);
  const regionsLoaded = regions.length > 0;
  // regions는 로딩됐는데 이 동네만 매칭이 안 되는 경우(위례/공릉/송파삼성래미안 등) —
  // 그 동네엔 실제로 상품이 하나도 없다는 뜻이라 전체 목록으로 대충 채우지 않고 빈 목록으로 둔다.
  const noRegionMatch = regionsLoaded && regionId === undefined;

  // 백엔드는 user.region_id가 없으면 글쓰기(상품 등록 등)를 400으로 막는다 — 화면에서
  // 고른 동네가 바뀔 때마다(최초 로그인 포함) 서버 쪽 활동동네도 같이 맞춰준다.
  useEffect(() => {
    if (!me || regionId === undefined || me.region?.id === regionId) return;
    updateRegion(regionId)
      .then(setMe)
      .catch((error: unknown) => console.error("활동동네를 저장하지 못했습니다.", error));
  }, [me, regionId]);

  useEffect(() => {
    if (!regionsLoaded) return; // region 목록 오기 전엔 아직 필터를 확정할 수 없어 대기(부팅 스켈레톤이 가려줌)
    productPageRef.current = 1;
    if (noRegionMatch) {
      setProducts([]);
      setProductsTotal(0);
      return;
    }
    const controller = new AbortController();
    listProducts({ page: 1, size: 60, regionId }, controller.signal)
      .then((page) => {
        setProducts(page.items.map(toProductListItem));
        setProductsTotal(page.total);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // 실패하면 mock 목록을 그대로 둔다 (화면이 빈 채로 남지 않도록)
        console.error("상품 목록을 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [regionsLoaded, noRegionMatch, regionId]);

  // 무한스크롤: 홈 피드 바닥에 닿으면 다음 페이지를 이어붙인다.
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMoreProducts || products.length >= productsTotal) return;
    setIsLoadingMoreProducts(true);
    const nextPage = productPageRef.current + 1;
    listProducts({ page: nextPage, size: 60, regionId })
      .then((page) => {
        productPageRef.current = nextPage;
        setProducts((prev) => [...prev, ...page.items.map(toProductListItem)]);
        setProductsTotal(page.total);
      })
      .catch((error: unknown) => {
        console.error("추가 상품을 불러오지 못했습니다.", error);
      })
      .finally(() => setIsLoadingMoreProducts(false));
  }, [isLoadingMoreProducts, products.length, productsTotal, regionId]);

  // 목록 API는 description/tradePlace/판매자 정보가 없어서 상세보기 진입 시 상세 API로 채워 넣음.
  useEffect(() => {
    if (subPage?.type !== "product-detail") return;
    const id = Number(subPage.id);
    if (!Number.isFinite(id)) return;
    const controller = new AbortController();
    getProduct(id, controller.signal)
      .then((detail) => {
        const fill = (p: ProductListItem) =>
          p.id === subPage.id
            ? {
                ...p,
                description: detail.description ?? p.description,
                tradePlace: detail.tradePlace,
                sellerNickname: detail.sellerNickname,
                sellerMannerTemp: detail.sellerMannerTemp,
              }
            : p;
        // selectedProduct는 products/myProducts/favoriteProducts 중 어디서 찾았는지에
        // 따라 달라지므로(위 selectedProduct 주석 참고), 셋 다 같이 채워줘야 한다.
        setProducts((prev) => prev.map(fill));
        setMyProducts((prev) => prev.map(fill));
        setFavoriteProducts((prev) => prev.map(fill));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("상품 상세를 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [subPage]);

  const totalUnread = useMemo(
    () => chats.reduce((sum, chat) => sum + chat.unreadCount, 0),
    [chats],
  );

  const filteredProducts = useMemo(() => {
    if (hasNetworkError) {
      return [];
    }
    return products.filter((product) => {
      // ponytail: 실거래 API엔 동네 검색/지역ID 조회 엔드포인트가 아직 없어서
      // activeNeighborhood로 실서버 데이터를 거를 방법이 없음 — 백엔드에 지역 조회가
      // 생기면 여기서 region_id로 서버 필터링하도록 바꾸기
      // 판매중/예약중/거래완료 전부 홈 피드에 그대로 노출한다(상태로 숨기지 않음).
      return productFilter === "전체" || product.category === productFilter;
    });
  }, [hasNetworkError, productFilter, products]);

  const filteredPosts = useMemo(() => {
    const scopedPosts = posts.filter(
      (post) =>
        post.neighborhoodName === activeNeighborhood || post.neighborhoodName === secondaryNeighborhood,
    );
    if (communityFilter === "추천") {
      return scopedPosts;
    }
    if (communityFilter === "인기") {
      return [...scopedPosts].sort((a, b) => b.viewCount - a.viewCount);
    }
    return scopedPosts.filter((post) => post.categoryName === communityFilter.replace("취미/여가", "취미"));
  }, [activeNeighborhood, communityFilter, posts, secondaryNeighborhood]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (chatFilter === "전체") return true;
      if (chatFilter === "판매") return chat.tradeRole === "SELLER";
      if (chatFilter === "구매") return chat.tradeRole === "BUYER";
      if (chatFilter === "안읽음") return chat.unreadCount > 0;
      if (chatFilter === "모임") return chat.type === "GROUP";
      if (chatFilter === "알바") return chat.title.includes("알바");
      return true;
    });
  }, [chatFilter, chats]);

  const localBusinesses = useMemo(() => {
    const staticBusinesses = dangerSignalsLoaded
      ? LOCAL_BUSINESSES.filter((business) => business.category !== "danger")
      : LOCAL_BUSINESSES;
    return [...dangerSignals, ...staticBusinesses];
  }, [dangerSignals, dangerSignalsLoaded]);

  const businesses = useMemo(() => {
    const bounds = mapSearchArea?.neighborhood === activeNeighborhood ? mapSearchArea.bounds : null;
    return localBusinesses.filter((business) => {
      const matchesCategory = business.category === mapCategory;
      const matchesRegion = bounds
        ? business.lat >= bounds.south && business.lat <= bounds.north &&
          business.lng >= bounds.west && business.lng <= bounds.east
        : matchesNeighborhood(business, activeNeighborhood) ||
          matchesNeighborhood(business, secondaryNeighborhood);
      const matchesQuery =
        mapQuery.trim().length === 0 ||
        business.name.includes(mapQuery.trim()) ||
        business.summary.includes(mapQuery.trim()) ||
        business.neighborhoodName.includes(mapQuery.trim()) ||
        (business.districtName?.includes(mapQuery.trim()) ?? false) ||
        (business.riskType?.includes(mapQuery.trim()) ?? false);
      return matchesCategory && matchesRegion && matchesQuery;
    });
  }, [activeNeighborhood, localBusinesses, mapCategory, mapQuery, secondaryNeighborhood, mapSearchArea]);

  const [togetherPosts, setTogetherPosts] = useState<TogetherPost[]>(() => getTogetherPosts("all"));
  const [togetherCategoryFilter, setTogetherCategoryFilter] = useState<TogetherCategory | "all">("all");

  const filteredTogetherPosts = useMemo(() => {
    if (togetherCategoryFilter === "all") return togetherPosts;
    return togetherPosts.filter((p) => p.category === togetherCategoryFilter);
  }, [togetherPosts, togetherCategoryFilter]);

  function navigateTab(tab: TabId) {
    setActiveTab(tab);
    setSubPage(null);
    setSheet(null);
    if (tab === "map") {
      setMapSheetState("half");
    }
    window.requestAnimationFrame(() => {
      document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function openRealEstate() {
    setSubPage({ type: "real-estate" });
    window.requestAnimationFrame(() => {
      document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function goBack() {
    if (
      subPage?.type === "settings" ||
      subPage?.type === "my-menu" ||
      subPage?.type === "dream-dashboard" ||
      subPage?.type === "dream-notice" ||
      subPage?.type === "alba" ||
      subPage?.type === "alba-form" ||
      subPage?.type === "sales" ||
      subPage?.type === "favorites"
    ) {
      setActiveTab("my");
      setSubPage(null);
      return;
    }
    if (subPage?.type === "alba-detail") {
      setSubPage({ type: "alba" });
      return;
    }
    if (subPage?.type === "together-category") {
      setSubPage({ type: "together-intro" });
      return;
    }
    if (subPage?.type === "together-form") {
      setSubPage({ type: "together-category" });
      return;
    }
    if (subPage?.type === "together-detail") {
      setSubPage(null);
      return;
    }
    if (subPage?.type === "together-intro") {
      setSubPage(null);
      return;
    }
    if (subPage?.type === "chat-room-list") {
      setSubPage({ type: "product-detail", id: subPage.productId });
      return;
    }
    setSubPage(null);
  }

  function handleSubmitTogether(input: CreateTogetherPostInput) {
    const created = createTogetherPost(input);
    setTogetherPosts(getTogetherPosts("all"));
    setSubPage({ type: "together-detail", id: created.id });
  }

  function handleToggleTogetherJoin(postId: string) {
    const res = toggleTogetherJoin(postId);
    if (res.success) {
      setTogetherPosts(getTogetherPosts("all"));
    }
  }

  function toggleFavorite(productId: string) {
    if (isGuestMode) {
      setSheet("status");
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const nextFavorited = !product.isFavorite;

    // 즉각 반응하도록 먼저 로컬로 반영 — 실서버 응답 오면 그 값으로 덮어쓰고,
    // 실패하면 되돌린다.
    setProducts((current) =>
      current.map((p) =>
        p.id === productId
          ? { ...p, isFavorite: nextFavorited, favoriteCount: p.favoriteCount + (nextFavorited ? 1 : -1) }
          : p,
      ),
    );

    const numericId = Number(productId);
    if (!Number.isFinite(numericId)) return; // mock 상품("p1" 등)은 서버에 없어서 로컬 토글로 끝

    setFavorite(numericId, nextFavorited)
      .then(({ favorited, favoriteCount }) => {
        setProducts((current) =>
          current.map((p) => (p.id === productId ? { ...p, isFavorite: favorited, favoriteCount } : p)),
        );
        // 찜 목록 화면도 같이 맞춘다 — 서버에서 다시 안 받아와도 바로 반영되게.
        setFavoriteProducts((current) =>
          favorited
            ? [{ ...product, isFavorite: true, favoriteCount }, ...current.filter((p) => p.id !== productId)]
            : current.filter((p) => p.id !== productId),
        );
      })
      .catch((error: unknown) => {
        setProducts((current) =>
          current.map((p) =>
            p.id === productId
              ? { ...p, isFavorite: !nextFavorited, favoriteCount: p.favoriteCount + (nextFavorited ? -1 : 1) }
              : p,
          ),
        );
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("찜 상태를 바꾸지 못했습니다.", error);
        }
      });
  }

  function updateProductStatus(productId: string, tradeStatus: TradeStatus) {
    setProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, tradeStatus } : product)),
    );
  }

  function markChatRead(chatId: string) {
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
    );
  }

  function openChat(chatId: string) {
    markChatRead(chatId);
    setSubPage({ type: "chat-room", id: chatId });
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    listChatMessages(numericId)
      .then((page) => {
        setRoomMessages((current) => ({ ...current, [chatId]: page.items.map((m) => toChatMessageUi(m, me?.id)) }));
        recordOtherUserId(chatId, page.items);
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("메시지를 불러오지 못했습니다.", error);
        }
      });
  }

  function submitMessage(event: FormEvent<HTMLFormElement>, chatId: string) {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text) return;
    setMessageDraft("");

    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    sendChatMessage(numericId, text)
      .then((message) => {
        setRoomMessages((current) => ({
          ...current,
          [chatId]: [...(current[chatId] ?? []), toChatMessageUi(message, me?.id)],
        }));
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId ? { ...chat, lastMessage: text, lastMessageAt: "방금 전" } : chat,
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("메시지를 보내지 못했습니다.", error);
        }
      });
  }

  function leaveChat(chatId: string) {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    leaveChatRoomRequest(numericId)
      .then(() => {
        setChats((current) => current.filter((chat) => chat.id !== chatId));
        goBack();
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("채팅방을 나가지 못했습니다.", error);
          alert("채팅방을 나가지 못했습니다.");
        }
      });
  }

  function updateChatStatus(chatId: string, tradeStatus: ChatTradeStatus) {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    updateChatTradeStatus(numericId, tradeStatus)
      .then((message) => {
        setRoomMessages((current) => ({
          ...current,
          [chatId]: [...(current[chatId] ?? []), toChatMessageUi(message, me?.id)],
        }));
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId ? { ...chat, lastMessage: message.content, lastMessageAt: "방금 전" } : chat,
          ),
        );
        // 채팅방에 걸린 상품 상태도 같이 반영 — 목록/판매내역/상세 화면 전부 동일 값을 보게.
        const room = chats.find((chat) => chat.id === chatId);
        if (room?.productId) {
          setProducts((prev) => prev.map((p) => (p.id === room.productId ? { ...p, tradeStatus } : p)));
          setMyProducts((prev) => prev.map((p) => (p.id === room.productId ? { ...p, tradeStatus } : p)));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("거래상태를 변경하지 못했습니다.", error);
          alert("거래상태를 변경하지 못했습니다.");
        }
      });
  }

  function blockChatPartner(userId: number) {
    blockUser(userId)
      .then(() => alert("차단했습니다. 이제 이 사람과는 채팅을 주고받을 수 없어요."))
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("차단하지 못했습니다.", error);
          alert("차단하지 못했습니다.");
        }
      });
  }

  function reportChatPartner(userId: number, reason: string) {
    reportUser({ targetType: "USER", targetId: userId, reason })
      .then(() => alert(`신고가 접수되었습니다. (${reason})\n운영팀에서 확인 후 처리하겠습니다.`))
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
        } else {
          console.error("신고 접수에 실패했습니다.", error);
          alert("신고 접수에 실패했습니다.");
        }
      });
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "중고거래");
    const isFree = form.get("free") === "on";
    const price = Number(form.get("price") ?? 0);

    if (isGuestMode) {
      setSheet("status");
      return;
    }

    createProduct({
      title,
      category,
      description,
      desiredPrice: isFree ? null : Math.max(0, price),
      tradeType: isFree ? "FREE" : "SALE",
    })
      .then(({ id }) => {
        const newProduct: ProductListItem = {
          id: String(id),
          title,
          thumbnailLabel: title.slice(0, 2),
          thumbnailTone: "mine",
          neighborhoodName: activeNeighborhood,
          distanceKm: 0,
          createdAt: "방금 전",
          price: isFree ? null : Math.max(0, price),
          tradeStatus: "SALE",
          tradeType: isFree ? "FREE" : "SALE",
          purchaseMode: "NORMAL",
          chatCount: 0,
          favoriteCount: 0,
          viewCount: 0,
          interestCount: 0,
          isFavorite: false,
          mine: true,
          category,
          description,
        };

        setProducts((current) => [newProduct, ...current]);
        // 판매내역 화면은 이제 서버 전용 목록(myProducts state)을 보므로 방금 올린
        // 글도 새로고침 없이 바로 보이게 여기도 같이 반영.
        setMyProducts((current) => [newProduct, ...current]);
        setActiveTab("my");
        setSubPage({ type: "sales" });
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
        } else {
          console.error("글을 등록하지 못했습니다.", error);
        }
        setSheet("status");
      });
  }

  function submitCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const category = String(form.get("category") ?? "일반");

    const post: CommunityPost = {
      id: `cpost${Date.now()}`,
      categoryName: category,
      title,
      contentPreview: content,
      neighborhoodName: activeNeighborhood,
      createdAt: "방금 전",
      viewCount: 0,
      commentCount: 0,
      reactionCount: 0,
    };

    setPosts((current) => [post, ...current]);
    setActiveTab("community");
    setSubPage(null);
  }

  
  function toggleAlbaFavorite(id: string) {
    setAlbaList((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }

  function handleApplyAlba(id: string) {
    setAlbaList((current) =>
      current.map((item) =>
        item.id === id ? { ...item, hasApplied: true, applicantCount: item.applicantCount + 1 } : item
      )
    );
    alert("지원서가 성공적으로 접수되었습니다! 💜\n담당자가 확인 후 연락드릴 예정입니다.");
  }

  function handleCreateAlba(newItem: Omit<AlbaItem, "id" | "applicantCount" | "viewCount" | "isFavorite" | "hasApplied" | "createdAt">) {
    const created: AlbaItem = {
      ...newItem,
      id: `alba-${Date.now()}`,
      applicantCount: 0,
      viewCount: 1,
      isFavorite: false,
      hasApplied: false,
      createdAt: "방금 전",
    };
    setAlbaList((current) => [created, ...current]);
    setSubPage({ type: "alba-detail", id: created.id });
  }

  const selectedAlba = subPage?.type === "alba-detail" ? albaList.find((item) => item.id === subPage.id) : undefined;
  const selectedTogetherPost =
    subPage?.type === "together-detail"
      ? togetherPosts.find((post) => post.id === subPage.id)
      : undefined;

  // 일반 목록(products)은 mine을 항상 false로 내려주는 별개 API라서, 내 상품(판매내역/찜
  // 목록 경유)을 그 목록에서만 찾으면 "본인 글인데 mine:false"가 되어 채팅하기가 잘못된
  // (구매자용) 분기로 빠진다 — myProducts/favoriteProducts를 먼저 찾아야 mine이 정확하다.
  const selectedProduct =
    subPage?.type === "product-detail"
      ? (myProducts.find((product) => product.id === subPage.id) ??
        favoriteProducts.find((product) => product.id === subPage.id) ??
        products.find((product) => product.id === subPage.id))
      : undefined;
  const selectedPost =
    subPage?.type === "community-detail" ? posts.find((post) => post.id === subPage.id) : undefined;
  const selectedChat =
    subPage?.type === "chat-room" ? chats.find((chat) => chat.id === subPage.id) : undefined;

  const showBottomNav = !subPage || ["my-menu", "dream-dashboard", "dream-notice", "settings", "sales", "favorites", "search", "all-services"].includes(subPage.type);
  const isDreamPage = subPage?.type === "dream-dashboard" || subPage?.type === "dream-notice";

  return (
    <div className={`${styles.stage} ${isDreamPage ? styles.dreamStage : ""}`} data-theme={theme}>
      <div className={styles.phoneShell}>
        <main
          className={`${styles.appViewport} ${activeTab === "map" && !subPage ? styles.mapViewport : ""} ${subPage?.type === "real-estate" ? styles.realEstateViewport : ""} ${subPage?.type === "merge-game" ? styles.mergeGameViewport : ""}`}
          data-app-scroll
        >
          {subPage?.type === "product-detail" && selectedProduct ? (
            <ProductDetailScreen
              product={selectedProduct}
              onBack={goBack}
              onFavorite={toggleFavorite}
              onStatusChange={updateProductStatus}
              onChat={() => {
                // 판매자 본인 글이면 "채팅하기"는 그 상품에 걸린 채팅방들 목록으로,
                // 구매자면 그 판매자와의 채팅방 하나로 바로 들어간다(백엔드가 기존 방 재사용).
                if (selectedProduct.mine) {
                  setSubPage({
                    type: "chat-room-list",
                    productId: selectedProduct.id,
                    productTitle: selectedProduct.title,
                  });
                  return;
                }
                const numericProductId = Number(selectedProduct.id);
                if (!Number.isFinite(numericProductId)) return;
                createOrGetChatRoom(numericProductId)
                  .then((dto) => {
                    const room = toChatRoomUi(dto);
                    setChats((current) => (current.some((c) => c.id === room.id) ? current : [room, ...current]));
                    openChat(room.id);
                  })
                  .catch((error: unknown) => {
                    if (error instanceof AuthRequiredError) {
                      setAuthRequired(true);
                      setSheet("status");
                    } else {
                      console.error("채팅방을 열지 못했습니다.", error);
                    }
                  });
              }}
              onHideSeller={(id) => {
                setProducts((prev) => prev.filter((p) => p.id !== id));
              }}
              onReportProduct={(id, _reason) => {
                setProducts((prev) => prev.filter((p) => p.id !== id));
              }}
            />
          ) : subPage?.type === "product-form" ? (
            <ProductFormScreen onBack={goBack} onSubmit={submitProduct} />
          ) : subPage?.type === "community-detail" && selectedPost ? (
            <CommunityDetailScreen post={selectedPost} onBack={goBack} />
          ) : subPage?.type === "community-form" ? (
            <CommunityFormScreen onBack={goBack} onSubmit={submitCommunityPost} />
          ) : subPage?.type === "together-intro" ? (
            <TogetherIntroView
              onBack={goBack}
              onStart={() => setSubPage({ type: "together-category" })}
            />
          ) : subPage?.type === "together-category" ? (
            <TogetherCategoryView
              onBack={goBack}
              onSelectCategory={(cat) => setSubPage({ type: "together-form", category: cat })}
            />
          ) : subPage?.type === "together-form" ? (
            <TogetherFormView
              initialCategory={subPage.category ?? "group_buy"}
              userNeighborhood={activeNeighborhood}
              onBack={goBack}
              onSubmit={handleSubmitTogether}
            />
          ) : subPage?.type === "together-detail" && selectedTogetherPost ? (
            <TogetherDetailView
              post={selectedTogetherPost}
              onBack={goBack}
              onToggleJoin={() => handleToggleTogetherJoin(selectedTogetherPost.id)}
              onStartChat={() => {
                const room = chats[0];
                openChat(room.id);
              }}
            />
          ) : subPage?.type === "chat-room" && selectedChat ? (
            <ChatRoomScreen
              room={selectedChat}
              product={selectedChat.productId ? products.find((product) => product.id === selectedChat.productId) : undefined}
              messages={roomMessages[selectedChat.id] ?? []}
              draft={messageDraft}
              onDraftChange={setMessageDraft}
              onSubmit={(event) => submitMessage(event, selectedChat.id)}
              onBack={goBack}
              otherUserId={roomOtherUserId[selectedChat.id]}
              onLeave={() => leaveChat(selectedChat.id)}
              onUpdateStatus={(status) => updateChatStatus(selectedChat.id, status)}
              onBlock={blockChatPartner}
              onReport={reportChatPartner}
            />
          ) : subPage?.type === "chat-room-list" ? (
            <ChatsScreen
              rooms={chats.filter((chat) => chat.productId === subPage.productId)}
              activeFilter={chatFilter}
              isLoading={false}
              unreadCount={totalUnread}
              onFilterChange={setChatFilter}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenSettings={() => setSubPage({ type: "settings" })}
              onOpenChat={openChat}
              title={`${subPage.productTitle} 채팅`}
              onBack={goBack}
            />
          ) : subPage?.type === "my-menu" ? (
            <MyMenuScreen onBack={goBack} onOpenAlba={(tab) => setSubPage({ type: "alba", tab })} />
          ) : subPage?.type === "all-services" ? (
            <AllServicesScreen
              onBack={goBack}
              onOpenAlba={() => setSubPage({ type: "alba" })}
              onOpenRealEstate={openRealEstate}
              onOpenApartment={openApartmentFlow}
              onOpenGame={() => setSubPage({ type: "merge-game" })}
            />
          ) : subPage?.type === "merge-game" ? (
            <GajiMergeGameScreen onBack={() => setSubPage({ type: "all-services" })} />
          ) : subPage?.type === "apartment-verification" ? (
            <ApartmentVerificationScreen
              onBack={goBack}
              onVerify={(aptName) => {
                setVerifiedApartment(aptName);
                setSubPage({ type: "apartment-community", apartmentName: aptName });
              }}
            />
          ) : subPage?.type === "apartment-community" ? (
            <ApartmentCommunityScreen
              apartmentName={subPage.apartmentName || verifiedApartment || "내 아파트"}
              onBack={goBack}
              onReverify={() => setSubPage({ type: "apartment-verification" })}
              onOpenSearch={() => setSubPage({ type: "search" })}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenMenu={() => setSubPage({ type: "all-services" })}
              onOpenPost={(id) => setSubPage({ type: "community-detail", id })}
              onOpenTogetherIntro={() => setSubPage({ type: "together-intro" })}
              onOpenTogetherPost={(id) => setSubPage({ type: "together-detail", id })}
              togetherPosts={togetherPosts}
              onWrite={() => setSubPage({ type: "together-intro" })}
            />
          ) : subPage?.type === "real-estate" ? (
            <RealEstateScreen activeNeighborhood={activeNeighborhood} onBack={goBack} />
          ) : subPage?.type === "dream-dashboard" ? (
            <DreamDashboardScreen
              activeNeighborhood={activeNeighborhood}
              onBack={goBack}
              onChangeNeighborhood={() => setSheet("region")}
              onOpenNotice={() => setSubPage({ type: "dream-notice" })}
            />
          ) : subPage?.type === "dream-notice" ? (
            <DreamNoticeScreen onBack={goBack} />
          ) : subPage?.type === "alba" ? (
            <AlbaMainScreen
              activeNeighborhood={activeNeighborhood}
              initialTab={subPage.tab ?? "home"}
              initialCategory={subPage.category}
              albas={albaList}
              onBack={goBack}
              onSelectAlba={(id) => setSubPage({ type: "alba-detail", id })}
              onWrite={() => setSubPage({ type: "alba-form" })}
              onToggleFavorite={toggleAlbaFavorite}
            />
          ) : subPage?.type === "alba-detail" && selectedAlba ? (
            <AlbaDetailScreen
              alba={selectedAlba}
              onBack={goBack}
              onToggleFavorite={() => toggleAlbaFavorite(selectedAlba.id)}
              onApply={() => handleApplyAlba(selectedAlba.id)}
            />
          ) : subPage?.type === "alba-form" ? (
            <AlbaFormScreen
              activeNeighborhood={activeNeighborhood}
              onBack={goBack}
              onSubmit={handleCreateAlba}
            />
          ) : subPage?.type === "settings" ? (
            <SettingsScreen
              theme={theme}
              onThemeChange={changeTheme}
              onBack={goBack}
              locationAllowed={locationAllowed}
              isGuestMode={isGuestMode}
              onLocationToggle={() => setLocationAllowed((value) => !value)}
              onGuestToggle={() => setIsGuestMode((value) => !value)}
              onNetworkErrorToggle={() => setHasNetworkError((value) => !value)}
              hasNetworkError={hasNetworkError}
              onLogout={handleLogout}
            />
          ) : subPage?.type === "sales" ? (
            <ManagementScreen
              title="판매관리"
              products={myProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onStatusChange={updateProductStatus}
            />
          ) : subPage?.type === "favorites" ? (
            <FavoriteScreen
              products={favoriteProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onFavorite={toggleFavorite}
            />
          ) : subPage?.type === "search" ? (
            <SearchScreen
              products={products}
              posts={posts}
              businesses={localBusinesses}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onPostClick={(id) => setSubPage({ type: "community-detail", id })}
            />
          ) : subPage?.type === "region-search" ? (
            <RegionSearchScreen
              regions={regions}
              recentNeighborhoods={recentNeighborhoods}
              onBack={() => {
                setSubPage(null);
                setSheet("region");
              }}
              onPick={(dongName) => pickNeighborhood(dongName, regionSearchTarget)}
            />
          ) : activeTab === "home" ? (
            <HomeScreen
              isLoading={isBooting}
              hasError={hasNetworkError}
              activeNeighborhood={activeNeighborhood}
              secondaryNeighborhood={secondaryNeighborhood}
              productFilter={productFilter}
              products={filteredProducts}
              onLoadMore={loadMoreProducts}
              hasMore={products.length < productsTotal}
              isLoadingMore={isLoadingMoreProducts}
              onOpenRegion={() => setSheet("region")}
              onOpenSearch={() => setSubPage({ type: "search" })}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenMenu={() => {
                setActiveTab("my");
                setSubPage({ type: "my-menu" });
              }}
              onFilterChange={(value) => {
                if (value === "부동산") {
                  openRealEstate();
                  return;
                }
                setProductFilter(value);
              }}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onFavorite={toggleFavorite}
              onRetry={() => setHasNetworkError(false)}
            />
          ) : activeTab === "community" ? (
            <CommunityScreen
              activeTab={communityTab}
              activeFilter={communityFilter}
              posts={filteredPosts}
              togetherPosts={filteredTogetherPosts}
              togetherCategoryFilter={togetherCategoryFilter}
              onTogetherCategoryChange={setTogetherCategoryFilter}
              onOpenTogetherIntro={() => setSubPage({ type: "together-intro" })}
              onTogetherPostClick={(id) => setSubPage({ type: "together-detail", id })}
              isLoading={isBooting}
              onTabChange={setCommunityTab}
              onFilterChange={setCommunityFilter}
              onOpenSearch={() => setSubPage({ type: "search" })}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenMenu={() => {
                setActiveTab("my");
                setSubPage({ type: "settings" });
              }}
              onPostClick={(id) => setSubPage({ type: "community-detail", id })}
            />
          ) : activeTab === "map" ? (
            <MapScreen
              activeNeighborhood={activeNeighborhood}
              secondaryNeighborhood={secondaryNeighborhood}
              categories={LOCAL_CATEGORIES}
              selectedCategory={mapCategory}
              sheetState={mapSheetState}
              query={mapQuery}
              businesses={businesses}
              hasSearchedArea={mapSearchArea?.neighborhood === activeNeighborhood}
              searchBounds={mapSearchArea?.neighborhood === activeNeighborhood ? mapSearchArea.bounds : null}
              onSearchBounds={(bounds) => setMapSearchArea({ neighborhood: activeNeighborhood, bounds })}
              locationAllowed={locationAllowed}
              theme={theme}
              onCategoryChange={setMapCategory}
              onSheetStateChange={setMapSheetState}
              onQueryChange={setMapQuery}
              onRequestLocation={() => setLocationAllowed(true)}
              onOpenProfile={() => {
                setActiveTab("my");
                setSubPage(null);
              }}
            />
          ) : activeTab === "chats" ? (
            <ChatsScreen
              rooms={filteredChats}
              activeFilter={chatFilter}
              isLoading={isBooting}
              unreadCount={totalUnread}
              onFilterChange={setChatFilter}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenSettings={() => setSubPage({ type: "settings" })}
              onOpenChat={openChat}
            />
          ) : (
            <MyScreen
              nickname={me?.nickname}
              activeNeighborhood={activeNeighborhood}
              unreadCount={totalUnread}
              favoriteCount={favoriteProducts.length}
              myProducts={myProducts}
              onOpenSettings={() => setSubPage({ type: "settings" })}
              onOpenMenu={() => setSubPage({ type: "my-menu" })}
              onOpenAllServices={() => setSubPage({ type: "all-services" })}
              onOpenDream={() => setSubPage({ type: "dream-dashboard" })}
              onOpenAlba={() => setSubPage({ type: "alba" })}
              onOpenSales={() => setSubPage({ type: "sales" })}
              onOpenFavorites={() => setSubPage({ type: "favorites" })}
              onOpenApartment={openApartmentFlow}
            />
          )}
        </main>

        {!subPage && (activeTab === "home" || activeTab === "community" || (activeTab === "map" && mapSheetState === "expanded")) && (
          <FloatingWriteButton
            showTogetherTooltip={activeTab === "community"}
            onTooltipClick={() => setSubPage({ type: "together-intro" })}
            onClick={() => {
              if (activeTab === "community") {
                if (communityTab === "같이해요") {
                  setSubPage({ type: "together-intro" });
                } else {
                  setSubPage({ type: "community-form" });
                }
              } else {
                setSheet("write");
              }
            }}
          />
        )}

        {showBottomNav && (
          <BottomNav activeTab={activeTab} unreadCount={totalUnread} onNavigate={navigateTab} />
        )}

        <BottomSheet
          sheet={sheet}
          activeNeighborhood={activeNeighborhood}
          secondaryNeighborhood={secondaryNeighborhood}
          onClose={() => setSheet(null)}
          onSelectPrimary={(dongName) => {
            setSecondaryNeighborhood(activeNeighborhood === dongName ? secondaryNeighborhood : activeNeighborhood);
            setActiveNeighborhood(dongName);
            setSheet(null);
          }}
          onRemoveNeighborhood={(target) => {
            setRegionSearchTarget(target);
            setSheet(null);
            setSubPage({ type: "region-search" });
          }}
          onOpenRegionSearch={() => {
            // 새로 검색해서 추가하는 동네는 방금 둘러보려는 곳이니 바로 대표(primary)로 —
            // secondary로 넣으면 홈 상품 목록 필터(activeNeighborhood 기준)엔 반영이 안 돼서
            // "검색해서 골랐는데 왜 안 뜨지" 버그가 됨.
            setRegionSearchTarget("primary");
            setSheet(null);
            setSubPage({ type: "region-search" });
          }}
          onProductWrite={() => {
            setSheet(null);
            setSubPage({ type: "product-form" });
          }}
          onCommunityWrite={() => {
            setSheet(null);
            setSubPage({ type: "community-form" });
          }}
          onTogetherWrite={() => {
            setSheet(null);
            setSubPage({ type: "together-intro" });
          }}
          totalUnread={totalUnread}
          hasNetworkError={hasNetworkError}
          isGuestMode={isGuestMode}
          authRequired={authRequired}
          onRetry={() => {
            setHasNetworkError(false);
            setSheet(null);
          }}
          onGuestOff={() => {
            setIsGuestMode(false);
            setAuthRequired(false);
            setSheet(null);
          }}
        />
        {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
      </div>
    </div>
  );
}

function ScreenHeader({
  title,
  leading,
  titleAccessory,
  actions,
  compact = false,
}: {
  title: string;
  leading?: React.ReactNode;
  titleAccessory?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={`${styles.screenHeader} ${compact ? styles.compactHeader : ""}`}>
      <div className={styles.headerTitleRow}>
        {leading}
        <h1>{title}</h1>
        {titleAccessory}
      </div>
      <div className={styles.headerActions}>{actions}</div>
    </header>
  );
}

function IconButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={`${styles.iconButton} ${className}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function BrandWordmark() {
  return (
    <span className={styles.brandMark} aria-label="가지페이">
      <svg className={styles.brandSymbol} viewBox="0 0 44 44" aria-hidden="true" focusable="false">
        <path
          className={styles.brandLeaf}
          d="M15.4 11.6c-4.7 0-7.8-2.5-7.8-5.6 0-2.9 2.6-5 5.9-4.4C15.2-.8 19.2-.3 20.6 2.8c1.9-1 5.1.2 5.7 2.9.7 3.1-2.2 5.9-6.8 5.9h-4.1Z"
        />
        <path
          className={styles.brandCore}
          fillRule="evenodd"
          d="M22 12.5c9.1 0 16.3 6.8 16.3 15.2 0 7.5-5.4 11.9-16.3 16.1C11.1 39.6 5.7 35.2 5.7 27.7 5.7 19.3 12.9 12.5 22 12.5Zm0 10.3a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Z"
        />
      </svg>
      <span className={styles.brandWord}>pay</span>
    </span>
  );
}

function HomeScreen({
  isLoading,
  hasError,
  activeNeighborhood,
  secondaryNeighborhood,
  productFilter,
  products,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onOpenRegion,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onFilterChange,
  onProductClick,
  onFavorite,
  onRetry,
}: {
  isLoading: boolean;
  hasError: boolean;
  activeNeighborhood: string;
  secondaryNeighborhood: string;
  productFilter: string;
  products: ProductListItem[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onOpenRegion: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onFilterChange: (filter: string) => void;
  onProductClick: (id: string) => void;
  onFavorite: (id: string) => void;
  onRetry: () => void;
}) {
  // ref(useRef)로 재는 대신 state로 들고 있어야, 스켈레톤(isBooting)이 걷히고
  // sentinel이 뒤늦게 처음 마운트되는 순간에도 effect가 그 변화를 감지해 재실행된다
  // — hasMore useRef만 의존성으로 쓰면 sentinel이 아직 없을 때 딱 한 번 실행되고
  // 끝나버려서(effect는 hasMore가 바뀔 때만 재실행) 이후 관찰이 영영 안 붙는 버그가 있었음.
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelNode || !hasMore) return;
    // 스크롤 컨테이너가 <main data-app-scroll>이라 root를 명시해야 함(null이면
    // 브라우저 뷰포트 기준이라 폰 셸 안쪽 스크롤 위치와 안 맞음).
    const scrollRoot = sentinelNode.closest<HTMLElement>("[data-app-scroll]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: scrollRoot, rootMargin: "400px" },
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, hasMore, onLoadMore]);

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title={activeNeighborhood}
        leading={<MapPin className={styles.titlePin} size={28} fill="currentColor" />}
        actions={
          <>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={28} />
            </IconButton>
            <IconButton label="알림" onClick={onOpenNotifications}>
              <Bell size={27} />
              <span className={styles.notificationDot} />
            </IconButton>
            <IconButton label="전체 메뉴" onClick={onOpenMenu}>
              <Menu size={30} />
            </IconButton>
          </>
        }
      />
      <button type="button" className={styles.neighborhoodSwitch} onClick={onOpenRegion}>
        <span>{activeNeighborhood}</span>
        <span>{secondaryNeighborhood}</span>
        <ChevronDown size={16} />
      </button>
      <ChipScroller items={PRODUCT_FILTERS} value={productFilter} onChange={onFilterChange} />

      {hasError ? (
        <StateBlock
          title="목록을 불러오지 못했어요"
          body="기존 데이터는 유지됩니다. 연결을 확인한 뒤 다시 시도해주세요."
          actionLabel="재시도"
          onAction={onRetry}
        />
      ) : isLoading ? (
        <ProductSkeletonList />
      ) : products.length === 0 ? (
        <StateBlock
          title="조건에 맞는 물건이 없어요"
          body="필터를 전체로 바꾸거나 다른 동네를 선택해보세요."
          actionLabel="전체 보기"
          onAction={() => onFilterChange("전체")}
        />
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onClick={() => onProductClick(product.id)}
              onFavorite={() => onFavorite(product.id)}
            />
          ))}
          {hasMore && (
            <div ref={setSentinelNode} className={styles.loadMoreSentinel}>
              {isLoadingMore && <span>불러오는 중...</span>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ChipScroller({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (item: string) => void;
}) {
  return (
    <div className={styles.chipScroller}>
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={`${styles.chip} ${value === item ? styles.chipActive : ""}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ProductRow({
  product,
  onClick,
  onFavorite,
}: {
  product: ProductListItem;
  onClick: () => void;
  onFavorite: () => void;
}) {
  return (
    <article className={styles.productRow}>
      <button type="button" className={styles.productTapArea} onClick={onClick}>
        <Thumbnail tone={product.thumbnailTone} label={product.thumbnailLabel} />
        <div className={styles.productInfo}>
          <div className={styles.rowTopLine}>
            <h2>{product.title}</h2>
            <MoreVertical size={19} className={styles.moreIcon} />
          </div>
          <p className={styles.metaLine}>
            {product.neighborhoodName}
            {product.distanceKm !== undefined ? ` · ${product.distanceKm}km` : ""}
            {" · "}
            {product.createdAt}
          </p>
          <div className={styles.priceLine}>
            {product.tradeStatus === "SALE" && product.tradeType === "FREE" && (
              <span className={styles.freeBadge}>나눔</span>
            )}
            {product.tradeStatus === "RESERVED" && <span className={styles.statusBadge}>예약중</span>}
            {product.tradeStatus === "SOLD" && <span className={styles.soldBadge}>거래완료</span>}
            <strong>{formatPrice(product)}</strong>
          </div>
          {product.purchaseMode === "DIRECT" && <span className={styles.directBadge}>바로구매</span>}
          <div className={styles.productStats}>
            {product.chatCount > 0 && (
              <span>
                <MessageCircle size={14} /> {product.chatCount}
              </span>
            )}
            {product.favoriteCount + product.interestCount > 0 && (
              <span>
                <Heart size={14} fill={product.isFavorite ? "currentColor" : "none"} />{" "}
                {product.favoriteCount + product.interestCount}
              </span>
            )}
            {product.viewCount > 0 && (
              <span>
                <Eye size={14} /> {product.viewCount}
              </span>
            )}
          </div>
        </div>
      </button>
      <button
        type="button"
        className={`${styles.inlineFavorite} ${product.isFavorite ? styles.favoriteActive : ""}`}
        aria-label="관심 상품 변경"
        onClick={onFavorite}
      >
        <Heart size={22} fill={product.isFavorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

function Thumbnail({ tone, label }: { tone: string; label: string }) {
  return (
    <div className={`${styles.thumbnail} ${styles[`tone_${tone}` as keyof typeof styles] ?? ""}`}>
      <span>{label}</span>
    </div>
  );
}

function ProductSkeletonList() {
  return (
    <div className={styles.productList}>
      {[0, 1, 2, 3].map((item) => (
        <div className={styles.skeletonRow} key={item}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function StateBlock({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.stateBlock}>
      <Sparkles size={30} />
      <h2>{title}</h2>
      <p>{body}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 상품 상세의 "거래 희망 장소" — 좌표 검색은 카카오 Local 키워드검색(/api/geocode,
// 서버사이드 프록시), 지도 렌더링도 카카오맵 JS SDK로 통일(이전엔 네이버 지도였음).
function TradePlaceMap({ query, neighborhoodName }: { query: string; neighborhoodName: string }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (!KAKAO_MAP_JS_KEY) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setUsedFallback(false);

    const params = new URLSearchParams({ query });
    if (neighborhoodName) params.set("fallback", neighborhoodName);

    Promise.all([
      fetch(`/api/geocode?${params}`).then((res) => (res.ok ? res.json() : null)),
      loadKakaoMapScript(KAKAO_MAP_JS_KEY),
    ])
      .then(([geo]) => {
        const kakaoMaps = window.kakao?.maps;
        if (cancelled || !geo || !kakaoMaps || !mapElementRef.current) {
          if (!cancelled) setStatus("error");
          return;
        }
        const center = new kakaoMaps.LatLng(geo.lat, geo.lng);
        const map = new kakaoMaps.Map(mapElementRef.current, {
          center,
          // 카카오 level은 네이버 zoom과 반대(작을수록 확대) — matched는 딱 맞춘 위치라 가깝게,
          // fallback(동네 중심)은 조금 멀리서 보여준다.
          level: geo.matched === "fallback" ? 6 : 3,
        });
        new kakaoMaps.Marker({ position: center, map });
        setUsedFallback(geo.matched === "fallback");
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [query, neighborhoodName]);

  return (
    <div className={styles.tradePlaceBlock}>
      <p className={styles.tradePlaceLine}>
        <strong>거래 희망 장소</strong> {query}
      </p>
      {status === "error" ? (
        <p className={styles.tradePlaceError}>지도를 불러오지 못했습니다.</p>
      ) : (
        <>
          <div ref={mapElementRef} className={styles.tradePlaceMap} />
          {usedFallback && (
            <p className={styles.tradePlaceError}>정확한 위치를 찾지 못해 동네 중심으로 표시했어요.</p>
          )}
        </>
      )}
    </div>
  );
}

function ProductDetailScreen({
  product,
  onBack,
  onFavorite,
  onStatusChange,
  onChat,
  onHideSeller,
  onReportProduct,
}: {
  product: ProductListItem;
  onBack: () => void;
  onFavorite: (id: string) => void;
  onStatusChange: (id: string, status: TradeStatus) => void;
  onChat: () => void;
  onHideSeller: (productId: string) => void;
  onReportProduct: (productId: string, reason: string) => void;
}) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState("전문 판매업자 같아요");

  const reportReasons = [
    "전문 판매업자 같아요",
    "사기 글이에요 / 의심돼요",
    "거래 금지 품목이에요",
    "비매너 및 욕설/비방",
    "기타 사유",
  ];

  return (
    <section className={styles.detailScreen}>
      <div className={`${styles.detailHero} ${styles[`tone_${product.thumbnailTone}` as keyof typeof styles] ?? ""}`}>
        <IconButton label="뒤로" onClick={onBack} className={styles.backFloating}>
          <ChevronLeft size={28} />
        </IconButton>
        <IconButton label="더보기" className={styles.moreFloating} onClick={() => setShowMoreSheet(true)}>
          <MoreVertical size={24} />
        </IconButton>
        <span>{product.thumbnailLabel}</span>
      </div>
      <div className={styles.detailBody}>
        <div className={styles.sellerCard}>
          <div className={styles.avatar}>가</div>
          <div>
            <strong>{product.sellerNickname || "주황가지님"}</strong>
            <span>{product.neighborhoodName}</span>
          </div>
          <button type="button" className={styles.trustPill}>
            매너온도 {(product.sellerMannerTemp ?? 36.5).toFixed(1)}°C
          </button>
        </div>
        <div className={styles.priceLine}>
          {product.tradeStatus === "SALE" && product.tradeType === "FREE" && (
            <span className={styles.freeBadge}>나눔</span>
          )}
          {product.tradeStatus === "RESERVED" && <span className={styles.statusBadge}>예약중</span>}
          {product.tradeStatus === "SOLD" && <span className={styles.soldBadge}>거래완료</span>}
        </div>
        <h1>{product.title}</h1>
        <p className={styles.metaLine}>
          {product.category} · {product.createdAt}
        </p>
        <p className={styles.detailDescription}>{product.description}</p>
        <p className={styles.detailStats}>
          채팅 {product.chatCount} · 관심 {product.favoriteCount + product.interestCount} · 조회 {product.viewCount}
        </p>

        {product.tradePlace && (
          <TradePlaceMap query={product.tradePlace} neighborhoodName={product.neighborhoodName} />
        )}

        {product.mine && (
          <div className={styles.statusPanel}>
            <strong>내 판매 상태</strong>
            <div className={styles.segmented}>
              {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                <button
                  type="button"
                  key={status}
                  className={product.tradeStatus === status ? styles.segmentActive : ""}
                  onClick={() => onStatusChange(product.id, status)}
                >
                  {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "거래완료"}
                </button>
              ))}
            </div>
            <p>상태를 바꾸면 홈 목록, 판매관리, 채팅 상품 카드에 같은 값이 반영됩니다.</p>
          </div>
        )}
      </div>
      <div className={styles.detailActionBar}>
        <button
          type="button"
          className={`${styles.detailFavorite} ${product.isFavorite ? styles.favoriteActive : ""}`}
          onClick={() => onFavorite(product.id)}
        >
          <Heart size={24} fill={product.isFavorite ? "currentColor" : "none"} />
        </button>
        <strong>{formatPrice(product)}</strong>
        <button type="button" onClick={onChat}>
          채팅하기
        </button>
      </div>

      {/* More Options Action Sheet (이 사용자의 글 보지 않기 / 신고하기) */}
      {showMoreSheet && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowMoreSheet(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <div className={styles.productActionGroup}>
              <button
                type="button"
                className={styles.productActionBtn}
                onClick={() => {
                  setShowMoreSheet(false);
                  onHideSeller(product.id);
                  alert("이 사용자의 글을 더 이상 보지 않습니다.");
                  onBack();
                }}
              >
                <EyeOff size={22} />
                <span>이 사용자의 글 보지 않기</span>
              </button>
              <button
                type="button"
                className={`${styles.productActionBtn} ${styles.productActionReport}`}
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowReportModal(true);
                }}
              >
                <MessageCircle size={22} />
                <span>신고하기</span>
              </button>
            </div>
            <button
              type="button"
              className={styles.productActionCloseBtn}
              onClick={() => setShowMoreSheet(false)}
            >
              닫기
            </button>
          </div>
        </>
      )}

      {/* Report Reason Selection Modal */}
      {showReportModal && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowReportModal(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 800 }}>신고 사유를 선택해주세요</h3>
            <div className={styles.reportReasonList}>
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`${styles.reportReasonItem} ${selectedReportReason === reason ? styles.reportReasonItemSelected : ""}`}
                  onClick={() => setSelectedReportReason(reason)}
                >
                  <span>{reason}</span>
                  {selectedReportReason === reason && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.albaDetailApplyBtn}
              style={{ width: "100%", height: "48px" }}
              onClick={() => {
                setShowReportModal(false);
                onReportProduct(product.id, selectedReportReason);
                alert(`신고가 접수되었습니다. (${selectedReportReason})\n운영팀에서 확인 후 신속하게 처리하겠습니다.`);
              }}
            >
              신고 제출하기
            </button>
            <button
              type="button"
              className={styles.productActionCloseBtn}
              onClick={() => setShowReportModal(false)}
            >
              취소
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ProductFormScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="중고거래 글쓰기"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form className={styles.formStack} onSubmit={onSubmit}>
        <div className={styles.photoUploader}>
          <Plus size={28} />
          <span>사진 추가</span>
          <small>최대 10장</small>
        </div>
        <label>
          제목
          <input name="title" maxLength={40} placeholder="물건 이름을 입력하세요" required />
        </label>
        <label>
          카테고리
          <select name="category" defaultValue="중고거래">
            <option>중고거래</option>
            <option>중고차</option>
            <option>알바</option>
            <option>기타 서비스</option>
          </select>
        </label>
        <label>
          가격
          <input name="price" type="number" min={0} max={999999999} defaultValue={30000} />
        </label>
        <label className={styles.checkRow}>
          <input name="free" type="checkbox" />
          나눔으로 등록
        </label>
        <label>
          설명
          <textarea
            name="description"
            maxLength={2000}
            placeholder="상태, 거래 희망 장소, 가격 제안 가능 여부를 적어주세요."
            required
          />
        </label>
        <button type="submit" className={styles.primaryButton}>
          등록하기
        </button>
      </form>
    </section>
  );
}

function CommunityScreen({
  activeTab,
  activeFilter,
  posts,
  togetherPosts = [],
  togetherCategoryFilter = "all",
  onTogetherCategoryChange,
  onOpenTogetherIntro,
  onTogetherPostClick,
  isLoading,
  onTabChange,
  onFilterChange,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onPostClick,
}: {
  activeTab: string;
  activeFilter: string;
  posts: CommunityPost[];
  togetherPosts?: TogetherPost[];
  togetherCategoryFilter?: TogetherCategory | "all";
  onTogetherCategoryChange?: (cat: TogetherCategory | "all") => void;
  onOpenTogetherIntro?: () => void;
  onTogetherPostClick?: (id: string) => void;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
  onFilterChange: (filter: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onPostClick: (id: string) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="커뮤니티"
        actions={
          <>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={29} />
            </IconButton>
            <IconButton label="알림" onClick={onOpenNotifications}>
              <Bell size={28} />
              <span className={styles.notificationDot} />
            </IconButton>
            <IconButton label="메뉴" onClick={onOpenMenu}>
              <Menu size={31} />
            </IconButton>
          </>
        }
      />
      <nav className={styles.communityPillTabs} aria-label="커뮤니티 탭">
        {COMMUNITY_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.communityPillTab} ${activeTab === tab ? styles.communityPillTabActive : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
            {tab === "같이해요" && <em className={styles.communityNBadge}>N</em>}
          </button>
        ))}
      </nav>

      {/* Together Banner Slider - Visible on All / Together Tab */}
      <div
        onClick={onOpenTogetherIntro}
        className={styles.daangnTogetherBanner}
      >
        <div className={styles.daangnTogetherBannerLeft}>
          <span className={styles.daangnTogetherBannerIcon}>🤝</span>
          <div className={styles.daangnTogetherBannerText}>
            <span className={styles.daangnTogetherBannerSub}>입주민끼리 무엇이든 같이해보세요</span>
            <strong className={styles.daangnTogetherBannerTitle}>이웃과 같이해요</strong>
          </div>
        </div>
        <ChevronRight size={18} className={styles.togetherBannerArrow} />
      </div>
      <div className={styles.daangnBannerDots}>
        <span className={`${styles.daangnBannerDot} ${styles.daangnBannerDotActive}`} />
        <span className={styles.daangnBannerDot} />
      </div>

      {/* Notice Megaphone Line */}
      <div className={styles.communityNoticeLine} onClick={onOpenTogetherIntro}>
        <span>📢</span>
        <span>안녕하세요 😊 동네 커뮤니티는 가까운 이웃과 함께하는 공간입니다.</span>
      </div>

      {activeTab === "같이해요" ? (
        <>
          {/* Seed ChipScroller */}
          <ChipScroller
            items={["전체", "공동구매", "공동육아", "취미활동", "강아지 산책", "기타"]}
            value={
              togetherCategoryFilter === "group_buy"
                ? "공동구매"
                : togetherCategoryFilter === "childcare"
                ? "공동육아"
                : togetherCategoryFilter === "hobby"
                ? "취미활동"
                : togetherCategoryFilter === "pet_walk"
                ? "강아지 산책"
                : togetherCategoryFilter === "etc"
                ? "기타"
                : "전체"
            }
            onChange={(item) => {
              const map: Record<string, TogetherCategory | "all"> = {
                전체: "all",
                공동구매: "group_buy",
                공동육아: "childcare",
                취미활동: "hobby",
                "강아지 산책": "pet_walk",
                기타: "etc",
              };
              onTogetherCategoryChange?.(map[item] || "all");
            }}
          />

          {/* Together Post List */}
          {togetherPosts.length === 0 ? (
            <StateBlock
              title="등록된 모임이 아직 없어요"
              body="가까운 이웃과 함께할 모임을 직접 만들어보세요!"
              actionLabel="모임 만들기"
              onAction={() => onOpenTogetherIntro?.()}
            />
          ) : (
            <div className={styles.postList}>
              {togetherPosts.map((post) => (
                <TogetherFeedCard
                  key={post.id}
                  post={post}
                  onClick={() => onTogetherPostClick?.(post.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <ChipScroller items={COMMUNITY_FILTERS} value={activeFilter} onChange={onFilterChange} />
          {isLoading ? (
            <PostSkeletonList />
          ) : posts.length === 0 ? (
            <StateBlock
              title="아직 올라온 이야기가 없어요"
              body="필터를 추천으로 바꾸거나 첫 글을 남겨보세요."
              actionLabel="추천 보기"
              onAction={() => onFilterChange("추천")}
            />
          ) : (
            <div className={styles.postList}>
              {posts.map((post) => (
                <CommunityPostRow key={post.id} post={post} onClick={() => onPostClick(post.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CommunityPostRow({ post, onClick }: { post: CommunityPost; onClick: () => void }) {
  return (
    <article className={styles.postRow}>
      <button type="button" onClick={onClick}>
        <div className={styles.postText}>
          <span className={styles.categoryBadge}>{post.categoryName}</span>
          <h2>{post.title}</h2>
          <p>{post.contentPreview}</p>
          <small>
            {post.neighborhoodName} · {post.createdAt} · 조회 {post.viewCount}
          </small>
        </div>
        {post.thumbnailTone && (
          <div className={`${styles.postThumb} ${styles[`tone_${post.thumbnailTone}` as keyof typeof styles] ?? ""}`}>
            {post.thumbnailCount && post.thumbnailCount > 1 ? <span>{post.thumbnailCount}</span> : null}
          </div>
        )}
        <MoreVertical size={18} className={styles.postMore} />
        {post.commentCount > 0 && (
          <span className={styles.commentCount}>
            <MessageCircle size={15} /> {post.commentCount}
          </span>
        )}
      </button>
    </article>
  );
}

function PostSkeletonList() {
  return (
    <div className={styles.postList}>
      {[0, 1, 2].map((item) => (
        <div className={styles.skeletonPost} key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function CommunityDetailScreen({ post, onBack }: { post: CommunityPost; onBack: () => void }) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="동네생활"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <IconButton label="더보기">
            <MoreVertical size={23} />
          </IconButton>
        }
      />
      <article className={styles.detailArticle}>
        <span className={styles.categoryBadge}>{post.categoryName}</span>
        <h1>{post.title}</h1>
        <p className={styles.metaLine}>
          {post.neighborhoodName} · {post.createdAt} · 조회 {post.viewCount}
        </p>
        <p>{post.contentPreview}</p>
        <div className={styles.reactionBar}>
          <button type="button">
            <Heart size={19} /> 공감 {post.reactionCount}
          </button>
          <button type="button">
            <MessageCircle size={19} /> 댓글 {post.commentCount}
          </button>
        </div>
      </article>
    </section>
  );
}

function ApartmentVerificationScreen({
  onBack,
  onVerify,
}: {
  onBack: () => void;
  onVerify: (apartmentName: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "locating" | "found" | "searching">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [nearbyApts, setNearbyApts] = useState<{ name: string; addr: string; units: string; dist: string }[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // 서울 주요 아파트 단지 DB (실제 서비스에선 서버에서 좌표 기반 조회)
  const APT_DB = [
    { name: "푸르지오시티", addr: "서울 구로구 개봉동 128-3", units: "1,240세대", lat: 37.495, lng: 126.847 },
    { name: "개봉두산위브", addr: "서울 구로구 개봉동 84-1", units: "798세대", lat: 37.496, lng: 126.849 },
    { name: "개봉한신", addr: "서울 구로구 개봉동 202", units: "560세대", lat: 37.493, lng: 126.845 },
    { name: "현대홈타운", addr: "서울 구로구 개봉동 45-2", units: "980세대", lat: 37.494, lng: 126.851 },
    { name: "아이파크", addr: "서울 구로구 개봉동 89", units: "620세대", lat: 37.492, lng: 126.844 },
    { name: "래미안", addr: "서울 송파구 신천동 7-20", units: "1,840세대", lat: 37.515, lng: 127.105 },
    { name: "헬리오시티", addr: "서울 송파구 가락동 100", units: "9,510세대", lat: 37.498, lng: 127.118 },
    { name: "올림픽선수촌", addr: "서울 송파구 방이동 88", units: "5,540세대", lat: 37.511, lng: 127.127 },
    { name: "마포래미안푸르지오", addr: "서울 마포구 아현동 747", units: "3,885세대", lat: 37.555, lng: 126.953 },
    { name: "e편한세상", addr: "서울 은평구 불광동 329", units: "1,350세대", lat: 37.616, lng: 126.923 },
  ];

  const handleGPS = () => {
    setPhase("locating");
    setSelectedApt(null);

    if (!navigator.geolocation) {
      // fallback: 현재 activeNeighborhood 기반으로 근처 단지 보여주기
      setTimeout(() => {
        const apts = APT_DB.slice(0, 5).map((a) => ({ ...a, dist: `${Math.floor(Math.random() * 300 + 50)}m` }));
        setNearbyApts(apts);
        setDetectedLocation("개봉동");
        setPhase("found");
      }, 1200);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // 거리 계산 (haversine 근사)
        const sorted = APT_DB.map((apt) => {
          const dlat = (apt.lat - latitude) * 111000;
          const dlng = (apt.lng - longitude) * 88000;
          const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));
          return { name: apt.name, addr: apt.addr, units: apt.units, dist: dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km` };
        }).sort((a, b) => parseInt(a.dist) - parseInt(b.dist)).slice(0, 5);
        setNearbyApts(sorted);
        setDetectedLocation("현재 위치");
        setPhase("found");
      },
      () => {
        // 권한 거부 시 기본 목록
        const apts = APT_DB.slice(0, 5).map((a) => ({ ...a, dist: `${Math.floor(Math.random() * 400 + 100)}m` }));
        setNearbyApts(apts);
        setDetectedLocation("내 동네");
        setPhase("found");
      },
      { timeout: 8000 }
    );
  };

  const searchResults = searchTerm.trim()
    ? APT_DB.filter((a) =>
        a.name.includes(searchTerm) || a.addr.includes(searchTerm)
      ).map((a) => ({ ...a, dist: "" }))
    : [];

  const handleConfirm = () => {
    if (!selectedApt) return;
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      onVerify(selectedApt);
    }, 500);
  };

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="내 아파트 인증"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />

      {/* 상단 히어로 */}
      <div className={styles.aptVerifyHero}>
        <div className={styles.aptVerifyIconBg}>
          <Building2 size={28} strokeWidth={1.8} />
        </div>
        <h1 className={styles.aptVerifyTitle}>
          입주민 전용 커뮤니티<br />
          <em>아파트를 인증해주세요</em>
        </h1>
        <p className={styles.aptVerifyDesc}>
          실제 거주 중인 아파트를 인증하면<br />
          이웃과 함께하는 전용 공간이 열려요
        </p>
      </div>

      {/* GPS 버튼 */}
      <button
        type="button"
        className={styles.aptGpsBtn}
        onClick={handleGPS}
        disabled={phase === "locating"}
      >
        {phase === "locating" ? (
          <>
            <span className={styles.aptGpsSpinner} />
            <span>위치 확인 중...</span>
          </>
        ) : (
          <>
            <MapPin size={18} />
            <span>GPS로 내 위치 아파트 찾기</span>
          </>
        )}
      </button>

      <div className={styles.aptVerifyDivider}>
        <span>또는 직접 검색</span>
      </div>

      {/* 검색창 */}
      <div className={styles.aptSearchWrap}>
        <Search size={17} className={styles.aptSearchIcon} />
        <input
          type="text"
          className={styles.aptSearchInput}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPhase("searching");
            setSelectedApt(null);
          }}
          placeholder="아파트 이름 검색"
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.aptSearchClear}
            onClick={() => { setSearchTerm(""); setPhase(phase === "searching" ? "idle" : phase); }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 결과 목록 */}
      {(phase === "found" || phase === "searching") && (
        <div className={styles.aptListWrap}>
          <p className={styles.aptListLabel}>
            {phase === "found"
              ? `📍 ${detectedLocation} 근처 아파트`
              : `'${searchTerm}' 검색 결과`}
          </p>
          <div className={styles.aptList}>
            {(phase === "found" ? nearbyApts : searchResults).map((apt) => {
              const sel = selectedApt === apt.name;
              return (
                <button
                  key={apt.name}
                  type="button"
                  className={`${styles.aptListItem} ${sel ? styles.aptListItemSelected : ""}`}
                  onClick={() => setSelectedApt(apt.name)}
                >
                  <div className={styles.aptListItemIcon}>
                    <Building2 size={18} />
                  </div>
                  <div className={styles.aptListItemInfo}>
                    <strong>{apt.name}</strong>
                    <span>{apt.addr} · {apt.units}</span>
                  </div>
                  <div className={styles.aptListItemRight}>
                    {apt.dist && <span className={styles.aptListDist}>{apt.dist}</span>}
                    <span className={`${styles.aptListRadio} ${sel ? styles.aptListRadioSelected : ""}`}>
                      {sel && <CheckCircle2 size={14} />}
                    </span>
                  </div>
                </button>
              );
            })}
            {phase === "searching" && searchResults.length === 0 && searchTerm.trim() && (
              <div className={styles.aptEmptyState}>
                <Search size={28} />
                <p>검색 결과가 없어요</p>
                <span>아파트 이름으로 검색해보세요</span>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && (
        <div className={styles.aptIdleHint}>
          <MapPinned size={40} strokeWidth={1.3} />
          <p>GPS 버튼을 누르면 현재 위치에서<br />가까운 아파트를 자동으로 찾아줘요</p>
        </div>
      )}

      {/* 하단 고정 버튼 */}
      <div className={styles.aptVerifyBar}>
        <button
          type="button"
          className={`${styles.primaryButton} ${!selectedApt ? styles.aptVerifyBtnDisabled : ""}`}
          disabled={!selectedApt || isConfirming}
          onClick={handleConfirm}
        >
          {isConfirming
            ? "인증 중..."
            : selectedApt
            ? `${selectedApt} 인증하기`
            : "아파트를 선택해주세요"}
        </button>
      </div>
    </section>
  );
}

function ApartmentCommunityScreen({
  apartmentName = "내 아파트",
  onBack,
  onReverify,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onOpenPost,
  onOpenTogetherIntro,
  onOpenTogetherPost,
  togetherPosts,
  onWrite,
}: {
  apartmentName?: string;
  onBack: () => void;
  onReverify?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onOpenPost?: (id: string) => void;
  onOpenTogetherIntro?: () => void;
  onOpenTogetherPost?: (id: string) => void;
  togetherPosts: TogetherPost[];
  onWrite: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [showMarketPosts, setShowMarketPosts] = useState<boolean>(true);
  const [togetherFilter, setTogetherFilter] = useState<TogetherCategory | "all">("all");

  const APT_TABS = ["전체", "자유 주제", "같이해요", "질문", "입주민 의견"];

  const mockAptPosts = [
    {
      id: "apt-1",
      category: "생활 정보",
      hasDot: true,
      title: `${apartmentName} 며칠전에 근처 맛집 방문했는데 정말 친절하고 맛있었어요! 입주민 분들께 추천드립니다.`,
      viewCount: 43,
      isMarket: false,
    },
    {
      id: "apt-2",
      category: "중고거래",
      hasDot: false,
      title: "베이지 콤비 암막블라인드 깔끔하게 사용하기 좋아요. 창문에 설치하면 아늑한 분위기를 ...",
      thumbnail: "warm",
      viewCount: 22,
      isMarket: true,
    },
    {
      id: "apt-3",
      category: "가입인사",
      hasDot: false,
      title: `안녕하세요 ${apartmentName}에 새로 입주한 주민입니다! 잘 부탁드려요 😊`,
      viewCount: 6,
      isMarket: false,
    },
    {
      id: "apt-4",
      category: "중고거래",
      hasDot: false,
      title: "이솝 엘레오스 바디 클렌저 & 레저렉션 핸드워시 새상품 세트예요. 은은한 향으로 기분 좋...",
      thumbnail: "botanical",
      photoCount: 2,
      viewCount: 30,
      isMarket: true,
    },
    {
      id: "apt-5",
      category: "중고거래",
      hasDot: false,
      title: "프라다 사피아노 지갑 핑크 새상품이에요. 선물용으로도 괜찮고, 관심 있으...",
      thumbnail: "leather",
      photoCount: 2,
      viewCount: 16,
      isMarket: true,
    },
  ];

  const displayedPosts = mockAptPosts.filter((post) => {
    if (!showMarketPosts && post.isMarket) return false;
    if (activeTab === "자유 주제") return post.category === "생활 정보" || post.category === "가입인사";
    if (activeTab === "질문") return post.category === "질문";
    if (activeTab === "입주민 의견") return post.category === "생활 정보";
    return true;
  });

  return (
    <section className={styles.screen}>
      {/* Header */}
      <ScreenHeader
        title={apartmentName}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <>
            <IconButton label="채팅" onClick={onOpenNotifications}>
              <MessageCircle size={25} />
            </IconButton>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={25} />
            </IconButton>
            <IconButton label="메뉴" onClick={onOpenMenu}>
              <Menu size={27} />
            </IconButton>
          </>
        }
      />

      {/* Subheader Meta */}
      <div className={styles.aptHeaderMeta}>
        <Lock size={13} />
        <span>입주민 비공개 · 게시글 109 · <strong className={styles.aptMetaActive}>15시간 전 활동</strong></span>
        {onReverify && (
          <button
            type="button"
            onClick={onReverify}
            style={{
              marginLeft: "auto",
              border: 0,
              background: "transparent",
              color: "var(--color-primary)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            아파트 변경
          </button>
        )}
      </div>

      {/* Action Buttons: 이웃 158 / 초대 */}
      <div className={styles.aptActionRow}>
        <button type="button" className={styles.aptActionBtn}>
          <UsersRound size={16} />
          <span>이웃 158</span>
        </button>
        <button type="button" className={styles.aptActionBtn}>
          <Mail size={16} />
          <span>초대</span>
        </button>
      </div>

      {/* 4 Shortcut Grid */}
      <div className={styles.aptShortcutGrid}>
        <button type="button" className={styles.aptShortcutItem}>
          <div className={styles.aptShortcutIconWrap}>
            <Building2 size={20} />
          </div>
          <span>단지 정보</span>
        </button>
        <button type="button" className={styles.aptShortcutItem} onClick={() => setActiveTab("전체")}>
          <div className={styles.aptShortcutIconWrap}>
            <ShoppingBag size={20} />
            <span className={styles.aptShortcutDot} />
          </div>
          <span>중고거래</span>
        </button>
        <button type="button" className={styles.aptShortcutItem}>
          <div className={styles.aptShortcutIconWrap}>
            <BriefcaseBusiness size={20} />
          </div>
          <span>알바</span>
        </button>
        <button type="button" className={styles.aptShortcutItem} onClick={() => setActiveTab("자유 주제")}>
          <div className={styles.aptShortcutIconWrap}>
            <Building size={20} />
            <span className={styles.aptShortcutDot} />
          </div>
          <span>오픈 게시판</span>
        </button>
      </div>

      {/* Together Banner Slider */}
      <div
        onClick={onOpenTogetherIntro}
        className={styles.daangnTogetherBanner}
      >
        <div className={styles.daangnTogetherBannerLeft}>
          <span className={styles.daangnTogetherBannerIcon}>🤝</span>
          <div className={styles.daangnTogetherBannerText}>
            <span className={styles.daangnTogetherBannerSub}>입주민끼리 무엇이든 같이해보세요</span>
            <strong className={styles.daangnTogetherBannerTitle}>아파트 같이해요</strong>
          </div>
        </div>
        <ChevronRight size={18} className={styles.togetherBannerArrow} />
      </div>
      <div className={styles.daangnBannerDots}>
        <span className={`${styles.daangnBannerDot} ${styles.daangnBannerDotActive}`} />
        <span className={styles.daangnBannerDot} />
      </div>

      {/* Notice Megaphone */}
      <div className={styles.communityNoticeLine} onClick={onOpenTogetherIntro}>
        <span>📢</span>
        <span>안녕하세요 😊 아파트 커뮤니티는 같은 단지에 거주하는 입주민 전용 공간입니다.</span>
      </div>

      {/* Filter Tabs */}
      <nav className={styles.communityPillTabs} aria-label="아파트 커뮤니티 탭">
        {APT_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.communityPillTab} ${activeTab === tab ? styles.communityPillTabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "같이해요" && <em className={styles.communityNBadge}>N</em>}
          </button>
        ))}
      </nav>

      {/* 중고거래글 보기 Toggle */}
      {activeTab !== "같이해요" && (
        <div className={styles.communityToggleRow}>
          <button
            type="button"
            className={`${styles.seedToggleSwitch} ${showMarketPosts ? styles.seedToggleSwitchActive : ""}`}
            onClick={() => setShowMarketPosts(!showMarketPosts)}
            aria-label="중고거래글 보기 토글"
          >
            <span className={styles.seedToggleThumb} />
          </button>
          <span>중고거래글 보기</span>
        </div>
      )}

      {/* Feed List */}
      {activeTab === "같이해요" ? (
        <>
          <ChipScroller
            items={["전체", "공동구매", "공동육아", "취미활동", "강아지 산책", "기타"]}
            value={
              togetherFilter === "group_buy"
                ? "공동구매"
                : togetherFilter === "childcare"
                ? "공동육아"
                : togetherFilter === "hobby"
                ? "취미활동"
                : togetherFilter === "pet_walk"
                ? "강아지 산책"
                : togetherFilter === "etc"
                ? "기타"
                : "전체"
            }
            onChange={(item) => {
              const map: Record<string, TogetherCategory | "all"> = {
                전체: "all",
                공동구매: "group_buy",
                공동육아: "childcare",
                취미활동: "hobby",
                "강아지 산책": "pet_walk",
                기타: "etc",
              };
              setTogetherFilter(map[item] || "all");
            }}
          />

          <div className={styles.postList}>
            {togetherPosts.map((post) => (
              <TogetherFeedCard
                key={post.id}
                post={post}
                onClick={() => onOpenTogetherPost?.(post.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={styles.aptPostList}>
          {displayedPosts.map((p) => (
            <article key={p.id} className={styles.postRow}>
              <button type="button" onClick={() => onOpenPost?.(p.id)}>
                <div className={styles.postText}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {p.hasDot && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                    )}
                    <span className={styles.categoryBadge}>{p.category}</span>
                  </div>
                  <h2>{p.title}</h2>
                  <span className={styles.postViewCount}>
                    <Eye size={13} /> {p.viewCount}
                  </span>
                </div>
                {p.thumbnail && (
                  <div className={`${styles.postThumb} ${styles[`tone_${p.thumbnail}` as keyof typeof styles] ?? ""}`}>
                    {p.photoCount && p.photoCount > 1 ? <span>{p.photoCount}</span> : null}
                  </div>
                )}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Floating Action Button with Tooltip */}
      <FloatingWriteButton
        showTogetherTooltip={true}
        onTooltipClick={onOpenTogetherIntro}
        onClick={onWrite}
      />
    </section>
  );
}

function CommunityFormScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="동네생활 글쓰기"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form className={styles.formStack} onSubmit={onSubmit}>
        <label>
          주제
          <select name="category" defaultValue="일반">
            <option>일반</option>
            <option>카페</option>
            <option>동네친구</option>
            <option>취미</option>
          </select>
        </label>
        <label>
          제목
          <input name="title" placeholder="동네 이웃에게 물어보세요" required />
        </label>
        <label>
          내용
          <textarea name="content" placeholder="상세 내용을 입력하세요" required />
        </label>
        <button type="submit" className={styles.primaryButton}>
          올리기
        </button>
      </form>
    </section>
  );
}


function RealtimeDangerTicker({
  dangerSignals,
  onSelectDanger,
}: {
  dangerSignals: LocalBusiness[];
  onSelectDanger?: (business: LocalBusiness) => void;
}) {
  // 서울안전누리(Nuri) 실시간 크롤링 위험 소식 목록 (2개씩 순환 표시)
  const nuriAlerts = dangerSignals.map((d) => ({
    title: d.name,
    tag: d.riskType ? `${d.riskType}` : "공식 소식",
    business: d,
  }));

  const fallbackAlerts = [
    { title: "교통 통제·공지도 여기 모여요", tag: "공식 소식", business: null },
    { title: "잠수교 보행로 및 차도 전면 통제", tag: "도로통제", business: null },
    { title: "서울 동남권 호우주의보 발효 중", tag: "기상특보", business: null },
    { title: "성내천·탄천 산책로 출입 통제", tag: "하천통제", business: null },
    { title: "올림픽대로 여의교 부근 부분통제", tag: "도로공사", business: null },
  ];

  const streamAlerts = nuriAlerts.length >= 2 ? nuriAlerts : [...nuriAlerts, ...fallbackAlerts];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % streamAlerts.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [streamAlerts.length]);

  const safeIndex = streamAlerts.length > 0 ? currentIndex % streamAlerts.length : 0;
  const item1 = streamAlerts[safeIndex] || streamAlerts[0] || fallbackAlerts[0];
  const item2 = streamAlerts[(safeIndex + 1) % (streamAlerts.length || 1)] || streamAlerts[0] || fallbackAlerts[1];

  return (
    <div className={styles.realtimeNewsCard}>
      <div className={styles.realtimeNewsHeader}>
        <span className={styles.realtimeDot} />
        <strong>실시간 소식</strong>
      </div>
      <div className={styles.realtimeNewsSlider}>
        <div
          key={`row1-${safeIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item1?.business && onSelectDanger) {
              onSelectDanger(item1.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item1?.title}</p>
          <small className={styles.realtimeNewsTag}>{item1?.tag}</small>
        </div>
        <div
          key={`row2-${safeIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item2?.business && onSelectDanger) {
              onSelectDanger(item2.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item2?.title}</p>
          <small className={styles.realtimeNewsTag}>{item2?.tag}</small>
        </div>
      </div>
    </div>
  );
}

function MapScreen({
  activeNeighborhood,
  secondaryNeighborhood,
  categories,
  selectedCategory,
  sheetState,
  query,
  businesses,
  hasSearchedArea,
  searchBounds,
  onSearchBounds,
  locationAllowed,
  theme,
  onCategoryChange,
  onSheetStateChange,
  onQueryChange,
  onRequestLocation,
  onOpenProfile,
}: {
  activeNeighborhood: string;
  secondaryNeighborhood: string;
  categories: LocalCategory[];
  selectedCategory: string;
  sheetState: "collapsed" | "half" | "expanded";
  query: string;
  businesses: LocalBusiness[];
  hasSearchedArea: boolean;
  searchBounds: MapSearchBounds | null;
  onSearchBounds: (bounds: MapSearchBounds) => void;
  locationAllowed: boolean;
  theme: ThemeMode;
  onCategoryChange: (id: string) => void;
  onSheetStateChange: (state: "collapsed" | "half" | "expanded") => void;
  onQueryChange: (value: string) => void;
  onRequestLocation: () => void;
  onOpenProfile: () => void;
}) {
  const currentCategory = categories.find((category) => category.id === selectedCategory) ?? categories[0];
  const isCongestionMode = selectedCategory === "congestion";
  const nextState = sheetState === "collapsed" ? "half" : sheetState === "half" ? "expanded" : "collapsed";
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerRequest, setCenterRequest] = useState(0);
  const [selectedDanger, setSelectedDanger] = useState<LocalBusiness | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const locationRequestRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 6 && sheetState !== "expanded") {
      onSheetStateChange("expanded");
    } else if (e.deltaY < -6 && sheetState === "expanded") {
      if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
        onSheetStateChange("half");
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.touches[0].clientY;
    if (delta > 12 && sheetState !== "expanded") {
      onSheetStateChange("expanded");
      touchStartY.current = null;
    } else if (delta < -12 && sheetState === "expanded") {
      if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
        onSheetStateChange("half");
        touchStartY.current = null;
      }
    }
  };

  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);

  const handleSelectRestaurants = useCallback((list: Restaurant[], singleId: string | null) => {
    setSelectedRestaurants(list);
    setSelectedRestaurantId(singleId ?? list[0]?.id ?? null);
    onSheetStateChange("half");
  }, [onSheetStateChange]);

  const handleClearRestaurants = useCallback(() => {
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
  }, []);

  const selectedRestaurant = useMemo(
    () => restaurantResults.find((r) => r.id === selectedRestaurantId) ?? selectedRestaurants[0] ?? null,
    [restaurantResults, selectedRestaurantId, selectedRestaurants],
  );

  const selectDanger = useCallback((business: LocalBusiness) => {
    if (business.category !== "danger") return;
    setSelectedDanger(business);
    if (selectedCategory !== "danger") {
      onCategoryChange("danger");
    }
  }, [selectedCategory, onCategoryChange]);

  const handleCardClick = useCallback((business: LocalBusiness) => {
    if (business.category === "food") {
      const matched = restaurantResults.find((r) => r.id === business.id);
      if (matched) {
        setSelectedRestaurants([matched]);
        setSelectedRestaurantId(matched.id);
        setCurrentLocation({ lat: matched.lat, lng: matched.lng });
        setCenterRequest((v) => v + 1);
        onSheetStateChange("half");
      }
    } else if (business.category === "danger") {
      selectDanger(business);
    }
  }, [restaurantResults, onSheetStateChange, selectDanger]);

  useEffect(() => () => { locationRequestRef.current += 1; }, []);
  const visibleSelectedDanger = selectedDanger;
  const restaurantBusinesses = useMemo(
    () => restaurantResults.map((restaurant, index) => restaurantToLocalBusiness(restaurant, activeNeighborhood, index)),
    [activeNeighborhood, restaurantResults],
  );
  const congestionZones = useMemo(() => {
    let list: CongestionZone[] = [];
    if (searchBounds) {
      list = getCongestionZonesForBounds(searchBounds);
    }
    if (list.length === 0) {
      list = getCongestionZonesForNeighborhood(activeNeighborhood, secondaryNeighborhood);
    }
    if (list.length === 0) {
      const centerCoord =
        currentLocation ??
        NEIGHBORHOOD_COORDS[activeNeighborhood] ??
        NEIGHBORHOOD_COORDS["송파삼성래미안"] ??
        { lat: 37.5133, lng: 127.1001 };
      list = getCongestionZonesNearCenter(centerCoord.lat, centerCoord.lng);
    }
    return list.filter((zone) => matchesCongestionQuery(zone, query));
  }, [activeNeighborhood, currentLocation, query, searchBounds, secondaryNeighborhood]);
  const displayedBusinesses = useMemo(
    () =>
      selectedCategory === "food"
        ? restaurantBusinesses.filter((business) => matchesBusinessQuery(business, query))
        : isCongestionMode
          ? []
        : businesses,
    [businesses, isCongestionMode, query, restaurantBusinesses, selectedCategory],
  );

  function changeCategory(id: string) {
    setSelectedDanger(null);
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
    if (id !== "food") {
      setRestaurantResults([]);
    }
    if (id === "congestion" || id === "food") {
      onSheetStateChange("half");
    }
    onCategoryChange(id);
  }

  function changeQuery(value: string) {
    setSelectedDanger(null);
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
    onQueryChange(value);
  }

  function requestCurrentLocation() {
    if (isLocating) return;
    if (!window.isSecureContext) {
      setLocationError("현재 위치는 HTTPS 또는 localhost에서 사용할 수 있어요.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("현재 위치를 지원하지 않는 브라우저예요.");
      return;
    }
    setIsLocating(true);
    setLocationError("");
    const requestId = ++locationRequestRef.current;
    const onSuccess = ({ coords }: GeolocationPosition) => {
        if (requestId !== locationRequestRef.current) return;
        setCurrentLocation({ lat: coords.latitude, lng: coords.longitude });
        setCenterRequest((value) => value + 1);
        setIsLocating(false);
        onRequestLocation();
    };
    const onError = (error: GeolocationPositionError) => {
        if (requestId !== locationRequestRef.current) return;
        setIsLocating(false);
        const messages: Record<number, string> = {
          1: "위치 권한이 차단됐어요. 브라우저의 위치 권한과 기기의 위치 서비스를 허용한 뒤 다시 시도해 주세요.",
          2: "기기에서 위치를 제공하지 못했어요. 위치 서비스를 확인하거나 Chrome·Edge에서 이 페이지를 열어 주세요.",
          3: "위치 확인 시간이 초과됐어요. 네트워크와 기기의 위치 서비스를 확인한 뒤 다시 시도해 주세요.",
        };
        setLocationError(messages[error.code] ?? "현재 위치를 찾지 못했어요. 다시 시도해 주세요.");
    };
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (requestId !== locationRequestRef.current) return;
        if (error.code === 1) {
          onError(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: false, timeout: 15000, maximumAge: 0,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <section className={styles.mapScreen}>
      <div className={styles.mapCanvas}>
        <KakaoMapLayer
          activeNeighborhood={activeNeighborhood}
          currentLocation={currentLocation}
          centerRequest={centerRequest}
          selectedCategory={selectedCategory}
          selectedRestaurantId={selectedRestaurantId}
          congestionZones={isCongestionMode ? congestionZones : []}
          theme={theme}
          onSelectRestaurants={handleSelectRestaurants}
          onRestaurantsLoaded={setRestaurantResults}
          onClearRestaurants={handleClearRestaurants}
          onSearchBounds={(bounds) => {
            onSearchBounds(bounds);
            onSheetStateChange("collapsed");
          }}
          coordsMap={NEIGHBORHOOD_COORDS}
        />
        <div className={styles.mapSearch}>
          <Search size={27} />
          <input
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="집 근처 업체 검색"
          />
          <button type="button" onClick={onOpenProfile} aria-label="프로필">
            <UserRound size={25} />
          </button>
        </div>
        {sheetState !== "expanded" && selectedCategory !== "food" && !isCongestionMode ? (
          <RealtimeDangerTicker
            dangerSignals={businesses.filter((b) => b.category === "danger")}
            onSelectDanger={selectDanger}
          />
        ) : null}
        {locationError && <p className={styles.mapLocationError} role="alert">{locationError}</p>}
        {isLocating && <p className={styles.mapLocationError} role="status">현재 위치를 확인하고 있어요...</p>}
        <div className={styles.mapControls}>
          <button type="button" aria-label="관심 장소">
            <Heart size={25} />
          </button>
          <button type="button" aria-label="내 장소" title="내 장소로 이동" onClick={() => setCenterRequest((value) => value + 1)}>
            <House size={25} />
          </button>
          <button type="button" aria-label="현재 위치" aria-busy={isLocating} title={isLocating ? "위치 확인 중" : "현재 위치로 이동"} disabled={isLocating} onClick={requestCurrentLocation}>
            <Crosshair size={25} />
          </button>
        </div>
        {!isCongestionMode && selectedCategory !== "food" && (
          <button type="button" className={styles.mapCategoryFab} aria-label={currentCategory.name}>
            <currentCategory.icon size={26} />
          </button>
        )}
        {visibleSelectedDanger ? (
          <DangerSignalCallout business={visibleSelectedDanger} onClose={() => setSelectedDanger(null)} />
        ) : null}
        {selectedCategory === "food" && selectedRestaurants.length > 0 && (
          <RestaurantPreviewBar
            restaurants={selectedRestaurants}
            selectedRestaurantId={selectedRestaurantId}
            onSelectRestaurant={(restaurant) => setSelectedRestaurantId(restaurant.id)}
            onClose={() => {
              setSelectedRestaurants([]);
              setSelectedRestaurantId(null);
            }}
          />
        )}
      </div>

      <div className={`${styles.localSheet} ${styles[`sheet_${sheetState}`]}`} ref={sheetRef} onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        <button type="button" className={styles.sheetHandle} aria-label={sheetState === "expanded" ? "업체 패널 접기" : "업체 패널 펼치기"} aria-expanded={sheetState === "expanded"} onClick={(event) => {
          const panel = event.currentTarget.parentElement;
          onSheetStateChange(nextState);
          window.requestAnimationFrame(() => panel?.scrollTo({ top: 0, behavior: "instant" }));
        }}>
          <span />
        </button>
        {!locationAllowed ? (
          <StateBlock
            title="동네 인증이 필요해요"
            body="현재 위치 권한을 허용하면 지도 업체와 동네 글을 더 정확하게 보여드려요."
            actionLabel="권한 허용"
            onAction={requestCurrentLocation}
          />
        ) : selectedCategory === "food" && selectedRestaurant ? (
          <RestaurantDetailSheet
            restaurant={selectedRestaurant}
            theme={theme}
            onClose={handleClearRestaurants}
          />
        ) : (
          <>
            <div className={styles.localCategoryGrid}>
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    type="button"
                    key={category.id}
                    className={selectedCategory === category.id ? styles.localCategoryActive : ""}
                    onClick={() => changeCategory(category.id)}
                  >
                    <span className={`${styles.localIcon} ${styles[`local_${category.tone}` as keyof typeof styles] ?? ""}`}>
                      <CategoryIcon size={27} />
                    </span>
                    {category.name}
                  </button>
                );
              })}
            </div>
            <div className={styles.localDots}>
              <span />
              <span />
            </div>
            {isCongestionMode ? (
              <CongestionAnalysisSection
                zones={congestionZones}
                hasSearchedArea={hasSearchedArea}
                onClearQuery={() => changeQuery("")}
              />
            ) : (
              <section className={styles.localResults}>
                <h2 aria-live="polite">
                  {hasSearchedArea || selectedCategory === "food"
                    ? `현 지도 검색 결과 ${displayedBusinesses.length}곳`
                    : "이런 동네 가게 알고 있었나요?"}
                </h2>
                {displayedBusinesses.length === 0 ? (
                  <StateBlock
                    title="검색 결과가 없어요"
                    body="다른 카테고리나 검색어로 다시 찾아보세요."
                    actionLabel="검색어 지우기"
                    onAction={() => changeQuery("")}
                  />
                ) : (
                  <div className={styles.businessGrid}>
                    {displayedBusinesses.map((business) => {
                      const dangerVisual = getDangerVisual(business);
                      const isFood = business.category === "food";
                      const isSelected = selectedRestaurantId === business.id;
                      const thumbUrl = business.imageUrl || business.thumbnailUrl;

                      return (
                        <article
                          key={business.id}
                          className={`${styles.businessCard} ${isSelected ? styles.businessCardSelected : ""}`}
                          onClick={() => handleCardClick(business)}
                          style={{ cursor: "pointer" }}
                        >
                          <button
                            type="button"
                            aria-label={`${business.name} 관심`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Heart size={25} fill={business.liked ? "currentColor" : "none"} />
                          </button>
                          <div
                            className={`${styles.businessImage} ${
                              dangerVisual
                                ? `${styles.dangerBusinessImage} ${styles[`dangerThumb_${dangerVisual.tone}` as keyof typeof styles] ?? ""}`
                                : ""
                            }`}
                          >
                            {dangerVisual ? (
                              <>
                                <span className={styles.dangerEmoji}>{dangerVisual.emoji}</span>
                                <span>{dangerVisual.label}</span>
                              </>
                            ) : thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={business.name}
                                className={styles.businessThumbImg}
                                loading="lazy"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              business.name.slice(0, 2)
                            )}
                          </div>
                          <h3>{business.name}</h3>
                          <p>{business.summary}</p>
                          <small>
                            {dangerVisual
                              ? `${business.distance}${business.neighborhoodName ? ` · ${business.neighborhoodName}` : ""}`
                              : isFood
                                ? `${business.distance} · ${business.source === "kakao_local_api" ? "카카오 지도" : "임시 데이터"}`
                                : `${business.distance} · ${business.openNow ? "영업중" : "준비중"}`}
                          </small>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CongestionAnalysisSection({
  zones,
  hasSearchedArea,
  onClearQuery,
}: {
  zones: CongestionZone[];
  hasSearchedArea: boolean;
  onClearQuery: () => void;
}) {
  const summary = summarizeCongestion(zones);
  const peakZone = summary.peakZone;
  const avgTheme = summary.averageTheme;

  return (
    <section className={`${styles.localResults} ${styles.congestionSection}`}>
      <div className={styles.congestionHeader}>
        <div>
          <h2 aria-live="polite">{hasSearchedArea ? "현 지도 혼잡도 분석" : "동네 혼잡도 분석"}</h2>
          <p>SEED 디자인 기반 %당 파스텔 히트맵으로 실시간 인파를 분석해요.</p>
        </div>
        <span className={styles.congestionLiveBadge} style={{ background: avgTheme.badgeBg, color: avgTheme.badgeText, borderColor: avgTheme.badgeBorder }}>
          평균 {summary.averageScore}% · {avgTheme.label}
        </span>
      </div>

      {/* SEED Design 파스텔 컬러보드 범례 (%당 색상표) */}
      <div className={styles.seedColorBoardLegend}>
        <div className={styles.seedColorBoardHeader}>
          <span>🎨 SEED 파스텔 혼잡도 컬러보드</span>
          <small>seed-design.io scale</small>
        </div>
        <div className={styles.seedColorBoardPills}>
          {SEED_PASTEL_COLOR_BOARD.map((item) => (
            <div
              key={item.rangeLabel}
              className={styles.seedColorBoardPill}
              style={{
                background: item.badgeBg,
                borderColor: item.badgeBorder,
                color: item.badgeText,
              }}
            >
              <span className={styles.seedPillDot} style={{ background: item.tagColor }} />
              <strong>{item.rangeLabel}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {zones.length === 0 ? (
        <StateBlock
          title="혼잡도 결과가 없어요"
          body="다른 지역이나 검색어로 다시 확인해 보세요."
          actionLabel="검색어 지우기"
          onAction={onClearQuery}
        />
      ) : (
        <>
          <div className={styles.congestionSummaryGrid}>
            <article className={styles.congestionSummaryCard} style={{ background: avgTheme.cardBg, borderColor: avgTheme.badgeBorder }}>
              <span>현재 동네 평균</span>
              <strong style={{ color: avgTheme.badgeText }}>{summary.averageScore}<small>%</small></strong>
              <em style={{ background: avgTheme.badgeBg, color: avgTheme.badgeText, borderColor: avgTheme.badgeBorder }}>{avgTheme.label}</em>
            </article>
            <article className={styles.congestionSummaryCard}>
              <span>가장 붐비는 장소</span>
              <strong>{peakZone?.name ?? "확인 중"}</strong>
              <em style={{ background: "#FFF1F2", color: "#E11D48", borderColor: "#FECDD3" }}>{summary.crowdedCount}곳 주의</em>
            </article>
          </div>

          <div className={styles.congestionZoneList}>
            {zones.map((zone) => {
              const delta = getCongestionDelta(zone);
              const theme = getSeedPastelTheme(zone.currentScore);
              return (
                <article
                  key={zone.id}
                  className={styles.congestionZoneCard}
                  style={{
                    borderLeft: `4px solid ${theme.tagColor}`,
                    background: "var(--color-bg-elevated)",
                  }}
                >
                  <div className={styles.congestionZoneTop}>
                    <div>
                      <strong className={styles.congestionZoneTitle}>{zone.name}</strong>
                      <span className={styles.congestionZoneSummary}>{zone.summary}</span>
                    </div>
                    <span
                      className={styles.seedZoneBadge}
                      style={{
                        background: theme.badgeBg,
                        color: theme.badgeText,
                        borderColor: theme.badgeBorder,
                      }}
                    >
                      <span className={styles.seedPillDot} style={{ background: theme.tagColor }} />
                      {zone.currentScore}% · {theme.label}
                    </span>
                  </div>

                  {/* SEED Pastel Meter Track */}
                  <div className={styles.congestionMeter} role="progressbar" aria-label={`${zone.name} 혼잡도 ${zone.currentScore}%`} aria-valuenow={zone.currentScore} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${zone.currentScore}%`, background: theme.meterGradient }} />
                  </div>

                  {/* 24시간 시간대별 트렌드 미니 차트 (있는 경우) */}
                  {zone.hourlyTrends && zone.hourlyTrends.length > 0 && (
                    <div className={styles.seedHourlyChart}>
                      <span className={styles.seedHourlyLabel}>시간대별 혼잡 추이</span>
                      <div className={styles.seedHourlyBars}>
                        {zone.hourlyTrends.map((val, idx) => {
                          const barTheme = getSeedPastelTheme(val);
                          const isCurrent = idx === 6; // current hour representation
                          return (
                            <div key={idx} className={styles.seedHourlyBarItem} title={`${idx + 12}시: ${val}% (${barTheme.label})`}>
                              <div className={styles.seedHourlyBarTrack}>
                                <div
                                  className={styles.seedHourlyBarFill}
                                  style={{
                                    height: `${val}%`,
                                    background: barTheme.tagColor,
                                    opacity: isCurrent ? 1 : 0.6,
                                  }}
                                />
                              </div>
                              <span className={styles.seedHourlyBarTime} style={{ fontWeight: isCurrent ? 800 : 500 }}>
                                {idx + 12}시
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 추천 방문 팁 */}
                  {zone.recommendation && (
                    <div className={styles.seedRecommendationBox} style={{ background: theme.badgeBg, borderColor: theme.badgeBorder }}>
                      <span style={{ color: theme.badgeText }}>💡 {zone.recommendation}</span>
                    </div>
                  )}

                  <footer className={styles.congestionZoneFooter}>
                    <span>{zone.distance} · {zone.updatedAt}</span>
                    <span style={{ color: delta > 0 ? "#E11D48" : "#027A48", fontWeight: 700 }}>
                      {delta >= 0 ? `평소보다 +${delta}% 혼잡` : `평소보다 ${Math.abs(delta)}% 여유`}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function createRestaurantMarkerIcon(isSelected: boolean) {
  const size = isSelected ? 32 : 26;
  const bgColor = isSelected ? "#e05800" : "#ff6f0f";
  const scale = isSelected ? "scale(1.15)" : "scale(1)";
  const shadow = isSelected
    ? "0 4px 14px rgba(255, 111, 15, 0.7), 0 0 0 3px rgba(255, 255, 255, 0.9)"
    : "0 2px 8px rgba(0, 0, 0, 0.32)";

  return {
    content: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2px solid #FFFFFF;
        box-shadow: ${shadow};
        cursor: pointer;
        transform: ${scale};
        transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        user-select: none;
      ">
        <svg width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
          <path d="M15 11v11" />
          <path d="M5 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2" />
          <path d="M8 9v13" />
        </svg>
      </div>
    `,
    anchor: (window as any).naver?.maps?.Point
      ? new (window as any).naver.maps.Point(size / 2, size / 2)
      : { x: size / 2, y: size / 2 },
  };
}

function NaverMapLayer({
  activeNeighborhood,
  businesses,
  currentLocation,
  centerRequest,
  selectedCategory,
  selectedRestaurantId,
  onSelectBusiness,
  onSelectRestaurants,
  onRestaurantsLoaded,
  onClearRestaurants,
  onSearchBounds,
}: {
  activeNeighborhood: string;
  businesses: LocalBusiness[];
  currentLocation: { lat: number; lng: number } | null;
  centerRequest: number;
  selectedCategory?: string;
  selectedRestaurantId?: string | null;
  onSelectBusiness: (business: LocalBusiness) => void;
  onSelectRestaurants: (restaurants: Restaurant[], singleId: string | null) => void;
  onRestaurantsLoaded: (restaurants: Restaurant[]) => void;
  onClearRestaurants: () => void;
  onSearchBounds: (bounds: MapSearchBounds) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const [isNaverMapReady, setIsNaverMapReady] = useState(false);
  const [isZoomTooLow, setIsZoomTooLow] = useState(false);
  const canUseNaverMap = Boolean(NAVER_MAP_KEY_ID && isNaverMapReady);

  // Restaurant Layer 관리용 Refs
  const isRestaurantMode = selectedCategory === "food";
  const restaurantMarkersRef = useRef<any[]>([]);
  const restaurantMarkerMapRef = useRef<Map<any, Restaurant>>(new Map());
  const restaurantClusterRef = useRef<MarkerClustering | null>(null);
  const restaurantRequestIdRef = useRef<number>(0);
  const previousBoundsRef = useRef<{ swLat: number; swLng: number; neLat: number; neLng: number } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stable callback refs to decouple from effect cleanup/re-renders
  const onSelectRestaurantsRef = useRef(onSelectRestaurants);
  const onRestaurantsLoadedRef = useRef(onRestaurantsLoaded);
  const onClearRestaurantsRef = useRef(onClearRestaurants);

  useEffect(() => {
    onSelectRestaurantsRef.current = onSelectRestaurants;
    onRestaurantsLoadedRef.current = onRestaurantsLoaded;
    onClearRestaurantsRef.current = onClearRestaurants;
  }, [onSelectRestaurants, onRestaurantsLoaded, onClearRestaurants]);

  const RESTAURANT_MIN_ZOOM = 13;

  useEffect(() => {
    if (!NAVER_MAP_KEY_ID) {
      return;
    }

    let isMounted = true;
    loadNaverMapScript(NAVER_MAP_KEY_ID)
      .then(() => {
        if (isMounted) {
          setIsNaverMapReady(Boolean(window.naver?.maps));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsNaverMapReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    const maps = window.naver?.maps;
    if (!mapElement || !maps || !canUseNaverMap) {
      return;
    }

    const centerCoord = currentLocation ?? NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
    const center = new maps.LatLng(centerCoord.lat, centerCoord.lng);

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElement, {
        center,
        zoom: 15,
        logoControl: false,
        mapDataControl: false,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(15);
    }

    const placeMarker = new maps.Marker({
      position: center,
      map: mapRef.current,
      title: "내 장소",
      opacity: 0.8,
      zIndex: 100,
    });
    return () => placeMarker.setMap(null);
  }, [activeNeighborhood, currentLocation, centerRequest, canUseNaverMap]);

  // 위험 신호 및 일반 비즈니스 마커
  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !canUseNaverMap || isRestaurantMode) return;

    markerRefs.current = businesses.map((business) => {
      const visual = getDangerVisual(business);
      const marker = new maps.Marker({
        position: new maps.LatLng(business.lat, business.lng),
        map,
        title: business.name,
        zIndex: visual ? 80 : 20,
        icon: visual ? { content: createDangerMarkerContent(business, visual, onSelectBusiness) } : undefined,
      });
      if (visual) maps.Event?.addListener(marker, "click", () => onSelectBusiness(business));
      return marker;
    });
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [businesses, canUseNaverMap, onSelectBusiness, isRestaurantMode]);

  // 음식점 전용 마커 & MarkerClustering & idle 디바운스 로직
  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !canUseNaverMap || !isRestaurantMode) {
      // 음식점 모드가 아닐 때 cleanup
      if (restaurantClusterRef.current) {
        restaurantClusterRef.current.clear();
        restaurantClusterRef.current = null;
      }
      restaurantMarkersRef.current.forEach((m) => m.setMap(null));
      restaurantMarkersRef.current = [];
      restaurantMarkerMapRef.current.clear();
      previousBoundsRef.current = null;
      setIsZoomTooLow(false);
      return;
    }

    // 지도 빈 공간 클릭 시 음식점 선택 해제
    const mapClickListener = maps.Event?.addListener(map, "click", () => {
      onClearRestaurantsRef.current();
    });

    const fetchRestaurantsForCurrentBounds = () => {
      const zoom = map.getZoom();
      if (zoom < RESTAURANT_MIN_ZOOM) {
        setIsZoomTooLow(true);
        onRestaurantsLoadedRef.current([]);
        if (restaurantClusterRef.current) {
          restaurantClusterRef.current.clear();
          restaurantClusterRef.current = null;
        }
        restaurantMarkersRef.current.forEach((m) => m.setMap(null));
        restaurantMarkersRef.current = [];
        restaurantMarkerMapRef.current.clear();
        return;
      }

      setIsZoomTooLow(false);
      const bounds = map.getBounds();
      if (!bounds) return;

      const sw = bounds.getSW();
      const ne = bounds.getNE();
      const swLat = sw.lat();
      const swLng = sw.lng();
      const neLat = ne.lat();
      const neLng = ne.lng();

      // Bounds가 거의 변하지 않았고 이미 마커가 있으면 스킵
      const prev = previousBoundsRef.current;
      if (
        prev &&
        restaurantMarkersRef.current.length > 0 &&
        Math.abs(prev.swLat - swLat) < 0.0001 &&
        Math.abs(prev.swLng - swLng) < 0.0001 &&
        Math.abs(prev.neLat - neLat) < 0.0001 &&
        Math.abs(prev.neLng - neLng) < 0.0001
      ) {
        return;
      }
      previousBoundsRef.current = { swLat, swLng, neLat, neLng };

      const requestId = ++restaurantRequestIdRef.current;

      getRestaurantsByBounds({ swLat, swLng, neLat, neLng, limit: 300 }).then((restaurants) => {
        if (requestId !== restaurantRequestIdRef.current) return;
        onRestaurantsLoadedRef.current(restaurants);

        // 기존 마커 및 클러스터 정리
        if (restaurantClusterRef.current) {
          restaurantClusterRef.current.clear();
          restaurantClusterRef.current = null;
        }
        restaurantMarkersRef.current.forEach((m) => m.setMap(null));
        restaurantMarkersRef.current = [];
        restaurantMarkerMapRef.current.clear();

        const newMarkers: any[] = [];

        restaurants.forEach((restaurant) => {
          const isSelected = selectedRestaurantId === restaurant.id;
          const marker = new maps.Marker({
            position: new maps.LatLng(restaurant.lat, restaurant.lng),
            map,
            title: restaurant.name,
            zIndex: isSelected ? 1000 : 50,
            icon: createRestaurantMarkerIcon(isSelected),
          });

          maps.Event?.addListener(marker, "click", (e: any) => {
            if (e?.domEvent) {
              e.domEvent.stopPropagation();
            }
            onSelectRestaurantsRef.current([restaurant], restaurant.id);
          });

          restaurantMarkerMapRef.current.set(marker, restaurant);
          newMarkers.push(marker);
        });

        restaurantMarkersRef.current = newMarkers;

        // MarkerClustering 활성화
        restaurantClusterRef.current = new MarkerClustering({
          map,
          markers: newMarkers,
          minClusterSize: 2,
          gridSize: 70,
          averageCenter: true,
          disableClickZoom: true,
          onClusterClick: (_cluster, clusterMarkers) => {
            const list = clusterMarkers
              .map((m) => restaurantMarkerMapRef.current.get(m))
              .filter(Boolean) as Restaurant[];
            if (list.length > 0) {
              onSelectRestaurantsRef.current(list, null);
            }
          },
        });
      });
    };

    // 지도 idle 이벤트 리스너 (350ms debounce)
    const idleListener = maps.Event?.addListener(map, "idle", () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchRestaurantsForCurrentBounds();
      }, 350);
    });

    // 최초 1회 즉시 실행
    fetchRestaurantsForCurrentBounds();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (idleListener && maps.Event) {
        maps.Event.removeListener(idleListener);
      }
      if (mapClickListener && maps.Event) {
        maps.Event.removeListener(mapClickListener);
      }
      if (restaurantClusterRef.current) {
        restaurantClusterRef.current.clear();
        restaurantClusterRef.current = null;
      }
      restaurantMarkersRef.current.forEach((m) => m.setMap(null));
      restaurantMarkersRef.current = [];
      restaurantMarkerMapRef.current.clear();
      previousBoundsRef.current = null;
    };
  }, [isRestaurantMode, canUseNaverMap]);

  // 선택된 마커 시각적 강조 변경 (selectedRestaurantId 변경 시)
  useEffect(() => {
    if (!isRestaurantMode) return;
    restaurantMarkersRef.current.forEach((marker) => {
      const rest = restaurantMarkerMapRef.current.get(marker);
      if (!rest) return;
      const isSelected = rest.id === selectedRestaurantId;
      marker.setIcon(createRestaurantMarkerIcon(isSelected));
      marker.setZIndex(isSelected ? 1000 : 50);
    });
  }, [selectedRestaurantId, isRestaurantMode]);

  return (
    <>
      <div className={styles.naverMapFrame}>
        <div ref={mapElementRef} className={styles.naverMapLayer} aria-hidden={!canUseNaverMap} />
      </div>
      {isZoomTooLow && isRestaurantMode && (
        <div className={styles.restaurantZoomAlert} role="status">
          <span>🔍</span> 지도를 확대하면 음식점이 표시됩니다.
        </div>
      )}
      {!canUseNaverMap ? (
        <>
          <div className={styles.mapGrid} />
          <FallbackDangerMarkers
            activeNeighborhood={activeNeighborhood}
            businesses={businesses}
            onSelectBusiness={onSelectBusiness}
          />
        </>
      ) : null}
      <button
        type="button"
        className={styles.mapSearchAgain}
        disabled={!canUseNaverMap}
        title={canUseNaverMap ? "현재 지도 범위에서 검색" : "지도를 불러오는 중"}
        onClick={() => {
          const bounds = mapRef.current?.getBounds();
          if (!bounds) return;
          const sw = bounds.getSW();
          const ne = bounds.getNE();
          onSearchBounds({ south: sw.lat(), north: ne.lat(), west: sw.lng(), east: ne.lng() });
        }}
      >
        현 지도에서 검색
      </button>
    </>
  );
}

function RestaurantPreviewBar({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  onClose,
}: {
  restaurants: Restaurant[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.restaurantPreviewBar} role="region" aria-label="음식점 목록">
      <button
        type="button"
        className={styles.restaurantPreviewCloseBtn}
        onClick={onClose}
        aria-label="닫기"
      >
        ✕
      </button>
      {restaurants.map((restaurant) => {
        const isSelected = restaurant.id === selectedRestaurantId;
        const detailUrl = getKakaoPlaceUrl(restaurant);
        const thumb = restaurant.imageUrl || restaurant.thumbnailUrl;

        return (
          <article
            key={restaurant.id}
            className={`${styles.restaurantCard} ${isSelected ? styles.restaurantCardSelected : ""}`}
            onClick={() => onSelectRestaurant(restaurant)}
          >
            <div className={styles.restaurantCardHeader}>
              {thumb ? (
                <div className={styles.restaurantCardThumb}>
                  <img
                    src={thumb}
                    alt={restaurant.name}
                    className={styles.restaurantCardImg}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className={styles.restaurantCardThumbFallback}>
                  🍴
                </div>
              )}
              <div className={styles.restaurantCardInfo}>
                <h4 className={styles.restaurantCardTitle}>{restaurant.name}</h4>
                <span className={styles.restaurantCardCategory}>{restaurant.category || "음식점"}</span>
              </div>
            </div>
            <p className={styles.restaurantCardAddress}>{restaurant.roadAddress || restaurant.address || "주소 정보 없음"}</p>
            <div className={styles.restaurantCardFooter}>
              <span className={styles.restaurantCardRating}>
                {restaurant.phone ? `${restaurant.phone}` : `★ ${restaurant.rating ? restaurant.rating.toFixed(1) : "4.5"}`}
              </span>
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.restaurantCardDetailLink}
                onClick={(e) => e.stopPropagation()}
              >
                상세보기 ›
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}



function createDangerMarkerContent(
  business: LocalBusiness,
  visual: DangerVisual,
  onSelectBusiness: (business: LocalBusiness) => void,
) {
  const marker = document.createElement("div");
  const toneClass = styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? "";
  marker.className = `${styles.dangerMapMarker} ${toneClass}`;
  marker.tabIndex = 0;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `${visual.label}: ${business.name}`);
  marker.innerHTML = `<span>${visual.emoji}</span>`;
  marker.addEventListener("click", () => onSelectBusiness(business));
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectBusiness(business);
  });
  return marker;
}

function FallbackDangerMarkers({
  activeNeighborhood,
  businesses,
  onSelectBusiness,
}: {
  activeNeighborhood: string;
  businesses: LocalBusiness[];
  onSelectBusiness: (business: LocalBusiness) => void;
}) {
  const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
  const dangerBusinesses = businesses.filter((business) => business.category === "danger").slice(0, 18);

  return (
    <div className={styles.fallbackMarkers}>
      {dangerBusinesses.map((business) => {
        const visual = getDangerVisual(business) ?? DANGER_VISUALS.default;
        const x = Math.min(92, Math.max(8, 50 + (business.lng - center.lng) * 4200));
        const y = Math.min(88, Math.max(12, 50 - (business.lat - center.lat) * 5200));
        return (
          <button
            type="button"
            key={business.id}
            className={`${styles.dangerMapMarker} ${styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? ""}`}
            aria-label={`${visual.label}: ${business.name}`}
            onClick={() => onSelectBusiness(business)}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span>{visual.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

function DangerSignalCallout({ business, onClose }: { business: LocalBusiness; onClose: () => void }) {
  const visual = getDangerVisual(business) ?? DANGER_VISUALS.default;
  const toneClass = styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? "";
  const meta = [business.riskType ?? visual.label, business.neighborhoodName, business.distance].filter(Boolean).join(" · ");

  return (
    <aside className={`${styles.dangerCallout} ${toneClass}`} role="status" aria-live="polite">
      <span className={styles.dangerCalloutAvatar} aria-hidden="true">{visual.emoji}</span>
      <div className={styles.dangerCalloutBubble}>
        <div className={styles.dangerCalloutTop}>
          <span>안전 알림</span>
          <button type="button" onClick={onClose} aria-label="위험 알림 닫기">
            <X size={16} />
          </button>
        </div>
        <strong>{business.name}</strong>
        <p>{business.summary}</p>
        <small>{meta}</small>
      </div>
    </aside>
  );
}

function ChatsScreen({
  rooms,
  activeFilter,
  isLoading,
  unreadCount,
  onFilterChange,
  onOpenNotifications,
  onOpenSettings,
  onOpenChat,
  title = "채팅",
  onBack,
}: {
  rooms: ChatRoom[];
  activeFilter: string;
  isLoading: boolean;
  unreadCount: number;
  onFilterChange: (filter: string) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenChat: (id: string) => void;
  title?: string;
  onBack?: () => void;
}) {
  // onBack이 있으면 "내 상품에 걸린 채팅만" 보는 필터링된 화면 —
  // 하단탭의 전체 채팅 목록과 헷갈리지 않게 뒤로가기와 전용 타이틀을 보여주고,
  // 여기선 의미 없는 필터/프로모 배너는 생략한다.
  const scoped = Boolean(onBack);
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title={title}
        compact={scoped}
        leading={
          scoped ? (
            <IconButton label="뒤로" onClick={onBack}>
              <ChevronLeft size={27} />
            </IconButton>
          ) : undefined
        }
        actions={
          scoped ? undefined : (
            <>
              <IconButton label="채팅 알림" onClick={onOpenNotifications}>
                <Bell size={28} />
                {unreadCount > 0 && <span className={styles.notificationDot} />}
              </IconButton>
              <IconButton label="설정" onClick={onOpenSettings}>
                <Settings size={29} />
              </IconButton>
            </>
          )
        }
      />
      {!scoped && (
        <>
          <div className={styles.filterLine}>
            <button type="button" className={styles.roundTool} aria-label="필터 설정">
              <SlidersHorizontal size={23} />
            </button>
            <ChipScroller items={CHAT_FILTERS} value={activeFilter} onChange={onFilterChange} />
          </div>
          <div className={styles.chatPromo}>
            <strong>가지마켓 동네 혜택</strong>
            <span>위례에서 이번 주 사용할 수 있는 쿠폰을 확인하세요</span>
          </div>
        </>
      )}
      {isLoading ? (
        <ChatSkeletonList />
      ) : rooms.length === 0 ? (
        scoped ? (
          <StateBlock title="아직 문의한 사람이 없어요" body="구매를 원하는 분이 채팅을 걸면 여기에 표시돼요." />
        ) : (
          <StateBlock
            title="해당 채팅이 없어요"
            body="다른 필터를 선택하거나 새 거래를 시작해보세요."
            actionLabel="전체 보기"
            onAction={() => onFilterChange("전체")}
          />
        )
      ) : (
        <div className={styles.chatList}>
          {rooms.map((room) => (
            <button type="button" key={room.id} className={styles.chatRow} onClick={() => onOpenChat(room.id)}>
              <Avatar tone={room.avatarTone} />
              <div>
                <h2 className={room.unreadCount > 0 ? styles.unreadTitle : ""}>
                  {room.title}
                  {room.verified && <CheckCircle2 size={18} className={styles.verified} fill="currentColor" />}
                  <span>{room.lastMessageAt}</span>
                </h2>
                <p>{room.lastMessage}</p>
              </div>
              {room.unreadCount > 0 && <span className={styles.unreadBadge}>{formatBadge(room.unreadCount)}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ChatSkeletonList() {
  return (
    <div className={styles.chatList}>
      {[0, 1, 2, 3].map((item) => (
        <div className={styles.skeletonChat} key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

const chatReportReasons = ["사기 의심돼요", "비매너 및 욕설/비방", "거래 약속을 안 지켜요", "기타 사유"];

function ChatRoomScreen({
  room,
  product,
  messages,
  draft,
  onDraftChange,
  onSubmit,
  onBack,
  otherUserId,
  onLeave,
  onUpdateStatus,
  onBlock,
  onReport,
}: {
  room: ChatRoom;
  product?: ProductListItem;
  messages: typeof baseMessages;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  otherUserId?: number;
  onLeave: () => void;
  onUpdateStatus: (tradeStatus: ChatTradeStatus) => void;
  onBlock: (userId: number) => void;
  onReport: (userId: number, reason: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState(chatReportReasons[0]);

  return (
    <section className={styles.chatRoomScreen}>
      <ScreenHeader
        title={room.title}
        compact
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <IconButton label="채팅 메뉴" onClick={() => setShowMenu(true)}>
            <Menu size={25} />
          </IconButton>
        }
      />
      {showMenu && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowMenu(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            {room.tradeRole === "SELLER" && (
              <div className={styles.segmented}>
                {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={product?.tradeStatus === status ? styles.segmentActive : ""}
                    onClick={() => {
                      setShowMenu(false);
                      onUpdateStatus(status);
                    }}
                  >
                    {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "거래완료"}
                  </button>
                ))}
              </div>
            )}
            {otherUserId !== undefined && (
              <div className={styles.productActionGroup}>
                <button
                  type="button"
                  className={styles.productActionBtn}
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm("이 사람을 차단하시겠어요?")) onBlock(otherUserId);
                  }}
                >
                  <ShieldAlert size={22} />
                  <span>차단하기</span>
                </button>
                <button
                  type="button"
                  className={styles.productActionBtn}
                  onClick={() => {
                    setShowMenu(false);
                    setShowReport(true);
                  }}
                >
                  <MessageCircle size={22} />
                  <span>신고하기</span>
                </button>
              </div>
            )}
            <div className={styles.productActionGroup}>
              <button
                type="button"
                className={`${styles.productActionBtn} ${styles.productActionReport}`}
                onClick={() => {
                  setShowMenu(false);
                  if (window.confirm("채팅방을 나가시겠어요? 대화 내용을 더 이상 볼 수 없어요.")) onLeave();
                }}
              >
                <LogOut size={22} />
                <span>채팅방 나가기</span>
              </button>
            </div>
            <button type="button" className={styles.productActionCloseBtn} onClick={() => setShowMenu(false)}>
              닫기
            </button>
          </div>
        </>
      )}
      {showReport && otherUserId !== undefined && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowReport(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 800 }}>신고 사유를 선택해주세요</h3>
            <div className={styles.reportReasonList}>
              {chatReportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`${styles.reportReasonItem} ${reportReason === reason ? styles.reportReasonItemSelected : ""}`}
                  onClick={() => setReportReason(reason)}
                >
                  <span>{reason}</span>
                  {reportReason === reason && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.albaDetailApplyBtn}
              style={{ width: "100%", height: "48px" }}
              onClick={() => {
                setShowReport(false);
                onReport(otherUserId, reportReason);
              }}
            >
              신고 제출하기
            </button>
            <button type="button" className={styles.productActionCloseBtn} onClick={() => setShowReport(false)}>
              취소
            </button>
          </div>
        </>
      )}
      {product && (
        <div className={styles.chatProductCard}>
          <Thumbnail tone={product.thumbnailTone} label={product.thumbnailLabel} />
          <div>
            <h2>{product.title}</h2>
            <span>
              {product.tradeStatus === "RESERVED" ? "예약중" : product.tradeStatus === "SOLD" ? "거래완료" : "판매중"} ·{" "}
              {formatPrice(product)}
            </span>
          </div>
        </div>
      )}
      <div className={styles.messageStack}>
        {messages.map((message, index) => (
          <div key={`${message.text}-${index}`} className={message.mine ? styles.messageMine : styles.messageOther}>
            <p>{message.text}</p>
            <span>{message.time}</span>
          </div>
        ))}
      </div>
      <form className={styles.messageComposer} onSubmit={onSubmit}>
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="메시지를 입력하세요"
        />
        <button type="submit" aria-label="보내기">
          <Send size={20} />
        </button>
      </form>
    </section>
  );
}

function MyScreen({
  nickname,
  activeNeighborhood,
  unreadCount,
  favoriteCount,
  myProducts,
  onOpenSettings,
  onOpenMenu,
  onOpenAllServices,
  onOpenDream,
  onOpenAlba,
  onOpenSales,
  onOpenFavorites,
  onOpenApartment,
}: {
  nickname?: string;
  activeNeighborhood: string;
  unreadCount: number;
  favoriteCount: number;
  myProducts: ProductListItem[];
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  onOpenAllServices: () => void;
  onOpenDream: () => void;
  onOpenAlba: () => void;
  onOpenSales: () => void;
  onOpenFavorites: () => void;
  onOpenApartment?: () => void;
}) {
  const services: IconItem[] = [
    { label: "중고거래", icon: ShoppingBag, tone: "primary", onClick: onOpenSales },
    { label: "모임", icon: UsersRound, tone: "primary" },
    { label: "내 아파트", icon: Building2, tone: "primary", onClick: onOpenApartment },
    { label: "포장주문", icon: Utensils, tone: "amber" },
    { label: "동네걷기", icon: Dumbbell, tone: "yellow" },
    { label: "세탁 수거", icon: Shirt, tone: "cyan" },
    { label: "가지알바", icon: BriefcaseBusiness, tone: "primary", onClick: onOpenAlba },
    { label: "전체보기", icon: ChevronRight, tone: "muted", onClick: onOpenAllServices },
  ];

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="나의 가지"
        titleAccessory={
          <button type="button" className={styles.dreamEntryButton} onClick={onOpenDream} aria-label="꿈가지">
            <span className={styles.dreamEntryLabel} aria-hidden="true">
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
            </span>
            <Image src="/dream/baby-elephant.png" alt="" width={36} height={29} className={styles.dreamEntryMascot} />
          </button>
        }
        actions={
          <IconButton label="설정" onClick={onOpenSettings}>
            <Settings size={31} />
          </IconButton>
        }
      />
      <PromoCard />
      <button type="button" className={styles.profileCard} onClick={onOpenMenu}>
        <div className={styles.profileAvatar}>
          <UserRound size={42} fill="currentColor" />
        </div>
        <div>
          <strong>{nickname ? `${nickname}님` : "주황가지님"}</strong>
          <span>{activeNeighborhood} · 신뢰온도</span>
        </div>
        <span className={styles.temperature}>40.1°C</span>
        <ChevronRight size={26} />
      </button>
      <section className={styles.payCard}>
        <div className={styles.payHeader}>
          <BrandWordmark />
          <button type="button">충전</button>
          <button type="button">송금</button>
          <button type="button" className={styles.payButton}>
            <QrCode size={19} /> 결제
          </button>
        </div>
        <div className={styles.payBalance}>
          <button type="button">
            머니 <strong>0원</strong> <ChevronRight size={18} />
          </button>
          <button type="button">
            포인트 <strong>44원</strong> <ChevronRight size={18} />
          </button>
        </div>
      </section>
      <IconGrid items={services} />
      <section className={styles.quickStats}>
        <button type="button" onClick={onOpenFavorites}>
          <Heart size={31} />
          관심목록
          <strong>{favoriteCount}</strong>
        </button>
        <button type="button">
          <Clock3 size={31} />
          최근 본
          <strong>8</strong>
        </button>
        <button type="button">
          <Gem size={31} />
          혜택
          <strong>{unreadCount > 0 ? unreadCount : 1}</strong>
        </button>
      </section>
      <MenuCard
        title="자주 사용"
        items={[
          { label: "판매관리", icon: ReceiptText, onClick: onOpenSales, trailing: `${myProducts.length}` },
          { label: "관심목록", icon: Heart, onClick: onOpenFavorites, trailing: `${favoriteCount}` },
        ]}
      />
    </section>
  );
}

function DreamDashboardScreen({
  activeNeighborhood,
  onBack,
  onChangeNeighborhood,
  onOpenNotice,
}: {
  activeNeighborhood: string;
  onBack: () => void;
  onChangeNeighborhood: () => void;
  onOpenNotice: () => void;
}) {
  const facilityListRef = useRef<HTMLElement | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const visibleFacilities = useMemo(
    () => DREAM_FACILITIES.filter((facility) => facility.neighborhoodName === activeNeighborhood),
    [activeNeighborhood],
  );
  const visibleSelectedFacilityId = visibleFacilities.some((facility) => facility.id === selectedFacilityId)
    ? selectedFacilityId
    : null;
  const selectedFacility = visibleFacilities.find((facility) => facility.id === visibleSelectedFacilityId) ?? null;
  const selectFacility = useCallback((facility: DonationFacility | null) => {
    setSelectedFacilityId(facility ? facility.id : null);
  }, []);
  const totalCurrentAmount = visibleFacilities.reduce((sum, facility) => sum + facility.currentAmount, 0);
  const totalTargetAmount = visibleFacilities.reduce((sum, facility) => sum + facility.targetAmount, 0);
  const totalDonationCount = visibleFacilities.reduce((sum, facility) => sum + facility.donationCount, 0);
  const neighborhoodProgress = totalTargetAmount > 0 ? Math.round((totalCurrentAmount / totalTargetAmount) * 100) : 0;

  return (
    <section className={`${styles.screen} ${styles.dreamScreen}`}>
      <ScreenHeader
        title="꿈가지"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <button
        type="button"
        className={styles.dreamBanner}
        aria-label="꿈가지 나눔 캠페인 공지사항 보기"
        onClick={onOpenNotice}
      >
        <Image
          src="/dream/dream-main-banner.png"
          alt="우리 동네와 함께, 꿈가지. 작은 나눔이 모여 꿈이 자라요"
          width={1940}
          height={809}
          className={styles.dreamBannerImage}
          priority
        />
      </button>
      <section className={styles.dreamMapPanel}>
        <DreamMapLayer
          activeNeighborhood={activeNeighborhood}
          facilities={visibleFacilities}
          selectedFacility={selectedFacility}
          onSelectFacility={selectFacility}
        />
        <button type="button" className={styles.dreamMapTitle} onClick={onChangeNeighborhood} aria-label={`모금 지역 변경, 현재 ${activeNeighborhood}`}>
          <span className={styles.dreamMapTitleCopy}>
            <span>우리 동네 모금가지</span>
            <strong>{activeNeighborhood === "송파삼성래미안" ? "송파구" : activeNeighborhood}</strong>
            <small>{activeNeighborhood === "송파삼성래미안" ? "송파나루역 - 송파삼성래미안" : "우리 동네 나눔 소식"}</small>
          </span>
          <ChevronRight size={24} aria-hidden="true" />
        </button>
        <div className={styles.dreamSummaryDock} aria-label="꿈가지 요약">
          <div className={styles.dreamSummaryItem}>
            <span>기부 참여</span>
            <strong>{totalDonationCount}<small>회</small></strong>
          </div>
          <div className={styles.dreamSummaryItem}>
            <span>동네 기부 진행률</span>
            <strong>{neighborhoodProgress}%</strong>
            <div className={styles.dreamProgressTrack} role="progressbar" aria-label="동네 기부 진행률" aria-valuenow={Math.min(neighborhoodProgress, 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.min(neighborhoodProgress, 100)}%` }} />
            </div>
          </div>
        </div>
      </section>
      <section ref={facilityListRef} className={styles.dreamFacilityCard} aria-label="시설별 모금 현황">
        <div className={styles.dreamFacilityHeading}>
          <h2>함께 키우는 우리 동네 꿈</h2>
          <span>{visibleFacilities.length}곳</span>
        </div>
        {visibleFacilities.length === 0 && <p className={styles.dreamEmpty}>아직 이 동네에서 진행 중인 모금이 없어요.</p>}
        {visibleFacilities.map((facility) => {
          const progress = Math.round((facility.currentAmount / facility.targetAmount) * 100);
          return (
            <button
              type="button"
              key={facility.id}
              className={`${styles.dreamFacilityItem} ${facility.id === visibleSelectedFacilityId ? styles.dreamFacilitySelected : ""}`}
              onClick={() => selectFacility(facility)}
            >
              <div>
                <strong>{facility.name}</strong>
                <span>{facility.facilityType} - 현재 모금액 {facility.currentAmount.toLocaleString()}원</span>
              </div>
              <em>{progress}%</em>
              <div className={styles.dreamProgressTrack} role="progressbar" aria-label={`${facility.name} 모금 진행률`} aria-valuenow={Math.min(progress, 100)} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </button>
          );
        })}
      </section>
    </section>
  );
}

function DreamFacilityCallout({
  facility,
  onClose,
}: {
  facility: DonationFacility;
  onClose: () => void;
}) {
  const progress = Math.round((facility.currentAmount / facility.targetAmount) * 100);
  return (
    <aside className={styles.dreamFacilityCallout} role="dialog" aria-label={`${facility.name} 상세 정보`}>
      <div className={styles.dreamFacilityCalloutTop}>
        <span className={styles.dreamFacilityCalloutBadge}>
          <Image src="/dream/baby-elephant.png" alt="" width={20} height={16} style={{ objectFit: "contain" }} />
          꿈가지 나눔 시설
        </span>
        <button type="button" onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <strong>{facility.name}</strong>
      <p>{facility.facilityType} · {facility.neighborhoodName}</p>
      <div className={styles.dreamFacilityCalloutStats}>
        <div>
          <span>현재 모금액</span>
          <strong>{facility.currentAmount.toLocaleString()}원</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span>목표액</span>
          <strong>{facility.targetAmount.toLocaleString()}원</strong>
        </div>
      </div>
      <div className={styles.dreamProgressTrack} role="progressbar" aria-valuenow={Math.min(progress, 100)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className={styles.dreamFacilityCalloutFooter}>
        <small>{facility.donationCount}명의 이웃이 함께 참여했어요</small>
        <em>{progress}%</em>
      </div>
    </aside>
  );
}

function DreamMapLayer({
  activeNeighborhood,
  facilities,
  selectedFacility,
  onSelectFacility,
}: {
  activeNeighborhood: string;
  facilities: DonationFacility[];
  selectedFacility: DonationFacility | null;
  onSelectFacility: (facility: DonationFacility | null) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlayRefs = useRef<any[]>([]);
  const [isKakaoMapReady, setIsKakaoMapReady] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const canUseKakaoMap = Boolean(KAKAO_MAP_KEY && isKakaoMapReady);

  useEffect(() => {
    if (!KAKAO_MAP_KEY) return;
    let isMounted = true;
    loadKakaoMapScript(KAKAO_MAP_KEY)
      .then(() => {
        if (isMounted) setIsKakaoMapReady(Boolean((window as any).kakao?.maps?.Map));
      })
      .catch(() => {
        if (isMounted) {
          setIsKakaoMapReady(false);
          setHasMapError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const kakao = (window as any).kakao;
    const mapElement = mapElementRef.current;
    if (!mapElement || !kakao?.maps?.Map || !canUseKakaoMap) return;

    const centerCoord = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
    const center = new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng);
    const level = 4;

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(mapElement, {
        center,
        level,
      });

      kakao.maps.event.addListener(mapRef.current, "click", () => {
        onSelectFacility(null);
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setLevel(level);
    }
  }, [activeNeighborhood, canUseKakaoMap]);

  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map || !canUseKakaoMap) return;

    overlayRefs.current.forEach((overlay) => overlay.setMap(null));
    overlayRefs.current = [];

    const newOverlays: any[] = [];
    facilities.forEach((facility) => {
      const isSelected = facility.id === selectedFacility?.id;
      const content = createDreamFacilityMarkerContent(facility, isSelected, onSelectFacility);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(facility.lat, facility.lng),
        content,
        yAnchor: 1.0,
        zIndex: isSelected ? 100 : 50,
      });
      overlay.setMap(map);
      newOverlays.push(overlay);
    });

    overlayRefs.current = newOverlays;

    return () => {
      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      overlayRefs.current = [];
    };
  }, [facilities, selectedFacility, canUseKakaoMap, onSelectFacility]);

  return (
    <div className={styles.dreamMapCanvas}>
      <div className={styles.kakaoMapFrame}>
        <div ref={mapElementRef} className={styles.kakaoMapLayer} aria-hidden={!canUseKakaoMap} />
      </div>
      {selectedFacility && (
        <DreamFacilityCallout
          facility={selectedFacility}
          onClose={() => onSelectFacility(null)}
        />
      )}
      {!canUseKakaoMap && (
        <div className={styles.dreamMapUnavailable} role="status">
          <MapPinned size={28} />
          <span>{hasMapError ? "지도를 불러오지 못했어요" : "지도를 연결하고 있어요"}</span>
          <small>모금 현황은 아래에서 확인할 수 있어요.</small>
        </div>
      )}
      <button
        type="button"
        className={styles.dreamMapRecenter}
        aria-label="우리 동네 위치로"
        title="우리 동네 위치로"
        disabled={!canUseKakaoMap}
        onClick={() => {
          const kakao = (window as any).kakao;
          const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
          if (!kakao?.maps || !mapRef.current) return;
          mapRef.current.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
          mapRef.current.setLevel(4);
        }}
      >
        <Crosshair size={22} />
      </button>
    </div>
  );
}

function createDreamFacilityMarkerContent(
  facility: DonationFacility,
  selected: boolean,
  onSelectFacility: (facility: DonationFacility | null) => void,
) {
  const marker = document.createElement("span");
  marker.className = `${styles.dreamFacilityPin} ${styles.dreamLivePin} ${selected ? styles.dreamFacilityPinSelected : ""}`;
  marker.tabIndex = 0;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `${facility.name} 모금 현황`);

  const mascot = document.createElement("span");
  mascot.className = styles.dreamFacilityPinMascot;
  const image = document.createElement("img");
  image.src = "/dream/baby-elephant.png";
  image.alt = "";
  mascot.append(image);

  const label = document.createElement("span");
  label.className = styles.dreamFacilityPinLabel;
  label.textContent = facility.name;

  if (selected) marker.append(label);
  marker.append(mascot);
  marker.addEventListener("click", () => onSelectFacility(selected ? null : facility));
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectFacility(selected ? null : facility);
  });
  return marker;
}

function PromoCard() {
  return (
    <div className={styles.promoCard}>
      <div className={styles.promoThumb}>
        <CakeSlice size={28} />
      </div>
      <div>
        <strong>가지X동네 베이커리 콜라보 출시</strong>
        <span>포장주문하면 4천원 할인까지</span>
      </div>
      <button type="button" aria-label="닫기">
        <X size={25} />
      </button>
    </div>
  );
}

function IconGrid({ items }: { items: IconItem[] }) {
  return (
    <section className={styles.iconGrid}>
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <button type="button" key={item.label} onClick={item.onClick}>
            <span className={`${styles.gridIcon} ${styles[`grid_${item.tone ?? "primary"}` as keyof typeof styles] ?? ""}`}>
              <ItemIcon size={31} />
            </span>
            {item.label}
          </button>
        );
      })}
    </section>
  );
}

function MenuCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; icon: LucideIcon; onClick?: () => void; trailing?: string }>;
}) {
  return (
    <section className={styles.menuCard}>
      <h2>{title}</h2>
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <button type="button" key={item.label} onClick={item.onClick}>
            <ItemIcon size={28} />
            <span>{item.label}</span>
            {item.trailing && <strong>{item.trailing}</strong>}
            <ChevronRight size={24} />
          </button>
        );
      })}
    </section>
  );
}

function MyMenuScreen({
  onBack,
  onOpenAlba,
}: {
  onBack: () => void;
  onOpenAlba?: (tab: "manage") => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="나의 가지"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <IconButton label="설정">
            <Settings size={29} />
          </IconButton>
        }
      />
      <MenuCard
        title="나의 거래"
        items={[
          { label: "판매관리", icon: ReceiptText },
          { label: "구매내역", icon: ShoppingBasket },
          { label: "내 물건 가격 찾기", icon: Sparkles },
          { label: "중고거래 가격뷰", icon: BookOpen },
        ]}
      />
      <MenuCard
        title="나의 관심"
        items={[
          { label: "관심목록", icon: Heart },
          { label: "키워드 알림 설정", icon: Tag },
        ]}
      />
      <MenuCard
        title="나의 활동"
        items={[
          { label: "알바 구인 공고", icon: NotebookTabs, onClick: () => onOpenAlba?.("manage") },
          { label: "선생님 프로필 관리", icon: GraduationCap },
          { label: "참여중인 모임", icon: UsersRound },
          { label: "내 동네생활 글", icon: ReceiptText },
        ]}
      />
      <MenuCard
        title="나의 비즈니스"
        items={[
          { label: "비즈니스 프로필", icon: ShieldCheck },
          { label: "광고 관리", icon: BadgePercent },
          { label: "업체 관리", icon: Store },
        ]}
      />
    </section>
  );
}

function SettingsScreen({
  theme,
  onThemeChange,
  onBack,
  locationAllowed,
  isGuestMode,
  hasNetworkError,
  onLocationToggle,
  onGuestToggle,
  onNetworkErrorToggle,
  onLogout,
}: {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onBack: () => void;
  locationAllowed: boolean;
  isGuestMode: boolean;
  hasNetworkError: boolean;
  onLocationToggle: () => void;
  onGuestToggle: () => void;
  onNetworkErrorToggle: () => void;
  onLogout: () => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="설정"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <fieldset className={styles.themeSettings}>
        <legend>화면 모드</legend>
        <div className={styles.themeOptions}>
          <label>
            <input type="radio" name="theme" value="light" checked={theme === "light"} onChange={() => onThemeChange("light")} />
            <span><Sun size={20} />일반 모드</span>
          </label>
          <label>
            <input type="radio" name="theme" value="dark" checked={theme === "dark"} onChange={() => onThemeChange("dark")} />
            <span><Moon size={20} />다크 모드</span>
          </label>
        </div>
      </fieldset>
      <MenuCard
        title="설정"
        items={[
          { label: "내 동네 설정", icon: MapPinned },
          { label: locationAllowed ? "동네 인증됨" : "동네 인증하기", icon: Crosshair, trailing: locationAllowed ? "ON" : "OFF" },
          { label: "QR 코드 스캔", icon: QrCode },
          { label: "앱 설정", icon: Settings },
        ]}
      />
      <section className={styles.toggleCard}>
        <button type="button" onClick={onLocationToggle}>
          위치 권한
          <span className={locationAllowed ? styles.switchOn : ""} />
        </button>
        <button type="button" onClick={onGuestToggle}>
          비로그인 모드
          <span className={isGuestMode ? styles.switchOn : ""} />
        </button>
        <button type="button" onClick={onNetworkErrorToggle}>
          네트워크 오류 상태
          <span className={hasNetworkError ? styles.switchOn : ""} />
        </button>
      </section>
      <MenuCard
        title="고객지원"
        items={[
          { label: "공지사항", icon: Bell },
          { label: "고객센터", icon: Headphones },
          { label: "의견 남기기", icon: Mail },
          { label: "로그아웃", icon: LogOut, onClick: onLogout },
          { label: "탈퇴하기", icon: X },
          { label: "가지마켓 알아보기", icon: Sparkles },
          { label: "약관 및 정책", icon: BookOpen },
        ]}
      />
      <button type="button" className={styles.companyInfo}>
        (주) 가지마켓 사업자 정보 <ChevronRight size={18} />
      </button>
    </section>
  );
}

function ManagementScreen({
  title,
  products,
  onBack,
  onProductClick,
  onStatusChange,
}: {
  title: string;
  products: ProductListItem[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  onStatusChange: (id: string, status: TradeStatus) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title={title}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.managementSummary}>
        <span>판매중 {products.filter((product) => product.tradeStatus === "SALE").length}</span>
        <span>예약중 {products.filter((product) => product.tradeStatus === "RESERVED").length}</span>
        <span>거래완료 {products.filter((product) => product.tradeStatus === "SOLD").length}</span>
      </div>
      {products.length === 0 ? (
        <StateBlock
          title="판매 글이 없어요"
          body="첫 물건을 등록하면 판매관리에 바로 나타납니다."
          actionLabel="확인"
          onAction={onBack}
        />
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <article className={styles.manageRow} key={product.id}>
              <button type="button" onClick={() => onProductClick(product.id)}>
                <Thumbnail tone={product.thumbnailTone} label={product.thumbnailLabel} />
                <div>
                  <h2>{product.title}</h2>
                  <p>{formatPrice(product)}</p>
                </div>
              </button>
              <div className={styles.segmented}>
                {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={product.tradeStatus === status ? styles.segmentActive : ""}
                    onClick={() => onStatusChange(product.id, status)}
                  >
                    {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "완료"}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FavoriteScreen({
  products,
  onBack,
  onProductClick,
  onFavorite,
}: {
  products: ProductListItem[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="관심목록"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      {products.length === 0 ? (
        <StateBlock
          title="관심 상품이 없어요"
          body="마음에 드는 물건의 하트를 눌러 모아보세요."
          actionLabel="돌아가기"
          onAction={onBack}
        />
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onClick={() => onProductClick(product.id)}
              onFavorite={() => onFavorite(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const SEOUL_DISTRICTS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구",
  "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구",
  "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
];

const REAL_ESTATE_DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  송파구: { lat: 37.5048, lng: 127.1147 },
  용산구: { lat: 37.5324, lng: 126.9906 },
  영등포구: { lat: 37.5263, lng: 126.8962 },
  강남구: { lat: 37.5173, lng: 127.0473 },
  마포구: { lat: 37.5663, lng: 126.9018 },
};

const REAL_ESTATE_PROPERTY_TYPES: Array<{
  id: HouseTypeFilter;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "apartment", label: "아파트", icon: Building2 },
  { id: "one_room", label: "원룸", icon: House },
  { id: "two_plus", label: "투룸+", icon: Home },
  { id: "officetel", label: "오피스텔", icon: Building2 },
  { id: "house", label: "주택", icon: House },
  { id: "all", label: "전체", icon: Menu },
];

const DEPOSIT_FILTERS = [
  { value: "", label: "보증금 전체" },
  { value: "500", label: "보증금 500만 이하" },
  { value: "1000", label: "보증금 1천만 이하" },
  { value: "3000", label: "보증금 3천만 이하" },
  { value: "5000", label: "보증금 5천만 이하" },
  { value: "10000", label: "보증금 1억 이하" },
];

const MONTHLY_RENT_FILTERS = [
  { value: "", label: "월세 전체" },
  { value: "30", label: "월세 30만 이하" },
  { value: "50", label: "월세 50만 이하" },
  { value: "70", label: "월세 70만 이하" },
  { value: "100", label: "월세 100만 이하" },
  { value: "150", label: "월세 150만 이하" },
];

function districtFromNeighborhood(neighborhood: string) {
  if (neighborhood.includes("당산")) return "영등포구";
  if (neighborhood.includes("공릉")) return "노원구";
  return "송파구";
}

function formatRentPrice(transaction: RentTransaction) {
  if (transaction.rentType === "jeonse") return `전세 ${transaction.deposit.toLocaleString()}`;
  return `월세 ${transaction.deposit.toLocaleString()}/${transaction.monthlyRent.toLocaleString()}`;
}

function formatArea(areaM2: number, usePyeong: boolean) {
  return usePyeong ? `${(areaM2 / 3.3058).toFixed(1)}평` : `${areaM2.toFixed(1)}㎡`;
}

function displayBuildingName(transaction: RentTransaction) {
  const name = transaction.buildingName?.trim();
  if (name && !/^\([\d-]+\)$/.test(name)) return name;
  return `${transaction.dong} ${transaction.houseTypeLabel}`;
}

function RealEstateScreen({ activeNeighborhood, onBack }: { activeNeighborhood: string; onBack: () => void }) {
  const [view, setView] = useState<"home" | "map">("home");
  const [selectedDistrict, setSelectedDistrict] = useState(() => districtFromNeighborhood(activeNeighborhood));
  const [searchDraft, setSearchDraft] = useState("");
  const [query, setQuery] = useState("");
  const [houseType, setHouseType] = useState<HouseTypeFilter>("all");
  const [rentType, setRentType] = useState<RentTypeFilter>("monthly");
  const [depositMax, setDepositMax] = useState<number | undefined>();
  const [monthlyRentMax, setMonthlyRentMax] = useState<number | undefined>();
  const [usePyeong, setUsePyeong] = useState(false);
  const [transactions, setTransactions] = useState<RentTransaction[]>([]);
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mapBounds, setMapBounds] = useState<RealEstateBounds | null>(null);
  const [outsideSeoul, setOutsideSeoul] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getRentTransactions(
        {
          district: selectedDistrict,
          q: query || undefined,
          rentType,
          houseType,
          depositMax,
          monthlyRentMax,
          year: new Date().getFullYear(),
          bounds: view === "map" && !outsideSeoul ? mapBounds : null,
        },
        controller.signal,
      )
        .then((response) => {
          setTransactions(response.items);
          setNotice(response.notice);
        })
        .catch((requestError) => {
          if (requestError instanceof DOMException && requestError.name === "AbortError") return;
          setTransactions([]);
          setError(requestError instanceof Error ? requestError.message : "실거래 정보를 불러오지 못했습니다.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [depositMax, houseType, mapBounds, monthlyRentMax, outsideSeoul, query, refreshKey, rentType, selectedDistrict, view]);

  const buildings = useMemo(() => groupTransactionsByBuilding(transactions), [transactions]);
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );
  const recentTransactions = transactions.slice(0, 8);
  const handleRealEstateViewportChange = useCallback((bounds: RealEstateBounds, isOutside: boolean) => {
    setOutsideSeoul(isOutside);
    if (!isOutside) setMapBounds(bounds);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = searchDraft.trim().replace(/^서울특별시\s*/, "");
    const district = SEOUL_DISTRICTS.find((item) => value.includes(item));
    if (district) {
      setSelectedDistrict(district);
      setQuery("");
      setMapBounds(null);
      setSelectedBuildingId(null);
      return;
    }
    setQuery(value);
  }

  const searchPlaceholder = query ? `${query} 검색 중` : `서울특별시 ${selectedDistrict}`;

  if (view === "map") {
    return (
      <section className={styles.realEstateMapScreen}>
        <RealEstateMap
          district={selectedDistrict}
          buildings={buildings}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={(building) => setSelectedBuildingId(building.id)}
          onViewportChange={handleRealEstateViewportChange}
        />
        <div className={styles.realEstateMapTop}>
          <form className={styles.realEstateMapSearch} onSubmit={submitSearch}>
            <button type="button" aria-label="부동산 홈으로" onClick={() => {
              setView("home");
              setMapBounds(null);
              setSelectedBuildingId(null);
            }}>
              <X size={26} />
            </button>
            <label>
              <Search size={21} />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={searchPlaceholder}
                list="real-estate-districts"
              />
            </label>
          </form>
          <RealEstateFilterBar
            compact
            houseType={houseType}
            rentType={rentType}
            depositMax={depositMax}
            monthlyRentMax={monthlyRentMax}
            onHouseTypeChange={setHouseType}
            onRentTypeChange={setRentType}
            onDepositMaxChange={setDepositMax}
            onMonthlyRentMaxChange={setMonthlyRentMax}
            onRefresh={() => setRefreshKey((value) => value + 1)}
          />
        </div>
        {outsideSeoul ? (
          <div className={styles.realEstateMapMessage} role="status">
            <strong>서울 지역만 제공하고 있어요</strong>
            <span>지도를 서울 안으로 이동해 주세요.</span>
          </div>
        ) : null}
        {!loading && !outsideSeoul && buildings.length === 0 ? (
          <div className={styles.realEstateMapMessage} role="status">
            <strong>지도에 표시할 좌표가 없어요</strong>
            <span>필터를 바꾸거나 서버의 Geocoding 설정을 확인해 주세요.</span>
          </div>
        ) : null}
        <div className={styles.realEstateMapSummary} aria-live="polite">
          <strong>거래 {transactions.length}건</strong>
          <span />
          <strong>건물 {buildings.length}개</strong>
        </div>
        {selectedBuilding ? (
          <RealEstateBuildingSheet
            building={selectedBuilding}
            usePyeong={usePyeong}
            onClose={() => setSelectedBuildingId(null)}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.realEstateHome}>
      <header className={styles.realEstateHeader}>
        <IconButton label="닫기" onClick={onBack}><X size={28} /></IconButton>
        <h1>가지부동산</h1>
        <button type="button" className={styles.realEstateMapButton} onClick={() => setView("map")}>
          <MapPinned size={19} /> 지도
        </button>
      </header>

      <form className={styles.realEstateSearch} onSubmit={submitSearch}>
        <Search size={24} />
        <input
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={searchPlaceholder}
          list="real-estate-districts"
        />
        <button type="submit">검색</button>
      </form>
      <datalist id="real-estate-districts">
        {SEOUL_DISTRICTS.map((district) => <option key={district} value={district} />)}
      </datalist>

      <div className={styles.realEstateTypeGrid}>
        {REAL_ESTATE_PROPERTY_TYPES.map((type) => {
          const TypeIcon = type.icon;
          return (
            <button
              type="button"
              key={type.id}
              className={houseType === type.id ? styles.realEstateTypeActive : ""}
              onClick={() => setHouseType(type.id)}
            >
              <span><TypeIcon size={26} /></span>
              {type.label}
            </button>
          );
        })}
      </div>

      <section className={styles.realEstateRecentSection}>
        <div className={styles.realEstateSectionTitle}>
          <div>
            <span>서울시 공개 실거래</span>
            <h2>{selectedDistrict} 최근 {rentType === "jeonse" ? "전세" : rentType === "monthly" ? "월세" : "전월세"}</h2>
          </div>
          <button type="button" onClick={() => setView("map")}>지도에서 보기 <ChevronRight size={17} /></button>
        </div>
        <div className={styles.realEstateRecentScroller}>
          {recentTransactions.map((transaction) => (
            <RealEstateCompactCard key={transaction.id} transaction={transaction} usePyeong={usePyeong} />
          ))}
        </div>
      </section>

      <RealEstateFilterBar
        houseType={houseType}
        rentType={rentType}
        depositMax={depositMax}
        monthlyRentMax={monthlyRentMax}
        onHouseTypeChange={setHouseType}
        onRentTypeChange={setRentType}
        onDepositMaxChange={setDepositMax}
        onMonthlyRentMaxChange={setMonthlyRentMax}
        onRefresh={() => setRefreshKey((value) => value + 1)}
      />

      {notice ? <p className={styles.realEstateNotice}>{notice}</p> : null}
      <div className={styles.realEstateListToolbar}>
        <div>
          <strong>최근 실거래</strong>
          <span>{transactions.length}건</span>
        </div>
        <label className={styles.realEstatePyeongToggle}>
          <input type="checkbox" checked={usePyeong} onChange={(event) => setUsePyeong(event.target.checked)} />
          <span />
          평수로 보기
        </label>
      </div>

      {loading ? (
        <div className={styles.realEstateState}><RefreshCw size={24} className={styles.realEstateSpinner} /> 실거래를 불러오는 중이에요</div>
      ) : error ? (
        <div className={styles.realEstateState} role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>다시 시도</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.realEstateState}>
          <strong>조건에 맞는 실거래가 없어요</strong>
          <span>주택 유형이나 금액 조건을 바꿔보세요.</span>
        </div>
      ) : (
        <div className={styles.realEstateTransactionList}>
          {transactions.map((transaction) => (
            <RealEstateTransactionRow key={transaction.id} transaction={transaction} usePyeong={usePyeong} />
          ))}
        </div>
      )}
    </section>
  );
}

function RealEstateFilterBar({
  compact = false,
  houseType,
  rentType,
  depositMax,
  monthlyRentMax,
  onHouseTypeChange,
  onRentTypeChange,
  onDepositMaxChange,
  onMonthlyRentMaxChange,
  onRefresh,
}: {
  compact?: boolean;
  houseType: HouseTypeFilter;
  rentType: RentTypeFilter;
  depositMax?: number;
  monthlyRentMax?: number;
  onHouseTypeChange: (value: HouseTypeFilter) => void;
  onRentTypeChange: (value: RentTypeFilter) => void;
  onDepositMaxChange: (value: number | undefined) => void;
  onMonthlyRentMaxChange: (value: number | undefined) => void;
  onRefresh: () => void;
}) {
  return (
    <div className={`${styles.realEstateFilterBar} ${compact ? styles.realEstateFilterBarCompact : ""}`}>
      <button type="button" className={styles.realEstateFilterReset} aria-label="필터 새로고침" onClick={onRefresh}>
        <RefreshCw size={19} />
      </button>
      <label>
        <select value={houseType} onChange={(event) => onHouseTypeChange(event.target.value as HouseTypeFilter)} aria-label="주택 유형">
          {REAL_ESTATE_PROPERTY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>
        <ChevronDown size={16} />
      </label>
      <label>
        <select value={rentType} onChange={(event) => onRentTypeChange(event.target.value as RentTypeFilter)} aria-label="거래 유형">
          <option value="monthly">월세</option>
          <option value="jeonse">전세</option>
          <option value="all">전체</option>
        </select>
        <ChevronDown size={16} />
      </label>
      <label>
        <select value={depositMax ?? ""} onChange={(event) => onDepositMaxChange(event.target.value ? Number(event.target.value) : undefined)} aria-label="보증금 상한">
          {DEPOSIT_FILTERS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown size={16} />
      </label>
      {rentType !== "jeonse" ? (
        <label>
          <select value={monthlyRentMax ?? ""} onChange={(event) => onMonthlyRentMaxChange(event.target.value ? Number(event.target.value) : undefined)} aria-label="월세 상한">
            {MONTHLY_RENT_FILTERS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
          </select>
          <ChevronDown size={16} />
        </label>
      ) : null}
    </div>
  );
}

function RealEstateCompactCard({ transaction, usePyeong }: { transaction: RentTransaction; usePyeong: boolean }) {
  return (
    <article className={styles.realEstateCompactCard}>
      <span className={styles.realEstateBadge}>실거래</span>
      <small>{transaction.houseTypeLabel}</small>
      <h3>{displayBuildingName(transaction)}</h3>
      <strong>{formatRentPrice(transaction)}</strong>
      <p>{transaction.dong} · {formatArea(transaction.areaM2, usePyeong)}{transaction.floor !== undefined && transaction.floor > 0 ? ` · ${transaction.floor}층` : ""}</p>
      <time>{transaction.contractDate.slice(0, 7).replace("-", ".")} 계약</time>
    </article>
  );
}

function RealEstateTransactionRow({ transaction, usePyeong }: { transaction: RentTransaction; usePyeong: boolean }) {
  return (
    <article className={styles.realEstateTransactionRow}>
      <div className={styles.realEstateTypeIcon}><Building2 size={26} /></div>
      <div>
        <span className={styles.realEstateBadge}>실거래</span>
        <h3>{displayBuildingName(transaction)}</h3>
        <strong>{formatRentPrice(transaction)}</strong>
        <p>{transaction.dong} · {formatArea(transaction.areaM2, usePyeong)}{transaction.floor !== undefined && transaction.floor > 0 ? ` · ${transaction.floor}층` : ""}</p>
        <time>{transaction.contractDate.slice(0, 7).replace("-", ".")} 계약 · {transaction.houseTypeLabel}</time>
      </div>
    </article>
  );
}

function makeRealEstateMarker(
  title: string,
  detail: string,
  selected: boolean,
  kind: "dong" | "building",
) {
  const root = document.createElement("button");
  root.type = "button";
  root.className = `${styles.realEstateMarker} ${kind === "dong" ? styles.realEstateDongMarker : styles.realEstateBuildingMarker} ${selected ? styles.realEstateMarkerSelected : ""}`;
  const heading = document.createElement("strong");
  heading.textContent = title;
  const caption = document.createElement("span");
  caption.textContent = detail;
  root.append(heading, caption);
  return root;
}

function RealEstateMap({
  district,
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onViewportChange,
}: {
  district: string;
  buildings: PropertyBuilding[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: PropertyBuilding) => void;
  onViewportChange: (bounds: RealEstateBounds, outsideSeoul: boolean) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const listenerRefs = useRef<unknown[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(13);
  const center = REAL_ESTATE_DISTRICT_CENTERS[district] ?? { lat: 37.5665, lng: 126.978 };

  useEffect(() => {
    if (!NAVER_MAP_KEY_ID) return;
    let mounted = true;
    loadNaverMapScript(NAVER_MAP_KEY_ID)
      .then(() => { if (mounted) setMapReady(Boolean(window.naver?.maps)); })
      .catch(() => { if (mounted) setMapReady(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (!maps || !mapElementRef.current || !mapReady) return;
    const position = new maps.LatLng(center.lat, center.lng);
    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElementRef.current, {
        center: position,
        zoom: 13,
        logoControl: false,
        mapDataControl: false,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
      });
      window.requestAnimationFrame(() => {
        mapRef.current?.autoResize?.();
        mapRef.current?.setCenter(position);
      });
    } else {
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(13);
    }
  }, [center.lat, center.lng, mapReady]);

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps?.Event || !map || !mapReady) return;
    let timer = 0;
    const emitViewport = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const bounds = map.getBounds();
        const sw = bounds.getSW();
        const ne = bounds.getNE();
        const nextBounds = { south: sw.lat(), north: ne.lat(), west: sw.lng(), east: ne.lng() };
        if (nextBounds.north - nextBounds.south < 0.001 || nextBounds.east - nextBounds.west < 0.001) {
          map.autoResize?.();
          return;
        }
        const centerLat = (nextBounds.south + nextBounds.north) / 2;
        const centerLng = (nextBounds.west + nextBounds.east) / 2;
        const outsideSeoul = centerLat < 37.413 || centerLat > 37.715 || centerLng < 126.734 || centerLng > 127.269;
        setZoom(map.getZoom());
        onViewportChange(nextBounds, outsideSeoul);
      }, 400);
    };
    const listener = maps.Event.addListener(map, "idle", emitViewport);
    emitViewport();
    return () => {
      window.clearTimeout(timer);
      maps.Event?.removeListener(listener);
    };
  }, [mapReady, onViewportChange]);

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !mapReady) return;
    markerRefs.current.forEach((marker) => marker.setMap(null));
    listenerRefs.current.forEach((listener) => maps.Event?.removeListener(listener));
    markerRefs.current = [];
    listenerRefs.current = [];

    if (zoom < 15) {
      groupBuildingsByDong(buildings).forEach((group) => {
        const position = new maps.LatLng(group.lat, group.lng);
        const content = makeRealEstateMarker(group.dong, `거래 ${group.transactionCount}`, false, "dong");
        const marker = new maps.Marker({
          position,
          map,
          title: `${group.dong} 거래 ${group.transactionCount}건`,
          icon: { content, anchor: maps.Point ? new maps.Point(48, 62) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => {
          map.setCenter(position);
          map.setZoom(15);
        });
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    } else {
      buildings.forEach((building) => {
        const latest = building.latestTransaction;
        const title = latest.rentType === "monthly" ? `월 ${latest.monthlyRent}` : "전세";
        const detail = latest.rentType === "monthly" ? `보증 ${latest.deposit.toLocaleString()}` : latest.deposit.toLocaleString();
        const position = new maps.LatLng(building.lat, building.lng);
        const content = makeRealEstateMarker(title, detail, building.id === selectedBuildingId, "building");
        const marker = new maps.Marker({
          position,
          map,
          title: displayBuildingName(latest),
          zIndex: building.id === selectedBuildingId ? 200 : 100,
          icon: { content, anchor: maps.Point ? new maps.Point(44, 56) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => onSelectBuilding(building));
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    }

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      listenerRefs.current.forEach((listener) => maps.Event?.removeListener(listener));
      markerRefs.current = [];
      listenerRefs.current = [];
    };
  }, [buildings, mapReady, onSelectBuilding, selectedBuildingId, zoom]);

  return (
    <div className={styles.realEstateMapCanvas}>
      <div ref={mapElementRef} className={styles.realEstateNaverMap} />
      {!NAVER_MAP_KEY_ID ? (
        <div className={styles.realEstateMapUnavailable}>
          <MapPinned size={32} />
          <strong>네이버 지도 키가 필요해요</strong>
          <span>목록의 실거래 정보는 계속 확인할 수 있습니다.</span>
        </div>
      ) : null}
      <button
        type="button"
        className={styles.realEstateRecenter}
        aria-label={`${district} 중심으로 이동`}
        onClick={() => {
          const maps = window.naver?.maps;
          if (!maps || !mapRef.current) return;
          mapRef.current.setCenter(new maps.LatLng(center.lat, center.lng));
          mapRef.current.setZoom(13);
        }}
      >
        <Crosshair size={22} />
      </button>
    </div>
  );
}

function RealEstateBuildingSheet({
  building,
  usePyeong,
  onClose,
}: {
  building: PropertyBuilding;
  usePyeong: boolean;
  onClose: () => void;
}) {
  const latest = building.latestTransaction;
  return (
    <article className={styles.realEstateBuildingSheet}>
      <button type="button" className={styles.realEstateSheetClose} aria-label="건물 정보 닫기" onClick={onClose}><X size={19} /></button>
      <div className={styles.realEstateSheetHandle} />
      <span className={styles.realEstateBadge}>실거래</span>
      <h2>{displayBuildingName(latest)}</h2>
      <strong>{formatRentPrice(latest)}만원</strong>
      <p>{latest.dong} · {formatArea(latest.areaM2, usePyeong)}{latest.floor !== undefined && latest.floor > 0 ? ` · ${latest.floor}층` : ""}</p>
      <time>{latest.contractDate.slice(0, 7).replace("-", ".")} 계약 · {latest.houseTypeLabel}</time>
      <div className={styles.realEstateSheetTransactions}>
        <b>최근 실거래 {building.transactionCount}건</b>
        {building.transactions.slice(0, 3).map((transaction) => (
          <span key={transaction.id}>{formatRentPrice(transaction)} · {transaction.contractDate.slice(0, 7).replace("-", ".")}</span>
        ))}
      </div>
    </article>
  );
}

function AllServicesScreen({
  onBack,
  onOpenAlba,
  onOpenRealEstate,
  onOpenApartment,
  onOpenGame,
}: {
  onBack: () => void;
  onOpenAlba?: () => void;
  onOpenRealEstate?: () => void;
  onOpenApartment?: () => void;
  onOpenGame?: () => void;
}) {
  const serviceCategories = [
    {
      title: "최근 사용",
      items: [
        { label: "포장주문", icon: Utensils, color: "#f4a340" },
        { label: "스토어", icon: ShoppingBasket, color: "#ff922b" },
      ],
    },
    {
      title: "동네 거래",
      items: [
        { label: "중고거래", icon: ShoppingBag, color: "#ff6f0f" },
        { label: "알바", icon: BriefcaseBusiness, color: "var(--color-primary)", onClick: onOpenAlba },
        { label: "부동산", icon: House, color: "var(--color-primary)", onClick: onOpenRealEstate },
        { label: "중고차", icon: Truck, color: "#228be6" },
        { label: "스토어", icon: ShoppingBasket, color: "#fab005" },
        { label: "포장주문", icon: Utensils, color: "#ff922b" },
        { label: "공동구매", icon: Tag, color: "#ff6b6b" },
        { label: "레슨/과외", icon: BookOpen, color: "#a9e34b" },
      ],
    },
    {
      title: "동네 서비스",
      items: [
        { label: "세탁 수거", icon: Shirt, color: "#22b8cf" },
        { label: "출장 세차", icon: SprayCan, color: "#339af0" },
      ],
    },
    {
      title: "동네 이야기",
      items: [
        { label: "모임", icon: UsersRound, color: "#ff922b" },
        { label: "온라인 카페", icon: Coffee, color: "#fab005" },
        { label: "내 아파트", icon: Building2, color: "var(--color-primary)", onClick: onOpenApartment },
        { label: "아파트 오픈게시판", icon: Building2, color: "#ff922b" },
        { label: "동네생활", icon: MessageCircle, color: "#22b8cf" },
        { label: "스토리", icon: Sparkles, color: "#ff6b6b" },
        { label: "한 입 뉴스", icon: NotebookTabs, color: "#ff922b" },
      ],
    },
    {
      title: "비즈니스",
      items: [
        { label: "비즈프로필", icon: Store, color: "#fab005" },
        { label: "광고", icon: Bell, color: "#ff922b" },
        { label: "월세 카드결제", icon: House, color: "#ff922b" },
        { label: "ATM 출금", icon: WalletCards, color: "#20b77a" },
        { label: "당근 교환권", icon: QrCode, color: "#ff6f0f" },
      ],
    },
    {
      title: "혜택/브랜드",
      items: [
        { label: "혜택", icon: Gem, color: "#339af0" },
        { label: "선물가게", icon: CakeSlice, color: "#ff922b" },
        { label: "동네걷기", icon: Dumbbell, color: "#ff922b" },
        { label: "당근이네", icon: Sparkles, color: "#20b77a" },
        { label: "게임", icon: Gamepad2, color: "#ff922b", onClick: onOpenGame },
        { label: "당근메이드", icon: House, color: "#ff922b" },
      ],
    },
    {
      title: "동네 전문가 찾기",
      items: [
        { label: "전문가 견적", icon: ShieldCheck, color: "#ff922b" },
        { label: "취미/클래스", icon: GraduationCap, color: "#339af0" },
        { label: "이사/용달", icon: Truck, color: "#339af0" },
        { label: "청소", icon: SprayCan, color: "#20b77a" },
        { label: "시공", icon: House, color: "#20b77a" },
        { label: "수리", icon: Settings, color: "#868e96" },
        { label: "운동", icon: Dumbbell, color: "#339af0" },
        { label: "학원", icon: GraduationCap, color: "#339af0" },
        { label: "미용실", icon: Sparkles, color: "#ff922b" },
        { label: "뷰티", icon: Heart, color: "#ff922b" },
        { label: "병원", icon: Heart, color: "#20b77a" },
        { label: "반려동물", icon: Sparkles, color: "#fab005" },
      ],
    },
    {
      title: "동네 먹거리 찾기",
      items: [
        { label: "음식점", icon: Utensils, color: "#ff922b" },
        { label: "카페/간식", icon: Coffee, color: "#fab005" },
      ],
    },
  ];

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="전체 서비스"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.allServicesContainer}>
        {serviceCategories.map((category) => (
          <div key={category.title} className={styles.serviceCategoryGroup}>
            <h3 className={styles.serviceCategoryTitle}>{category.title}</h3>
            <div className={styles.serviceCategoryGrid}>
              {category.items.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    type="button"
                    key={`${item.label}-${idx}`}
                    className={styles.serviceItemButton}
                    onClick={item.onClick}
                  >
                    <span className={styles.serviceItemIcon} style={{ color: item.color }}>
                      <ItemIcon size={22} />
                    </span>
                    <span className={styles.serviceItemLabel}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchScreen({
  products,
  posts,
  businesses,
  onBack,
  onProductClick,
  onPostClick,
}: {
  products: ProductListItem[];
  posts: CommunityPost[];
  businesses: LocalBusiness[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  onPostClick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const matchedProducts = products.filter((product) => product.title.includes(normalized));
  const matchedPosts = posts.filter((post) => post.title.includes(normalized) || post.contentPreview.includes(normalized));
  const matchedBusinesses = businesses.filter((business) => business.name.includes(normalized) || business.summary.includes(normalized));

  return (
    <section className={styles.screen}>
      <div className={styles.searchTop}>
        <IconButton label="뒤로" onClick={onBack}>
          <ChevronLeft size={27} />
        </IconButton>
        <div className={styles.searchField}>
          <Search size={22} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="가지마켓 통합 검색" />
        </div>
      </div>
      {normalized.length === 0 ? (
        <section className={styles.searchHints}>
          <h2>추천 검색어</h2>
          {["갤럭시 탭", "포장주문", "동네친구", "세차", "가구"].map((item) => (
            <button type="button" key={item} onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </section>
      ) : (
        <div className={styles.searchResults}>
          <h2>중고거래</h2>
          {matchedProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onClick={() => onProductClick(product.id)}
              onFavorite={() => undefined}
            />
          ))}
          <h2>동네생활</h2>
          {matchedPosts.map((post) => (
            <CommunityPostRow key={post.id} post={post} onClick={() => onPostClick(post.id)} />
          ))}
          <h2>동네업체</h2>
          {matchedBusinesses.map((business) => (
            <article key={business.id} className={styles.searchBusiness}>
              <strong>{business.name}</strong>
              <span>{business.summary}</span>
            </article>
          ))}
          {matchedProducts.length + matchedPosts.length + matchedBusinesses.length === 0 && (
            <StateBlock
              title="검색 결과가 없어요"
              body="검색어를 줄이거나 다른 표현으로 찾아보세요."
              actionLabel="지우기"
              onAction={() => setQuery("")}
            />
          )}
        </div>
      )}
    </section>
  );
}

// "내 동네 설정"에서 "동네 추가"/삭제-교체로 진입하는 전체화면 검색 — 실제 당근 UX처럼
// 검색어 없을 땐 최근 설정한 동네 칩 + 전체 지역 목록("서울 {구} {동}"), 검색어 있으면 필터링.
function RegionSearchScreen({
  regions,
  recentNeighborhoods,
  onBack,
  onPick,
}: {
  regions: Region[];
  recentNeighborhoods: string[];
  onBack: () => void;
  onPick: (dongName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const matched = normalized
    ? regions.filter((r) => r.dongName.includes(normalized) || r.guName.includes(normalized))
    : regions;

  return (
    <section className={styles.screen}>
      <div className={styles.regionSearchTop}>
        <label className={styles.searchField}>
          <Search size={18} />
          <input
            autoFocus
            type="text"
            placeholder="동, 읍, 면으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className={styles.regionSearchCloseBtn} onClick={onBack}>
          닫기
        </button>
      </div>

      {!normalized && recentNeighborhoods.length > 0 && (
        <section className={styles.regionSearchSection}>
          <h2>최근 설정한 동네</h2>
          <div className={styles.regionRecentChips}>
            {recentNeighborhoods.map((name) => (
              <button type="button" key={name} className={styles.regionRecentChip} onClick={() => onPick(name)}>
                {name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.regionSearchSection}>
        <h2>{normalized ? "검색 결과" : "지금 있는 동네"}</h2>
        <div className={styles.regionSearchList}>
          {matched.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.regionSearchListItem}
              onClick={() => onPick(r.dongName)}
            >
              서울 {r.guName} {r.dongName}
            </button>
          ))}
          {matched.length === 0 && <p className={styles.sheetCopy}>검색 결과가 없어요.</p>}
        </div>
      </section>
    </section>
  );
}

function EggplantPinIcon({
  size = 31,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="eggplant-pin-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--eggplant-pin-top, #078452)" />
          <stop offset="30%" stopColor="var(--eggplant-pin-top, #078452)" />
          <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
          <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={active ? "url(#eggplant-pin-gradient)" : "none"}
        stroke={active ? "none" : "currentColor"}
        strokeWidth={active ? "0" : "1.7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNav({
  activeTab,
  unreadCount,
  onNavigate,
}: {
  activeTab: TabId;
  unreadCount: number;
  onNavigate: (tab: TabId) => void;
}) {
  const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
    { id: "home", label: "홈", icon: Home },
    { id: "community", label: "커뮤니티", icon: UsersRound },
    { id: "map", label: "동네지도", icon: MapPin },
    { id: "chats", label: "채팅", icon: MessageCircle },
    { id: "my", label: "나의 가지", icon: UserRound },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="주요 화면">
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none", visibility: "hidden" }}>
        <defs>
          <linearGradient id="eggplant-pin-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eggplant-pin-top, #078452)" />
            <stop offset="30%" stopColor="var(--eggplant-pin-top, #078452)" />
            <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
            <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
          </linearGradient>
        </defs>
      </svg>
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            className={isActive ? styles.navActive : ""}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(tab.id)}
          >
            <span>
              {tab.id === "map" ? (
                <EggplantPinIcon size={28} active={isActive} />
              ) : (
                <TabIcon
                  size={28}
                  fill={isActive ? "url(#eggplant-pin-gradient)" : "none"}
                  stroke={isActive ? "none" : "currentColor"}
                  strokeWidth={isActive ? 0 : 1.7}
                />
              )}
              {tab.id === "chats" && unreadCount > 0 && <em>{formatBadge(unreadCount)}</em>}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function FloatingWriteButton({
  onClick,
  showTogetherTooltip = false,
  onTooltipClick,
}: {
  onClick: () => void;
  showTogetherTooltip?: boolean;
  onTooltipClick?: () => void;
}) {
  return (
    <div className={styles.floatingWriteWrapper}>
      {showTogetherTooltip && (
        <div
          className={styles.togetherFabTooltip}
          onClick={onTooltipClick || onClick}
          role="button"
          tabIndex={0}
        >
          <span>같이해요 기능이 출시되었어요!</span>
        </div>
      )}
      <button
        type="button"
        className={styles.circleFab}
        onClick={onClick}
        aria-label="글쓰기"
      >
        <Plus size={28} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function BottomSheet({
  sheet,
  activeNeighborhood,
  secondaryNeighborhood,
  onClose,
  onSelectPrimary,
  onRemoveNeighborhood,
  onOpenRegionSearch,
  onProductWrite,
  onCommunityWrite,
  onTogetherWrite,
  totalUnread,
  hasNetworkError,
  isGuestMode,
  authRequired,
  onRetry,
  onGuestOff,
}: {
  sheet: SheetId;
  activeNeighborhood: string;
  secondaryNeighborhood: string;
  onClose: () => void;
  onSelectPrimary: (dongName: string) => void;
  onRemoveNeighborhood: (target: "primary" | "secondary") => void;
  onOpenRegionSearch: () => void;
  onProductWrite: () => void;
  onCommunityWrite: () => void;
  onTogetherWrite?: () => void;
  totalUnread: number;
  hasNetworkError: boolean;
  isGuestMode: boolean;
  authRequired: boolean;
  onRetry: () => void;
  onGuestOff: () => void;
}) {
  if (!sheet) return null;

  return (
    <div className={styles.sheetBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.modalSheet} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.sheetHandle} onClick={onClose}>
          <span />
        </button>
        {sheet === "write" && (
          <>
            <h2>무엇을 올릴까요?</h2>
            <div className={styles.sheetOptions}>
              <button type="button" onClick={onProductWrite}>
                <ShoppingBag size={28} /> 중고거래
              </button>
              <button type="button" onClick={onCommunityWrite}>
                <UsersRound size={28} /> 동네생활
              </button>
              <button type="button" onClick={onTogetherWrite}>
                <Users size={28} /> 같이해요
              </button>
              <button type="button">
                <BriefcaseBusiness size={28} /> 가지알바
              </button>
            </div>
          </>
        )}
        {sheet === "region" && (
          <>
            <h2>내 동네 설정</h2>
            <p className={styles.sheetCopy}>최대 2개의 동네를 선택할 수 있어요.</p>
            <div className={styles.myRegionList}>
              {[
                { name: activeNeighborhood, target: "primary" as const },
                { name: secondaryNeighborhood, target: "secondary" as const },
              ].map(({ name, target }) => (
                <div className={styles.myRegionRow} key={target}>
                  <button
                    type="button"
                    className={styles.myRegionRadio}
                    aria-label={`${name}을 대표 동네로 설정`}
                    onClick={() => onSelectPrimary(name)}
                  >
                    <span className={target === "primary" ? styles.myRegionRadioOn : ""} />
                  </button>
                  <span className={styles.myRegionName}>{name}</span>
                  <button
                    type="button"
                    className={styles.myRegionRemove}
                    aria-label={`${name} 삭제`}
                    onClick={() => onRemoveNeighborhood(target)}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className={styles.myRegionAddBtn} onClick={onOpenRegionSearch}>
              <Plus size={18} /> 동네 추가
            </button>
          </>
        )}
        {sheet === "notifications" && (
          <>
            <h2>알림</h2>
            <div className={styles.notificationList}>
              <p>
                읽지 않은 채팅 <strong>{formatBadge(totalUnread)}</strong>
              </p>
              <p>관심 상품과 판매 상태 변경 알림이 여기에 모입니다.</p>
              <p>상품을 예약중으로 바꾸면 관련 화면에 같은 배지가 표시됩니다.</p>
            </div>
          </>
        )}
        {sheet === "status" && (
          <>
            <h2>상태 안내</h2>
            {isGuestMode || authRequired ? (
              <StateBlock
                title="로그인이 필요해요"
                body="비로그인 사용자는 탐색만 가능하고 관심, 채팅, 글쓰기는 제한됩니다."
                actionLabel="로그인 상태로 전환"
                onAction={onGuestOff}
              />
            ) : hasNetworkError ? (
              <StateBlock
                title="네트워크 오류"
                body="화면 데이터는 유지하고 재시도할 수 있게 처리했습니다."
                actionLabel="재시도"
                onAction={onRetry}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Avatar({ tone }: { tone: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    coffee: <Coffee size={30} />,
    building: <Building2 size={30} />,
    job: <BriefcaseBusiness size={30} />,
    store: <ShoppingBasket size={30} />,
    calendar: <NotebookTabs size={30} />,
    pay: <WalletCards size={30} />,
    wood: <House size={30} />,
  };
  return <div className={`${styles.avatarCircle} ${styles[`avatar_${tone}` as keyof typeof styles] ?? ""}`}>{iconMap[tone]}</div>;
}

function formatPrice(product: ProductListItem) {
  if (product.tradeType === "FREE" || product.price === null || product.price === 0) {
    return "나눔";
  }
  return `${product.price.toLocaleString("ko-KR")}원`;
}

function formatBadge(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

const DREAM_NOTICE_ITEMS = [
  {
    id: "dream-launch",
    title: "[공지] 꿈가지가 오픈되었어요",
    date: "2026.09.01",
  },
] as const;

function DreamNoticeScreen({ onBack }: { onBack: () => void }) {
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const selectedNotice = DREAM_NOTICE_ITEMS.find((notice) => notice.id === selectedNoticeId) ?? null;
  const handleBack = selectedNotice ? () => setSelectedNoticeId(null) : onBack;

  useEffect(() => {
    document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedNoticeId]);

  return (
    <section className={`${styles.screen} ${styles.dreamScreen} ${styles.dreamNoticeScreen}`}>
      <ScreenHeader
        title="공지사항"
        leading={
          <IconButton label="뒤로" onClick={handleBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />

      {selectedNotice ? (
        <article className={styles.dreamNoticeDetail}>
          <header className={styles.dreamNoticeDetailHeader}>
            <h2>{selectedNotice.title}</h2>
            <time dateTime={selectedNotice.date.replaceAll(".", "-")}>{selectedNotice.date}</time>
          </header>

          {selectedNotice.id === "dream-launch" && (
            <div className={styles.dreamNoticeDetailBody}>
              <p>
                우리 동네 아이들의 작은 꿈을 함께 키우는 <strong>꿈가지가 문을 열었어요.</strong>
              </p>
              <p>
                꿈가지는 지역사회의 도움이 필요한 아이들을 이웃과 함께 응원하고, 아이들이 자신의 꿈을 건강하게 키워갈 수 있도록 마음을 모으는 공간이에요.
              </p>
              <p>
                작은 관심과 나눔이 아이들에게는 새로운 경험과 용기가 될 수 있어요. 우리 동네 아이들의 내일이 더 환하게 자랄 수 있도록 꿈가지와 함께해 주세요.
              </p>
            </div>
          )}
        </article>
      ) : (
        <div className={styles.dreamNoticeList} aria-label="공지사항 목록">
          {DREAM_NOTICE_ITEMS.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className={styles.dreamNoticeListItem}
              onClick={() => setSelectedNoticeId(notice.id)}
            >
              <strong>{notice.title}</strong>
              <time dateTime={notice.date.replaceAll(".", "-")}>{notice.date}</time>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}


/* ==========================================================================
   Gaji Alba Components
   ========================================================================== */

function AlbaMainScreen({
  activeNeighborhood,
  initialTab = "home",
  initialCategory,
  albas,
  onBack,
  onSelectAlba,
  onWrite,
  onToggleFavorite,
}: {
  activeNeighborhood: string;
  initialTab?: "home" | "search" | "applications" | "manage";
  initialCategory?: string;
  albas: AlbaItem[];
  onBack: () => void;
  onSelectAlba: (id: string) => void;
  onWrite: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [currentTab, setCurrentTab] = useState<"home" | "search" | "applications" | "manage">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { label: "이웃알바", icon: Heart },
    { label: "걸어서10분", icon: Footprints },
    { label: "단기알바", icon: Calendar },
    { label: "식당/카페", icon: Utensils },
    { label: "물류/현장", icon: Package },
    { label: "레슨/과외", icon: BookOpen },
  ];

  const filteredAlbas = albas.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.neighborhoodName.toLowerCase().includes(q) ||
        item.payLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const appliedAlbas = albas.filter((item) => item.hasApplied);
  const localName = activeNeighborhood;

  return (
    <section className={styles.albaScreen}>
      <header className={styles.albaHeader}>
        <button type="button" onClick={onBack} aria-label="닫기" className={styles.iconButton}>
          <X size={26} />
        </button>
        <h1>당근알바</h1>
        <div className={styles.albaHeaderActions}>
          <button type="button" onClick={() => setCurrentTab("search")} className={styles.iconButton} aria-label="알바 검색">
            <Search size={24} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="메뉴">
            <Menu size={26} />
          </button>
        </div>
      </header>

      {currentTab === "home" && (
        <>
          <section className={styles.albaTopSection}>
            <button
              type="button"
              className={styles.albaPopularCard}
              onClick={() => setSelectedCategory(null)}
            >
              <span className={styles.albaPopularCardCopy}>
                <span>우리동네</span>
                <strong>
                  지금 많이 보는 공고
                  <ChevronRight size={16} />
                </strong>
                <span className={styles.albaPopularDescription}>{localName} 근처에서 빠르게 지원할 수 있는 알바를 모았어요.</span>
                <span className={styles.albaPopularStats}>
                  <span>{albas.length}개 공고</span>
                  <span>후기 기반 추천</span>
                </span>
              </span>
              <span className={styles.albaPopularMapVisual} aria-hidden="true">
                <BriefcaseBusiness size={22} />
                <MapPin size={18} className={styles.albaPopularPinIcon} />
              </span>
            </button>

            <div className={styles.albaCategoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                const CategoryIcon = cat.icon;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={`${styles.albaCategoryBtn} ${isSelected ? styles.albaCategoryBtnActive : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                  >
                    <span className={styles.albaCategoryIconCircle}>
                      <CategoryIcon size={20} strokeWidth={2.1} />
                    </span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.albaFeedSection}>
            <div className={styles.albaFeedHeading}>
              <h2>
                {selectedCategory ? selectedCategory : `${localName} 인기 알바`}
              </h2>
              <small>{filteredAlbas.length}개 공고</small>
            </div>

            {filteredAlbas.length === 0 ? (
              <StateBlock
                title="해당하는 알바가 없어요"
                body="다른 카테고리를 선택하거나 검색어를 변경해보세요."
                actionLabel="전체 보기"
                onAction={() => { setSelectedCategory(null); setSearchQuery(""); }}
              />
            ) : (
              <div className={styles.albaGrid}>
                {filteredAlbas.map((alba) => (
                  <AlbaCardComponent
                    key={alba.id}
                    alba={alba}
                    onSelect={() => onSelectAlba(alba.id)}
                    onToggleFavorite={() => onToggleFavorite(alba.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {currentTab === "search" && (
        <section className={styles.albaFeedSection}>
          <div className={`${styles.mapSearch} ${styles.albaSearchField}`}>
            <Search size={20} />
            <input
              type="text"
              placeholder="직종, 업체명, 동네 등으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="검색어 지우기">
                <X size={16} />
              </button>
            )}
          </div>
          <div className={styles.albaGrid}>
            {filteredAlbas.map((alba) => (
              <AlbaCardComponent
                key={alba.id}
                alba={alba}
                onSelect={() => onSelectAlba(alba.id)}
                onToggleFavorite={() => onToggleFavorite(alba.id)}
              />
            ))}
          </div>
        </section>
      )}

      {currentTab === "applications" && (
        <section className={styles.albaFeedSection}>
          <div className={styles.albaFeedHeading}>
            <h2>내가 지원한 알바 ({appliedAlbas.length})</h2>
          </div>
          {appliedAlbas.length === 0 ? (
            <StateBlock
              title="아직 지원한 알바가 없어요"
              body="마음에 드는 동네 알바를 찾아서 지원해보세요."
              actionLabel="알바 둘러보기"
              onAction={() => setCurrentTab("home")}
            />
          ) : (
            <div className={styles.albaGrid}>
              {appliedAlbas.map((alba) => (
                <AlbaCardComponent
                  key={alba.id}
                  alba={alba}
                  onSelect={() => onSelectAlba(alba.id)}
                  onToggleFavorite={() => onToggleFavorite(alba.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {currentTab === "manage" && (
        <section className={styles.albaFeedSection}>
          <div className={styles.albaFeedHeading}>
            <h2>구인글 관리</h2>
            <button
              type="button"
              className={styles.albaManageWriteBtn}
              onClick={onWrite}
            >
              <Plus size={16} />
              새 공고 작성
            </button>
          </div>
          <div className={styles.albaGrid}>
            {albas.slice(0, 2).map((alba) => (
              <AlbaCardComponent
                key={alba.id}
                alba={alba}
                onSelect={() => onSelectAlba(alba.id)}
                onToggleFavorite={() => onToggleFavorite(alba.id)}
              />
            ))}
          </div>
        </section>
      )}

      <button type="button" className={styles.albaFloatingWrite} onClick={onWrite} aria-label="알바 공고 작성">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <nav className={styles.albaBottomNav} aria-label="알바 메뉴">
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "home" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("home")}
        >
          <Home size={22} />
          <span>알바 홈</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "search" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("search")}
        >
          <Search size={22} />
          <span>알바 검색</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "applications" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("applications")}
        >
          <BriefcaseBusiness size={22} />
          <span>지원 내역</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "manage" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("manage")}
        >
          <FileText size={22} />
          <span>구인글 관리</span>
        </button>
      </nav>
    </section>
  );
}

function AlbaCardComponent({
  alba,
  onSelect,
  onToggleFavorite,
}: {
  alba: AlbaItem;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article className={styles.albaCard} onClick={onSelect}>
      <div className={styles.albaCardThumbFrame}>
        <div className={styles.albaCardThumbVisual} style={{ background: alba.bgGradient }}>
          <span className={styles.albaCardThumbEmoji}>{alba.thumbnailEmoji ?? "🏢"}</span>
        </div>
        <button
          type="button"
          className={`${styles.albaCardHeartBtn} ${alba.isFavorite ? styles.albaCardHeartBtnActive : ""}`}
          aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart size={16} fill={alba.isFavorite ? "currentColor" : "none"} color="currentColor" />
        </button>
      </div>
      <h3 className={styles.albaCardTitle}>{alba.title}</h3>
      <div className={styles.albaCardPay}>{alba.payLabel}</div>
      <div className={styles.albaCardMeta}>
        {alba.companyName} · {alba.neighborhoodName}
      </div>
      <div className={styles.albaBadgeRow}>
        {alba.badges.map((badge, idx) => (
          <span
            key={`${badge}-${idx}`}
            className={`${styles.albaBadge} ${badge.includes("정직원") || badge.includes("모범") ? styles.albaBadgeGreen : ""}`}
          >
            {badge}
          </span>
        ))}
      </div>
    </article>
  );
}

function AlbaDetailScreen({
  alba,
  onBack,
  onToggleFavorite,
  onApply,
}: {
  alba: AlbaItem;
  onBack: () => void;
  onToggleFavorite: () => void;
  onApply: () => void;
}) {
  return (
    <section className={styles.albaDetailScreen}>
      <div className={styles.albaDetailHero} style={{ background: alba.bgGradient }}>
        <div className={styles.albaDetailNavFloat}>
          <button type="button" onClick={onBack} aria-label="뒤로">
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" aria-label="공유">
              <Share2 size={20} />
            </button>
            <button type="button" aria-label="더보기">
              <EllipsisVertical size={20} />
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "8px" }}>{alba.thumbnailEmoji ?? "🏢"}</span>
          <strong>{alba.companyName}</strong>
        </div>
      </div>

      <div className={styles.albaDetailContent}>
        <h1 className={styles.albaDetailTitle}>{alba.title}</h1>
        <div className={styles.albaDetailCompanyRow}>
          <span>{alba.companyName}</span> · <span>{alba.neighborhoodName}</span>
          {alba.reviewCount && <span> · 후기 {alba.reviewCount}개</span>}
        </div>

        {/* Key Conditions Box */}
        <div className={styles.albaDetailConditionBox}>
          <div className={styles.albaDetailConditionItem}>
            <Clock3 size={22} />
            <div>
              <span>급여</span><br />
              <strong>{alba.payLabel}</strong>
            </div>
          </div>
          <div className={styles.albaDetailConditionItem}>
            <Calendar size={22} />
            <div>
              <span>근무 요일</span><br />
              <strong>{alba.workingDays}</strong>
            </div>
          </div>
          <div className={styles.albaDetailConditionItem}>
            <Clock3 size={22} />
            <div>
              <span>근무 시간</span><br />
              <strong>{alba.workingHours}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Duties */}
        <h2 className={styles.albaDetailSectionHeading}>근무 내용 및 상세 정보</h2>
        <div className={styles.albaDetailDuties}>
          <p style={{ margin: "0 0 10px", fontWeight: 600 }}>{alba.details}</p>
          <ul>
            {alba.descriptionBullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>
        </div>

        {/* Location Info */}
        <h2 className={styles.albaDetailSectionHeading}>근무지 위치</h2>
        <div className={styles.albaDetailDuties}>
          <strong>📍 {alba.detailLocation}</strong>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: "0.8125rem" }}>
            {alba.neighborhoodName}
          </p>
        </div>

        <div className={styles.albaDetailStatsFooter}>
          조회 {alba.viewCount} · 지원자 {alba.applicantCount}명 · 등록 {alba.createdAt}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <footer className={styles.albaDetailActionBar}>
        <button
          type="button"
          className={`${styles.albaDetailHeartBtn} ${alba.isFavorite ? styles.albaDetailHeartBtnActive : ""}`}
          aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
          onClick={onToggleFavorite}
        >
          <Heart size={22} fill={alba.isFavorite ? "currentColor" : "none"} color="currentColor" />
        </button>
        <button
          type="button"
          className={styles.albaDetailCallBtn}
          onClick={() => alert(`전화문의: ${alba.phoneContact}`)}
        >
          전화문의
        </button>
        <button
          type="button"
          className={styles.albaDetailApplyBtn}
          onClick={onApply}
        >
          {alba.hasApplied ? "지원 완료 ✓" : "지원하기"}
        </button>
      </footer>
    </section>
  );
}

function AlbaFormScreen({
  activeNeighborhood,
  onBack,
  onSubmit,
}: {
  activeNeighborhood: string;
  onBack: () => void;
  onSubmit: (data: Omit<AlbaItem, "id" | "applicantCount" | "viewCount" | "isFavorite" | "hasApplied" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [payType, setPayType] = useState<"시급" | "일급" | "월급" | "연봉">("시급");
  const [payAmount, setPayAmount] = useState(12000);
  const [workingDays, setWorkingDays] = useState("월~금");
  const [workingHours, setWorkingHours] = useState("09:00 ~ 18:00");
  const [category, setCategory] = useState<AlbaItem["category"]>("식당/카페");
  const [details, setDetails] = useState("");
  const [detailLocation, setDetailLocation] = useState(`${activeNeighborhood} 인근`);
  const [phoneContact, setPhoneContact] = useState("010-1234-5678");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      alert("공고 제목과 업체명을 입력해주세요.");
      return;
    }

    const payLabel = `${payType} ${payAmount.toLocaleString()}원`;
    onSubmit({
      title,
      companyName,
      neighborhoodName: activeNeighborhood,
      detailLocation,
      payType,
      payAmount,
      payLabel,
      workingDays,
      workingHours,
      category,
      badges: ["모범구인"],
      thumbnailTone: "custom",
      thumbnailEmoji: "💼",
      bgGradient: "linear-gradient(135deg, #ff6f0f 0%, #ffb057 100%)",
      descriptionBullets: ["1. 상세 업무 협의 가능", "2. 친절하고 성실한 분 환영"],
      details: details || "함께 즐겁게 일할 이웃을 모집합니다.",
      phoneContact,
    });
  };

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="알바 구인 공고 등록"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px", padding: "0 4px 30px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>공고 제목</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="예: [올리브영] 주말 매장 스태프 모집"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>업체명</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="예: 휴먼코드 / 무신사 스탠다드"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>급여 형태</label>
            <select
              value={payType}
              onChange={(e) => setPayType(e.target.value as any)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            >
              <option value="시급">시급</option>
              <option value="일급">일급</option>
              <option value="월급">월급</option>
              <option value="연봉">연봉</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>금액 (원)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>근무 요일</label>
            <input
              type="text"
              value={workingDays}
              onChange={(e) => setWorkingDays(e.target.value)}
              placeholder="예: 월~금 / 주말"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>근무 시간</label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="예: 09:00 ~ 18:00"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>상세 설명</label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="근무 조건, 하는 일, 우대 사항 등을 상세히 적어주세요."
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <button
          type="submit"
          className={styles.albaDetailApplyBtn}
          style={{ width: "100%", height: "50px", marginTop: "10px" }}
        >
          공고 등록하기
        </button>
      </form>
    </section>
  );
}
