"use client";

import React from "react";
import {
  Bell,
  ChevronRight,
  Menu,
  MessageCircle,
  MoreVertical,
  Search,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";
import type { TogetherCategory, TogetherPost } from "@/types";
import { COMMUNITY_FILTERS, COMMUNITY_TABS } from "../../constants";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";
import { StateBlock } from "../common/StateBlock";
import { ChipScroller } from "../trade/HomeScreen";
import { TogetherFeedCard } from "../together";

export function CommunityPostRow({ post, onClick }: { post: CommunityPost; onClick: () => void }) {
  return (
    <article className={styles.postRow}>
      <button type="button" onClick={onClick}>
        <div className={styles.postText}>
          <span className={styles.categoryBadge}>{post.categoryName}</span>
          <h2>{post.title}</h2>
          <p>{post.contentPreview}</p>
          <small>
            {post.neighborhoodName} · {post.createdAt} · 조회 {post.viewCount}
          </small>
        </div>
        {post.thumbnailTone && (
          <div className={`${styles.postThumb} ${styles[`tone_${post.thumbnailTone}` as keyof typeof styles] ?? ""}`}>
            {post.thumbnailCount && post.thumbnailCount > 1 ? <span>{post.thumbnailCount}</span> : null}
          </div>
        )}
        <MoreVertical size={18} className={styles.postMore} />
        {post.commentCount > 0 && (
          <span className={styles.commentCount}>
            <MessageCircle size={15} /> {post.commentCount}
          </span>
        )}
      </button>
    </article>
  );
}

export function PostSkeletonList() {
  return (
    <div className={styles.postList}>
      {[0, 1, 2].map((item) => (
        <div className={styles.skeletonPost} key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function CommunityScreen({
  activeTab,
  activeFilter,
  posts,
  togetherPosts = [],
  togetherCategoryFilter = "all",
  onTogetherCategoryChange,
  onOpenTogetherIntro,
  onTogetherPostClick,
  isLoading,
  onTabChange,
  onFilterChange,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onPostClick,
}: {
  activeTab: string;
  activeFilter: string;
  posts: CommunityPost[];
  togetherPosts?: TogetherPost[];
  togetherCategoryFilter?: TogetherCategory | "all";
  onTogetherCategoryChange?: (cat: TogetherCategory | "all") => void;
  onOpenTogetherIntro?: () => void;
  onTogetherPostClick?: (id: string) => void;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
  onFilterChange: (filter: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  onPostClick: (id: string) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="커뮤니티"
        actions={
          <>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={29} />
            </IconButton>
            <IconButton label="알림" onClick={onOpenNotifications}>
              <Bell size={28} />
              <span className={styles.notificationDot} />
            </IconButton>
            <IconButton label="메뉴" onClick={onOpenMenu}>
              <Menu size={31} />
            </IconButton>
          </>
        }
      />
      <nav className={styles.communityPillTabs} aria-label="커뮤니티 탭">
        {COMMUNITY_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.communityPillTab} ${activeTab === tab ? styles.communityPillTabActive : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
            {tab === "같이해요" && <em className={styles.communityNBadge}>N</em>}
          </button>
        ))}
      </nav>

      {/* Together Banner Slider - Visible on All / Together Tab */}
      <div
        onClick={onOpenTogetherIntro}
        className={styles.daangnTogetherBanner}
      >
        <div className={styles.daangnTogetherBannerLeft}>
          <span className={styles.daangnTogetherBannerIcon}>🤝</span>
          <div className={styles.daangnTogetherBannerText}>
            <span className={styles.daangnTogetherBannerSub}>입주민끼리 무엇이든 같이해보세요</span>
            <strong className={styles.daangnTogetherBannerTitle}>이웃과 같이해요</strong>
          </div>
        </div>
        <ChevronRight size={18} className={styles.togetherBannerArrow} />
      </div>
      <div className={styles.daangnBannerDots}>
        <span className={`${styles.daangnBannerDot} ${styles.daangnBannerDotActive}`} />
        <span className={styles.daangnBannerDot} />
      </div>

      {/* Notice Megaphone Line */}
      <div className={styles.communityNoticeLine} onClick={onOpenTogetherIntro}>
        <span>📢</span>
        <span>안녕하세요 😊 동네 커뮤니티는 가까운 이웃과 함께하는 공간입니다.</span>
      </div>

      {activeTab === "같이해요" ? (
        <>
          {/* Seed ChipScroller */}
          <ChipScroller
            items={["전체", "공동구매", "공동육아", "취미활동", "강아지 산책", "기타"]}
            value={
              togetherCategoryFilter === "group_buy"
                ? "공동구매"
                : togetherCategoryFilter === "childcare"
                ? "공동육아"
                : togetherCategoryFilter === "hobby"
                ? "취미활동"
                : togetherCategoryFilter === "pet_walk"
                ? "강아지 산책"
                : togetherCategoryFilter === "etc"
                ? "기타"
                : "전체"
            }
            onChange={(item) => {
              const map: Record<string, TogetherCategory | "all"> = {
                전체: "all",
                공동구매: "group_buy",
                공동육아: "childcare",
                취미활동: "hobby",
                "강아지 산책": "pet_walk",
                기타: "etc",
              };
              onTogetherCategoryChange?.(map[item] || "all");
            }}
          />

          {/* Together Post List */}
          {togetherPosts.length === 0 ? (
            <StateBlock
              title="등록된 모임이 아직 없어요"
              body="가까운 이웃과 함께할 모임을 직접 만들어보세요!"
              actionLabel="모임 만들기"
              onAction={() => onOpenTogetherIntro?.()}
            />
          ) : (
            <div className={styles.postList}>
              {togetherPosts.map((post) => (
                <TogetherFeedCard
                  key={post.id}
                  post={post}
                  onClick={() => onTogetherPostClick?.(post.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <ChipScroller items={COMMUNITY_FILTERS} value={activeFilter} onChange={onFilterChange} />
          {isLoading ? (
            <PostSkeletonList />
          ) : posts.length === 0 ? (
            <StateBlock
              title="아직 올라온 이야기가 없어요"
              body="필터를 추천으로 바꾸거나 첫 글을 남겨보세요."
              actionLabel="추천 보기"
              onAction={() => onFilterChange("추천")}
            />
          ) : (
            <div className={styles.postList}>
              {posts.map((post) => (
                <CommunityPostRow key={post.id} post={post} onClick={() => onPostClick(post.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
