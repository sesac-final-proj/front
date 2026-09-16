"use client";

import React from "react";
import styles from "../../GajiMarketApp.module.css";

export function IconButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={`${styles.iconButton} ${className}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
