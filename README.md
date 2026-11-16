# REELSPACE — Intelligent, Self-Learning Short-Video Discovery Platform

> A production-minded short-form video discovery platform inspired by the vertical scrolling experience of Instagram Reels, powered by an autonomous, self-learning recommendation engine that continuously learns from user behavior, tracks interest evolution, and balances familiarity with horizon exploration.

---

## 🌟 Vision & Key Highlights

REELSPACE is **NOT an Instagram clone**. It is an independent discovery and machine-learning recommendation platform built around three fundamental tenets:

1. **Continuous Self-Learning Recommendation Engine**: The system does not rely on static categories or superficial hashtag matching. It tracks fine-grained user interactions (dwell duration, watch completion, replays, likes, saves, comments, quick skips, not-interested flags, and creator follows), applies exponential time decay, and maintains dual **short-term velocity** and **long-term decayed** interest vectors.
2. **Horizon Exploration & Bridge Adjacency**: To prevent content echo-chambers, the engine allocates an adaptive exploration ratio (default 75% exploitation / 25% intelligent exploration). When a user engages with multiple topics (e.g. *Astronomy* and *Photography*), the semantic topic graph identifies bridge intersections (e.g. *Astrophotography*) to expand the user's horizon naturally.
3. **Legitimate Content Architecture**: REELSPACE interfaces with legitimate external content providers using a modular abstraction. Public Instagram Reels are ingested via official endpoints or user-submitted URLs with honest fallbacks ("Open on Instagram"), respecting platform terms without web scraping, unauthorized session cookie reuse, or fabricated engagement statistics.

---

## 🏗️ System Architecture

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │                    REELSPACE CLIENT                         │
                               │  Next.js 15 (App Router) + TypeScript + Tailwind CSS        │
                               │  - Vertical Snap Feed (IntersectionObserver viewport sync)  │
                               │  - Action Rail (Like, Save, Comment, Follow, Not Interested)│
                               │  - Transparent "Why am I seeing this?" modal & sliders      │
                               └──────────────┬───────────────────────────────▲──────────────┘
                                              │                               │
                                    User Interaction Events             Personalized
                                    (Impressions, Dwell, Likes)         Ranked Feed
                                              │                               │
                                              ▼                               │
┌─────────────────────────────────────────────────────────────────────────────┴──────────────┐
│                                REELSPACE ENGINE & API LAYER                                │
│                                                                                            │
│   ┌───────────────────────────────┐               ┌─────────────────────────────────────┐  │
│   │   Content Provider Manager    │               │    Self-Learning Recommendation     │  │
│   │ - Instagram Provider (oEmbed) │               │ - Behavioral Event Ingestion        │  │
│   │ - Direct Native Stream (.mp4) │               │ - Dual-Vector Interest Profiler     │  │
│   │ - Community Submission Source │               │ - Multi-Factor Ranking Engine       │  │
│   │ - Automated Topic Classifier  │               │ - Bridge Exploration Adjacency      │  │
│   └──────────────┬────────────────┘               └──────────────────▲──────────────────┘  │
│                  │                                                   │                     │
└──────────────────┼───────────────────────────────────────────────────┼─────────────────────┘
                   │                                                   │
                   ▼                                                   │
┌──────────────────────────────────────────────────────────────────────┴─────────────────────┐
│                               PERSISTENT DATABASE (SUPABASE)                               │
│  PostgreSQL with Row Level Security (RLS) & Performance Indexes:                           │
│  - profiles            - videos             - creators            - user_events            │
│  - user_interests      - user_likes         - user_saves          - user_creator_follows   │
│  - collections         - comments           - recommendation_history                       │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Recommendation Engine Mathematics & Mechanics

### 1. Behavioral Signal Weights
Every interaction generates an event with calibrated signals:
- **Save to Collection**: `+5.0` *(Strongest interest signal)*
- **Creator Follow**: `+4.0`
- **Like Inside REELSPACE**: `+3.0`
- **Positive Comment**: `+3.0`
- **Meaningful Watch Completion** ($\ge 80\%$ duration): `+2.5`
- **Replay**: `+2.0`
- **Quick Skip** ($< 3\text{s}$ or $< 15\%$ duration): `-2.5`
- **Not Interested Action**: `-6.0` *(Rapid topic suppression)*

### 2. Exponential Time Decay Formula
To ensure changing interests evolve naturally rather than trapping the user in their earliest queries, scores decay over time:
$$S(t) = S_0 \cdot e^{-\lambda \cdot \Delta t}$$
- **Short-Term Half-Life**: $\approx 2\text{ days}$ ($\lambda_{short} = 0.35$)
- **Long-Term Half-Life**: $\approx 14\text{ days}$ ($\lambda_{long} = 0.05$)

### 3. Multi-Factor Video Ranking Formula
For each candidate video, the ranking score is calculated as:
$$\begin{aligned}
\text{Ranking Score} = & \; 0.25 \times \text{User-Topic Similarity} \\
& + 0.20 \times \text{Recent Interaction Velocity} \\
& + 0.15 \times \text{Creator Affinity} \\
& + 0.15 \times \text{Content Semantic Similarity} \\
& + 0.10 \times \text{Freshness Decay} \\
& + 0.10 \times \text{Exploration & Bridge Boost} \\
& + 0.05 \times \text{Diversity Contribution}
\end{aligned}$$

### 4. Anti-Monotony & Diversity Controls
- **Immediate Creator Repetition Penalty**: $-0.15$ if candidate has the same creator as the preceding video.
- **Topic Clustering Penalty**: $-0.25$ if candidate shares the same primary topic as the last two consecutive videos.
- **Hard Filter**: Blocked topics have their score forced to $-\infty$ and are completely filtered out.

---

## 🧪 Automated Test Suite (100% Pass)

Run automated recommendation engine verification:
```bash
npm test
```

Verification Scenarios:
1. **Scenario 1**: Repeated engagement with astronomy increases astronomy recommendation score ($0.70 \to 0.909$).
2. **Scenario 2**: Repeated quick skips reduce topic score ($0.75 \to 0.255$).
3. **Scenario 3**: Saving a video applies strong $+5.0$ signal and boosts topic relevance to $\ge 0.8$.
4. **Scenario 4**: New topics emerge dynamically from unvisited video completions.
5. **Scenario 5**: Exponential time decay decreases score over time ($0.90 \to 0.634$ at 7 days $\to 0.201$ at 30 days).
6. **Scenario 6**: Blocked topics are $100\%$ suppressed from the recommendation feed.
7. **Scenario 7**: Creator anti-monotony penalty triggers on consecutive same-creator candidates.
8. **Scenario 8**: Intelligent bridge connects user interests in *Astronomy* and *Photography* into *Astrophotography*.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy the template and configure your Supabase credentials:
```bash
cp .env.example .env.local
```

### 4. Database Setup (Supabase)
Apply the complete PostgreSQL migration located at:
`supabase/migrations/20260216000000_init_reelspace.sql`
In your Supabase SQL Editor. This sets up all tables, foreign keys, performance indexes, and Row Level Security policies.

### 5. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
npm start
```
