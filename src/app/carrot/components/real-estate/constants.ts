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
  송파구: { lat: 37.5048, lng: 127.1147 },
  용산구: { lat: 37.5324, lng: 126.9906 },
  영등포구: { lat: 37.5263, lng: 126.8962 },
  강남구: { lat: 37.5173, lng: 127.0473 },
  마포구: { lat: 37.5663, lng: 126.9018 },
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

export function districtFromNeighborhood(neighborhood: string) {
  if (neighborhood.includes("당산")) return "영등포구";
  if (neighborhood.includes("공릉")) return "노원구";
  return "송파구";
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
