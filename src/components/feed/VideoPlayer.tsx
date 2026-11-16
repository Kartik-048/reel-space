'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RankedVideo } from '@/types';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Ban,
  Check,
  Compass,
} from 'lucide-react';
import { RecommendationModal } from './RecommendationModal';
import { CommentDrawer } from './CommentDrawer';
import { CollectionModal } from './CollectionModal';

interface VideoPlayerProps {
  video: RankedVideo;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onBlockTopic: (topic: string) => void;
  onAdjustInterest: (topic: string, score: number) => void;
  onNotInterested: (videoId: string) => void;
}

export function VideoPlayer({
  video,
  isActive,
  isMuted,
  onToggleMute,
  onBlockTopic,
  onAdjustInterest,
  onNotInterested,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(video.saves_count);
  const [isFollowed, setIsFollowed] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const startTimeRef = useRef<number>(0);
  const completionReportedRef = useRef<boolean>(false);

  // Sync initial user interaction states
  useEffect(() => {
    const checkState = async () => {
      try {
        const res = await fetch('/api/interactions');
        if (res.ok) {
          const data = await res.json();
          if (data.likes?.includes(video.id)) setIsLiked(true);
          if (data.saves?.includes(video.id)) setIsSaved(true);
          if (data.follows?.includes(video.creator_id)) setIsFollowed(true);
        }
      } catch (err) {
        console.error('Failed to sync states:', err);
      }
    };
    checkState();
  }, [video.id, video.creator_id]);

  // Handle active viewport playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el || video.availability_status !== 'native_playable') return;

    if (isActive) {
      startTimeRef.current = Date.now();
      completionReportedRef.current = false;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }

      // Record video impression/start in ML pipeline
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'start',
          video_id: video.id,
          metadata: { session_id: 'sess_' + Date.now().toString(36) },
        }),
      }).catch(() => {});
    } else {
      // Exiting active viewport: calculate watch duration
      if (startTimeRef.current > 0) {
        const durationSec = (Date.now() - startTimeRef.current) / 1000;
        if (durationSec > 0.5) {
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'progress',
              video_id: video.id,
              metadata: {
                watch_duration_seconds: durationSec,
                completion_percentage: progress / 100,
              },
            }),
          }).catch(() => {});
        }
      }
      el.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, video.id, video.availability_status, progress]);

  // Track progress and detect meaningful completion
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;

    const currentPercent = (el.currentTime / el.duration) * 100;
    setProgress(currentPercent);

    if (currentPercent >= 80 && !completionReportedRef.current) {
      completionReportedRef.current = true;
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'watch_completion',
          video_id: video.id,
          metadata: {
            watch_duration_seconds: el.currentTime,
            completion_percentage: 1.0,
          },
        }),
      }).catch(() => {});
    }
  };

  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play();
      setIsPlaying(true);
    }
  };

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }

    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', video_id: video.id }),
      });
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleFollow = async () => {
    const nextState = !isFollowed;
    setIsFollowed(nextState);

    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'follow', creator_id: video.creator_id }),
      });
    } catch (err) {
      console.error('Follow toggle failed:', err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + video.original_url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleSaveToCollection = async (collectionId: string) => {
    setIsSaved(true);
    setSavesCount((prev) => prev + 1);

    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          video_id: video.id,
          collection_id: collectionId,
        }),
      });
    } catch (err) {
      console.error('Save to collection failed:', err);
    }
  };

  return (
    <div className="relative w-full h-full max-w-[440px] mx-auto rounded-3xl overflow-hidden bg-surface-card border border-border shadow-2xl flex items-center justify-center select-none group">
      {/* Video Content Layer */}
      {video.availability_status === 'native_playable' && video.video_url ? (
        <div
          onClick={togglePlayPause}
          className="relative w-full h-full cursor-pointer flex items-center justify-center bg-black"
        >
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.thumbnail_url}
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />

          {/* Play/Pause subtle indicator on user click */}
          {!isPlaying && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
              <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-md">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Double-tap / like heart burst animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-heart-burst">
              <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-lg" />
            </div>
          )}
        </div>
      ) : (
        /* Legitimate External / Instagram Fallback Card */
        <div className="relative w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-gray-950 via-surface-card to-black text-gray-100">
          {/* Poster image background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail_url}
            alt={video.caption}
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-surface/85 to-black/95 z-0" />

          {/* Top Provider Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <span>Instagram Public Reel</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Legitimate Content Link
            </span>
          </div>

          {/* Card Middle Preview */}
          <div className="relative z-10 space-y-4 my-auto text-center py-6">
            <div className="relative w-48 h-64 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-102 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail_url}
                alt={video.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-medium text-white truncate">
                  @{video.creator.username}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                {video.caption}
              </p>
              <p className="text-[11px] text-gray-400">
                Instagram video content cannot be rendered directly in third-party embedded players per Meta terms.
              </p>
            </div>

            <a
              href={video.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-pink-600/20 active:scale-95 transition-all"
            >
              <span>Open on Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="relative z-10 text-center text-[10px] text-gray-500">
            Interaction signals & topic discovery continue to train your REELSPACE recommendation engine.
          </div>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        {/* Recommendation Reason Pill */}
        <button
          onClick={() => setShowRecModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-xs text-white transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
          <span className="font-medium max-w-[170px] truncate">
            {video.recommendation.primary_reason}
          </span>
        </button>

        {/* Audio Mute/Unmute Toggle */}
        {video.availability_status === 'native_playable' && (
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
          </button>
        )}
      </div>

      {/* Bottom Overlay Video Metadata */}
      <div className="absolute bottom-3 left-4 right-16 z-20 space-y-2 pointer-events-auto">
        {/* Creator Info & Follow */}
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.creator.profile_image}
            alt={video.creator.display_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-md shrink-0"
          />
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-white drop-shadow truncate">
                {video.creator.display_name}
              </span>
              {video.creator.is_verified && (
                <span className="w-3.5 h-3.5 rounded-full bg-accent-blue text-black font-bold text-[8px] flex items-center justify-center">
                  ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-300 drop-shadow truncate">
              @{video.creator.username}
            </p>
          </div>

          <button
            onClick={handleFollow}
            className={`ml-1 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-md active:scale-95 ${
              isFollowed
                ? 'bg-surface-elevated/80 text-gray-300 border border-border'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Caption */}
        <div className="text-xs text-gray-100 drop-shadow">
          <p className={showFullCaption ? '' : 'line-clamp-2'}>
            {video.caption}
          </p>
          {video.caption.length > 80 && (
            <button
              onClick={() => setShowFullCaption(!showFullCaption)}
              className="text-gray-400 hover:text-white text-[11px] font-medium mt-0.5"
            >
              {showFullCaption ? 'less' : '...more'}
            </button>
          )}
        </div>

        {/* Topic & Hashtag Badges */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="px-2 py-0.5 rounded-md bg-primary/30 border border-primary/40 text-[10px] font-semibold text-accent-purple backdrop-blur-md">
            #{video.primary_topic}
          </span>
          {video.secondary_topics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-gray-300 backdrop-blur-md"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Right Interaction Action Rail */}
      <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-4 text-white pointer-events-auto">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            className={`p-3 rounded-full backdrop-blur-md border transition-all active:scale-75 shadow-lg ${
              isLiked
                ? 'bg-red-500/20 border-red-500/40 text-red-500'
                : 'bg-black/50 border-white/10 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold text-gray-200 drop-shadow">
            {likesCount}
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowCommentDrawer(true)}
            className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-semibold text-gray-200 drop-shadow">
            {video.comments_count}
          </span>
        </div>

        {/* Save / Bookmark Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowCollectionModal(true)}
            className={`p-3 rounded-full backdrop-blur-md border transition-all active:scale-75 shadow-lg ${
              isSaved
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-black/50 border-white/10 text-white hover:bg-black/70'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold text-gray-200 drop-shadow">
            {savesCount}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
            title="Share"
          >
            {copiedShare ? (
              <Check className="w-6 h-6 text-emerald-400" />
            ) : (
              <Share2 className="w-6 h-6" />
            )}
          </button>
          <span className="text-[10px] text-gray-300">
            {copiedShare ? 'Copied' : 'Share'}
          </span>
        </div>

        {/* Not Interested / Skip Button */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => onNotInterested(video.id)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-red-950/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-red-400 transition-all active:scale-90 shadow-lg"
            title="Not interested (lowers topic ranking)"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar for native videos */}
      {video.availability_status === 'native_playable' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Recommendation Transparency Modal */}
      <RecommendationModal
        isOpen={showRecModal}
        onClose={() => setShowRecModal(false)}
        videoCaption={video.caption}
        primaryTopic={video.primary_topic}
        recommendation={video.recommendation}
        onBlockTopic={onBlockTopic}
        onAdjustInterest={onAdjustInterest}
      />

      {/* Comments Drawer */}
      <CommentDrawer
        isOpen={showCommentDrawer}
        onClose={() => setShowCommentDrawer(false)}
        videoId={video.id}
        videoCaption={video.caption}
      />

      {/* Collections Modal */}
      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        videoId={video.id}
        onSaveToCollection={handleSaveToCollection}
      />
    </div>
  );
}
