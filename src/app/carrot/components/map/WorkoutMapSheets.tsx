"use client";

import { ChevronRight, ExternalLink, MapPin, Navigation, Phone, X } from "lucide-react";
import type { WorkoutFacility } from "@/services/workoutService";
import styles from "./WorkoutFacilitySection.module.css";

export function WorkoutClusterListSheet({
  facilities,
  onSelect,
  onClose,
}: {
  facilities: WorkoutFacility[];
  onSelect: (facility: WorkoutFacility) => void;
  onClose: () => void;
}) {
  return (
    <section className={styles.mapSheet} aria-label={`운동시설 ${facilities.length}곳`}>
      <header className={styles.mapSheetHeader}>
        <div>
          <small>선택한 위치</small>
          <h2>운동시설 {facilities.length}곳</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="운동시설 목록 닫기"><X size={19} /></button>
      </header>
      <div className={styles.clusterList}>
        {facilities.map((facility) => (
          <button key={facility.id} type="button" className={styles.clusterItem} onClick={() => onSelect(facility)}>
            <span className={styles.clusterDot} />
            <span>
              <strong>{facility.name}</strong>
              <small>{facility.category} · {facility.roadAddress || facility.address}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function WorkoutDetailSheet({
  facility,
  onClose,
}: {
  facility: WorkoutFacility;
  onClose: () => void;
}) {
  return (
    <section className={styles.mapSheet} aria-label={`${facility.name} 상세`}>
      <header className={styles.mapSheetHeader}>
        <div>
          <small>{facility.category}</small>
          <h2>{facility.name}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="운동시설 상세 닫기"><X size={19} /></button>
      </header>
      <p className={styles.detailAddress}><MapPin size={16} />{facility.roadAddress || facility.address}</p>
      <div className={styles.detailMeta}>
        {facility.monthlyPrice && <strong>{facility.monthlyPrice}</strong>}
        {facility.distance && <span>현재 위치에서 {facility.distance}</span>}
        {facility.rating && <span>평점 {facility.rating} · 후기 {facility.reviewCount ?? 0}</span>}
      </div>
      {facility.tags?.length ? (
        <div className={styles.detailTags}>{facility.tags.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>
      ) : null}
      <div className={styles.mapSheetActions}>
        <a href={`https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${facility.lat},${facility.lng}`} target="_blank" rel="noreferrer">
          <Navigation size={16} /> 길찾기
        </a>
        {facility.phone && <a href={`tel:${facility.phone}`}><Phone size={16} /> 전화</a>}
        {facility.placeUrl && <a href={facility.placeUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 상세정보</a>}
      </div>
    </section>
  );
}
