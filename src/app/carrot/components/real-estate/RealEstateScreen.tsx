import React, { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import { X, Search, MapPinned, ChevronRight, RefreshCw } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type {
  HouseTypeFilter,
  RentTypeFilter,
  RentTransaction,
  RealEstateBounds,
} from "@/types";
import { getRentTransactions, groupTransactionsByBuilding } from "@/services";
import { IconButton } from "../common";
import {
  SEOUL_DISTRICTS,
  REAL_ESTATE_PROPERTY_TYPES,
  districtFromNeighborhood,
} from "./constants";
import { RealEstateFilterBar } from "./RealEstateFilterBar";
import { RealEstateCompactCard, RealEstateTransactionRow } from "./RealEstateCards";
import { RealEstateMap } from "./RealEstateMap";
import { RealEstateBuildingSheet } from "./RealEstateBuildingSheet";

export interface RealEstateScreenProps {
  activeNeighborhood: string;
  onBack: () => void;
}

export function RealEstateScreen({ activeNeighborhood, onBack }: RealEstateScreenProps) {
  const [view, setView] = useState<"home" | "map">("home");
  const [selectedDistrict, setSelectedDistrict] = useState(() => districtFromNeighborhood(activeNeighborhood));
  const [searchDraft, setSearchDraft] = useState("");
  const [query, setQuery] = useState("");
  const [houseType, setHouseType] = useState<HouseTypeFilter>("apartment");
  const [rentType, setRentType] = useState<RentTypeFilter>("all");
  const [depositMax, setDepositMax] = useState<number | undefined>();
  const [monthlyRentMax, setMonthlyRentMax] = useState<number | undefined>();
  const [usePyeong, setUsePyeong] = useState(false);
  const [transactions, setTransactions] = useState<RentTransaction[]>([]);
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mapBounds, setMapBounds] = useState<RealEstateBounds | null>(null);
  const [outsideSeoul, setOutsideSeoul] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getRentTransactions(
        {
          district: selectedDistrict,
          q: query || undefined,
          rentType,
          houseType,
          depositMax,
          monthlyRentMax,
          bounds: view === "map" && !outsideSeoul ? mapBounds : null,
        },
        controller.signal,
      )
        .then((response) => {
          setTransactions(response.items);
          setNotice(response.notice);
        })
        .catch((requestError) => {
          if (requestError instanceof DOMException && requestError.name === "AbortError") return;
          setTransactions([]);
          setError(requestError instanceof Error ? requestError.message : "실거래 정보를 불러오지 못했습니다.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [depositMax, houseType, mapBounds, monthlyRentMax, outsideSeoul, query, refreshKey, rentType, selectedDistrict, view]);

  const buildings = useMemo(() => groupTransactionsByBuilding(transactions), [transactions]);
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );
  const recentTransactions = transactions.slice(0, 8);
  const handleRealEstateViewportChange = useCallback((bounds: RealEstateBounds, isOutside: boolean) => {
    setOutsideSeoul(isOutside);
    if (!isOutside) setMapBounds(bounds);
  }, []);

  useEffect(() => {
    if (activeNeighborhood) {
      setSelectedDistrict(districtFromNeighborhood(activeNeighborhood));
    }
  }, [activeNeighborhood]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = searchDraft.trim().replace(/^서울특별시\s*/, "");
    if (!value) {
      setQuery("");
      return;
    }
    const explicitDistrict = SEOUL_DISTRICTS.find((item) => value.includes(item));
    if (explicitDistrict) {
      setSelectedDistrict(explicitDistrict);
      setQuery("");
      setMapBounds(null);
      setSelectedBuildingId(null);
      return;
    }
    const mapped = districtFromNeighborhood(value);
    if (mapped) {
      setSelectedDistrict(mapped);
      setQuery(value);
      setMapBounds(null);
      setSelectedBuildingId(null);
      return;
    }
    setQuery(value);
  }

  const searchPlaceholder = query ? `${query} 검색 중` : `서울특별시 ${selectedDistrict}`;

  if (view === "map") {
    return (
      <section className={styles.realEstateMapScreen}>
        <RealEstateMap
          district={selectedDistrict}
          buildings={buildings}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={(building) => setSelectedBuildingId(building.id)}
          onViewportChange={handleRealEstateViewportChange}
        />
        <div className={styles.realEstateMapTop}>
          <form className={styles.realEstateMapSearch} onSubmit={submitSearch}>
            <button type="button" aria-label="부동산 홈으로" onClick={() => {
              setView("home");
              setMapBounds(null);
              setSelectedBuildingId(null);
            }}>
              <X size={26} />
            </button>
            <label>
              <Search size={21} />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={searchPlaceholder}
                list="real-estate-districts"
              />
            </label>
          </form>
          <RealEstateFilterBar
            compact
            houseType={houseType}
            rentType={rentType}
            depositMax={depositMax}
            monthlyRentMax={monthlyRentMax}
            onHouseTypeChange={setHouseType}
            onRentTypeChange={setRentType}
            onDepositMaxChange={setDepositMax}
            onMonthlyRentMaxChange={setMonthlyRentMax}
            onRefresh={() => setRefreshKey((value) => value + 1)}
          />
        </div>
        {outsideSeoul ? (
          <div className={styles.realEstateMapMessage} role="status">
            <strong>서울 지역만 제공하고 있어요</strong>
            <span>지도를 서울 안으로 이동해 주세요.</span>
          </div>
        ) : null}
        {!loading && !outsideSeoul && buildings.length === 0 ? (
          <div className={styles.realEstateMapMessage} role="status">
            <strong>지도에 표시할 좌표가 없어요</strong>
            <span>필터를 바꾸거나 서버의 Geocoding 설정을 확인해 주세요.</span>
          </div>
        ) : null}
        <div className={styles.realEstateMapSummary} aria-live="polite">
          <strong>거래 {transactions.length}건</strong>
          <span />
          <strong>건물 {buildings.length}개</strong>
        </div>
        {selectedBuilding ? (
          <RealEstateBuildingSheet
            building={selectedBuilding}
            usePyeong={usePyeong}
            onClose={() => setSelectedBuildingId(null)}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.realEstateHome}>
      <header className={styles.realEstateHeader}>
        <IconButton label="닫기" onClick={onBack}><X size={28} /></IconButton>
        <h1>가지부동산</h1>
        <button type="button" className={styles.realEstateMapButton} onClick={() => setView("map")}>
          <MapPinned size={19} /> 지도
        </button>
      </header>

      <form className={styles.realEstateSearch} onSubmit={submitSearch}>
        <Search size={24} />
        <input
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={searchPlaceholder}
          list="real-estate-districts"
        />
        <button type="submit">검색</button>
      </form>
      <datalist id="real-estate-districts">
        {SEOUL_DISTRICTS.map((district) => <option key={district} value={district} />)}
      </datalist>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "0 16px 12px", scrollbarWidth: "none" }}>
        {SEOUL_DISTRICTS.map((dist) => {
          const isSelected = selectedDistrict === dist;
          return (
            <button
              key={dist}
              type="button"
              style={{
                padding: "6px 13px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? "#ff6f0f" : "#f1f3f5",
                color: isSelected ? "#ffffff" : "#495057",
                border: isSelected ? "1px solid #ff6f0f" : "1px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setSelectedDistrict(dist);
                setQuery("");
                setMapBounds(null);
                setSelectedBuildingId(null);
              }}
            >
              {dist}
            </button>
          );
        })}
      </div>

      <div className={styles.realEstateTypeGrid}>
        {REAL_ESTATE_PROPERTY_TYPES.map((type) => {
          const TypeIcon = type.icon;
          return (
            <button
              type="button"
              key={type.id}
              className={houseType === type.id ? styles.realEstateTypeActive : ""}
              onClick={() => setHouseType(type.id)}
            >
              <span><TypeIcon size={26} /></span>
              {type.label}
            </button>
          );
        })}
      </div>

      <section className={styles.realEstateRecentSection}>
        <div className={styles.realEstateSectionTitle}>
          <div>
            <span>서울시 공개 실거래</span>
            <h2>{selectedDistrict} 최근 {rentType === "jeonse" ? "전세" : rentType === "monthly" ? "월세" : "전월세"}</h2>
          </div>
          <button type="button" onClick={() => setView("map")}>지도에서 보기 <ChevronRight size={17} /></button>
        </div>
        <div className={styles.realEstateRecentScroller}>
          {recentTransactions.map((transaction) => (
            <RealEstateCompactCard key={transaction.id} transaction={transaction} usePyeong={usePyeong} />
          ))}
        </div>
      </section>

      <RealEstateFilterBar
        houseType={houseType}
        rentType={rentType}
        depositMax={depositMax}
        monthlyRentMax={monthlyRentMax}
        onHouseTypeChange={setHouseType}
        onRentTypeChange={setRentType}
        onDepositMaxChange={setDepositMax}
        onMonthlyRentMaxChange={setMonthlyRentMax}
        onRefresh={() => setRefreshKey((value) => value + 1)}
      />

      {notice ? <p className={styles.realEstateNotice}>{notice}</p> : null}
      <div className={styles.realEstateListToolbar}>
        <div>
          <strong>최근 실거래</strong>
          <span>{transactions.length}건</span>
        </div>
        <label className={styles.realEstatePyeongToggle}>
          <input type="checkbox" checked={usePyeong} onChange={(event) => setUsePyeong(event.target.checked)} />
          <span />
          평수로 보기
        </label>
      </div>

      {loading ? (
        <div className={styles.realEstateState}><RefreshCw size={24} className={styles.realEstateSpinner} /> 실거래를 불러오는 중이에요</div>
      ) : error ? (
        <div className={styles.realEstateState} role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>다시 시도</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.realEstateState}>
          <strong>조건에 맞는 실거래가 없어요</strong>
          <span>주택 유형이나 금액 조건을 바꿔보세요.</span>
        </div>
      ) : (
        <div className={styles.realEstateTransactionList}>
          {transactions.map((transaction) => (
            <RealEstateTransactionRow key={transaction.id} transaction={transaction} usePyeong={usePyeong} />
          ))}
        </div>
      )}
    </section>
  );
}
