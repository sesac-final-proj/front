"use client";

import React, { useEffect, useState } from "react";
import styles from "./DaangnSplash.module.css";
import { THEME_STORAGE_KEY } from "../../constants";

export interface DaangnSplashProps {
  message?: string;
  subMessage?: string;
  theme?: "light" | "dark" | "auto";
}

export function DaangnSplash({
  message = "로그인 확인 중...",
  subMessage = "당근과 함께 따뜻한 동네를 만들어요",
  theme: explicitTheme = "auto",
}: DaangnSplashProps) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (explicitTheme !== "auto") {
      setThemeMode(explicitTheme);
      return;
    }

    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeMode(savedTheme);
        return;
      }
    } catch {}

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setThemeMode(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => setThemeMode(e.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [explicitTheme]);

  return (
    <aside className={styles.splashContainer} data-theme={themeMode} aria-busy="true" aria-live="polite">
      <div className={styles.logoWrapper}>
        <div className={styles.logoSvgWrap}>
          <img className={styles.logoSvg} src="/brand/gaji-mark.svg" alt="당근 로고" />
        </div>

        <div className={styles.infoArea}>
          <p className={styles.titleText}>{message}</p>
          {subMessage && (
            <p className={styles.subText}>
              <span>{subMessage}</span>
            </p>
          )}
          <div className={styles.dotsWrapper} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>
    </aside>
  );
}
