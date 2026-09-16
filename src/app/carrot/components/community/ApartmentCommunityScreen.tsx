import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Search,
  Menu,
  Lock,
  UsersRound,
  Mail,
  Building2,
  ShoppingBag,
  BriefcaseBusiness,
  Building,
  Eye,
  Heart,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { TogetherCategory, TogetherPost } from "@/types";
import { ScreenHeader, IconButton, FloatingWriteButton } from "../common";
import { ChipScroller } from "../trade";
import { TogetherFeedCard } from "../together";

export interface ApartmentCommunityScreenProps {
  apartmentName?: string;
  onBack: () => void;
  onReverify?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onOpenPost?: (id: string) => void;
  onOpenTogetherIntro?: () => void;
  onOpenTogetherPost?: (id: string) => void;
  togetherPosts: TogetherPost[];
  onWrite: () => void;
}

export function ApartmentCommunityScreen({
  apartmentName = "내 아파트",
  onBack,
  onReverify,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  onOpenPost,
  onOpenTogetherIntro,
  onOpenTogetherPost,
  togetherPosts,
  onWrite,
}: ApartmentCommunityScreenProps) {
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [showMarketPosts, setShowMarketPosts] = useState<boolean>(true);
  const [togetherFilter, setTogetherFilter] = useState<TogetherCategory | "all">("all");

  const APT_TABS = ["전체", "자유 주제", "같이해요", "질문", "입주민 의견"];

  const mockAptPosts = [
    {
      id: "apt-1",
      category: "생활 정보",
      hasDot: true,
      title: `${apartmentName} 며칠전에 근처 맛집 방문했는데 정말 친절하고 맛있었어요! 입주민 분들께 추천드립니다.`,
      content: "가족들이랑 저녁 먹으러 갔는데 밑반찬도 정갈하고 사장님도 너무 친절하셨어요. 입주민 분들도 주말에 꼭 한번 가보세요!",
      time: "1시간 전",
      viewCount: 43,
      reactionCount: 6,
      commentCount: 4,
      isMarket: false,
    },
    {
      id: "apt-2",
      category: "중고거래",
      hasDot: false,
      title: "베이지 콤비 암막블라인드 깔끔하게 사용하기 좋아요",
      content: "창문에 설치하면 아늑한 분위기를 연출할 수 있어요. 실사용 기간 2개월 미만이라 상태 거의 새것입니다.",
      price: "15,000원",
      time: "3시간 전",
      thumbnail: "warm",
      viewCount: 22,
      reactionCount: 2,
      commentCount: 2,
      isMarket: true,
    },
    {
      id: "apt-3",
      category: "가입인사",
      hasDot: false,
      title: `안녕하세요 ${apartmentName}에 새로 입주한 주민입니다! 잘 부탁드려요 😊`,
      content: "이번 주에 103동으로 이사 오게 되었습니다. 좋은 이웃분들과 즐겁게 소통하고 지내고 싶습니다.",
      time: "5시간 전",
      viewCount: 6,
      reactionCount: 8,
      commentCount: 5,
      isMarket: false,
    },
    {
      id: "apt-4",
      category: "중고거래",
      hasDot: false,
      title: "이솝 엘레오스 바디 클렌저 & 레저렉션 핸드워시 새상품 세트",
      content: "은은한 시트러스 아로마 향으로 기분 전환에 좋아요. 박스 미개봉 정품이라 선물용으로도 좋습니다.",
      price: "42,000원",
      time: "12시간 전",
      thumbnail: "botanical",
      photoCount: 2,
      viewCount: 30,
      reactionCount: 4,
      commentCount: 1,
      isMarket: true,
    },
    {
      id: "apt-5",
      category: "중고거래",
      hasDot: false,
      title: "프라다 사피아노 지갑 핑크 새상품 풀박스",
      content: "보증서와 정품 케이스 풀박스 보관 중입니다. 단지 내 직거래 가능하신 분께 소정의 네고도 해드립니다.",
      price: "280,000원",
      time: "1일 전",
      thumbnail: "leather",
      photoCount: 2,
      viewCount: 16,
      reactionCount: 5,
      commentCount: 3,
      isMarket: true,
    },
  ];

  const displayedPosts = mockAptPosts.filter((post) => {
    if (!showMarketPosts && post.isMarket) return false;
    if (activeTab === "자유 주제") return post.category === "생활 정보" || post.category === "가입인사";
    if (activeTab === "질문") return post.category === "질문";
    if (activeTab === "입주민 의견") return post.category === "생활 정보";
    return true;
  });

  return (
    <section className={styles.screen}>
      {/* Header */}
      <ScreenHeader
        title={apartmentName}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          <>
            <IconButton label="채팅" onClick={onOpenNotifications}>
              <MessageCircle size={25} />
            </IconButton>
            <IconButton label="검색" onClick={onOpenSearch}>
              <Search size={25} />
            </IconButton>
            <IconButton label="메뉴" onClick={onOpenMenu}>
              <Menu size={27} />
            </IconButton>
          </>
        }
      />

      {/* Subheader Meta */}
      <div className={styles.aptHeaderMeta}>
        <Lock size={13} />
        <span>입주민 비공개 · 게시글 109 · <strong className={styles.aptMetaActive}>15시간 전 활동</strong></span>
        {onReverify && (
          <button
            type="button"
            onClick={onReverify}
            style={{
              marginLeft: "auto",
              border: 0,
              background: "transparent",
              color: "var(--color-primary)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            아파트 변경
          </button>
        )}
      </div>

      {/* Action Buttons: 이웃 158 / 초대 */}
      <div className={styles.aptActionRow}>
        <button type="button" className={styles.aptActionBtn}>
          <UsersRound size={16} />
          <span>이웃 158</span>
        </button>
        <button type="button" className={styles.aptActionBtn}>
          <Mail size={16} />
          <span>초대</span>
        </button>
      </div>

      {/* 4 Shortcut Grid */}
      <div className={styles.aptShortcutGrid}>
        <button type="button" className={styles.aptShortcutItem}>
          <div className={styles.aptShortcutIconWrap}>
            <Building2 size={20} />
          </div>
          <span>단지 정보</span>
        </button>
        <button type="button" className={styles.aptShortcutItem} onClick={() => setActiveTab("전체")}>
          <div className={styles.aptShortcutIconWrap}>
            <ShoppingBag size={20} />
            <span className={styles.aptShortcutDot} />
          </div>
          <span>중고거래</span>
        </button>
        <button type="button" className={styles.aptShortcutItem}>
          <div className={styles.aptShortcutIconWrap}>
            <BriefcaseBusiness size={20} />
          </div>
          <span>알바</span>
        </button>
        <button type="button" className={styles.aptShortcutItem} onClick={() => setActiveTab("자유 주제")}>
          <div className={styles.aptShortcutIconWrap}>
            <Building size={20} />
            <span className={styles.aptShortcutDot} />
          </div>
          <span>오픈 게시판</span>
        </button>
      </div>

      {/* Together Banner Slider */}
      <div
        onClick={onOpenTogetherIntro}
        className={styles.daangnTogetherBanner}
      >
        <div className={styles.daangnTogetherBannerLeft}>
          <span className={styles.daangnTogetherBannerIcon}>🤝</span>
          <div className={styles.daangnTogetherBannerText}>
            <span className={styles.daangnTogetherBannerSub}>입주민끼리 무엇이든 같이해보세요</span>
            <strong className={styles.daangnTogetherBannerTitle}>아파트 같이해요</strong>
          </div>
        </div>
        <ChevronRight size={18} className={styles.togetherBannerArrow} />
      </div>
      <div className={styles.daangnBannerDots}>
        <span className={`${styles.daangnBannerDot} ${styles.daangnBannerDotActive}`} />
        <span className={styles.daangnBannerDot} />
      </div>

      {/* Notice Megaphone */}
      <div className={styles.communityNoticeLine} onClick={onOpenTogetherIntro}>
        <span>📢</span>
        <span>안녕하세요 😊 아파트 커뮤니티는 같은 단지에 거주하는 입주민 전용 공간입니다.</span>
      </div>

      {/* Filter Tabs */}
      <nav className={styles.communityPillTabs} aria-label="아파트 커뮤니티 탭">
        {APT_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`${styles.communityPillTab} ${activeTab === tab ? styles.communityPillTabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "같이해요" && <em className={styles.communityNBadge}>N</em>}
          </button>
        ))}
      </nav>

      {/* 중고거래글 보기 Toggle */}
      {activeTab !== "같이해요" && (
        <div className={styles.communityToggleRow}>
          <button
            type="button"
            className={`${styles.seedToggleSwitch} ${showMarketPosts ? styles.seedToggleSwitchActive : ""}`}
            onClick={() => setShowMarketPosts(!showMarketPosts)}
            aria-label="중고거래글 보기 토글"
          >
            <span className={styles.seedToggleThumb} />
          </button>
          <span>중고거래글 보기</span>
        </div>
      )}

      {/* Feed List */}
      {activeTab === "같이해요" ? (
        <>
          <ChipScroller
            items={["전체", "공동구매", "공동육아", "취미활동", "강아지 산책", "기타"]}
            value={
              togetherFilter === "group_buy"
                ? "공동구매"
                : togetherFilter === "childcare"
                ? "공동육아"
                : togetherFilter === "hobby"
                ? "취미활동"
                : togetherFilter === "pet_walk"
                ? "강아지 산책"
                : togetherFilter === "etc"
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
              setTogetherFilter(map[item] || "all");
            }}
          />

          <div className={styles.postList}>
            {togetherPosts.map((post) => (
              <TogetherFeedCard
                key={post.id}
                post={post}
                onClick={() => onOpenTogetherPost?.(post.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={styles.aptPostList}>
          {displayedPosts.map((p) => (
            <article key={p.id} className={styles.postRow}>
              <button
                type="button"
                className={styles.postRowButton}
                onClick={() => onOpenPost?.(p.id)}
              >
                <div className={styles.postText}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    {p.hasDot && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                    )}
                    <span className={styles.categoryBadge}>{p.category}</span>
                    {p.isMarket && p.price && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{p.price}</span>
                    )}
                  </div>
                  <h2>{p.title}</h2>
                  {p.content && <p>{p.content}</p>}
                  <small>
                    {apartmentName} · {p.time} · 조회 {p.viewCount}
                  </small>
                </div>
                {p.thumbnail && (
                  <div className={`${styles.postThumb} ${styles[`tone_${p.thumbnail}` as keyof typeof styles] ?? ""}`}>
                    {p.photoCount && p.photoCount > 1 ? <span>{p.photoCount}</span> : null}
                  </div>
                )}
                {(p.reactionCount > 0 || p.commentCount > 0) && (
                  <span className={styles.commentCount}>
                    {p.reactionCount > 0 && (
                      <span>
                        <Heart size={14} /> {p.reactionCount}
                      </span>
                    )}
                    {p.commentCount > 0 && (
                      <span>
                        <MessageCircle size={14} /> {p.commentCount}
                      </span>
                    )}
                  </span>
                )}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Floating Action Button with Tooltip */}
      <FloatingWriteButton
        showTogetherTooltip={true}
        onTooltipClick={onOpenTogetherIntro}
        onClick={onWrite}
      />
    </section>
  );
}
