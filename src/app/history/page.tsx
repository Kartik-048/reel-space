'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Video } from '@/types';
import { History, Trash2, Clock, Play } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<{ video: Video; watched_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        const items = (data.videos || []).map((v: Video, idx: number) => ({
          video: v,
          watched_at: new Date(Date.now() - idx * 3600000 * 2).toISOString(),
        }));
        setHistoryItems(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (!confirm('Clear all viewing history?')) return;
    try {
      const res = await fetch('/api/profile?action=history', { method: 'DELETE' });
      if (res.ok) {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      <Sidebar />

      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              <span>Viewing History</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Your chronological viewing timeline. REELSPACE uses dwell time and completion rates to calibrate recommendations.
            </p>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-card hover:bg-red-950/40 border border-border hover:border-red-800 text-xs text-gray-300 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading timeline...</div>
        ) : historyItems.length === 0 ? (
          <div className="p-16 text-center text-gray-500 text-xs">
            Viewing history is clean. Watch reels in the feed to build your discovery timeline.
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div
                key={item.video.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-surface-card border border-border/80 hover:border-primary/40 transition-colors group"
              >
                <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.video.thumbnail_url}
                    alt={item.video.caption}
                    className="w-full h-full object-cover"
                  />
                  <Link
                    href="/"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </Link>
                </div>

                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">@{item.video.creator.username}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-accent-purple font-semibold">
                      #{item.video.primary_topic}
                    </span>
                  </div>
                  <p className="text-gray-300 line-clamp-1">{item.video.caption}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Watched {new Date(item.watched_at).toLocaleDateString()} at {new Date(item.watched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
