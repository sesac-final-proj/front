"use client";

import React from "react";
import { Home, MapPin, MessageCircle, UserRound, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { TabId } from "../../types";
import { formatBadge } from "../../utils";
import { EggplantPinIcon } from "./EggplantPinIcon";

export function BottomNav({
  activeTab,
  unreadCount,
  onNavigate,
}: {
  activeTab: TabId;
  unreadCount: number;
  onNavigate: (tab: TabId) => void;
}) {
  const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
    { id: "home", label: "홈", icon: Home },
    { id: "community", label: "커뮤니티", icon: UsersRound },
    { id: "map", label: "동네지도", icon: MapPin },
    { id: "chats", label: "채팅", icon: MessageCircle },
    { id: "my", label: "나의 당근", icon: UserRound },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="주요 화면">
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none", visibility: "hidden" }}>
        <defs>
          <linearGradient id="eggplant-pin-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eggplant-pin-top, #078452)" />
            <stop offset="30%" stopColor="var(--eggplant-pin-top, #078452)" />
            <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
            <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
          </linearGradient>
        </defs>
      </svg>
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            className={isActive ? styles.navActive : ""}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(tab.id)}
          >
            <span>
              {tab.id === "map" ? (
                <EggplantPinIcon size={28} active={isActive} />
              ) : (
                <TabIcon
                  size={28}
                  fill={isActive ? "url(#eggplant-pin-gradient)" : "none"}
                  stroke={isActive ? "none" : "currentColor"}
                  strokeWidth={isActive ? 0 : 1.7}
                />
              )}
              {tab.id === "chats" && unreadCount > 0 && <em>{formatBadge(unreadCount)}</em>}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
