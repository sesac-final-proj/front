"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PricePlatformComparisonItem } from "@/services/adminService";
import { COLORS, PLATFORMS } from "./comparison-data";
export default function ComparisonSpace({ rows }: { rows: PricePlatformComparisonItem[] }) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!host.current || !rows.length) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { queueMicrotask(() => setUnavailable(true)); return; }
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#fafaf7");
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); camera.position.set(8, 7, 11);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(2.5, 2, 1); controls.enableDamping = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); container.appendChild(renderer.domElement);
    const categories = [...new Set(rows.map(row => row.category))];
    const max = Math.max(1, ...rows.map(row => row.median_price));
    const geometry = new THREE.SphereGeometry(0.12, 12, 8);
    const materials = COLORS.map(color => new THREE.MeshBasicMaterial({ color }));
    rows.forEach(row => { const index = PLATFORMS.indexOf(row.platform as typeof PLATFORMS[number]); const point = new THREE.Mesh(geometry, materials[index] ?? materials[0]); point.position.set(categories.indexOf(row.category), row.median_price / max * 5, index * 1.5); scene.add(point); });
    const grid = new THREE.GridHelper(12, 12, "#999999", "#dddddd"); scene.add(grid);
    const axes = new THREE.AxesHelper(6); scene.add(axes);
    const render = () => renderer.render(scene, camera);
    const resize = () => { const width = Math.max(1, container.clientWidth); renderer.setSize(width, 320); camera.aspect = width / 320; camera.updateProjectionMatrix(); render(); };
    const observer = new ResizeObserver(resize); observer.observe(container); controls.addEventListener("change", render); controls.update(); resize();
    return () => { observer.disconnect(); controls.dispose(); geometry.dispose(); materials.forEach(material => material.dispose()); grid.geometry.dispose(); grid.material.dispose(); axes.geometry.dispose(); (axes.material as THREE.Material).dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [rows]);
  return <details><summary>3D 가격 분포 탐색</summary><p>드래그 회전 · 휠 확대. X: 아래 품목 순서, Y: 중앙값 0~{Math.max(0, ...rows.map(row => row.median_price)).toLocaleString()}원, Z: 당근·중고나라·번개장터. 점 크기는 동일.</p><p>{[...new Set(rows.map(row => row.category))].map((category, index) => `${index}: ${category}`).join(" / ")}</p>{unavailable ? <p>WebGL을 사용할 수 없습니다. 2D 차트와 수치 표로 확인하세요.</p> : <div ref={host} role="img" aria-label="플랫폼과 품목별 중앙값 3D 분포" style={{ width: "100%", height: 320, overflow: "hidden" }} />}</details>;
}
