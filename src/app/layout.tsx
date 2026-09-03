import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "./register-sw";

export const metadata: Metadata = {
  title: "가지마켓",
  description: "지역 거래와 생활을 연결하는 가지마켓 모바일 프로토타입",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "가지마켓",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 한국어 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
        />
        {/* Iconify Solar 아이콘 */}
        <script src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js" async />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
