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

export type ReportTargetType = "USER" | "PRODUCT" | "MESSAGE";

export async function blockUser(userId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/safety/blocks/${userId}`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("차단하지 못했습니다.");
}

export async function unblockUser(userId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl(`/api/v1/safety/blocks/${userId}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("차단 해제하지 못했습니다.");
}

export async function reportUser(input: {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  description?: string;
}): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();

  const response = await fetch(apiUrl("/api/v1/safety/reports"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      description: input.description ?? null,
    }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("신고를 접수하지 못했습니다.");
}
