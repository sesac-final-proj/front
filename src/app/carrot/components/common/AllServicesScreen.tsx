"use client";

import React from "react";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CakeSlice,
  ChevronLeft,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gem,
  GraduationCap,
  Heart,
  House,
  MessageCircle,
  NotebookTabs,
  QrCode,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Store,
  Tag,
  Truck,
  UsersRound,
  Utensils,
  WalletCards,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader } from "./ScreenHeader";
import { IconButton } from "./IconButton";

export function AllServicesScreen({
  onBack,
  onOpenAlba,
  onOpenRealEstate,
  onOpenApartment,
  onOpenGame,
}: {
  onBack: () => void;
  onOpenAlba?: () => void;
  onOpenRealEstate?: () => void;
  onOpenApartment?: () => void;
  onOpenGame?: () => void;
}) {
  const serviceCategories = [
    {
      title: "최근 사용",
      items: [
        { label: "포장주문", icon: Utensils, color: "#f4a340" },
        { label: "스토어", icon: ShoppingBasket, color: "#ff922b" },
      ],
    },
    {
      title: "동네 거래",
      items: [
        { label: "중고거래", icon: ShoppingBag, color: "#ff6f0f" },
        { label: "알바", icon: BriefcaseBusiness, color: "var(--color-primary)", onClick: onOpenAlba },
        { label: "부동산", icon: House, color: "var(--color-primary)", onClick: onOpenRealEstate },
        { label: "중고차", icon: Truck, color: "#228be6" },
        { label: "스토어", icon: ShoppingBasket, color: "#fab005" },
        { label: "포장주문", icon: Utensils, color: "#ff922b" },
        { label: "공동구매", icon: Tag, color: "#ff6b6b" },
        { label: "레슨/과외", icon: BookOpen, color: "#a9e34b" },
      ],
    },
    {
      title: "동네 서비스",
      items: [
        { label: "세탁 수거", icon: Shirt, color: "#22b8cf" },
        { label: "출장 세차", icon: SprayCan, color: "#339af0" },
      ],
    },
    {
      title: "동네 이야기",
      items: [
        { label: "모임", icon: UsersRound, color: "#ff922b" },
        { label: "온라인 카페", icon: Coffee, color: "#fab005" },
        { label: "내 아파트", icon: Building2, color: "var(--color-primary)", onClick: onOpenApartment },
        { label: "아파트 오픈게시판", icon: Building2, color: "#ff922b" },
        { label: "동네생활", icon: MessageCircle, color: "#22b8cf" },
        { label: "스토리", icon: Sparkles, color: "#ff6b6b" },
        { label: "한 입 뉴스", icon: NotebookTabs, color: "#ff922b" },
      ],
    },
    {
      title: "비즈니스",
      items: [
        { label: "비즈프로필", icon: Store, color: "#fab005" },
        { label: "광고", icon: Bell, color: "#ff922b" },
        { label: "월세 카드결제", icon: House, color: "#ff922b" },
        { label: "ATM 출금", icon: WalletCards, color: "#20b77a" },
        { label: "당근 교환권", icon: QrCode, color: "#ff6f0f" },
      ],
    },
    {
      title: "혜택/브랜드",
      items: [
        { label: "혜택", icon: Gem, color: "#339af0" },
        { label: "선물가게", icon: CakeSlice, color: "#ff922b" },
        { label: "동네걷기", icon: Dumbbell, color: "#ff922b" },
        { label: "당근이네", icon: Sparkles, color: "#20b77a" },
        { label: "게임", icon: Gamepad2, color: "#ff922b", onClick: onOpenGame },
        { label: "당근메이드", icon: House, color: "#ff922b" },
      ],
    },
    {
      title: "동네 전문가 찾기",
      items: [
        { label: "전문가 견적", icon: ShieldCheck, color: "#ff922b" },
        { label: "취미/클래스", icon: GraduationCap, color: "#339af0" },
        { label: "이사/용달", icon: Truck, color: "#339af0" },
        { label: "청소", icon: SprayCan, color: "#20b77a" },
        { label: "시공", icon: House, color: "#20b77a" },
        { label: "수리", icon: Settings, color: "#868e96" },
        { label: "운동", icon: Dumbbell, color: "#339af0" },
        { label: "학원", icon: GraduationCap, color: "#339af0" },
        { label: "미용실", icon: Sparkles, color: "#ff922b" },
        { label: "뷰티", icon: Heart, color: "#ff922b" },
        { label: "병원", icon: Heart, color: "#20b77a" },
        { label: "반려동물", icon: Sparkles, color: "#fab005" },
      ],
    },
    {
      title: "동네 먹거리 찾기",
      items: [
        { label: "음식점", icon: Utensils, color: "#ff922b" },
        { label: "카페/간식", icon: Coffee, color: "#fab005" },
      ],
    },
  ];

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="전체 서비스"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.allServicesContainer}>
        {serviceCategories.map((category) => (
          <div key={category.title} className={styles.serviceCategoryGroup}>
            <h3 className={styles.serviceCategoryTitle}>{category.title}</h3>
            <div className={styles.serviceCategoryGrid}>
              {category.items.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    type="button"
                    key={`${item.label}-${idx}`}
                    className={styles.serviceItemButton}
                    onClick={item.onClick}
                  >
                    <span className={styles.serviceItemIcon} style={{ color: item.color }}>
                      <ItemIcon size={22} />
                    </span>
                    <span className={styles.serviceItemLabel}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
