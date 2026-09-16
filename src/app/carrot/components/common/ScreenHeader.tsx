"use client";

import React from "react";
import styles from "../../GajiMarketApp.module.css";

export function ScreenHeader({
  title,
  leading,
  titleAccessory,
  actions,
  compact = false,
}: {
  title: React.ReactNode;
  leading?: React.ReactNode;
  titleAccessory?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={`${styles.screenHeader} ${compact ? styles.compactHeader : ""}`}>
      <div className={styles.headerTitleRow}>
        {leading}
        <h1>{title}</h1>
        {titleAccessory}
      </div>
      <div className={styles.headerActions}>{actions}</div>
    </header>
  );
}
