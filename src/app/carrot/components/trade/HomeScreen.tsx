"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Eye,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductFilters, ProductListItem } from "../../types";
import {
  DEFAULT_PRODUCT_FILTERS,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  PRICE_FILTER_STEP,
  PRODUCT_FILTERS,
} from "../../constants";
import { formatPrice, hasActiveProductFilters } from "../../utils";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { IconButton } from "../common/IconButton";
import { PullToRefreshIndicator } from "../common/PullToRefreshIndicator";
import { ScreenHeader } from "../common/ScreenHeader";
import { StateBlock } from "../common/StateBlock";

export function ChipScroller({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (item: string) => void;
}) {
  return (
    <div className={styles.chipScroller}>
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={`${styles.chip} ${value === item ? styles.chipActive : ""}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function PriceRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const percent = (value: number) => ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.priceSlider}>
      <div className={styles.priceSliderTrack}>
        <div
          className={styles.priceSliderRange}
          style={{ left: `${percent(valueMin)}%`, right: `${100 - percent(valueMax)}%` }}
        />
      </div>
      <input
        type="range"
        className={styles.priceSliderInput}
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(event) => onChange(Math.min(Number(event.target.value), valueMax - step), valueMax)}
      />
      <input
        type="range"
        className={styles.priceSliderInput}
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(event) => onChange(valueMin, Math.max(Number(event.target.value), valueMin + step))}
      />
    </div>
  );
}

export function Thumbnail({ tone, label, imageUrl }: { tone: string; label: string; imageUrl?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- NCP Object Storage 원본 URL, next/image 도메인 설정 없이 바로 사용
    return <img src={imageUrl} alt={label} className={styles.thumbnail} />;
  }
  return (
    <div className={`${styles.thumbnail} ${styles[`tone_${tone}` as keyof typeof styles] ?? ""}`}>
      <span>{label}</span>
    </div>
  );
}

export function ProductRow({
  product,
  onClick,
}: {
  product: ProductListItem;
  onClick: () => void;
}) {
  return (
    <article className={styles.productRow}>
      <button type="button" className={styles.productTapArea} onClick={onClick}>
        <Thumbnail tone={product.thumbnailTone} label={product.thumbnailLabel} imageUrl={product.thumbnailUrl} />
        <div className={styles.productInfo}>
          <div className={styles.rowTopLine}>
            <h2>{product.title}</h2>
            <MoreVertical size={19} className={styles.moreIcon} />
          </div>
          <p className={styles.metaLine}>
            {product.neighborhoodName}
            {product.distanceKm !== undefined ? ` · ${product.distanceKm}km` : ""}
            {" · "}
            {product.createdAt}
          </p>
          <div className={styles.priceLine}>
            {product.tradeStatus === "SALE" && product.tradeType === "FREE" && (
              <span className={styles.freeBadge}>나눔</span>
            )}
            {product.tradeStatus === "RESERVED" && <span className={styles.statusBadge}>예약중</span>}
            {product.tradeStatus === "SOLD" && <span className={styles.soldBadge}>거래완료</span>}
            <strong>{formatPrice(product)}</strong>
          </div>
          {product.purchaseMode === "DIRECT" && <span className={styles.directBadge}>바로구매</span>}
          <div className={styles.productStats}>
            {product.chatCount > 0 && (
              <span>
                <MessageCircle size={14} /> {product.chatCount}
              </span>
            )}
            {product.favoriteCount + product.interestCount > 0 && (
              <span>
                <Heart size={14} fill={product.isFavorite ? "currentColor" : "none"} />{" "}
                {product.favoriteCount + product.interestCount}
              </span>
            )}
            {product.viewCount > 0 && (
              <span>
                <Eye size={14} /> {product.viewCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}

export function ProductSkeletonList() {
  return (
    <div className={styles.productList}>
      {[0, 1, 2, 3].map((item) => (
        <div className={styles.skeletonRow} key={item}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function HomeScreen({
  isLoading,
  hasError,
  activeNeighborhood,
  secondaryNeighborhood,
  productFilter,
  products,
  onRefresh,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onOpenRegion,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onFilterChange,
  onProductClick,
  onRetry,
  categories,
  filters,
  onApplyFilters,
}: {
  isLoading: boolean;
  hasError: boolean;
  activeNeighborhood: string;
  secondaryNeighborhood: string | null;
  productFilter: string;
  products: ProductListItem[];
  onRefresh: () => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onOpenRegion: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onFilterChange: (filter: string) => void;
  onProductClick: (id: string) => void;
  onRetry: () => void;
  categories: string[];
  filters: ProductFilters;
  onApplyFilters: (filters: ProductFilters) => void;
}) {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);

  function openFilterSheet() {
    setDraftFilters(filters);
    setShowFilterSheet(true);
  }

  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelNode || !hasMore) return;
    const scrollRoot = sentinelNode.closest<HTMLElement>("[data-app-scroll]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: scrollRoot, rootMargin: "400px" },
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, hasMore, onLoadMore]);

  // 당겨서 새로고침(pull-to-refresh) — PWA(standalone)에서는 브라우저 기본 당겨서
  // 새로고침이 globals.css의 overscroll-behavior:none에 막혀 있어서(위로 스와이프할 때
  // 화면이 고무줄처럼 밀리는 것도 같이 막아주는 값이라 이건 유지) 직접 구현한다.
  // 맨 위(scrollTop 0)에서 아래로 당길 때만 동작하고, 그 외엔 평소처럼 그냥 스크롤된다.
  const { pullOffset, isRefreshing, contentStyle: pullContentStyle, handlers: pullHandlers } =
    usePullToRefresh(onRefresh);

  return (
    <section className={styles.screen} {...pullHandlers}>
      <PullToRefreshIndicator pullOffset={pullOffset} isRefreshing={isRefreshing} />
      <div style={pullContentStyle}>
      <ScreenHeader
        title={
          <button type="button" className={styles.neighborhoodSwitch} onClick={onOpenRegion}>
            <span>{activeNeighborhood}</span>
            {secondaryNeighborhood && <span>· {secondaryNeighborhood}</span>}
            <ChevronDown size={16} />
          </button>
        }
        leading={<MapPin className={styles.titlePin} size={28} fill="currentColor" />}
        actions={
          <>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={28} />
            </IconButton>
            <IconButton label="알림" onClick={onOpenNotifications}>
              <Bell size={27} />
              <span className={styles.notificationDot} />
            </IconButton>
            <IconButton label="전체 메뉴" onClick={onOpenMenu}>
              <Menu size={30} />
            </IconButton>
          </>
        }
      />
      <div className={styles.filterLine}>
        <button
          type="button"
          className={styles.roundTool}
          aria-label="상세 필터"
          onClick={openFilterSheet}
        >
          <SlidersHorizontal size={23} />
          {hasActiveProductFilters(filters) && <span className={styles.notificationDot} />}
        </button>
        <ChipScroller items={PRODUCT_FILTERS} value={productFilter} onChange={onFilterChange} />
      </div>
      </div>

      {showFilterSheet && (
        <>
          <div className={styles.filterSheetBackdrop} onClick={() => setShowFilterSheet(false)} />
          <div className={styles.filterSheetPanel} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>

            <span className={styles.filterSectionLabel}>카테고리</span>
            <div className={styles.filterChipRow}>
              {["전체", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.filterChip} ${
                    (c === "전체" && !draftFilters.category) || draftFilters.category === c
                      ? styles.filterChipActive
                      : ""
                  }`}
                  onClick={() => setDraftFilters((prev) => ({ ...prev, category: c === "전체" ? undefined : c }))}
                >
                  {c}
                </button>
              ))}
            </div>

            <span className={styles.filterSectionLabel}>거래방식</span>
            <div className={styles.filterChipRow}>
              {([
                { label: "전체", value: undefined },
                { label: "판매", value: "SALE" as const },
                { label: "나눔", value: "FREE" as const },
              ]).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={`${styles.filterChip} ${draftFilters.tradeType === option.value ? styles.filterChipActive : ""}`}
                  onClick={() => setDraftFilters((prev) => ({ ...prev, tradeType: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <span className={styles.filterSectionLabel}>가격범위</span>
            <div className={styles.priceSliderValues}>
              <span>{(draftFilters.priceMin ?? PRICE_FILTER_MIN).toLocaleString()}원</span>
              <span>
                {draftFilters.priceMax === undefined || draftFilters.priceMax >= PRICE_FILTER_MAX
                  ? `${PRICE_FILTER_MAX.toLocaleString()}원 이상`
                  : `${draftFilters.priceMax.toLocaleString()}원`}
              </span>
            </div>
            <PriceRangeSlider
              min={PRICE_FILTER_MIN}
              max={PRICE_FILTER_MAX}
              step={PRICE_FILTER_STEP}
              valueMin={draftFilters.priceMin ?? PRICE_FILTER_MIN}
              valueMax={draftFilters.priceMax ?? PRICE_FILTER_MAX}
              onChange={(min, max) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  priceMin: min <= PRICE_FILTER_MIN ? undefined : min,
                  priceMax: max >= PRICE_FILTER_MAX ? undefined : max,
                }))
              }
            />

            <span className={styles.filterSectionLabel}>정렬</span>
            <div className={styles.filterChipRow}>
              {([
                { label: "최신순", value: "latest" as const },
                { label: "가격 낮은순", value: "price_asc" as const },
                { label: "가격 높은순", value: "price_desc" as const },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.filterChip} ${draftFilters.sort === option.value ? styles.filterChipActive : ""}`}
                  onClick={() => setDraftFilters((prev) => ({ ...prev, sort: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <section className={styles.toggleCard}>
              <button
                type="button"
                onClick={() => setDraftFilters((prev) => ({ ...prev, excludeSold: !prev.excludeSold }))}
              >
                거래완료 제외
                <span className={draftFilters.excludeSold ? styles.switchOn : ""} />
              </button>
            </section>

            <button
              type="button"
              className={styles.filterApplyBtn}
              onClick={() => {
                onApplyFilters(draftFilters);
                setShowFilterSheet(false);
              }}
            >
              적용하기
            </button>
            <button
              type="button"
              className={styles.productActionCloseBtn}
              onClick={() => {
                onApplyFilters(DEFAULT_PRODUCT_FILTERS);
                setShowFilterSheet(false);
              }}
            >
              필터 초기화
            </button>
          </div>
        </>
      )}

      <div style={pullContentStyle}>
      {hasError ? (
        <StateBlock
          title="목록을 불러오지 못했어요"
          body="기존 데이터는 유지됩니다. 연결을 확인한 뒤 다시 시도해주세요."
          actionLabel="재시도"
          onAction={onRetry}
        />
      ) : isLoading ? (
        <ProductSkeletonList />
      ) : products.length === 0 ? (
        <StateBlock
          title="조건에 맞는 물건이 없어요"
          body="필터를 전체로 바꾸거나 다른 동네를 선택해보세요."
          actionLabel="전체 보기"
          onAction={() => onFilterChange("전체")}
        />
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onClick={() => onProductClick(product.id)}
            />
          ))}
          {hasMore && (
            <div ref={setSentinelNode} className={styles.loadMoreSentinel}>
              {isLoadingMore && <span>불러오는 중...</span>}
            </div>
          )}
        </div>
      )}
      </div>
    </section>
  );
}
