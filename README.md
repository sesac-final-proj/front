# 당근마켓/가지마켓 프론트엔드 (Frontend)

Next.js 16 (App Router) 기반 모바일 반응형 웹 애플리케이션입니다.

## 📁 프로젝트 구조 (Ponytail Minimalist Architecture)

불필요한 보일러플레이트와 빈 폴더를 제거하고, Next.js App Router 표준과 도메인별 응집도를 극대화한 구조입니다.

```text
front/src/
├── app/                  # Next.js App Router (페이지, 레이아웃, 라우트 전용 컴포넌트)
│   ├── layout.tsx        # 글로벌 루트 레이아웃 & 메타데이터
│   ├── page.tsx          # 메인 진입점 (홈 화면)
│   ├── carrot/           # 가지마켓 메인 도메인 화면 및 모듈
│   │   ├── GajiMarketApp.tsx
│   │   ├── GajiMarketApp.module.css
│   │   └── components/   # 도메인 세부 컴포넌트 (map, together, merge-game)
│   ├── onboarding/       # 온보딩 및 프로필 설정 화면
│   ├── auth/             # 소셜로그인 콜백 라우트
│   └── api/              # 프론트엔드 API 라우트 (지오코딩 등)
├── services/             # 백엔드 API 통신 및 비즈니스 데이터 레이어
│   ├── authService.ts    # 인증 / 토큰 / 온보딩 API
│   ├── congestionService.ts # 실시간 인파/혼잡도 분석
│   ├── restaurantService.ts # 음식점 및 카카오 플레이스 데이터
│   ├── togetherService.ts   # 동네 모임 API
│   └── tradeService.ts      # 중고거래 상품/글쓰기 API
├── types/                # TypeScript 전역 데이터 인터페이스 및 모델 정의
│   ├── trade.ts          # 거래 관련 타입
│   ├── together.ts       # 동네 모임 타입
│   └── realEstate.ts     # 부동산 실거래가 타입
└── lib/                  # 외부 SDK 래퍼 및 코어 유틸리티
    └── naver-map/        # 네이버 지도 TypeScript 포팅 및 클러스터링
```

## 🚀 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.
