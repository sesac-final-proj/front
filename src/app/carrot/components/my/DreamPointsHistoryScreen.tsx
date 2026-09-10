"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getDreamPointsHistory, type DreamPointTransaction } from "@/services";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

const POINT_SOURCE_LABEL: Record<DreamPointTransaction["source"], string> = {
  general_payment: "일반결제 적립",
  trade: "중고거래 적립",
};

// ponytail: 페이지네이션 없이 최근 100건만 한 번에 — 그 이상 쌓이는 계정이 나오면
// 그때 getDreamPointsHistory에 page를 추가해서 "더 보기"를 붙이면 된다.
const HISTORY_SIZE = 100;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function DreamPointsHistoryScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<DreamPointTransaction[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getDreamPointsHistory(HISTORY_SIZE, controller.signal)
      .then(({ transactions }) => setItems(transactions))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setItems([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className={`${styles.screen} ${styles.dreamScreen}`}>
      <ScreenHeader
        title="꿈방울 적립 내역"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.dreamPointsHistoryList} aria-label="꿈방울 적립 내역">
        {items === null && <p className={styles.dreamEmpty}>불러오는 중이에요.</p>}
        {items?.map((item) => (
          <div key={item.id} className={styles.dreamPointsHistoryRow}>
            <div>
              <strong>{POINT_SOURCE_LABEL[item.source]}</strong>
              <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            </div>
            <span>+{item.amount.toLocaleString("ko-KR")}방울</span>
          </div>
        ))}
        {items?.length === 0 && (
          <p className={styles.dreamEmpty}>아직 적립된 꿈방울이 없어요. 결제할 때마다 자동으로 쌓여요.</p>
        )}
      </div>
    </section>
  );
}
