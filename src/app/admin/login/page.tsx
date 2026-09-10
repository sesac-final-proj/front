"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, getAdminProfile, clearAdminSession } from "@/services/adminService";
import styles from "@/components/admin/portal.module.css";
export default function AdminLoginPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setLoading(true); setError("");
  try { await loginAdmin(String(form.get("email")), String(form.get("password"))); await getAdminProfile(); router.replace("/admin"); }
  catch (error) { clearAdminSession(); setError(error instanceof Error ? error.message : "로그인에 실패했습니다."); }
  finally { setLoading(false); }
 }
 return <main className={styles.login}><form className={styles.form} onSubmit={submit}><div className={styles.brand}><span>당근</span>Admin Portal</div><h1>관리자 로그인</h1><p>등록된 관리자 계정으로 로그인해 주세요.</p><label>이메일<input name="email" type="email" autoComplete="username" required /></label><label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p className={styles.feedback} role="alert">{error}</p>}<button disabled={loading}>{loading ? "확인 중…" : "로그인"}</button><Link href="/carrot">사용자 서비스로 돌아가기</Link></form></main>;
}
