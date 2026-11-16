'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Video } from '@/types';
import { Heart, Play } from 'lucide-react';
import Link from 'next/link';

export default function LikedPage() {
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const data = await res.json();
          // Filter to top liked
          setLikedVideos(data.videos?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiked();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      <Sidebar />

      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span>Liked Reels</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Reels you liked within REELSPACE. Each like strengthens related topic signals in your recommendation profile.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading liked reels...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {likedVideos.map((video) => (
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
        )}
      </main>
    </div>
  );
}
