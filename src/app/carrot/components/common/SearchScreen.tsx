import React, { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem, CommunityPost, LocalBusiness } from "@/types";
import { IconButton } from "./IconButton";
import { StateBlock } from "./StateBlock";
import { ProductRow } from "../trade";
import { CommunityPostRow } from "../community";

export interface SearchScreenProps {
  products: ProductListItem[];
  posts: CommunityPost[];
  businesses: LocalBusiness[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  onPostClick: (id: string) => void;
}

export function SearchScreen({
  products,
  posts,
  businesses,
  onBack,
  onProductClick,
  onPostClick,
}: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const matchedProducts = products.filter((product) => product.title.includes(normalized));
  const matchedPosts = posts.filter((post) => post.title.includes(normalized) || post.contentPreview.includes(normalized));
  const matchedBusinesses = businesses.filter((business) => business.name.includes(normalized) || business.summary.includes(normalized));

  return (
    <section className={styles.screen}>
      <div className={styles.searchTop}>
        <IconButton label="뒤로" onClick={onBack}>
          <ChevronLeft size={27} />
        </IconButton>
        <div className={styles.searchField}>
          <Search size={22} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="가지마켓 통합 검색" />
        </div>
      </div>
      {normalized.length === 0 ? (
        <section className={styles.searchHints}>
          <h2>추천 검색어</h2>
          {["갤럭시 탭", "포장주문", "동네친구", "세차", "가구"].map((item) => (
            <button type="button" key={item} onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </section>
      ) : (
        <div className={styles.searchResults}>
          <h2>중고거래</h2>
          {matchedProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onClick={() => onProductClick(product.id)}
            />
          ))}
          <h2>동네생활</h2>
          {matchedPosts.map((post) => (
            <CommunityPostRow key={post.id} post={post} onClick={() => onPostClick(post.id)} />
          ))}
          <h2>동네업체</h2>
          {matchedBusinesses.map((business) => (
            <article key={business.id} className={styles.searchBusiness}>
              <strong>{business.name}</strong>
              <span>{business.summary}</span>
            </article>
          ))}
          {matchedProducts.length + matchedPosts.length + matchedBusinesses.length === 0 && (
            <StateBlock
              title="검색 결과가 없어요"
              body="검색어를 줄이거나 다른 표현으로 찾아보세요."
              actionLabel="지우기"
              onAction={() => setQuery("")}
            />
          )}
        </div>
      )}
    </section>
  );
}
