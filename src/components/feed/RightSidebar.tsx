'use client';

import React, { useEffect, useState } from 'react';
import { UserInterest, Creator } from '@/types';
import {
  TrendingUp,
  Sparkles,
  Users,
  Compass,
  Plus,
  Check,
  Brain,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';

interface RightSidebarProps {
  onOpenAddVideo?: () => void;
}

export function RightSidebar({ onOpenAddVideo }: RightSidebarProps) {
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [trending, setTrending] = useState<{ topic: string; count: number; score: number }[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, intRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/interactions'),
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setInterests(profData.interests || []);
          setTrending(profData.trending || []);
        }

        if (intRes.ok) {
          const intData = await intRes.json();
          setFollowedIds(new Set(intData.follows || []));
        }
      } catch (err) {
        console.error('Failed to load sidebar metrics:', err);
      }
    };

    fetchData();
  }, []);

  const handleFollowToggle = async (creatorId: string) => {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'follow', creator_id: creatorId }),
      });

      if (res.ok) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (next.has(creatorId)) next.delete(creatorId);
          else next.add(creatorId);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const sampleCreators = [
    {
      id: 'cr_astro_elena',
      name: 'Dr. Elena Vance',
      username: 'elena_cosmos',
      topic: 'Astronomy',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
    {
      id: 'cr_astrophoto_mark',
      name: 'Mark Sterling',
      username: 'mark_nightsky',
      topic: 'Astrophotography',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: 'cr_tech_sarah',
      name: 'Sarah Chen',
      username: 'sarah_silicon',
      topic: 'Technology',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 bg-surface/90 border-l border-border p-4 space-y-6 overflow-y-auto no-scrollbar select-none z-30">
      {/* 1. Dynamic User Interest Vector */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-white">Your Evolving Interests</h4>
          </div>
          <Link
            href="/profile"
            className="text-[11px] text-accent-purple hover:underline flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>Tune</span>
          </Link>
        </div>

        <p className="text-[11px] text-gray-400">
          Internal weights dynamically updating with time decay:
        </p>

        <div className="space-y-2">
          {interests.slice(0, 5).map((interest) => (
            <div key={interest.id} className="text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-300">
                  #{interest.topic}
                  {interest.is_blocked && (
                    <span className="ml-1 text-[10px] text-red-400">(Blocked)</span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-accent-purple">
                  {interest.score.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent-blue rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, interest.score * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Trending Topics in Available Dataset */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-blue" />
          <h4 className="font-semibold text-sm text-white">Trending Topics</h4>
        </div>

        <div className="space-y-2">
          {trending.slice(0, 5).map((item, idx) => (
            <Link
              key={item.topic}
              href={`/discover?topic=${encodeURIComponent(item.topic)}`}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated text-xs transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-gray-500 text-[11px]">0{idx + 1}</span>
                <div>
                  <p className="font-semibold text-gray-200 group-hover:text-primary">
                    #{item.topic}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {item.count} videos · {item.score} affinity pts
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Active</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Suggested Creators */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h4 className="font-semibold text-sm text-white">Suggested Creators</h4>
        </div>

        <div className="space-y-3">
          {sampleCreators.map((creator) => {
            const isFollowing = followedIds.has(creator.id);
            return (
              <div
                key={creator.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-200 truncate">{creator.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      @{creator.username} · {creator.topic}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleFollowToggle(creator.id)}
                  className={`p-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                    isFollowing
                      ? 'bg-surface-elevated text-gray-300 hover:text-white'
                      : 'bg-primary hover:bg-primary-hover text-white'
                  }`}
                  title={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  {isFollowing ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Submission CTA */}
      {onOpenAddVideo && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-purple-900/10 to-transparent border border-primary/30 space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-purple" />
            <h5 className="font-semibold text-white">Expand Knowledge Base</h5>
          </div>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            Found an inspiring public Reel or video? Add its URL to train the discovery algorithm with new content.
          </p>
          <button
            onClick={onOpenAddVideo}
            className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            Submit Public Reel
          </button>
        </div>
      )}
    </aside>
  );
}
