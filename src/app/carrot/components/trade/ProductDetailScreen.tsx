"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ProductListItem, TradeStatus } from "../../types";
import { KAKAO_MAP_JS_KEY } from "../../constants";
import { formatPrice } from "../../utils";
import { loadKakaoMapScript } from "../map";
import { IconButton } from "../common/IconButton";
import { MannerTemperatureModal, getMannerColor } from "../common/MannerTemperatureModal";

function getMannerEmoji(temp: number): string {
  if (temp < 36.0) return "😠";
  if (temp < 40.0) return "🙂";
  if (temp < 70.0) return "🥰";
  return "🔥";
}

export function TradePlaceMap({ query, neighborhoodName }: { query: string; neighborhoodName: string }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (!KAKAO_MAP_JS_KEY) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setUsedFallback(false);

    const params = new URLSearchParams({ query });
    if (neighborhoodName) params.set("fallback", neighborhoodName);

    Promise.all([
      fetch(`/api/geocode?${params}`).then((res) => (res.ok ? res.json() : null)),
      loadKakaoMapScript(KAKAO_MAP_JS_KEY),
    ])
      .then(([geo]) => {
        const kakaoMaps = (window as any).kakao?.maps;
        if (cancelled || !geo || !kakaoMaps || !mapElementRef.current) {
          if (!cancelled) setStatus("error");
          return;
        }
        const center = new kakaoMaps.LatLng(geo.lat, geo.lng);
        const map = new kakaoMaps.Map(mapElementRef.current, {
          center,
          level: geo.matched === "fallback" ? 6 : 3,
        });
        new kakaoMaps.Marker({ position: center, map });
        setUsedFallback(geo.matched === "fallback");
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [query, neighborhoodName]);

  return (
    <div className={styles.tradePlaceBlock}>
      <p className={styles.tradePlaceLine}>
        <strong>거래 희망 장소</strong> {query}
      </p>
      {status === "error" ? (
        <p className={styles.tradePlaceError}>지도를 불러오지 못했습니다.</p>
      ) : (
        <>
          <div ref={mapElementRef} className={styles.tradePlaceMap} />
          {usedFallback && (
            <p className={styles.tradePlaceError}>정확한 위치를 찾지 못해 동네 중심으로 표시했어요.</p>
          )}
        </>
      )}
    </div>
  );
}

export function ProductDetailScreen({
  product,
  onBack,
  onFavorite,
  onStatusChange,
  onChat,
  onHideSeller,
  onReportProduct,
  onEdit,
  onDelete,
}: {
  product: ProductListItem;
  onBack: () => void;
  onFavorite: (id: string) => void;
  onStatusChange: (id: string, status: TradeStatus) => void;
  onChat: () => void;
  onHideSeller: (productId: string) => void;
  onReportProduct: (productId: string, reason: string) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState("전문 판매업자 같아요");
  const [showMannerModal, setShowMannerModal] = useState(false);
  const sellerTemp = product.sellerMannerTemp ?? 36.5;

  const reportReasons = [
    "전문 판매업자 같아요",
    "사기 글이에요 / 의심돼요",
    "거래 금지 품목이에요",
    "비매너 및 욕설/비방",
    "기타 사유",
  ];

  return (
    <section className={styles.detailScreen}>
      <div
        className={`${styles.detailHero} ${product.thumbnailUrl ? "" : (styles[`tone_${product.thumbnailTone}` as keyof typeof styles] ?? "")}`}
      >
        <IconButton label="뒤로" onClick={onBack} className={styles.backFloating}>
          <ChevronLeft size={28} />
        </IconButton>
        <IconButton label="더보기" className={styles.moreFloating} onClick={() => setShowMoreSheet(true)}>
          <MoreVertical size={24} />
        </IconButton>
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- NCP Object Storage 원본 URL
          <img src={product.thumbnailUrl} alt={product.title} className={styles.detailHeroImage} />
        ) : (
          <span>{product.thumbnailLabel}</span>
        )}
      </div>
      <div className={styles.detailBody}>
        <div className={styles.sellerCard}>
          <div className={styles.avatar}>가</div>
          <div>
            <strong>{product.sellerNickname || "당근이웃님"}</strong>
            <span>{product.neighborhoodName}</span>
          </div>
          <button
            type="button"
            className={styles.mannerTempTrigger}
            onClick={() => setShowMannerModal(true)}
            aria-label="매너온도 설명 보기"
          >
            <div className={styles.mannerTempHead}>
              <span
                className={styles.mannerTempDegree}
                style={{ color: getMannerColor(sellerTemp) }}
              >
                {sellerTemp.toFixed(1)}°C
              </span>
              <span className={styles.mannerTempFace}>
                {getMannerEmoji(sellerTemp)}
              </span>
            </div>
            <span className={styles.mannerTempLabel}>매너온도</span>
          </button>
        </div>
        <div className={styles.priceLine}>
          {product.tradeStatus === "SALE" && product.tradeType === "FREE" && (
            <span className={styles.freeBadge}>나눔</span>
          )}
          {product.tradeStatus === "RESERVED" && <span className={styles.statusBadge}>예약중</span>}
          {product.tradeStatus === "SOLD" && <span className={styles.soldBadge}>거래완료</span>}
        </div>
        <h1>{product.title}</h1>
        <p className={styles.metaLine}>
          {product.category} · {product.createdAt}
        </p>
        <p className={styles.detailDescription}>{product.description}</p>
        <p className={styles.detailStats}>
          채팅 {product.chatCount} · 관심 {product.favoriteCount + product.interestCount} · 조회 {product.viewCount}
        </p>

        {product.tradePlace && (
          <TradePlaceMap query={product.tradePlace} neighborhoodName={product.neighborhoodName} />
        )}

        {product.mine && (
          <div className={styles.statusPanel}>
            <strong>내 판매 상태</strong>
            <div className={styles.segmented}>
              {(["SALE", "RESERVED", "SOLD"] as const).map((status) => (
                <button
                  type="button"
                  key={status}
                  className={product.tradeStatus === status ? styles.segmentActive : ""}
                  onClick={() => onStatusChange(product.id, status)}
                >
                  {status === "SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "거래완료"}
                </button>
              ))}
            </div>
            <p>상태를 바꾸면 홈 목록, 판매관리, 채팅 상품 카드에 같은 값이 반영됩니다.</p>
          </div>
        )}
      </div>
      <div className={styles.detailActionBar}>
        <button
          type="button"
          className={`${styles.detailFavorite} ${product.isFavorite ? styles.favoriteActive : ""}`}
          onClick={() => onFavorite(product.id)}
        >
          <Heart size={24} fill={product.isFavorite ? "currentColor" : "none"} />
        </button>
        <strong>{formatPrice(product)}</strong>
        {(() => {
          // 내 글인데 걸린 채팅방이 하나도 없으면(아직 문의한 사람이 없음) 눌러도 볼 게
          // 없으니 회색으로 비활성화 — 클릭했다가 빈 목록/에러를 마주치지 않게 미리 막는다.
          const chatDisabled = product.mine && product.chatCount === 0;
          return (
            <button
              type="button"
              onClick={onChat}
              disabled={chatDisabled}
              className={chatDisabled ? styles.detailChatDisabled : undefined}
            >
              채팅하기
            </button>
          );
        })()}
      </div>

      {/* More Options Action Sheet */}
      {showMoreSheet && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowMoreSheet(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <div className={styles.productActionGroup}>
              {product.mine ? (
                <>
                  <button
                    type="button"
                    className={styles.productActionBtn}
                    onClick={() => {
                      setShowMoreSheet(false);
                      onEdit(product.id);
                    }}
                  >
                    <FileText size={22} />
                    <span>글 수정하기</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.productActionBtn} ${styles.productActionReport}`}
                    onClick={() => {
                      setShowMoreSheet(false);
                      if (window.confirm("정말 삭제하시겠어요?\n삭제하면 되돌릴 수 없어요.")) {
                        onDelete(product.id);
                      }
                    }}
                  >
                    <Trash2 size={22} />
                    <span>삭제하기</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.productActionBtn}
                    onClick={() => {
                      setShowMoreSheet(false);
                      onHideSeller(product.id);
                      alert("이 사용자의 글을 더 이상 보지 않습니다.");
                      onBack();
                    }}
                  >
                    <EyeOff size={22} />
                    <span>이 사용자의 글 보지 않기</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.productActionBtn} ${styles.productActionReport}`}
                    onClick={() => {
                      setShowMoreSheet(false);
                      setShowReportModal(true);
                    }}
                  >
                    <MessageCircle size={22} />
                    <span>신고하기</span>
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              className={styles.productActionCloseBtn}
              onClick={() => setShowMoreSheet(false)}
            >
              닫기
            </button>
          </div>
        </>
      )}

      {/* Report Reason Selection Modal */}
      {showReportModal && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowReportModal(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 800 }}>신고 사유를 선택해주세요</h3>
            <div className={styles.reportReasonList}>
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`${styles.reportReasonItem} ${selectedReportReason === reason ? styles.reportReasonItemSelected : ""}`}
                  onClick={() => setSelectedReportReason(reason)}
                >
                  <span>{reason}</span>
                  {selectedReportReason === reason && <CheckCircle2 size={18} />}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.albaDetailApplyBtn}
              style={{ width: "100%", height: "48px" }}
              onClick={() => {
                setShowReportModal(false);
                onReportProduct(product.id, selectedReportReason);
                alert(`신고가 접수되었습니다. (${selectedReportReason})\n운영팀에서 확인 후 신속하게 처리하겠습니다.`);
              }}
            >
              신고 제출하기
            </button>
            <button
              type="button"
              className={styles.productActionCloseBtn}
              onClick={() => setShowReportModal(false)}
            >
              취소
            </button>
          </div>
        </>
      )}
      <MannerTemperatureModal
        isOpen={showMannerModal}
        onClose={() => setShowMannerModal(false)}
        targetTemp={sellerTemp}
      />
    </section>
  );
}
