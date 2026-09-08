"use client";

import React, { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem } from "../../types";
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
  const [tradePlace, setTradePlace] = useState<string | undefined>(initialProduct?.tradePlace);
  const [showPlacePicker, setShowPlacePicker] = useState(false);

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
          <input name="title" maxLength={40} placeholder="물건 이름을 입력하세요" defaultValue={initialProduct?.title} required />
        </label>
        <label>
          카테고리
          <select name="category" defaultValue={initialProduct?.category ?? "중고거래"}>
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
        <input type="hidden" name="tradePlace" value={tradePlace ?? ""} />
        <span className={styles.formSectionLabel}>거래 설정</span>
        <button
          type="button"
          className={styles.tradePlaceRow}
          onClick={() => setShowPlacePicker(true)}
        >
          <span>거래 희망 장소</span>
          <span className={styles.tradePlaceRowValue}>
            {tradePlace || "위치 추가"}
            <ChevronRight size={20} />
          </span>
        </button>
        {!isEdit && (
          <button
            type="button"
            className={styles.marketAnalysisButton}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form) return;
              const values = new FormData(form);
              const title = String(values.get("title") ?? "").trim();
              const price = String(values.get("price") ?? "").trim();
              const params = new URLSearchParams({ title, price });
              window.open(`/analysis?${params.toString()}`, "_blank", "noopener,noreferrer");
            }}
          >
            외부 시세와 먼저 비교
          </button>
        )}
        <button type="submit" className={styles.primaryButton}>
          {isEdit ? "수정하기" : "등록하기"}
        </button>
      </form>
      {showPlacePicker && (
        <TradePlacePickerScreen
          initialLat={initialCenter?.lat}
          initialLng={initialCenter?.lng}
          onCancel={() => setShowPlacePicker(false)}
          onConfirm={(place) => {
            setTradePlace(place.name);
            setShowPlacePicker(false);
          }}
        />
      )}
    </section>
  );
}
