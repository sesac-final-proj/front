"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Search, Database, TrendingUp, Download, ChartColumn, Map, HeartHandshake, Bell, Settings, PanelsTopLeft, X, Headphones } from "lucide-react";
import styles from "./portal.module.css";

const groups = [
  { label: "거래 운영", items: [["/admin", "거래 대시보드", Activity], ["/admin/trades", "거래 데이터 탐색", Search], ["/admin/quality", "수집 품질", Database]] },
  { label: "타 플랫폼과 비교", items: [["/admin/insights", "비교 인사이트", TrendingUp], ["/admin/sources", "수집원 관리", Download], ["/admin/price-model", "가격 모델", ChartColumn], ["/admin/price-comparison", "가격 지역별 비교", Map]] },
  { label: "서비스 운영", items: [["/admin/donations", "꿈가지 분석", HeartHandshake], ["/admin/support", "고객 문의", Headphones]] },
  { label: "시스템", items: [["/admin/notices", "공지·기부", Bell], ["/admin/system", "구현 현황", PanelsTopLeft], ["/admin/settings", "환경설정", Settings]] },
] as const;

export function AdminSidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  return <>{open && <button className={styles.scrim} onClick={close} aria-label="메뉴 닫기" />}<aside id="admin-sidebar" className={styles.sidebar} data-open={open}>
    <div className={styles.brand}><Link href="/admin" onClick={close}><span>당근</span> Admin Portal</Link><button className={styles.mobileButton} onClick={close} aria-label="메뉴 닫기"><X size={20} /></button></div>
    <nav aria-label="관리자 메뉴">{groups.map(group => <section key={group.label}><h2>{group.label}</h2>{group.items.map(([href, label, Icon]) => <Link key={href} href={href} onClick={close} aria-current={pathname === href ? "page" : undefined}><Icon size={18} />{label}</Link>)}</section>)}</nav>
    <Link className={styles.backToService} href="/carrot">사용자 서비스로 이동 ↗</Link>
  </aside></>;
}
