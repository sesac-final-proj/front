import React from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { HouseTypeFilter, RentTypeFilter } from "@/types";
import { REAL_ESTATE_PROPERTY_TYPES, DEPOSIT_FILTERS, MONTHLY_RENT_FILTERS } from "./constants";

export interface RealEstateFilterBarProps {
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
}

export function RealEstateFilterBar({
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
}: RealEstateFilterBarProps) {
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
