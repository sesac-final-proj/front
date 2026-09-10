export interface WorkoutFacility {
  id: string;
  name: string;
  category: string;
  subCategory: "all" | "gym" | "pilates" | "swimming" | "climbing" | "golf";
  address?: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  placeUrl?: string;
  phone?: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  monthlyPrice?: string;
  benefit?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface WorkoutBoundsParams {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  subCategory?: string;
  query?: string;
  limit?: number;
}

export const WORKOUT_SUB_CATEGORIES = [
  { id: "all", label: "전체", icon: "🏋️", query: "헬스장 필라테스 수영장" },
  { id: "gym", label: "헬스·체육관", icon: "💪", query: "헬스장 PT 체육관" },
  { id: "pilates", label: "필라테스·요가", icon: "🧘", query: "필라테스 요가" },
  { id: "swimming", label: "수영장", icon: "🏊", query: "수영장 실내수영장" },
  { id: "climbing", label: "클라이밍", icon: "🧗", query: "클라이밍 볼더링" },
  { id: "golf", label: "골프·테니스", icon: "⛳", query: "골프연습장 테니스장" },
] as const;

export type WorkoutSubCategoryId = (typeof WORKOUT_SUB_CATEGORIES)[number]["id"];

const SAMPLE_FACILITIES: Omit<WorkoutFacility, "id">[] = [
  // 송파 / 잠실 / 가락 권역
  {
    name: "에이블짐 가락점",
    category: "헬스·PT",
    subCategory: "gym",
    roadAddress: "서울 송파구 송파대로 260 제일빌딩 B1",
    lat: 37.4984,
    lng: 127.1205,
    phone: "02-400-0182",
    rating: 4.88,
    reviewCount: 320,
    monthlyPrice: "월 3.5만원~",
    benefit: "당근 단골 10% 추가할인",
    tags: ["24시 운영", "주차 무료", "샤워시설", "무료 체성분 검사"],
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "바디플래닛 필라테스 송파본점",
    category: "필라테스·요가",
    subCategory: "pilates",
    roadAddress: "서울 송파구 백제고분로 142 3층",
    lat: 37.5042,
    lng: 127.1189,
    phone: "02-415-8820",
    rating: 4.95,
    reviewCount: 180,
    monthlyPrice: "회당 1.8만원~",
    benefit: "체험 1회 1만원",
    tags: ["1:1 / 4:1 소그룹", "기구필라테스", "여성전용 샤워실"],
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "송파여성문화회관 수영장",
    category: "수영장",
    subCategory: "swimming",
    roadAddress: "서울 송파구 백제고분로42길 29",
    lat: 37.5028,
    lng: 127.1112,
    phone: "02-2203-3330",
    rating: 4.62,
    reviewCount: 95,
    monthlyPrice: "월 5만원 (강습포함)",
    benefit: "구민 10% 감면",
    tags: ["25m 6레인", "자유수영 가능", "공영주차 2시간 무료"],
    imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "더클라임 클라이밍 송파점",
    category: "클라이밍",
    subCategory: "climbing",
    roadAddress: "서울 송파구 송파대로 201 지하1층",
    lat: 37.4912,
    lng: 127.1235,
    phone: "02-401-8848",
    rating: 4.91,
    reviewCount: 240,
    monthlyPrice: "일일체험 3만원",
    benefit: "첫방문 암벽화 무료대여",
    tags: ["대형 볼더링존", "초급 강습 프로그램", "스트레칭존"],
    imageUrl: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "GDR아카데미 골프존 잠실송파점",
    category: "골프·테니스",
    subCategory: "golf",
    roadAddress: "서울 송파구 오금로 133 지하2층",
    lat: 37.5115,
    lng: 127.1148,
    phone: "02-421-0753",
    rating: 4.78,
    reviewCount: 110,
    monthlyPrice: "월 15만원~",
    benefit: "KPGA 프로 1:1 레슨",
    tags: ["전타석 GDR+", "좌타석 완비", "주차 3시간 무료"],
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&auto=format&fit=crop&q=80",
  },

  // 위례 권역
  {
    name: "스포애니 위례점 (24시)",
    category: "헬스·PT",
    subCategory: "gym",
    roadAddress: "서울 송파구 위례광장로 188 4층",
    lat: 37.4768,
    lng: 127.1435,
    phone: "031-755-9611",
    rating: 4.75,
    reviewCount: 190,
    monthlyPrice: "3개월 9만원~",
    tags: ["연중무휴 24시", "전국 지점 이용가능", "해머스트렝스 머신"],
    imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "필라테스율 위례중앙점",
    category: "필라테스·요가",
    subCategory: "pilates",
    roadAddress: "서울 송파구 위례광장로 270 5층",
    lat: 37.4789,
    lng: 127.1442,
    phone: "031-721-1250",
    rating: 4.92,
    reviewCount: 88,
    monthlyPrice: "회당 2만원~",
    tags: ["1:1 프라이빗룸", "바렐/리포머/체어", "체형교정"],
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80",
  },

  // 공릉 / 노원 권역
  {
    name: "피트니스에이치 공릉역점",
    category: "헬스·PT",
    subCategory: "gym",
    roadAddress: "서울 노원구 동일로 1085 B1",
    lat: 37.6255,
    lng: 127.0732,
    phone: "02-978-0112",
    rating: 4.82,
    reviewCount: 145,
    monthlyPrice: "월 4만원~",
    tags: ["공릉역 2번출구 100m", "천국의계단 완비", "무료주차"],
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "노원구민체육센터 수영장",
    category: "수영장",
    subCategory: "swimming",
    roadAddress: "서울 노원구 노원로 342",
    lat: 37.6412,
    lng: 127.0698,
    phone: "02-2289-6800",
    rating: 4.7,
    reviewCount: 210,
    monthlyPrice: "월 4.8만원~",
    tags: ["50m 공인규격", "아쿠아로빅", "주차시설"],
    imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80",
  },

  // 영등포 / 당산 권역
  {
    name: "휘트니스엠 당산점",
    category: "헬스·PT",
    subCategory: "gym",
    roadAddress: "서울 영등포구 당산로 222 2층",
    lat: 37.5342,
    lng: 126.9025,
    phone: "02-2632-6999",
    rating: 4.85,
    reviewCount: 275,
    monthlyPrice: "월 3.9만원~",
    tags: ["당산역 도보 1분", "샤워실 개인부스", "호텔식 머신"],
    imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "영등포 제1스포츠센터 수영장",
    category: "수영장",
    subCategory: "swimming",
    roadAddress: "서울 영등포구 신길로 275",
    lat: 37.5185,
    lng: 126.9112,
    phone: "02-2670-7800",
    rating: 4.58,
    reviewCount: 160,
    monthlyPrice: "월 4.5만원~",
    tags: ["구립 체육관", "성인수영 강습", "셔틀버스 운행"],
    imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "서울숲클라이밍 영등포점",
    category: "클라이밍",
    subCategory: "climbing",
    roadAddress: "서울 영등포구 영등포로 109 지하 2층",
    lat: 37.5255,
    lng: 126.8972,
    phone: "02-2633-5014",
    rating: 4.93,
    reviewCount: 185,
    monthlyPrice: "1회권 2만원",
    tags: ["다양한 난이도", "주기적 세팅", "쾌적한 냉난방"],
    imageUrl: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&auto=format&fit=crop&q=80",
  },
];

export function getFallbackWorkoutFacilities(params?: Partial<WorkoutBoundsParams>): WorkoutFacility[] {
  let list = SAMPLE_FACILITIES.map((f, idx) => ({
    ...f,
    id: `workout_fallback_${idx + 1}`,
  }));

  if (params?.subCategory && params.subCategory !== "all") {
    list = list.filter((f) => f.subCategory === params.subCategory);
  }

  if (params?.swLat && params?.neLat && params?.swLng && params?.neLng) {
    const minLat = Math.min(params.swLat, params.neLat);
    const maxLat = Math.max(params.swLat, params.neLat);
    const minLng = Math.min(params.swLng, params.neLng);
    const maxLng = Math.max(params.swLng, params.neLng);

    const bounded = list.filter(
      (f) => f.lat >= minLat && f.lat <= maxLat && f.lng >= minLng && f.lng <= maxLng
    );
    if (bounded.length > 0) {
      return bounded;
    }
  }

  return list;
}

export function categorizeFacility(rawCategory: string, placeName: string): { category: string; subCategory: WorkoutFacility["subCategory"] } {
  const combined = `${rawCategory} ${placeName}`.toLowerCase();

  if (combined.includes("수영") || combined.includes("swimming")) {
    return { category: "수영장", subCategory: "swimming" };
  }
  if (combined.includes("클라이밍") || combined.includes("볼더링") || combined.includes("climbing")) {
    return { category: "클라이밍", subCategory: "climbing" };
  }
  if (combined.includes("필라테스") || combined.includes("요가") || combined.includes("pilates") || combined.includes("yoga")) {
    return { category: "필라테스·요가", subCategory: "pilates" };
  }
  if (combined.includes("골프") || combined.includes("테니스") || combined.includes("배드민턴") || combined.includes("스쿼시")) {
    return { category: "골프·테니스", subCategory: "golf" };
  }
  return { category: "헬스·PT", subCategory: "gym" };
}

export function getCategoryWorkoutImage(subCategory: WorkoutFacility["subCategory"]): string {
  switch (subCategory) {
    case "gym":
      return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80";
    case "pilates":
      return "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80";
    case "swimming":
      return "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80";
    case "climbing":
      return "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&auto=format&fit=crop&q=80";
    case "golf":
      return "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&auto=format&fit=crop&q=80";
    default:
      return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80";
  }
}

/**
 * 프론트엔드에서 운동 시설 API 호출 (클라이언트 측 서비스 헬퍼)
 */
export async function fetchWorkoutFacilities(
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number },
  subCategory: string = "all",
  signal?: AbortSignal
): Promise<WorkoutFacility[]> {
  const params = new URLSearchParams({
    swLat: bounds.swLat.toFixed(6),
    swLng: bounds.swLng.toFixed(6),
    neLat: bounds.neLat.toFixed(6),
    neLng: bounds.neLng.toFixed(6),
    subCategory,
  });

  try {
    const res = await fetch(`/api/workout/facilities?${params.toString()}`, {
      method: "GET",
      signal,
    });

    if (!res.ok) {
      console.warn("[WorkoutService] API request non-ok status:", res.status);
      return getFallbackWorkoutFacilities({ ...bounds, subCategory });
    }

    const data = await res.json();
    if (Array.isArray(data.facilities) && data.facilities.length > 0) {
      return data.facilities;
    }
    return getFallbackWorkoutFacilities({ ...bounds, subCategory });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }
    console.warn("[WorkoutService] API fetch failed, fallback used:", err);
    return getFallbackWorkoutFacilities({ ...bounds, subCategory });
  }
}
