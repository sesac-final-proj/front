"use client";

import { Bike, ChevronRight, MapPin, RefreshCw, TrainFront } from "lucide-react";
import type { TransitKind, TransitStop } from "@/services/transitService";
import styles from "./TransitSection.module.css";

interface Props {
  kind: TransitKind;
  stops: TransitStop[];
  selectedId: string | null;
  total: number;
  fetchedAt: string | null;
  loading: boolean;
  error: string;
  hasQuery: boolean;
  onRetry: () => void;
  onClearQuery: () => void;
  onSelect: (stop: TransitStop) => void;
}

export function TransitSection({ kind, stops, selectedId, total, fetchedAt, loading, error, hasQuery, onRetry, onClearQuery, onSelect }: Props) {
  const bike = kind === "bike";
  const title = bike ? "따릉이 대여소" : "주변 지하철역";
  const Icon = bike ? Bike : TrainFront;
  const selected = stops.find((stop) => stop.id === selectedId);
  return (
    <section className={styles.section} aria-label={title} aria-busy={loading}>
      <div className={styles.heading}>
        <h2>{title} <span>{stops.length}곳</span></h2>
        <button type="button" onClick={onRetry} disabled={loading} aria-label={`${title} 새로고침`}><RefreshCw size={17} /></button>
      </div>
      <p className={styles.hint}>{bike ? "대여 가능 대수를 확인하고 가까운 대여소를 찾아보세요." : "역을 선택하면 지도에서 위치와 이용 호선을 확인할 수 있어요."}</p>
      {error ? <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={onRetry}>다시 시도</button></div>
        : loading && stops.length === 0 ? <p className={styles.state} role="status">{title} 정보를 불러오고 있어요.</p>
        : stops.length === 0 ? <div className={styles.state}><MapPin size={26} aria-hidden="true" /><p>{hasQuery ? "검색어와 일치하는 장소가 없어요." : "현재 지도 범위에 표시할 장소가 없어요."}</p><small>{hasQuery ? "다른 역명이나 대여소 이름으로 찾아보세요." : "지도를 이동하거나 축소해 주변을 살펴보세요."}</small>{hasQuery && <button type="button" onClick={onClearQuery}>검색어 지우기</button>}</div>
        : <>
          {selected && <div className={styles.detail} role="status">
            <strong>{selected.name}</strong>
            <p>{bike ? selected.bikes_available === null ? "대여 가능 대수 확인 불가" : `현재 대여 가능한 자전거 ${selected.bikes_available}대` : selected.line || "호선 정보 없음"}</p>
            {bike && selected.racks !== null && <small>거치대 {selected.racks}개 · 현장 상황에 따라 달라질 수 있어요.</small>}
            <a href={`https://map.kakao.com/link/to/${encodeURIComponent(selected.name)},${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer">카카오맵 길찾기 <ChevronRight size={15} /></a>
          </div>}
          <ul className={styles.list}>
            {stops.map((stop) => <li key={stop.id}>
              <button type="button" className={styles.stop} aria-pressed={stop.id === selectedId} onClick={() => onSelect(stop)}>
                <span className={`${styles.icon} ${bike ? styles.bike : styles.subway}`}><Icon size={22} aria-hidden="true" /></span>
                <span className={styles.name}><strong>{stop.name}</strong><small>{bike ? stop.racks === null ? "따릉이 대여소" : `거치대 ${stop.racks}개` : stop.line || "호선 정보 없음"}</small></span>
                {bike ? <span className={`${styles.count} ${stop.bikes_available === 0 ? styles.empty : ""}`}>{stop.bikes_available === null ? "확인 불가" : <><b>{stop.bikes_available}</b>대<small>{stop.bikes_available === 0 ? "대여 불가" : "대여 가능"}</small></>}</span> : <ChevronRight size={18} aria-hidden="true" />}
              </button>
            </li>)}
          </ul>
        </>}
      {total > 120 && <p className={styles.hint}>지도 중심에서 가까운 120곳을 표시해요. 지도를 확대하면 더 자세히 볼 수 있어요.</p>}
      <p className={styles.source}>
        <a href={bike ? "https://data.seoul.go.kr/dataList/OA-15493/A/1/datasetView.do" : "https://data.seoul.go.kr/dataList/OA-21232/A/1/datasetView.do"} target="_blank" rel="noreferrer">서울 열린데이터광장</a>
        {fetchedAt && <> · {new Date(fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 조회</>}
        {bike && <><br />1분마다 갱신 · 자전거 수는 현장과 다를 수 있어요.</>}
      </p>
    </section>
  );
}
