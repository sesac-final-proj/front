"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem } from "../../types";
import { getPriceHint, type PriceHint } from "@/services/tradeService";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";
import { TradePlacePickerScreen } from "./TradePlacePickerScreen";

export function ProductFormScreen({
  onBack,
  onSubmit,
  initialProduct,
  initialCenter,
}: {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, imageFile: File | null) => void;
  initialProduct?: ProductListItem;
  initialCenter?: { lat: number; lng: number };
}) {
  const isEdit = Boolean(initialProduct);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialProduct?.thumbnailUrl ?? null);
  const imageFileRef = useRef<File | null>(null);
  const [tradePlace, setTradePlace] = useState<{ name: string; lat?: number; lng?: number } | undefined>(
    initialProduct?.tradePlace
      ? { name: initialProduct.tradePlace, lat: initialProduct.tradePlaceLat, lng: initialProduct.tradePlaceLng }
      : undefined,
  );
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "중고거래");
  const [priceHint, setPriceHint] = useState<PriceHint | null>(null);

  // 제목(+카테고리) 입력에 맞는 시세 힌트를 실시간으로 불러온다 — 타이핑마다
  // 호출하면 낭비니 400ms 디바운스, 이전 요청은 중단(AbortController).
  useEffect(() => {
    if (title.trim().length < 2) {
      setPriceHint(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getPriceHint(title, category, controller.signal)
        .then(setPriceHint)
        .catch(() => {
          // ponytail: 힌트는 부가기능이라 실패해도 화면엔 영향 없음, 조용히 무시.
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [title, category]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    imageFileRef.current = file;
    setPreviewUrl((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (initialProduct?.thumbnailUrl ?? null);
    });
  }

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title={isEdit ? "중고거래 글 수정" : "중고거래 글쓰기"}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form className={styles.formStack} onSubmit={(event) => onSubmit(event, imageFileRef.current)}>
        <label className={styles.photoUploader}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 미리보기(blob:) 또는 NCP 원본 URL
            <img src={previewUrl} alt="상품 사진 미리보기" className={styles.photoPreview} />
          ) : (
            <>
              <Plus size={28} />
              <span>사진 추가</span>
              <small>1장</small>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} hidden />
        </label>
        <label>
          제목
          <input
            name="title"
            maxLength={40}
            placeholder="물건 이름을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label>
          카테고리
          <select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>중고거래</option>
            <option>중고차</option>
            <option>알바</option>
            <option>기타 서비스</option>
          </select>
        </label>
        <label>
          가격
          <input
            name="price"
            type="number"
            min={0}
            max={999999999}
            defaultValue={initialProduct?.price ?? 30000}
          />
        </label>
        {priceHint?.status === "ok" && (
          <p className={styles.priceHintBanner}>
            <span className={styles.priceHintLabel}>AI 추천 실거래가 가격범위</span>:{" "}
            {priceHint.priceMin?.toLocaleString()}원 ~ {priceHint.priceMax?.toLocaleString()}원
          </p>
        )}
        <label className={styles.checkRow}>
          <input name="free" type="checkbox" defaultChecked={initialProduct?.tradeType === "FREE"} />
          나눔으로 등록
        </label>
        <label>
          설명
          <textarea
            name="description"
            maxLength={2000}
            placeholder="상태, 거래 희망 장소, 가격 제안 가능 여부를 적어주세요."
            defaultValue={initialProduct?.description}
            required
          />
        </label>
        <input type="hidden" name="tradePlace" value={tradePlace?.name ?? ""} />
        <input type="hidden" name="tradePlaceLat" value={tradePlace?.lat ?? ""} />
        <input type="hidden" name="tradePlaceLng" value={tradePlace?.lng ?? ""} />
        <span className={styles.formSectionLabel}>거래 설정</span>
        <button
          type="button"
          className={styles.tradePlaceRow}
          onClick={() => setShowPlacePicker(true)}
        >
          <span>거래 희망 장소</span>
          <span className={styles.tradePlaceRowValue}>
            {tradePlace?.name || "위치 추가"}
            <ChevronRight size={20} />
          </span>
        </button>
        <button type="submit" className={styles.primaryButton}>
          {isEdit ? "수정하기" : "등록하기"}
        </button>
      </form>
      {showPlacePicker && (
        <TradePlacePickerScreen
          initialLat={tradePlace?.lat ?? initialCenter?.lat}
          initialLng={tradePlace?.lng ?? initialCenter?.lng}
          onCancel={() => setShowPlacePicker(false)}
          onConfirm={(place) => {
            setTradePlace(place);
            setShowPlacePicker(false);
          }}
        />
      )}
    </section>
  );
}
