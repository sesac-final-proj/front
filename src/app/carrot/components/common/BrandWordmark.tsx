"use client";

import React from "react";
import styles from "../../GajiMarketApp.module.css";

export function BrandWordmark() {
  return (
    <span className={styles.brandMark} aria-label="가지페이">
      <svg className={styles.brandSymbol} viewBox="216 0 568 748" aria-hidden="true" focusable="false">
        <image href="/brand/danggeun-reference.png" width="1000" height="1101" />
      </svg>
      <span className={styles.brandWord}>pay</span>
    </span>
  );
}
