const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

export const ADMIN_AUTH_TOKEN_STORAGE_KEY = "gaji_admin_access_token";
export const ADMIN_REFRESH_TOKEN_STORAGE_KEY = "gaji_admin_refresh_token";

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
  average_price: number | null;
  unmatched_region_transactions: number;
  status_counts: { status: string; transaction_count: number }[];
  daily_counts: { date: string; transaction_count: number }[];
  price_band_counts: { label: string; transaction_count: number }[];
  region_counts: { region_name: string; transaction_count: number }[];
  category_counts: {
    category: string;
    transaction_count: number;
    priced_count: number;
    completed_count: number;
    average_price: number | null;
  }[];
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

export interface AdminDataQuality {
  rowsBeforeCleaning: number;
  rowsAfterCleaning: number;
  removedRows: number;
  removedRate: number;
  invalidPriceRows: number;
  accessoryRows: number;
  sparseClusterRate: number;
  noisyClusterRate: number;
  totalClusters: number;
  reliableClusters: number;
}

export interface AdminModelQuality {
  selectedModel: string;
  r2: number;
  mae: number;
  baselineR2: number;
  baselineMAE: number;
  validationMethod: string;
  trainCount: number;
  testCount: number;
}

export interface AdminProductCluster {
  cluster: string;
  item: string;
  model: string;
  condition: string;
  count: number;
  median: number;
  q1: number;
  q3: number;
  platformCount: number;
  completedRate: number;
  sampleCount?: number;
  medianPrice?: number;
  iqr?: number;
  dispersion?: number;
  productFamily?: string;
  normalizedModel?: string;
  productSignature?: string;
  qualityStatus?: "reliable" | "limited" | "sparse" | "noisy";
}

export interface AdminAudienceInsights {
  asOf: string;
  population: { rows: number; platforms: number; items: number; completedRows: number };
  modelQuality?: AdminModelQuality;
  dataQuality?: AdminDataQuality;
  readerGuide: { question: string; answer: string }[];
  selectionReasons: string[];
  distributions: { item: string; count: number; q1: number; median: number; q3: number; outlierRate: number; interpretation: string }[];
  productClusters: AdminProductCluster[];
  keywords: { keyword: string; count: number; medianPrice: number; medianIndex: number; completionRate: number }[];
  examples: { item: string; title: string; platform: string; price: number; status: string; model: string; reason: string; url: string }[];
  sourceValidation: {
    sources: { id: string; name: string; kind: string; status: string; rows: number; pricedRows: number; modelKnownRate: number; duplicateIds: number; datedRate: number }[];
    futureSlots: { id: string; name: string; status: string; description: string }[];
    acceptance: string[];
  };
  llmCategories: { name: string; definition: string; signals: string[]; adminUse: string; caution: string }[];
  llm: { mode: string; provider: string; model: string; generatedAt: string; scope: string; guardrail: string };
  interpretation: { finding: string; action: string; caveat: string };
}

export interface AdminDreamStatus {
  totalFacilities: number;
  coveredDistricts: number;
  configuredDistricts: number;
  districts: { district: string; facilityCount: number; source: string }[];
  facilityTypes: { facilityType: string; count: number }[];
  sourceFiles: string[];
  donationDataConnected: boolean;
  donationMetricStatus: string;
  limitations: string[];
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return typeof payload.detail === "string" ? payload.detail : fallback;
  } catch {
    return fallback;
  }
}

export function getAdminAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
}

let adminRefreshPromise: Promise<string> | null = null;

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY);
}

function expireAdminSession(): never {
  clearAdminSession();
  if (window.location.pathname !== "/admin/login") window.location.replace("/admin/login");
  throw new Error("관리자 세션이 만료되었습니다. 다시 로그인해 주세요.");
}

async function refreshAdminAccessToken(): Promise<string> {
  if (!adminRefreshPromise) {
    adminRefreshPromise = (async () => {
      const refreshToken =
        typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY) : null;
      if (!refreshToken) return expireAdminSession();

      const response = await fetch(apiUrl("/api/v1/auth/admin/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
          window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY);
        }
        throw new Error("관리자 세션이 만료되었습니다.");
      }
      const payload: { access_token: string; refresh_token: string } = await response.json();
      if (!payload.access_token || !payload.refresh_token) return expireAdminSession();
      // A logout or a new login while refresh was in flight must win.
      if (localStorage.getItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY) !== refreshToken) {
        throw new Error("관리자 세션이 변경되었습니다.");
      }
      window.localStorage.setItem(ADMIN_AUTH_TOKEN_STORAGE_KEY, payload.access_token);
      window.localStorage.setItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY, payload.refresh_token);
      return payload.access_token;
    })().finally(() => {
      adminRefreshPromise = null;
    });
  }
  return adminRefreshPromise;
}

export async function adminAuthorizedFetch(path: string, init: RequestInit = {}, options: { passwordValidation?: boolean } = {}): Promise<Response> {
  const token = getAdminAuthToken();
  if (!token) return expireAdminSession();

  const withAuth = (t: string): RequestInit => ({
    ...init,
    headers: (() => { const headers = new Headers(init.headers); headers.set("Authorization", `Bearer ${t}`); return headers; })(),
    cache: "no-store",
  });

  let response = await fetch(apiUrl(path), withAuth(token));
  if (response.status === 401) {
    // The password endpoint also uses 401 for an incorrect current password.
    if (options.passwordValidation) {
      const payload = await response.clone().json().catch(() => null);
      if (payload?.detail === "현재 비밀번호가 올바르지 않습니다.") return response;
    }
    try {
      const currentToken = getAdminAuthToken();
      const newToken = currentToken && currentToken !== token ? currentToken : await refreshAdminAccessToken();
      response = await fetch(apiUrl(path), withAuth(newToken));
    } catch {
      return expireAdminSession();
    }
    if (response.status === 401 && !options.passwordValidation) return expireAdminSession();
  }
  return response;
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(apiUrl("/api/v1/auth/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "관리자 계정을 확인해 주세요."));
  const tokens: { access_token: string; refresh_token: string } = await response.json();
  localStorage.setItem(ADMIN_AUTH_TOKEN_STORAGE_KEY, tokens.access_token);
  localStorage.setItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const response = await adminAuthorizedFetch("/api/v1/auth/admin/me", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("관리자 권한이 필요합니다.");
  return response.json();
}

export async function getAdminDataStatus(): Promise<AdminDataStatus> {
  const response = await adminAuthorizedFetch("/api/v1/admin/data-status", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "운영 데이터를 불러오지 못했습니다."));
  return response.json();
}

export async function getAdminAudienceInsights(): Promise<AdminAudienceInsights> {
  const response = await adminAuthorizedFetch("/api/v1/admin/audience-insights", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "독자 관점 분석을 불러오지 못했습니다."));
  return response.json();
}

export async function getAdminDreamStatus(): Promise<AdminDreamStatus> {
  const response = await adminAuthorizedFetch("/api/v1/admin/dream-status", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "꿈가지 운영 데이터를 불러오지 못했습니다."));
  return response.json();
}

export async function logoutAdmin() {
  const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY);
  clearAdminSession();
  try {
    if (refreshToken) {
      await fetch(apiUrl("/api/v1/auth/admin/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_STORAGE_KEY);
  }
}

export async function changeAdminPassword(current_password: string, new_password: string) {
  const response = await adminAuthorizedFetch("/api/v1/auth/admin/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password }),
  }, { passwordValidation: true });
  if (!response.ok) throw new Error(await errorMessage(response, "비밀번호를 변경하지 못했습니다."));
}
