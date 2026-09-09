"use client";

import React, { useState } from "react";
import { ChevronLeft, Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";

export function CommunityDetailScreen({
  post,
  onBack,
  onDelete,
}: {
  post: CommunityPost;
  onBack: () => void;
  onDelete: (postId: string) => void;
}) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="동네생활"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
        actions={
          post.mine ? (
            <IconButton label="더보기" onClick={() => setShowMoreSheet(true)}>
              <MoreVertical size={23} />
            </IconButton>
          ) : (
            <IconButton label="더보기">
              <MoreVertical size={23} />
            </IconButton>
          )
        }
      />
      <article className={styles.detailArticle}>
        <span className={styles.categoryBadge}>{post.categoryName}</span>
        <h1>{post.title}</h1>
        <p className={styles.metaLine}>
          {post.neighborhoodName} · {post.createdAt} · 조회 {post.viewCount}
        </p>
        <p>{post.contentPreview}</p>
        <div className={styles.reactionBar}>
          <button type="button">
            <Heart size={19} /> 공감 {post.reactionCount}
          </button>
          <button type="button">
            <MessageCircle size={19} /> 댓글 {post.commentCount}
          </button>
        </div>
      </article>

      {showMoreSheet && (
        <>
          <div className={styles.productActionBackdrop} onClick={() => setShowMoreSheet(false)} />
          <div className={styles.productActionSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle}>
              <span />
            </div>
            <div className={styles.productActionGroup}>
              <button
                type="button"
                className={`${styles.productActionBtn} ${styles.productActionReport}`}
                onClick={() => {
                  setShowMoreSheet(false);
                  if (window.confirm("정말 삭제하시겠어요?\n삭제하면 되돌릴 수 없어요.")) {
                    onDelete(post.id);
                  }
                }}
              >
                <Trash2 size={22} />
                <span>삭제하기</span>
              </button>
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
    </section>
  );
}
