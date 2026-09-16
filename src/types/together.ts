export type TogetherCategory =
  | "childcare"
  | "group_buy"
  | "hobby"
  | "pet_walk"
  | "etc";

export interface TogetherCategoryMeta {
  key: TogetherCategory;
  label: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  bgLight: string;
}

export const TOGETHER_CATEGORIES: Record<TogetherCategory, TogetherCategoryMeta> = {
  childcare: {
    key: "childcare",
    label: "공동육아",
    icon: "🐥",
    title: "공동육아",
    description: "비슷한 또래의 아이를 함께 돌보고 정보 나눠요",
    color: "#D97706",
    bgLight: "#FEF3C7",
  },
  group_buy: {
    key: "group_buy",
    label: "공동구매",
    icon: "🛒",
    title: "공동구매",
    description: "대용량 상품이나 배송비를 이웃과 함께 나눠요",
    color: "#ff6f0f",
    bgLight: "#fff0e6",
  },
  hobby: {
    key: "hobby",
    label: "취미활동",
    icon: "🎾",
    title: "취미활동",
    description: "운동, 독서, 원데이클래스 등 취미를 함께해요",
    color: "#2563EB",
    bgLight: "#DBEAFE",
  },
  pet_walk: {
    key: "pet_walk",
    label: "강아지 산책",
    icon: "🐾",
    title: "강아지 산책",
    description: "댕댕이 친구 만들고 산책 메이트가 되어보아요",
    color: "#059669",
    bgLight: "#D1FAE5",
  },
  etc: {
    key: "etc",
    label: "기타",
    icon: "🙂",
    title: "기타 모임",
    description: "친목, 동네 탐방 등 자유롭게 함께 모여요",
    color: "#6B7280",
    bgLight: "#F3F4F6",
  },
};

export type TogetherStatus = "recruiting" | "completed" | "cancelled";

export interface TogetherParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
}

export interface TogetherPost {
  id: string;
  userId: string;
  userName: string;
  userMannerTemp?: number;
  userNeighborhood: string;
  category: TogetherCategory;
  title: string;
  content: string;
  regionName: string;
  maxParticipants: number;
  participantCount: number;
  deadline: string; // ISO or YYYY-MM-DD
  deadlineDaysLeft: number;
  status: TogetherStatus;
  productName?: string; // For group_buy
  targetPrice?: number;  // For group_buy
  allowChat: boolean;
  viewCount: number;
  isJoined?: boolean;
  isOwner?: boolean;
  participants: TogetherParticipant[];
  createdAt: string;
}

export interface CreateTogetherPostInput {
  category: TogetherCategory;
  title: string;
  content: string;
  regionName: string;
  maxParticipants: number;
  deadline: string;
  productName?: string;
  targetPrice?: number;
  allowChat?: boolean;
}
