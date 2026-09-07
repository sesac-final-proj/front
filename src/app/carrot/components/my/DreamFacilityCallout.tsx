import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { DonationFacility } from "@/types";

export interface DreamFacilityCalloutProps {
  facility: DonationFacility;
  onClose: () => void;
}

export function DreamFacilityCallout({
  facility,
  onClose,
}: DreamFacilityCalloutProps) {
  const progress = facility.targetAmount > 0 ? Math.round((facility.currentAmount / facility.targetAmount) * 100) : 0;
  return (
    <aside className={styles.dreamFacilityCallout} role="dialog" aria-label={`${facility.name} 상세 정보`}>
      <div className={styles.dreamFacilityCalloutTop}>
        <span className={styles.dreamFacilityCalloutBadge}>
          <Image src="/dream/baby-elephant.png" alt="" width={20} height={16} style={{ objectFit: "contain" }} />
          꿈가지 나눔 시설
        </span>
        <button type="button" onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <strong>{facility.name}</strong>
      <p>{facility.facilityType} · {facility.neighborhoodName}</p>
      <div className={styles.dreamFacilityCalloutStats}>
        <div>
          <span>현재 모금액</span>
          <strong>{facility.currentAmount.toLocaleString()}원</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span>목표액</span>
          <strong>{facility.targetAmount.toLocaleString()}원</strong>
        </div>
      </div>
      <div className={styles.dreamProgressTrack} role="progressbar" aria-valuenow={Math.min(progress, 100)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className={styles.dreamFacilityCalloutFooter}>
        <small>{facility.donationCount}명의 이웃이 함께 참여했어요</small>
        <em>{progress}%</em>
      </div>
    </aside>
  );
}
