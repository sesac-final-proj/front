import type { CommunityComment, CommunityFeedPost, CommunityPostPage, CommunityPostQuery } from "@/types/community";
import { AUTH_TOKEN_STORAGE_KEY, authorizedFetch } from "./tradeService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface ApiCommunityPost {
  id: number;
  category: string;
  title: string;
  content: string;
  neighborhood_name: string;
  author_id: number;
  author_nickname: string;
  created_at: string;
  view_count: number;
  comment_count: number;
  reaction_count: number;
  thumbnail_url?: string | null;
  is_mine?: boolean;
  is_reacted?: boolean;
}

interface ApiCommunityComment {
  id: number;
  post_id: number;
  author_id: number;
  author_nickname: string;
  content: string;
  created_at: string;
  is_mine?: boolean;
}

interface ApiCommunityPostPage {
  items: ApiCommunityPost[];
  total: number;
}

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

function optionalAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { Accept: "application/json" };
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token ? { Accept: "application/json", Authorization: `Bearer ${token}` } : { Accept: "application/json" };
}

function toCommunityFeedPost(item: ApiCommunityPost): CommunityFeedPost {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    content: item.content,
    neighborhoodName: item.neighborhood_name,
    authorId: item.author_id,
    authorNickname: item.author_nickname,
    createdAt: item.created_at,
    viewCount: item.view_count,
    commentCount: item.comment_count,
    reactionCount: item.reaction_count,
    thumbnailUrl: item.thumbnail_url ?? undefined,
    isMine: item.is_mine ?? false,
    isReacted: item.is_reacted ?? false,
  };
}

function toCommunityComment(item: ApiCommunityComment): CommunityComment {
  return {
    id: item.id,
    postId: item.post_id,
    authorId: item.author_id,
    authorNickname: item.author_nickname,
    content: item.content,
    createdAt: item.created_at,
    isMine: item.is_mine ?? false,
  };
}

export async function listCommunityPosts(
  query: CommunityPostQuery = {},
  signal?: AbortSignal,
): Promise<CommunityPostPage> {
  const params = new URLSearchParams();
  if (query.regionId !== undefined) params.set("region_id", String(query.regionId));
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  params.set("page", String(query.page ?? 1));
  params.set("size", String(query.size ?? 60));

  const response = await fetch(apiUrl(`/api/v1/community/posts?${params}`), {
    signal,
    headers: optionalAuthHeaders(),
  });
  if (!response.ok) throw new Error("커뮤니티 글 목록을 불러오지 못했습니다.");

  const payload: ApiCommunityPostPage = await response.json();
  return { items: payload.items.map(toCommunityFeedPost), total: payload.total };
}

export async function createCommunityPost(input: {
  category: string;
  title: string;
  content: string;
}): Promise<{ id: number }> {
  const response = await authorizedFetch("/api/v1/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("커뮤니티 글을 등록하지 못했습니다.");

  return response.json();
}

export async function getCommunityPost(postId: number, signal?: AbortSignal): Promise<CommunityFeedPost> {
  const response = await fetch(apiUrl(`/api/v1/community/posts/${postId}`), {
    signal,
    headers: optionalAuthHeaders(),
  });
  if (!response.ok) throw new Error("커뮤니티 글을 불러오지 못했습니다.");

  const payload: ApiCommunityPost = await response.json();
  return toCommunityFeedPost(payload);
}

export async function updateCommunityPost(
  postId: number,
  input: { category: string; title: string; content: string; thumbnail_url?: string | null },
): Promise<CommunityFeedPost> {
  const response = await authorizedFetch(`/api/v1/community/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("커뮤니티 글을 수정하지 못했습니다.");

  const payload: ApiCommunityPost = await response.json();
  return toCommunityFeedPost(payload);
}

export async function deleteCommunityPost(postId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/community/posts/${postId}/delete`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("커뮤니티 글을 삭제하지 못했습니다.");
}

export async function toggleCommunityPostEmotion(postId: number): Promise<{ reacted: boolean; reactionCount: number }> {
  const response = await authorizedFetch(`/api/v1/community/posts/${postId}/emotion`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("공감 상태를 변경하지 못했습니다.");

  const payload: { reacted: boolean; reaction_count: number } = await response.json();
  return { reacted: payload.reacted, reactionCount: payload.reaction_count };
}

export async function listCommunityPostComments(
  postId: number,
  signal?: AbortSignal,
): Promise<{ items: CommunityComment[]; total: number }> {
  const response = await fetch(apiUrl(`/api/v1/community/posts/${postId}/comments`), {
    signal,
    headers: optionalAuthHeaders(),
  });
  if (!response.ok) throw new Error("댓글을 불러오지 못했습니다.");

  const payload: { items: ApiCommunityComment[]; total: number } = await response.json();
  return { items: payload.items.map(toCommunityComment), total: payload.total };
}

export async function createCommunityPostComment(
  postId: number,
  content: string,
): Promise<{ comment: CommunityComment; commentCount: number }> {
  const response = await authorizedFetch(`/api/v1/community/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("댓글을 등록하지 못했습니다.");

  const payload: { comment: ApiCommunityComment; comment_count: number } = await response.json();
  return { comment: toCommunityComment(payload.comment), commentCount: payload.comment_count };
}

export async function deleteCommunityPostComment(postId: number, commentId: number): Promise<void> {
  const response = await authorizedFetch(`/api/v1/community/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("댓글을 삭제하지 못했습니다.");
}
