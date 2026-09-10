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

// analyzer 파이프라인(LightGBM) 기반 가격예측 모델 — /api/v1/admin/price-model/*.
// 백엔드 응답이 snake_case라 위 인터페이스들과 다르게 필드명을 그대로 옮긴다.
export interface PriceModelMetricItem {
  feature_set: string;
  model_key: string;
  label: string;
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
  hit10: number;
  hit20: number;
  // LightGBM 행에만 있음(CQR 보정) — range_coverage_10_90은 "10~90% 예측구간 안에 실제가가
  // 들어올 확률"로 목표치가 80%인 별개 지표. Hit@20%(오차 ±20% 이내 적중률, ~44~49%)와 다르다.
  extra?: { range_coverage_25_75?: number; range_coverage_10_90?: number } | null;
}

export interface PriceModelListingItem {
  id: number;
  category: string;
  detail_type: string;
  gu: string;
  condition: string;
  status: string;
  chat_count: number;
  interest_count: number;
  view_count: number;
  manner_temp: number;
  title_length: number;
  days_since_listed: number;
  category_detail_median_price: number;
  price: number;
  price_log: number;
  title: string;
}

export interface PriceDistributionCategory {
  category: string;
  sample_count: number;
  types: { type: string; count: number; median_price: number }[];
  points: { type: string; price: number }[];
}

// price-distribution의 types는 상위 5개+"기타"로 잘리는데, 이건 세부유형(예: 청소기 V8/V10/V6…)을
// 자르지 않고 전부 세는 값 — "다이슨 V6 몇 개, V10 몇 개" 같은 분류 개수 그 자체.
export interface DetailTypeCountItem {
  category: string;
  detail_type: string;
  count: number;
}

export interface PricePredictionItem {
  feature_set: string;
  category: string;
  detail_type: string;
  title: string;
  actual_price: number;
  predicted_price: number;
  error_rate: number;
}

export interface PricePlatformComparisonItem {
  category: string;
  platform: string;
  sample_count: number;
  mean_price: number;
  median_price: number;
  std_price: number;
  p25_price: number;
  p75_price: number;
}

export interface PricePlatformTestItem {
  category: string;
  platform_a: string;
  platform_b: string;
  median_a: number;
  median_b: number;
  diff_pct: number;
  p_value: number;
  significant: boolean;
}

export interface PriceClusterItem {
  category: string;
  price_band: string;
  share: number;
  median_price: number;
  range_low: number;
  range_high: number;
  sample_count: number;
}

export interface PriceFeatureImportanceItem {
  feature_set: string;
  feature: string;
  gain: number;
  split: number;
}

export interface PriceModelCharts {
  predictions: PricePredictionItem[];
  platform_comparisons: PricePlatformComparisonItem[];
  platform_tests: PricePlatformTestItem[];
  clusters: PriceClusterItem[];
  feature_importance: PriceFeatureImportanceItem[];
}

export type AdminNoticeService = "dream" | "carrot";
export type AdminNoticeStatus = "draft" | "scheduled" | "published" | "ended" | "hidden";

export interface AdminNotice {
  id: number;
  service: AdminNoticeService;
  title: string;
  content: string;
  status: AdminNoticeStatus;
  manual_status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
  alert_count: number;
  warning_reasons: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AdminNoticeList {
  items: AdminNotice[];
  total: number;
}

export interface AdminNoticePayload {
  service: AdminNoticeService;
  title: string;
  content: string;
  starts_at?: string | null;
  ends_at?: string | null;
  manual_status?: "hidden" | null;
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

export async function getPriceModelMetrics(): Promise<{ metrics: PriceModelMetricItem[] }> {
  const response = await adminAuthorizedFetch("/api/v1/admin/price-model/metrics", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "가격예측 모델 지표를 불러오지 못했습니다."));
  return response.json();
}

export async function getPriceModelListings(page = 1, size = 20): Promise<{ items: PriceModelListingItem[]; total: number }> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/price-model/listings?page=${page}&size=${size}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "가격예측 매물 목록을 불러오지 못했습니다."));
  return response.json();
}

export async function getPriceDistribution(): Promise<{ categories: PriceDistributionCategory[] }> {
  const response = await adminAuthorizedFetch("/api/v1/admin/price-model/price-distribution", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "가격분포를 불러오지 못했습니다."));
  return response.json();
}

export async function getDetailTypeCounts(): Promise<{ items: DetailTypeCountItem[] }> {
  const response = await adminAuthorizedFetch("/api/v1/admin/price-model/detail-type-counts", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "세부유형 분류 개수를 불러오지 못했습니다."));
  return response.json();
}

export async function getPriceModelCharts(): Promise<PriceModelCharts> {
  const response = await adminAuthorizedFetch("/api/v1/admin/price-model/charts", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "가격예측 차트 데이터를 불러오지 못했습니다."));
  return response.json();
}

// SHAP summary plot은 DB 값이 아니라 analyzer가 matplotlib으로 그린 PNG라 그대로 받아온다.
// <img src>는 Authorization 헤더를 못 보내서 blob으로 받아 컴포넌트에서 object URL로 바꿔 쓴다.
export async function getPriceModelShapSummary(featureSet: "full" | "no_leak_prone"): Promise<Blob> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/price-model/shap-summary?feature_set=${featureSet}`, {
    headers: { Accept: "image/png" },
  });
  if (!response.ok) throw new Error(await errorMessage(response, "SHAP 요약 이미지를 불러오지 못했습니다."));
  return response.blob();
}


export async function getAdminNotices(query: { q?: string; service?: string; status?: string; deleteStatus?: string; page?: number; size?: number } = {}): Promise<AdminNoticeList> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.service && query.service !== "all") params.set("service", query.service);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.deleteStatus && query.deleteStatus !== "normal") params.set("delete_status", query.deleteStatus);
  params.set("page", String(query.page ?? 1));
  params.set("size", String(query.size ?? 10));
  const response = await adminAuthorizedFetch(`/api/v1/admin/notices?${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "공지를 불러오지 못했습니다."));
  return response.json();
}

export async function createAdminNotice(payload: AdminNoticePayload): Promise<AdminNotice> {
  const response = await adminAuthorizedFetch("/api/v1/admin/notices", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "공지를 저장하지 못했습니다."));
  return response.json();
}

export async function updateAdminNotice(id: number, payload: Partial<AdminNoticePayload>): Promise<AdminNotice> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/notices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "공지를 수정하지 못했습니다."));
  return response.json();
}

export async function deleteAdminNotice(id: number): Promise<void> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/notices/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await errorMessage(response, "공지를 삭제하지 못했습니다."));
}

export async function duplicateAdminNotice(id: number): Promise<AdminNotice> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/notices/${id}/duplicate`, { method: "POST", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "공지를 복사하지 못했습니다."));
  return response.json();
}

export async function createAdminNoticeAlerts(id: number): Promise<{ notice_id: number; created_count: number; alert_count: number; created_at: string }> {
  const response = await adminAuthorizedFetch(`/api/v1/admin/notices/${id}/alerts`, { method: "POST", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "공지 알림을 생성하지 못했습니다."));
  return response.json();
}

export async function reorderAdminNotices(noticeIds: number[]): Promise<AdminNoticeList> {
  const response = await adminAuthorizedFetch("/api/v1/admin/notices/order", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ notice_ids: noticeIds }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "공지 순서를 저장하지 못했습니다."));
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
