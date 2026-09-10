"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import styles from "./GajiMarketApp.module.css";

// Components (Barrel Export from ./components)
import {
  // common
  BottomNav,
  BottomSheet,
  FloatingWriteButton,
  HomeFloatingActionMenu,
  AllServicesScreen,
  RegionSearchScreen,
  SearchScreen,
  DaangnSplash,
  // trade
  HomeScreen,
  ProductDetailScreen,
  ProductFormScreen,
  // community
  CommunityScreen,
  CommunityDetailScreen,
  ApartmentVerificationScreen,
  ApartmentCommunityScreen,
  CommunityFormScreen,
  // map
  MapScreen,
  // chat
  ChatsScreen,
  ChatRoomScreen,
  PaymentAmountScreen,
  PaymentDetailScreen,
  // my
  MyScreen,
  MyMenuScreen,
  SettingsScreen,
  CustomerSupportScreen,
  CarrotNoticeScreen,
  ManagementScreen,
  FavoriteScreen,
  DreamDashboardScreen,
  DreamNoticeScreen,
  DreamPointsHistoryScreen,
  WalletChargeScreen,
  WalletPayScreen,
  // real-estate
  RealEstateScreen,
  // alba
  AlbaMainScreen,
  AlbaDetailScreen,
  AlbaFormScreen,
  // together
  TogetherIntroView,
  TogetherCategoryView,
  TogetherFormView,
  TogetherDetailView,
  // merge-game
  GajiMergeGameScreen,
} from "./components";

// Services
import {
  getMe,
  updateRegion,
  listProducts,
  getProduct,
  createProduct,
  setFavorite,
  logout as logoutRequest,
  withdrawAccount,
  AuthRequiredError,
  getTogetherPosts,
  createTogetherPost,
  toggleTogetherJoin,
  getMyFavorites,
  getMyProducts,
  getRecentlyViewed,
  recordProductView,
  updateProduct,
  uploadProductImage,
  listCategories,
  deleteProduct,
  listCommunityPosts,
  getCommunityPost,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  toggleCommunityPostEmotion,
  listCommunityPostComments,
  createCommunityPostComment,
  deleteCommunityPostComment,
} from "@/services";
import {
  createOrGetChatRoom,
  leaveChatRoom as leaveChatRoomRequest,
  listChatRooms,
  listMessages as listChatMessages,
  sendMessage as sendChatMessage,
  sendImageMessage,
  updateChatTradeStatus,
  type ChatMessageDto,
  type ChatTradeStatus,
} from "@/services/chatService";
import { blockUser, reportUser } from "@/services/safetyService";
import { getWalletBalance, sendPayment as sendWalletPayment, chargeWallet, payByQr } from "@/services/walletService";
import { getDreamPointsBalance } from "@/services/dreamService";

// Types
import type {
  TogetherCategory,
  TogetherPost,
  CreateTogetherPostInput,
  Me,
} from "@/types";
import type { CommunityComment } from "@/types/community";
import type {
  AlbaItem,
  ChatMessageUi,
  ChatRoom,
  CommunityPost,
  DangerSignalApiResponse,
  LocalBusiness,
  MapSearchBounds,
  ProductListItem,
  Region,
  SheetId,
  SubPage,
  TabId,
  ThemeMode,
  TradeStatus,
} from "./types";

// Constants & Utils
import {
  ALBA_MOCK_DATA,
  initialPosts,
  initialProducts,
  LOCAL_BUSINESSES,
  LOCAL_CATEGORIES,
  NEIGHBORHOOD_COORDS,
  NEIGHBORHOOD_STORAGE_KEY,
  PRODUCT_FILTERS,
  THEME_STORAGE_KEY,
} from "./constants";
import {
  apiUrl,
  matchesNeighborhood,
  matchRegionId,
  readNeighborhoodCache,
  readTheme,
  setSessionTheme,
  subscribeTheme,
  toChatMessageUi,
  toChatRoomUi,
  toDangerBusiness,
  toProductListItem,
  toCommunityPost,
  writeNeighborhoodCache,
} from "./utils";

type ProductSort = "latest" | "price_asc" | "price_desc";

interface ProductFilters {
  category?: string;
  tradeType?: "SALE" | "FREE";
  priceMin?: number;
  priceMax?: number;
  sort: ProductSort;
  excludeSold?: boolean;
}

const DEFAULT_PRODUCT_FILTERS: ProductFilters = { sort: "latest" };
const COMMUNITY_REPORT_REASONS = ["스팸/홍보", "욕설/비방", "음란하거나 부적절한 내용", "사기/허위 정보", "기타"];

function hasActiveProductFilters(filters: ProductFilters): boolean {
  return (
    Boolean(filters.category) ||
    Boolean(filters.tradeType) ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.sort !== "latest" ||
    Boolean(filters.excludeSold)
  );
}

export default function GajiMarketApp() {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as ThemeMode);

  function handleLogout() {
    logoutRequest().finally(() => router.replace("/onboarding"));
  }

  function handleWithdraw() {
    if (!window.confirm("정말 탈퇴하시겠어요?\n작성한 글과 채팅 내역은 남지만, 계정 정보는 삭제되고 되돌릴 수 없어요.")) return;
    withdrawAccount()
      .then(() => router.replace("/onboarding"))
      .catch(() => window.alert("탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요."));
  }

  function changeTheme(value: ThemeMode) {
    setSessionTheme(value);
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
  const [isHomeActionMenuOpen, setIsHomeActionMenuOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  // 로그인 필수 게이트: getMe() 응답이 오기 전엔 화면을 그리지 않고, 비로그인/토큰
  // 만료면 온보딩으로 보낸다 — 게스트 열람 허용하던 이전 동작을 없앤 것.
  const [authChecked, setAuthChecked] = useState(false);
  const [myProducts, setMyProducts] = useState<ProductListItem[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductListItem[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<ProductListItem[]>([]);
  // 새로고침해도 유지되도록 로컬 캐시로 초기값을 잡는다 — 로그인 유저는 아래 getMe()
  // effect가 서버 값(대표 동네)으로 다시 덮어쓰지만, 게스트는 서버에 저장할 데가
  // 없어서 이 캐시가 유일한 저장소다. 부동네는 로그인 여부와 무관하게 항상 캐시뿐.
  const [activeNeighborhood, setActiveNeighborhood] = useState(() => readNeighborhoodCache()?.primary ?? "문래동");
  // 실제 당근처럼 동네는 1개(대표)만 필수고, 2번째는 있을 수도 없을 수도 있다.
  const [secondaryNeighborhood, setSecondaryNeighborhood] = useState<string | null>(
    () => readNeighborhoodCache()?.secondary ?? null,
  );

  useEffect(() => {
    writeNeighborhoodCache({ primary: activeNeighborhood, secondary: secondaryNeighborhood });
  }, [activeNeighborhood, secondaryNeighborhood]);

  // 이 시점엔 AuthGate가 이미 로그인 여부를 확인한 뒤라 여기서 또 실패한다고
  // 곧장 로그아웃 취급하면 안 된다 — 네트워크 순단/서버 일시 오류로 여기 getMe()만
  // 어쩌다 실패해도 (AuthGate 통과 직후라 방금 로그인 확인은 됐는데) 온보딩으로
  // 튕겨나가던 버그가 있었다. 진짜 인증 실패(AuthRequiredError)일 때만 리다이렉트하고,
  // 그 외엔 몇 번 재시도한다.
  useEffect(() => {
    let cancelled = false;
    function run(attempt: number) {
      getMe()
        .then((fetchedMe) => {
          if (cancelled) return;
          if (fetchedMe.role === "admin") {
            // 관리자 계정은 모바일 당근 소비자 세션으로 진입하지 않고 온보딩으로 분리
            handleLogout();
            return;
          }
          if (!fetchedMe.nicknameSet) {
            router.replace("/onboarding/profile");
            return;
          }
          setMe(fetchedMe);
          // 서버에 저장된 대표 동네가 로컬 캐시보다 우선 — 다른 기기에서 바꿨을 수도 있으니.
          if (fetchedMe.region) {
            setActiveNeighborhood(fetchedMe.region.dongName);
          }
          setAuthChecked(true);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          if (error instanceof AuthRequiredError) {
            router.replace("/onboarding");
            return;
          }
          if (attempt + 1 < 3) {
            window.setTimeout(() => run(attempt + 1), 1200);
          } else {
            console.error("내 정보를 불러오지 못했습니다.", error);
          }
        });
    }
    run(0);
    return () => {
      cancelled = true;
    };
  }, [router]);

  // 판매내역/찜 목록은 일반 목록(products)을 mine/isFavorite로 거르는 방식으로는
  // 못 만든다 — 그 두 값이 실서버 데이터에 대해 항상 false라 새로고침(새 세션)마다
  // 빈 목록이 됐었다(버그). 서버가 이미 created_by/찜 여부로 걸러주는 전용
  // 엔드포인트를 그대로 쓴다.
  // 판매내역/찜목록 각각 다시 받아온다 — 최초 로딩 effect와 각 화면의 당겨서
  // 새로고침(pull-to-refresh) 둘 다 이 두 함수를 그대로 재사용한다.
  const refreshMyProducts = useCallback(async (signal?: AbortSignal) => {
    const page = await getMyProducts(signal);
    setMyProducts(page.items.map((item) => ({ ...toProductListItem(item), mine: true })));
  }, []);
  const refreshFavorites = useCallback(async (signal?: AbortSignal) => {
    const page = await getMyFavorites(signal);
    setFavoriteProducts(page.items.map((item) => ({ ...toProductListItem(item), isFavorite: true })));
  }, []);

  useEffect(() => {
    // me는 로그아웃 전환 없이 null -> 값으로만 바뀌므로(로그아웃은 페이지 리로드),
    // 로그인 전 상태는 그냥 초기값([])을 쓰면 된다 — 여기서 다시 비울 필요 없음.
    if (!me) return;
    const controller = new AbortController();
    // refreshMyProducts/refreshFavorites 내부에서 setState를 동기 호출한다 —
    // effect가 로그인 시점에 최초 1회 불러오는 본연의 목적이라 정당한 케이스.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refreshMyProducts(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("판매내역을 불러오지 못했습니다.", error);
    });
    refreshFavorites(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("찜 목록을 불러오지 못했습니다.", error);
    });
    return () => controller.abort();
  }, [me, refreshMyProducts, refreshFavorites]);

  const [recentNeighborhoods, setRecentNeighborhoods] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // 동네 검색은 이제 "대표 전환"이 아니라 항상 "2번째 동네 추가"다 — 빈 슬롯이 있을 때만
  // 버튼이 보이니 여기선 늘 secondary만 채운다. 대표를 바꾸고 싶으면 설정 화면 라디오로.
  // RegionSearchScreen이 이미 등록된 동네를 목록에서 빼주지만, 최근 동네 칩 등으로
  // 우회해서 들어올 수도 있어 여기서도 한 번 더 막는다(중복 등록 방지의 최종 관문).
  // 대표/2번째 동네를 서로 맞바꾼다 — 헤더의 동네 이름 더블클릭, 설정 화면 라디오 선택 둘 다 이걸 씀.
  function swapNeighborhood(dongName: string) {
    if (dongName === activeNeighborhood) return;
    setSecondaryNeighborhood(activeNeighborhood === dongName ? secondaryNeighborhood : activeNeighborhood);
    setActiveNeighborhood(dongName);
  }

  function addNeighborhood(dongName: string) {
    // 이미 등록된 동네(대표든 2번째든)를 다시 고르면 아무 것도 안 한다 — 중복 등록 방지.
    if (dongName === activeNeighborhood || dongName === secondaryNeighborhood) return;
    const returnTo = subPage?.type === "region-search" ? subPage.returnTo : undefined;
    setSecondaryNeighborhood(dongName);
    setRecentNeighborhoods((current) => [dongName, ...current.filter((n) => n !== dongName)].slice(0, 5));
    setToastMessage(`'${dongName}'을 동네에 추가했어요.`);
    setSheet(null);
    setSubPage(returnTo ? { type: returnTo } : null);
  }
  const [productFilter, setProductFilter] = useState("전체");
  const [productFilters, setProductFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((error: unknown) => console.error("카테고리 목록을 불러오지 못했습니다.", error));
  }, []);
  const [communityTab, setCommunityTab] = useState("전체");
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
  // 판매자가 본인 글에서 "채팅하기" → 그 글에 걸린 N:1 채팅방 목록(chat-room-list)용.
  // 최초 1회 불러온 전체 chats 상태는 그 이후 새로 생긴 방을 못 담을 수 있어서(스테일),
  // 이 화면에 들어갈 때마다 product_id 필터로 서버에서 새로 받아온다.
  const [productChatRooms, setProductChatRooms] = useState<ChatRoom[]>([]);
  const [productChatRoomsLoading, setProductChatRoomsLoading] = useState(false);
  const [albaList, setAlbaList] = useState<AlbaItem[]>(ALBA_MOCK_DATA);
  const [dangerSignals, setDangerSignals] = useState<LocalBusiness[]>([]);
  const [dangerSignalsLoaded, setDangerSignalsLoaded] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessageUi[]>>({});
  // 차단/신고엔 상대방 user id가 필요한데 채팅방 응답엔 없어서, 메시지에 실려오는
  // sender_id로부터 알아낸다 — 아직 메시지가 하나도 없으면 모르는 채로 남는다.
  const [roomOtherUserId, setRoomOtherUserId] = useState<Record<string, number>>({});
  // 당근페이 잔액 — 송금 화면 진입할 때마다 새로 받아온다(다른 채팅방에서 이미
  // 써버렸을 수 있어서 캐시하지 않음). null이면 아직 로딩 중.
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  // 꿈방울(기부 가능 포인트) — 결제(일반결제 1%, 중고거래 0.1%·5,000원 이상)할 때마다
  // 서버에서 자동 적립되니 여긴 조회만. My탭 "포인트" 배지에 씀.
  const [dreamPoints, setDreamPoints] = useState<number | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [verifiedApartment, setVerifiedApartment] = useState<string | null>(null);
  const [deleteCommunityTarget, setDeleteCommunityTarget] = useState<CommunityPost | null>(null);
  const [reportCommunityTarget, setReportCommunityTarget] = useState<CommunityPost | null>(null);
  const [communityReportReason, setCommunityReportReason] = useState("스팸/홍보");
  const [communityComments, setCommunityComments] = useState<Record<string, CommunityComment[]>>({});
  const [communityCommentsLoading, setCommunityCommentsLoading] = useState(false);
  const [communityCommentDraft, setCommunityCommentDraft] = useState("");

  const openApartmentFlow = useCallback(() => {
    if (verifiedApartment) {
      setSubPage({ type: "apartment-community", apartmentName: verifiedApartment });
    } else {
      setSubPage({ type: "apartment-verification" });
    }
  }, [verifiedApartment]);

  // 채팅방 목록. 로그인 전엔 서버가 401을 주므로 me가 로드된 뒤에만 시도한다.
  // 최초 로딩 effect와 채팅목록 화면의 당겨서 새로고침 둘 다 이 함수를 재사용한다.
  const refreshChats = useCallback(async (signal?: AbortSignal) => {
    const page = await listChatRooms(signal);
    setChats(page.items.map(toChatRoomUi));
  }, []);

  useEffect(() => {
    if (!me) return;
    const controller = new AbortController();
    // effect가 로그인 시점에 최초 1회 불러오는 본연의 목적이라 정당한 케이스.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refreshChats(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("채팅 목록을 불러오지 못했습니다.", error);
    });
    return () => controller.abort();
  }, [me, refreshChats]);

  // 당근머니 잔액 — My탭 배지랑 당근페이 송금 화면이 같은 값을 쓴다. 로그인 시점에
  // 한 번 받아두고, 송금 화면을 열 때마다(openPayment) 백그라운드로 다시 받아온다.
  useEffect(() => {
    if (!me) return;
    const controller = new AbortController();
    getWalletBalance(controller.signal)
      .then(setWalletBalance)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("잔액을 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [me]);

  // 꿈방울 잔액 — 로그인 시점에 한 번 받아두고, 결제 성공(송금/QR결제) 직후 refreshDreamPoints로
  // 다시 받아온다(적립은 서버가 결제와 같은 트랜잭션에서 처리하니 여긴 조회만).
  const refreshDreamPoints = useCallback(() => {
    getDreamPointsBalance()
      .then(setDreamPoints)
      .catch((error: unknown) => console.error("포인트를 불러오지 못했습니다.", error));
  }, []);

  useEffect(() => {
    if (!me) return;
    refreshDreamPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- me 바뀔 때만, refreshDreamPoints는 안정적
  }, [me]);

  // 서브페이지(상품 상세 등)로 들어갈 때마다 스크롤을 맨 위로 되돌린다 — 공유 스크롤
  // 컨테이너라 이전 화면의 스크롤 위치가 그대로 남아있어서, 이게 없으면 헤더(뒤로가기)가
  // 화면 밖으로 밀려나 있어 위로 스크롤해야 뒤로 갈 수 있었다.
  useEffect(() => {
    if (!subPage) return;
    window.requestAnimationFrame(() => {
      document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [subPage]);

  // 상품별 채팅방 N:1 목록 — 판매자 본인 글의 "채팅하기"로 chat-room-list에 들어갈 때마다
  // product_id 필터로 새로 받아온다(버그: 예전엔 최초 1회 받은 전체 chats를 클라이언트에서
  // productId로만 걸러서 보여줬는데, 그 이후 새로 생긴 채팅방이 반영이 안 됐다).
  useEffect(() => {
    if (subPage?.type !== "chat-room-list") return;
    const numericProductId = Number(subPage.productId);
    if (!Number.isFinite(numericProductId)) return;
    const controller = new AbortController();
    // productId가 바뀔 때마다 새로 로딩 시작을 알려야 해서(스켈레톤 표시) 불가피하게
    // effect 본문에서 동기 setState — fetch 시작을 어차피 여기서 트리거하므로 의미상
    // 정당한 케이스.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setProductChatRoomsLoading(true);
    listChatRooms(controller.signal, numericProductId)
      .then((page) => {
        const rooms = page.items.map(toChatRoomUi);
        setProductChatRooms(rooms);
        // chat-room 화면은 chats 상태에서 room을 찾으므로(selectedChat), 여기서 받은
        // 최신 정보로 병합해둬야 openChat 이후 헤더/물품카드가 최신 값으로 보인다.
        setChats((current) => [...rooms, ...current.filter((c) => !rooms.some((r) => r.id === c.id))]);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("상품별 채팅방 목록을 불러오지 못했습니다.", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setProductChatRoomsLoading(false);
      });
    return () => controller.abort();
  }, [subPage]);

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
          applyCounterpartLastReadAt(chatId, page.counterpartLastReadAt);
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

  // 결제 QR(=/carrot?pay=<storeId>)을 일반 카메라 앱으로 스캔해 브라우저로 바로 열었을 때도
  // 같은 화면으로 들어오게 — 인앱 스캐너가 읽는 URL과 동일한 파라미터를 여기서도 본다.
  useEffect(() => {
    function openWalletPayFromQuery() {
      const storeId = Number(new URLSearchParams(window.location.search).get("pay"));
      if (Number.isInteger(storeId) && storeId > 0) {
        setActiveTab("my");
        setSubPage({ type: "wallet-pay", storeId });
      }
    }

    openWalletPayFromQuery();
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

  // 홈 피드 1페이지를 다시 받아온다 — 동네/필터가 바뀔 때(effect)와 홈 화면의
  // 당겨서 새로고침(pull-to-refresh) 둘 다 이걸 그대로 재사용한다.
  const refreshProducts = useCallback(
    async (signal?: AbortSignal) => {
      productPageRef.current = 1;
      if (noRegionMatch) {
        setProducts([]);
        setProductsTotal(0);
        return;
      }
      const page = await listProducts(
        {
          page: 1,
          size: 60,
          regionId,
          category: productFilters.category,
          tradeType: productFilters.tradeType,
          priceMin: productFilters.priceMin,
          priceMax: productFilters.priceMax,
          sort: productFilters.sort,
          excludeSold: productFilters.excludeSold,
        },
        signal,
      );
      setProducts(page.items.map(toProductListItem));
      setProductsTotal(page.total);
    },
    [noRegionMatch, regionId, productFilters],
  );

  useEffect(() => {
    if (!regionsLoaded) return; // region 목록 오기 전엔 아직 필터를 확정할 수 없어 대기(부팅 스켈레톤이 가려줌)
    const controller = new AbortController();
    // refreshProducts 내부에서 noRegionMatch면 setProducts([])를 동기 호출한다 —
    // effect가 동네/필터 변화에 반응해 다시 불러오는 본연의 목적이라 정당한 케이스.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refreshProducts(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // 실패하면 mock 목록을 그대로 둔다 (화면이 빈 채로 남지 않도록)
      console.error("상품 목록을 불러오지 못했습니다.", error);
    });
    return () => controller.abort();
  }, [regionsLoaded, refreshProducts]);

  const refreshCommunityPosts = useCallback(
    async (signal?: AbortSignal) => {
      if (noRegionMatch) {
        setPosts([]);
        return;
      }
      const page = await listCommunityPosts({ page: 1, size: 60, regionId }, signal);
      setPosts(page.items.map(toCommunityPost));
    },
    [noRegionMatch, regionId],
  );

  useEffect(() => {
    if (!regionsLoaded) return;
    const controller = new AbortController();
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refreshCommunityPosts(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("커뮤니티 글 목록을 불러오지 못했습니다.", error);
    });
    return () => controller.abort();
  }, [regionsLoaded, refreshCommunityPosts]);

  useEffect(() => {
    if (subPage?.type !== "community-detail") return;
    const id = Number(subPage.id);
    if (!Number.isFinite(id)) return;
    const controller = new AbortController();
    getCommunityPost(id, controller.signal)
      .then((detail) => {
        const post = toCommunityPost(detail);
        setPosts((current) => {
          const exists = current.some((item) => item.id === post.id);
          return exists ? current.map((item) => (item.id === post.id ? post : item)) : [post, ...current];
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("커뮤니티 글 상세를 불러오지 못했습니다.", error);
      });
    return () => controller.abort();
  }, [subPage]);

  useEffect(() => {
    if (subPage?.type !== "community-detail") return;
    const id = Number(subPage.id);
    if (!Number.isFinite(id)) return;
    const controller = new AbortController();
    setCommunityCommentsLoading(true);
    listCommunityPostComments(id, controller.signal)
      .then((page) => {
        setCommunityComments((current) => ({ ...current, [subPage.id]: page.items }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("댓글을 불러오지 못했습니다.", error);
      })
      .finally(() => setCommunityCommentsLoading(false));
    return () => controller.abort();
  }, [subPage]);

  // 무한스크롤: 홈 피드 바닥에 닿으면 다음 페이지를 이어붙인다.
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMoreProducts || products.length >= productsTotal) return;
    setIsLoadingMoreProducts(true);
    const nextPage = productPageRef.current + 1;
    listProducts({
      page: nextPage,
      size: 60,
      regionId,
      category: productFilters.category,
      tradeType: productFilters.tradeType,
      priceMin: productFilters.priceMin,
      priceMax: productFilters.priceMax,
      sort: productFilters.sort,
      excludeSold: productFilters.excludeSold,
    })
      .then((page) => {
        productPageRef.current = nextPage;
        setProducts((prev) => [...prev, ...page.items.map(toProductListItem)]);
        setProductsTotal(page.total);
      })
      .catch((error: unknown) => {
        console.error("추가 상품을 불러오지 못했습니다.", error);
      })
      .finally(() => setIsLoadingMoreProducts(false));
  }, [isLoadingMoreProducts, products.length, productsTotal, regionId, productFilters]);

  // 상품 상세를 열 때마다 "최근 본" 기록도 같이 남긴다 (best-effort, 실패해도 화면엔 영향 없음).
  useEffect(() => {
    if (subPage?.type !== "product-detail") return;
    const id = Number(subPage.id);
    if (!Number.isFinite(id)) return;
    recordProductView(id);
  }, [subPage]);

  // "최근 본" 화면을 열 때마다 매번 새로 받아온다 — 그 사이 새로 본 상품이 반영되게.
  useEffect(() => {
    if (subPage?.type !== "recently-viewed") return;
    const controller = new AbortController();
    getRecentlyViewed(controller.signal)
      .then((page) => setRecentlyViewedProducts(page.items.map(toProductListItem)))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("최근 본 목록을 불러오지 못했습니다.", error);
        }
      });
    return () => controller.abort();
  }, [subPage]);

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
                tradePlaceLat: detail.tradePlaceLat,
                tradePlaceLng: detail.tradePlaceLng,
                sellerNickname: detail.sellerNickname,
                sellerMannerTemp: detail.sellerMannerTemp,
                // 홈 목록에서 바로 들어온 경우 mine=false로 깔려있어서(그 목록 API는
                // is_mine을 안 줌) 상세 API가 내려주는 값으로 덮어써야 "수정" 메뉴가 뜬다.
                mine: detail.isMine ?? p.mine,
                thumbnailUrl: detail.thumbnailUrl ?? p.thumbnailUrl,
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
    return products.filter((product) => {
      // ponytail: 실거래 API엔 동네 검색/지역ID 조회 엔드포인트가 아직 없어서
      // activeNeighborhood로 실서버 데이터를 거를 방법이 없음 — 백엔드에 지역 조회가
      // 생기면 여기서 region_id로 서버 필터링하도록 바꾸기
      // 판매중/예약중/거래완료 전부 홈 피드에 그대로 노출한다(상태로 숨기지 않음).
      return productFilter === "전체" || product.category === productFilter;
    });
  }, [productFilter, products]);

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
    return chats
      .filter((chat) => {
        if (chatFilter === "전체") return true;
        if (chatFilter === "판매") return chat.tradeRole === "SELLER";
        if (chatFilter === "구매") return chat.tradeRole === "BUYER";
        if (chatFilter === "안읽음") return chat.unreadCount > 0;
        if (chatFilter === "모임") return chat.type === "GROUP";
        if (chatFilter === "알바") return chat.title.includes("알바");
        return true;
      })
      .sort(
        (a, b) =>
          (a.lastMessageAtRaw ? new Date(a.lastMessageAtRaw).getTime() : 0) <
          (b.lastMessageAtRaw ? new Date(b.lastMessageAtRaw).getTime() : 0)
            ? 1
            : -1,
      );
  }, [chatFilter, chats]);

  const localBusinesses = useMemo(() => {
    const staticBusinesses = dangerSignalsLoaded
      ? LOCAL_BUSINESSES.filter((business) => business.category !== "danger")
      : LOCAL_BUSINESSES;
    return [...dangerSignals, ...staticBusinesses];
  }, [dangerSignals, dangerSignalsLoaded]);

  const businesses = useMemo(() => {
    const bounds = mapSearchArea && mapSearchArea.neighborhood === activeNeighborhood ? mapSearchArea.bounds : null;
    const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? { lat: 37.5029, lng: 127.1194 };
    const filtered = localBusinesses.filter((business) => {
      const matchesCategory = business.category === mapCategory;
      const matchesRegion = bounds
        ? business.lat >= bounds.south && business.lat <= bounds.north &&
          business.lng >= bounds.west && business.lng <= bounds.east
        : business.category === "danger"
          ? true
          : matchesNeighborhood(business, activeNeighborhood) ||
            (secondaryNeighborhood !== null && matchesNeighborhood(business, secondaryNeighborhood));
      const matchesQuery =
        mapQuery.trim().length === 0 ||
        business.name.includes(mapQuery.trim()) ||
        business.summary.includes(mapQuery.trim()) ||
        business.neighborhoodName.includes(mapQuery.trim()) ||
        (business.districtName?.includes(mapQuery.trim()) ?? false) ||
        (business.riskType?.includes(mapQuery.trim()) ?? false);
      return matchesCategory && matchesRegion && matchesQuery;
    });

    if (mapCategory === "danger") {
      return [...filtered].sort((a, b) => {
        const distA = Math.hypot(a.lat - center.lat, a.lng - center.lng);
        const distB = Math.hypot(b.lat - center.lat, b.lng - center.lng);
        return distA - distB;
      });
    }

    return filtered;
  }, [activeNeighborhood, localBusinesses, mapCategory, mapQuery, secondaryNeighborhood, mapSearchArea]);

  const [togetherPosts, setTogetherPosts] = useState<TogetherPost[]>(() => getTogetherPosts("all"));
  const [togetherCategoryFilter, setTogetherCategoryFilter] = useState<TogetherCategory | "all">("all");

  const filteredTogetherPosts = useMemo(() => {
    if (togetherCategoryFilter === "all") return togetherPosts;
    return togetherPosts.filter((p) => p.category === togetherCategoryFilter);
  }, [togetherPosts, togetherCategoryFilter]);

  function navigateTab(tab: TabId) {
    const isSameTab = activeTab === tab && !subPage;
    setActiveTab(tab);
    setSubPage(null);
    setSheet(null);
    setIsHomeActionMenuOpen(false);
    if (tab === "map") {
      setMapSheetState("half");
    }
    window.requestAnimationFrame(() => {
      document.querySelector("[data-app-scroll]")?.scrollTo({
        top: 0,
        behavior: isSameTab ? "smooth" : "instant",
      });
    });
  }

  function openRealEstate() {
    setSubPage({ type: "real-estate" });
    window.requestAnimationFrame(() => {
      document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function findProductById(id: string): ProductListItem | undefined {
    return products.find((p) => p.id === id) ?? myProducts.find((p) => p.id === id);
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
      subPage?.type === "favorites" ||
      subPage?.type === "recently-viewed"
    ) {
      setActiveTab("my");
      setSubPage(null);
      return;
    }
    if (subPage?.type === "dream-points-history") {
      setSubPage({ type: "dream-dashboard" });
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
    if (subPage?.type === "payment-amount" || subPage?.type === "payment-detail") {
      setSubPage({ type: "chat-room", id: subPage.chatRoomId });
      return;
    }
    if (subPage?.type === "product-form" && subPage.editId) {
      setSubPage({ type: "product-detail", id: subPage.editId });
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
          router.replace("/onboarding");
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

  // 카톡식 "1" 표시용 — 메시지 목록을 받아올 때마다 상대방이 마지막으로 읽은 시각을 갱신.
  function applyCounterpartLastReadAt(chatId: string, counterpartLastReadAt: string | null) {
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, counterpartLastReadAt } : chat)),
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
        applyCounterpartLastReadAt(chatId, page.counterpartLastReadAt);
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
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
            chat.id === chatId
              ? { ...chat, lastMessage: text, lastMessageAt: "방금 전", lastMessageAtRaw: new Date().toISOString() }
              : chat,
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("메시지를 보내지 못했습니다.", error);
        }
      });
  }

  function submitImageMessage(chatId: string, file: File) {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    sendImageMessage(numericId, file)
      .then((message) => {
        setRoomMessages((current) => ({
          ...current,
          [chatId]: [...(current[chatId] ?? []), toChatMessageUi(message, me?.id)],
        }));
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: "사진을 보냈습니다",
                  lastMessageAt: "방금 전",
                  lastMessageAtRaw: new Date().toISOString(),
                }
              : chat,
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("이미지를 보내지 못했습니다.", error);
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
          router.replace("/onboarding");
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
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: message.content ?? "",
                  lastMessageAt: "방금 전",
                  lastMessageAtRaw: new Date().toISOString(),
                }
              : chat,
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
          router.replace("/onboarding");
        } else {
          console.error("거래상태를 변경하지 못했습니다.", error);
          alert("거래상태를 변경하지 못했습니다.");
        }
      });
  }

  function openPayment(chatId: string) {
    setSubPage({ type: "payment-amount", chatRoomId: chatId });
    // 이전에 연 값이 있으면 그대로 보여준 채로 백그라운드에서 새로 받아온다 —
    // My탭 잔액 배지랑 같은 state라 매번 null로 밀면 그쪽도 깜빡인다.
    getWalletBalance()
      .then(setWalletBalance)
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("잔액을 불러오지 못했습니다.", error);
        }
      });
  }

  function viewPayment(chatId: string, transactionId: string) {
    setSubPage({ type: "payment-detail", chatRoomId: chatId, transactionId });
  }

  function submitPayment(chatId: string, amount: number) {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) return;
    sendWalletPayment(numericId, amount)
      .then((message) => {
        setRoomMessages((current) => ({
          ...current,
          [chatId]: [...(current[chatId] ?? []), toChatMessageUi(message, me?.id)],
        }));
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastMessage: `${amount.toLocaleString("ko-KR")}원을 보냈어요`,
                  lastMessageAt: "방금 전",
                  lastMessageAtRaw: new Date().toISOString(),
                  // 백엔드가 송금 시점에 거래완료로 바꿔주므로(계획 문서 3-2절) 프론트도
                  // 곧장 반영 — 안 그러면 새로고침 전까진 여전히 "판매중"으로 보인다.
                  productTradeStatus: "SOLD",
                }
              : chat,
          ),
        );
        const room = chats.find((chat) => chat.id === chatId);
        if (room?.productId) {
          setProducts((prev) => prev.map((p) => (p.id === room.productId ? { ...p, tradeStatus: "SOLD" } : p)));
          setMyProducts((prev) => prev.map((p) => (p.id === room.productId ? { ...p, tradeStatus: "SOLD" } : p)));
        }
        // 송금 직후 내 정보 화면의 당근페이 잔액도 갱신 — 안 그러면 화면을 새로
        // 열기 전까진 송금 전 잔액이 그대로 보인다.
        getWalletBalance()
          .then(setWalletBalance)
          .catch((error: unknown) => console.error("잔액을 갱신하지 못했습니다.", error));
        // 중고거래 송금 0.1% 꿈방울 적립(5,000원 이상만) — 서버가 이미 적립해뒀으니 갱신만.
        refreshDreamPoints();
        if (message.payment) {
          setSubPage({ type: "payment-detail", chatRoomId: chatId, transactionId: String(message.payment.transactionId) });
        } else {
          setSubPage({ type: "chat-room", id: chatId });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("송금하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "송금하지 못했습니다.");
        }
      });
  }

  function submitWalletCharge(amount: number) {
    chargeWallet(amount)
      .then((balance) => {
        setWalletBalance(balance);
        setSubPage(null);
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("충전하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "충전하지 못했습니다.");
        }
      });
  }

  // 성공하면 true — WalletPayScreen이 이걸 보고 완료 화면으로 넘어간다(화면 전환은
  // 거기서 자체적으로 처리하므로 여기선 subPage를 건드리지 않는다).
  function submitWalletPay(storeId: number, amount: number): Promise<boolean> {
    return payByQr(storeId, amount)
      .then((balance) => {
        setWalletBalance(balance);
        // 일반결제(QR) 1% 꿈방울 적립 — 서버가 이미 적립해뒀으니 갱신만.
        refreshDreamPoints();
        return true;
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("결제하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "결제하지 못했습니다.");
        }
        return false;
      });
  }

  function blockChatPartner(userId: number) {
    blockUser(userId)
      .then(() => alert("차단했습니다. 이제 이 사람과는 채팅을 주고받을 수 없어요."))
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
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
          router.replace("/onboarding");
        } else {
          console.error("신고 접수에 실패했습니다.", error);
          alert("신고 접수에 실패했습니다.");
        }
      });
  }

  // 이미지는 상품이 있어야(product_id 필요) 업로드할 수 있어서, 등록/수정 성공 후에
  // 별도로 붙인다 — 실패해도 글 자체는 이미 저장됐으니 콘솔에만 남기고 넘어간다.
  function attachImageIfAny(productId: string, imageFile: File | null) {
    if (!imageFile) return;
    uploadProductImage(Number(productId), imageFile)
      .then((imageUrl) => {
        const patch = (p: ProductListItem) => (p.id === productId ? { ...p, thumbnailUrl: imageUrl } : p);
        setProducts((current) => current.map(patch));
        setMyProducts((current) => current.map(patch));
      })
      .catch((error: unknown) => console.error("이미지를 업로드하지 못했습니다.", error));
  }

  // 지도 피커가 hidden input(tradePlaceLat/Lng)에 넣어둔 좌표 파싱 — 값이 없으면(옛 글 그대로
  // 텍스트만 두거나 위치를 아예 안 고른 경우) undefined로, 서버에 좌표 없이 이름만 보낸다.
  function readTradePlaceCoords(form: FormData) {
    const lat = Number(form.get("tradePlaceLat"));
    const lng = Number(form.get("tradePlaceLng"));
    return { tradePlaceLat: Number.isFinite(lat) && lat !== 0 ? lat : undefined, tradePlaceLng: Number.isFinite(lng) && lng !== 0 ? lng : undefined };
  }

  function submitProduct(event: FormEvent<HTMLFormElement>, imageFile: File | null) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "중고거래");
    const isFree = form.get("free") === "on";
    const price = Number(form.get("price") ?? 0);
    const tradePlace = String(form.get("tradePlace") ?? "").trim() || undefined;
    const { tradePlaceLat, tradePlaceLng } = readTradePlaceCoords(form);

    createProduct({
      title,
      category,
      description,
      desiredPrice: isFree ? null : Math.max(0, price),
      tradeType: isFree ? "FREE" : "SALE",
      tradePlace,
      tradePlaceLat,
      tradePlaceLng,
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
          tradePlace,
          tradePlaceLat,
          tradePlaceLng,
        };

        setProducts((current) => [newProduct, ...current]);
        // 판매내역 화면은 이제 서버 전용 목록(myProducts state)을 보므로 방금 올린
        // 글도 새로고침 없이 바로 보이게 여기도 같이 반영.
        setMyProducts((current) => [newProduct, ...current]);
        attachImageIfAny(String(id), imageFile);
        // 등록 완료 후 가격비교/애널리틱스로 이탈하지 않고 즉시 당근 사이트(물품 상세/홈)로 복귀
        setActiveTab("home");
        setSubPage({ type: "product-detail", id: String(id) });
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("글을 등록하지 못했습니다.", error);
        }
      });
  }

  function submitProductEdit(event: FormEvent<HTMLFormElement>, imageFile: File | null, productId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "중고거래");
    const isFree = form.get("free") === "on";
    const price = Number(form.get("price") ?? 0);
    const tradePlace = String(form.get("tradePlace") ?? "").trim() || undefined;
    const { tradePlaceLat, tradePlaceLng } = readTradePlaceCoords(form);

    updateProduct(Number(productId), {
      title,
      category,
      description,
      desiredPrice: isFree ? null : Math.max(0, price),
      tradePlace,
      tradePlaceLat,
      tradePlaceLng,
    })
      .then(() => {
        const patch = (p: ProductListItem) =>
          p.id === productId
            ? {
                ...p,
                title,
                thumbnailLabel: title.slice(0, 2),
                category,
                description,
                price: isFree ? null : Math.max(0, price),
                tradeType: isFree ? ("FREE" as const) : ("SALE" as const),
                tradePlace,
                tradePlaceLat,
                tradePlaceLng,
              }
            : p;
        setProducts((current) => current.map(patch));
        setMyProducts((current) => current.map(patch));
        attachImageIfAny(productId, imageFile);
        setSubPage({ type: "product-detail", id: productId });
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("글을 수정하지 못했습니다.", error);
        }
      });
  }

  // 확인(window.confirm)은 ProductDetailScreen에서 이미 받고 호출한다.
  function deleteMyProduct(productId: string) {
    const numericId = Number(productId);
    if (!Number.isFinite(numericId)) return;

    deleteProduct(numericId)
      .then(() => {
        setProducts((current) => current.filter((p) => p.id !== productId));
        setMyProducts((current) => current.filter((p) => p.id !== productId));
        setFavoriteProducts((current) => current.filter((p) => p.id !== productId));
        setRecentlyViewedProducts((current) => current.filter((p) => p.id !== productId));
        goBack();
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("글을 삭제하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "글을 삭제하지 못했습니다.");
        }
      });
  }

  function submitCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const category = String(form.get("category") ?? "일반");

    createCommunityPost({ category, title, content })
      .then(() => refreshCommunityPosts())
      .then(() => {
        setActiveTab("community");
        setCommunityTab("전체");
        setCommunityFilter("추천");
        setSubPage(null);
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("커뮤니티 글을 등록하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "커뮤니티 글을 등록하지 못했습니다.");
        }
      });
  }

  function submitCommunityPostEdit(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const numericId = Number(postId);
    if (!Number.isFinite(numericId)) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const category = String(form.get("category") ?? "일반");

    updateCommunityPost(numericId, { category, title, content })
      .then((updated) => {
        const post = toCommunityPost(updated);
        setPosts((current) => current.map((item) => (item.id === postId ? post : item)));
        return refreshCommunityPosts().then(() => post);
      })
      .then(() => {
        setSubPage({ type: "community-detail", id: postId });
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("커뮤니티 글을 수정하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "커뮤니티 글을 수정하지 못했습니다.");
        }
      });
  }

  function confirmDeleteCommunityPost() {
    if (!deleteCommunityTarget) return;
    const postId = deleteCommunityTarget.id;
    const numericId = Number(postId);
    if (!Number.isFinite(numericId)) return;

    deleteCommunityPost(numericId)
      .then(() => {
        setPosts((current) => current.filter((post) => post.id !== postId));
        setDeleteCommunityTarget(null);
        if (subPage?.type === "community-detail" && subPage.id === postId) setSubPage(null);
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("커뮤니티 글을 삭제하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "커뮤니티 글을 삭제하지 못했습니다.");
        }
      });
  }

  function submitCommunityReport() {
    if (!reportCommunityTarget) return;
    const numericId = Number(reportCommunityTarget.id);
    if (!Number.isFinite(numericId)) return;

    reportUser({ targetType: "COMMUNITY_POST", targetId: numericId, reason: communityReportReason })
      .then(() => {
        setReportCommunityTarget(null);
        alert("신고가 접수되었습니다.");
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("신고 접수에 실패했습니다.", error);
          alert("신고 접수에 실패했습니다.");
        }
      });
  }

  function toggleCommunityEmotion(postId: string) {
    const numericId = Number(postId);
    if (!Number.isFinite(numericId)) return;

    toggleCommunityPostEmotion(numericId)
      .then(({ reacted, reactionCount }) => {
        setPosts((current) =>
          current.map((post) =>
            post.id === postId ? { ...post, isReacted: reacted, reactionCount } : post,
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("공감 상태를 변경하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "공감 상태를 변경하지 못했습니다.");
        }
      });
  }

  function submitCommunityComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const numericId = Number(postId);
    const content = communityCommentDraft.trim();
    if (!Number.isFinite(numericId) || !content) return;

    createCommunityPostComment(numericId, content)
      .then(({ comment, commentCount }) => {
        setCommunityComments((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment] }));
        setPosts((current) =>
          current.map((post) => (post.id === postId ? { ...post, commentCount } : post)),
        );
        setCommunityCommentDraft("");
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("댓글을 등록하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "댓글을 등록하지 못했습니다.");
        }
      });
  }

  function removeCommunityComment(postId: string, commentId: number) {
    const numericId = Number(postId);
    if (!Number.isFinite(numericId)) return;

    deleteCommunityPostComment(numericId, commentId)
      .then(() => listCommunityPostComments(numericId))
      .then((page) => {
        setCommunityComments((current) => ({ ...current, [postId]: page.items }));
        setPosts((current) =>
          current.map((post) => (post.id === postId ? { ...post, commentCount: page.total } : post)),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          router.replace("/onboarding");
        } else {
          console.error("댓글을 삭제하지 못했습니다.", error);
          alert(error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다.");
        }
      });
  }

  // 동네생활 글은 백엔드가 없는 로컬 mock이라 서버 호출 없이 posts 목록에서만 제거한다.
  function deleteMyPost(postId: string) {
    setPosts((current) => current.filter((p) => p.id !== postId));
    goBack();
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
  const paymentRoom =
    subPage?.type === "payment-amount" || subPage?.type === "payment-detail"
      ? chats.find((chat) => chat.id === subPage.chatRoomId)
      : undefined;
  const paymentMessage =
    subPage?.type === "payment-detail"
      ? roomMessages[subPage.chatRoomId]?.find((m) => m.payment?.transactionId === subPage.transactionId)
      : undefined;

  const showBottomNav = !subPage || ["my-menu", "dream-dashboard", "dream-notice", "dream-points-history", "carrot-notice", "settings", "sales", "favorites", "recently-viewed", "search", "all-services"].includes(subPage.type);
  const isDreamPage =
    subPage?.type === "dream-dashboard" ||
    subPage?.type === "dream-notice" ||
    subPage?.type === "dream-points-history" ||
    (subPage?.type === "region-search" && subPage.returnTo === "dream-dashboard");

  // 로그인 확인 전엔 앱을 그리지 않는다 — 비로그인/토큰 만료면 위 getMe() effect가
  // /onboarding으로 리다이렉트하는 중이라, 그 사이 화면이 잠깐 보였다 사라지는 걸 막는다.
  if (!authChecked) {
    return <DaangnSplash theme={theme} message="당근을 시작하는 중..." subMessage="동네 이웃들과 따뜻한 이야기를 나눠요" />;
  }

  return (
    <div
      className={`${styles.stage} ${isDreamPage ? styles.dreamStage : ""}`}
      data-theme={isDreamPage ? "light" : theme}
    >
      <div className={styles.phoneShell}>
        <main
          className={`${styles.appViewport} ${activeTab === "map" && !subPage ? styles.mapViewport : ""} ${subPage?.type === "real-estate" ? styles.realEstateViewport : ""} ${subPage?.type === "merge-game" ? styles.mergeGameViewport : ""} ${subPage?.type === "alba" ? styles.albaViewport : ""}`}
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
                      router.replace("/onboarding");
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
              onEdit={(id) => setSubPage({ type: "product-form", editId: id })}
              onDelete={deleteMyProduct}
            />
          ) : subPage?.type === "product-form" ? (
            <ProductFormScreen
              onBack={goBack}
              initialProduct={subPage.editId ? findProductById(subPage.editId) : undefined}
              initialCenter={NEIGHBORHOOD_COORDS[activeNeighborhood]}
              onSubmit={
                subPage.editId
                  ? (event, imageFile) => submitProductEdit(event, imageFile, subPage.editId!)
                  : submitProduct
              }
            />
          ) : subPage?.type === "community-detail" && selectedPost ? (
            <CommunityDetailScreen
              post={selectedPost}
              currentUserId={me?.id}
              onBack={goBack}
              onEdit={() => setSubPage({ type: "community-form", editId: selectedPost.id })}
              onDelete={() => setDeleteCommunityTarget(selectedPost)}
              onReport={() => {
                setCommunityReportReason("?ㅽ뙵/?띾낫");
                setReportCommunityTarget(selectedPost);
              }}
              comments={communityComments[selectedPost.id] ?? []}
              commentsLoading={communityCommentsLoading}
              commentDraft={communityCommentDraft}
              onCommentDraftChange={setCommunityCommentDraft}
              onToggleEmotion={() => toggleCommunityEmotion(selectedPost.id)}
              onSubmitComment={(event) => submitCommunityComment(event, selectedPost.id)}
              onDeleteComment={(commentId) => removeCommunityComment(selectedPost.id, commentId)}
            />
          ) : subPage?.type === "community-form" ? (
            <CommunityFormScreen
              onBack={goBack}
              initialPost={subPage.editId ? posts.find((post) => post.id === subPage.editId) : undefined}
              onSubmit={
                subPage.editId
                  ? (event) => submitCommunityPostEdit(event, subPage.editId!)
                  : submitCommunityPost
              }
            />
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
            <motion.div
              key={`chat-room-${selectedChat.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <ChatRoomScreen
                room={selectedChat}
                messages={roomMessages[selectedChat.id] ?? []}
                draft={messageDraft}
                onDraftChange={setMessageDraft}
                onSubmit={(event) => submitMessage(event, selectedChat.id)}
                onSendImage={(file) => submitImageMessage(selectedChat.id, file)}
                onBack={goBack}
                otherUserId={roomOtherUserId[selectedChat.id]}
                onLeave={() => leaveChat(selectedChat.id)}
                onUpdateStatus={(status) => updateChatStatus(selectedChat.id, status)}
                onBlock={blockChatPartner}
                onReport={reportChatPartner}
                onOpenPayment={() => openPayment(selectedChat.id)}
                onViewPayment={(transactionId) => viewPayment(selectedChat.id, transactionId)}
              />
            </motion.div>
          ) : subPage?.type === "payment-amount" && paymentRoom ? (
            <PaymentAmountScreen
              room={paymentRoom}
              balance={walletBalance}
              onBack={goBack}
              onSubmit={(amount) => submitPayment(subPage.chatRoomId, amount)}
            />
          ) : subPage?.type === "payment-detail" && paymentRoom && paymentMessage?.payment ? (
            <PaymentDetailScreen
              room={paymentRoom}
              payment={paymentMessage.payment}
              mine={paymentMessage.mine}
              onBack={goBack}
            />
          ) : subPage?.type === "wallet-charge" ? (
            <WalletChargeScreen balance={walletBalance} onBack={goBack} onSubmit={submitWalletCharge} />
          ) : subPage?.type === "wallet-pay" ? (
            <WalletPayScreen
              initialStoreId={subPage.storeId}
              balance={walletBalance}
              onBack={goBack}
              onSubmit={submitWalletPay}
            />
          ) : subPage?.type === "chat-room-list" ? (
            <ChatsScreen
              rooms={productChatRooms}
              activeFilter={chatFilter}
              isLoading={productChatRoomsLoading}
              unreadCount={totalUnread}
              onFilterChange={setChatFilter}
              onOpenNotifications={() => setSheet("notifications")}
              onOpenSettings={() => setSubPage({ type: "settings" })}
              onOpenChat={openChat}
              title={`${subPage.productTitle} 채팅`}
              onBack={goBack}
            />
          ) : subPage?.type === "my-menu" ? (
            <MyMenuScreen
              onBack={goBack}
              onOpenSettings={() => setSubPage({ type: "settings" })}
              onOpenAlba={(tab) => setSubPage({ type: "alba", tab })}
            />
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
              activeNeighborhood={activeNeighborhood}
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
              onOpenPointsHistory={() => setSubPage({ type: "dream-points-history" })}
            />
          ) : subPage?.type === "dream-notice" ? (
            <DreamNoticeScreen onBack={goBack} />
          ) : subPage?.type === "dream-points-history" ? (
            <DreamPointsHistoryScreen onBack={goBack} />
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
              activeNeighborhood={activeNeighborhood}
              onOpenNeighborhood={() => setSubPage({ type: "region-search", returnTo: "settings" })}
              locationAllowed={locationAllowed}
              onLocationToggle={() => setLocationAllowed((value) => !value)}
              onLogout={handleLogout}
              onWithdraw={handleWithdraw}
              onOpenSupport={() => setSubPage({ type: "customer-support" })}
              onOpenNotice={() => setSubPage({ type: "carrot-notice" })}
            />
          ) : subPage?.type === "carrot-notice" ? (
            <CarrotNoticeScreen onBack={() => setSubPage({ type: "settings" })} />
          ) : subPage?.type === "customer-support" ? (
            <CustomerSupportScreen onBack={() => setSubPage({ type: "settings" })} />
          ) : subPage?.type === "sales" ? (
            <ManagementScreen
              title="판매관리"
              products={myProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onStatusChange={updateProductStatus}
              onRefresh={refreshMyProducts}
            />
          ) : subPage?.type === "favorites" ? (
            <FavoriteScreen
              products={favoriteProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onRefresh={refreshFavorites}
            />
          ) : subPage?.type === "recently-viewed" ? (
            <FavoriteScreen
              products={recentlyViewedProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              title="최근 본"
              emptyTitle="최근 본 상품이 없어요"
              emptyBody="상품 상세를 열어보면 여기에 기록돼요."
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
              excludedNeighborhoods={secondaryNeighborhood ? [activeNeighborhood, secondaryNeighborhood] : [activeNeighborhood]}
              onBack={() => {
                setSubPage(subPage.returnTo ? { type: subPage.returnTo } : null);
                setSheet("region");
              }}
              onPick={addNeighborhood}
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={styles.tabContentTransition}
            >
              {activeTab === "home" ? (
                <HomeScreen
                  isLoading={isBooting}
                  activeNeighborhood={activeNeighborhood}
                  secondaryNeighborhood={secondaryNeighborhood}
                  productFilter={productFilter}
                  products={filteredProducts}
                  onRefresh={refreshProducts}
                  onLoadMore={loadMoreProducts}
                  hasMore={products.length < productsTotal}
                  isLoadingMore={isLoadingMoreProducts}
                  onOpenRegion={() => setSheet("region")}
                  onSwapNeighborhood={swapNeighborhood}
                  onOpenSearch={() => setSubPage({ type: "search" })}
                  onOpenNotifications={() => setSheet("notifications")}
                  onOpenMenu={() => {
                    setActiveTab("my");
                    setSubPage({ type: "my-menu" });
                  }}
                  onFilterChange={(value) => {
                    if (value === "알바") {
                      setSubPage({ type: "alba" });
                      return;
                    }
                    if (value === "부동산") {
                      openRealEstate();
                      return;
                    }
                    setProductFilter(value);
                  }}
                  onProductClick={(id) => setSubPage({ type: "product-detail", id })}
                  categories={categories}
                  filters={productFilters}
                  onApplyFilters={setProductFilters}
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
                  onPostEdit={(id) => setSubPage({ type: "community-form", editId: id })}
                  onPostDelete={setDeleteCommunityTarget}
                  onPostReport={(post) => {
                    setCommunityReportReason("스팸/홍보");
                    setReportCommunityTarget(post);
                  }}
                  currentUserId={me?.id}
                  verifiedApartment={verifiedApartment}
                  onOpenApartment={openApartmentFlow}
                  activeNeighborhood={activeNeighborhood}
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
                  allDangerSignals={dangerSignals}
                  hasSearchedArea={mapSearchArea?.neighborhood === activeNeighborhood}
                  searchBounds={mapSearchArea && mapSearchArea.neighborhood === activeNeighborhood ? mapSearchArea.bounds : null}
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
                  onRefresh={refreshChats}
                />
              ) : (
                <MyScreen
                  nickname={me?.nickname}
                  activeNeighborhood={activeNeighborhood}
                  unreadCount={totalUnread}
                  favoriteCount={favoriteProducts.length}
                  myProducts={myProducts}
                  walletBalance={walletBalance}
                  dreamPoints={dreamPoints}
                  onOpenSettings={() => setSubPage({ type: "settings" })}
                  onOpenMenu={() => setSubPage({ type: "my-menu" })}
                  onOpenAllServices={() => setSubPage({ type: "all-services" })}
                  onOpenDream={() => setSubPage({ type: "dream-dashboard" })}
                  onOpenAlba={() => setSubPage({ type: "alba" })}
                  onOpenSales={() => setSubPage({ type: "sales" })}
                  onOpenFavorites={() => setSubPage({ type: "favorites" })}
                  onOpenRecentlyViewed={() => setSubPage({ type: "recently-viewed" })}
                  onOpenApartment={openApartmentFlow}
                  onOpenWalletCharge={() => setSubPage({ type: "wallet-charge" })}
                  onOpenWalletPay={() => setSubPage({ type: "wallet-pay" })}
                />
              )}
            </motion.div>
          )}
        </main>

        {!subPage && (activeTab === "home" || activeTab === "community" || (activeTab === "map" && mapSheetState === "expanded")) && (
          activeTab === "home" ? (
            <HomeFloatingActionMenu
              isOpen={isHomeActionMenuOpen}
              onToggle={() => setIsHomeActionMenuOpen((prev) => !prev)}
              onClose={() => setIsHomeActionMenuOpen(false)}
              onSellMyProduct={() => {
                setIsHomeActionMenuOpen(false);
                setSubPage({ type: "product-form" });
              }}
              onSellMultipleProducts={() => {
                setIsHomeActionMenuOpen(false);
                setSubPage({ type: "product-form" });
                setToastMessage("'여러 물건 팔기' 모드로 글을 작성할 수 있어요.");
              }}
              onOpenAlba={() => {
                setIsHomeActionMenuOpen(false);
                setSubPage({ type: "alba" });
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
                });
              }}
              onOpenRealEstate={() => {
                setIsHomeActionMenuOpen(false);
                openRealEstate();
              }}
              onOpenCommunity={() => {
                setIsHomeActionMenuOpen(false);
                setActiveTab("community");
                setCommunityTab("전체");
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
                });
              }}
              onOpenTogether={() => {
                setIsHomeActionMenuOpen(false);
                setActiveTab("community");
                setCommunityTab("같이해요");
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
                });
              }}
              onOpenStory={() => {
                setIsHomeActionMenuOpen(false);
                setActiveTab("community");
                setCommunityTab("자유 주제");
                window.requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
                });
              }}
            />
          ) : (
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
          )
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
            swapNeighborhood(dongName);
            setSheet(null);
          }}
          onRemoveNeighborhood={(target) => {
            // 대표(primary)를 지우면 남은 동네가 자동으로 대표가 된다 — 동네가 0개인
            // 상태는 없어야 하니, secondary가 있을 때만 primary 삭제 버튼이 보인다(UI 쪽 가드).
            if (target === "primary" && secondaryNeighborhood) {
              setActiveNeighborhood(secondaryNeighborhood);
              setSecondaryNeighborhood(null);
            } else if (target === "secondary") {
              setSecondaryNeighborhood(null);
            }
          }}
          onOpenRegionSearch={() => {
            setSheet(null);
            setSubPage({
              type: "region-search",
              returnTo: subPage?.type === "dream-dashboard" ? "dream-dashboard" : undefined,
            });
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
        />
        {deleteCommunityTarget && (
          <div className={styles.communityDialogLayer}>
            <button type="button" className={styles.communityDialogBackdrop} onClick={() => setDeleteCommunityTarget(null)} />
            <section className={styles.communityDialog} role="dialog" aria-modal="true" aria-labelledby="community-delete-title">
              <h3 id="community-delete-title">게시글을 삭제하시겠어요?</h3>
              <p>삭제한 게시글은 커뮤니티 목록에서 보이지 않습니다.</p>
              <div className={styles.communityDialogActions}>
                <button type="button" onClick={() => setDeleteCommunityTarget(null)}>취소</button>
                <button type="button" className={styles.communityDialogDanger} onClick={confirmDeleteCommunityPost}>삭제</button>
              </div>
            </section>
          </div>
        )}
        {reportCommunityTarget && (
          <div className={styles.communityDialogLayer}>
            <button type="button" className={styles.communityDialogBackdrop} onClick={() => setReportCommunityTarget(null)} />
            <section className={styles.communityDialog} role="dialog" aria-modal="true" aria-labelledby="community-report-title">
              <h3 id="community-report-title">신고 사유를 선택해주세요</h3>
              <div className={styles.reportReasonList}>
                {COMMUNITY_REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={`${styles.reportReasonItem} ${communityReportReason === reason ? styles.reportReasonItemSelected : ""}`}
                    onClick={() => setCommunityReportReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className={styles.communityDialogActions}>
                <button type="button" onClick={() => setReportCommunityTarget(null)}>취소</button>
                <button type="button" className={styles.communityDialogDanger} onClick={submitCommunityReport}>신고 제출</button>
              </div>
            </section>
          </div>
        )}
        {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
      </div>
    </div>
  );
}
