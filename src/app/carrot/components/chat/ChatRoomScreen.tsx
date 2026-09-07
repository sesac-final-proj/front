import React, { useState, FormEvent } from "react";
import {
  ChevronLeft,
  Menu,
  ShieldAlert,
  MessageCircle,
  LogOut,
  CheckCircle2,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ChatRoom, ChatMessageUi } from "@/types";
import type { ChatTradeStatus } from "@/services/chatService";
import { ScreenHeader, IconButton } from "../common";
import { Thumbnail } from "../trade";

export const chatReportReasons = [
  "사기 의심돼요",
  "비매너 및 욕설/비방",
  "거래 약속을 안 지켜요",
  "기타 사유",
];

export interface ChatRoomScreenProps {
  room: ChatRoom;
  messages: ChatMessageUi[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendImage: (file: File) => void;
  onBack: () => void;
  otherUserId?: number;
  onLeave: () => void;
  onUpdateStatus: (tradeStatus: ChatTradeStatus) => void;
  onBlock: (userId: number) => void;
  onReport: (userId: number, reason: string) => void;
}

export function ChatRoomScreen({
  room,
  messages,
  draft,
  onDraftChange,
  onSubmit,
  onSendImage,
  onBack,
  otherUserId,
  onLeave,
  onUpdateStatus,
  onBlock,
  onReport,
}: ChatRoomScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState(chatReportReasons[0]);

  // room.title은 백엔드가 상품명으로 채워준다(카드/헤더 둘 다 room 응답 하나로 그림 —
  // 상세 목록(products)에서 따로 찾을 필요 없어서, 그 상품이 홈 목록에 없어도 안 깨진다).
  const priceLabel = room.productPrice == null ? "나눔" : `${room.productPrice.toLocaleString("ko-KR")}원`;
  const statusLabel =
    room.productTradeStatus === "RESERVED" ? "예약중" : room.productTradeStatus === "SOLD" ? "거래완료" : "판매중";
  const canSend = draft.trim().length > 0;

  return (
    <section className={styles.chatRoomScreen}>
      <ScreenHeader
        compact
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        title={
          <span className={styles.chatHeaderTitle}>
            <span className={styles.chatHeaderName}>
              {room.counterpartNickname ?? room.title}
              {room.counterpartMannerTemp != null && (
                <em className={styles.chatHeaderTemp}>{room.counterpartMannerTemp.toFixed(1)}°C</em>
              )}
            </span>
            {room.counterpartNeighborhoodName && (
              <span className={styles.chatHeaderSub}>{room.counterpartNeighborhoodName}</span>
            )}
          </span>
        }
        actions={
          <IconButton label="채팅 메뉴" onClick={() => setShowMenu(true)}>
            <Menu size={25} />
          </IconButton>
        }
      />
      {showMenu && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowMenu(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            {room.tradeRole === "SELLER" && (
              <div className={styles.segmented}>
                {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={room.productTradeStatus === status ? styles.segmentActive : ""}
                    onClick={() => {
                      setShowMenu(false);
                      onUpdateStatus(status);
                    }}
                  >
                    {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "거래완료"}
                  </button>
                ))}
              </div>
            )}
            {otherUserId !== undefined && (
              <div className={styles.productActionGroup}>
                <button
                  type="button"
                  className={styles.productActionBtn}
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm("이 사람을 차단하시겠어요?")) onBlock(otherUserId);
                  }}
                >
                  <ShieldAlert size={22} />
                  <span>차단하기</span>
                </button>
                <button
                  type="button"
                  className={styles.productActionBtn}
                  onClick={() => {
                    setShowMenu(false);
                    setShowReport(true);
                  }}
                >
                  <MessageCircle size={22} />
                  <span>신고하기</span>
                </button>
              </div>
            )}
            <div className={styles.productActionGroup}>
              <button
                type="button"
                className={`${styles.productActionBtn} ${styles.productActionReport}`}
                onClick={() => {
                  setShowMenu(false);
                  if (window.confirm("채팅방을 나가시겠어요? 대화 내용을 더 이상 볼 수 없어요.")) onLeave();
                }}
              >
                <LogOut size={22} />
                <span>채팅방 나가기</span>
              </button>
            </div>
            <button type="button" className={styles.productActionCloseBtn} onClick={() => setShowMenu(false)}>
              닫기
            </button>
          </div>
        </>
      )}
      {showReport && otherUserId !== undefined && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowReport(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 800 }}>신고 사유를 선택해주세요</h3>
            <div className={styles.reportReasonList}>
              {chatReportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`${styles.reportReasonItem} ${reportReason === reason ? styles.reportReasonItemSelected : ""}`}
                  onClick={() => setReportReason(reason)}
                >
                  <span>{reason}</span>
                  {reportReason === reason && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.albaDetailApplyBtn}
              style={{ width: "100%", height: "48px" }}
              onClick={() => {
                setShowReport(false);
                onReport(otherUserId, reportReason);
              }}
            >
              신고 제출하기
            </button>
            <button type="button" className={styles.productActionCloseBtn} onClick={() => setShowReport(false)}>
              취소
            </button>
          </div>
        </>
      )}
      <div className={styles.chatProductCard}>
        <Thumbnail tone="product" label={room.title} imageUrl={room.productThumbnailUrl} />
        <div>
          <h2>{room.title}</h2>
          <span>
            {statusLabel} · {priceLabel}
          </span>
        </div>
      </div>
      {/* 당근페이: 결제 로직은 추후 추가 예정 — 지금은 자리만 잡아둔 비활성 버튼. */}
      <button type="button" className={styles.chatPayButton} disabled title="곧 지원 예정이에요">
        <Wallet size={18} />
        당근페이
      </button>
      <div className={styles.messageStack}>
        {messages.map((message, index) => (
          <div key={`${message.text}-${index}`} className={message.mine ? styles.messageMine : styles.messageOther}>
            {message.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- NCP Object Storage 원본 URL
              <img src={message.imageUrl} alt="전송된 사진" className={styles.messageImage} />
            ) : (
              <p>{message.text}</p>
            )}
            <span>{message.time}</span>
          </div>
        ))}
      </div>
      <form className={styles.messageComposer} onSubmit={onSubmit}>
        <label className={styles.messageImageButton} aria-label="사진 보내기">
          <Plus size={20} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onSendImage(file);
              event.target.value = "";
            }}
          />
        </label>
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="메시지를 입력하세요"
        />
        <button
          type="submit"
          aria-label="보내기"
          className={canSend ? styles.messageSendBtnActive : styles.messageSendBtn}
        >
          <Send size={20} />
        </button>
      </form>
    </section>
  );
}
