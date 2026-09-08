# 당근페이 송금 거래 플로우 구현 계획

당근마켓처럼: 채팅방 상단 "당근페이" 버튼 → 송금 금액 입력 → 송금 완료(채팅방에 카드로 표시) → 상세내역 화면 → 상품 거래상태 자동 전환. 판매자가 채팅방 메뉴에서 판매중/예약중/거래완료를 수동으로 바꾸는 기능은 이미 있음(변경 없음).

## 0. 기준 화면 (스크린샷 매핑)

| 스크린샷 | 화면 | 대응 신규 컴포넌트 |
|---|---|---|
| 당근머니 송금 (키패드) | 금액 입력 | `PaymentAmountScreen` |
| 상세 내역 (송금완료 후) | 거래 상세 | `PaymentDetailScreen` |
| 채팅방 내 "송금완료" 카드 | 메시지 버블 | `ChatRoomScreen` 메시지 리스트에 PAYMENT 타입 추가 |
| 판매중/예약중/거래완료 선택 시트 | 판매자 상태 전환 | 이미 구현됨 — [ChatRoomScreen.tsx](../src/app/carrot/components/chat/ChatRoomScreen.tsx) 햄버거 메뉴의 세그먼트 컨트롤 |

## 1. 현재 상태 (기준점)

- 프론트 [ChatRoomScreen.tsx:210](../src/app/carrot/components/chat/ChatRoomScreen.tsx#L210): "당근페이" 버튼이 `disabled` placeholder로 이미 자리만 잡혀 있음(`styles.chatPayButton`).
- 프론트: 판매자 거래상태 전환(SALE/RESERVED/SOLD)은 채팅방 메뉴 세그먼트 컨트롤로 이미 동작 → `onUpdateStatus` → `PATCH /api/v1/chats/{id}/status`.
- 백엔드 `back/app/models/user.py`: `User`에 잔액(지갑) 필드 없음.
- 백엔드: 송금/지갑 테이블 없음. `back/app/models/transaction.py`의 `Transaction`은 당근 크롤링 원천 데이터 테이블이라 이름만 같을 뿐 무관 — 새로 만들어야 함.
- 백엔드 `back/app/api/v1/chats/schema.py`: `MessageType`이 `TEXT` / `IMAGE`만 있음. `PAYMENT` 추가 필요.
- 백엔드 `back/app/models/product.py`: `Product.trade_status`는 이미 `SALE`/`RESERVED`/`SOLD` 문자열 컬럼으로 존재.

## 2. 스코프

**포함**
1. 유저 지갑 잔액("당근머니") — 실제 은행 연동 없이 가입 시 mock 초기 잔액 지급.
2. 채팅방 당근페이 버튼 → 금액 입력 화면 → 송금 실행 → 채팅방에 "송금완료" 메시지 카드로 노출.
3. 송금 카드 클릭 → 상세내역 화면(거래한 사람 / 일시 / 충전계좌 / 충전금액 / 거래후잔액 / 송금확인증 버튼).
4. 송금 성공 시 해당 상품의 `trade_status`를 자동으로 `SOLD`로 전환.
5. 판매자 수동 상태 전환은 기존 그대로 유지.

**제외 (이번 스코프 아님)**
- 실제 계좌 연동/PG 결제, "자동충전" 실동작(화면엔 정적 텍스트로만 노출).
- 송금 취소/환불.
- 스크린샷에 있는 "송금요청"(판매자→구매자 요청) 버튼 — 필요하면 별도 작업.
- 매너온도/후기 정산 로직.

## 3. 백엔드 설계 (`back` 리포)

### 3-1. DB 변경 (alembic migration)
- `users.wallet_balance` (Integer, `default=100000`) 추가.
- 신규 테이블 `wallet_transactions` (`back/app/models/wallet.py` 신설):
  - `id`, `chat_room_id`(FK `chats.id`), `product_id`(FK `products.id`, nullable), `sender_id`/`receiver_id`(FK `users.id`), `amount`(Integer), `balance_after`(Integer, sender 기준), `created_at`.
- `chat_messages`에 `payment_id`(FK `wallet_transactions.id`, nullable) 컬럼 추가 — PAYMENT 메시지가 어떤 송금 건인지 연결.
- `back/app/api/v1/chats/schema.py`의 `MessageType`에 `"PAYMENT"` 추가.

### 3-2. API — 신규 EPIC `back/app/api/v1/wallet/` (router.py / service.py / schema.py, 기존 컨벤션 그대로)
| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/v1/wallet/me` | 🔒 | 내 잔액 조회 `{ balance }` |
| POST | `/api/v1/wallet/{chat_room_id}/payments` | 🔒 | 송금 실행. body `{ amount }`. 서버가 chat_room에서 상대(판매자)와 product를 찾아 sender 잔액 검증(부족 시 400) → sender 차감/receiver 증가 → `wallet_transactions` insert → `chat_messages`에 PAYMENT 메시지 insert(`payment_id` 연결) → `product.trade_status = "SOLD"` 업데이트. 응답은 `MessageResponse` + payment 상세 필드. |
| GET | `/api/v1/wallet/transactions/{id}` | 🔒 | 상세내역 조회(9409 화면용). sender/receiver 본인만 조회 가능(그 외 403). |

기존 `POST /api/v1/chats/{chat_room_id}/messages`는 그대로 TEXT/IMAGE 전용으로 유지 — PAYMENT는 위 wallet 엔드포인트를 통해서만 생성되게 막는다(돈이 오가는 메시지를 일반 메시지 API로 위조 못 하게).

## 4. 프론트 설계 (`front` 리포, 이 리포)

### 4-1. 서비스/타입
- 신규 `src/services/walletService.ts`: `getWalletBalance()`, `sendPayment(chatRoomId, amount)`, `getPaymentDetail(id)` — `tradeService.ts`의 `authorizedFetch` 재사용, 기존 서비스들과 동일하게 snake_case ↔ camelCase 변환.
- `src/services/chatService.ts`의 `MessageType`에 `"PAYMENT"` 추가, `ChatMessageDto`/`ChatMessageUi`에 payment 필드(`amount`, `balanceAfterSender` 등) 추가.
- `src/app/carrot/types.ts`의 `SubPage`에 다음 추가:
  ```ts
  | { type: "payment-amount"; chatRoomId: string }
  | { type: "payment-detail"; transactionId: string }
  ```

### 4-2. 신규 화면
- `PaymentAmountScreen` (`src/app/carrot/components/chat/` 또는 `common/`) — 상대 닉네임/아바타, 금액 키패드 입력, "자동충전 10,000 | 하나 1507" 줄은 정적 텍스트(mock, 클릭 불가), "보내기" → `sendPayment` 호출 성공 시 채팅방으로 복귀.
- `PaymentDetailScreen` — `GajiMarketApp.module.css`의 기존 `.screen` 패턴 재사용. 상품 썸네일/제목/금액, "거래한 사람", 아코디언(일시/충전계좌/충전금액/거래후잔액), "송금 확인증" 버튼(mock — toast만).

### 4-3. 기존 파일 변경
- [ChatRoomScreen.tsx](../src/app/carrot/components/chat/ChatRoomScreen.tsx): 당근페이 버튼 `disabled` 해제, `onClick`으로 `payment-amount` 서브페이지 이동. 메시지 리스트에서 `message.type === "PAYMENT"`면 카드형 버블("송금완료" + 금액) 렌더링, 클릭 시 `payment-detail`로 이동.
- [GajiMarketApp.tsx](../src/app/carrot/GajiMarketApp.tsx): `payment-amount`/`payment-detail` 서브페이지 라우팅 배선, 송금 성공 콜백에서 해당 채팅방의 `productTradeStatus`를 `SOLD`로 낙관적 업데이트(폴링이 없어서 백엔드가 바꿔줘도 프론트가 바로 반영 안 하면 새로고침 전까진 안 보임).

## 5. 작업 순서

1. 백엔드: DB 마이그레이션(`wallet_balance`, `wallet_transactions`, `chat_messages.payment_id`) + `MessageType`에 `PAYMENT` 추가.
2. 백엔드: `wallet` EPIC 라우터/서비스/스키마 3종 구현.
3. 프론트: `walletService.ts` + 타입 확장.
4. 프론트: `PaymentAmountScreen`, `PaymentDetailScreen` + `GajiMarketApp` 라우팅.
5. 프론트: `ChatRoomScreen` 당근페이 버튼 활성화 + PAYMENT 메시지 버블.
6. 수동 QA: 판매자/구매자 두 계정으로 송금 → 채팅방에 카드 노출 → 거래완료 자동 전환 → 판매자 메뉴 상태가 이미 거래완료로 보이는지 확인.

## 6. 구현 전에 정할 것

- 초기 지급 잔액 액수(임시로 100,000원 제안), 잔액 부족 시 UX(토스트만으로 충분한지).
- "자동충전" 문구를 진짜 인터랙티브하게 만들지, 장식 텍스트로만 둘지.
- **구매자가 송금만 하면 판매자 동의 없이 바로 거래완료 처리되는 게 맞는지** — 실제 당근마켓은 판매자가 완료 버튼을 눌러야 완료됨. 지금 스펙대로면 구매자가 실수로 송금해도 되돌릴 방법이 없다(3-1 스코프 제외에도 명시). 그대로 갈지, "송금 후에도 상태는 RESERVED로만 바꾸고 완료는 판매자가 누르게" 할지 결정 필요.
