import React from "react";
import {
  ChevronLeft,
  Settings,
  ReceiptText,
  ShoppingBasket,
  Sparkles,
  BookOpen,
  Heart,
  Tag,
  NotebookTabs,
  GraduationCap,
  UsersRound,
  ShieldCheck,
  BadgePercent,
  Store,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";
import { MenuCard } from "./MenuCard";

export interface MyMenuScreenProps {
  onBack: () => void;
  onOpenAlba?: (tab: "manage") => void;
}

export function MyMenuScreen({
  onBack,
  onOpenAlba,
}: MyMenuScreenProps) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="나의 가지"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <IconButton label="설정">
            <Settings size={29} />
          </IconButton>
        }
      />
      <MenuCard
        title="나의 거래"
        items={[
          { label: "판매관리", icon: ReceiptText },
          { label: "구매내역", icon: ShoppingBasket },
          { label: "내 물건 가격 찾기", icon: Sparkles },
          { label: "중고거래 가격뷰", icon: BookOpen },
        ]}
      />
      <MenuCard
        title="나의 관심"
        items={[
          { label: "관심목록", icon: Heart },
          { label: "키워드 알림 설정", icon: Tag },
        ]}
      />
      <MenuCard
        title="나의 활동"
        items={[
          { label: "알바 구인 공고", icon: NotebookTabs, onClick: () => onOpenAlba?.("manage") },
          { label: "선생님 프로필 관리", icon: GraduationCap },
          { label: "참여중인 모임", icon: UsersRound },
          { label: "내 동네생활 글", icon: ReceiptText },
        ]}
      />
      <MenuCard
        title="나의 비즈니스"
        items={[
          { label: "비즈니스 프로필", icon: ShieldCheck },
          { label: "광고 관리", icon: BadgePercent },
          { label: "업체 관리", icon: Store },
        ]}
      />
    </section>
  );
}
