import { useRef, useState } from "react";
import type React from "react";

// 당겨서 새로고침(pull-to-refresh) 제스처 — HomeScreen에서 처음 만들었던 걸
// 채팅목록/판매내역/찜목록에도 그대로 쓰려고 훅으로 뽑았다. 맨 위(scrollTop 0)에서
// 아래로 당길 때만 동작하고, onRefresh가 없으면(예: 로컬 데이터만 쓰는 화면) 아무 일도
// 하지 않는다.
export const PULL_TO_REFRESH_THRESHOLD = 64;

export function usePullToRefresh(onRefresh: (() => Promise<void>) | undefined) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (!onRefresh || isRefreshing) return;
    const scrollRoot = event.currentTarget.closest<HTMLElement>("[data-app-scroll]");
    if (!scrollRoot || scrollRoot.scrollTop > 0) return;
    touchStartYRef.current = event.touches[0].clientY;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (touchStartYRef.current === null) return;
    const delta = event.touches[0].clientY - touchStartYRef.current;
    if (delta <= 0) {
      setIsDragging(false);
      setPullDistance(0);
      return;
    }
    setIsDragging(true);
    // 고무줄 저항감 — 손가락 이동량을 그대로 반영하면 너무 쉽게 늘어난다.
    setPullDistance(Math.min(delta * 0.5, 96));
  }

  function handleTouchEnd() {
    touchStartYRef.current = null;
    if (!isDragging) return;
    setIsDragging(false);
    if (onRefresh && pullDistance >= PULL_TO_REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }

  const pullOffset = isRefreshing ? 48 : pullDistance;
  const contentStyle: React.CSSProperties = {
    transform: pullOffset ? `translateY(${pullOffset}px)` : undefined,
    transition: isDragging ? "none" : "transform 0.2s ease",
  };

  return {
    pullOffset,
    isRefreshing,
    contentStyle,
    handlers: { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd },
  };
}
