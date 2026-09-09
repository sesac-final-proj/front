"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAdminProfile, logoutAdmin, type AdminProfile } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { ErrorState, Skeleton } from "./AdminUI";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import styles from "./portal.module.css";

const ProfileContext = createContext<AdminProfile | null>(null);
export const useAdminProfile = () => useContext(ProfileContext);

function ProtectedShell({ children }: { children: ReactNode }) {
  const { data, loading, error, retry } = useAdminResource(getAdminProfile);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);
  async function signOut() {
    try { await logoutAdmin(); } finally { window.location.replace("/admin/login"); }
  }
  if (loading) return <div className={styles.authState}><Skeleton /></div>;
  if (error || !data) return <div className={styles.authState}><ErrorState message={error || "관리자 계정을 확인해 주세요."} retry={retry} /></div>;
  return <ProfileContext.Provider value={data}><div className={styles.shell}><a href="#admin-content" className={styles.skipLink}>본문으로 이동</a><AdminSidebar open={open} close={() => setOpen(false)} /><div className={styles.workspace}><AdminTopbar profile={data} open={open} toggle={() => setOpen(value => !value)} logout={signOut} /><main id="admin-content" className={styles.content}>{children}</main></div></div></ProfileContext.Provider>;
}
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className={styles.portal}>{pathname === "/admin/login" ? children : <ProtectedShell>{children}</ProtectedShell>}</div>;
}
