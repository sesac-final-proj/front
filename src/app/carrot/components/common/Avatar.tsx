"use client";

import React from "react";
import {
  Building2,
  BriefcaseBusiness,
  Coffee,
  House,
  NotebookTabs,
  ShoppingBasket,
  WalletCards,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";

export function Avatar({ tone }: { tone: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    coffee: <Coffee size={30} />,
    building: <Building2 size={30} />,
    job: <BriefcaseBusiness size={30} />,
    store: <ShoppingBasket size={30} />,
    calendar: <NotebookTabs size={30} />,
    pay: <WalletCards size={30} />,
    wood: <House size={30} />,
  };
  return (
    <div className={`${styles.avatarCircle} ${styles[`avatar_${tone}` as keyof typeof styles] ?? ""}`}>
      {iconMap[tone]}
    </div>
  );
}
