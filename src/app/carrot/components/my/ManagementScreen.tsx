import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem, TradeStatus } from "@/types";
import { formatPrice } from "../../utils";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { ScreenHeader, IconButton, StateBlock, PullToRefreshIndicator } from "../common";
import { Thumbnail } from "../trade";

export interface ManagementScreenProps {
  title: string;
  products: ProductListItem[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  onStatusChange: (id: string, status: TradeStatus) => void;
  onRefresh?: () => Promise<void>;
}

export function ManagementScreen({
  title,
  products,
  onBack,
  onProductClick,
  onStatusChange,
  onRefresh,
}: ManagementScreenProps) {
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
      <div className={styles.managementSummary}>
        <span>판매중 {products.filter((product) => product.tradeStatus === "SALE").length}</span>
        <span>예약중 {products.filter((product) => product.tradeStatus === "RESERVED").length}</span>
        <span>거래완료 {products.filter((product) => product.tradeStatus === "SOLD").length}</span>
      </div>
      {products.length === 0 ? (
        <StateBlock
          title="판매 글이 없어요"
          body="첫 물건을 등록하면 판매관리에 바로 나타납니다."
          actionLabel="확인"
          onAction={onBack}
        />
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <article className={styles.manageRow} key={product.id}>
              <button type="button" onClick={() => onProductClick(product.id)}>
                <Thumbnail tone={product.thumbnailTone} label={product.thumbnailLabel} imageUrl={product.thumbnailUrl} />
                <div>
                  <h2>{product.title}</h2>
                  <p>{formatPrice(product)}</p>
                </div>
              </button>
              <div className={styles.segmented}>
                {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={product.tradeStatus === status ? styles.segmentActive : ""}
                    onClick={() => onStatusChange(product.id, status)}
                  >
                    {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "완료"}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
