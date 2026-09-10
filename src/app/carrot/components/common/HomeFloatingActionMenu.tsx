"use client";

import React, { useEffect } from "react";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./HomeFloatingActionMenu.module.css";

/* --- Pixel-perfect Custom SVG Icons matching Daangn UI --- */

// 1. 알바/과외/레슨 (주황 돋보기 + 사람)
function AlbaIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ff6f0f"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7" />
      <line x1="21" y1="21" x2="15.2" y2="15.2" />
      <circle cx="10" cy="8" r="2" fill="#ff6f0f" />
      <path d="M6.8 13.2c.4-1.4 1.7-2.2 3.2-2.2s2.8.8 3.2 2.2" />
    </svg>
  );
}

// 2. 부동산 (마젠타/핑크 집)
function RealEstateIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
        fill="#e8348a"
      />
      <rect x="9.5" y="13.5" width="5" height="8" rx="0.8" fill="#ffffff" />
      <rect x="10" y="7.5" width="4" height="3" rx="0.5" fill="#ffffff" />
    </svg>
  );
}

// 3. 동네생활 (시안/하늘색 문서 메모)
function CommunityIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="4" y="3" width="16" height="18" rx="4.5" fill="#00a8ff" />
      <line x1="8" y1="8" x2="16" y2="8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="8" y1="16" x2="12.5" y2="16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// 4. 모임 (주황 확성기/응원 아이콘)
function GroupIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 11v2a2 2 0 0 0 2 2h2l4 4V5L7 9H5a2 2 0 0 0-2 2z"
        fill="#ff7a00"
      />
      <path
        d="M15 8.5a4.5 4.5 0 0 1 0 7"
        stroke="#ff7a00"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 5.5a8 8 0 0 1 0 13"
        stroke="#ff7a00"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 5. 스토리 (로즈핑크 원형 재생 버튼)
function StoryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" fill="#f43f5e" />
      <polygon points="10,8 16.5,12 10,16" fill="#ffffff" />
    </svg>
  );
}

// 6. 여러 물건 팔기 (주황 쇼핑백 + 반짝이 별)
function SellMultipleItemsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 3.5L3.5 7.5V20a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V7.5L18 3.5H6z"
        fill="#ff6f0f"
      />
      <path
        d="M15.5 10.5a3.5 3.5 0 0 1-7 0"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* 반짝이 스파클 */}
      <path
        d="M5 2.5L5.7 4 7.2 4.7 5.7 5.4 5 7 4.3 5.4 2.8 4.7 4.3 4z"
        fill="#ffb703"
      />
    </svg>
  );
}

// 7. 내 물건 팔기 (주황 쇼핑백)
function SellItemIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 3.5L3.5 7.5V20a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V7.5L18 3.5H6z"
        fill="#ff6f0f"
      />
      <path
        d="M15.5 10.5a3.5 3.5 0 0 1-7 0"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export interface HomeFloatingActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSellMyProduct: () => void;
  onSellMultipleProducts: () => void;
  onOpenAlba: () => void;
  onOpenRealEstate: () => void;
  onOpenCommunity: () => void;
  onOpenTogether: () => void;
  onOpenStory: () => void;
}

export function HomeFloatingActionMenu({
  isOpen,
  onToggle,
  onClose,
  onSellMyProduct,
  onSellMultipleProducts,
  onOpenAlba,
  onOpenRealEstate,
  onOpenCommunity,
  onOpenTogether,
  onOpenStory,
}: HomeFloatingActionMenuProps) {
  // 스크롤 시 팝업 닫힘 처리 (자연스러운 탐색 지원)
  useEffect(() => {
    if (!isOpen) return;

    const scrollContainer = document.querySelector<HTMLElement>("[data-app-scroll]");
    if (!scrollContainer) return;

    const handleScroll = () => {
      onClose();
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 딤 배경 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="home-action-backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            onTouchStart={onClose}
          />
        )}
      </AnimatePresence>

      <div className={styles.menuContainer}>
        {/* 상단 팝업 카드 2개 (상단 카드 + 하단 카드) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="cards-wrapper"
              className={styles.cardsWrapper}
              initial={{ opacity: 0, y: 20, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9, transition: { duration: 0.16 } }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 28,
              }}
            >
              {/* 1. 상단 카드 (알바/과외/레슨, 부동산, 동네생활, 모임, 스토리 - 중고차 제외) */}
              <motion.div
                className={styles.menuCard}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.03 }}
              >
                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenAlba}
                >
                  <span className={styles.iconWrapper}>
                    <AlbaIcon />
                  </span>
                  <span>알바/과외/레슨</span>
                </motion.button>

                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenRealEstate}
                >
                  <span className={styles.iconWrapper}>
                    <RealEstateIcon />
                  </span>
                  <span>부동산</span>
                </motion.button>

                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenCommunity}
                >
                  <span className={styles.iconWrapper}>
                    <CommunityIcon />
                  </span>
                  <span>동네생활</span>
                </motion.button>

                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenTogether}
                >
                  <span className={styles.iconWrapper}>
                    <GroupIcon />
                  </span>
                  <span>모임</span>
                </motion.button>

                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenStory}
                >
                  <span className={styles.iconWrapper}>
                    <StoryIcon />
                  </span>
                  <span>스토리</span>
                </motion.button>
              </motion.div>

              {/* 2. 하단 카드 (여러 물건 팔기, 내 물건 팔기) */}
              <motion.div
                className={styles.menuCard}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSellMultipleProducts}
                >
                  <span className={styles.iconWrapper}>
                    <SellMultipleItemsIcon />
                  </span>
                  <span>여러 물건 팔기</span>
                </motion.button>

                <motion.button
                  type="button"
                  className={styles.menuItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSellMyProduct}
                >
                  <span className={styles.iconWrapper}>
                    <SellItemIcon />
                  </span>
                  <span>내 물건 팔기</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 플로팅 버튼 (+ 또는 X) */}
        <motion.button
          type="button"
          className={`${styles.fabButton} ${isOpen ? styles.fabButtonOpen : ""}`}
          onClick={onToggle}
          aria-label={isOpen ? "메뉴 닫기" : "글쓰기 및 서비스 메뉴 열기"}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 26 }}
        >
          {isOpen ? (
            <X size={26} strokeWidth={2.4} />
          ) : (
            <Plus size={28} strokeWidth={2.4} />
          )}
        </motion.button>
      </div>
    </>
  );
}
