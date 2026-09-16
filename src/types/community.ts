export interface CommunityFeedPost {
  id: number;
  category: string;
  title: string;
  content: string;
  neighborhoodName: string;
  authorId: number;
  authorNickname: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  thumbnailUrl?: string;
  isMine: boolean;
  isReacted: boolean;
}

export interface CommunityPostPage {
  items: CommunityFeedPost[];
  total: number;
}

export interface CommunityPostQuery {
  regionId?: number;
  category?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface CommunityComment {
  id: number;
  postId: number;
  authorId: number;
  authorNickname: string;
  content: string;
  createdAt: string;
  isMine: boolean;
}
