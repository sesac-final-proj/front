"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getUserNotice, listUserNotices, type UserNotice, type UserNoticeService } from "@/services";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

export const DREAM_NOTICE_ITEMS = [] as const;

export interface DreamNoticeScreenProps {
  onBack: () => void;
  service?: UserNoticeService;
  serviceParamName?: "service" | "service_type";
}

function formatNoticeDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

export function DreamNoticeScreen({ onBack, service = "dream", serviceParamName = "service" }: DreamNoticeScreenProps) {
  const [notices, setNotices] = useState<UserNotice[]>([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<UserNotice | null>(null);
  const handleBack = selectedNoticeId !== null ? () => {
    setSelectedNoticeId(null);
    setSelectedNotice(null);
  } : onBack;

  useEffect(() => {
    document.querySelector("[data-app-scroll]")?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedNoticeId]);

  useEffect(() => {
    let cancelled = false;
    listUserNotices(service, serviceParamName)
      .then((items) => {
        if (!cancelled) setNotices(items);
      })
      .catch(() => {
        if (!cancelled) setNotices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [service, serviceParamName]);

  useEffect(() => {
    if (selectedNoticeId === null) return;
    let cancelled = false;
    getUserNotice(selectedNoticeId)
      .then((notice) => {
        if (!cancelled) setSelectedNotice(notice);
      })
      .catch(() => {
        if (!cancelled) setSelectedNotice(null);
      });
    return () => {
      cancelled = true;
    };
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
            <time dateTime={selectedNotice.created_at}>{formatNoticeDate(selectedNotice.created_at)}</time>
          </header>

          <div className={styles.dreamNoticeDetailBody}>
            {selectedNotice.content.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      ) : (
        <div className={styles.dreamNoticeList} aria-label="공지사항 목록">
          {notices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className={styles.dreamNoticeListItem}
              onClick={() => {
                setSelectedNotice(notice);
                setSelectedNoticeId(notice.id);
              }}
            >
              <strong>{notice.title}</strong>
              <time dateTime={notice.created_at}>{formatNoticeDate(notice.created_at)}</time>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
