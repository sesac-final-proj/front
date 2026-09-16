import React from "react";
import { ChevronRight, LucideIcon, CakeSlice, X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { IconItem } from "@/types";

export function PromoCard() {
  return (
    <div className={styles.promoCard}>
      <div className={styles.promoThumb}>
        <CakeSlice size={28} />
      </div>
      <div>
        <strong>당근X동네 베이커리 콜라보 출시</strong>
        <span>포장주문하면 4천원 할인까지</span>
      </div>
      <button type="button" aria-label="닫기">
        <X size={25} />
      </button>
    </div>
  );
}

export function IconGrid({ items }: { items: IconItem[] }) {
  return (
    <section className={styles.iconGrid}>
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <button type="button" key={item.label} onClick={item.onClick}>
            <span className={`${styles.gridIcon} ${styles[`grid_${item.tone ?? "primary"}` as keyof typeof styles] ?? ""}`}>
              <ItemIcon size={31} />
            </span>
            {item.label}
          </button>
        );
      })}
    </section>
  );
}

export interface MenuCardProps {
  title: string;
  items: Array<{ label: string; icon: LucideIcon; onClick?: () => void; trailing?: string }>;
}

export function MenuCard({
  title,
  items,
}: MenuCardProps) {
  return (
    <section className={styles.menuCard}>
      <h2>{title}</h2>
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <button type="button" key={item.label} onClick={item.onClick}>
            <ItemIcon size={28} />
            <span>{item.label}</span>
            {item.trailing && <strong>{item.trailing}</strong>}
            <ChevronRight size={24} />
          </button>
        );
      })}
    </section>
  );
}
