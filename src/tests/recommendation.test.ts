import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationEngine } from '../lib/recommendation/engine';
import { Video, UserInterest } from '../types';

describe('REELSPACE Self-Learning Recommendation Engine', () => {
  let engine: RecommendationEngine;

  const mockVideos: Video[] = [
    {
      id: 'v_astro_1',
      provider: 'direct',
      external_id: 'e1',
      original_url: 'https://example.com/astro1',
      creator_id: 'cr_elena',
      creator: {
        id: 'cr_elena',
        provider: 'direct',
        external_id: 'elena',
        username: 'elena',
        display_name: 'Elena Vance',
        profile_image: '',
      },
      caption: 'Stunning James Webb cosmic deep field #astronomy #space',
      thumbnail_url: '',
      hashtags: ['#astronomy', '#space'],
      topics: ['Astronomy', 'Space Exploration'],
      primary_topic: 'Astronomy',
      secondary_topics: ['Space Exploration'],
      availability_status: 'native_playable',
      likes_count: 10,
      saves_count: 5,
      comments_count: 2,
      views_count: 100,
      created_at: new Date().toISOString(),
    },
    {
      id: 'v_astrophoto_bridge',
      provider: 'direct',
      external_id: 'e2',
      original_url: 'https://example.com/bridge',
      creator_id: 'cr_mark',
      creator: {
        id: 'cr_mark',
        provider: 'direct',
        external_id: 'mark',
        username: 'mark',
        display_name: 'Mark Astrophotographer',
        profile_image: '',
      },
      caption: 'Milky way night photography with long exposure #astrophotography #photography',
      thumbnail_url: '',
      hashtags: ['#astrophotography', '#photography'],
      topics: ['Astrophotography', 'Photography', 'Astronomy'],
      primary_topic: 'Astrophotography',
      secondary_topics: ['Photography', 'Astronomy'],
      availability_status: 'native_playable',
      likes_count: 20,
      saves_count: 15,
      comments_count: 4,
      views_count: 200,
      created_at: new Date().toISOString(),
    },
    {
      id: 'v_gaming_1',
      provider: 'direct',
      external_id: 'e3',
      original_url: 'https://example.com/game1',
      creator_id: 'cr_jake',
      creator: {
        id: 'cr_jake',
        provider: 'direct',
        external_id: 'jake',
        username: 'jake',
        display_name: 'Jake Reynolds',
        profile_image: '',
      },
      caption: 'Speedrun clutch world record #gaming #esports',
      thumbnail_url: '',
      hashtags: ['#gaming', '#esports'],
      topics: ['Gaming', 'Comedy'],
      primary_topic: 'Gaming',
      secondary_topics: ['Comedy'],
      availability_status: 'native_playable',
      likes_count: 5,
      saves_count: 2,
      comments_count: 1,
      views_count: 50,
      created_at: new Date().toISOString(),
    },
    {
      id: 'v_gaming_2',
      provider: 'direct',
      external_id: 'e4',
      original_url: 'https://example.com/game2',
      creator_id: 'cr_jake', // Same creator as v_gaming_1
      creator: {
        id: 'cr_jake',
        provider: 'direct',
        external_id: 'jake',
        username: 'jake',
        display_name: 'Jake Reynolds',
        profile_image: '',
      },
      caption: 'Another clutch gameplay moment #gaming',
      thumbnail_url: '',
      hashtags: ['#gaming'],
      topics: ['Gaming'],
      primary_topic: 'Gaming',
      secondary_topics: [],
      availability_status: 'native_playable',
      likes_count: 8,
      saves_count: 3,
      comments_count: 2,
      views_count: 80,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  // TEST 1: Repeated engagement increases topic recommendation score
  it('Scenario 1: Repeated engagement with astronomy increases astronomy recommendations', () => {
    let interest: UserInterest | undefined = undefined;

    // Simulate 3 likes and a save on Astronomy
    const likeDelta = engine.calculateEventSignal('like');
    const saveDelta = engine.calculateEventSignal('save');

    interest = engine.updateInterest(interest, 'Astronomy', 'user_1', likeDelta);
    const scoreAfterFirstLike = interest.score;

    interest = engine.updateInterest(interest, 'Astronomy', 'user_1', likeDelta);
    interest = engine.updateInterest(interest, 'Astronomy', 'user_1', saveDelta);

    expect(interest.score).toBeGreaterThan(scoreAfterFirstLike);
    expect(interest.interaction_count).toBe(3);
    expect(interest.score).toBeGreaterThan(0.7);
  });

  // TEST 2: Repeatedly skipping reduces relevance
  it('Scenario 2: Repeatedly skipping a topic reduces its relevance', () => {
    let gamingInterest: UserInterest = {
      id: 'ui_gaming',
      user_id: 'user_1',
      topic: 'Gaming',
      score: 0.75,
      short_term_score: 0.75,
      long_term_score: 0.70,
      interaction_count: 5,
      is_blocked: false,
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const skipDelta = engine.calculateEventSignal('quick_skip');
    gamingInterest = engine.updateInterest(gamingInterest, 'Gaming', 'user_1', skipDelta);
    gamingInterest = engine.updateInterest(gamingInterest, 'Gaming', 'user_1', skipDelta);

    expect(gamingInterest.score).toBeLessThan(0.75);
    expect(gamingInterest.short_term_score).toBeLessThan(0.60);
  });

  // TEST 3: Saving a video increases similar content score
  it('Scenario 3: Saving a video increases similar content relevance', () => {
    const saveSignal = engine.calculateEventSignal('save');
    expect(saveSignal).toBe(5.0); // +5 signal

    const interest = engine.updateInterest(undefined, 'Photography', 'user_1', saveSignal);
    expect(interest.score).toBeGreaterThanOrEqual(0.8);
  });

  // TEST 4: New interests can emerge
  it('Scenario 4: New interests can emerge from discovery interactions', () => {
    const watchSignal = engine.calculateEventSignal('watch_completion');
    const newTopicInterest = engine.updateInterest(
      undefined,
      'Astrophotography',
      'user_1',
      watchSignal
    );

    expect(newTopicInterest).toBeDefined();
    expect(newTopicInterest.topic).toBe('Astrophotography');
    expect(newTopicInterest.score).toBeGreaterThan(0.5);
    expect(newTopicInterest.interaction_count).toBe(1);
  });

  // TEST 5: Old interests gradually decay over time
  it('Scenario 5: Old interests gradually decay unless reinforced', () => {
    const initialScore = 0.90;
    // Decay after 7 days
    const decayedScore7Days = engine.applyTimeDecay(initialScore, 7, false);
    // Decay after 30 days
    const decayedScore30Days = engine.applyTimeDecay(initialScore, 30, false);

    expect(decayedScore7Days).toBeLessThan(initialScore);
    expect(decayedScore30Days).toBeLessThan(decayedScore7Days);
  });

  // TEST 6: Blocked topic is 100% excluded from recommendations
  it('Scenario 6: A blocked topic is excluded from recommendations', () => {
    const blockedTopics = new Set<string>(['gaming']);
    const userInterests: UserInterest[] = [
      {
        id: 'ui_1',
        user_id: 'user_1',
        topic: 'Astronomy',
        score: 0.9,
        short_term_score: 0.9,
        long_term_score: 0.8,
        interaction_count: 5,
        is_blocked: false,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const ranked = engine.rankVideos({
      videos: mockVideos,
      userInterests,
      followedCreatorIds: new Set(),
      likedVideoIds: new Set(),
      watchedVideoIds: new Set(),
      blockedTopics,
    });

    const hasGaming = ranked.some((v) => v.primary_topic.toLowerCase() === 'gaming');
    expect(hasGaming).toBe(false);
  });

  // TEST 7: Algorithm prevents repetitive creators
  it('Scenario 7: Prevents endless repetition of the same creator', () => {
    const userInterests: UserInterest[] = [
      {
        id: 'ui_gaming',
        user_id: 'user_1',
        topic: 'Gaming',
        score: 0.9,
        short_term_score: 0.9,
        long_term_score: 0.8,
        interaction_count: 5,
        is_blocked: false,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const ranked = engine.rankVideos({
      videos: mockVideos,
      userInterests,
      followedCreatorIds: new Set(),
      likedVideoIds: new Set(),
      watchedVideoIds: new Set(),
      blockedTopics: new Set(),
    });

    // Check if diversity penalty was computed
    const consecutiveSameCreator = ranked.some((v, idx) => {
      if (idx === 0) return false;
      return v.creator_id === ranked[idx - 1].creator_id && v.recommendation.score_breakdown.diversity_penalty > 0;
    });

    // The second consecutive video from same creator should trigger diversity penalty
    expect(consecutiveSameCreator).toBe(true);
  });

  // TEST 8: Exploration bridge connects user interests
  it('Scenario 8: Exploration bridge connects Astronomy and Photography into Astrophotography', () => {
    const userInterests: UserInterest[] = [
      {
        id: 'ui_astro',
        user_id: 'user_1',
        topic: 'Astronomy',
        score: 0.92,
        short_term_score: 0.90,
        long_term_score: 0.85,
        interaction_count: 8,
        is_blocked: false,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ui_photo',
        user_id: 'user_1',
        topic: 'Photography',
        score: 0.88,
        short_term_score: 0.85,
        long_term_score: 0.80,
        interaction_count: 6,
        is_blocked: false,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const ranked = engine.rankVideos({
      videos: mockVideos,
      userInterests,
      followedCreatorIds: new Set(),
      likedVideoIds: new Set(),
      watchedVideoIds: new Set(),
      blockedTopics: new Set(),
      explorationRatio: 0.25,
    });

    const bridgeVideo = ranked.find((v) => v.id === 'v_astrophoto_bridge');
    expect(bridgeVideo).toBeDefined();
    expect(bridgeVideo?.recommendation.is_exploration).toBe(true);
    expect(bridgeVideo?.recommendation.score_breakdown.exploration_boost).toBeGreaterThan(0.8);
  });
});
