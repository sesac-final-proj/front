"use client";
import { useCallback, useEffect, useState } from "react";
import { answerInquiry, closeAdminInquiry, listAdminInquiries, type SupportInquiry } from "@/services/supportService";
import styles from "@/components/admin/portal.module.css";

const labels = { WAITING: "답변 대기", ANSWERED: "사용자 확인 대기", CLOSED: "종료" } as const;
export default function SupportSection() {
  const [items, setItems] = useState<SupportInquiry[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [busyId, setBusyId] = useState<number | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await listAdminInquiries()); } catch (e) { setError(e instanceof Error ? e.message : "문의를 불러오지 못했습니다."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function submit(id: number, answer: string) { setBusyId(id); setError(""); try { await answerInquiry(id, answer); await load(); } catch (e) { setError(e instanceof Error ? e.message : "답변을 저장하지 못했습니다."); } finally { setBusyId(null); } }
  async function complete(id: number) { setBusyId(id); setError(""); try { await closeAdminInquiry(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : "문의를 종료하지 못했습니다."); } finally { setBusyId(null); } }
  if (loading) return <div className={styles.state}>문의 목록을 불러오는 중입니다.</div>;
  return <div className={styles.supportAdmin}>{error && <p className={styles.feedback}>{error}</p>}{items.length === 0 ? <div className={styles.state}>접수된 문의가 없습니다.</div> : items.map(item => <article className={styles.card} key={item.id}><header><div><span className={styles.supportStatus}>{labels[item.status]}</span><h2>{item.title}</h2><small>{item.user_nickname} · {item.user_email} · {new Date(item.created_at).toLocaleString("ko-KR")}</small></div></header><div className={styles.supportThread}>{item.messages.map((message, index) => <div className={message.author_role === "ADMIN" ? styles.supportSavedAnswer : styles.supportQuestion} key={message.id ?? `${message.author_role}-${index}`}><b>{message.author_role === "ADMIN" ? "관리자 답변" : "사용자 질문"}</b><p>{message.content}</p></div>)}</div>{item.status !== "CLOSED" && <form onSubmit={e => { e.preventDefault(); void submit(item.id, String(new FormData(e.currentTarget).get("answer"))); }}><textarea name="answer" minLength={2} maxLength={4000} placeholder="사용자에게 보낼 답변을 입력하세요." required /><div className={styles.supportActions}><button disabled={busyId === item.id}>답변 등록</button><button type="button" className={styles.completeButton} disabled={busyId === item.id} onClick={() => void complete(item.id)}>답변 완료</button></div></form>}</article>)}</div>;
}
