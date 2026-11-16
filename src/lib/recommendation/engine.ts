import type { Video, RankedVideo, UserInterest, RecommendationExplanation, EventType } from '../../types/index.ts';
import { TOPIC_TAXONOMY, findBridgeTopic } from './taxonomy.ts';

export interface SignalWeights {
  save: number;
  like: number;
  creator_follow: number;
  comment: number;
  watch_completion: number;
  replay: number;
  quick_skip: number;
  not_interested: number;
  collection_add: number;
}

export const DEFAULT_SIGNAL_WEIGHTS: SignalWeights = {
  save: 5.0,
  like: 3.0,
  creator_follow: 4.0,
  comment: 3.0,
  watch_completion: 2.5,
  replay: 2.0,
  quick_skip: -2.5,
  not_interested: -6.0,
  collection_add: 4.5,
};

export interface RankingWeights {
  user_topic_similarity: number;   // 0.25
  recent_interaction: number;       // 0.20
  creator_affinity: number;         // 0.15
  content_similarity: number;       // 0.15
  freshness: number;                // 0.10
  exploration_potential: number;    // 0.10
  diversity_contribution: number;   // 0.05
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  user_topic_similarity: 0.25,
  recent_interaction: 0.20,
  creator_affinity: 0.15,
  content_similarity: 0.15,
  freshness: 0.10,
  exploration_potential: 0.10,
  diversity_contribution: 0.05,
};

export class RecommendationEngine {
  private signalWeights: SignalWeights;
  private rankingWeights: RankingWeights;
  private shortTermDecayLambda: number = 0.35; // ~2 day half-life
  private longTermDecayLambda: number = 0.05;  // ~14 day half-life

  constructor(
    signalWeights: Partial<SignalWeights> = {},
    rankingWeights: Partial<RankingWeights> = {}
  ) {
    this.signalWeights = { ...DEFAULT_SIGNAL_WEIGHTS, ...signalWeights };
    this.rankingWeights = { ...DEFAULT_RANKING_WEIGHTS, ...rankingWeights };
  }

  /**
   * Applies exponential time decay to an interest score given the elapsed days.
   * score(t) = score * e^(-lambda * dt)
   */
  public applyTimeDecay(
    score: number,
    daysSinceLastInteraction: number,
    isShortTerm: boolean = false
  ): number {
    const lambda = isShortTerm ? this.shortTermDecayLambda : this.longTermDecayLambda;
    return Math.max(0, score * Math.exp(-lambda * daysSinceLastInteraction));
  }

  /**
   * Computes the incremental delta for a user's interest profile following an interaction.
   */
  public calculateEventSignal(
    eventType: EventType,
    metadata?: { watch_duration_seconds?: number; completion_percentage?: number }
  ): number {
    switch (eventType) {
      case 'save':
        return this.signalWeights.save;
      case 'like':
        return this.signalWeights.like;
      case 'creator_follow':
        return this.signalWeights.creator_follow;
      case 'comment':
        return this.signalWeights.comment;
      case 'collection_add':
        return this.signalWeights.collection_add;
      case 'replay':
        return this.signalWeights.replay;
      case 'watch_completion':
        return this.signalWeights.watch_completion;
      case 'progress':
        if (metadata?.completion_percentage && metadata.completion_percentage >= 0.8) {
          return this.signalWeights.watch_completion;
        }
        return 0.5;
      case 'quick_skip':
        return this.signalWeights.quick_skip;
      case 'not_interested':
        return this.signalWeights.not_interested;
      default:
        return 0.2; // minimal discovery signal for impressions
    }
  }

  /**
   * Updates an existing or new interest profile based on an event.
   * Handles both short-term rapid spikes and long-term reinforced affinity.
   */
  public updateInterest(
    currentInterest: UserInterest | undefined,
    topic: string,
    userId: string,
    delta: number,
    now: Date = new Date()
  ): UserInterest {
    const nowIso = now.toISOString();

    if (!currentInterest) {
      const initialScore = Math.min(1.0, Math.max(0.0, 0.4 + (delta / 10)));
      return {
        id: `ui_${userId}_${topic.toLowerCase().replace(/\s+/g, '_')}`,
        user_id: userId,
        topic,
        score: initialScore,
        short_term_score: initialScore,
        long_term_score: initialScore * 0.8,
        interaction_count: 1,
        is_blocked: delta <= -5,
        last_interaction_at: nowIso,
        updated_at: nowIso,
      };
    }

    // Calculate days elapsed for decay
    const lastDate = new Date(currentInterest.last_interaction_at);
    const elapsedDays = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    // Decay previous scores
    const decayedShort = this.applyTimeDecay(currentInterest.short_term_score, elapsedDays, true);
    const decayedLong = this.applyTimeDecay(currentInterest.long_term_score, elapsedDays, false);

    // Apply incremental update with diminishing returns
    // Score delta scaled by factor
    const impact = delta > 0 ? (delta / 10) * (1.0 - decayedShort * 0.4) : (delta / 8);

    const newShort = Math.min(1.0, Math.max(0.0, decayedShort + impact));
    const newLong = Math.min(1.0, Math.max(0.0, decayedLong + (impact * 0.4)));

    // Combined score: 60% short term (immediate interest) + 40% long term (sustained interest)
    const combined = Math.min(1.0, Math.max(0.0, (newShort * 0.6) + (newLong * 0.4)));

    return {
      ...currentInterest,
      score: Number(combined.toFixed(3)),
      short_term_score: Number(newShort.toFixed(3)),
      long_term_score: Number(newLong.toFixed(3)),
      interaction_count: currentInterest.interaction_count + 1,
      is_blocked: delta <= -5 ? true : currentInterest.is_blocked,
      last_interaction_at: nowIso,
      updated_at: nowIso,
    };
  }

  /**
   * Ranks candidates using multi-factor scoring and exploration/exploitation balancing.
   */
  public rankVideos(params: {
    videos: Video[];
    userInterests: UserInterest[];
    followedCreatorIds: Set<string>;
    likedVideoIds: Set<string>;
    watchedVideoIds: Set<string>;
    blockedTopics: Set<string>;
    explorationRatio?: number; // default ~0.25
  }): RankedVideo[] {
    const {
      videos,
      userInterests,
      followedCreatorIds,
      likedVideoIds,
      watchedVideoIds,
      blockedTopics,
      explorationRatio = 0.25,
    } = params;

    const interestMap = new Map<string, UserInterest>();
    for (const interest of userInterests) {
      interestMap.set(interest.topic.toLowerCase(), interest);
    }

    // Identify user's top 2 interests to find potential bridge topics
    const topInterests = [...userInterests]
      .filter((i) => !i.is_blocked && i.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const bridgeTopics = new Set<string>();
    if (topInterests.length >= 2) {
      const bridge = findBridgeTopic(topInterests[0].topic, topInterests[1].topic);
      if (bridge) bridgeTopics.add(bridge.toLowerCase());
      if (topInterests.length >= 3) {
        const bridge2 = findBridgeTopic(topInterests[0].topic, topInterests[2].topic);
        if (bridge2) bridgeTopics.add(bridge2.toLowerCase());
      }
    }

    const scoredVideos: { video: Video; explanation: RecommendationExplanation; score: number }[] = [];

    const now = Date.now();

    for (const video of videos) {
      // Hard filter: Blocked topics
      const isBlocked =
        blockedTopics.has(video.primary_topic.toLowerCase()) ||
        video.topics.some((t) => blockedTopics.has(t.toLowerCase()));

      if (isBlocked) {
        continue;
      }

      // Hard filter: Don't repeatedly re-recommend recently watched videos
      if (watchedVideoIds.has(video.id)) {
        continue;
      }

      // 1. User-topic similarity
      let primaryInterest = interestMap.get(video.primary_topic.toLowerCase());
      let topicScore = primaryInterest ? primaryInterest.score : 0.2; // baseline for unvisited
      let recentScore = primaryInterest ? primaryInterest.short_term_score : 0.15;

      // Check secondary topics for extra semantic boost
      let secondaryBonus = 0;
      const matchedTopics: string[] = [];
      if (primaryInterest && primaryInterest.score > 0.4) {
        matchedTopics.push(video.primary_topic);
      }

      for (const st of video.secondary_topics) {
        const si = interestMap.get(st.toLowerCase());
        if (si && si.score > 0.3) {
          secondaryBonus += si.score * 0.15;
          matchedTopics.push(st);
        }
      }
      topicScore = Math.min(1.0, topicScore + secondaryBonus);

      // 2. Creator affinity
      const isCreatorFollowed = followedCreatorIds.has(video.creator_id);
      const creatorScore = isCreatorFollowed ? 1.0 : 0.2;

      // 3. Content similarity (based on liked videos overlapping topics)
      let contentSimScore = 0.2;
      if (matchedTopics.length > 0) {
        contentSimScore = Math.min(1.0, 0.4 + matchedTopics.length * 0.2);
      }

      // 4. Freshness
      const videoAgeDays = Math.max(0, (now - new Date(video.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const freshnessScore = Math.exp(-0.08 * videoAgeDays); // gradual decay

      // 5. Exploration potential
      const isBridge = bridgeTopics.has(video.primary_topic.toLowerCase());
      const isEmerging = primaryInterest && primaryInterest.interaction_count < 3 && primaryInterest.short_term_score > 0.5;
      const isUnvisited = !primaryInterest;

      let explorationScore = 0.1;
      let isExploration = false;

      if (isBridge) {
        explorationScore = 0.95;
        isExploration = true;
      } else if (isEmerging) {
        explorationScore = 0.8;
        isExploration = true;
      } else if (isUnvisited) {
        explorationScore = 0.5;
      }

      // Calculate weighted raw score
      const rawScore =
        topicScore * this.rankingWeights.user_topic_similarity +
        recentScore * this.rankingWeights.recent_interaction +
        creatorScore * this.rankingWeights.creator_affinity +
        contentSimScore * this.rankingWeights.content_similarity +
        freshnessScore * this.rankingWeights.freshness +
        explorationScore * this.rankingWeights.exploration_potential +
        0.5 * this.rankingWeights.diversity_contribution;

      // Generate transparent explanation
      const reasons: string[] = [];
      let primaryReason = 'Recommended for you';

      if (isCreatorFollowed) {
        reasons.push(`From ${video.creator.display_name} whom you follow`);
        primaryReason = `From creator @${video.creator.username} you follow`;
      } else if (isBridge && topInterests.length >= 2) {
        reasons.push(`Explores ${video.primary_topic}, connecting your interests in ${topInterests[0].topic} and ${topInterests[1].topic}`);
        primaryReason = `Bridge topic connecting ${topInterests[0].topic} & ${topInterests[1].topic}`;
      } else if (primaryInterest && primaryInterest.score >= 0.7) {
        reasons.push(`Because you frequently engage with #${video.primary_topic.toLowerCase()}`);
        primaryReason = `Because you love ${video.primary_topic}`;
      } else if (primaryInterest && primaryInterest.short_term_score > 0.5) {
        reasons.push(`Based on your recent interest in ${video.primary_topic}`);
        primaryReason = `Trending in your recent topics: ${video.primary_topic}`;
      } else if (matchedTopics.length > 0) {
        reasons.push(`Similar to topics you recently saved: ${matchedTopics.join(', ')}`);
        primaryReason = `Matches topics you enjoy (${matchedTopics.slice(0, 2).join(', ')})`;
      } else {
        reasons.push(`Trending discovery in ${video.primary_topic}`);
        primaryReason = `Fresh discovery: ${video.primary_topic}`;
        isExploration = true;
      }

      const explanation: RecommendationExplanation = {
        primary_reason: primaryReason,
        reasons,
        matched_topics: matchedTopics,
        matched_creator: isCreatorFollowed ? video.creator.username : undefined,
        is_exploration: isExploration,
        score_breakdown: {
          user_topic_similarity: Number(topicScore.toFixed(3)),
          recent_interaction: Number(recentScore.toFixed(3)),
          creator_affinity: Number(creatorScore.toFixed(3)),
          content_similarity: Number(contentSimScore.toFixed(3)),
          freshness: Number(freshnessScore.toFixed(3)),
          exploration_boost: Number(explorationScore.toFixed(3)),
          diversity_penalty: 0,
          final_score: Number(rawScore.toFixed(3)),
        },
      };

      scoredVideos.push({
        video,
        explanation,
        score: rawScore,
      });
    }

    // Sort initially by raw score
    scoredVideos.sort((a, b) => b.score - a.score);

    // Apply Repetition Control & Diversity Re-ranking (Section 9)
    // Separate into exploited (personalized) and exploratory pool
    const exploitedPool = scoredVideos.filter((s) => !s.explanation.is_exploration);
    const exploratoryPool = scoredVideos.filter((s) => s.explanation.is_exploration);

    const result: RankedVideo[] = [];
    const recentCreators: string[] = [];
    const recentTopics: string[] = [];

    const totalCount = scoredVideos.length;
    let expIndex = 0;
    let explIndex = 0;

    while (result.length < totalCount && (expIndex < exploitedPool.length || explIndex < exploratoryPool.length)) {
      // Determine if current slot should be exploration based on explorationRatio
      const shouldExplore =
        (result.length % Math.round(1 / explorationRatio) === 0 && explIndex < exploratoryPool.length) ||
        expIndex >= exploitedPool.length;

      let candidate: { video: Video; explanation: RecommendationExplanation; score: number } | null = null;

      if (shouldExplore && explIndex < exploratoryPool.length) {
        candidate = exploratoryPool[explIndex++];
      } else if (expIndex < exploitedPool.length) {
        candidate = exploitedPool[expIndex++];
      } else if (explIndex < exploratoryPool.length) {
        candidate = exploratoryPool[explIndex++];
      }

      if (!candidate) break;

      // Diversity checks:
      // 1. Avoid immediate consecutive same creator
      if (recentCreators.length > 0 && recentCreators[recentCreators.length - 1] === candidate.video.creator_id) {
        candidate.explanation.score_breakdown.diversity_penalty = 0.15;
        candidate.score -= 0.15;
      }

      // 2. Avoid 3 consecutive same primary topic
      if (
        recentTopics.length >= 2 &&
        recentTopics[recentTopics.length - 1] === candidate.video.primary_topic &&
        recentTopics[recentTopics.length - 2] === candidate.video.primary_topic
      ) {
        candidate.explanation.score_breakdown.diversity_penalty = 0.25;
        candidate.score -= 0.25;
      }

      candidate.explanation.score_breakdown.final_score = Number(candidate.score.toFixed(3));

      recentCreators.push(candidate.video.creator_id);
      recentTopics.push(candidate.video.primary_topic);

      result.push({
        ...candidate.video,
        recommendation: candidate.explanation,
      });
    }

    return result;
  }
}

export const recommendationEngine = new RecommendationEngine();
