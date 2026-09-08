import {
  AUTH_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  authorizedFetch,
} from "@/services/tradeService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

export interface AdminProfile {
  id: number;
  email: string;
  nickname: string;
  role: "admin";
}

export interface AdminDataStatus {
  total_transactions: number;
  priced_transactions: number;
  region_count: number;
  latest_collected_at: string | null;
  region_counts: { region_name: string; transaction_count: number }[];
  category_counts: { category: string; transaction_count: number }[];
  recent_transactions: {
    id: number;
    product_title: string;
    category: string;
    price: number | null;
    region_name: string | null;
    status: string;
    listed_at: string;
    collected_at: string;
  }[];
  recent_errors: { source: string; message: string; occurred_at: string }[];
}

export interface AdminAudienceInsights {
  asOf: string;
  population: { rows: number; platforms: number; items: number; completedRows: number };
  readerGuide: { question: string; answer: string }[];
  selectionReasons: string[];
  distributions: { item: string; count: number; q1: number; median: number; q3: number; outlierRate: number; interpretation: string }[];
  keywords: { keyword: string; count: number; medianPrice: number; medianIndex: number; completionRate: number }[];
  examples: { item: string; title: string; platform: string; price: number; status: string; model: string; reason: string; url: string }[];
  llmCategories: { name: string; definition: string; signals: string[]; adminUse: string; caution: string }[];
  llm: { mode: string; provider: string; model: string; generatedAt: string; scope: string; guardrail: string };
  interpretation: { finding: string; action: string; caveat: string };
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return typeof payload.detail === "string" ? payload.detail : fallback;
  } catch {
    return fallback;
  }
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(apiUrl("/api/v1/auth/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "관리자 계정을 확인해 주세요."));
  const tokens: { access_token: string; refresh_token: string } = await response.json();
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const response = await authorizedFetch("/api/v1/auth/admin/me", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("관리자 권한이 필요합니다.");
  return response.json();
}

export async function getAdminDataStatus(): Promise<AdminDataStatus> {
  const response = await authorizedFetch("/api/v1/admin/data-status", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "운영 데이터를 불러오지 못했습니다."));
  return response.json();
}

export async function getAdminAudienceInsights(): Promise<AdminAudienceInsights> {
  const response = await authorizedFetch("/api/v1/admin/audience-insights", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "독자 관점 분석을 불러오지 못했습니다."));
  return response.json();
}

export async function logoutAdmin() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  try {
    if (refreshToken) {
      await fetch(apiUrl("/api/v1/auth/admin/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}
