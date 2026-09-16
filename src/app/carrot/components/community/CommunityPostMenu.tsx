"use client";

import React, { MouseEvent, useEffect, useRef, useState } from "react";
import { Edit3, Flag, MoreVertical, Trash2 } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { CommunityPost } from "../../types";

type CommunityPostMenuProps = {
  post: CommunityPost;
  currentUserId?: number | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
};

export function CommunityPostMenu({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
}: CommunityPostMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMine =
    typeof currentUserId === "number" && typeof post.authorId === "number"
      ? post.authorId === currentUserId
      : Boolean(post.mine);

  useEffect(() => {
    if (!menuOpen) return;
    function closeMenu(event: globalThis.MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [menuOpen]);

  function stop(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function choose(event: MouseEvent<HTMLButtonElement>, action?: () => void) {
    stop(event);
    setMenuOpen(false);
    action?.();
  }

  return (
    <div className={styles.communityPostMenuWrap} ref={menuRef} onClick={stop}>
      <button
        type="button"
        className={styles.communityPostMenuButton}
        aria-label="게시글 메뉴"
        aria-expanded={menuOpen}
        onClick={(event) => {
          stop(event);
          setMenuOpen((value) => !value);
        }}
      >
        <MoreVertical size={18} />
      </button>
      {menuOpen && (
        <div className={styles.communityPostMenu} role="menu">
          {isMine ? (
            <>
              <button type="button" role="menuitem" onClick={(event) => choose(event, onEdit)}>
                <Edit3 size={15} /> 수정하기
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.communityPostMenuDanger}
                onClick={(event) => choose(event, onDelete)}
              >
                <Trash2 size={15} /> 삭제하기
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={styles.communityPostMenuDanger}
              onClick={(event) => choose(event, onReport)}
            >
              <Flag size={15} /> 신고하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
