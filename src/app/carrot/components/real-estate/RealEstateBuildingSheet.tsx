import React from "react";
import { X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { PropertyBuilding } from "@/types";
import { displayBuildingName, formatRentPrice, formatArea } from "./constants";

export interface RealEstateBuildingSheetProps {
  building: PropertyBuilding;
  usePyeong: boolean;
  onClose: () => void;
}

export function RealEstateBuildingSheet({
  building,
  usePyeong,
  onClose,
}: RealEstateBuildingSheetProps) {
  const latest = building.latestTransaction;
  return (
    <article className={styles.realEstateBuildingSheet}>
      <button type="button" className={styles.realEstateSheetClose} aria-label="건물 정보 닫기" onClick={onClose}><X size={19} /></button>
      <div className={styles.realEstateSheetHandle} />
      <span className={styles.realEstateBadge}>실거래</span>
      <h2>{displayBuildingName(latest)}</h2>
      <strong>{formatRentPrice(latest)}만원</strong>
      <p>{latest.dong} · {formatArea(latest.areaM2, usePyeong)}{latest.floor !== undefined && latest.floor > 0 ? ` · ${latest.floor}층` : ""}</p>
      <time>{latest.contractDate.slice(0, 7).replace("-", ".")} 계약 · {latest.houseTypeLabel}</time>
      <div className={styles.realEstateSheetTransactions}>
        <b>최근 실거래 {building.transactionCount}건</b>
        {building.transactions.slice(0, 3).map((transaction) => (
          <span key={transaction.id}>{formatRentPrice(transaction)} · {transaction.contractDate.slice(0, 7).replace("-", ".")}</span>
        ))}
      </div>
    </article>
  );
}
