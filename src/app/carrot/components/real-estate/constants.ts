import {
  Building2,
  House,
  Home,
  Menu,
  LucideIcon,
} from "lucide-react";
import type { HouseTypeFilter, RentTransaction } from "@/types";

export const SEOUL_DISTRICTS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구",
  "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구",
  "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
];

export const REAL_ESTATE_DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  종로구: { lat: 37.5730, lng: 126.9794 },
  중구: { lat: 37.5638, lng: 126.9976 },
  용산구: { lat: 37.5324, lng: 126.9906 },
  성동구: { lat: 37.5634, lng: 127.0368 },
  광진구: { lat: 37.5385, lng: 127.0823 },
  동대문구: { lat: 37.5744, lng: 127.0397 },
  중랑구: { lat: 37.6063, lng: 127.0927 },
  성북구: { lat: 37.5894, lng: 127.0167 },
  강북구: { lat: 37.6396, lng: 127.0255 },
  도봉구: { lat: 37.6688, lng: 127.0471 },
  노원구: { lat: 37.6542, lng: 127.0568 },
  은평구: { lat: 37.6027, lng: 126.9291 },
  서대문구: { lat: 37.5791, lng: 126.9368 },
  마포구: { lat: 37.5663, lng: 126.9018 },
  양천구: { lat: 37.5169, lng: 126.8665 },
  강서구: { lat: 37.5509, lng: 126.8496 },
  구로구: { lat: 37.4954, lng: 126.8874 },
  금천구: { lat: 37.4568, lng: 126.8955 },
  영등포구: { lat: 37.5263, lng: 126.8962 },
  동작구: { lat: 37.5124, lng: 126.9393 },
  관악구: { lat: 37.4784, lng: 126.9516 },
  서초구: { lat: 37.4837, lng: 127.0324 },
  강남구: { lat: 37.5173, lng: 127.0473 },
  송파구: { lat: 37.5048, lng: 127.1147 },
  강동구: { lat: 37.5301, lng: 127.1238 },
};

export const REAL_ESTATE_PROPERTY_TYPES: Array<{
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

export const DEPOSIT_FILTERS = [
  { value: "", label: "보증금 전체" },
  { value: "500", label: "보증금 500만 이하" },
  { value: "1000", label: "보증금 1천만 이하" },
  { value: "3000", label: "보증금 3천만 이하" },
  { value: "5000", label: "보증금 5천만 이하" },
  { value: "10000", label: "보증금 1억 이하" },
];

export const MONTHLY_RENT_FILTERS = [
  { value: "", label: "월세 전체" },
  { value: "30", label: "월세 30만 이하" },
  { value: "50", label: "월세 50만 이하" },
  { value: "70", label: "월세 70만 이하" },
  { value: "100", label: "월세 100만 이하" },
  { value: "150", label: "월세 150만 이하" },
];

const DONG_DISTRICT_MAP: Record<string, string[]> = {
  구로구: ["개봉", "신도림", "오류", "구로", "가리봉", "고척", "항동", "천왕", "궁동", "온수"],
  금천구: ["가산", "독산", "시흥"],
  영등포구: ["당산", "여의도", "여의", "문래", "영등포", "신길", "양평", "대림", "도림"],
  양천구: ["목동", "신정", "신월"],
  강서구: ["화곡", "등촌", "염창", "마곡", "가양", "방화", "공항", "발산", "우장산"],
  마포구: ["상암", "공덕", "아현", "합정", "망원", "서교", "연남", "성산", "신수", "도화", "용강", "대흥"],
  서대문구: ["신촌", "연희", "북가좌", "남가좌", "홍제", "홍은", "충정로", "창천"],
  은평구: ["불광", "갈현", "응암", "역촌", "대조", "신사", "녹번", "진관", "수색", "구산"],
  용산구: ["한남", "이태원", "용산", "후암", "청파", "원효", "효창", "보광", "서빙고", "이촌", "남영"],
  종로구: ["종로", "혜화", "명륜", "평창", "부암", "삼청", "가회", "인사", "사직", "무악", "창신", "숭인"],
  중구: ["명동", "을지로", "회현", "충무로", "신당", "황학", "약수", "다산", "장충", "소공", "필동"],
  성동구: ["성수", "옥수", "금호", "왕십리", "마장", "사근", "행당", "송정", "용답", "응봉"],
  광진구: ["자양", "구의", "화양", "군자", "능동", "중곡", "광장"],
  동대문구: ["전농", "장안", "답십리", "이문", "회기", "청량리", "용두", "제기", "휘경"],
  중랑구: ["면목", "상봉", "중화", "묵동", "망우", "신내"],
  성북구: ["길음", "정릉", "안암", "보문", "돈암", "삼선", "동선", "석관", "장위", "월곡"],
  강북구: ["수유", "미아", "번동", "우이"],
  도봉구: ["쌍문", "방학", "창동", "도봉"],
  노원구: ["상계", "중계", "하계", "공릉", "월계"],
  동작구: ["사당", "상도", "노량진", "흑석", "대방", "신대방"],
  관악구: ["신림", "봉천", "난곡", "낙성대", "남현", "보라매", "대학동", "서원동"],
  서초구: ["서초", "반포", "방배", "잠원", "양재", "내곡", "우면"],
  강남구: ["역삼", "개포", "청담", "삼성", "대치", "신사", "논현", "압구정", "세곡", "일원", "수서", "도곡", "율현", "자곡"],
  송파구: ["잠실", "신천", "풍납", "송파", "석촌", "삼전", "가락", "문정", "장지", "방이", "오금", "거여", "마천"],
  강동구: ["명일", "고덕", "상일", "길동", "둔촌", "암사", "성내", "천호", "강일"],
};

export function districtFromNeighborhood(neighborhood: string): string {
  if (!neighborhood) return "구로구";
  const clean = neighborhood.trim();

  // 1. 이미 자치구 이름이 직접 포함된 경우
  for (const dist of SEOUL_DISTRICTS) {
    if (clean.includes(dist)) return dist;
  }

  // 2. 동 이름으로 자치구 탐색
  for (const [dist, dongs] of Object.entries(DONG_DISTRICT_MAP)) {
    for (const dong of dongs) {
      if (clean.includes(dong)) {
        return dist;
      }
    }
  }

  return "구로구";
}

export function formatRentPrice(transaction: RentTransaction) {
  if (transaction.rentType === "jeonse") return `전세 ${transaction.deposit.toLocaleString()}`;
  return `월세 ${transaction.deposit.toLocaleString()}/${transaction.monthlyRent.toLocaleString()}`;
}

export function formatArea(areaM2: number, usePyeong: boolean) {
  return usePyeong ? `${(areaM2 / 3.3058).toFixed(1)}평` : `${areaM2.toFixed(1)}㎡`;
}

export function displayBuildingName(transaction: RentTransaction) {
  const name = transaction.buildingName?.trim();
  if (name && !/^\([\d-]+\)$/.test(name)) return name;
  return `${transaction.dong} ${transaction.houseTypeLabel}`;
}
