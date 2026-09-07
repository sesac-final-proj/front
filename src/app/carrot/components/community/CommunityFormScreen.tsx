import React, { FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { ScreenHeader, IconButton } from "../common";

export interface CommunityFormScreenProps {
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CommunityFormScreen({
  onBack,
  onSubmit,
}: CommunityFormScreenProps) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="동네생활 글쓰기"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <form className={styles.formStack} onSubmit={onSubmit}>
        <label>
          주제
          <select name="category" defaultValue="일반">
            <option>일반</option>
            <option>카페</option>
            <option>동네친구</option>
            <option>취미</option>
          </select>
        </label>
        <label>
          제목
          <input name="title" placeholder="동네 이웃에게 물어보세요" required />
        </label>
        <label>
          내용
          <textarea name="content" placeholder="상세 내용을 입력하세요" required />
        </label>
        <button type="submit" className={styles.primaryButton}>
          올리기
        </button>
      </form>
    </section>
  );
}
