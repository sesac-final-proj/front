export type RentType = "monthly" | "jeonse";
export type RentTypeFilter = RentType | "all";
export type HouseType = "apartment" | "one_room" | "two_plus" | "officetel" | "house";
export type HouseTypeFilter = HouseType | "all";

export interface RentTransaction {
  id: string;
  district: string;
  dong: string;
  buildingName?: string;
  address: string;
  rentType: RentType;
  deposit: number;
  monthlyRent: number;
  areaM2: number;
  floor?: number;
  contractDate: string;
  houseType: HouseType;
  houseTypeLabel: string;
  buildYear?: number;
  lat?: number;
  lng?: number;
}

export interface PropertyBuilding {
  id: string;
  district: string;
  dong: string;
  buildingName?: string;
  address: string;
  lat: number;
  lng: number;
  transactions: RentTransaction[];
  transactionCount: number;
  latestTransaction: RentTransaction;
  representativeRent?: number;
}

export interface PropertyDongGroup {
  dong: string;
  lat: number;
  lng: number;
  transactionCount: number;
  buildingCount: number;
  buildings: PropertyBuilding[];
}

export interface RealEstateBounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface RentTransactionResponse {
  items: RentTransaction[];
  total: number;
  source: "seoul_open_data" | "seoul_sample";
  geocodedCount: number;
  notice?: string;
}
