"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getWalletTransactions, type WalletTransactionItem } from "@/services/walletService";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

// ponytail: 페이지네이션 없이 최근 100건만 — DreamPointsHistoryScreen과 동일한 절충.
const HISTORY_SIZE = 100;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function WalletHistoryScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<WalletTransactionItem[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getWalletTransactions(HISTORY_SIZE, controller.signal)
      .then(({ transactions }) => setItems(transactions))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setItems([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="당근머니 거래내역"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.walletHistoryList} aria-label="당근머니 거래내역">
        {items === null && <p className={styles.walletHistoryEmpty}>불러오는 중이에요.</p>}
        {items?.map((item) => (
          <div key={item.id} className={styles.walletHistoryRow}>
            <div>
              <strong>{item.storeName ?? item.productTitle ?? item.counterpartNickname ?? "당근페이"}</strong>
              <small>
                {item.storeName
                  ? `현장결제 · ${formatDate(item.createdAt)}`
                  : `${item.isSender ? "보냄" : "받음"} · ${item.counterpartNickname ?? "상대방"} · ${formatDate(item.createdAt)}`}
              </small>
            </div>
            <span className={item.isSender ? styles.walletHistoryAmountOut : styles.walletHistoryAmountIn}>
              {item.isSender ? "-" : "+"}
              {item.amount.toLocaleString("ko-KR")}원
            </span>
          </div>
        ))}
        {items?.length === 0 && (
          <p className={styles.walletHistoryEmpty}>아직 거래내역이 없어요. 채팅에서 당근페이로 송금하면 여기에 남아요.</p>
        )}
      </div>
    </section>
  );
}
