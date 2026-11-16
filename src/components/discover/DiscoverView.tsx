'use client';

import React, { useState, useEffect } from 'react';
import { Video, Creator } from '@/types';
import {
  Search,
  Flame,
  Sparkles,
  Users,
  Compass,
  Play,
  ExternalLink,
  PlusCircle,
  Tag,
} from 'lucide-react';
import { TOPIC_TAXONOMY } from '@/lib/recommendation/taxonomy';
import Link from 'next/link';

interface DiscoverViewProps {
  onOpenAddVideo?: () => void;
}

export function DiscoverView({ onOpenAddVideo }: DiscoverViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    videos: Video[];
    creators: Creator[];
    topics: string[];
  }>({ videos: [], creators: [], topics: [] });
  const [trending, setTrending] = useState<{ topic: string; count: number; score: number }[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [profRes, vidRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/videos'),
        ]);

        if (profRes.ok) {
          const data = await profRes.json();
          setTrending(data.trending || []);
        }

        if (vidRes.ok) {
          const data = await vidRes.json();
          setAllVideos(data.videos || []);
        }
      } catch (err) {
        console.error('Failed to load discovery data:', err);
      }
    };

    loadInitial();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/videos?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const displayedVideos = isSearching
    ? searchResults.videos
    : selectedTopic === 'All'
    ? allVideos
    : allVideos.filter(
        (v) =>
          v.primary_topic.toLowerCase() === selectedTopic.toLowerCase() ||
          v.topics.some((t) => t.toLowerCase() === selectedTopic.toLowerCase())
      );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      {/* Top Banner & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <span>Discover & Explore</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Explore trending topics, search creators, and discover bridge intersections.
            </p>
          </div>

          {onOpenAddVideo && (
            <button
              onClick={onOpenAddVideo}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Reel Link</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search captions, #astronomy, creators, or topics..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-card border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary shadow-inner transition-colors"
          />
        </div>
      </div>

      {/* If Searching: Show Matched Topics & Creators */}
      {isSearching && (
        <div className="space-y-4">
          {searchResults.topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Matching Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {searchResults.topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSearchQuery(t);
                      setSelectedTopic(t);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-accent-purple text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>#{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.creators.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Matching Creators
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {searchResults.creators.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-surface-card border border-border flex items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.profile_image}
                      alt={c.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                    <div className="truncate text-xs">
                      <p className="font-semibold text-white truncate">{c.display_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">@{c.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trending Topics Rail */}
      {!isSearching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-white">Trending in ReelSpace</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {trending.slice(0, 4).map((item, idx) => (
              <button
                key={item.topic}
                onClick={() => setSelectedTopic(item.topic)}
                className="p-3.5 rounded-2xl bg-surface-card hover:bg-surface-elevated border border-border/80 text-left transition-all group"
              >
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <span className="font-mono">#{idx + 1}</span>
                  <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
                </div>
                <p className="font-bold text-sm text-gray-100 group-hover:text-primary transition-colors">
                  #{item.topic}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {item.count} videos · {item.score} affinity pts
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      {!isSearching && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedTopic('All')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTopic === 'All'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-card text-gray-400 hover:text-white border border-border'
            }`}
          >
            All Discoveries
          </button>
          {Object.keys(TOPIC_TAXONOMY).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTopic === t
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-card text-gray-400 hover:text-white border border-border'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Videos Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <span>Catalog Discoveries ({displayedVideos.length})</span>
        </h3>

        {displayedVideos.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No matching videos found. Try another query or clear the filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayedVideos.map((video) => (
              <div
                key={video.id}
                className="relative rounded-2xl overflow-hidden bg-surface-card border border-border group hover:border-primary/50 transition-all shadow-md flex flex-col justify-between"
              >
                {/* Thumbnail Aspect Container */}
                <div className="relative aspect-[9/14] w-full overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail_url}
                    alt={video.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Provider & Topic Tags */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-medium">
                      #{video.primary_topic}
                    </span>
                    {video.provider === 'instagram' ? (
                      <span className="px-1.5 py-0.5 rounded bg-pink-600/80 text-white font-semibold">
                        IG Reel
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-primary/80 text-white font-semibold">
                        Native
                      </span>
                    )}
                  </div>

                  {/* Play / Link indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="p-3 rounded-full bg-black/70 text-white backdrop-blur-md">
                      {video.availability_status === 'native_playable' ? (
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      ) : (
                        <ExternalLink className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Creator & Caption */}
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-[11px] font-semibold truncate">
                      @{video.creator.username}
                    </p>
                    <p className="text-[10px] text-gray-300 line-clamp-1">
                      {video.caption}
                    </p>
                  </div>
                </div>

                {/* Card Action Link */}
                <Link
                  href="/"
                  className="p-2 text-center text-[11px] font-semibold text-primary hover:text-white bg-surface-elevated/50 hover:bg-primary transition-colors border-t border-border"
                >
                  Watch in Feed
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
