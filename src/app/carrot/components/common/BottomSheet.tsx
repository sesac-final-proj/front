"use client";

import React from "react";
import {
  BriefcaseBusiness,
  Plus,
  ShoppingBag,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { SheetId } from "../../types";
import { formatBadge } from "../../utils";

export function BottomSheet({
  sheet,
  activeNeighborhood,
  secondaryNeighborhood,
  onClose,
  onSelectPrimary,
  onRemoveNeighborhood,
  onOpenRegionSearch,
  onProductWrite,
  onCommunityWrite,
  onTogetherWrite,
  totalUnread,
}: {
  sheet: SheetId;
  activeNeighborhood: string;
  secondaryNeighborhood: string | null;
  onClose: () => void;
  onSelectPrimary: (dongName: string) => void;
  onRemoveNeighborhood: (target: "primary" | "secondary") => void;
  onOpenRegionSearch: () => void;
  onProductWrite: () => void;
  onCommunityWrite: () => void;
  onTogetherWrite?: () => void;
  totalUnread: number;
}) {
  if (!sheet) return null;

  return (
    <div className={styles.sheetBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.modalSheet} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.sheetHandle} onClick={onClose}>
          <span />
        </button>
        {sheet === "write" && (
          <>
            <h2>무엇을 올릴까요?</h2>
            <div className={styles.sheetOptions}>
              <button type="button" onClick={onProductWrite}>
                <ShoppingBag size={28} /> 중고거래
              </button>
              <button type="button" onClick={onCommunityWrite}>
                <UsersRound size={28} /> 동네생활
              </button>
              <button type="button" onClick={onTogetherWrite}>
                <Users size={28} /> 같이해요
              </button>
              <button type="button">
                <BriefcaseBusiness size={28} /> 가지알바
              </button>
            </div>
          </>
        )}
        {sheet === "region" && (
          <>
            <h2>내 동네 설정</h2>
            <p className={styles.sheetCopy}>최대 2개의 동네를 선택할 수 있어요.</p>
            <div className={styles.myRegionList}>
              {[
                { name: activeNeighborhood, target: "primary" as const },
                ...(secondaryNeighborhood ? [{ name: secondaryNeighborhood, target: "secondary" as const }] : []),
              ].map(({ name, target }) => (
                // 로우 전체를 눌러도 그 동네가 대표로 바뀐다 — 라디오는 이제 상태만
                // 보여주는 장식이고, 실제 선택은 로우 버튼이 담당한다.
                <button
                  type="button"
                  className={styles.myRegionRow}
                  key={target}
                  aria-label={`${name}을 대표 동네로 설정`}
                  onClick={() => onSelectPrimary(name)}
                >
                  <span
                    className={`${styles.myRegionRadio} ${target === "primary" ? styles.myRegionRadioSelected : ""}`}
                  >
                    <span className={target === "primary" ? styles.myRegionRadioOn : ""} />
                  </span>
                  <span className={styles.myRegionName}>{name}</span>
                  {/* 동네가 1개뿐이면 마지막 하나는 못 지운다 — secondary가 있을 때만 X가 보인다. */}
                  {secondaryNeighborhood && (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.myRegionRemove}
                      aria-label={`${name} 삭제`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveNeighborhood(target);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.stopPropagation();
                        event.preventDefault();
                        onRemoveNeighborhood(target);
                      }}
                    >
                      <X size={18} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {!secondaryNeighborhood && (
              <button type="button" className={styles.myRegionAddBtn} onClick={onOpenRegionSearch}>
                <Plus size={18} /> 동네 추가
              </button>
            )}
          </>
        )}
        {sheet === "notifications" && (
          <>
            <h2>알림</h2>
            <div className={styles.notificationList}>
              <p>
                읽지 않은 채팅 <strong>{formatBadge(totalUnread)}</strong>
              </p>
              <p>관심 상품과 판매 상태 변경 알림이 여기에 모입니다.</p>
              <p>상품을 예약중으로 바꾸면 관련 화면에 같은 배지가 표시됩니다.</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
