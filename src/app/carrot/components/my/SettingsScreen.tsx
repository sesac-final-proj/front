import React from "react";
import {
  ChevronLeft,
  Sun,
  Moon,
  MapPinned,
  Crosshair,
  QrCode,
  Settings,
  Bell,
  Headphones,
  Mail,
  LogOut,
  X,
  Sparkles,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { ThemeMode } from "@/types";
import { ScreenHeader, IconButton } from "../common";
import { MenuCard } from "./MenuCard";

export interface SettingsScreenProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onBack: () => void;
  locationAllowed: boolean;
  isGuestMode: boolean;
  hasNetworkError: boolean;
  onLocationToggle: () => void;
  onGuestToggle: () => void;
  onNetworkErrorToggle: () => void;
  onLogout: () => void;
}

export function SettingsScreen({
  theme,
  onThemeChange,
  onBack,
  locationAllowed,
  isGuestMode,
  hasNetworkError,
  onLocationToggle,
  onGuestToggle,
  onNetworkErrorToggle,
  onLogout,
}: SettingsScreenProps) {
  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="설정"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <fieldset className={styles.themeSettings}>
        <legend>화면 모드</legend>
        <div className={styles.themeOptions}>
          <label>
            <input type="radio" name="theme" value="light" checked={theme === "light"} onChange={() => onThemeChange("light")} />
            <span><Sun size={20} />일반 모드</span>
          </label>
          <label>
            <input type="radio" name="theme" value="dark" checked={theme === "dark"} onChange={() => onThemeChange("dark")} />
            <span><Moon size={20} />다크 모드</span>
          </label>
        </div>
      </fieldset>
      <MenuCard
        title="설정"
        items={[
          { label: "내 동네 설정", icon: MapPinned },
          { label: locationAllowed ? "동네 인증됨" : "동네 인증하기", icon: Crosshair, trailing: locationAllowed ? "ON" : "OFF" },
          { label: "QR 코드 스캔", icon: QrCode },
          { label: "앱 설정", icon: Settings },
        ]}
      />
      <section className={styles.toggleCard}>
        <button type="button" onClick={onLocationToggle}>
          위치 권한
          <span className={locationAllowed ? styles.switchOn : ""} />
        </button>
        <button type="button" onClick={onGuestToggle}>
          비로그인 모드
          <span className={isGuestMode ? styles.switchOn : ""} />
        </button>
        <button type="button" onClick={onNetworkErrorToggle}>
          네트워크 오류 상태
          <span className={hasNetworkError ? styles.switchOn : ""} />
        </button>
      </section>
      <MenuCard
        title="고객지원"
        items={[
          { label: "공지사항", icon: Bell },
          { label: "고객센터", icon: Headphones },
          { label: "의견 남기기", icon: Mail },
          { label: "로그아웃", icon: LogOut, onClick: onLogout },
          { label: "탈퇴하기", icon: X },
          { label: "가지마켓 알아보기", icon: Sparkles },
          { label: "약관 및 정책", icon: BookOpen },
        ]}
      />
      <button type="button" className={styles.companyInfo}>
        (주) 가지마켓 사업자 정보 <ChevronRight size={18} />
      </button>
    </section>
  );
}
