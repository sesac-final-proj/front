import React from "react";
import Image from "next/image";
import {
  Settings,
  UserRound,
  ChevronRight,
  QrCode,
  Heart,
  Clock3,
  ReceiptText,
  ShoppingBag,
  UsersRound,
  Building2,
  Utensils,
  Dumbbell,
  Shirt,
  BriefcaseBusiness,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem, IconItem } from "@/types";
import { ScreenHeader, IconButton, BrandWordmark } from "../common";
import { PromoCard, IconGrid, MenuCard } from "./MenuCard";

export interface MyScreenProps {
  nickname?: string;
  activeNeighborhood: string;
  temperature?: number;
  unreadCount: number;
  favoriteCount: number;
  myProducts: ProductListItem[];
  // null이면 아직 로딩 중 — 그동안은 이전처럼 "0원"으로 보여준다.
  walletBalance?: number | null;
  // 꿈방울(기부 가능 포인트) — 결제할 때마다 자동 적립되는 값, null이면 로딩 중.
  dreamPoints?: number | null;
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  onOpenAllServices: () => void;
  onOpenDream: () => void;
  onOpenAlba: () => void;
  onOpenSales: () => void;
  onOpenFavorites: () => void;
  onOpenRecentlyViewed: () => void;
  onOpenApartment?: () => void;
  onOpenWalletCharge: () => void;
  onOpenWalletPay: () => void;
}

export function MyScreen({
  nickname,
  activeNeighborhood,
  temperature = 36.5,
  unreadCount,
  favoriteCount,
  myProducts,
  walletBalance,
  dreamPoints,
  onOpenSettings,
  onOpenMenu,
  onOpenAllServices,
  onOpenDream,
  onOpenAlba,
  onOpenSales,
  onOpenFavorites,
  onOpenRecentlyViewed,
  onOpenApartment,
  onOpenWalletCharge,
  onOpenWalletPay,
}: MyScreenProps) {
  const services: IconItem[] = [
    { label: "중고거래", icon: ShoppingBag, tone: "primary", onClick: onOpenSales },
    { label: "모임", icon: UsersRound, tone: "primary" },
    { label: "내 아파트", icon: Building2, tone: "primary", onClick: onOpenApartment },
    { label: "포장주문", icon: Utensils, tone: "amber" },
    { label: "동네걷기", icon: Dumbbell, tone: "yellow" },
    { label: "세탁 수거", icon: Shirt, tone: "cyan" },
    { label: "가지알바", icon: BriefcaseBusiness, tone: "primary", onClick: onOpenAlba },
    { label: "전체보기", icon: ChevronRight, tone: "muted", onClick: onOpenAllServices },
  ];

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="나의 당근"
        titleAccessory={
          <button type="button" className={styles.dreamEntryButton} onClick={onOpenDream} aria-label="꿈가지">
            <span className={styles.dreamEntryLabel} aria-hidden="true">
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
              <span className={styles.dreamEntrySyllable}>
                <Image src="/dream/dream-wordmark-no-outline.png" alt="" width={281} height={139} className={styles.dreamEntryWordmark} />
              </span>
            </span>
            <Image src="/dream/baby-elephant.png" alt="" width={36} height={29} className={styles.dreamEntryMascot} />
          </button>
        }
        actions={
          <IconButton label="설정" onClick={onOpenSettings}>
            <Settings size={31} />
          </IconButton>
        }
      />
      <PromoCard />
      <button type="button" className={styles.profileCard} onClick={onOpenMenu}>
        <div className={styles.profileAvatar}>
          <UserRound size={42} fill="currentColor" />
        </div>
        <div>
          <strong>{nickname ? `${nickname}님` : "로그인 필요"}</strong>
          <span>{activeNeighborhood} · 신뢰온도</span>
        </div>
        <span className={styles.temperature}>{temperature.toFixed(1)}°C</span>
        <ChevronRight size={26} />
      </button>
      <section className={styles.payCard}>
        <div className={styles.payHeader}>
          <BrandWordmark />
          <button type="button" onClick={onOpenWalletCharge}>충전</button>
          <button type="button">송금</button>
          <button type="button" className={styles.payButton} onClick={onOpenWalletPay}>
            <QrCode size={19} /> 결제
          </button>
        </div>
        <div className={styles.payBalance}>
          <button type="button">
            머니 <strong>{(walletBalance ?? 0).toLocaleString("ko-KR")}원</strong> <ChevronRight size={18} />
          </button>
          <button type="button">
            포인트 <strong>{(dreamPoints ?? 0).toLocaleString("ko-KR")}원</strong> <ChevronRight size={18} />
          </button>
        </div>
      </section>
      <IconGrid items={services} />
      <section className={styles.quickStats}>
        <button type="button" onClick={onOpenFavorites}>
          <Heart size={31} />
          관심목록
          <strong>{favoriteCount}</strong>
        </button>
        <button type="button" onClick={onOpenRecentlyViewed}>
          <Clock3 size={31} />
          최근 본
        </button>
      </section>
      <MenuCard
        title="자주 사용"
        items={[
          { label: "판매관리", icon: ReceiptText, onClick: onOpenSales, trailing: `${myProducts.length}` },
          { label: "관심목록", icon: Heart, onClick: onOpenFavorites, trailing: `${favoriteCount}` },
        ]}
      />
    </section>
  );
}
