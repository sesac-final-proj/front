"use client";

import React, { FormEvent } from "react";
import { ChevronLeft, Heart, MessageCircle } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";
import type { CommunityComment } from "@/types/community";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";
import { CommunityPostMenu } from "./CommunityPostMenu";

export function CommunityDetailScreen({
  post,
  currentUserId,
  onBack,
  onEdit,
  onDelete,
  onReport,
  comments = [],
  commentsLoading = false,
  commentDraft,
  onCommentDraftChange,
  onToggleEmotion,
  onSubmitComment,
  onDeleteComment,
}: {
  post: CommunityPost;
  currentUserId?: number | null;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  comments?: CommunityComment[];
  commentsLoading?: boolean;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onToggleEmotion: () => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteComment: (commentId: number) => void;
}) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="동네생활"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <article className={`${styles.detailArticle} ${styles.communityDetailArticle}`}>
        <CommunityPostMenu
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
        />
        <span className={styles.categoryBadge}>{post.categoryName}</span>
        <h1>{post.title}</h1>
        <p className={styles.metaLine}>
          {post.neighborhoodName} · {post.createdAt} · 조회 {post.viewCount}
        </p>
        <p>{post.contentPreview}</p>
        <div className={styles.reactionBar}>
          <button type="button" className={post.isReacted ? styles.reactionActive : ""} onClick={onToggleEmotion}>
            <Heart size={19} fill={post.isReacted ? "currentColor" : "none"} /> 공감 {post.reactionCount}
          </button>
          <button type="button">
            <MessageCircle size={19} /> 댓글 {post.commentCount}
          </button>
        </div>
        <section className={styles.communityComments}>
          <h2>댓글</h2>
          {commentsLoading ? (
            <p className={styles.communityCommentEmpty}>댓글을 불러오는 중입니다.</p>
          ) : comments.length === 0 ? (
            <p className={styles.communityCommentEmpty}>아직 댓글이 없습니다.</p>
          ) : (
            <div className={styles.communityCommentList}>
              {comments.map((comment) => (
                <article key={comment.id} className={styles.communityCommentItem}>
                  <div>
                    <strong>{comment.authorNickname}</strong>
                    <p>{comment.content}</p>
                    <small>{new Date(comment.createdAt).toLocaleString("ko-KR")}</small>
                  </div>
                  {comment.isMine && (
                    <button type="button" onClick={() => onDeleteComment(comment.id)}>
                      삭제
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          <form className={styles.communityCommentForm} onSubmit={onSubmitComment}>
            <input
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="댓글을 입력해주세요."
              aria-label="댓글 입력"
            />
            <button type="submit">등록</button>
          </form>
        </section>
      </article>
    </section>
  );
}
