"use client";

import React, { useState } from "react";
import { Heart, X, Navigation, ExternalLink } from "lucide-react";
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

  // 카카오맵 길찾기 & 카카오맵 플레이스 직접 연동 URL
  const kakaoNaviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`;
  const kakaoPlaceUrl =
    restaurant.placeUrl ||
    (restaurant.id && !restaurant.id.startsWith("restaurant-")
      ? `https://place.map.kakao.com/${restaurant.id}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(restaurant.name)}`);

  const images =
    restaurant.images && restaurant.images.length > 0
      ? restaurant.images
      : [restaurant.imageUrl || restaurant.thumbnailUrl || ""].filter(Boolean);

  const rating = restaurant.rating ? restaurant.rating.toFixed(1) : "4.2";
  const reviewCount = restaurant.reviewCount || 19;
  const regularCount = restaurant.regularCount || 2;
  const distance = restaurant.distance || "88m";
  const addressParts = (restaurant.roadAddress || restaurant.address || "").split(" ");
  const neighborhoodName = addressParts[1] || addressParts[0] || "문래동6가";

  return (
    <div className={styles.restaurantDetailSheet}>
      {/* 1. 상단 타이틀 & 닫기/찜 (사진 3번) */}
      <div className={styles.restaurantDetailHeader}>
        <div className={styles.restaurantDetailTitleBox}>
          <a
            href={kakaoPlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.restaurantDetailTitleLink}
            title="카카오맵에서 상세 보기"
          >
            <h2 className={styles.restaurantDetailTitle}>{restaurant.name}</h2>
            <ExternalLink size={15} className={styles.restaurantDetailTitleIcon} />
          </a>
          <span className={styles.restaurantDetailCategory}>{restaurant.category || "돼지고기"}</span>
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

      {/* 3. 거리 및 카카오맵 길찾기 버튼 (사진 3번) */}
      <div className={styles.restaurantDetailLocationRow}>
        <span className={styles.restaurantDetailDistance}>
          {distance} · {neighborhoodName} ⌵
        </span>
        <a
          href={kakaoNaviUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.restaurantDetailNaviBtn}
          title="카카오맵 길찾기로 이동"
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

      {/* 5. 단골 혜택 Box (사용자 업로드 이미지 모작) */}
      <div className={styles.restaurantDetailBenefitBox}>
        <span className={styles.restaurantDetailBenefitLabel}>단골 혜택</span>
        <span className={styles.restaurantDetailBenefitText}>
          {restaurant.benefit || "얼음생맥주 서비스쿠폰 (리뷰이벤트)"}
        </span>
      </div>

      {/* 6. 상세 탭 (사용자 업로드 이미지 모작: 홈, 소식, 후기 19, 가격, 사진) */}
      <div className={styles.restaurantDetailTabs}>
        <button
          type="button"
          className={`${styles.restaurantDetailTabBtn} ${activeTab === "홈" ? styles.restaurantDetailTabActive : ""}`}
          onClick={() => setActiveTab("홈")}
        >
          홈
        </button>
        <button
          type="button"
          className={`${styles.restaurantDetailTabBtn} ${activeTab === "소식" ? styles.restaurantDetailTabActive : ""}`}
          onClick={() => setActiveTab("소식")}
        >
          소식
        </button>
        <button
          type="button"
          className={`${styles.restaurantDetailTabBtn} ${activeTab === "후기" ? styles.restaurantDetailTabActive : ""}`}
          onClick={() => setActiveTab("후기")}
        >
          후기 <span className={styles.restaurantDetailBadgeNum}>{reviewCount}</span>
        </button>
        <button
          type="button"
          className={`${styles.restaurantDetailTabBtn} ${activeTab === "가격" ? styles.restaurantDetailTabActive : ""}`}
          onClick={() => setActiveTab("가격")}
        >
          가격
        </button>
        <button
          type="button"
          className={`${styles.restaurantDetailTabBtn} ${activeTab === "사진" ? styles.restaurantDetailTabActive : ""}`}
          onClick={() => setActiveTab("사진")}
        >
          사진
        </button>
      </div>
    </div>
  );
}
