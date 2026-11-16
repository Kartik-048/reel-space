-- ====================================================================
-- REELSPACE Database Schema Migration
-- PostgreSQL with Supabase Row Level Security (RLS)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  behavioral_tracking_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATORS TABLE
CREATE TABLE IF NOT EXISTS public.creators (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('instagram', 'direct', 'youtube_shorts', 'user_submitted')),
  external_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image TEXT,
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('instagram', 'direct', 'youtube_shorts', 'user_submitted')),
  external_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  creator_id TEXT NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  primary_topic TEXT NOT NULL,
  secondary_topics TEXT[] DEFAULT '{}',
  duration_seconds INTEGER,
  publication_date TIMESTAMPTZ,
  content_language TEXT DEFAULT 'en',
  source_permissions TEXT,
  availability_status TEXT NOT NULL CHECK (availability_status IN ('native_playable', 'oembed_displayable', 'external_only')),
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'bookmark',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER EVENTS TABLE (Self-learning behavioral signal stream)
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USER INTERESTS TABLE (Dynamic Interest Profile Vector)
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score NUMERIC(5, 3) DEFAULT 0.500,
  short_term_score NUMERIC(5, 3) DEFAULT 0.500,
  long_term_score NUMERIC(5, 3) DEFAULT 0.500,
  interaction_count INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- 7. USER LIKES TABLE
CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- 8. USER SAVES TABLE
CREATE TABLE IF NOT EXISTS public.user_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id, collection_id)
);

-- 9. USER CREATOR FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.user_creator_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

-- 10. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RECOMMENDATION HISTORY TABLE (Evaluation & Transparency)
CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  ranking_score NUMERIC(6, 4) NOT NULL,
  recommendation_reason TEXT NOT NULL,
  algorithm_version TEXT DEFAULT 'v1.0.0-hybrid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_videos_primary_topic ON public.videos(primary_topic);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON public.videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_created ON public.user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_video_id ON public.user_events(video_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_topic ON public.user_interests(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_user_interests_score ON public.user_interests(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_video ON public.user_likes(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_saves_user_video ON public.user_saves(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_user_creator ON public.user_creator_follows(user_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON public.comments(video_id, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_creator_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read, user can update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Creators & Videos: Viewable by anyone
CREATE POLICY "Creators viewable by all" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Videos viewable by all" ON public.videos FOR SELECT USING (true);

-- User Events: User can only insert and view their own events
CREATE POLICY "Users view own events" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Interests: Private to each user
CREATE POLICY "Users view own interests" ON public.user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own interests" ON public.user_interests FOR ALL USING (auth.uid() = user_id);

-- User Likes: User owns their likes, visible to others for like count aggregate
CREATE POLICY "Users view all likes" ON public.user_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON public.user_likes FOR ALL USING (auth.uid() = user_id);

-- User Saves: Completely private to the user
CREATE POLICY "Users manage own saves" ON public.user_saves FOR ALL USING (auth.uid() = user_id);

-- Collections: Private to user
CREATE POLICY "Users manage own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);

-- Follows: User manages own follows
CREATE POLICY "Users manage own creator follows" ON public.user_creator_follows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view creator followers" ON public.user_creator_follows FOR SELECT USING (true);

-- Comments: Everyone can view, authenticated users can insert and delete own
CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Recommendation History: Private to user
CREATE POLICY "Users view own recommendation history" ON public.recommendation_history FOR ALL USING (auth.uid() = user_id);
