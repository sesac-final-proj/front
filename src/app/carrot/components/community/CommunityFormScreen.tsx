import React, { FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";
import { ScreenHeader, IconButton } from "../common";

export interface CommunityFormScreenProps {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  initialPost?: CommunityPost;
}

export function CommunityFormScreen({
  onBack,
  onSubmit,
  initialPost,
}: CommunityFormScreenProps) {
  const isEdit = Boolean(initialPost);

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title={isEdit ? "동네생활 글 수정" : "동네생활 글쓰기"}
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form className={styles.formStack} onSubmit={onSubmit}>
        <label>
          주제
          <select name="category" defaultValue={initialPost?.categoryName ?? "일반"}>
            <option>일반</option>
            <option>카페</option>
            <option>동네친구</option>
            <option>취미</option>
            <option>질문</option>
            <option>동네 정보</option>
          </select>
        </label>
        <label>
          제목
          <input name="title" placeholder="동네 이웃에게 물어보세요" defaultValue={initialPost?.title ?? ""} required />
        </label>
        <label>
          내용
          <textarea name="content" placeholder="상세 내용을 입력하세요" defaultValue={initialPost?.contentPreview ?? ""} required />
        </label>
        <button type="submit" className={styles.primaryButton}>
          {isEdit ? "저장하기" : "올리기"}
        </button>
      </form>
    </section>
  );
}
