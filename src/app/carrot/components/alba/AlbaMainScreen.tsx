import React, { useState } from "react";
import {
  X,
  Search,
  Menu,
  Heart,
  ChevronRight,
  BriefcaseBusiness,
  MapPin,
  Plus,
  Home,
  FileText,
  Footprints,
  Calendar,
  Utensils,
  Package,
  BookOpen,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { AlbaItem } from "@/types";
import { StateBlock } from "../common";
import { AlbaCardComponent } from "./AlbaCardComponent";

export interface AlbaMainScreenProps {
  activeNeighborhood: string;
  initialTab?: "home" | "search" | "applications" | "manage";
  initialCategory?: string;
  albas: AlbaItem[];
  onBack: () => void;
  onSelectAlba: (id: string) => void;
  onWrite: () => void;
  onToggleFavorite: (id: string) => void;
}

export function AlbaMainScreen({
  activeNeighborhood,
  initialTab = "home",
  initialCategory,
  albas,
  onBack,
  onSelectAlba,
  onWrite,
  onToggleFavorite,
}: AlbaMainScreenProps) {
  const [currentTab, setCurrentTab] = useState<"home" | "search" | "applications" | "manage">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { label: "이웃알바", icon: Heart },
    { label: "걸어서10분", icon: Footprints },
    { label: "단기알바", icon: Calendar },
    { label: "식당/카페", icon: Utensils },
    { label: "물류/현장", icon: Package },
    { label: "레슨/과외", icon: BookOpen },
  ];

  const filteredAlbas = albas.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.neighborhoodName.toLowerCase().includes(q) ||
        item.payLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const appliedAlbas = albas.filter((item) => item.hasApplied);
  const localName = activeNeighborhood;

  return (
    <section className={styles.albaScreen}>
      <header className={styles.albaHeader}>
        <button type="button" onClick={onBack} aria-label="닫기" className={styles.iconButton}>
          <X size={26} />
        </button>
        <h1>당근알바</h1>
        <div className={styles.albaHeaderActions}>
          <button type="button" onClick={() => setCurrentTab("search")} className={styles.iconButton} aria-label="알바 검색">
            <Search size={24} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="메뉴">
            <Menu size={26} />
          </button>
        </div>
      </header>

      {currentTab === "home" && (
        <>
          <section className={styles.albaTopSection}>
            <button
              type="button"
              className={styles.albaPopularCard}
              onClick={() => setSelectedCategory(null)}
            >
              <span className={styles.albaPopularCardCopy}>
                <span>우리동네</span>
                <strong>
                  지금 많이 보는 공고
                  <ChevronRight size={16} />
                </strong>
                <span className={styles.albaPopularDescription}>{localName} 근처에서 빠르게 지원할 수 있는 알바를 모았어요.</span>
                <span className={styles.albaPopularStats}>
                  <span>{albas.length}개 공고</span>
                  <span>후기 기반 추천</span>
                </span>
              </span>
              <span className={styles.albaPopularMapVisual} aria-hidden="true">
                <BriefcaseBusiness size={22} />
                <MapPin size={18} className={styles.albaPopularPinIcon} />
              </span>
            </button>

            <div className={styles.albaCategoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                const CategoryIcon = cat.icon;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={`${styles.albaCategoryBtn} ${isSelected ? styles.albaCategoryBtnActive : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.label)}
                  >
                    <span className={styles.albaCategoryIconCircle}>
                      <CategoryIcon size={20} strokeWidth={2.1} />
                    </span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.albaFeedSection}>
            <div className={styles.albaFeedHeading}>
              <h2>
                {selectedCategory ? selectedCategory : `${localName} 인기 알바`}
              </h2>
              <small>{filteredAlbas.length}개 공고</small>
            </div>

            {filteredAlbas.length === 0 ? (
              <StateBlock
                title="해당하는 알바가 없어요"
                body="다른 카테고리를 선택하거나 검색어를 변경해보세요."
                actionLabel="전체 보기"
                onAction={() => { setSelectedCategory(null); setSearchQuery(""); }}
              />
            ) : (
              <div className={styles.albaGrid}>
                {filteredAlbas.map((alba) => (
                  <AlbaCardComponent
                    key={alba.id}
                    alba={alba}
                    onSelect={() => onSelectAlba(alba.id)}
                    onToggleFavorite={() => onToggleFavorite(alba.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {currentTab === "search" && (
        <section className={styles.albaFeedSection}>
          <div className={`${styles.mapSearch} ${styles.albaSearchField}`}>
            <Search size={20} />
            <input
              type="text"
              placeholder="직종, 업체명, 동네 등으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="검색어 지우기">
                <X size={16} />
              </button>
            )}
          </div>
          <div className={styles.albaGrid}>
            {filteredAlbas.map((alba) => (
              <AlbaCardComponent
                key={alba.id}
                alba={alba}
                onSelect={() => onSelectAlba(alba.id)}
                onToggleFavorite={() => onToggleFavorite(alba.id)}
              />
            ))}
          </div>
        </section>
      )}

      {currentTab === "applications" && (
        <section className={styles.albaFeedSection}>
          <div className={styles.albaFeedHeading}>
            <h2>내가 지원한 알바 ({appliedAlbas.length})</h2>
          </div>
          {appliedAlbas.length === 0 ? (
            <StateBlock
              title="아직 지원한 알바가 없어요"
              body="마음에 드는 동네 알바를 찾아서 지원해보세요."
              actionLabel="알바 둘러보기"
              onAction={() => setCurrentTab("home")}
            />
          ) : (
            <div className={styles.albaGrid}>
              {appliedAlbas.map((alba) => (
                <AlbaCardComponent
                  key={alba.id}
                  alba={alba}
                  onSelect={() => onSelectAlba(alba.id)}
                  onToggleFavorite={() => onToggleFavorite(alba.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {currentTab === "manage" && (
        <section className={styles.albaFeedSection}>
          <div className={styles.albaFeedHeading}>
            <h2>구인글 관리</h2>
            <button
              type="button"
              className={styles.albaManageWriteBtn}
              onClick={onWrite}
            >
              <Plus size={16} />
              새 공고 작성
            </button>
          </div>
          <div className={styles.albaGrid}>
            {albas.slice(0, 2).map((alba) => (
              <AlbaCardComponent
                key={alba.id}
                alba={alba}
                onSelect={() => onSelectAlba(alba.id)}
                onToggleFavorite={() => onToggleFavorite(alba.id)}
              />
            ))}
          </div>
        </section>
      )}

      <button type="button" className={styles.albaFloatingWrite} onClick={onWrite} aria-label="알바 공고 작성">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <nav className={styles.albaBottomNav} aria-label="알바 메뉴">
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "home" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("home")}
        >
          <Home size={22} />
          <span>알바 홈</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "search" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("search")}
        >
          <Search size={22} />
          <span>알바 검색</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "applications" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("applications")}
        >
          <BriefcaseBusiness size={22} />
          <span>지원 내역</span>
        </button>
        <button
          type="button"
          className={`${styles.albaNavBtn} ${currentTab === "manage" ? styles.albaNavBtnActive : ""}`}
          onClick={() => setCurrentTab("manage")}
        >
          <FileText size={22} />
          <span>구인글 관리</span>
        </button>
      </nav>
    </section>
  );
}
