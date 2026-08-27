import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "당근 지역 플랫폼",
  description: "지역 거래와 생활을 연결하는 당근 고도화 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
