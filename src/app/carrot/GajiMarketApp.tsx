"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
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
  Gem,
  GraduationCap,
  Headphones,
  Heart,
  Home,
  House,
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
  UsersRound,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./GajiMarketApp.module.css";

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
  | { type: "my-menu" }
  | { type: "all-services" }
  | { type: "dream-dashboard" }
  | { type: "dream-notice" }
  | { type: "alba"; tab?: "home" | "search" | "applications" | "manage"; category?: string }
  | { type: "alba-detail"; id: string }
  | { type: "alba-form" }
  | { type: "settings" }
  | { type: "sales" }
  | { type: "favorites" }
  | { type: "search" };

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
  isFavorite: boolean;
  mine: boolean;
  description: string;
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
const COMMUNITY_TABS = ["동네생활", "모임", "카페", "아파트", "게임"];
const COMMUNITY_FILTERS = ["추천", "인기", "취미/여가", "운동/스포츠", "맛집/음식", "동네친구", "일반"];
const CHAT_FILTERS = ["전체", "판매", "구매", "안읽음", "모임", "알바"];
const NEIGHBORHOODS = ["송파삼성래미안", "위례", "공릉", "당산 2동"];

type MapSearchBounds = { south: number; north: number; west: number; east: number };

type NaverMapInstance = {
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
  getBounds: () => {
    getSW: () => { lat: () => number; lng: () => number };
    getNE: () => { lat: () => number; lng: () => number };
  };
};

type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
};

type NaverMapsNamespace = {
  Event?: {
    addListener: (target: NaverMarkerInstance, eventName: string, listener: () => void) => unknown;
  };
  LatLng: new (lat: number, lng: number) => unknown;
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
    icon?: { content: HTMLElement };
  }) => NaverMarkerInstance;
};

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsNamespace;
    };
  }
}

const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
const NAVER_MAP_KEY_ID = process.env.NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID ?? "";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  송파삼성래미안: { lat: 37.504744, lng: 127.118295 },
  위례: { lat: 37.4772, lng: 127.1437 },
  공릉: { lat: 37.6257, lng: 127.0731 },
  "당산 2동": { lat: 37.5351, lng: 126.9028 },
};
const NEIGHBORHOOD_DISTRICTS: Record<string, string> = {
  송파삼성래미안: "송파구",
  위례: "송파구",
  공릉: "노원구",
  "당산 2동": "영등포구",
};

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

const initialChats: ChatRoom[] = [
  {
    id: "chat1",
    type: "GROUP",
    title: "새싹 노카페인 전체방",
    avatarTone: "coffee",
    lastMessage: "쯔양양님이 들어왔어요.",
    lastMessageAt: "2일 전",
    unreadCount: 0,
    verified: false,
    muted: false,
  },
  {
    id: "chat2",
    type: "COMMUNITY",
    title: "위례자이 입주민방",
    avatarTone: "building",
    lastMessage: "안녕하세요. 2026년 7월에 입주한 입주민입니다.",
    lastMessageAt: "2일 전",
    unreadCount: 0,
    verified: false,
    muted: false,
  },
  {
    id: "chat3",
    type: "SYSTEM",
    title: "가지알바",
    avatarTone: "job",
    lastMessage: "24시간 뒤 알바공고가 등록될 예정이에요.",
    lastMessageAt: "3일 전",
    unreadCount: 0,
    verified: true,
    muted: false,
  },
  {
    id: "chat4",
    type: "SYSTEM",
    title: "가지스토어",
    avatarTone: "store",
    lastMessage: "가지스토어 다시 둘러보세요. 앱 첫 화면 쿠폰을 준비했어요.",
    lastMessageAt: "4일 전",
    unreadCount: 1,
    verified: true,
    muted: false,
  },
  {
    id: "chat5",
    type: "GROUP",
    title: "점심시간",
    avatarTone: "calendar",
    lastMessage: "일정 후기를 남겨주세요. 이웃들과 다음 약속을 잡아봐요.",
    lastMessageAt: "4일 전",
    unreadCount: 0,
    verified: false,
    muted: false,
  },
  {
    id: "chat6",
    type: "SYSTEM",
    title: "가지페이",
    avatarTone: "pay",
    lastMessage: "내 계좌로 보냈어요. 계좌와 금액을 확인해주세요.",
    lastMessageAt: "4일 전",
    unreadCount: 1,
    verified: true,
    muted: false,
  },
  {
    id: "chat7",
    type: "TRADE",
    tradeRole: "SELLER",
    title: "원목 사이드 테이블",
    avatarTone: "wood",
    lastMessage: "오늘 저녁 7시에 거래 가능하실까요?",
    lastMessageAt: "방금 전",
    unreadCount: 15,
    verified: false,
    muted: false,
    productId: "p5",
  },
];

const LOCAL_CATEGORIES: LocalCategory[] = [
  { id: "danger", name: "위험", icon: ShieldAlert, tone: "rose" },
  { id: "takeout", name: "포장주문", icon: Utensils, tone: "amber" },
  { id: "lesson", name: "레슨/과외", icon: BookOpen, tone: "rose" },
  { id: "sale", name: "할인중", icon: BadgePercent, tone: "violet" },
  { id: "food", name: "음식점", icon: Utensils, tone: "orange" },
  { id: "delivery", name: "용달", icon: Truck, tone: "blue" },
  { id: "workout", name: "운동", icon: Dumbbell, tone: "cyan" },
  { id: "cafe", name: "카페", icon: Coffee, tone: "yellow" },
  { id: "class", name: "클래스", icon: CakeSlice, tone: "indigo" },
  { id: "academy", name: "학원", icon: GraduationCap, tone: "sky" },
  { id: "clean", name: "청소", icon: SprayCan, tone: "green" },
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
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as ThemeMode);

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
  const [activeNeighborhood, setActiveNeighborhood] = useState("송파삼성래미안");
  const [secondaryNeighborhood, setSecondaryNeighborhood] = useState("공릉");
  const [productFilter, setProductFilter] = useState("전체");
  const [communityTab, setCommunityTab] = useState("동네생활");
  const [communityFilter, setCommunityFilter] = useState("추천");
  const [chatFilter, setChatFilter] = useState("전체");
  const [mapCategory, setMapCategory] = useState<string>("danger");
  const [mapSheetState, setMapSheetState] = useState<"collapsed" | "half" | "expanded">("half");
  const [mapQuery, setMapQuery] = useState("");
  const [mapSearchArea, setMapSearchArea] = useState<{ neighborhood: string; bounds: MapSearchBounds } | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [chats, setChats] = useState<ChatRoom[]>(initialChats);
  const [albaList, setAlbaList] = useState<AlbaItem[]>(ALBA_MOCK_DATA);
  const [dangerSignals, setDangerSignals] = useState<LocalBusiness[]>([]);
  const [dangerSignalsLoaded, setDangerSignalsLoaded] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [extraMessages, setExtraMessages] = useState<Record<string, typeof baseMessages>>({});
  const [isBooting, setIsBooting] = useState(true);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

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

  const totalUnread = useMemo(
    () => chats.reduce((sum, chat) => sum + chat.unreadCount, 0),
    [chats],
  );

  const filteredProducts = useMemo(() => {
    if (hasNetworkError) {
      return [];
    }
    return products.filter((product) => {
      const matchesFilter = productFilter === "전체" || product.category === productFilter;
      const matchesNeighborhood =
        product.neighborhoodName === activeNeighborhood ||
        product.neighborhoodName === secondaryNeighborhood ||
        product.mine;
      return matchesFilter && matchesNeighborhood && product.tradeStatus !== "SOLD";
    });
  }, [activeNeighborhood, hasNetworkError, productFilter, products, secondaryNeighborhood]);

  const favoriteProducts = products.filter((product) => product.isFavorite);
  const myProducts = products.filter((product) => product.mine);

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
    setSubPage(null);
  }

  function toggleFavorite(productId: string) {
    if (isGuestMode) {
      setSheet("status");
      return;
    }
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? {
              ...product,
              isFavorite: !product.isFavorite,
              favoriteCount: product.favoriteCount + (product.isFavorite ? -1 : 1),
            }
          : product,
      ),
    );
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
  }

  function submitMessage(event: FormEvent<HTMLFormElement>, chatId: string) {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text) return;
    setExtraMessages((current) => ({
      ...current,
      [chatId]: [...(current[chatId] ?? []), { mine: true, text, time: "방금 전" }],
    }));
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, lastMessage: text, lastMessageAt: "방금 전", unreadCount: 0 } : chat,
      ),
    );
    setMessageDraft("");
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "중고거래");
    const isFree = form.get("free") === "on";
    const price = Number(form.get("price") ?? 0);

    if (title.length < 2 || description.length < 10) {
      setSheet("status");
      return;
    }

    const newProduct: ProductListItem = {
      id: `p${Date.now()}`,
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
      isFavorite: false,
      mine: true,
      category,
      description,
    };

    setProducts((current) => [newProduct, ...current]);
    setActiveTab("my");
    setSubPage({ type: "sales" });
  }

  function submitCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const category = String(form.get("category") ?? "일반");
    if (title.length < 2 || content.length < 6) {
      setSheet("status");
      return;
    }

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

  const selectedProduct =
    subPage?.type === "product-detail" ? products.find((product) => product.id === subPage.id) : undefined;
  const selectedPost =
    subPage?.type === "community-detail" ? posts.find((post) => post.id === subPage.id) : undefined;
  const selectedChat =
    subPage?.type === "chat-room" ? chats.find((chat) => chat.id === subPage.id) : undefined;

  const showBottomNav = !subPage || ["my-menu", "dream-dashboard", "dream-notice", "settings", "sales", "favorites", "search", "all-services"].includes(subPage.type);
  const isDreamPage = subPage?.type === "dream-dashboard" || subPage?.type === "dream-notice";

  return (
    <div className={`${styles.stage} ${isDreamPage ? styles.dreamStage : ""}`} data-theme={theme}>
      <div className={styles.phoneShell}>
        <main className={`${styles.appViewport} ${activeTab === "map" && !subPage ? styles.mapViewport : ""}`} data-app-scroll>
          {subPage?.type === "product-detail" && selectedProduct ? (
            <ProductDetailScreen
              product={selectedProduct}
              onBack={goBack}
              onFavorite={toggleFavorite}
              onStatusChange={updateProductStatus}
              onChat={() => {
                const room = chats.find((chat) => chat.productId === selectedProduct.id) ?? chats[0];
                openChat(room.id);
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
          ) : subPage?.type === "chat-room" && selectedChat ? (
            <ChatRoomScreen
              room={selectedChat}
              product={selectedChat.productId ? products.find((product) => product.id === selectedChat.productId) : undefined}
              messages={[...baseMessages, ...(extraMessages[selectedChat.id] ?? [])]}
              draft={messageDraft}
              onDraftChange={setMessageDraft}
              onSubmit={(event) => submitMessage(event, selectedChat.id)}
              onBack={goBack}
            />
          ) : subPage?.type === "my-menu" ? (
            <MyMenuScreen onBack={goBack} onOpenAlba={(tab) => setSubPage({ type: "alba", tab })} />
          ) : subPage?.type === "all-services" ? (
            <AllServicesScreen onBack={goBack} onOpenAlba={() => setSubPage({ type: "alba" })} />
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
          ) : activeTab === "home" ? (
            <HomeScreen
              isLoading={isBooting}
              hasError={hasNetworkError}
              activeNeighborhood={activeNeighborhood}
              secondaryNeighborhood={secondaryNeighborhood}
              productFilter={productFilter}
              products={filteredProducts}
              onOpenRegion={() => setSheet("region")}
              onOpenSearch={() => setSubPage({ type: "search" })}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenMenu={() => {
                setActiveTab("my");
                setSubPage({ type: "my-menu" });
              }}
              onFilterChange={setProductFilter}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onFavorite={toggleFavorite}
              onRetry={() => setHasNetworkError(false)}
            />
          ) : activeTab === "community" ? (
            <CommunityScreen
              activeTab={communityTab}
              activeFilter={communityFilter}
              posts={filteredPosts}
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
              categories={LOCAL_CATEGORIES}
              selectedCategory={mapCategory}
              sheetState={mapSheetState}
              query={mapQuery}
              businesses={businesses}
              hasSearchedArea={mapSearchArea?.neighborhood === activeNeighborhood}
              onSearchBounds={(bounds) => setMapSearchArea({ neighborhood: activeNeighborhood, bounds })}
              locationAllowed={locationAllowed}
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
            />
          )}
        </main>

        {!subPage && (activeTab === "home" || activeTab === "community" || (activeTab === "map" && mapSheetState === "expanded")) && (
          <FloatingWriteButton
            onClick={() => {
              if (activeTab === "community") {
                setSubPage({ type: "community-form" });
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
          onNeighborhoodChange={(primary, secondary) => {
            setActiveNeighborhood(primary);
            setSecondaryNeighborhood(secondary);
            setSheet(null);
          }}
          onProductWrite={() => {
            setSheet(null);
            setSubPage({ type: "product-form" });
          }}
          onCommunityWrite={() => {
            setSheet(null);
            setSubPage({ type: "community-form" });
          }}
          totalUnread={totalUnread}
          hasNetworkError={hasNetworkError}
          isGuestMode={isGuestMode}
          onRetry={() => {
            setHasNetworkError(false);
            setSheet(null);
          }}
          onGuestOff={() => {
            setIsGuestMode(false);
            setSheet(null);
          }}
        />
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
      <span className={styles.brandDot}>g</span>
      <span>pay</span>
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
  onOpenRegion: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onFilterChange: (filter: string) => void;
  onProductClick: (id: string) => void;
  onFavorite: (id: string) => void;
  onRetry: () => void;
}) {
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
            {product.favoriteCount > 0 && (
              <span>
                <Heart size={14} fill={product.isFavorite ? "currentColor" : "none"} /> {product.favoriteCount}
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
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={styles.stateBlock}>
      <Sparkles size={30} />
      <h2>{title}</h2>
      <p>{body}</p>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
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
            <strong>보라가지님</strong>
            <span>{product.neighborhoodName}</span>
          </div>
          <button type="button" className={styles.trustPill}>
            신뢰온도 40.1°C
          </button>
        </div>
        <h1>{product.title}</h1>
        <p className={styles.metaLine}>
          {product.category} · {product.createdAt}
        </p>
        <p className={styles.detailDescription}>{product.description}</p>

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
          <input name="title" minLength={2} maxLength={40} placeholder="물건 이름을 입력하세요" required />
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
            minLength={10}
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
      <nav className={styles.topTabs} aria-label="커뮤니티 탭">
        {COMMUNITY_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            className={activeTab === tab ? styles.topTabActive : ""}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
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
          <input name="title" minLength={2} placeholder="동네 이웃에게 물어보세요" required />
        </label>
        <label>
          내용
          <textarea name="content" minLength={6} placeholder="상세 내용을 입력하세요" required />
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

  const item1 = streamAlerts[currentIndex];
  const item2 = streamAlerts[(currentIndex + 1) % streamAlerts.length];

  return (
    <div className={styles.realtimeNewsCard}>
      <div className={styles.realtimeNewsHeader}>
        <span className={styles.realtimeDot} />
        <strong>실시간 소식</strong>
      </div>
      <div className={styles.realtimeNewsSlider}>
        <div
          key={`row1-${currentIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item1.business && onSelectDanger) {
              onSelectDanger(item1.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item1.title}</p>
          <small className={styles.realtimeNewsTag}>{item1.tag}</small>
        </div>
        <div
          key={`row2-${currentIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item2.business && onSelectDanger) {
              onSelectDanger(item2.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item2.title}</p>
          <small className={styles.realtimeNewsTag}>{item2.tag}</small>
        </div>
      </div>
    </div>
  );
}

function MapScreen({
  activeNeighborhood,
  categories,
  selectedCategory,
  sheetState,
  query,
  businesses,
  hasSearchedArea,
  onSearchBounds,
  locationAllowed,
  onCategoryChange,
  onSheetStateChange,
  onQueryChange,
  onRequestLocation,
  onOpenProfile,
}: {
  activeNeighborhood: string;
  categories: LocalCategory[];
  selectedCategory: string;
  sheetState: "collapsed" | "half" | "expanded";
  query: string;
  businesses: LocalBusiness[];
  hasSearchedArea: boolean;
  onSearchBounds: (bounds: MapSearchBounds) => void;
  locationAllowed: boolean;
  onCategoryChange: (id: string) => void;
  onSheetStateChange: (state: "collapsed" | "half" | "expanded") => void;
  onQueryChange: (value: string) => void;
  onRequestLocation: () => void;
  onOpenProfile: () => void;
}) {
  const currentCategory = categories.find((category) => category.id === selectedCategory) ?? categories[0];
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

  useEffect(() => () => { locationRequestRef.current += 1; }, []);
  const visibleSelectedDanger = selectedDanger && businesses.some((business) => business.id === selectedDanger.id)
    ? selectedDanger
    : null;

  const selectDanger = useCallback((business: LocalBusiness) => {
    if (business.category !== "danger") return;
    setSelectedDanger(business);
  }, []);

  function changeCategory(id: string) {
    setSelectedDanger(null);
    onCategoryChange(id);
  }

  function changeQuery(value: string) {
    setSelectedDanger(null);
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
        <NaverMapLayer
          activeNeighborhood={activeNeighborhood}
          businesses={businesses}
          currentLocation={currentLocation}
          centerRequest={centerRequest}
          onSelectBusiness={selectDanger}
          onSearchBounds={(bounds) => {
            onSearchBounds(bounds);
            onSheetStateChange("expanded");
          }}
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
        {sheetState !== "expanded" ? (
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
        <button type="button" className={styles.mapCategoryFab} aria-label={currentCategory.name}>
          <currentCategory.icon size={26} />
        </button>
        {visibleSelectedDanger ? (
          <DangerSignalCallout business={visibleSelectedDanger} onClose={() => setSelectedDanger(null)} />
        ) : null}
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
            <section className={styles.localResults}>
              <h2 aria-live="polite">
                {hasSearchedArea ? `현 지도 검색 결과 ${businesses.length}곳` : "이런 동네 가게 알고 있었나요?"}
              </h2>
              {businesses.length === 0 ? (
                <StateBlock
                  title="검색 결과가 없어요"
                  body="다른 카테고리나 검색어로 다시 찾아보세요."
                  actionLabel="검색어 지우기"
                  onAction={() => changeQuery("")}
                />
              ) : (
                <div className={styles.businessGrid}>
                  {businesses.map((business) => {
                    const dangerVisual = getDangerVisual(business);
                    return (
                      <article key={business.id} className={styles.businessCard}>
                        <button type="button" aria-label={`${business.name} 관심`}>
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
                          ) : (
                            business.name.slice(0, 2)
                          )}
                        </div>
                        <h3>{business.name}</h3>
                        <p>{business.summary}</p>
                        <small>
                          {dangerVisual
                            ? `${business.distance}${business.neighborhoodName ? ` · ${business.neighborhoodName}` : ""}`
                            : `${business.distance} · ${business.openNow ? "영업중" : "준비중"}`}
                        </small>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}

function NaverMapLayer({
  activeNeighborhood,
  businesses,
  currentLocation,
  centerRequest,
  onSelectBusiness,
  onSearchBounds,
}: {
  activeNeighborhood: string;
  businesses: LocalBusiness[];
  currentLocation: { lat: number; lng: number } | null;
  centerRequest: number;
  onSelectBusiness: (business: LocalBusiness) => void;
  onSearchBounds: (bounds: MapSearchBounds) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const [isNaverMapReady, setIsNaverMapReady] = useState(false);
  const canUseNaverMap = Boolean(NAVER_MAP_KEY_ID && isNaverMapReady);

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

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !canUseNaverMap) return;

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
  }, [businesses, canUseNaverMap, onSelectBusiness]);

  return (
    <>
      <div className={styles.naverMapFrame}>
        <div ref={mapElementRef} className={styles.naverMapLayer} aria-hidden={!canUseNaverMap} />
      </div>
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
}: {
  rooms: ChatRoom[];
  activeFilter: string;
  isLoading: boolean;
  unreadCount: number;
  onFilterChange: (filter: string) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenChat: (id: string) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="채팅"
        actions={
          <>
            <IconButton label="채팅 알림" onClick={onOpenNotifications}>
              <Bell size={28} />
              {unreadCount > 0 && <span className={styles.notificationDot} />}
            </IconButton>
            <IconButton label="설정" onClick={onOpenSettings}>
              <Settings size={29} />
            </IconButton>
          </>
        }
      />
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
      {isLoading ? (
        <ChatSkeletonList />
      ) : rooms.length === 0 ? (
        <StateBlock
          title="해당 채팅이 없어요"
          body="다른 필터를 선택하거나 새 거래를 시작해보세요."
          actionLabel="전체 보기"
          onAction={() => onFilterChange("전체")}
        />
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

function ChatRoomScreen({
  room,
  product,
  messages,
  draft,
  onDraftChange,
  onSubmit,
  onBack,
}: {
  room: ChatRoom;
  product?: ProductListItem;
  messages: typeof baseMessages;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
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
          <IconButton label="채팅 메뉴">
            <Menu size={25} />
          </IconButton>
        }
      />
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
}: {
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
}) {
  const services: IconItem[] = [
    { label: "중고거래", icon: ShoppingBag, tone: "primary", onClick: onOpenSales },
    { label: "모임", icon: UsersRound, tone: "violet" },
    { label: "내 아파트", icon: Building2, tone: "blue" },
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
          <strong>보라가지님</strong>
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
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const [isNaverMapReady, setIsNaverMapReady] = useState(false);
  const [hasMapError, setHasMapError] = useState(!NAVER_MAP_KEY_ID);
  const canUseNaverMap = Boolean(NAVER_MAP_KEY_ID && isNaverMapReady);

  useEffect(() => {
    if (!NAVER_MAP_KEY_ID) return;
    let isMounted = true;
    loadNaverMapScript(NAVER_MAP_KEY_ID)
      .then(() => {
        if (isMounted) setIsNaverMapReady(Boolean(window.naver?.maps));
      })
      .catch(() => {
        if (isMounted) {
          setIsNaverMapReady(false);
          setHasMapError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    const maps = window.naver?.maps;
    if (!mapElement || !maps || !canUseNaverMap) return;

    const centerCoord = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
    const center = new maps.LatLng(centerCoord.lat, centerCoord.lng);
    const zoom = mapElement.clientHeight < 420 ? 14 : 15;
    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElement, {
        center,
        zoom,
        logoControl: false,
        mapDataControl: false,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.setZoom(mapElement.clientHeight < 420 ? 14 : 15);
    });
    resizeObserver.observe(mapElement);
    return () => resizeObserver.disconnect();
  }, [activeNeighborhood, canUseNaverMap]);

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !canUseNaverMap) return;

    markerRefs.current = facilities.map((facility) => {
      const isSelected = facility.id === selectedFacility?.id;
      const marker = new maps.Marker({
          position: new maps.LatLng(facility.lat, facility.lng),
          map,
          title: facility.name,
          zIndex: 90,
          icon: {
            content: createDreamFacilityMarkerContent(
              facility,
              isSelected,
              onSelectFacility,
            ),
          },
        });
      return marker;
    });
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [facilities, selectedFacility, canUseNaverMap, onSelectFacility]);

  return (
    <div className={styles.dreamMapCanvas}>
      <div className={styles.naverMapFrame}>
        <div ref={mapElementRef} className={styles.naverMapLayer} aria-hidden={!canUseNaverMap} />
      </div>
      {selectedFacility && (
        <DreamFacilityCallout
          facility={selectedFacility}
          onClose={() => onSelectFacility(null)}
        />
      )}
      {!canUseNaverMap && (
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
        disabled={!canUseNaverMap}
        onClick={() => {
          const maps = window.naver?.maps;
          const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
          if (!maps || !mapRef.current) return;
          mapRef.current.setCenter(new maps.LatLng(center.lat, center.lng));
          mapRef.current.setZoom((mapElementRef.current?.clientHeight ?? 540) < 420 ? 14 : 15);
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
          { label: "로그아웃", icon: LogOut },
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

function AllServicesScreen({
  onBack,
  onOpenAlba,
}: {
  onBack: () => void;
  onOpenAlba?: () => void;
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
        { label: "알바", icon: BriefcaseBusiness, color: "#ff6f0f", onClick: onOpenAlba },
        { label: "부동산", icon: House, color: "#e64980" },
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
        { label: "내 아파트", icon: Building2, color: "#4d638c" },
        { label: "아파트 오픈게시판", icon: Building2, color: "#7950f2" },
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
        { label: "당근 교환권", icon: QrCode, color: "#a970ff" },
      ],
    },
    {
      title: "혜택/브랜드",
      items: [
        { label: "혜택", icon: Gem, color: "#339af0" },
        { label: "선물가게", icon: CakeSlice, color: "#ff922b" },
        { label: "동네걷기", icon: Dumbbell, color: "#ff922b" },
        { label: "당근이네", icon: Sparkles, color: "#20b77a" },
        { label: "게임", icon: Headphones, color: "#845ef7" },
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
        { label: "미용실", icon: Sparkles, color: "#a970ff" },
        { label: "뷰티", icon: Heart, color: "#a970ff" },
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
                  <button type="button" key={`${item.label}-${idx}`} className={styles.serviceItemButton}>
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
          <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #7537c5)" />
          <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #7537c5)" />
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
    { id: "map", label: "갖가지", icon: MapPin },
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
            <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #7537c5)" />
            <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #7537c5)" />
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

function FloatingWriteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.floatingWrite} onClick={onClick} aria-label="글쓰기">
      <Plus size={20} strokeWidth={2.5} /> 글쓰기
    </button>
  );
}

function BottomSheet({
  sheet,
  activeNeighborhood,
  secondaryNeighborhood,
  onClose,
  onNeighborhoodChange,
  onProductWrite,
  onCommunityWrite,
  totalUnread,
  hasNetworkError,
  isGuestMode,
  onRetry,
  onGuestOff,
}: {
  sheet: SheetId;
  activeNeighborhood: string;
  secondaryNeighborhood: string;
  onClose: () => void;
  onNeighborhoodChange: (primary: string, secondary: string) => void;
  onProductWrite: () => void;
  onCommunityWrite: () => void;
  totalUnread: number;
  hasNetworkError: boolean;
  isGuestMode: boolean;
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
              <button type="button">
                <MapPinned size={28} /> 모임
              </button>
              <button type="button">
                <BriefcaseBusiness size={28} /> 가지알바
              </button>
            </div>
          </>
        )}
        {sheet === "region" && (
          <>
            <h2>활동지역 설정</h2>
            <p className={styles.sheetCopy}>지역을 바꾸면 홈 상품, 커뮤니티 글, 지도 업체가 같은 기준으로 갱신됩니다.</p>
            <div className={styles.regionGrid}>
              {NEIGHBORHOODS.map((region) => (
                <button
                  type="button"
                  key={region}
                  className={activeNeighborhood === region ? styles.regionActive : ""}
                  onClick={() => onNeighborhoodChange(region, secondaryNeighborhood === region ? activeNeighborhood : secondaryNeighborhood)}
                >
                  {region}
                </button>
              ))}
            </div>
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
            {isGuestMode ? (
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
            ) : (
              <StateBlock
                title="입력값을 확인해주세요"
                body="제목은 2자 이상, 설명은 10자 이상이어야 합니다."
                actionLabel="닫기"
                onAction={onClose}
              />
            )}
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
    { label: "이웃알바", emoji: "🧡", icon: Heart },
    { label: "걸어서10분", emoji: "👟", icon: Footprints },
    { label: "단기알바", emoji: "📅", icon: Calendar },
    { label: "식당/카페", emoji: "🏪", icon: Utensils },
    { label: "물류/현장", emoji: "📦", icon: Package },
    { label: "레슨/과외", emoji: "📕", icon: BookOpen },
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
          {/* Top Quick Area */}
          <section className={styles.albaTopSection}>
            <div
              className={styles.albaPopularCard}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory(null)}
            >
              <div className={styles.albaPopularCardCopy}>
                <span>우리동네</span>
                <strong>인기알바 보기 <ChevronRight size={16} /></strong>
              </div>
              <div className={styles.albaPopularMapVisual}>
                <MapPin size={28} color="#ffffff" className={styles.albaPopularPinIcon} fill="#ff6f0f" />
              </div>
            </div>

            <div className={styles.albaCategoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={`${styles.albaCategoryBtn} ${isSelected ? styles.chipActive : ""}`}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                  >
                    <span className={styles.albaCategoryIconCircle}>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2-Column Grid Feed */}
          <section className={styles.albaFeedSection}>
            <div className={styles.albaFeedHeading}>
              <h2>
                {selectedCategory ? `${selectedCategory} 목록` : `${activeNeighborhood === "송파삼성래미안" ? "한남동" : activeNeighborhood}에서 많이 찾는 알바`}
              </h2>
              <small>광고 ⓘ</small>
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
          <div className={styles.mapSearch} style={{ margin: "10px 0 16px" }}>
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
              body="마음에 드는 동네 알바를 찾아서 지원해보세요!"
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
              className={styles.albaBadgeGreen}
              style={{ border: 0, padding: "6px 12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              onClick={onWrite}
            >
              + 새 공고 작성
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

      {/* Floating Orange Write Button */}
      <button type="button" className={styles.albaFloatingWrite} onClick={onWrite}>
        <Plus size={20} strokeWidth={2.5} /> 글쓰기
      </button>

      {/* Alba 4-Tab Bottom Navigation Bar */}
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
          <span style={{ fontSize: "2rem" }}>{alba.thumbnailEmoji ?? "🏢"}</span>
        </div>
        <button
          type="button"
          className={styles.albaCardHeartBtn}
          aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart size={16} fill={alba.isFavorite ? "#ff6f0f" : "none"} color={alba.isFavorite ? "#ff6f0f" : "#ffffff"} />
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
          className={styles.albaDetailHeartBtn}
          aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
          onClick={onToggleFavorite}
        >
          <Heart size={22} fill={alba.isFavorite ? "#ff6f0f" : "none"} color={alba.isFavorite ? "#ff6f0f" : "currentColor"} />
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
      bgGradient: "linear-gradient(135deg, #7537c5 0%, #a970ff 100%)",
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
