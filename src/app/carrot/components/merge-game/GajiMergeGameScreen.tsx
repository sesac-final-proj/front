"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import { BOARD, INITIAL_GAME, MergeGame, STEP_MS } from "./engine";
import { VEGETABLES } from "./characters";
import { drawGame, loadCharacterImages } from "./renderer";
import styles from "./GajiMergeGame.module.css";

const BEST_KEY = "gaji-drop-best-score-v1";
const SOUND_KEY = "gaji-drop-sound-v1";
function stored(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function save(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Playing does not require storage. */ }
}
function bestScore() {
  const value = Number(stored(BEST_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function GajiMergeGameScreen({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MergeGame | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const bestRef = useRef(0);
  const pointerRef = useRef<number | null>(null);
  const [game, setGame] = useState(INITIAL_GAME);
  const [best, setBest] = useState(bestScore);
  const [sound, setSound] = useState(() => stored(SOUND_KEY) !== "off");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [failure, setFailure] = useState(false);
  const resumeAfterDialog = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { soundRef.current = sound; }, [sound]);

  const playSound = useCallback((frequency: number, duration = 0.075) => {
    if (!soundRef.current) return;
    try {
      audioRef.current ??= new AudioContext();
      const audio = audioRef.current;
      if (audio.state === "suspended") void audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.65, audio.currentTime + duration);
      gain.gain.setValueAtTime(0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Audio is optional on browsers that block it. */ }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    bestRef.current = bestScore();
    const engine = new MergeGame((snapshot) => {
      if (snapshot.score > bestRef.current) {
        bestRef.current = snapshot.score;
        setBest(snapshot.score);
        save(BEST_KEY, String(snapshot.score));
      }
    }, (level) => playSound(330 + level * 70));
    engineRef.current = engine;
    const sprites = loadCharacterImages();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let renderedSnapshot: typeof engine.snapshot | null = null;
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 3) * canvas.clientWidth / BOARD.width;
      canvas.width = Math.round(BOARD.width * scale);
      canvas.height = Math.round(BOARD.height * scale);
      context.setTransform(canvas.width / BOARD.width, 0, 0, canvas.height / BOARD.height, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const tick = (time: number) => {
      try {
        const elapsed = previous ? Math.min(time - previous, 50) : 0;
        previous = time;
        if (engine.snapshot.status === "playing") {
          accumulator += elapsed;
          while (accumulator >= STEP_MS) { engine.step(); accumulator -= STEP_MS; }
        } else accumulator = 0;
        if (renderedSnapshot !== engine.snapshot) {
          renderedSnapshot = engine.snapshot;
          setGame(engine.snapshot);
        }
        drawGame(context, engine, sprites, reducedMotion.matches);
        frame = requestAnimationFrame(tick);
      } catch {
        engine.setPaused(true);
        setFailure(true);
      }
    };
    frame = requestAnimationFrame(tick);
    const pauseHiddenGame = () => { if (document.hidden) engine.setPaused(true); };
    document.addEventListener("visibilitychange", pauseHiddenGame);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", pauseHiddenGame);
      engine.destroy();
      engineRef.current = null;
      if (audioRef.current) void audioRef.current.close().catch(() => {});
      audioRef.current = null;
    };
  }, [playSound]);

  const start = () => {
    setConfirmReset(false);
    setConfirmExit(false);
    engineRef.current?.start();
    playSound(480);
    canvasRef.current?.focus({ preventScroll: true });
  };
  const aim = (clientX: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (bounds?.width) engineRef.current?.setAim((clientX - bounds.left) / bounds.width * BOARD.width);
  };
  const drop = () => { if (engineRef.current?.drop()) playSound(260, 0.045); };
  const requestDialog = (kind: "reset" | "exit") => {
    if (game.status === "ready" || game.status === "over") {
      if (kind === "exit") onBack(); else start();
      return;
    }
    resumeAfterDialog.current = game.status === "playing";
    engineRef.current?.setPaused(true);
    if (kind === "reset") setConfirmReset(true); else setConfirmExit(true);
  };
  const cancelDialog = () => {
    setConfirmReset(false);
    setConfirmExit(false);
    if (resumeAfterDialog.current) engineRef.current?.setPaused(false);
    canvasRef.current?.focus({ preventScroll: true });
  };
  const modal = confirmReset || confirmExit || game.status === "paused" || game.status === "over" || failure;
  useEffect(() => {
    if (modal) dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [modal]);

  return (
    <section className={styles.screen} aria-label="수박게임">
      <header className={styles.header}>
        <button className={styles.iconButton} type="button" onClick={() => requestDialog("exit")} aria-label="뒤로" title="뒤로"><ArrowLeft size={23} /></button>
        <h1><span>수박</span>게임</h1>
        <button className={styles.iconButton} type="button" aria-label={sound ? "소리 끄기" : "소리 켜기"} title={sound ? "소리 끄기" : "소리 켜기"} aria-pressed={sound} onClick={() => {
          setSound(!sound); soundRef.current = !sound; save(SOUND_KEY, sound ? "off" : "on");
        }}>{sound ? <Volume2 size={21} /> : <VolumeX size={21} />}</button>
      </header>
      <div className={styles.scoreboard} aria-label="게임 기록">
        <div className={styles.score}><span>점수</span><strong data-testid="game-score">{game.score.toLocaleString("ko-KR")}</strong></div>
        <div className={styles.best}><span><Trophy size={13} /> 최고 기록</span><strong>{best.toLocaleString("ko-KR")}</strong></div>
        <div className={styles.next} aria-label={`다음 채소 ${VEGETABLES[game.next].name}`}><span>다음</span><Image unoptimized src={VEGETABLES[game.next].image} width={42} height={42} alt={VEGETABLES[game.next].name} /></div>
      </div>
      <div className={styles.playArea}>
        <canvas
          ref={canvasRef} className={styles.canvas} width={BOARD.width * 2} height={BOARD.height * 2}
          role="application" aria-label="채소 합치기 게임판. 좌우 방향키로 위치를 정하고 스페이스로 떨어뜨리기" tabIndex={0}
          data-testid="merge-canvas" data-status={game.status} data-drops={game.drops} data-highest={game.highest}
          onPointerDown={(event) => {
            if (game.status !== "playing" || !event.isPrimary || event.button !== 0) return;
            pointerRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.focus({ preventScroll: true }); aim(event.clientX);
          }}
          onPointerMove={(event) => { if (event.isPrimary) aim(event.clientX); }}
          onPointerUp={(event) => {
            if (pointerRef.current !== event.pointerId) return;
            pointerRef.current = null;
            aim(event.clientX); drop();
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { pointerRef.current = null; }}
          onLostPointerCapture={() => { pointerRef.current = null; }}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              const engine = engineRef.current;
              if (engine) engine.setAim(engine.aim + (event.key === "ArrowLeft" ? -12 : 12));
            } else if (event.key === " " || event.key === "ArrowDown" || event.key === "Enter") {
              event.preventDefault(); if (!event.repeat) drop();
            } else if (event.key === "Escape") engineRef.current?.setPaused(true);
          }}
        />
        {game.status === "ready" && <div className={styles.startOverlay}>
          <Image unoptimized className={styles.mascot} src={VEGETABLES[6].image} width={108} height={108} alt="꿈가지" />
          <button className={styles.playButton} type="button" onClick={start}><Play size={18} fill="currentColor" /> 게임 시작</button>
        </div>}
        {modal && <div className={styles.shade}>
          <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="merge-dialog-title" onKeyDown={(event) => {
            if (event.key === "Escape" && (confirmReset || confirmExit)) cancelDialog();
            if (event.key === "Tab") {
              const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
              if (!buttons?.length) return;
              const first = buttons[0], last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
          }}>
            <Image unoptimized src={VEGETABLES[Math.max(game.highest, 6)].image} alt="" width={74} height={74} />
            <h2 id="merge-dialog-title">{failure ? "게임을 불러오지 못했어요" : confirmExit ? "게임을 나갈까요?" : confirmReset ? "새로 시작할까요?" : game.status === "over" ? "게임 끝!" : "잠깐 쉬는 중"}</h2>
            {(confirmReset || confirmExit) ? <>
              <p>이번 판의 진행 상황은 사라져요.</p>
              <button className={styles.playButton} type="button" onClick={cancelDialog}>계속하기</button>
              <button className={styles.textButton} type="button" onClick={confirmExit ? onBack : start}>{confirmExit ? "나가기" : "새로 시작"}</button>
            </> : failure ? <button className={styles.playButton} type="button" onClick={onBack}>돌아가기</button> : game.status === "over" ? <>
              <strong className={styles.finalScore}>{game.score.toLocaleString("ko-KR")}<small>점</small></strong>
              <button className={styles.playButton} type="button" onClick={start}><RotateCcw size={17} /> 다시 하기</button>
            </> : <button className={styles.playButton} type="button" onClick={() => { engineRef.current?.setPaused(false); canvasRef.current?.focus({ preventScroll: true }); }}><Play size={17} fill="currentColor" /> 계속하기</button>}
          </div>
        </div>}
      </div>
      <div className={styles.evolution} aria-label="채소 성장 순서">
        {VEGETABLES.map((vegetable, index) => <div className={styles.evolutionStep} key={vegetable.name} title={vegetable.name}>
          <Image unoptimized src={vegetable.image} alt={vegetable.name} width={32} height={32} />
          {index < VEGETABLES.length - 1 && <ChevronRight size={10} aria-hidden="true" />}
        </div>)}
      </div>
      <footer className={styles.footer}>
        <button type="button" onClick={() => requestDialog("reset")} disabled={game.status === "ready" || modal}><RotateCcw size={16} /> 처음부터</button>
        <button className={styles.iconButton} type="button" onClick={() => engineRef.current?.setPaused(true)} disabled={game.status !== "playing"} aria-label="일시정지" title="일시정지"><Pause size={18} /></button>
      </footer>
      <span className={styles.srOnly} role="status">{game.status === "over" ? `게임 종료, ${game.score}점` : game.danger ? "채소가 넘치고 있어요" : game.highest === 7 ? "황금가지 완성" : ""}</span>
    </section>
  );
}
