export interface SocialProfileSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  isFollowing: boolean;
  isSelf: boolean;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
}

export interface PostProductTag {
  id: string;
  productId: string | null;
  x: number;
  y: number;
  product: { name: string; brand: string; image: string | null };
}

export interface PostImage {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  tags: PostProductTag[];
}

export interface PostSummary {
  id: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
  author: SocialProfileSummary | null;
  uploaderName: string;
  cover: Omit<PostImage, "tags">;
  imageCount: number;
  likeCount: number;
  isLiked: boolean;
  isSaved: boolean;
  canManage: boolean;
}

export interface PostDetail extends PostSummary {
  images: PostImage[];
}
export interface PostPage {
  posts: PostSummary[];
  nextCursor: string | null;
}
export interface PostInput {
  id: string;
  caption: string;
  updatedAt?: string;
  images: {
    id: string;
    replacementUploadId?: string;
    tags: {
      productId: string | null;
      x: number;
      y: number;
      existingTagId?: string;
    }[];
  }[];
}
