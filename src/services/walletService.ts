import { authorizedFetch } from "@/services/tradeService";
import { toChatMessage, type ApiChatMessage, type ChatMessageDto } from "@/services/chatService";

// 백엔드가 HTTPException(detail="...")로 내려주는 메시지를 그대로 보여준다 — 잔액부족처럼
// 이유가 화면에 그대로 나가야 하는 API라 authService.ts와 동일한 패턴을 그대로 씀.
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    return typeof payload?.detail === "string" ? payload.detail : fallback;
  } catch {
    return fallback;
  }
}

interface ApiWalletBalance {
  balance: number;
}

export async function getWalletBalance(signal?: AbortSignal): Promise<number> {
  const response = await authorizedFetch("/api/v1/wallet/me", {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("잔액을 불러오지 못했습니다.");

  const payload: ApiWalletBalance = await response.json();
  return payload.balance;
}

// 당근페이 송금 실행 — 백엔드가 잔액 이동 + 거래상태(SOLD) 전환까지 한 번에 처리하고,
// 채팅방에 남길 PAYMENT 타입 메시지를 응답으로 돌려준다(chatService의 일반 메시지 응답과
// 같은 모양이라 변환 함수도 그대로 재사용).
export async function sendPayment(chatRoomId: number, amount: number): Promise<ChatMessageDto> {
  const response = await authorizedFetch(`/api/v1/wallet/${chatRoomId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response, "송금하지 못했습니다."));

  const payload: ApiChatMessage = await response.json();
  return toChatMessage(payload);
}

// 당근머니 충전 — 실제 계좌 연동 없는 mock이라 금액만 보내면 그대로 잔액에 더해진다.
export async function chargeWallet(amount: number): Promise<number> {
  const response = await authorizedFetch("/api/v1/wallet/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response, "충전하지 못했습니다."));

  const payload: ApiWalletBalance = await response.json();
  return payload.balance;
}

// 매장 조회 — 결제 QR(=/carrot?pay=<storeId> URL)을 스캔/진입했을 때 표시할 이름/사진을 받아온다.
export async function getStore(storeId: number): Promise<{ id: number; name: string; image_url: string | null }> {
  const response = await authorizedFetch(`/api/v1/wallet/stores/${storeId}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response, "가맹점을 찾을 수 없습니다."));
  return response.json();
}

// 매장 QR 결제 — 가맹점 연동 없는 mock이라 store_id/금액만 보내면 잔액에서 차감된다.
export async function payByQr(storeId: number, amount: number): Promise<number> {
  const response = await authorizedFetch("/api/v1/wallet/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ store_id: storeId, amount }),
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response, "결제하지 못했습니다."));

  const payload: ApiWalletBalance = await response.json();
  return payload.balance;
}
