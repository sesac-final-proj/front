"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./MannerTemperatureModal.module.css";

/* --- 4 Tiers of 3D-shaded Vector Faces matching Daangn UI --- */

// Tier 1: Cold / Disappointed / Angry (< 36.0°C)
function ColdGrayFace({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
      <defs>
        <radialGradient id="grayFaceGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#b2b5ba" />
          <stop offset="55%" stopColor="#8d9299" />
          <stop offset="100%" stopColor="#686d75" />
        </radialGradient>
        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Face Base */}
      <circle cx="45" cy="45" r="40" fill="url(#grayFaceGrad)" filter="url(#subtleShadow)" />

      {/* Slanted Angry Eyebrows */}
      <path d="M26 33 L38 38" stroke="#2b303a" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M52 38 L64 33" stroke="#2b303a" strokeWidth="3.4" strokeLinecap="round" />

      {/* Dark Eyes */}
      <ellipse cx="34" cy="43" rx="3.6" ry="4.2" fill="#2b303a" />
      <ellipse cx="56" cy="43" rx="3.6" ry="4.2" fill="#2b303a" />

      {/* Downward Frowning Mouth */}
      <path d="M35 59 Q45 51 55 59" stroke="#2b303a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Tier 2: Normal Friendly Smile (36.0°C - 39.9°C)
function NormalSmileFace({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
      <defs>
        <radialGradient id="normalSmileGrad" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ffeaa7" />
          <stop offset="50%" stopColor="#fdcb6e" />
          <stop offset="100%" stopColor="#f39c12" />
        </radialGradient>
      </defs>
      {/* Face Base */}
      <circle cx="45" cy="45" r="40" fill="url(#normalSmileGrad)" />

      {/* Curved Gentle Eyebrows */}
      <path d="M27 34 Q33 30 39 34" stroke="#2d3436" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M51 34 Q57 30 63 34" stroke="#2d3436" strokeWidth="2.8" strokeLinecap="round" fill="none" />

      {/* Shiny Cute Eyes */}
      <ellipse cx="34" cy="43" rx="3.8" ry="4.8" fill="#2d3436" />
      <circle cx="35.5" cy="41.5" r="1.3" fill="#ffffff" />
      <ellipse cx="56" cy="43" rx="3.8" ry="4.8" fill="#2d3436" />
      <circle cx="57.5" cy="41.5" r="1.3" fill="#ffffff" />

      {/* Friendly Smile */}
      <path d="M37 53 Q45 61 53 53" stroke="#2d3436" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Tier 3: Warm Blushing Smile (40.0°C - 69.9°C)
function WarmBlushFace({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
      <defs>
        <radialGradient id="warmBlushGrad" cx="40%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ffe699" />
          <stop offset="50%" stopColor="#ffb142" />
          <stop offset="100%" stopColor="#ff793f" />
        </radialGradient>
      </defs>
      {/* Face Base */}
      <circle cx="45" cy="45" r="40" fill="url(#warmBlushGrad)" />

      {/* Rosy Blushing Cheeks */}
      <ellipse cx="25" cy="49" rx="7.5" ry="4.8" fill="#ff4757" opacity="0.45" />
      <ellipse cx="65" cy="49" rx="7.5" ry="4.8" fill="#ff4757" opacity="0.45" />

      {/* Happy Curved Eyebrows */}
      <path d="M26 33 Q33 29 40 33" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M50 33 Q57 29 64 33" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Happy Beaming Eyes */}
      <ellipse cx="34" cy="43" rx="3.8" ry="4.8" fill="#2d3436" />
      <circle cx="35.5" cy="41" r="1.4" fill="#ffffff" />
      <ellipse cx="56" cy="43" rx="3.8" ry="4.8" fill="#2d3436" />
      <circle cx="57.5" cy="41" r="1.4" fill="#ffffff" />

      {/* Wide Joyful Smile */}
      <path d="M35 53 Q45 64 55 53" stroke="#2d3436" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Tier 4: Fiery Flame Eyes Enthusiasm (70.0°C - 99.9°C)
function FieryFlameFace({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
      <defs>
        <radialGradient id="fireFaceGrad" cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffeaa7" />
          <stop offset="45%" stopColor="#ff9f43" />
          <stop offset="100%" stopColor="#ee5253" />
        </radialGradient>
      </defs>
      {/* Face Base */}
      <circle cx="45" cy="45" r="40" fill="url(#fireFaceGrad)" />

      {/* Left Flame Eye */}
      <g transform="translate(23, 26)">
        <path
          d="M10 24 C4 22 2 16 5 10 C6 14 9 12 9 7 C11 11 16 11 17 6 C18 12 21 16 17 21 C15 23 13 24 10 24 Z"
          fill="#eb4d4b"
        />
        <path
          d="M10 23 C6 21 5 17 7 13 C8 15 10 14 10 11 C11 13 14 13 15 10 C16 14 17 17 14 20 C13 22 12 23 10 23 Z"
          fill="#f9ca24"
        />
      </g>

      {/* Right Flame Eye */}
      <g transform="translate(47, 26)">
        <path
          d="M10 24 C4 22 2 16 5 10 C6 14 9 12 9 7 C11 11 16 11 17 6 C18 12 21 16 17 21 C15 23 13 24 10 24 Z"
          fill="#eb4d4b"
        />
        <path
          d="M10 23 C6 21 5 17 7 13 C8 15 10 14 10 11 C11 13 14 13 15 10 C16 14 17 17 14 20 C13 22 12 23 10 23 Z"
          fill="#f9ca24"
        />
      </g>

      {/* Big Open Laughing Mouth with Tongue */}
      <g transform="translate(32, 51)">
        <path
          d="M2 3 Q13 3 24 3 Q24 16 13 16 Q2 16 2 3 Z"
          fill="#b33939"
        />
        <ellipse cx="13" cy="13" rx="7" ry="4" fill="#ff7675" />
      </g>
    </svg>
  );
}

export function getMannerTier(temp: number): 1 | 2 | 3 | 4 {
  if (temp < 36.0) return 1;
  if (temp < 40.0) return 2;
  if (temp < 70.0) return 3;
  return 4;
}

export function getMannerColor(temp: number): string {
  if (temp < 36.0) return "#71767c";
  if (temp < 40.0) return "#ff8800";
  if (temp < 70.0) return "#ff6f0f";
  return "#e03131";
}

export function getMannerGradient(temp: number): string {
  if (temp < 36.0) return "#8d9299";
  if (temp < 40.0) return "linear-gradient(90deg, #fdcb6e, #f39c12)";
  if (temp < 70.0) return "linear-gradient(90deg, #ff9f43, #ff6f0f)";
  return "linear-gradient(90deg, #ff6f0f, #e03131)";
}

/* 4단계 자동 슬라이드쇼 스테이지 정의 */
export interface SlideshowStage {
  temp: number;
  label: string;
  subtitle: string;
}

const SLIDESHOW_STAGES: SlideshowStage[] = [
  { temp: 30.0, label: "30.0°C", subtitle: "주의 필요" },
  { temp: 36.5, label: "36.5°C", subtitle: "첫 시작" },
  { temp: 57.2, label: "57.2°C", subtitle: "신뢰 이웃" },
  { temp: 99.9, label: "99.9°C", subtitle: "열정 마스터" },
];

export interface MannerTemperatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTemp?: number;
}

export function MannerTemperatureModal({
  isOpen,
  onClose,
  targetTemp = 36.5,
}: MannerTemperatureModalProps) {
  // 현재 게이지에 표시되는 온도
  const [currentTemp, setCurrentTemp] = useState<number>(36.5);
  const [tier, setTier] = useState<1 | 2 | 3 | 4>(getMannerTier(36.5));
  const [slideDirection, setSlideDirection] = useState<number>(1); // 1: right to left, -1: left to right

  // 자동 슬라이드쇼 관련 상태
  const [activeStageIndex, setActiveStageIndex] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 부드러운 온도 슬라이딩 애니메이션 실행 함수
  const animateToTemp = useCallback((destTemp: number, duration = 600) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setCurrentTemp((prevStart) => {
      const startTemp = prevStart;
      const finalDest = Math.max(0, Math.min(99.9, destTemp));
      const direction = finalDest >= startTemp ? 1 : -1;
      setSlideDirection(direction);

      if (Math.abs(finalDest - startTemp) < 0.2) {
        setTier(getMannerTier(finalDest));
        return finalDest;
      }

      let startTime: number | null = null;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const interpolated = startTemp + (finalDest - startTemp) * ease;

        setCurrentTemp(interpolated);
        const nextTier = getMannerTier(interpolated);
        setTier(nextTier);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setCurrentTemp(finalDest);
          setTier(getMannerTier(finalDest));
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
      return startTemp;
    });
  }, []);

  // 모달이 처음 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      return;
    }

    // 초기 시작 36.5도
    setCurrentTemp(36.5);
    setTier(getMannerTier(36.5));
    setActiveStageIndex(1);
    setIsAutoPlaying(true);

    // 대상 온도가 36.5와 다르면 대상 온도로 부드럽게 인트로 이동 후 슬라이드쇼 시작
    const initialTarget = targetTemp ?? 36.5;
    if (Math.abs(initialTarget - 36.5) > 0.5) {
      const timer = setTimeout(() => {
        animateToTemp(initialTarget, 650);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, targetTemp, animateToTemp]);

  // 자동 슬라이드쇼 루프 (2.6초마다 다음 단계로 자동 슬라이딩)
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveStageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % SLIDESHOW_STAGES.length;
        const nextStage = SLIDESHOW_STAGES[nextIndex];
        animateToTemp(nextStage.temp, 600);
        return nextIndex;
      });
    }, 2600);

    return () => clearInterval(interval);
  }, [isOpen, isAutoPlaying, animateToTemp]);

  // 수동 선택(칩 or 인디케이터 클릭)
  const handleSelectStage = (index: number) => {
    setActiveStageIndex(index);
    animateToTemp(SLIDESHOW_STAGES[index].temp, 500);

    // 수동 조작 후 4초간 대기 후 다시 자동재생 진행
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 4000);
  };

  // 트랙 터치/마우스 드래그 조작 지원
  const handlePointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const calculatedTemp = ratio * 99.9;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setCurrentTemp((prev) => {
      setSlideDirection(calculatedTemp >= prev ? 1 : -1);
      return calculatedTemp;
    });
    setTier(getMannerTier(calculatedTemp));

    // 가장 가까운 스테이지 인덱스 매칭
    let closestIdx = 0;
    let minDiff = 999;
    SLIDESHOW_STAGES.forEach((st, idx) => {
      const diff = Math.abs(st.temp - calculatedTemp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setActiveStageIndex(closestIdx);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsAutoPlaying(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    handlePointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // 드래그 종료 후 3.5초 뒤 자동 슬라이드쇼 재개
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 3500);
  };

  if (!isOpen) return null;

  // 0~99.9도를 0~100% 게이지 폭으로 매핑
  const fillPercentage = Math.min(100, Math.max(2, (currentTemp / 99.9) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.sheet}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 바 */}
            <div className={styles.sheetHandle} />

            {/* 자동 슬라이드쇼 인디케이터 및 재생/일시정지 바 */}
            <div className={styles.slideshowControlBar}>
              <div className={styles.slideDots} aria-label="슬라이드 단계">
                {SLIDESHOW_STAGES.map((st, idx) => (
                  <button
                    key={st.label}
                    type="button"
                    className={`${styles.slideDot} ${
                      activeStageIndex === idx ? styles.slideDotActive : ""
                    }`}
                    onClick={() => handleSelectStage(idx)}
                    aria-label={`${st.label} 단계로 이동`}
                  />
                ))}
              </div>

              <span className={styles.slideshowBadge}>
                {isAutoPlaying ? "자동 슬라이드쇼" : "일시정지됨"}
              </span>

              <button
                type="button"
                className={styles.playPauseBtn}
                onClick={() => setIsAutoPlaying((prev) => !prev)}
                aria-label={isAutoPlaying ? "슬라이드쇼 일시정지" : "슬라이드쇼 자동 재생"}
              >
                {isAutoPlaying ? <Pause size={13} /> : <Play size={13} />}
              </button>
            </div>

            {/* 얼굴 슬라이딩 무브먼트 스테이지 */}
            <div className={styles.faceStage}>
              <motion.div
                className={styles.faceTrack}
                // 은은한 호흡 바운스 애니메이션 (살아있는 느낌)
                animate={{
                  y: [-2, 2.5, -2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  ease: "easeInOut",
                }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={tier}
                    className={styles.faceItem}
                    // 온도가 올라가거나 내려갈 때 얼굴이 자연스럽게 좌우로 슬라이딩되며 겹침 전환
                    initial={{
                      x: slideDirection > 0 ? 60 : -60,
                      opacity: 0,
                      scale: 0.82,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      x: slideDirection > 0 ? -60 : 60,
                      opacity: 0,
                      scale: 0.82,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 24,
                    }}
                  >
                    {tier === 1 && <ColdGrayFace size={84} />}
                    {tier === 2 && <NormalSmileFace size={84} />}
                    {tier === 3 && <WarmBlushFace size={84} />}
                    {tier === 4 && <FieryFlameFace size={84} />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* 게이지 및 온도 수치 */}
            <div className={styles.gaugeRow}>
              <span
                className={styles.tempValue}
                style={{ color: getMannerColor(currentTemp) }}
              >
                {currentTemp.toFixed(1)}°C
              </span>
              <div
                ref={trackRef}
                className={styles.gaugeTrack}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                aria-label="매너온도 게이지 (드래그하여 변경 가능)"
              >
                <div
                  className={styles.gaugeFill}
                  style={{
                    width: `${fillPercentage}%`,
                    background: getMannerGradient(currentTemp),
                  }}
                />
              </div>
            </div>

            {/* 타이틀 및 상세 설명 문구 */}
            <h3 className={styles.title}>매너온도란?</h3>
            <p className={styles.description}>
              매너온도는 다른 사용자로부터 받은 매너평가, 후기를 포함한 여러 활동들을 모아 계산한 신뢰 지표예요.
            </p>

            {/* 온도를 직접 눌러볼 수 있는 단계 칩 */}
            <div className={styles.presetChips}>
              {SLIDESHOW_STAGES.map((stage, idx) => (
                <button
                  key={stage.label}
                  type="button"
                  className={`${styles.chipBtn} ${
                    activeStageIndex === idx ? styles.chipBtnActive : ""
                  }`}
                  onClick={() => handleSelectStage(idx)}
                >
                  {stage.label} {stage.subtitle}
                </button>
              ))}
            </div>

            {/* 확인 닫기 버튼 */}
            <motion.button
              type="button"
              className={styles.confirmBtn}
              onClick={onClose}
              whileTap={{ scale: 0.98 }}
            >
              확인
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
