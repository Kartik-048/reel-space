export type ProviderType = 'instagram' | 'direct' | 'youtube_shorts' | 'user_submitted';

export type AvailabilityStatus = 'native_playable' | 'oembed_displayable' | 'external_only';

export type EventType =
  | 'impression'
  | 'start'
  | 'progress'
  | 'watch_completion'
  | 'replay'
  | 'like'
  | 'unlike'
  | 'save'
  | 'unsave'
  | 'comment'
  | 'share'
  | 'creator_follow'
  | 'creator_unfollow'
  | 'topic_follow'
  | 'quick_skip'
  | 'not_interested'
  | 'search'
  | 'collection_add';

export interface Creator {
  id: string;
  provider: ProviderType;
  external_id: string;
  username: string;
  display_name: string;
  profile_image: string;
  bio?: string;
  follower_count?: number;
  is_verified?: boolean;
}

export interface Video {
  id: string;
  provider: ProviderType;
  external_id: string;
  original_url: string;
  creator_id: string;
  creator: Creator;
  caption: string;
  thumbnail_url: string;
  video_url?: string;
  hashtags: string[];
  topics: string[];
  primary_topic: string;
  secondary_topics: string[];
  duration_seconds?: number;
  publication_date?: string;
  content_language?: string;
  source_permissions?: string;
  availability_status: AvailabilityStatus;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

export interface UserEvent {
  id: string;
  user_id: string;
  video_id: string;
  event_type: EventType;
  event_metadata?: {
    watch_duration_seconds?: number;
    completion_percentage?: number;
    session_id?: string;
    source_provider?: string;
    comment_text?: string;
    collection_id?: string;
    query?: string;
  };
  created_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  topic: string;
  score: number; // 0.0 to 1.0 (normalized)
  short_term_score: number; // 24-48h window
  long_term_score: number; // decayed historical
  interaction_count: number;
  is_blocked: boolean;
  last_interaction_at: string;
  updated_at: string;
}

export interface UserCreatorFollow {
  id: string;
  user_id: string;
  creator_id: string;
  created_at: string;
}

export interface UserLike {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface UserSave {
  id: string;
  user_id: string;
  video_id: string;
  collection_id?: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  video_count?: number;
  thumbnail_url?: string;
}

export interface RecommendationExplanation {
  primary_reason: string;
  reasons: string[];
  matched_topics: string[];
  matched_creator?: string;
  is_exploration: boolean;
  score_breakdown: {
    user_topic_similarity: number;
    recent_interaction: number;
    creator_affinity: number;
    content_similarity: number;
    freshness: number;
    exploration_boost: number;
    diversity_penalty: number;
    final_score: number;
  };
}

export interface RankedVideo extends Video {
  recommendation: RecommendationExplanation;
}

export interface FeedResponse {
  videos: RankedVideo[];
  next_cursor?: string;
  has_more: boolean;
  personalization_version: string;
  exploration_ratio: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  behavioral_tracking_enabled: boolean;
  stats: {
    videos_watched: number;
    total_watch_seconds: number;
    likes_given: number;
    saved_videos: number;
    creators_followed: number;
  };
}
