"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  Search,
  Database,
  TrendingUp,
  Download,
  ChartColumn,
  Map,
  HeartHandshake,
  Bell,
  Settings,
  PanelsTopLeft,
  X,
  Headphones,
  ChevronDown,
  Compass,
  ShieldAlert,
  LayoutDashboard,
  LineChart,
  CircleDollarSign,
  SlidersHorizontal,
} from "lucide-react";
import styles from "./portal.module.css";

const groups = [
  {
    label: "거래 운영",
    items: [
      ["/admin/trade-dashboard", "거래 대시보드", Activity],
      ["/admin/trades", "거래 데이터 탐색", Search],
      ["/admin/price-status", "가격현황", CircleDollarSign],
      ["/admin/price-comparison", "가격 지역별 비교", Map],
    ],
  },
  {
    label: "외부 비교",
    items: [
      ["/admin/insights", "외부 비교 인사이트", TrendingUp],
      ["/admin/market-trends", "외부 변화 추이", LineChart],
      ["/admin/environment", "모델 및 외부 환경 분석", Compass],
      ["/admin/risks", "위험요소 분석", ShieldAlert],
    ],
  },
  {
    label: "서비스 운영",
    items: [
      ["/admin/donations", "꿈가지 분석", HeartHandshake],
      ["/admin/support", "고객 문의", Headphones],
    ],
  },
  {
    label: "시스템",
    items: [
      ["/admin/management", "관리", SlidersHorizontal],
      ["/admin/notices", "공지·기부", Bell],
      ["/admin/system", "구현 현황", PanelsTopLeft],
      ["/admin/settings", "환경설정", Settings],
    ],
  },
] as const;

export function AdminSidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <>
      {open && <button className={styles.scrim} onClick={close} aria-label="메뉴 닫기" />}
      <aside id="admin-sidebar" className={styles.sidebar} data-open={open}>
        <div className={styles.brand}>
          <Link href="/admin" onClick={close}>
            <span>당근</span> Admin Portal
          </Link>
          <button className={styles.mobileButton} onClick={close} aria-label="메뉴 닫기">
            <X size={20} />
          </button>
        </div>
        <nav aria-label="관리자 메뉴">
          <div style={{ margin: "6px 0 10px", paddingBottom: "10px", borderBottom: "1px solid #D8DBD3" }}>
            <Link
              href="/admin"
              onClick={close}
              aria-current={pathname === "/admin" ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                minHeight: "44px",
                padding: "10px 12px",
                borderRadius: "8px",
                fontWeight: pathname === "/admin" ? "750" : "600",
                color: pathname === "/admin" ? "#D95800" : "#272B25",
                background: pathname === "/admin" ? "#FFE9DA" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <LayoutDashboard size={18} color={pathname === "/admin" ? "#D95800" : "#575D54"} />
              <span>홈</span>
            </Link>
          </div>
          {groups.map((group, index) => {
            const isExpanded = expanded.includes(group.label);
            return (
              <section key={group.label} className={styles.navGroup}>
                <button
                  className={styles.groupToggle}
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`admin-group-${index}`}
                  onClick={() =>
                    setExpanded((current) =>
                      isExpanded
                        ? current.filter((label) => label !== group.label)
                        : [...current, group.label],
                    )
                  }
                >
                  <span>{group.label}</span>
                  <ChevronDown className={styles.groupChevron} size={17} aria-hidden="true" />
                </button>
                <div className={styles.groupItems} id={`admin-group-${index}`} hidden={!isExpanded}>
                  {group.items.map(([href, label, Icon]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={close}
                      aria-current={pathname === href ? "page" : undefined}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
        <Link className={styles.backToService} href="/carrot">
          사용자 서비스로 이동 ↗
        </Link>
      </aside>
    </>
  );
}
