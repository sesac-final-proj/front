import React, { useState, FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { AlbaItem } from "@/types";
import { ScreenHeader, IconButton } from "../common";

export interface AlbaFormScreenProps {
  activeNeighborhood: string;
  onBack: () => void;
  onSubmit: (data: Omit<AlbaItem, "id" | "applicantCount" | "viewCount" | "isFavorite" | "hasApplied" | "createdAt">) => void;
}

export function AlbaFormScreen({
  activeNeighborhood,
  onBack,
  onSubmit,
}: AlbaFormScreenProps) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [payType, setPayType] = useState<"시급" | "일급" | "월급" | "연봉">("시급");
  const [payAmount, setPayAmount] = useState(12000);
  const [workingDays, setWorkingDays] = useState("월~금");
  const [workingHours, setWorkingHours] = useState("09:00 ~ 18:00");
  const [category, setCategory] = useState<AlbaItem["category"]>("식당/카페");
  const [details, setDetails] = useState("");
  const [detailLocation, setDetailLocation] = useState(`${activeNeighborhood} 인근`);
  const [phoneContact, setPhoneContact] = useState("010-1234-5678");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      alert("공고 제목과 업체명을 입력해주세요.");
      return;
    }

    const payLabel = `${payType} ${payAmount.toLocaleString()}원`;
    onSubmit({
      title,
      companyName,
      neighborhoodName: activeNeighborhood,
      detailLocation,
      payType,
      payAmount,
      payLabel,
      workingDays,
      workingHours,
      category,
      badges: ["모범구인"],
      thumbnailTone: "custom",
      thumbnailEmoji: "💼",
      bgGradient: "linear-gradient(135deg, #ff6f0f 0%, #ffb057 100%)",
      descriptionBullets: ["1. 상세 업무 협의 가능", "2. 친절하고 성실한 분 환영"],
      details: details || "함께 즐겁게 일할 이웃을 모집합니다.",
      phoneContact,
    });
  };

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="알바 구인 공고 등록"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px", padding: "0 4px 30px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>공고 제목</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="예: [올리브영] 주말 매장 스태프 모집"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>업체명</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="예: 휴먼코드 / 무신사 스탠다드"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>급여 형태</label>
            <select
              value={payType}
              onChange={(e) => setPayType(e.target.value as any)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            >
              <option value="시급">시급</option>
              <option value="일급">일급</option>
              <option value="월급">월급</option>
              <option value="연봉">연봉</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>금액 (원)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>근무 요일</label>
            <input
              type="text"
              value={workingDays}
              onChange={(e) => setWorkingDays(e.target.value)}
              placeholder="예: 월~금 / 주말"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>근무 시간</label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="예: 09:00 ~ 18:00"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>상세 설명</label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="근무 조건, 하는 일, 우대 사항 등을 상세히 적어주세요."
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)", background: "var(--color-surface)" }}
          />
        </div>

        <button
          type="submit"
          className={styles.albaDetailApplyBtn}
          style={{ width: "100%", height: "50px", marginTop: "10px" }}
        >
          공고 등록하기
        </button>
      </form>
    </section>
  );
}
