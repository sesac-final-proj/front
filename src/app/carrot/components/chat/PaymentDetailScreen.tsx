"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ChatRoom, ChatMessageUi } from "@/types";
import { ScreenHeader, IconButton } from "../common";
import { Thumbnail } from "../trade";

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PaymentDetailScreen({
  room,
  payment,
  mine,
  onBack,
}: {
  room: ChatRoom;
  payment: NonNullable<ChatMessageUi["payment"]>;
  // 내가 보낸 송금인지(구매자) — 아니면 내가 받은 쪽(판매자)이라 금액 앞에 -가 안 붙는다.
  mine: boolean;
  onBack: () => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="상세 내역"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.paymentDetailBody}>
        <p className={styles.paymentDetailLabel}>머니송금</p>
        <div className={styles.chatProductCard}>
          <Thumbnail tone="product" label={room.title} imageUrl={room.productThumbnailUrl} />
          <div>
            <h2>{room.title}</h2>
            <span className={styles.paymentDetailAmount}>
              {mine ? "-" : "+"}
              {payment.amount.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className={styles.paymentDetailRow}>
          <span>거래한 사람</span>
          <strong>{room.counterpartNickname ?? room.title}</strong>
        </div>
        <div className={styles.paymentDetailSection}>
          <p className={styles.paymentDetailLabel}>거래 내역</p>
          <div className={styles.paymentDetailRow}>
            <span>일시</span>
            <strong>{formatDateTime(payment.createdAt)}</strong>
          </div>
          <div className={styles.paymentDetailRow}>
            <span>송금 금액</span>
            <strong>{payment.amount.toLocaleString("ko-KR")}원</strong>
          </div>
          <div className={styles.paymentDetailRow}>
            <span>거래 후 잔액{mine ? "" : "(상대방 기준)"}</span>
            <strong>{payment.balanceAfter.toLocaleString("ko-KR")}원</strong>
          </div>
        </div>
        {/* ponytail: 실제 영수증/증빙 발급은 스코프 밖 — 자리만 잡아둔 비활성 버튼. */}
        <button type="button" className={styles.paymentReceiptBtn} disabled title="곧 지원 예정이에요">
          송금 확인증
        </button>
      </div>
    </section>
  );
}
