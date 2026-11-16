// Native REELSPACE Automated Recommendation Engine Test Suite
import { RecommendationEngine } from '../src/lib/recommendation/engine.ts';
import { TOPIC_TAXONOMY, findBridgeTopic } from '../src/lib/recommendation/taxonomy.ts';
import type { Video, UserInterest } from '../src/types/index.ts';

console.log('===================================================================');
console.log('🧪 RUNNING REELSPACE SELF-LEARNING RECOMMENDATION TEST SUITE');
console.log('===================================================================\n');

let passedCount = 0;
const totalCount = 8;

const engine = new RecommendationEngine();

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
    creator_id: 'cr_jake',
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

// 1. Repeated engagement test
try {
  let interest: UserInterest | undefined = undefined;
  const likeDelta = engine.calculateEventSignal('like');
  const saveDelta = engine.calculateEventSignal('save');

  interest = engine.updateInterest(interest, 'Astronomy', 'user_1', likeDelta);
  const score1 = interest.score;

  interest = engine.updateInterest(interest, 'Astronomy', 'user_1', likeDelta);
  interest = engine.updateInterest(interest, 'Astronomy', 'user_1', saveDelta);

  if (interest.score > score1 && interest.score > 0.7 && interest.interaction_count === 3) {
    console.log(`✅ Scenario 1: Repeated engagement with astronomy increases astronomy score (${score1} -> ${interest.score})`);
    passedCount++;
  } else {
    console.error('❌ Scenario 1 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 1 Exception:', e);
}

// 2. Skipping reduces relevance
try {
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

  if (gamingInterest.score < 0.75 && gamingInterest.short_term_score < 0.60) {
    console.log(`✅ Scenario 2: Quick skips reduce topic score (0.75 -> ${gamingInterest.score})`);
    passedCount++;
  } else {
    console.error('❌ Scenario 2 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 2 Exception:', e);
}

// 3. Saving a video increases similar content relevance
try {
  const saveSignal = engine.calculateEventSignal('save');
  const interest = engine.updateInterest(undefined, 'Photography', 'user_1', saveSignal);
  if (saveSignal === 5.0 && interest.score >= 0.8) {
    console.log(`✅ Scenario 3: Saving a video applies strong +5.0 signal and boosts topic relevance to ${interest.score}`);
    passedCount++;
  } else {
    console.error('❌ Scenario 3 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 3 Exception:', e);
}

// 4. Topic emergence
try {
  const watchSignal = engine.calculateEventSignal('watch_completion');
  const newInterest = engine.updateInterest(undefined, 'Astrophotography', 'user_1', watchSignal);
  if (newInterest.topic === 'Astrophotography' && newInterest.score > 0.5) {
    console.log(`✅ Scenario 4: New topic emerges with initial calibrated score (${newInterest.score})`);
    passedCount++;
  } else {
    console.error('❌ Scenario 4 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 4 Exception:', e);
}

// 5. Time decay
try {
  const initial = 0.90;
  const decayed7 = engine.applyTimeDecay(initial, 7, false);
  const decayed30 = engine.applyTimeDecay(initial, 30, false);
  if (decayed7 < initial && decayed30 < decayed7) {
    console.log(`✅ Scenario 5: Exponential time decay decreases score over time (0.90 -> ${decayed7.toFixed(3)} at 7d -> ${decayed30.toFixed(3)} at 30d)`);
    passedCount++;
  } else {
    console.error('❌ Scenario 5 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 5 Exception:', e);
}

// 6. Blocked topics exclusion
try {
  const blockedTopics = new Set(['gaming']);
  const ranked = engine.rankVideos({
    videos: mockVideos,
    userInterests: [{
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
    }],
    followedCreatorIds: new Set(),
    likedVideoIds: new Set(),
    watchedVideoIds: new Set(),
    blockedTopics,
  });

  const hasGaming = ranked.some(v => v.primary_topic.toLowerCase() === 'gaming');
  if (!hasGaming) {
    console.log('✅ Scenario 6: Blocked topics are 100% suppressed from recommendation feed');
    passedCount++;
  } else {
    console.error('❌ Scenario 6 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 6 Exception:', e);
}

// 7. Creator anti-repetition penalty
try {
  const ranked = engine.rankVideos({
    videos: mockVideos,
    userInterests: [{
      id: 'ui_gaming',
      user_id: 'user_1',
      topic: 'Gaming',
      score: 0.95,
      short_term_score: 0.95,
      long_term_score: 0.90,
      interaction_count: 5,
      is_blocked: false,
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    followedCreatorIds: new Set(),
    likedVideoIds: new Set(),
    watchedVideoIds: new Set(),
    blockedTopics: new Set(),
  });

  const penalized = ranked.some((v, idx) => {
    return idx > 0 && v.creator_id === ranked[idx - 1].creator_id && v.recommendation.score_breakdown.diversity_penalty > 0;
  });

  if (penalized) {
    console.log('✅ Scenario 7: Creator anti-monotony penalty triggers on consecutive same-creator candidates');
    passedCount++;
  } else {
    console.error('❌ Scenario 7 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 7 Failed');
}

// 8. Exploration Bridge
try {
  const bridge = findBridgeTopic('Astronomy', 'Photography');
  const ranked = engine.rankVideos({
    videos: mockVideos,
    userInterests: [
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
    ],
    followedCreatorIds: new Set(),
    likedVideoIds: new Set(),
    watchedVideoIds: new Set(),
    blockedTopics: new Set(),
    explorationRatio: 0.25,
  });

  const bridgeVid = ranked.find(v => v.id === 'v_astrophoto_bridge');
  if (bridge === 'Astrophotography' && bridgeVid && bridgeVid.recommendation.is_exploration) {
    console.log('✅ Scenario 8: Intelligent bridge discovered Astrophotography from Astronomy + Photography with exploration boost');
    passedCount++;
  } else {
    console.error('❌ Scenario 8 Failed');
  }
} catch (e) {
  console.error('❌ Scenario 8 Exception:', e);
}

console.log('\n===================================================================');
console.log(`📊 TEST RESULTS: ${passedCount}/${totalCount} SCENARIOS PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
console.log('===================================================================');

if (passedCount !== totalCount) {
  process.exit(1);
}
