import { authorizedFetch } from "@/services/tradeService";

export type ReportTargetType = "USER" | "PRODUCT" | "MESSAGE" | "COMMUNITY_POST";

export async function blockUser(userId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/safety/blocks/${userId}`, { method: "POST" });
  if (!response.ok) throw new Error("차단하지 못했습니다.");
}

export async function unblockUser(userId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/safety/blocks/${userId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("차단 해제하지 못했습니다.");
}

export async function reportUser(input: {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  description?: string;
}): Promise<void> {
  const response = await authorizedFetch("/api/v1/safety/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      description: input.description ?? null,
    }),
  });
  if (!response.ok) throw new Error("신고를 접수하지 못했습니다.");
}
