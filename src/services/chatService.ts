import { authorizedFetch } from "@/services/tradeService";

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
  // 채팅방 헤더/물품카드 UI를 이 응답 하나로 그릴 수 있게 백엔드가 얹어준 필드들.
  counterpartNickname: string | null;
  // 실유저 매너온도 시스템이 아직 없어서 항상 null — null이면 배지를 숨긴다.
  counterpartMannerTemp: number | null;
  counterpartNeighborhoodName: string | null;
  productThumbnailUrl: string | null;
  productPrice: number | null;
  productTradeStatus: ChatTradeStatus | null;
}

export type MessageType = "TEXT" | "IMAGE";

export interface ChatMessageDto {
  id: number;
  chatRoomId: number;
  senderId: number;
  messageType: MessageType;
  content: string | null;
  imageUrl: string | null;
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
  counterpart_nickname: string | null;
  counterpart_manner_temp: number | null;
  counterpart_neighborhood_name: string | null;
  product_thumbnail_url: string | null;
  product_price: number | null;
  product_trade_status: ChatTradeStatus | null;
}

interface ApiChatRoomPage {
  items: ApiChatRoom[];
  total: number;
}

interface ApiChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message_type: MessageType;
  content: string | null;
  image_url: string | null;
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
    counterpartNickname: item.counterpart_nickname,
    counterpartMannerTemp: item.counterpart_manner_temp,
    counterpartNeighborhoodName: item.counterpart_neighborhood_name,
    productThumbnailUrl: item.product_thumbnail_url,
    productPrice: item.product_price,
    productTradeStatus: item.product_trade_status,
  };
}

function toChatMessage(item: ApiChatMessage): ChatMessageDto {
  return {
    id: item.id,
    chatRoomId: item.chat_room_id,
    senderId: item.sender_id,
    messageType: item.message_type,
    content: item.content,
    imageUrl: item.image_url,
    createdAt: item.created_at,
  };
}

// 채팅 관련 API는 전부 로그인이 필요한 엔드포인트라 토큰 없으면 AuthRequiredError.
// productId를 주면 그 상품에 걸린 채팅방만 걸러서 받는다 — 판매자가 본인 글에서
// "채팅하기"를 눌렀을 때 그 글에 걸린 N:1 채팅방 목록을 보여주는 용도.
export async function listChatRooms(
  signal?: AbortSignal,
  productId?: number,
): Promise<{ items: ChatRoomDto[]; total: number }> {
  const params = new URLSearchParams({ size: "100" });
  if (productId !== undefined) params.set("product_id", String(productId));
  const response = await authorizedFetch(`/api/v1/chats?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("채팅 목록을 불러오지 못했습니다.");

  const payload: ApiChatRoomPage = await response.json();
  return { items: payload.items.map(toChatRoom), total: payload.total };
}

// 이미 그 상품에 대해 열어둔 방이 있으면 백엔드가 새로 만들지 않고 그 방을 그대로 돌려준다.
export async function createOrGetChatRoom(productId: number): Promise<ChatRoomDto> {
  const response = await authorizedFetch("/api/v1/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ type: "TRADE", product_id: productId }),
  });
  if (!response.ok) throw new Error("채팅방을 열지 못했습니다.");

  const payload: ApiChatRoom = await response.json();
  return toChatRoom(payload);
}

export async function listMessages(
  chatRoomId: number,
  signal?: AbortSignal,
): Promise<{ items: ChatMessageDto[]; total: number }> {
  const response = await authorizedFetch(`/api/v1/chats/${chatRoomId}/messages?size=200`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("메시지를 불러오지 못했습니다.");

  const payload: ApiChatMessagePage = await response.json();
  return { items: payload.items.map(toChatMessage), total: payload.total };
}

export async function sendMessage(chatRoomId: number, content: string): Promise<ChatMessageDto> {
  const response = await authorizedFetch(`/api/v1/chats/${chatRoomId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message_type: "TEXT", content }),
  });
  if (!response.ok) throw new Error("메시지를 보내지 못했습니다.");

  const payload: ApiChatMessage = await response.json();
  return toChatMessage(payload);
}

// 채팅 이미지: presign → 브라우저에서 NCP에 직접 PUT → object_key를 메시지로 등록, 3단계.
// 상품 이미지와 달리 등록 엔드포인트가 따로 없고 메시지 전송 자체가 등록이다.
export async function sendImageMessage(chatRoomId: number, file: File): Promise<ChatMessageDto> {
  const presignResponse = await authorizedFetch(`/api/v1/chats/${chatRoomId}/images/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ filename: file.name, content_type: file.type }),
  });
  if (!presignResponse.ok) throw new Error("이미지 업로드 URL을 받지 못했습니다.");
  const { upload_url, object_key }: { upload_url: string; object_key: string } = await presignResponse.json();

  const putResponse = await fetch(upload_url, {
    method: "PUT",
    // 상품 이미지와 동일한 이유 — presign 서명에 ACL(public-read)이 포함돼 있어서
    // 이 헤더가 빠지면 NCP가 SignatureDoesNotMatch(403)로 거부한다.
    headers: { "Content-Type": file.type, "x-amz-acl": "public-read" },
    body: file,
  });
  if (!putResponse.ok) throw new Error("이미지를 업로드하지 못했습니다.");

  const messageResponse = await authorizedFetch(`/api/v1/chats/${chatRoomId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message_type: "IMAGE", image_object_key: object_key }),
  });
  if (!messageResponse.ok) throw new Error("이미지 메시지를 보내지 못했습니다.");

  const payload: ApiChatMessage = await messageResponse.json();
  return toChatMessage(payload);
}

export async function leaveChatRoom(chatRoomId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/chats/${chatRoomId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("채팅방을 나가지 못했습니다.");
}

// 채팅 중 거래상태 변경(판매중/예약중/거래완료). 판매자가 아니면 백엔드가 403을 준다.
export async function updateChatTradeStatus(
  chatRoomId: number,
  tradeStatus: ChatTradeStatus,
): Promise<ChatMessageDto> {
  const response = await authorizedFetch(`/api/v1/chats/${chatRoomId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ trade_status: tradeStatus }),
  });
  if (!response.ok) throw new Error("거래상태를 변경하지 못했습니다.");

  const payload: ApiChatMessage = await response.json();
  return toChatMessage(payload);
}
