const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

export type UserNoticeService = "dream" | "carrot";

export interface UserNotice {
  id: number;
  service: UserNoticeService;
  title: string;
  content: string;
  created_at: string;
  starts_at: string | null;
  ends_at: string | null;
}

export async function listUserNotices(service: UserNoticeService, paramName: "service" | "service_type" = "service"): Promise<UserNotice[]> {
  const response = await fetch(apiUrl(`/api/v1/notices?${paramName}=${service}`), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("공지사항을 불러오지 못했습니다.");
  const payload: { items?: UserNotice[] } = await response.json();
  return payload.items ?? [];
}

export async function getUserNotice(id: number): Promise<UserNotice> {
  const response = await fetch(apiUrl(`/api/v1/notices/${id}`), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("공지사항을 불러오지 못했습니다.");
  return response.json();
}
