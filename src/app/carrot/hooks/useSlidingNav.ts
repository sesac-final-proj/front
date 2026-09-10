"use client";

import { useCallback, useRef } from "react";

const DRAG_THRESHOLD = 6;

export function useSlidingNav<T extends string>(
  items: readonly T[],
  onSelect: (item: T) => void,
) {
  const navRef = useRef<HTMLElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastIndexRef = useRef(-1);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const indexAt = useCallback((clientX: number) => {
    const nav = navRef.current;
    if (!nav) return -1;
    const rect = nav.getBoundingClientRect();
    if (rect.width <= 0) return -1;
    return Math.max(0, Math.min(items.length - 1, Math.floor(((clientX - rect.left) / rect.width) * items.length)));
  }, [items.length]);

  const selectAt = useCallback((clientX: number) => {
    const index = indexAt(clientX);
    if (index < 0 || index === lastIndexRef.current) return;
    lastIndexRef.current = index;
    onSelect(items[index]);
  }, [indexAt, items, onSelect]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    lastIndexRef.current = indexAt(event.clientX);
    draggingRef.current = false;
    suppressClickRef.current = false;
  }, [indexAt]);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const dx = event.clientX - startXRef.current;
    const dy = event.clientY - startYRef.current;

    if (!draggingRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
      draggingRef.current = true;
      suppressClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }

    event.preventDefault();
    selectAt(event.clientX);
  }, [selectAt]);

  const finish = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    if (draggingRef.current) selectAt(event.clientX);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    delete event.currentTarget.dataset.dragging;
    pointerIdRef.current = null;
    draggingRef.current = false;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, [selectAt]);

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    navRef,
    navGestureProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
    },
  };
}
