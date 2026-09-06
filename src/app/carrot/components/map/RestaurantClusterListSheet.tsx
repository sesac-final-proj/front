"use client";

import React from "react";
import { X, ChevronRight, Utensils } from "lucide-react";
import type { Restaurant } from "@/types";
import styles from "../../GajiMarketApp.module.css";

export interface RestaurantClusterListSheetProps {
  restaurants: Restaurant[];
  theme: "dark" | "light";
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export function RestaurantClusterListSheet({
  restaurants, theme, onSelectRestaurant, onClose,
}: RestaurantClusterListSheetProps) {
  return (
    <section className={styles.restaurantClusterSheet} data-theme={theme} aria-label="선택한 위치의 음식점">
      <header className={styles.restaurantClusterHeader}>
        <span className={styles.restaurantClusterCount}>{restaurants.length}</span>
        <div>
          <h3>이 위치의 가게 {restaurants.length}곳</h3>
          <p>가게를 선택하면 상세 정보를 볼 수 있어요.</p>
        </div>
        <button type="button" className={styles.restaurantClusterClose} aria-label="음식점 목록 닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <ul className={styles.restaurantClusterList}>
        {restaurants.map((restaurant) => {
          const thumbnail = restaurant.imageUrl || restaurant.thumbnailUrl;
          const meta = [restaurant.category || "음식점", restaurant.distance].filter(Boolean);
          if (restaurant.rating != null) meta.push(`평점 ${restaurant.rating.toFixed(1)}`);
          if (restaurant.reviewCount != null) meta.push(`후기 ${restaurant.reviewCount}`);
          return (
            <li key={restaurant.id}>
              <button type="button" className={styles.restaurantClusterRow} onClick={() => onSelectRestaurant(restaurant)}>
                <span className={styles.restaurantClusterThumbnail}>
                  {thumbnail ? <img src={thumbnail} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : <Utensils size={20} />}
                </span>
                <span className={styles.restaurantClusterCopy}>
                  <strong>{restaurant.name}</strong>
                  <small>{meta.join(" · ")}</small>
                  {restaurant.benefit && <span className={styles.restaurantClusterBenefit}>혜택 제공</span>}
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
