"use client";

import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  CreateTogetherPostInput,
  TOGETHER_CATEGORIES,
  TogetherCategory,
} from "@/types/together";
import styles from "../../GajiMarketApp.module.css";

interface TogetherFormViewProps {
  initialCategory?: TogetherCategory;
  userNeighborhood?: string;
  onBack: () => void;
  onSubmit: (data: CreateTogetherPostInput) => void;
}

export function TogetherFormView({
  initialCategory = "group_buy",
  userNeighborhood = "개봉동",
  onBack,
  onSubmit,
}: TogetherFormViewProps) {
  const [category, setCategory] = useState<TogetherCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [deadline, setDeadline] = useState("2026-09-09");
  const [regionName, setRegionName] = useState(userNeighborhood);
  const [allowChat, setAllowChat] = useState(true);

  // Group buy specific fields
  const [productName, setProductName] = useState("");
  const [targetPrice, setTargetPrice] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    onSubmit({
      category,
      title: title.trim(),
      content: content.trim(),
      regionName: regionName.trim() || "개봉동",
      maxParticipants,
      deadline,
      productName: category === "group_buy" ? productName.trim() : undefined,
      targetPrice: category === "group_buy" && targetPrice ? Number(targetPrice) : undefined,
      allowChat,
    });
  };

  return (
    <section className={styles.screen}>
      {/* ScreenHeader */}
      <header className={styles.screenHeader}>
        <button
          type="button"
          onClick={onBack}
          className={styles.iconButton}
          aria-label="뒤로"
        >
          <ChevronLeft size={27} />
        </button>
        <h1>같이해요 글쓰기</h1>
        <div style={{ width: 27 }} />
      </header>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className={styles.formStack} style={{ padding: "16px 0 40px" }}>
        {/* Category */}
        <label>
          주제
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TogetherCategory)}
          >
            {Object.values(TOGETHER_CATEGORIES).map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label} ({cat.description})
              </option>
            ))}
          </select>
        </label>

        {/* Title */}
        <label>
          제목
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이웃과 함께할 모임의 제목을 적어주세요"
            maxLength={100}
            required
          />
        </label>

        {/* Conditional Group Buy Fields */}
        {category === "group_buy" && (
          <div className={styles.togetherBox} style={{ margin: 0 }}>
            <strong>🛒 공동구매 추가 정보</strong>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              상품/구매명
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="예: 이케아 수납장 배송비, 코스트코 베이글"
              />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              1인당 예상 금액 (원)
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="예: 12250 (선택)"
              />
            </label>
          </div>
        )}

        {/* Content */}
        <label>
          내용
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="자세한 모임 일정, 장소, 준비물 등을 자유롭게 적어주세요."
            rows={6}
            required
          />
        </label>

        {/* Participant Count */}
        <label>
          모집 인원 (나 포함)
          <input
            type="number"
            min={2}
            max={20}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            required
          />
        </label>

        {/* Deadline */}
        <label>
          모집 마감일
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </label>

        {/* Region */}
        <label>
          활동 지역
          <input
            type="text"
            value={regionName}
            onChange={(e) => setRegionName(e.target.value)}
            placeholder="예: 개봉동, 오류동"
            required
          />
        </label>

        {/* Chat Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <div>
            <strong style={{ fontSize: 15, display: "block" }}>1:1 채팅 허용</strong>
            <span style={{ fontSize: 13, color: "var(--color-muted)" }}>참여 전 이웃의 문의를 채팅으로 받습니다.</span>
          </div>
          <input
            type="checkbox"
            checked={allowChat}
            onChange={(e) => setAllowChat(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "var(--color-primary)" }}
          />
        </div>

        {/* Submit */}
        <button type="submit" className={styles.primaryButton} style={{ marginTop: 12 }}>
          작성 완료
        </button>
      </form>
    </section>
  );
}

