"use client";
import { useEffect, useState } from "react";
import { answerInquiry, closeAdminInquiry, deleteAdminInquiry, listAdminInquiryPage, getAdminInquiry, type SupportPage, type SupportInquiry } from "@/services/supportService";
import { AdminTable } from "../AdminUI";
import styles from "../portal.module.css";
const labels = { WAITING: "답변 대기", ANSWERED: "사용자 확인 대기", CLOSED: "종료" } as const;
export default function SupportSection() {
  const [result, setResult] = useState<SupportPage>({ items: [], total: 0, page: 1, page_size: 15 });
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SupportInquiry | null>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    const request = selectedId === null
      ? listAdminInquiryPage(page, status, query).then(rows => { if (active) setResult(rows); })
      : getAdminInquiry(selectedId).then(row => { if (active) setSelected(row); });
    request
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "문의를 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, status, query, selectedId, revision]);
  function reload() { setLoading(true); setError(""); setRevision(value => value + 1); }
  function select(id: number | null) { setSelected(null); setSelectedId(id); reload(); }
  async function action(run: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await run(); reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "요청 실패"); }
    finally { setBusy(false); }
  }
  const pages = Math.max(1, Math.ceil(result.total / result.page_size)), currentPage = result.page;
  return <div className={styles.supportAdmin}>
    {error && <p role="alert" className={styles.feedback}>{error}</p>}
    {loading && <p role="status">문의 목록 갱신 중…</p>}
    {selectedId !== null ? <article className={styles.card}>
      <button disabled={busy} onClick={() => select(null)}>목록으로</button>
      {selected && <>
      <h2>{selected.title}</h2><p>{labels[selected.status]} · {selected.user_nickname} · {selected.user_email}</p>
      <div className={styles.supportThread}>{selected.messages.map((message, index) => <div key={message.id ?? index}><b>{message.author_role === "ADMIN" ? "관리자" : "사용자"}</b><p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p></div>)}</div>
      {selected.status !== "CLOSED" ? <form onSubmit={event => { event.preventDefault(); const answer = String(new FormData(event.currentTarget).get("answer")); void action(() => answerInquiry(selected.id, answer)); }}>
        <textarea key={selected.messages.length} name="answer" aria-label="문의 답변" minLength={2} maxLength={4000} required />
        <div className={styles.supportActions}><button disabled={busy}>답변 등록</button><button type="button" disabled={busy} onClick={() => void action(() => closeAdminInquiry(selected.id))}>문의 종료</button></div>
      </form> : <button disabled={busy} onClick={() => { if (window.confirm("종료된 문의와 대화 내역을 영구 삭제합니다. 사용자 목록에서도 사라지며 복구할 수 없습니다. 삭제할까요?")) void action(async () => { await deleteAdminInquiry(selected.id); select(null); }); }}>종료 문의 삭제</button>}
      </>}
    </article> : <article className={styles.card}>
      <div className={styles.supportActions}><input type="search" maxLength={120} aria-label="문의 제목·작성자 검색" placeholder="제목·작성자 검색" value={query} onChange={event => { setQuery(event.target.value); setPage(1); reload(); }} /><select aria-label="문의 상태" value={status} onChange={event => { setStatus(event.target.value); setPage(1); reload(); }}><option value="all">전체 상태</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={reload} disabled={loading}>새로고침</button></div>
      <p>{result.total}건</p>
      <AdminTable headers={["상태", "문의 제목", "작성자", "접수일"]}>{result.items.map(item => <tr key={item.id}><td>{labels[item.status]}</td><td><button disabled={loading} onClick={() => select(item.id)}>{item.title}</button></td><td>{item.user_nickname ?? item.user_email}</td><td>{new Date(item.created_at).toLocaleDateString("ko-KR")}</td></tr>)}</AdminTable>
      {!loading && !result.items.length && <p>조건에 맞는 문의가 없습니다.</p>}
      <div className={styles.supportActions}><button disabled={loading || currentPage <= 1} onClick={() => { setPage(currentPage - 1); reload(); }}>이전</button><span>{currentPage} / {pages}</span><button disabled={loading || currentPage >= pages} onClick={() => { setPage(currentPage + 1); reload(); }}>다음</button></div>
    </article>}
  </div>;
}
