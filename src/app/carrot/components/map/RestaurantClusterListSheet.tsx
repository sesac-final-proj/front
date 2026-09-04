"use client";

import React from "react";
import { X, ChevronRight, Star, MapPin, Sparkles } from "lucide-react";
import type { Restaurant } from "@/types";
import styles from "../../GajiMarketApp.module.css";

export interface RestaurantClusterListSheetProps {
  restaurants: Restaurant[];
  theme: "dark" | "light";
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export function RestaurantClusterListSheet({
  restaurants,
  theme,
  onSelectRestaurant,
  onClose,
}: RestaurantClusterListSheetProps) {
  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "4px 2px 24px",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      {/* 1. 클러스터 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#FF6F0F",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "800",
              boxShadow: "0 2px 6px rgba(255, 111, 15, 0.35)",
            }}
          >
            {restaurants.length}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: "800",
                color: isDark ? "#FFFFFF" : "#191F28",
                letterSpacing: "-0.4px",
              }}
            >
              이 위치의 가게 {restaurants.length}곳
            </h3>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: isDark ? "#94A3B8" : "#8B95A1",
              }}
            >
              80% 이상 겹쳐진 가게들이에요. 원하는 가게를 눌러보세요.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            background: isDark ? "rgba(255, 255, 255, 0.08)" : "#F2F4F6",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isDark ? "#FFFFFF" : "#4E5968",
            transition: "all 0.15s ease",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. 클러스터 식당 리스트 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {restaurants.map((restaurant, idx) => {
          const rating = restaurant.rating ? restaurant.rating.toFixed(1) : "4.3";
          const reviewCount = restaurant.reviewCount || 15 + idx * 4;
          const thumbUrl = restaurant.imageUrl || restaurant.thumbnailUrl;
          const category = restaurant.category || "음식점";
          const distance = restaurant.distance || "근처";

          return (
            <div
              key={restaurant.id || idx}
              onClick={() => onSelectRestaurant(restaurant)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "14px",
                background: isDark ? "rgba(255, 255, 255, 0.04)" : "#F9FAFB",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #ECEFEF",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.borderColor = "#FF6F0F";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 4px 12px rgba(255, 111, 15, 0.2)"
                  : "0 4px 12px rgba(255, 111, 15, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.06)" : "#ECEFEF";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* 이미지 썸네일 */}
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "10px",
                  background: isDark ? "#2A2B32" : "#FFDEC4",
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  color: "#FF6F0F",
                  fontSize: "14px",
                }}
              >
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={restaurant.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span>🍴</span>
                )}
              </div>

              {/* 텍스트 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: "750",
                      color: isDark ? "#FFFFFF" : "#191F28",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {restaurant.name}
                  </h4>
                  {restaurant.benefit && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#FF6F0F",
                        background: isDark ? "rgba(255, 111, 15, 0.15)" : "#FFF0E6",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={10} /> 혜택
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "3px",
                    fontSize: "12px",
                    color: isDark ? "#94A3B8" : "#6B7684",
                  }}
                >
                  <span>{category}</span>
                  <span>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#F59E0B", fontWeight: "700" }}>
                    <Star size={11} fill="#F59E0B" /> {rating}
                  </span>
                  <span>({reviewCount})</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "2px",
                    fontSize: "11px",
                    color: isDark ? "#64748B" : "#8B95A1",
                  }}
                >
                  <MapPin size={11} />
                  <span>{distance}</span>
                  {restaurant.roadAddress && (
                    <>
                      <span>·</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {restaurant.roadAddress}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 화살표 아이콘 */}
              <div
                style={{
                  color: isDark ? "#64748B" : "#B0B8C1",
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
