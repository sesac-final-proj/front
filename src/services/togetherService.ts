import {
  CreateTogetherPostInput,
  TogetherCategory,
  TogetherPost,
} from "@/types/together";

const STORAGE_KEY = "gaji_together_posts_v1";

const INITIAL_TOGETHER_POSTS: TogetherPost[] = [
  {
    id: "tg-1",
    userId: "u-101",
    userName: "가지보안관",
    userMannerTemp: 38.5,
    userNeighborhood: "개봉동",
    category: "group_buy",
    title: "이케아 수납장 배송비 같이 나누실 이웃 구해요!",
    content:
      "이번 주말에 이케아 광명점에서 수납장과 책장 주문 예정입니다.\n가구 배송비 49,000원이 나와서 개봉동/오류동 근처 이웃님과 1/N로 나누면 좋을 것 같아요!\n주문 품목 확인 후 함께 배송받아서 분배해요.",
    regionName: "개봉동",
    maxParticipants: 4,
    participantCount: 3,
    deadline: "2026-09-08",
    deadlineDaysLeft: 6,
    status: "recruiting",
    productName: "이케아 가구 주문 배송비 분담",
    targetPrice: 12250,
    allowChat: true,
    viewCount: 42,
    isJoined: false,
    isOwner: false,
    participants: [
      { userId: "u-101", userName: "가지보안관", joinedAt: "2026-09-01" },
      { userId: "u-102", userName: "개봉동토끼", joinedAt: "2026-09-02" },
      { userId: "u-103", userName: "행복한가지", joinedAt: "2026-09-02" },
    ],
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "tg-2",
    userId: "u-201",
    userName: "초보맘가지",
    userMannerTemp: 39.2,
    userNeighborhood: "개봉동",
    category: "childcare",
    title: "평일 오후 개봉 어린이공원 유모차 산책 모임 🐥",
    content:
      "12~18개월 아기 키우는 육아맘/육아대디 모여요!\n평일 오후 3시쯤 개봉어린이공원에서 가볍게 산책하고 육아 꿀팁 및 유아용품 정보 나눠요.\n부담 없이 커피 한잔 들고 만나요 :)",
    regionName: "개봉동",
    maxParticipants: 5,
    participantCount: 4,
    deadline: "2026-09-06",
    deadlineDaysLeft: 4,
    status: "recruiting",
    allowChat: true,
    viewCount: 68,
    isJoined: true,
    isOwner: false,
    participants: [
      { userId: "u-201", userName: "초보맘가지", joinedAt: "2026-08-30" },
      { userId: "u-202", userName: "지우맘", joinedAt: "2026-08-31" },
      { userId: "u-203", userName: "튼튼이아빠", joinedAt: "2026-09-01" },
      { userId: "me", userName: "나 (가지러버)", joinedAt: "2026-09-02" },
    ],
    createdAt: "2026-08-30T14:30:00Z",
  },
  {
    id: "tg-3",
    userId: "u-301",
    userName: "멍멍이아빠",
    userMannerTemp: 37.8,
    userNeighborhood: "오류동",
    category: "pet_walk",
    title: "안양천 반려견 주말 모닝 산책 크루 모집 🐾",
    content:
      "중소형견(10kg 미만) 친구들 주말 아침 8시에 안양천 산책로에서 같이 뛰뛰해요!\n사회성 기르기 좋고 견주님들 동네 동물병원 정보도 공유해요.\n배변봉투와 리드줄은 필수 지참입니다.",
    regionName: "오류동",
    maxParticipants: 6,
    participantCount: 2,
    deadline: "2026-09-10",
    deadlineDaysLeft: 8,
    status: "recruiting",
    allowChat: true,
    viewCount: 35,
    isJoined: false,
    isOwner: false,
    participants: [
      { userId: "u-301", userName: "멍멍이아빠", joinedAt: "2026-09-01" },
      { userId: "u-302", userName: "초코누나", joinedAt: "2026-09-02" },
    ],
    createdAt: "2026-09-01T18:20:00Z",
  },
  {
    id: "tg-4",
    userId: "u-401",
    userName: "라켓소년",
    userMannerTemp: 36.9,
    userNeighborhood: "고척동",
    category: "hobby",
    title: "고척체육관 주말 배드민턴 복식 치실 분! 🎾",
    content:
      "실력 상관없이 랠리 즐기실 이웃 2분 모십니다.\n코트 예약 완료되었고(일요일 오전 10시~12시), 셔틀콕과 코트비 4,000원씩 분담합니다.\n라켓만 챙겨오시면 됩니다!",
    regionName: "고척동",
    maxParticipants: 4,
    participantCount: 4,
    deadline: "2026-09-05",
    deadlineDaysLeft: 3,
    status: "completed",
    targetPrice: 4000,
    allowChat: true,
    viewCount: 89,
    isJoined: false,
    isOwner: false,
    participants: [
      { userId: "u-401", userName: "라켓소년", joinedAt: "2026-08-28" },
      { userId: "u-402", userName: "스매싱장인", joinedAt: "2026-08-29" },
      { userId: "u-403", userName: "콕콕이", joinedAt: "2026-08-30" },
      { userId: "u-404", userName: "배린이", joinedAt: "2026-08-31" },
    ],
    createdAt: "2026-08-28T09:00:00Z",
  },
  {
    id: "tg-5",
    userId: "u-501",
    userName: "코스트코러버",
    userMannerTemp: 41.0,
    userNeighborhood: "개봉동",
    category: "group_buy",
    title: "코스트코 베이글 2봉 + 크림치즈 4종 소분하실 분 🛒",
    content:
      "코스트코 양이 너무 많아서 어니언/블루베리 베이글(총 12개)과 필라델피아 크림치즈 1세트 딱 절반씩 깔끔하게 소분해요!\n개봉역 1번 출구 앞에서 저녁 7시 직거래 희망합니다.",
    regionName: "개봉동",
    maxParticipants: 2,
    participantCount: 1,
    deadline: "2026-09-04",
    deadlineDaysLeft: 2,
    status: "recruiting",
    productName: "코스트코 베이글 & 크림치즈",
    targetPrice: 8500,
    allowChat: true,
    viewCount: 54,
    isJoined: false,
    isOwner: false,
    participants: [
      { userId: "u-501", userName: "코스트코러버", joinedAt: "2026-09-02" },
    ],
    createdAt: "2026-09-02T11:15:00Z",
  },
];

export function getStoredTogetherPosts(): TogetherPost[] {
  if (typeof window === "undefined") return INITIAL_TOGETHER_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOGETHER_POSTS));
      return INITIAL_TOGETHER_POSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load together posts:", e);
    return INITIAL_TOGETHER_POSTS;
  }
}

export function saveTogetherPosts(posts: TogetherPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error("Failed to save together posts:", e);
  }
}

export function getTogetherPosts(category?: TogetherCategory | "all"): TogetherPost[] {
  const posts = getStoredTogetherPosts();
  if (!category || category === "all") return posts;
  return posts.filter((p) => p.category === category);
}

export function getTogetherPostById(id: string): TogetherPost | null {
  const posts = getStoredTogetherPosts();
  const found = posts.find((p) => p.id === id);
  return found || null;
}

export function createTogetherPost(input: CreateTogetherPostInput): TogetherPost {
  const posts = getStoredTogetherPosts();
  const newPost: TogetherPost = {
    id: `tg-${Date.now()}`,
    userId: "me",
    userName: "나 (가지러버)",
    userMannerTemp: 36.5,
    userNeighborhood: input.regionName || "개봉동",
    category: input.category,
    title: input.title,
    content: input.content,
    regionName: input.regionName || "개봉동",
    maxParticipants: Number(input.maxParticipants) || 4,
    participantCount: 1,
    deadline: input.deadline || "2026-09-09",
    deadlineDaysLeft: 7,
    status: "recruiting",
    productName: input.productName,
    targetPrice: input.targetPrice ? Number(input.targetPrice) : undefined,
    allowChat: input.allowChat !== false,
    viewCount: 1,
    isJoined: true,
    isOwner: true,
    participants: [
      { userId: "me", userName: "나 (가지러버)", joinedAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  };

  const updated = [newPost, ...posts];
  saveTogetherPosts(updated);
  return newPost;
}

export function toggleTogetherJoin(postId: string): { success: boolean; isJoined: boolean; count: number } {
  const posts = getStoredTogetherPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return { success: false, isJoined: false, count: 0 };

  const alreadyJoined = post.isJoined || post.participants.some((p) => p.userId === "me");

  if (alreadyJoined) {
    // Leave
    post.isJoined = false;
    post.participants = post.participants.filter((p) => p.userId !== "me");
    post.participantCount = Math.max(1, post.participants.length);
    if (post.status === "completed") {
      post.status = "recruiting";
    }
  } else {
    // Join
    if (post.participantCount >= post.maxParticipants) {
      return { success: false, isJoined: false, count: post.participantCount };
    }
    post.isJoined = true;
    post.participants.push({
      userId: "me",
      userName: "나 (가지러버)",
      joinedAt: new Date().toISOString(),
    });
    post.participantCount = post.participants.length;
    if (post.participantCount >= post.maxParticipants) {
      post.status = "completed";
    }
  }

  saveTogetherPosts(posts);
  return { success: true, isJoined: post.isJoined, count: post.participantCount };
}
