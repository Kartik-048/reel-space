'use client';

import React, { useState, useEffect } from 'react';
import { Collection, Video } from '@/types';
import {
  Bookmark,
  FolderHeart,
  Plus,
  Trash2,
  Play,
  Clock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [newColName, setNewColName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
        if (data.collections?.length > 0 && !selectedColId) {
          setSelectedColId(data.collections[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        // Get all saved
        setSavedVideos(data.videos?.slice(0, 4) || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchSavedVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColName.trim() }),
      });
      if (res.ok) {
        setNewColName('');
        setIsCreating(false);
        fetchCollections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary" />
            <span>Saved Collections</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Organize discovery gems, study lists, and topics to revisit.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-surface-card border border-border flex gap-2">
          <input
            type="text"
            placeholder="Collection name (e.g. Astrophysics Papers)"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="flex-1 bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-2 rounded-xl bg-surface-elevated text-gray-400 text-xs hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Collections Carousel / Horizontal Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {collections.map((col) => {
          const isSelected = selectedColId === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-surface-elevated border-primary text-white shadow-lg'
                  : 'bg-surface-card border-border/70 text-gray-300 hover:border-primary/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-accent-purple flex items-center justify-center mb-3">
                <FolderHeart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">{col.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{col.description || 'Custom collection'}</p>
              <p className="text-[11px] font-mono text-primary mt-2">
                {col.video_count || 0} saved reels
              </p>
            </button>
          );
        })}
      </div>

      {/* Videos inside active collection */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-purple" />
          <span>Saved Videos in Collection</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {savedVideos.map((video) => (
            <div
              key={video.id}
              className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-border group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail_url}
                alt={video.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white font-medium">
                #{video.primary_topic}
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                <p className="font-semibold truncate">@{video.creator.username}</p>
                <p className="text-[10px] text-gray-300 line-clamp-1">{video.caption}</p>
              </div>
              <Link
                href="/"
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
              >
                <div className="p-3 rounded-full bg-primary text-white">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
