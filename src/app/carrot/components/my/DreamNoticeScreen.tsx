import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

export const DREAM_NOTICE_ITEMS = [
  {
    id: "dream-launch",
    title: "[공지] 꿈가지가 오픈되었어요",
    date: "2026.09.01",
  },
] as const;

export interface DreamNoticeScreenProps {
  onBack: () => void;
}

export function DreamNoticeScreen({ onBack }: DreamNoticeScreenProps) {
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const selectedNotice = DREAM_NOTICE_ITEMS.find((notice) => notice.id === selectedNoticeId) ?? null;
  const handleBack = selectedNotice ? () => setSelectedNoticeId(null) : onBack;

  useEffect(() => {
    document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedNoticeId]);

  return (
    <section className={`${styles.screen} ${styles.dreamScreen} ${styles.dreamNoticeScreen}`}>
      <ScreenHeader
        title="공지사항"
        leading={
          <IconButton label="뒤로" onClick={handleBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />

      {selectedNotice ? (
        <article className={styles.dreamNoticeDetail}>
          <header className={styles.dreamNoticeDetailHeader}>
            <h2>{selectedNotice.title}</h2>
            <time dateTime={selectedNotice.date.replaceAll(".", "-")}>{selectedNotice.date}</time>
          </header>

          {selectedNotice.id === "dream-launch" && (
            <div className={styles.dreamNoticeDetailBody}>
              <p>
                우리 동네 아이들의 작은 꿈을 함께 키우는 <strong>꿈가지가 문을 열었어요.</strong>
              </p>
              <p>
                꿈가지는 지역사회의 도움이 필요한 아이들을 이웃과 함께 응원하고, 아이들이 자신의 꿈을 건강하게 키워갈 수 있도록 마음을 모으는 공간이에요.
              </p>
              <p>
                작은 관심과 나눔이 아이들에게는 새로운 경험과 용기가 될 수 있어요. 우리 동네 아이들의 내일이 더 환하게 자랄 수 있도록 꿈가지와 함께해 주세요.
              </p>
            </div>
          )}
        </article>
      ) : (
        <div className={styles.dreamNoticeList} aria-label="공지사항 목록">
          {DREAM_NOTICE_ITEMS.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className={styles.dreamNoticeListItem}
              onClick={() => setSelectedNoticeId(notice.id)}
            >
              <strong>{notice.title}</strong>
              <time dateTime={notice.date.replaceAll(".", "-")}>{notice.date}</time>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
