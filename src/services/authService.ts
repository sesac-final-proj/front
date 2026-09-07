import { AUTH_TOKEN_STORAGE_KEY, AuthRequiredError } from "@/services/tradeService";

export { AuthRequiredError };

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

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  if (!token) throw new AuthRequiredError();
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

// 백엔드가 HTTPException(detail="...")로 내려주는 메시지를 그대로 보여준다.
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    return typeof payload?.detail === "string" ? payload.detail : fallback;
  } catch {
    return fallback;
  }
}

export interface Me {
  id: number;
  email: string;
  nickname: string;
  nicknameSet: boolean;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  region: { id: number; dongName: string; guName: string } | null;
}

interface ApiMeResponse {
  id: number;
  email: string;
  nickname: string;
  nickname_set: boolean;
  phone_number: string | null;
  profile_image_url: string | null;
  region: { id: number; dong_name: string; gu_name: string } | null;
}

function toMe(payload: ApiMeResponse): Me {
  return {
    id: payload.id,
    email: payload.email,
    nickname: payload.nickname,
    nicknameSet: payload.nickname_set,
    phoneNumber: payload.phone_number,
    profileImageUrl: payload.profile_image_url,
    region: payload.region
      ? { id: payload.region.id, dongName: payload.region.dong_name, guName: payload.region.gu_name }
      : null,
  };
}

// 로그인 직후 온보딩 라우팅(닉네임 설정 → 홈) 분기에 쓴다.
export async function getMe(): Promise<Me> {
  const response = await fetch(apiUrl("/api/v1/auth/me"), { headers: authHeaders() });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error("내 정보를 불러오지 못했습니다.");
  return toMe(await response.json());
}

// 인증 없이 전화번호/프로필 사진만 수집. 둘 다 optional이라 값이 있는 필드만 갱신된다.
export async function updateProfile(input: { phoneNumber?: string; profileImageUrl?: string | null }): Promise<Me> {
  const response = await fetch(apiUrl("/api/v1/auth/me/profile"), {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: input.phoneNumber, profile_image_url: input.profileImageUrl }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error(await extractErrorMessage(response, "프로필을 저장하지 못했습니다."));
  return toMe(await response.json());
}

// 상품 등록 등 region_id가 필요한 API는 이게 안 되어 있으면 400을 던진다 — 화면에서
// 고른 동네(activeNeighborhood)가 바뀔 때마다 GajiMarketApp.tsx가 이걸로 동기화한다.
export async function updateRegion(regionId: number, radiusM = 1000): Promise<Me> {
  const response = await fetch(apiUrl("/api/v1/auth/me/region"), {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ region_id: regionId, radius_m: radiusM }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error(await extractErrorMessage(response, "동네를 저장하지 못했습니다."));
  return toMe(await response.json());
}

// 공개 엔드포인트 — 로그인 없이도(추천/중복확인) 호출 가능.
export async function recommendNickname(): Promise<string> {
  const response = await fetch(apiUrl("/api/v1/nicknames/recommendation"), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("닉네임을 추천받지 못했습니다.");
  const payload: { nickname: string } = await response.json();
  return payload.nickname;
}

export interface NicknameAvailability {
  available: boolean;
  code: string;
  message: string;
}

export async function checkNicknameAvailability(nickname: string): Promise<NicknameAvailability> {
  const params = new URLSearchParams({ nickname });
  const response = await fetch(apiUrl(`/api/v1/nicknames/availability?${params}`), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("닉네임 중복 확인에 실패했습니다.");
  return response.json();
}

export async function selectNickname(nickname: string): Promise<void> {
  const response = await fetch(apiUrl("/api/v1/nicknames/selection"), {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error(await extractErrorMessage(response, "닉네임을 저장하지 못했습니다."));
}
