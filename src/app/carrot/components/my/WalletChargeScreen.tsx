"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton, NumberPad } from "../common";

const MAX_DIGITS = 9;

// ponytail: 실제 계좌 자동충전 연동은 스코프 밖(docs/carrot-pay-trade-flow-plan.md 6절) —
// 은행 계좌 선택 없이 금액만 입력하면 그대로 당근머니 잔액에 더해진다.
export function WalletChargeScreen({
  balance,
  onBack,
  onSubmit,
}: {
  balance: number | null;
  onBack: () => void;
  onSubmit: (amount: number) => void;
}) {
  const [amountInput, setAmountInput] = useState("");
  const amount = Number(amountInput) || 0;
  const canSubmit = amount > 0;

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
        title="당근머니 충전"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.paymentAmountBody}>
        <div className={styles.paymentAmountField}>
          <strong>{amountInput ? amount.toLocaleString("ko-KR") : "0"}</strong>
          <span>원</span>
        </div>
        <p className={styles.paymentBalance}>
          {balance == null ? "보유 잔액 확인 중..." : `보유 잔액 ${balance.toLocaleString("ko-KR")}원`}
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
          충전하기
        </button>
      </div>
    </section>
  );
}
