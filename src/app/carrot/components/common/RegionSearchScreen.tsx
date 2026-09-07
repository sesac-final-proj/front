"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { Region } from "../../types";

export function RegionSearchScreen({
  regions,
  recentNeighborhoods,
  onBack,
  onPick,
}: {
  regions: Region[];
  recentNeighborhoods: string[];
  onBack: () => void;
  onPick: (dongName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const matched = normalized
    ? regions.filter((r) => r.dongName.includes(normalized) || r.guName.includes(normalized))
    : regions;

  return (
    <section className={styles.screen}>
      <div className={styles.regionSearchTop}>
        <label className={styles.searchField}>
          <Search size={18} />
          <input
            autoFocus
            type="text"
            placeholder="동, 읍, 면으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className={styles.regionSearchCloseBtn} onClick={onBack}>
          닫기
        </button>
      </div>

      {!normalized && recentNeighborhoods.length > 0 && (
        <section className={styles.regionSearchSection}>
          <h2>최근 설정한 동네</h2>
          <div className={styles.regionRecentChips}>
            {recentNeighborhoods.map((name) => (
              <button type="button" key={name} className={styles.regionRecentChip} onClick={() => onPick(name)}>
                {name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.regionSearchSection}>
        <h2>{normalized ? "검색 결과" : "지금 있는 동네"}</h2>
        <div className={styles.regionSearchList}>
          {matched.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.regionSearchListItem}
              onClick={() => onPick(r.dongName)}
            >
              서울 {r.guName} {r.dongName}
            </button>
          ))}
          {matched.length === 0 && <p className={styles.sheetCopy}>검색 결과가 없어요.</p>}
        </div>
      </section>
    </section>
  );
}
