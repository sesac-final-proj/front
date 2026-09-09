"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import jsQR from "jsqr";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

interface ScannedPayment {
  merchantName: string;
  amount: number;
}

// 결제 QR은 가맹점 단말기가 {"merchantName": "...", "amount": 1234} 형태의 JSON 텍스트를
// 인코딩해 발급한다고 가정 — 실제 가맹점 연동은 스코프 밖이라 카메라로 이 포맷만 읽는다.
function parsePaymentQr(text: string): ScannedPayment | null {
  try {
    const data = JSON.parse(text);
    if (typeof data?.merchantName === "string" && Number.isFinite(data?.amount) && data.amount > 0) {
      return { merchantName: data.merchantName, amount: Math.trunc(data.amount) };
    }
  } catch {
    // QR 포맷이 아니면 무시하고 계속 스캔
  }
  return null;
}

export function WalletPayScreen({
  balance,
  onBack,
  onSubmit,
}: {
  balance: number | null;
  onBack: () => void;
  onSubmit: (merchantName: string, amount: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanned, setScanned] = useState<ScannedPayment | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
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
          const parsed = code && parsePaymentQr(code.data);
          if (parsed) {
            setScanned(parsed);
            return; // 스캔 성공하면 루프 중단 — 결제 확정 전까지 같은 결과를 보여준다.
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      })
      .catch(() => setCameraError("카메라를 사용할 수 없어요. 권한을 확인해주세요."));

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const insufficientBalance = scanned != null && balance != null && scanned.amount > balance;
  const canSubmit = scanned != null && balance != null && !insufficientBalance;

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
      {scanned && (
        <div className={styles.payScanInfo}>
          <span>{scanned.merchantName}에서 결제됩니다.</span>
          <strong>{scanned.amount.toLocaleString("ko-KR")}원</strong>
        </div>
      )}
      <div className={styles.payScanBody}>
        {cameraError ? (
          <p className={styles.paymentBalanceWarn}>{cameraError}</p>
        ) : (
          <div className={styles.payScanViewfinder}>
            <video ref={videoRef} muted playsInline className={styles.payScanVideo} />
            <span className={styles.payScanFrame} />
          </div>
        )}
        {!scanned && !cameraError && <p className={styles.paymentBalance}>QR코드 찍고 결제하세요!</p>}
        {scanned && (
          <p className={insufficientBalance ? styles.paymentBalanceWarn : styles.paymentBalance}>
            {balance == null
              ? "보유 잔액 확인 중..."
              : insufficientBalance
                ? `보유 잔액이 부족해요 (${balance.toLocaleString("ko-KR")}원)`
                : `보유 잔액 ${balance.toLocaleString("ko-KR")}원`}
          </p>
        )}
      </div>
      <canvas ref={canvasRef} hidden />
      {scanned && (
        <div className={styles.paymentAmountFooter}>
          <button
            type="button"
            className={styles.paymentSubmitBtn}
            disabled={!canSubmit}
            onClick={() => onSubmit(scanned.merchantName, scanned.amount)}
          >
            결제하기
          </button>
        </div>
      )}
    </section>
  );
}
