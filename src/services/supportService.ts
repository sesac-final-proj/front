import { authorizedFetch } from "@/services/tradeService";
import { adminAuthorizedFetch } from "@/services/adminService";

export type SupportStatus = "WAITING" | "ANSWERED" | "CLOSED";
export interface SupportInquiry {
  id: number; user_id: number; title: string; content: string; status: SupportStatus;
  answer: string | null; answered_at: string | null; closed_at: string | null;
  created_at: string; updated_at: string; user_nickname?: string | null; user_email?: string | null;
  messages: Array<{ id: number | null; author_role: "USER" | "ADMIN"; content: string; created_at: string }>;
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "요청을 처리하지 못했습니다.");
  }
  return response.json();
}

export async function listMyInquiries(): Promise<SupportInquiry[]> {
  return (await parse<{ items: SupportInquiry[] }>(await authorizedFetch("/api/v1/support/inquiries"))).items;
}
export async function createInquiry(title: string, content: string): Promise<SupportInquiry> {
  return parse(await authorizedFetch("/api/v1/support/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) }));
}
export async function addInquiryMessage(id: number, content: string): Promise<SupportInquiry> {
  return parse(await authorizedFetch(`/api/v1/support/inquiries/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }));
}
export async function listAdminInquiries(): Promise<SupportInquiry[]> {
  return (await parse<{ items: SupportInquiry[] }>(await adminAuthorizedFetch("/api/v1/support/admin/inquiries"))).items;
}
export async function answerInquiry(id: number, answer: string): Promise<SupportInquiry> {
  return parse(await adminAuthorizedFetch(`/api/v1/support/admin/inquiries/${id}/answer`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) }));
}
export async function closeAdminInquiry(id: number): Promise<SupportInquiry> {
  return parse(await adminAuthorizedFetch(`/api/v1/support/admin/inquiries/${id}/close`, { method: "POST" }));
}
