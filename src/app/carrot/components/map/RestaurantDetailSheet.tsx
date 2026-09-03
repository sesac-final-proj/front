"use client";

import React, { useState } from "react";
import { Heart, X, Navigation } from "lucide-react";
import type { Restaurant } from "@/services/restaurantService";
import styles from "../../GajiMarketApp.module.css";

export interface RestaurantDetailSheetProps {
  restaurant: Restaurant;
  theme: "dark" | "light";
  onClose: () => void;
}

export function RestaurantDetailSheet({
  restaurant,
  theme,
  onClose,
}: RestaurantDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("홈");
  const [isLiked, setIsLiked] = useState(false);

  const detailUrl =
    restaurant.placeUrl ||
    restaurant.naverUrl ||
    `https://map.kakao.com/link/search/${encodeURIComponent(restaurant.name)}`;

  const images =
    restaurant.images && restaurant.images.length > 0
      ? restaurant.images
      : [restaurant.imageUrl || restaurant.thumbnailUrl || ""].filter(Boolean);

  const rating = restaurant.rating ? restaurant.rating.toFixed(1) : "4.2";
  const reviewCount = restaurant.reviewCount || 17;
  const regularCount = restaurant.regularCount || 2;
  const distance = restaurant.distance || "88m";
  const addressParts = (restaurant.roadAddress || restaurant.address || "").split(" ");
  const neighborhoodName = addressParts[1] || addressParts[0] || "동네";

  return (
    <div className={styles.restaurantDetailSheet}>
      {/* 1. 상단 타이틀 & 닫기/찜 (사진 3번) */}
      <div className={styles.restaurantDetailHeader}>
        <div className={styles.restaurantDetailTitleBox}>
          <h2 className={styles.restaurantDetailTitle}>{restaurant.name}</h2>
          <span className={styles.restaurantDetailCategory}>{restaurant.category || "음식점"}</span>
        </div>
        <div className={styles.restaurantDetailActions}>
          <button
            type="button"
            aria-label="관심 등록"
            className={styles.restaurantDetailHeartBtn}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart size={22} fill={isLiked ? "#ff4d4f" : "none"} color={isLiked ? "#ff4d4f" : "currentColor"} />
          </button>
          <button
            type="button"
            aria-label="식당 상세 닫기"
            className={styles.restaurantDetailCloseBtn}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 2. 별점, 후기, 단골, 지역화폐 (사진 3번) */}
      <div className={styles.restaurantDetailRatingRow}>
        <span className={styles.restaurantDetailStar}>★</span>
        <strong className={styles.restaurantDetailRatingNum}>{rating}</strong>
        <span className={styles.restaurantDetailDot}>·</span>
        <span className={styles.restaurantDetailSubText}>후기 {reviewCount}</span>
        <span className={styles.restaurantDetailDot}>·</span>
        <span className={styles.restaurantDetailSubText}>단골 {regularCount}</span>
        <span className={styles.restaurantDetailTagBadge}>지역화폐</span>
      </div>

      {/* 3. 거리 및 길찾기 버튼 (사진 3번) */}
      <div className={styles.restaurantDetailLocationRow}>
        <span className={styles.restaurantDetailDistance}>
          {distance} · {neighborhoodName} ⌵
        </span>
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.restaurantDetailNaviBtn}
        >
          <Navigation size={13} />
          <span>길찾기</span>
        </a>
      </div>

      {/* 4. 카카오 이미지 API 실물 사진 4~5장 가로 스크롤 갤러리 (사진 3번) */}
      {images.length > 0 && (
        <div className={styles.restaurantDetailGallery}>
          {images.map((imgSrc, idx) => (
            <div key={idx} className={styles.restaurantDetailPhotoCard}>
              <img
                src={imgSrc}
                alt={`${restaurant.name} 사진 ${idx + 1}`}
                className={styles.restaurantDetailPhotoImg}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 5. 단골 혜택 Box (사진 3번) */}
      <div className={styles.restaurantDetailBenefitBox}>
        <span className={styles.restaurantDetailBenefitLabel}>단골 혜택</span>
        <span className={styles.restaurantDetailBenefitText}>
          {restaurant.benefit || "얼음생맥주 서비스쿠폰 (리뷰이벤트)"}
        </span>
      </div>

      {/* 6. 상세 탭 (사진 3번: 홈, 소식, 후기, 가격, 사진) */}
      <div className={styles.restaurantDetailTabs}>
        {["홈", "소식", `후기 ${reviewCount}`, "가격", "사진"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              className={`${styles.restaurantDetailTabBtn} ${isActive ? styles.restaurantDetailTabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
