import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem } from "@/types";
import { ScreenHeader, IconButton, StateBlock } from "../common";
import { ProductRow } from "../trade";

export interface FavoriteScreenProps {
  products: ProductListItem[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  title?: string;
  emptyTitle?: string;
  emptyBody?: string;
}

export function FavoriteScreen({
  products,
  onBack,
  onProductClick,
  title = "관심목록",
  emptyTitle = "관심 상품이 없어요",
  emptyBody = "마음에 드는 물건의 하트를 눌러 모아보세요.",
}: FavoriteScreenProps) {
  return (
    <section className={styles.screen}>
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
    </section>
  );
}
