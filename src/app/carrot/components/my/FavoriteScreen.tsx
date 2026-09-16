import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem } from "@/types";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { ScreenHeader, IconButton, StateBlock, PullToRefreshIndicator } from "../common";
import { ProductRow } from "../trade";

export interface FavoriteScreenProps {
  products: ProductListItem[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  title?: string;
  emptyTitle?: string;
  emptyBody?: string;
  // 최근 본 상품처럼 로컬 데이터만 쓰는 화면엔 넘기지 않는다 — 그럼 당겨서
  // 새로고침 제스처 자체가 비활성화된다.
  onRefresh?: () => Promise<void>;
}

export function FavoriteScreen({
  products,
  onBack,
  onProductClick,
  title = "관심목록",
  emptyTitle = "관심 상품이 없어요",
  emptyBody = "마음에 드는 물건의 하트를 눌러 모아보세요.",
  onRefresh,
}: FavoriteScreenProps) {
  const { pullOffset, isRefreshing, contentStyle, handlers } = usePullToRefresh(onRefresh);
  return (
    <section className={styles.screen} {...handlers}>
      <PullToRefreshIndicator pullOffset={pullOffset} isRefreshing={isRefreshing} />
      <div style={contentStyle}>
      <ScreenHeader
        title={title}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      {products.length === 0 ? (
        <StateBlock
          title={emptyTitle}
          body={emptyBody}
          actionLabel="돌아가기"
          onAction={onBack}
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
        </div>
      )}
      </div>
    </section>
  );
}
