import { LogOut, Menu } from "lucide-react";
import type { AdminProfile } from "@/services/adminService";
import styles from "./portal.module.css";

export function AdminTopbar({ profile, open, toggle, logout }: { profile: AdminProfile; open: boolean; toggle: () => void; logout: () => void }) {
  return <div className={styles.topbar}><div><button className={styles.mobileButton} onClick={toggle} aria-label="관리자 메뉴 열기" aria-expanded={open} aria-controls="admin-sidebar"><Menu size={21} /></button><span>동네 거래를 위한 운영 공간</span></div><div><span className={styles.avatar}>{profile.nickname.slice(0,1)}</span><span>{profile.nickname}<small>관리자</small></span><button onClick={logout} aria-label="로그아웃"><LogOut size={18} /></button></div></div>;
}
