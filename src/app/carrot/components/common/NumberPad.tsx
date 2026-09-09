"use client";

import { Delete } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"] as const;

// 모바일 웹이라 OS 네이티브 키보드 대신 화면 안에 직접 그리는 숫자패드 —
// 당근페이 송금/충전 금액 입력에서 공용으로 씀.
export function NumberPad({ onKeyPress }: { onKeyPress: (key: (typeof KEYS)[number]) => void }) {
  return (
    <div className={styles.numberPad}>
      {KEYS.map((key) => (
        <button key={key} type="button" className={styles.numberPadKey} onClick={() => onKeyPress(key)}>
          {key === "back" ? <Delete size={22} /> : key}
        </button>
      ))}
    </div>
  );
}
