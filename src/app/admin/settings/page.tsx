"use client";
import { useState, type FormEvent } from "react";
import { changeAdminPassword } from "@/services/adminService";
import { useAdminProfile } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import styles from "@/components/admin/portal.module.css";
export default function SettingsPage() {
 const profile = useAdminProfile();
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); const password = String(form.get("new"));
  if (password !== form.get("confirm")) { setMessage("새 비밀번호 확인이 일치하지 않습니다."); return; }
  setBusy(true); setMessage("");
  try { await changeAdminPassword(String(form.get("current")), password); formElement.reset(); setMessage("비밀번호가 변경되었습니다."); }
  catch (error) { setMessage(error instanceof Error ? error.message : "변경에 실패했습니다."); }
  finally { setBusy(false); }
 }
 return <><AdminPageHeader title="환경설정" description="관리자 계정과 로그인 보안을 관리하세요." /><div className={styles.settingsGrid}><article className={styles.card}><h2>관리자 계정</h2><p>{profile?.nickname}</p><p>{profile?.email}</p><p>권한: 관리자</p></article><form className={styles.form} onSubmit={submit}><h2>비밀번호 변경</h2><label>현재 비밀번호<input name="current" type="password" autoComplete="current-password" required /></label><label>새 비밀번호<input name="new" type="password" autoComplete="new-password" minLength={8} required /></label><label>새 비밀번호 확인<input name="confirm" type="password" autoComplete="new-password" minLength={8} required /></label>{message && <p className={styles.feedback} role="status">{message}</p>}<button disabled={busy}>{busy ? "변경 중…" : "비밀번호 변경"}</button></form></div></>;
}
