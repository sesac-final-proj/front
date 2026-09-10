"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Clock3, MessageCircleQuestion, Send } from "lucide-react";
import { addInquiryMessage, createInquiry, listMyInquiries, type SupportInquiry } from "@/services/supportService";
import styles from "../../GajiMarketApp.module.css";
import { IconButton, ScreenHeader } from "../common";

const statusLabel = { WAITING: "답변 대기", ANSWERED: "답변 도착", CLOSED: "문의 종료" } as const;
export function CustomerSupportScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<SupportInquiry[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await listMyInquiries()); } catch (e) { setError(e instanceof Error ? e.message : "문의를 불러오지 못했습니다."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget, data = new FormData(form); setBusy(true); setError(""); try { await createInquiry(String(data.get("title")), String(data.get("content"))); form.reset(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "문의를 등록하지 못했습니다."); } finally { setBusy(false); } }
  async function followUp(event: FormEvent<HTMLFormElement>, id: number) { event.preventDefault(); const form = event.currentTarget, content = String(new FormData(form).get("content")); setBusy(true); setError(""); try { await addInquiryMessage(id, content); form.reset(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "추가 질문을 등록하지 못했습니다."); } finally { setBusy(false); } }
  return <section className={styles.screen}>
    <ScreenHeader title="고객센터" leading={<IconButton label="뒤로" onClick={onBack}><ChevronLeft size={27} /></IconButton>} />
    <div className={styles.supportContent}>
      <form className={styles.supportForm} onSubmit={submit}><h2>문의 남기기</h2><input name="title" aria-label="문의 제목" placeholder="문의 제목" minLength={2} maxLength={120} required /><textarea name="content" aria-label="문의 내용" placeholder="궁금한 점이나 불편한 내용을 적어주세요." minLength={5} maxLength={4000} required /><button disabled={busy}>{busy ? "등록 중..." : "문의 등록"}</button></form>
      {error && <p className={styles.supportError} role="alert">{error}</p>}
      <div className={styles.supportList}><h2>내 문의</h2>{loading ? <p>불러오는 중...</p> : items.length === 0 ? <div className={styles.supportEmpty}><MessageCircleQuestion /><p>등록한 문의가 없습니다.</p></div> : items.map(item => <article className={styles.supportCard} key={item.id}><header><strong>{item.title}</strong><span data-status={item.status}>{statusLabel[item.status]}</span></header><small>{new Date(item.created_at).toLocaleString("ko-KR")}</small><div className={styles.supportThread}>{item.messages.map((message, index) => <div className={message.author_role === "ADMIN" ? styles.supportAnswer : styles.supportQuestion} key={message.id ?? `${message.author_role}-${index}`}><b>{message.author_role === "ADMIN" ? "관리자 답변" : "내 질문"}</b><p>{message.content}</p></div>)}</div>{item.status !== "CLOSED" && <form className={styles.supportFollowUp} onSubmit={event => void followUp(event, item.id)}><textarea name="content" minLength={2} maxLength={4000} placeholder="추가 질문을 이어서 남겨주세요." required /><button disabled={busy}><Send size={17} /> 추가 질문</button></form>}{item.status === "WAITING" && <div className={styles.supportWaiting}><Clock3 size={16} /> 답변을 기다리고 있어요.</div>}</article>)}</div>
    </div>
  </section>;
}
