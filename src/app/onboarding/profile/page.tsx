"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, RefreshCw } from "lucide-react";
import shellStyles from "../OnboardingScreen.module.css";
import styles from "../OnboardingForm.module.css";
import {
  AuthRequiredError,
  checkNicknameAvailability,
  getMe,
  recommendNickname,
  selectNickname,
  updateProfile,
  type NicknameAvailability,
} from "@/services";

// 백엔드 검증(NICKNAME_*)과 동일한 규칙을 프론트에서 먼저 걸러서, 매 타이핑마다
// 네트워크를 타지 않고도 형식 오류를 바로 보여준다. 최종 판정(중복/금칙어)은
// 항상 서버 응답을 따른다.
function validateFormat(nickname: string): string | null {
  if (!nickname) return "닉네임을 입력해주세요.";
  if (nickname.length > 7) return "닉네임은 7자 이하로 입력해주세요.";
  if (/\s/.test(nickname)) return "공백 없이 입력해주세요.";
  if (!/^[가-힣0-9]+$/.test(nickname)) return "한글과 숫자만 입력해주세요.";
  if (!/[가-힣]/.test(nickname)) return "한글을 포함해주세요.";
  return null;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [recommendClickCount, setRecommendClickCount] = useState(0);
  const [availability, setAvailability] = useState<NicknameAvailability | "checking" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const manualMode = recommendClickCount >= 2;

  // 이미 닉네임을 정한 사람은(뒤로가기로 다시 들어온 경우 등) 바로 홈으로.
  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.nicknameSet) {
          router.replace("/carrot");
          return;
        }
        setPhoneNumber(me.phoneNumber ?? "");
        setReady(true);
        recommendNickname()
          .then(setNickname)
          .catch(() => {
            // 추천 실패해도 직접 입력은 가능하게 그냥 빈 칸으로 둔다.
          });
      })
      .catch((err: unknown) => {
        if (err instanceof AuthRequiredError) {
          router.replace("/onboarding");
          return;
        }
        setReady(true);
      });
  }, [router]);

  // 형식 검사는 렌더 중 바로 계산 — 매 타이핑마다 네트워크 없이 즉시 보여준다.
  const formatError = ready ? validateFormat(nickname) : null;

  // 형식을 통과한 닉네임만: debounce 후 중복 확인 API 호출. 입력값이 바뀔 때마다 이전
  // 결과/로딩 표시를 즉시 리셋해야 함 — React 공식 문서의 debounced-fetch 패턴(setBio(null) 후
  // fetch)과 동일한 동기 setState라 이 두 줄만 룰에서 제외한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!ready || formatError) {
      setAvailability(null);
      return;
    }

    setAvailability("checking");
    debounceRef.current = setTimeout(() => {
      checkNicknameAvailability(nickname)
        .then(setAvailability)
        .catch(() => setAvailability({ available: false, code: "ERROR", message: "중복 확인에 실패했습니다." }));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [nickname, ready, formatError]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleRefreshClick() {
    if (manualMode) return;
    if (recommendClickCount === 0) {
      recommendNickname().then(setNickname);
    }
    setRecommendClickCount((count) => count + 1);
  }

  function handleSave() {
    if (availability === null || availability === "checking" || !availability.available) return;
    if (phoneNumber.length < 10) return;
    setSaveError(null);
    setIsSaving(true);
    updateProfile({ phoneNumber })
      .then(() => selectNickname(nickname))
      .then(() => router.replace("/carrot"))
      .catch((err: unknown) => {
        if (err instanceof AuthRequiredError) {
          router.replace("/onboarding");
          return;
        }
        setSaveError(err instanceof Error ? err.message : "프로필을 저장하지 못했습니다.");
      })
      .finally(() => setIsSaving(false));
  }

  const canSave =
    availability !== null &&
    availability !== "checking" &&
    availability.available &&
    phoneNumber.length >= 10 &&
    !isSaving;

  if (!ready) return null;

  return (
    <div className={shellStyles.stage}>
      <div className={shellStyles.phoneShell}>
        <div className={shellStyles.content}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>프로필 설정</p>
            <h1 className={styles.heading}>프로필을 완성해주세요</h1>
            <p className={styles.subheading}>휴대폰 번호와 닉네임은 나중에 설정에서 바꿀 수 있어요.</p>
          </div>

          {/* ponytail: 프로필 사진 업로드는 아직 백엔드에 파일 업로드 인프라가 없어서
              이번 패스에선 자리만 남겨둔다 — 인프라 붙으면 여기에 실제 업로드 연결. */}
          <div className={styles.avatarPicker}>
            <div className={styles.avatarCircle}>
              <Camera size={28} />
            </div>
            <p className={styles.avatarCaption}>사진 설정은 나중에 추가돼요</p>
          </div>

          <label className={styles.field}>
            휴대폰 번호
            <input
              className={styles.input}
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9]/g, ""))}
              maxLength={11}
              required
            />
          </label>

          <div className={styles.field}>
            닉네임
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={7}
                placeholder="닉네임을 입력해주세요"
                readOnly={!manualMode && recommendClickCount === 0}
              />
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefreshClick}
                disabled={manualMode}
                aria-label="닉네임 다시 추천받기"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            {formatError ? (
              <p className={styles.errorText}>{formatError}</p>
            ) : availability === "checking" ? (
              <p className={styles.helperText}>중복 확인 중...</p>
            ) : availability && !availability.available ? (
              <p className={styles.errorText}>{availability.message}</p>
            ) : availability?.available ? (
              <p className={styles.successText}>{availability.message}</p>
            ) : null}
          </div>

          {saveError && <p className={styles.errorText}>{saveError}</p>}

          <button type="button" className={styles.primaryButton} disabled={!canSave} onClick={handleSave}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
