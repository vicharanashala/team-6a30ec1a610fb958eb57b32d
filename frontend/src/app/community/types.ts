export type ForumCategory = {
  slug: string;
  label: string;
  description: string;
  color: string;
  softColor: string;
  topicCount: number;
  isActive?: boolean;
};

export type ForumTopic = {
  id: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  tags: string[];
  replyCount: number;
  viewCount: number;
  activity: string;
  activityRaw: number;
  isPinned: boolean;
  isLocked: boolean;
  isUnread: boolean;
  isHighlighted: boolean;
  voteCount: number;
  participants: number;
};

export type ForumView = "latest" | "new" | "votes" | "my-votes" | "top" | "bookmarks" | "my-posts" | "docs";

export type SortField = "activity" | "replies" | "views";
export type SortDir = "asc" | "desc";
