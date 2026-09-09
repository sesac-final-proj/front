"use client";

import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ChatRoom } from "@/types";
import { ScreenHeader, IconButton, Avatar, NumberPad } from "../common";

// 자릿수 제한 — 이 이상은 잔액 체크로 막히니 입력 화면에서 굳이 더 받을 필요 없음.
const MAX_DIGITS = 9;

export function PaymentAmountScreen({
  room,
  balance,
  onBack,
  onSubmit,
}: {
  room: ChatRoom;
  // 잔액 조회가 끝나기 전엔 null — 로딩 중엔 보내기 버튼을 막아둔다.
  balance: number | null;
  onBack: () => void;
  onSubmit: (amount: number) => void;
}) {
  const [amountInput, setAmountInput] = useState(
    room.productPrice != null ? String(room.productPrice) : "",
  );
  const amount = Number(amountInput) || 0;
  const insufficientBalance = balance != null && amount > balance;
  const canSubmit = amount > 0 && balance != null && !insufficientBalance;

  function handleKeyPress(key: string) {
    setAmountInput((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (prev.length >= MAX_DIGITS) return prev;
      return (prev + key).replace(/^0+(?=\d)/, "");
    });
  }

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="당근머니 송금"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.paymentAmountBody}>
        <div className={styles.paymentRecipient}>
          <Avatar tone={room.avatarTone} />
          <span>{room.counterpartNickname ?? room.title}님에게</span>
        </div>
        {/* ponytail: 실제 계좌 자동충전 연동은 스코프 밖(docs/carrot-pay-trade-flow-plan.md
            6절) — 은행 계좌 대신 이 앱 안의 당근머니 잔액만 보여주고 그걸로 검증한다. */}
        <div className={styles.paymentAmountField}>
          <strong>{amountInput ? amount.toLocaleString("ko-KR") : "0"}</strong>
          <span>원</span>
        </div>
        <p className={insufficientBalance ? styles.paymentBalanceWarn : styles.paymentBalance}>
          {balance == null
            ? "보유 잔액 확인 중..."
            : insufficientBalance
              ? `보유 잔액이 부족해요 (${balance.toLocaleString("ko-KR")}원)`
              : `보유 잔액 ${balance.toLocaleString("ko-KR")}원`}
        </p>
      </div>
      <div className={styles.paymentAmountFooter}>
        <NumberPad onKeyPress={handleKeyPress} />
        <button
          type="button"
          className={styles.paymentSubmitBtn}
          disabled={!canSubmit}
          onClick={() => onSubmit(amount)}
        >
          보내기
        </button>
      </div>
    </section>
  );
}
