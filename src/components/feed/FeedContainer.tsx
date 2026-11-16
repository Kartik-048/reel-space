'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RankedVideo } from '@/types';
import { VideoPlayer } from './VideoPlayer';
import { Sparkles, SlidersHorizontal, RefreshCw, AlertCircle } from 'lucide-react';

interface FeedContainerProps {
  endpoint?: string;
  initialTopic?: string;
  onOpenTuning?: () => void;
}

export function FeedContainer({
  endpoint = '/api/feed',
  initialTopic = 'All',
  onOpenTuning,
}: FeedContainerProps) {
  const [videos, setVideos] = useState<RankedVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [explorationRatio, setExplorationRatio] = useState(0.25);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const topicsList = [
    'All',
    'Astronomy',
    'Astrophotography',
    'Technology',
    'Photography',
    'AI & Machine Learning',
    'Coding & Dev',
    'Nature & Wildlife',
    'Gaming',
    'Comedy',
    'Design & Art',
  ];

  // Fetch feed batch
  const loadFeed = useCallback(
    async (reset = false, customTopic?: string) => {
      const topicToFetch = customTopic !== undefined ? customTopic : selectedTopic;
      const targetCursor = reset ? 0 : cursor;

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const url = `${endpoint}?cursor=${targetCursor}&limit=6&explorationRatio=${explorationRatio}${
          topicToFetch !== 'All' ? `&topic=${encodeURIComponent(topicToFetch)}` : ''
        }`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (reset) {
            setVideos(data.videos || []);
            setActiveIndex(0);
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
            }
          } else {
            setVideos((prev) => [...prev, ...(data.videos || [])]);
          }
          setHasMore(data.has_more ?? false);
          setCursor(data.next_cursor ? parseInt(data.next_cursor, 10) : targetCursor + 6);
        }
      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint, selectedTopic, cursor, explorationRatio]
  );

  useEffect(() => {
    loadFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, explorationRatio]);

  // Setup IntersectionObserver for active viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.6],
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(Math.min(videos.length - 1, activeIndex + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos.length]);

  const scrollToIndex = (idx: number) => {
    const target = itemRefs.current[idx];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleBlockTopic = async (topic: string) => {
    try {
      await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', topic }),
      });
      // Filter out immediately from current view
      setVideos((prev) => prev.filter((v) => v.primary_topic.toLowerCase() !== topic.toLowerCase()));
    } catch (err) {
      console.error('Failed to block topic:', err);
    }
  };

  const handleAdjustInterest = async (topic: string, score: number) => {
    try {
      await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_score', topic, score }),
      });
    } catch (err) {
      console.error('Failed to adjust interest:', err);
    }
  };

  const handleNotInterested = async (videoId: string) => {
    // Record quick skip / not_interested event
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'not_interested',
        video_id: videoId,
      }),
    }).catch(() => {});

    // Move to next video and remove from list
    const nextIdx = Math.min(videos.length - 1, activeIndex);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setTimeout(() => scrollToIndex(nextIdx), 150);
  };

  return (
    <div className="relative flex flex-col h-screen w-full max-w-xl mx-auto overflow-hidden">
      {/* Top Filter & Exploration Control Header */}
      <header className="shrink-0 p-3 bg-surface/90 backdrop-blur-md border-b border-border z-20 space-y-2">
        {/* Topic Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {topicsList.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedTopic === t
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                  : 'bg-surface-elevated/80 text-gray-400 hover:text-gray-200 border border-border/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dynamic Engine Mode Banner */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
            <span>Learning Mode: 75% Personalised · 25% Horizon Exploration</span>
          </div>
          <button
            onClick={() => loadFeed(true)}
            className="flex items-center gap-1 hover:text-white transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Recalculate</span>
          </button>
        </div>
      </header>

      {/* Main Snap Feed Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth py-2 space-y-4"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-gray-400">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Running hybrid recommendation model...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 text-gray-400">
            <AlertCircle className="w-10 h-10 text-gray-600" />
            <h4 className="font-semibold text-white">No videos found for this topic</h4>
            <p className="text-xs max-w-xs text-gray-400">
              Try switching back to &apos;All&apos; or submitting a new video to expand the discovery catalog.
            </p>
            <button
              onClick={() => setSelectedTopic('All')}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-md"
            >
              Reset to All Topics
            </button>
          </div>
        ) : (
          videos.map((video, idx) => (
            <div
              key={video.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              data-index={idx}
              className="w-full h-[calc(100vh-140px)] min-h-[520px] snap-center shrink-0 flex items-center justify-center px-2"
            >
              <VideoPlayer
                video={video}
                isActive={activeIndex === idx}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                onBlockTopic={handleBlockTopic}
                onAdjustInterest={handleAdjustInterest}
                onNotInterested={handleNotInterested}
              />
            </div>
          ))
        )}

        {/* Lazy load trigger / indicator */}
        {hasMore && !loading && (
          <div className="py-6 flex justify-center">
            <button
              onClick={() => loadFeed(false)}
              disabled={loadingMore}
              className="px-4 py-2 rounded-full bg-surface-elevated text-xs text-gray-300 hover:text-white border border-border flex items-center gap-2"
            >
              {loadingMore && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loadingMore ? 'Ranking more reels...' : 'Load more recommendations'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
