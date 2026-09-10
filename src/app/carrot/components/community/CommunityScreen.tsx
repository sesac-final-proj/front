"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Flag,
  Trash2,
  MapPin,
  Menu,
  Heart,
  MessageCircle,
  MoreVertical,
  Search,
  ShieldCheck,
  Sparkles,
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

export function CommunityPostRow({
  post,
  onClick,
  onEdit,
  onDelete,
  onReport,
  currentUserId,
}: {
  post: CommunityPost;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  currentUserId?: number | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMine =
    typeof currentUserId === "number" && typeof post.authorId === "number"
      ? post.authorId === currentUserId
      : Boolean(post.mine);

  useEffect(() => {
    if (!menuOpen) return;
    function closeMenu(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [menuOpen]);

  function choose(action?: () => void) {
    setMenuOpen(false);
    action?.();
  }

  return (
    <article className={styles.postRow}>
      <button type="button" className={styles.postRowButton} onClick={onClick}>
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
        {(post.reactionCount > 0 || post.commentCount > 0) && (
          <span className={styles.commentCount}>
            {post.reactionCount > 0 && (
              <span className={post.isReacted ? styles.communityStatActive : undefined}>
                <Heart size={15} fill={post.isReacted ? "currentColor" : "none"} /> {post.reactionCount}
              </span>
            )}
            {post.commentCount > 0 && (
              <span>
                <MessageCircle size={15} /> {post.commentCount}
              </span>
            )}
          </span>
        )}
      </button>
      <div className={styles.communityPostMenuWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.communityPostMenuButton}
          aria-label="게시글 메뉴"
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
        >
          <MoreVertical size={18} />
        </button>
        {menuOpen && (
          <div className={styles.communityPostMenu} role="menu">
            {isMine && (
              <>
                <button type="button" role="menuitem" onClick={() => choose(onEdit)}>
                  <Edit3 size={15} /> 수정하기
                </button>
                <button type="button" role="menuitem" className={styles.communityPostMenuDanger} onClick={() => choose(onDelete)}>
                  <Trash2 size={15} /> 삭제하기
                </button>
              </>
            )}
            {!isMine && (
              <button type="button" role="menuitem" className={styles.communityPostMenuDanger} onClick={() => choose(onReport)}>
                <Flag size={15} /> 신고하기
              </button>
            )}
          </div>
        )}
      </div>
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
  onPostEdit,
  onPostDelete,
  onPostReport,
  currentUserId,
  verifiedApartment,
  onOpenApartment,
  activeNeighborhood = "개봉동",
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
  onPostEdit?: (id: string) => void;
  onPostDelete?: (post: CommunityPost) => void;
  onPostReport?: (post: CommunityPost) => void;
  currentUserId?: number | null;
  verifiedApartment?: string | null;
  onOpenApartment?: () => void;
  activeNeighborhood?: string;
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
            {tab === "아파트" && <em className={styles.communityNBadge} style={{ background: "#4dabf7" }}>APT</em>}
            {tab === "같이해요" && <em className={styles.communityNBadge}>N</em>}
          </button>
        ))}
      </nav>

      {/* 🏢 별도의 아파트 커뮤니티 전용 독립 섹션 (전체 탭 상단 배너 카드) */}
      {activeTab === "전체" && (
        <div
          onClick={onOpenApartment}
          style={{
            margin: "12px 16px 8px",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #f0f7ff 0%, #e7f2ff 100%)",
            border: "1px solid #d0ebff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(34, 139, 230, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#228be6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1c7ed6",
                    backgroundColor: "#e7f5ff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {verifiedApartment ? "인증 입주민" : "입주민 전용"}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1971c2" }}>
                  {verifiedApartment ? `${verifiedApartment} 커뮤니티` : "우리 아파트 커뮤니티"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#495057" }}>
                {verifiedApartment
                  ? "우리 단지 이웃과 소통하는 공간으로 가기"
                  : "GPS로 내 아파트 인증하고 단지 전용 소통 공간 열기"}
              </p>
            </div>
          </div>
          <ChevronRight size={20} color="#228be6" />
        </div>
      )}

      {/* Together Banner Slider - Visible on All / Together Tab */}
      {activeTab !== "아파트" && (
        <>
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
        </>
      )}

      {/* Notice Megaphone Line */}
      <div className={styles.communityNoticeLine} onClick={onOpenTogetherIntro}>
        <span>📢</span>
        <span>안녕하세요 😊 동네 커뮤니티는 가까운 이웃과 함께하는 공간입니다.</span>
      </div>

      {activeTab === "아파트" ? (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {verifiedApartment ? (
            /* 1. 인증된 입주민 전용 공간 */
            <div
              style={{
                borderRadius: "20px",
                background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
                border: "1.5px solid #d0ebff",
                padding: "24px 20px",
                boxShadow: "0 4px 16px rgba(34, 139, 230, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: "#e7f5ff",
                    color: "#1971c2",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <CheckCircle2 size={13} /> 인증 완료
                </span>
                <span style={{ fontSize: "12px", color: "#868e96" }}>실거주 입주민 전용</span>
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 800, margin: "0 0 6px", color: "#1864ab" }}>
                {verifiedApartment}
              </h2>
              <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#495057", lineHeight: 1.5 }}>
                우리 아파트 주민들만 모여 소통하는 공간입니다.<br />
                층간소음, 주차, 단지 소식을 이웃과 함께 나눠보세요.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f1f3f5" }}>
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>📢</div>
                  <strong style={{ fontSize: "13px", display: "block" }}>단지 소식·공지</strong>
                  <span style={{ fontSize: "11px", color: "#868e96" }}>관리사무소 안내</span>
                </div>
                <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f1f3f5" }}>
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>🚗</div>
                  <strong style={{ fontSize: "13px", display: "block" }}>주차·충전기</strong>
                  <span style={{ fontSize: "11px", color: "#868e96" }}>지하주차장 소통</span>
                </div>
                <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f1f3f5" }}>
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>🤫</div>
                  <strong style={{ fontSize: "13px", display: "block" }}>층간소음 배려</strong>
                  <span style={{ fontSize: "11px", color: "#868e96" }}>이웃 간 배려 문화</span>
                </div>
                <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f1f3f5" }}>
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>🎁</div>
                  <strong style={{ fontSize: "13px", display: "block" }}>단지 나눔·공구</strong>
                  <span style={{ fontSize: "11px", color: "#868e96" }}>배송비 아끼는 공구</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  onClick={onOpenApartment}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "#228be6",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(34, 139, 230, 0.3)",
                  }}
                >
                  {verifiedApartment} 라운지 입장하기
                </button>
                <button
                  type="button"
                  onClick={onOpenApartment}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: "transparent",
                    color: "#868e96",
                    border: "none",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  다른 아파트로 재인증하기
                </button>
              </div>
            </div>
          ) : (
            /* 2. 미인증 상태: 아파트 인증 유도 섹션 */
            <div
              style={{
                borderRadius: "20px",
                background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
                border: "1.5px solid #d0ebff",
                padding: "26px 20px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(34, 139, 230, 0.08)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "18px",
                  backgroundColor: "#228be6",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 4px 12px rgba(34, 139, 230, 0.25)",
                }}
              >
                <Building2 size={30} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px", color: "#1864ab" }}>
                입주민 전용 커뮤니티
              </h2>
              <p style={{ fontSize: "14px", color: "#495057", lineHeight: 1.6, margin: "0 0 20px" }}>
                실제 거주 중인 아파트를 GPS로 인증하면<br />
                외부인은 볼 수 없는 <strong>우리 단지 비밀 라운지</strong>가 열려요!
              </p>

              <button
                type="button"
                onClick={onOpenApartment}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "14px",
                  backgroundColor: "#228be6",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(34, 139, 230, 0.3)",
                  marginBottom: "20px",
                }}
              >
                <MapPin size={18} /> GPS로 내 아파트 인증하기
              </button>

              <div
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1971c2", display: "block", marginBottom: "6px" }}>
                  ✨ 아파트 인증 시 제공되는 혜택
                </span>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#495057", lineHeight: 1.7 }}>
                  <li>철저한 GPS 위치 기반으로 <strong>인증된 입주민만 이용</strong></li>
                  <li>층간소음, 주차 문제, 단지 하자 등 솔직한 이웃 소통</li>
                  <li>가까운 동·호수 이웃과의 단지 내 직거래 및 공동구매</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "같이해요" ? (
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
                <CommunityPostRow
                  key={post.id}
                  post={post}
                  onClick={() => onPostClick(post.id)}
                  onEdit={() => onPostEdit?.(post.id)}
                  onDelete={() => onPostDelete?.(post)}
                  onReport={() => onPostReport?.(post)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
