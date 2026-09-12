"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import jsQR from "jsqr";
import styles from "../../GajiMarketApp.module.css";
import { getStore } from "@/services/walletService";
import { ScreenHeader, IconButton, NumberPad } from "../common";

const MAX_DIGITS = 9;

// 결제 QR은 "<프론트도메인>/carrot?pay=<storeId>" 형태의 URL을 그대로 인코딩한다 —
// 매장에 인쇄해둔 QR을 일반 카메라 앱으로 찍어도 이 페이지가 그대로 열리게 하기 위해서다.
// 우리 인앱 스캐너는 같은 URL을 카메라로 읽어 storeId만 뽑아내 곧장 금액 입력으로 넘어간다.
function parseStoreIdFromQr(text: string): number | null {
  try {
    const storeId = Number(new URL(text).searchParams.get("pay"));
    return Number.isInteger(storeId) && storeId > 0 ? storeId : null;
  } catch {
    return null;
  }
}

type Step =
  | { name: "scan" }
  | { name: "loading-store" }
  | { name: "amount"; storeId: number; storeName: string }
  | { name: "done"; storeName: string; amount: number };

export function WalletPayScreen({
  initialStoreId,
  balance,
  onBack,
  onSubmit,
}: {
  initialStoreId?: number;
  balance: number | null;
  onBack: () => void;
  onSubmit: (storeId: number, amount: number) => Promise<boolean>;
}) {
  const [step, setStep] = useState<Step>(initialStoreId ? { name: "loading-store" } : { name: "scan" });
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QR URL로 바로 진입한 경우 — 카메라 없이 곧장 매장 이름을 조회한다.
  useEffect(() => {
    if (initialStoreId == null) return;
    let cancelled = false;
    getStore(initialStoreId)
      .then((store) => {
        if (!cancelled) setStep({ name: "amount", storeId: store.id, storeName: store.name });
      })
      .catch(() => {
        if (!cancelled) setError("가맹점 정보를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- storeId 진입 시 한 번만
  }, []);

  // 카메라 스캔 — QR을 못 읽으면(개발환경 등) 계속 재시도, 읽으면 매장 이름을 조회해 다음 단계로.
  useEffect(() => {
    if (step.name !== "scan") return;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let stopped = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((mediaStream) => {
        if (stopped) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = mediaStream;
        video.play();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const tick = () => {
          if (stopped) return;
          if (!video || !canvas || !ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafId = requestAnimationFrame(tick);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height);
          const storeId = code && parseStoreIdFromQr(code.data);
          if (storeId) {
            setStep({ name: "loading-store" });
            getStore(storeId)
              .then((store) => setStep({ name: "amount", storeId: store.id, storeName: store.name }))
              .catch(() => {
                setError("가맹점 정보를 불러오지 못했어요.");
                setStep({ name: "scan" });
              });
            return; // 조회 끝날 때까지 스캔 루프 중단
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      })
      .catch(() => setError("카메라를 사용할 수 없어요. 권한을 확인해주세요."));

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [step.name]);

  function handleKeyPress(key: string) {
    setAmountInput((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (prev.length >= MAX_DIGITS) return prev;
      return (prev + key).replace(/^0+(?=\d)/, "");
    });
  }

  async function handleSubmit() {
    if (step.name !== "amount") return;
    const amount = Number(amountInput) || 0;
    setSubmitting(true);
    const ok = await onSubmit(step.storeId, amount);
    setSubmitting(false);
    if (ok) setStep({ name: "done", storeName: step.storeName, amount });
  }

  useEffect(() => {
    if (step.name !== "done") return;
    const timer = window.setTimeout(onBack, 1500);
    return () => window.clearTimeout(timer);
  }, [step, onBack]);

  if (step.name === "done") {
    return (
      <section className={styles.screen}>
        <div className={styles.payDoneBackdrop}>
          <div className={styles.payDoneCard}>
            <span className={styles.payDoneStore}>{step.storeName}</span>
            <strong className={styles.payDoneAmount}>{step.amount.toLocaleString("ko-KR")}원 결제완료</strong>
            <span className={styles.payDoneCheck}>
              <Check size={40} strokeWidth={3} />
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (step.name === "amount") {
    const amount = Number(amountInput) || 0;
    const insufficientBalance = balance != null && amount > balance;
    const canSubmit = amount > 0 && balance != null && !insufficientBalance && !submitting;

    return (
      <section className={styles.screen}>
        <ScreenHeader
          title="당근페이 현장결제"
          leading={
            <IconButton label="뒤로" onClick={onBack}>
              <ChevronLeft size={27} />
            </IconButton>
          }
        />
        <div className={styles.paymentAmountBody}>
          <div className={styles.paymentRecipient}>
            <span>{step.storeName}</span>
          </div>
          <div className={styles.paymentAmountField}>
            <strong>{amountInput ? amount.toLocaleString("ko-KR") : "0"}</strong>
            <span>원</span>
          </div>
          <p className={insufficientBalance ? styles.paymentBalanceWarn : styles.paymentBalance}>
            {balance == null
              ? "보유 잔액 확인 중..."
              : insufficientBalance
                ? `보유 잔액이 부족해요 (${balance.toLocaleString("ko-KR")}원)`
                : `보유 잔액 ${balance.toLocaleString("ko-KR")}원`}
          </p>
          {balance != null && !insufficientBalance && amount > 0 && (
            <p className={styles.paymentBalance}>결제 후 잔액 {(balance - amount).toLocaleString("ko-KR")}원</p>
          )}
        </div>
        <div className={styles.paymentAmountFooter}>
          <NumberPad onKeyPress={handleKeyPress} />
          <button type="button" className={styles.paymentSubmitBtn} disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "결제 중..." : "결제하기"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="결제하기"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <div className={styles.payScanBody}>
        {error ? (
          <p className={styles.paymentBalanceWarn}>{error}</p>
        ) : step.name === "loading-store" ? (
          <p className={styles.paymentBalance}>가맹점 정보를 확인하는 중...</p>
        ) : (
          <div className={styles.payScanViewfinder}>
            <video ref={videoRef} muted playsInline className={styles.payScanVideo} />
            <span className={styles.payScanFrame} />
          </div>
        )}
        {step.name === "scan" && !error && <p className={styles.paymentBalance}>QR코드 찍고 결제하세요!</p>}
      </div>
      <canvas ref={canvasRef} hidden />
    </section>
  );
}
