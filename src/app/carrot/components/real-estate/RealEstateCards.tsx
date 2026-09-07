import React from "react";
import { Building2 } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { RentTransaction } from "@/types";
import { displayBuildingName, formatRentPrice, formatArea } from "./constants";

export function RealEstateCompactCard({ transaction, usePyeong }: { transaction: RentTransaction; usePyeong: boolean }) {
  return (
    <article className={styles.realEstateCompactCard}>
      <span className={styles.realEstateBadge}>실거래</span>
      <small>{transaction.houseTypeLabel}</small>
      <h3>{displayBuildingName(transaction)}</h3>
      <strong>{formatRentPrice(transaction)}</strong>
      <p>{transaction.dong} · {formatArea(transaction.areaM2, usePyeong)}{transaction.floor !== undefined && transaction.floor > 0 ? ` · ${transaction.floor}층` : ""}</p>
      <time>{transaction.contractDate.slice(0, 7).replace("-", ".")} 계약</time>
    </article>
  );
}

export function RealEstateTransactionRow({ transaction, usePyeong }: { transaction: RentTransaction; usePyeong: boolean }) {
  return (
    <article className={styles.realEstateTransactionRow}>
      <div className={styles.realEstateTypeIcon}><Building2 size={26} /></div>
      <div>
        <span className={styles.realEstateBadge}>실거래</span>
        <h3>{displayBuildingName(transaction)}</h3>
        <strong>{formatRentPrice(transaction)}</strong>
        <p>{transaction.dong} · {formatArea(transaction.areaM2, usePyeong)}{transaction.floor !== undefined && transaction.floor > 0 ? ` · ${transaction.floor}층` : ""}</p>
        <time>{transaction.contractDate.slice(0, 7).replace("-", ".")} 계약 · {transaction.houseTypeLabel}</time>
      </div>
    </article>
  );
}
