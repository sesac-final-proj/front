"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  MessageSquareOff,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  answerInquiry,
  closeAdminInquiry,
  deleteAdminInquiry,
  listAdminInquiryPage,
  getAdminInquiry,
  type SupportPage,
  type SupportInquiry,
} from "@/services/supportService";
import styles from "../portal.module.css";

const labels = {
  WAITING: "답변 대기",
  ANSWERED: "확인 대기",
  CLOSED: "종료",
} as const;

export default function SupportSection() {
  const [result, setResult] = useState<SupportPage>({ items: [], total: 0, page: 1, page_size: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SupportInquiry | null>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = listAdminInquiryPage(page, status, query).then((rows) => {
      if (active) {
        setResult(rows);
        // 만약 선택된 항목이 없거나 현재 목록의 첫번째를 자동 선택하고 싶을 경우
        if (selectedId === null && rows.items.length > 0 && typeof window !== "undefined" && window.innerWidth > 1023) {
          setSelectedId(rows.items[0].id);
        }
      }
    });

    request
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "문의를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, status, query, revision]);

  useEffect(() => {
    if (selectedId === null) {
      setSelected(null);
      return;
    }
    let active = true;
    getAdminInquiry(selectedId)
      .then((row) => {
        if (active) setSelected(row);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "상세 문의를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [selectedId, revision]);

  function reload() {
    setError("");
    setRevision((v) => v + 1);
  }

  async function action(run: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await run();
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const pages = Math.max(1, Math.ceil(result.total / result.page_size));
  const currentPage = result.page;

  return (
    <div className={styles.supportAdmin}>
      {/* Top Filter & Toolbar */}
      <div className={styles.supportToolbar}>
        <div className={styles.supportFilters}>
          <input
            type="search"
            className={styles.supportSearchInput}
            maxLength={120}
            aria-label="문의 제목·작성자 검색"
            placeholder="🔍 제목 또는 작성자 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className={styles.supportSelect}
            aria-label="문의 상태"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체 상태 ({result.total}건)</option>
            <option value="WAITING">⏳ 답변 대기</option>
            <option value="ANSWERED">💬 확인 대기</option>
            <option value="CLOSED">✅ 종료됨</option>
          </select>
        </div>

        <button
          type="button"
          className={styles.dynamicPillBtn}
          onClick={reload}
          disabled={loading || busy}
        >
          <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          <span>새로고침</span>
        </button>
      </div>

      {error && <p role="alert" className={styles.feedback}>{error}</p>}

      {/* 2-Column Responsive Layout */}
      <div className={styles.supportColumns}>
        {/* Left Column: Inquiry Master List */}
        <section className={styles.supportListPanel}>
          <div className={styles.supportListHeader}>
            <h3>문의 목록</h3>
            <span>총 {result.total.toLocaleString("ko-KR")}건</span>
          </div>

          <div className={styles.supportItemsContainer}>
            {loading && !result.items.length ? (
              <p style={{ color: "#878D82", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
                문의 목록을 불러오는 중입니다...
              </p>
            ) : result.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#8B9185" }}>
                <MessageSquareOff size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ fontSize: 13, margin: 0 }}>해당 조건의 문의가 없습니다.</p>
              </div>
            ) : (
              result.items.map((item) => {
                const isSelected = selectedId === item.id;
                const badgeClass =
                  item.status === "WAITING"
                    ? styles.supportBadgeWaiting
                    : item.status === "ANSWERED"
                    ? styles.supportBadgeAnswered
                    : styles.supportBadgeClosed;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.supportItemCard}
                    data-active={isSelected}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className={styles.supportItemTop}>
                      <span className={`${styles.supportBadge} ${badgeClass}`}>
                        {item.status === "WAITING" && <Clock3 size={10} />}
                        {item.status === "ANSWERED" && <MessageSquare size={10} />}
                        {item.status === "CLOSED" && <CheckCircle2 size={10} />}
                        {labels[item.status]}
                      </span>
                      <small style={{ fontSize: 11, color: "#8E9489" }}>
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
                      </small>
                    </div>

                    <div className={styles.supportItemTitle}>{item.title}</div>

                    <div className={styles.supportItemMeta}>
                      <span>{item.user_nickname ?? item.user_email ?? "익명 사용자"}</span>
                      <span style={{ fontSize: 10, color: "#9CA297" }}>#{item.id}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className={styles.supportPagination}>
            <button
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <span>
              {currentPage} / {pages}
            </span>
            <button
              type="button"
              disabled={loading || currentPage >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              다음
            </button>
          </div>
        </section>

        {/* Right Column: Inquiry Detail & Response Canvas */}
        <section className={styles.supportDetailPanel}>
          {selectedId === null || !selected ? (
            <div className={styles.supportDetailEmpty}>
              <MessageSquare size={44} />
              <p>좌측 목록에서 문의를 선택하면 대화 내역과 답변 작성창이 표시됩니다.</p>
            </div>
          ) : (
            <>
              <div className={styles.supportDetailHead}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span
                      className={`${styles.supportBadge} ${
                        selected.status === "WAITING"
                          ? styles.supportBadgeWaiting
                          : selected.status === "ANSWERED"
                          ? styles.supportBadgeAnswered
                          : styles.supportBadgeClosed
                      }`}
                    >
                      {labels[selected.status]}
                    </span>
                    <span style={{ fontSize: 11, color: "#8B9185" }}>
                      접수일: {new Date(selected.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <h2>{selected.title}</h2>
                  <p>
                    작성자: <b>{selected.user_nickname ?? "이름 없음"}</b> ({selected.user_email})
                  </p>
                </div>

                <div className={styles.supportDetailActions}>
                  {selected.status !== "CLOSED" ? (
                    <button
                      type="button"
                      className={styles.dynamicPillBtn}
                      disabled={busy}
                      onClick={() => void action(() => closeAdminInquiry(selected.id))}
                    >
                      <CheckCircle2 size={13} />
                      문의 종료
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.dynamicPillBtn}
                      style={{ color: "#D71913", borderColor: "#FFD0CE" }}
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "종료된 문의와 대화 내역을 영구 삭제합니다. 삭제할까요?"
                          )
                        ) {
                          void action(async () => {
                            await deleteAdminInquiry(selected.id);
                            setSelectedId(null);
                          });
                        }
                      }}
                    >
                      <Trash2 size={13} />
                      문의 삭제
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className={styles.supportChatThread}>
                {selected.messages.map((message, index) => {
                  const isAdmin = message.author_role === "ADMIN";
                  return (
                    <div
                      key={message.id ?? index}
                      className={`${styles.supportBubble} ${
                        isAdmin ? styles.supportBubbleAdmin : styles.supportBubbleUser
                      }`}
                    >
                      <div className={styles.supportBubbleAuthor}>
                        {isAdmin ? (
                          <>
                            <ShieldCheck size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            당근 관리자
                          </>
                        ) : (
                          <>
                            <User size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            {selected.user_nickname ?? "사용자"}
                          </>
                        )}
                      </div>
                      <div className={styles.supportBubbleBody}>
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Answer Input Form */}
              {selected.status !== "CLOSED" ? (
                <form
                  className={styles.supportAnswerForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const answer = String(new FormData(form).get("answer") ?? "").trim();
                    if (!answer) return;
                    void action(async () => {
                      await answerInquiry(selected.id, answer);
                      form.reset();
                    });
                  }}
                >
                  <textarea
                    key={selected.messages.length}
                    name="answer"
                    className={styles.supportTextarea}
                    placeholder="고객에게 전달할 친절하고 정확한 답변을 입력해 주세요..."
                    minLength={2}
                    maxLength={4000}
                    required
                  />
                  <div className={styles.supportFormBottom}>
                    <button
                      type="submit"
                      className={`${styles.dynamicPillBtn} ${styles.dynamicPillBtnPrimary}`}
                      disabled={busy}
                    >
                      <Send size={13} />
                      답변 등록
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    background: "#F5F6F2",
                    padding: "16px",
                    borderRadius: "14px",
                    textAlign: "center",
                    color: "#6D7468",
                    fontSize: "13px",
                  }}
                >
                  ✅ 이미 종료 처리된 문의입니다.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
