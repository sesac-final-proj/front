import React from "react";
import { ChevronLeft, Bell, Settings, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ChatRoom } from "@/types";
import { CHAT_FILTERS } from "../../constants";
import { formatBadge } from "../../utils";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { ScreenHeader, IconButton, StateBlock, Avatar, PullToRefreshIndicator } from "../common";
import { ChipScroller } from "../trade";

export function ChatSkeletonList() {
  return (
    <div className={styles.chatList}>
      {[0, 1, 2, 3].map((item) => (
        <div className={styles.skeletonChat} key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export interface ChatsScreenProps {
  rooms: ChatRoom[];
  activeFilter: string;
  isLoading: boolean;
  unreadCount: number;
  onFilterChange: (filter: string) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenChat: (id: string) => void;
  title?: string;
  onBack?: () => void;
  onRefresh?: () => Promise<void>;
}

export function ChatsScreen({
  rooms,
  activeFilter,
  isLoading,
  unreadCount,
  onFilterChange,
  onOpenNotifications,
  onOpenSettings,
  onOpenChat,
  title = "채팅",
  onBack,
  onRefresh,
}: ChatsScreenProps) {
  // onBack이 있으면 "내 상품에 걸린 채팅만" 보는 필터링된 화면 —
  // 하단탭의 전체 채팅 목록과 헷갈리지 않게 뒤로가기와 전용 타이틀을 보여주고,
  // 여기선 의미 없는 필터/프로모 배너는 생략한다. 그 화면은 들어갈 때마다 새로
  // 받아오는 목록이라 당겨서 새로고침도 필요 없다(onRefresh 미전달).
  const scoped = Boolean(onBack);
  const { pullOffset, isRefreshing, contentStyle, handlers } = usePullToRefresh(onRefresh);
  return (
    <section className={styles.screen} {...handlers}>
      <PullToRefreshIndicator pullOffset={pullOffset} isRefreshing={isRefreshing} />
      <div style={contentStyle}>
      <ScreenHeader
        title={title}
        compact={scoped}
        leading={
          scoped ? (
            <IconButton label="뒤로" onClick={onBack}>
              <ChevronLeft size={27} />
            </IconButton>
          ) : undefined
        }
        actions={
          scoped ? undefined : (
            <>
              <IconButton label="채팅 알림" onClick={onOpenNotifications}>
                <Bell size={28} />
                {unreadCount > 0 && <span className={styles.notificationDot} />}
              </IconButton>
              <IconButton label="설정" onClick={onOpenSettings}>
                <Settings size={29} />
              </IconButton>
            </>
          )
        }
      />
      {!scoped && (
        <>
          <div className={styles.filterLine}>
            <button type="button" className={styles.roundTool} aria-label="필터 설정">
              <SlidersHorizontal size={23} />
            </button>
            <ChipScroller items={CHAT_FILTERS} value={activeFilter} onChange={onFilterChange} />
          </div>
          <div className={styles.chatPromo}>
            <strong>가지마켓 동네 혜택</strong>
            <span>위례에서 이번 주 사용할 수 있는 쿠폰을 확인하세요</span>
          </div>
        </>
      )}
      {isLoading ? (
        <ChatSkeletonList />
      ) : rooms.length === 0 ? (
        scoped ? (
          <StateBlock title="아직 문의한 사람이 없어요" body="구매를 원하는 분이 채팅을 걸면 여기에 표시돼요." />
        ) : (
          <StateBlock
            title="해당 채팅이 없어요"
            body="다른 필터를 선택하거나 새 거래를 시작해보세요."
            actionLabel="전체 보기"
            onAction={() => onFilterChange("전체")}
          />
        )
      ) : (
        <div className={styles.chatList}>
          {rooms.map((room) => (
            <button type="button" key={room.id} className={styles.chatRow} onClick={() => onOpenChat(room.id)}>
              <Avatar tone={room.avatarTone} />
              <div>
                <h2 className={room.unreadCount > 0 ? styles.unreadTitle : ""}>
                  {room.title}
                  {room.verified && <CheckCircle2 size={18} className={styles.verified} fill="currentColor" />}
                  <span>{room.lastMessageAt}</span>
                </h2>
                <p>{room.lastMessage}</p>
              </div>
              {room.unreadCount > 0 && <span className={styles.unreadBadge}>{formatBadge(room.unreadCount)}</span>}
            </button>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
