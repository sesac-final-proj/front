# 🍆 가지마켓(Gaji Market) 컬러보드 & 디자인 시스템

가지마켓의 시그니처 컬러인 **가지 보라색(Eggplant Purple)**을 주축으로 한 디자인 시스템 팔레트입니다.

![가지마켓 컬러보드](gaji_market_color_board_1788161776802.jpg)

---

## 1. 🔮 Brand & Primary Colors (메인 브랜드 컬러)

| 구분 | Dark Mode Hex | Light Mode Hex | 활용처 및 설명 |
| --- | --- | --- | --- |
| **Primary (브랜드 메인)** | `#A970FF` | `#7537C5` | 핵심 액션 버튼, 강조 텍스트, 활성 탭 아이콘 |
| **Primary Pressed** | `#8B4FE0` | `#59259C` | Primary 버튼 터치/클릭 state |
| **Primary Container** | `#32134D` | `#F0E6FF` | 브랜드 하이라이트 카드의 배경, 배지 배경 |
| **On Primary** | `#16001F` | `#FFFFFF` | Primary 버튼 내부 텍스트 및 아이콘 |

---

## 2. 🖤 Background & Surface Colors (배경 및 레이어)

| 구분 | Dark Mode Hex | Light Mode Hex | 활용처 및 설명 |
| --- | --- | --- | --- |
| **Background (기본 배경)** | `#0B0B0D` | `#FFFFFF` | 앱 전체 최하단 캔버스 배경 |
| **Surface 1 (카드/리스트)** | `#17171A` | `#F7F8FA` | 상품 카드, 커뮤니티 리스트 배경 |
| **Surface 2 (입력창/모달)** | `#24252A` | `#ECEEF1` | 검색 입력창, 태그 칩, 바텀시트 배경 |
| **Surface 3 (드롭다운/호버)**| `#303138` | `#DDE0E5` | 호버 상태, 상위 팝오버 디바이더 |
| **Line / Divider (구분선)** | `#2A2B30` | `#DCE0E5` | 리스트 구분선, 카드 아웃라인 |

---

## 3. 📝 Typography Colors (본문 및 텍스트)

| 구분 | Dark Mode Hex | Light Mode Hex | 활용처 및 설명 |
| --- | --- | --- | --- |
| **Text Primary (제목/주요)** | `#F5F5F7` | `#202124` | 상품명, 대제목, 주요 본문 |
| **Text Muted (서브/설명)** | `#A7A7AE` | `#575C64` | 작성 시각, 카테고리, 부가설명 |
| **Text Dim (비활성/힌트)** | `#777880` | `#666D77` | 플레이스홀더, 조회수/관심 수치 |

---

## 4. 🚦 Status & Rating Colors (상태 및 시각적 포인트)

| 구분 | Dark Mode Hex | Light Mode Hex | 활용처 및 설명 |
| --- | --- | --- | --- |
| **Success (완료/성공)** | `#20B77A` | `#078452` | 거래완료 배지, 안전인증 마크 |
| **Warning (경고/예약)** | `#F4A340` | `#A45A08` | 예약중 배지, 주의 알림 |
| **Rating (별점/골드)** | `#F5B82E` | `#F5B82E` | 매너온도/평점 별점 스타 컬러 |

---

## 5. 🎨 Gradient Accent Palettes (시그니처 그래디언트)

```css
/* 🍆 Gaji Hero Gradient (가지 시그니처 썸네일/카드) */
background: linear-gradient(135deg, #6748A4, #A970FF 52%, #263B60);

/* 🌌 Dark Stage Glow Background (앱 상단 퍼플 조명) */
background: radial-gradient(circle at 50% -12%, rgba(169, 112, 255, 0.16), transparent 34%), #111114;

/* 💳 Banner Card Gradient (꿈가지/프로모션 카드) */
background: linear-gradient(135deg, #3A2A69, #1A1730);

/* 🪙 Gold / Coupon Accent (쿠폰/포인트 강조) */
background: linear-gradient(135deg, #FAF2D8, #D7A94C); /* text: #3A2200 */
```
