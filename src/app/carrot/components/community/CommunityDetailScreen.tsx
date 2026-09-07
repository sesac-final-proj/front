"use client";

import React from "react";
import { ChevronLeft, Heart, MessageCircle, MoreVertical } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";

export function CommunityDetailScreen({ post, onBack }: { post: CommunityPost; onBack: () => void }) {
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
          <IconButton label="더보기">
            <MoreVertical size={23} />
          </IconButton>
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
    </section>
  );
}
