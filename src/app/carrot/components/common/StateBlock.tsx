"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";

export function StateBlock({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.stateBlock}>
      <Sparkles size={30} />
      <h2>{title}</h2>
      <p>{body}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
