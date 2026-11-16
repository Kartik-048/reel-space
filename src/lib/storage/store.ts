import {
  Video,
  RankedVideo,
  UserInterest,
  UserEvent,
  Collection,
  Creator,
  UserProfile,
  EventType,
} from '@/types';
import { SEED_VIDEOS } from '../data/seedVideos';
import { recommendationEngine } from '../recommendation/engine';
import { TOPIC_TAXONOMY } from '../recommendation/taxonomy';

export interface CommentItem {
  id: string;
  video_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_demo_pioneer',
  email: 'explorer@reelspace.internal',
  username: 'cosmic_explorer',
  full_name: 'Jordan Mitchell',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  behavioral_tracking_enabled: true,
  stats: {
    videos_watched: 0,
    total_watch_seconds: 0,
    likes_given: 0,
    saved_videos: 0,
    creators_followed: 0,
  },
};

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'col_watch_later',
    user_id: DEFAULT_PROFILE.id,
    name: 'Watch Later',
    description: 'Saved for focused viewing',
    icon: 'clock',
    created_at: new Date().toISOString(),
    video_count: 0,
  },
  {
    id: 'col_deep_space',
    user_id: DEFAULT_PROFILE.id,
    name: 'Deep Space Gems',
    description: 'Astrophotography & James Webb findings',
    icon: 'sparkles',
    created_at: new Date().toISOString(),
    video_count: 0,
  },
  {
    id: 'col_tech_innovations',
    user_id: DEFAULT_PROFILE.id,
    name: 'Tech Innovations',
    description: 'Semiconductors, robotics & engineering',
    icon: 'cpu',
    created_at: new Date().toISOString(),
    video_count: 0,
  },
];

class MemoryStore {
  private videos: Map<string, Video> = new Map();
  private userInterests: Map<string, UserInterest> = new Map();
  private userEvents: UserEvent[] = [];
  private userLikes: Set<string> = new Set();
  private userSaves: Map<string, string | undefined> = new Map(); // videoId -> collectionId
  private userFollows: Set<string> = new Set(); // creatorId
  private collections: Map<string, Collection> = new Map();
  private comments: Map<string, CommentItem[]> = new Map();
  private watchedVideos: Set<string> = new Set();
  private userProfile: UserProfile = { ...DEFAULT_PROFILE };

  constructor() {
    this.seed();
  }

  public seed() {
    this.videos.clear();
    for (const v of SEED_VIDEOS) {
      this.videos.set(v.id, { ...v });
    }

    this.collections.clear();
    for (const c of DEFAULT_COLLECTIONS) {
      this.collections.set(c.id, { ...c });
    }

    // Initialize with a moderate baseline of neutral/early interest
    this.userInterests.clear();
    const initialTopics = [
      { topic: 'Astronomy', score: 0.65, count: 3 },
      { topic: 'Technology', score: 0.70, count: 4 },
      { topic: 'Photography', score: 0.50, count: 2 },
      { topic: 'Science', score: 0.55, count: 2 },
    ];

    for (const item of initialTopics) {
      const nowIso = new Date().toISOString();
      this.userInterests.set(item.topic.toLowerCase(), {
        id: `ui_demo_${item.topic.toLowerCase()}`,
        user_id: this.userProfile.id,
        topic: item.topic,
        score: item.score,
        short_term_score: item.score,
        long_term_score: item.score * 0.9,
        interaction_count: item.count,
        is_blocked: false,
        last_interaction_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Seed some initial comments for realism
    this.comments.set('vid_astro_jwst_01', [
      {
        id: 'comm_1',
        video_id: 'vid_astro_jwst_01',
        user_id: 'usr_sarah',
        username: 'sarah_stargazer',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        content: 'The diffraction spikes from the hexagonal mirrors make this look like pure poetry.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'comm_2',
        video_id: 'vid_astro_jwst_01',
        user_id: 'usr_alex',
        username: 'alex_physics',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        content: 'Unbelievable detail. The infrared penetration through the dust pillars is unprecedented.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }

  // --- Profile & Preferences ---
  public getProfile(): UserProfile {
    return { ...this.userProfile };
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    this.userProfile = { ...this.userProfile, ...updates };
    return this.getProfile();
  }

  public toggleBehavioralTracking(enabled: boolean): boolean {
    this.userProfile.behavioral_tracking_enabled = enabled;
    return enabled;
  }

  // --- Videos & Feed ---
  public getAllVideos(): Video[] {
    return Array.from(this.videos.values());
  }

  public getVideo(id: string): Video | undefined {
    return this.videos.get(id);
  }

  public addVideo(video: Video): Video {
    this.videos.set(video.id, video);
    return video;
  }

  /**
   * Generates a ranked, personalized vertical feed using the RecommendationEngine.
   */
  public getRankedFeed(params?: {
    limit?: number;
    cursor?: number;
    explorationRatio?: number;
    topicFilter?: string;
  }): { videos: RankedVideo[]; total: number; hasMore: boolean } {
    const { limit = 10, cursor = 0, explorationRatio = 0.25, topicFilter } = params || {};

    let candidateVideos = Array.from(this.videos.values());

    if (topicFilter && topicFilter !== 'All') {
      candidateVideos = candidateVideos.filter(
        (v) =>
          v.primary_topic.toLowerCase() === topicFilter.toLowerCase() ||
          v.topics.some((t) => t.toLowerCase() === topicFilter.toLowerCase())
      );
    }

    const interests = Array.from(this.userInterests.values());
    const blockedTopics = new Set<string>(
      interests.filter((i) => i.is_blocked).map((i) => i.topic.toLowerCase())
    );

    const ranked = recommendationEngine.rankVideos({
      videos: candidateVideos,
      userInterests: this.userProfile.behavioral_tracking_enabled ? interests : [],
      followedCreatorIds: this.userFollows,
      likedVideoIds: this.userLikes,
      watchedVideoIds: new Set(), // allow replay in feed
      blockedTopics,
      explorationRatio,
    });

    const paginated = ranked.slice(cursor, cursor + limit);

    return {
      videos: paginated,
      total: ranked.length,
      hasMore: cursor + limit < ranked.length,
    };
  }

  /**
   * Feed filtered strictly to followed creators.
   */
  public getFollowingFeed(limit = 10): RankedVideo[] {
    const followedVideos = Array.from(this.videos.values()).filter((v) =>
      this.userFollows.has(v.creator_id)
    );

    return followedVideos.slice(0, limit).map((v) => ({
      ...v,
      recommendation: {
        primary_reason: `From creator @${v.creator.username} you follow`,
        reasons: [`Followed creator: ${v.creator.display_name}`],
        matched_topics: [v.primary_topic],
        matched_creator: v.creator.username,
        is_exploration: false,
        score_breakdown: {
          user_topic_similarity: 1.0,
          recent_interaction: 1.0,
          creator_affinity: 1.0,
          content_similarity: 0.8,
          freshness: 0.9,
          exploration_boost: 0,
          diversity_penalty: 0,
          final_score: 1.0,
        },
      },
    }));
  }

  // --- Interaction Event Recording (Continuous Learning) ---
  public recordEvent(
    eventType: EventType,
    videoId: string,
    metadata?: {
      watch_duration_seconds?: number;
      completion_percentage?: number;
      comment_text?: string;
      collection_id?: string;
      session_id?: string;
    }
  ): { event: UserEvent; updatedInterests: UserInterest[] } {
    const video = this.videos.get(videoId);
    const now = new Date();
    const event: UserEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: this.userProfile.id,
      video_id: videoId,
      event_type: eventType,
      event_metadata: metadata,
      created_at: now.toISOString(),
    };

    this.userEvents.unshift(event);

    // Update user stats
    if (eventType === 'watch_completion' || eventType === 'progress') {
      this.watchedVideos.add(videoId);
      this.userProfile.stats.videos_watched = this.watchedVideos.size;
      if (metadata?.watch_duration_seconds) {
        this.userProfile.stats.total_watch_seconds += Math.round(metadata.watch_duration_seconds);
      }
    }

    // Skip machine learning updates if behavioral tracking is disabled
    if (!this.userProfile.behavioral_tracking_enabled || !video) {
      return { event, updatedInterests: this.getUserInterests() };
    }

    // Continuous learning signal calculation
    const signalDelta = recommendationEngine.calculateEventSignal(eventType, metadata);

    // Update primary topic
    const currentPrimary = this.userInterests.get(video.primary_topic.toLowerCase());
    const updatedPrimary = recommendationEngine.updateInterest(
      currentPrimary,
      video.primary_topic,
      this.userProfile.id,
      signalDelta,
      now
    );
    this.userInterests.set(video.primary_topic.toLowerCase(), updatedPrimary);

    // Also apply a fraction of signal to secondary topics for semantic bridge learning
    if (signalDelta > 0 && video.secondary_topics.length > 0) {
      for (const st of video.secondary_topics) {
        const currentSec = this.userInterests.get(st.toLowerCase());
        const updatedSec = recommendationEngine.updateInterest(
          currentSec,
          st,
          this.userProfile.id,
          signalDelta * 0.35,
          now
        );
        this.userInterests.set(st.toLowerCase(), updatedSec);
      }
    }

    return {
      event,
      updatedInterests: this.getUserInterests(),
    };
  }

  // --- Likes, Saves, Follows ---
  public toggleLike(videoId: string): { isLiked: boolean; likesCount: number } {
    const video = this.videos.get(videoId);
    if (!video) return { isLiked: false, likesCount: 0 };

    const isLiked = this.userLikes.has(videoId);
    if (isLiked) {
      this.userLikes.delete(videoId);
      video.likes_count = Math.max(0, video.likes_count - 1);
      this.userProfile.stats.likes_given = Math.max(0, this.userProfile.stats.likes_given - 1);
      this.recordEvent('unlike', videoId);
    } else {
      this.userLikes.add(videoId);
      video.likes_count += 1;
      this.userProfile.stats.likes_given += 1;
      this.recordEvent('like', videoId);
    }

    return { isLiked: !isLiked, likesCount: video.likes_count };
  }

  public isVideoLiked(videoId: string): boolean {
    return this.userLikes.has(videoId);
  }

  public getLikedVideos(): Video[] {
    return Array.from(this.userLikes)
      .map((id) => this.videos.get(id))
      .filter((v): v is Video => !!v);
  }

  public toggleSave(videoId: string, collectionId?: string): { isSaved: boolean; savesCount: number } {
    const video = this.videos.get(videoId);
    if (!video) return { isSaved: false, savesCount: 0 };

    const isSaved = this.userSaves.has(videoId);
    if (isSaved && !collectionId) {
      this.userSaves.delete(videoId);
      video.saves_count = Math.max(0, video.saves_count - 1);
      this.userProfile.stats.saved_videos = Math.max(0, this.userProfile.stats.saved_videos - 1);
      this.recordEvent('unsave', videoId);
    } else {
      this.userSaves.set(videoId, collectionId || 'col_watch_later');
      if (!isSaved) {
        video.saves_count += 1;
        this.userProfile.stats.saved_videos += 1;
      }
      this.recordEvent('save', videoId, { collection_id: collectionId });
    }

    return { isSaved: !isSaved, savesCount: video.saves_count };
  }

  public isVideoSaved(videoId: string): boolean {
    return this.userSaves.has(videoId);
  }

  public getSavedVideos(collectionId?: string): Video[] {
    const ids: string[] = [];
    this.userSaves.forEach((colId, videoId) => {
      if (!collectionId || colId === collectionId) {
        ids.push(videoId);
      }
    });

    return ids.map((id) => this.videos.get(id)).filter((v): v is Video => !!v);
  }

  public toggleFollowCreator(creatorId: string): boolean {
    const isFollowed = this.userFollows.has(creatorId);
    if (isFollowed) {
      this.userFollows.delete(creatorId);
      this.userProfile.stats.creators_followed = Math.max(0, this.userProfile.stats.creators_followed - 1);
    } else {
      this.userFollows.add(creatorId);
      this.userProfile.stats.creators_followed += 1;

      // Find a video by this creator to record event
      const sampleVideo = Array.from(this.videos.values()).find((v) => v.creator_id === creatorId);
      if (sampleVideo) {
        this.recordEvent('creator_follow', sampleVideo.id);
      }
    }
    return !isFollowed;
  }

  public isCreatorFollowed(creatorId: string): boolean {
    return this.userFollows.has(creatorId);
  }

  public getFollowedCreators(): Creator[] {
    const creatorsMap = new Map<string, Creator>();
    for (const v of this.videos.values()) {
      if (this.userFollows.has(v.creator_id)) {
        creatorsMap.set(v.creator_id, v.creator);
      }
    }
    return Array.from(creatorsMap.values());
  }

  // --- Collections ---
  public getCollections(): Collection[] {
    return Array.from(this.collections.values()).map((col) => {
      const count = Array.from(this.userSaves.values()).filter((cId) => cId === col.id).length;
      return { ...col, video_count: count };
    });
  }

  public createCollection(name: string, description?: string, icon?: string): Collection {
    const id = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const collection: Collection = {
      id,
      user_id: this.userProfile.id,
      name,
      description,
      icon: icon || 'bookmark',
      created_at: new Date().toISOString(),
      video_count: 0,
    };
    this.collections.set(id, collection);
    return collection;
  }

  public deleteCollection(id: string): boolean {
    return this.collections.delete(id);
  }

  // --- Comments ---
  public getComments(videoId: string): CommentItem[] {
    return this.comments.get(videoId) || [];
  }

  public addComment(videoId: string, content: string): CommentItem {
    const newComment: CommentItem = {
      id: `comm_${Date.now()}`,
      video_id: videoId,
      user_id: this.userProfile.id,
      username: this.userProfile.username,
      avatar_url: this.userProfile.avatar_url || '',
      content,
      created_at: new Date().toISOString(),
    };

    const list = this.comments.get(videoId) || [];
    list.unshift(newComment);
    this.comments.set(videoId, list);

    const video = this.videos.get(videoId);
    if (video) video.comments_count += 1;

    this.recordEvent('comment', videoId, { comment_text: content });

    return newComment;
  }

  // --- Interests & Self-Learning Controls ---
  public getUserInterests(): UserInterest[] {
    return Array.from(this.userInterests.values()).sort((a, b) => b.score - a.score);
  }

  public setInterestScore(topic: string, newScore: number): UserInterest {
    const key = topic.toLowerCase();
    const existing = this.userInterests.get(key);
    const updated = recommendationEngine.updateInterest(
      existing,
      topic,
      this.userProfile.id,
      (newScore - (existing?.score || 0.5)) * 10
    );
    this.userInterests.set(key, updated);
    return updated;
  }

  public blockTopic(topic: string): boolean {
    const key = topic.toLowerCase();
    const existing = this.userInterests.get(key);
    if (existing) {
      existing.is_blocked = true;
      existing.score = 0;
      this.userInterests.set(key, existing);
    } else {
      this.userInterests.set(key, {
        id: `ui_blocked_${key}`,
        user_id: this.userProfile.id,
        topic,
        score: 0,
        short_term_score: 0,
        long_term_score: 0,
        interaction_count: 0,
        is_blocked: true,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return true;
  }

  public unblockTopic(topic: string): boolean {
    const key = topic.toLowerCase();
    const existing = this.userInterests.get(key);
    if (existing) {
      existing.is_blocked = false;
      existing.score = 0.4;
      return true;
    }
    return false;
  }

  public resetRecommendationProfile(): void {
    this.userInterests.clear();
    this.userEvents = [];
    this.watchedVideos.clear();
    this.seed();
  }

  public clearHistory(): void {
    this.watchedVideos.clear();
    this.userEvents = this.userEvents.filter((e) => e.event_type !== 'watch_completion' && e.event_type !== 'progress');
    this.userProfile.stats.videos_watched = 0;
    this.userProfile.stats.total_watch_seconds = 0;
  }

  public exportData(): object {
    return {
      profile: this.userProfile,
      interests: this.getUserInterests(),
      likes: Array.from(this.userLikes),
      saves: Array.from(this.userSaves.entries()),
      follows: Array.from(this.userFollows),
      collections: this.getCollections(),
      recent_events_count: this.userEvents.length,
      exported_at: new Date().toISOString(),
    };
  }

  // --- Discovery, Search, Trends ---
  public getTrendingTopics(): { topic: string; count: number; score: number }[] {
    const counts: Record<string, { count: number; score: number }> = {};

    for (const v of this.videos.values()) {
      if (!counts[v.primary_topic]) {
        counts[v.primary_topic] = { count: 0, score: 0 };
      }
      counts[v.primary_topic].count += 1;
      counts[v.primary_topic].score += v.likes_count + v.saves_count * 2;
    }

    return Object.entries(counts)
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.score - a.score);
  }

  public searchContent(query: string): {
    videos: Video[];
    creators: Creator[];
    topics: string[];
  } {
    const clean = query.trim().toLowerCase();
    if (!clean) return { videos: [], creators: [], topics: [] };

    // Search videos by caption, hashtags, topic
    const matchedVideos = Array.from(this.videos.values()).filter(
      (v) =>
        v.caption.toLowerCase().includes(clean) ||
        v.primary_topic.toLowerCase().includes(clean) ||
        v.hashtags.some((h) => h.toLowerCase().includes(clean)) ||
        v.creator.display_name.toLowerCase().includes(clean) ||
        v.creator.username.toLowerCase().includes(clean)
    );

    // Search creators
    const creatorsMap = new Map<string, Creator>();
    for (const v of this.videos.values()) {
      if (
        v.creator.username.toLowerCase().includes(clean) ||
        v.creator.display_name.toLowerCase().includes(clean) ||
        v.creator.bio?.toLowerCase().includes(clean)
      ) {
        creatorsMap.set(v.creator.id, v.creator);
      }
    }

    // Search topics from taxonomy
    const matchedTopics = Object.keys(TOPIC_TAXONOMY).filter(
      (t) =>
        t.toLowerCase().includes(clean) ||
        TOPIC_TAXONOMY[t].keywords.some((k) => k.toLowerCase().includes(clean))
    );

    return {
      videos: matchedVideos,
      creators: Array.from(creatorsMap.values()),
      topics: matchedTopics,
    };
  }

  public getHistory(): { video: Video; watched_at: string }[] {
    const watchedEvents = this.userEvents.filter(
      (e) => e.event_type === 'watch_completion' || e.event_type === 'progress' || e.event_type === 'start'
    );

    const historyItems: { video: Video; watched_at: string }[] = [];
    const seen = new Set<string>();

    for (const evt of watchedEvents) {
      if (!seen.has(evt.video_id)) {
        seen.add(evt.video_id);
        const v = this.videos.get(evt.video_id);
        if (v) {
          historyItems.push({ video: v, watched_at: evt.created_at });
        }
      }
    }

    return historyItems;
  }
}

export const memoryStore = new MemoryStore();
