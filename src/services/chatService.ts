import { AUTH_TOKEN_STORAGE_KEY, AuthRequiredError } from "@/services/tradeService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export type ChatRoomType = "TRADE" | "COMMUNITY" | "GROUP" | "SYSTEM";
export type ChatTradeStatus = "SALE" | "RESERVED" | "SOLD";

export interface ChatRoomDto {
  id: number;
  type: ChatRoomType;
  productId: number | null;
  title: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  verified: boolean;
  isSeller: boolean;
}

export interface ChatMessageDto {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

interface ApiChatRoom {
  id: number;
  type: ChatRoomType;
  product_id: number | null;
  title: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  verified: boolean;
  is_seller: boolean;
}

interface ApiChatRoomPage {
  items: ApiChatRoom[];
  total: number;
}

interface ApiChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

interface ApiChatMessagePage {
  items: ApiChatMessage[];
  total: number;
}

function toChatRoom(item: ApiChatRoom): ChatRoomDto {
  return {
    id: item.id,
    type: item.type,
    productId: item.product_id,
    title: item.title,
    lastMessage: item.last_message,
    lastMessageAt: item.last_message_at,
    unreadCount: item.unread_count,
    verified: item.verified,
    isSeller: item.is_seller,
  };
}

function toChatMessage(item: ApiChatMessage): ChatMessageDto {
  return {
    id: item.id,
    chatRoomId: item.chat_room_id,
    senderId: item.sender_id,
    content: item.content,
    createdAt: item.created_at,
  };
}

// 채팅 관련 API는 전부 로그인이 필요한 엔드포인트라 토큰 없으면 AuthRequiredError.
export async function listChatRooms(signal?: AbortSignal): Promise<{ items: ChatRoomDto[]; total: number }> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl("/api/v1/chats?size=100"), {
    signal,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("채팅 목록을 불러오지 못했습니다.");

  const payload: ApiChatRoomPage = await response.json();
  return { items: payload.items.map(toChatRoom), total: payload.total };
}

// 이미 그 상품에 대해 열어둔 방이 있으면 백엔드가 새로 만들지 않고 그 방을 그대로 돌려준다.
export async function createOrGetChatRoom(productId: number): Promise<ChatRoomDto> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl("/api/v1/chats"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: "TRADE", product_id: productId }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("채팅방을 열지 못했습니다.");

  const payload: ApiChatRoom = await response.json();
  return toChatRoom(payload);
}

export async function listMessages(
  chatRoomId: number,
  signal?: AbortSignal,
): Promise<{ items: ChatMessageDto[]; total: number }> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/chats/${chatRoomId}/messages?size=200`), {
    signal,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("메시지를 불러오지 못했습니다.");

  const payload: ApiChatMessagePage = await response.json();
  return { items: payload.items.map(toChatMessage), total: payload.total };
}

export async function sendMessage(chatRoomId: number, content: string): Promise<ChatMessageDto> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/chats/${chatRoomId}/messages`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("메시지를 보내지 못했습니다.");

  const payload: ApiChatMessage = await response.json();
  return toChatMessage(payload);
}

export async function leaveChatRoom(chatRoomId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/chats/${chatRoomId}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("채팅방을 나가지 못했습니다.");
}

// 채팅 중 거래상태 변경(판매중/예약중/거래완료). 판매자가 아니면 백엔드가 403을 준다.
export async function updateChatTradeStatus(
  chatRoomId: number,
  tradeStatus: ChatTradeStatus,
): Promise<ChatMessageDto> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/chats/${chatRoomId}/status`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ trade_status: tradeStatus }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("거래상태를 변경하지 못했습니다.");

  const payload: ApiChatMessage = await response.json();
  return toChatMessage(payload);
}
