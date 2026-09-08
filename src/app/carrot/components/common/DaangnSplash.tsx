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
      <div className={styles.ambientGlow} />

      <div className={styles.logoWrapper}>
        <div className={styles.logoSvgWrap}>
          <svg
            viewBox="0 0 100 130"
            className={styles.logoSvg}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="당근 로고"
          >
            <defs>
              {/* Sprout Green Gradient */}
              <linearGradient id="daangn-sprout-grad" x1="20" y1="0" x2="80" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#20C997" />
                <stop offset="50%" stopColor="#00A862" />
                <stop offset="100%" stopColor="#008f53" />
              </linearGradient>

              {/* Pin Orange Gradient */}
              <linearGradient id="daangn-pin-grad" x1="50" y1="20" x2="50" y2="125" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF833E" />
                <stop offset="40%" stopColor="#FF6F0F" />
                <stop offset="100%" stopColor="#FA5A00" />
              </linearGradient>

              {/* Top Glass Highlight */}
              <linearGradient id="glass-specular" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* 1. Green Sprout / Leaf on top */}
            <g id="sprout-leaf">
              <path
                d="M48 24C37 20 28 8 38 2C48 -4 58 6 62 14C68 6 78 -2 84 4C90 10 84 20 72 24C65 26 55 26 48 24Z"
                fill="url(#daangn-sprout-grad)"
              />
              {/* Sprout shine accent */}
              <path
                d="M42 5C46 0 53 4 56 10C51 9 46 8 42 5Z"
                fill="rgba(255,255,255,0.4)"
              />
            </g>

            {/* 2. Orange Location Pin Body (with inner hollow opening) */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M50 124C34 98 16 76 16 52C16 29.5 31.2 18 50 18C68.8 18 84 29.5 84 52C84 76 66 98 50 124ZM50 67C58.2843 67 65 60.2843 65 52C65 43.7157 58.2843 37 50 37C41.7157 37 35 43.7157 35 52C35 60.2843 41.7157 67 50 67Z"
              fill="url(#daangn-pin-grad)"
            />

            {/* 3. Glass Specular Edge Light */}
            <path
              d="M50 20C66 20 80 29 82 48C82.5 44 80 34 72 26C64 18 53 18 50 20Z"
              fill="url(#glass-specular)"
              opacity="0.6"
            />
          </svg>

          {/* Shimmering glass reflection line sweeping across */}
          <div className={styles.shineOverlay} />
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
