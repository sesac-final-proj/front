"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./GajiMarketApp.module.css";

// Components (Barrel Export from ./components)
import {
  // common
  BottomNav,
  BottomSheet,
  FloatingWriteButton,
  AllServicesScreen,
  RegionSearchScreen,
  SearchScreen,
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
  // my
  MyScreen,
  MyMenuScreen,
  SettingsScreen,
  ManagementScreen,
  FavoriteScreen,
  DreamDashboardScreen,
  DreamNoticeScreen,
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

// Types
import type {
  TogetherCategory,
  TogetherPost,
  CreateTogetherPostInput,
  Me,
} from "@/types";
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
  PRODUCT_FILTERS,
  THEME_STORAGE_KEY,
} from "./constants";
import {
  apiUrl,
  matchesNeighborhood,
  matchRegionId,
  readTheme,
  setSessionTheme,
  subscribeTheme,
  toChatMessageUi,
  toChatRoomUi,
  toDangerBusiness,
  toProductListItem,
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
  const [me, setMe] = useState<Me | null>(null);
  const [myProducts, setMyProducts] = useState<ProductListItem[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductListItem[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<ProductListItem[]>([]);

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
  const [productFilters, setProductFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((error: unknown) => console.error("카테고리 목록을 불러오지 못했습니다.", error));
  }, []);
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
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessageUi[]>>({});
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
    listProducts(
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
      controller.signal,
    )
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
  }, [regionsLoaded, noRegionMatch, regionId, productFilters]);

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
          setAuthRequired(true);
          setSheet("status");
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
            chat.id === chatId ? { ...chat, lastMessage: "사진을 보냈습니다", lastMessageAt: "방금 전" } : chat,
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
          setSheet("status");
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
            chat.id === chatId ? { ...chat, lastMessage: message.content ?? "", lastMessageAt: "방금 전" } : chat,
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

  function submitProduct(event: FormEvent<HTMLFormElement>, imageFile: File | null) {
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
        attachImageIfAny(String(id), imageFile);
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

  function submitProductEdit(event: FormEvent<HTMLFormElement>, imageFile: File | null, productId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "중고거래");
    const isFree = form.get("free") === "on";
    const price = Number(form.get("price") ?? 0);

    updateProduct(Number(productId), {
      title,
      category,
      description,
      desiredPrice: isFree ? null : Math.max(0, price),
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
              }
            : p;
        setProducts((current) => current.map(patch));
        setMyProducts((current) => current.map(patch));
        attachImageIfAny(productId, imageFile);
        setSubPage({ type: "product-detail", id: productId });
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRequiredError) {
          setAuthRequired(true);
        } else {
          console.error("글을 수정하지 못했습니다.", error);
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

  const showBottomNav = !subPage || ["my-menu", "dream-dashboard", "dream-notice", "settings", "sales", "favorites", "recently-viewed", "search", "all-services"].includes(subPage.type);
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
              onEdit={(id) => setSubPage({ type: "product-form", editId: id })}
            />
          ) : subPage?.type === "product-form" ? (
            <ProductFormScreen
              onBack={goBack}
              initialProduct={subPage.editId ? findProductById(subPage.editId) : undefined}
              onSubmit={
                subPage.editId
                  ? (event, imageFile) => submitProductEdit(event, imageFile, subPage.editId!)
                  : submitProduct
              }
            />
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
              onSendImage={(file) => submitImageMessage(selectedChat.id, file)}
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
          ) : subPage?.type === "recently-viewed" ? (
            <FavoriteScreen
              products={recentlyViewedProducts}
              onBack={goBack}
              onProductClick={(id) => setSubPage({ type: "product-detail", id })}
              onFavorite={toggleFavorite}
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
              onOpenRecentlyViewed={() => setSubPage({ type: "recently-viewed" })}
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

