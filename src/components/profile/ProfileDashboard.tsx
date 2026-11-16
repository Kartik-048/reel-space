'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, UserInterest } from '@/types';
import {
  Brain,
  Sliders,
  Shield,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Activity,
  Eye,
  Heart,
  Bookmark,
  Users,
  Clock,
  Ban,
  Check,
} from 'lucide-react';

export function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setInterests(data.interests || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleTracking = async () => {
    if (!profile) return;
    const nextVal = !profile.behavioral_tracking_enabled;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ behavioral_tracking_enabled: nextVal }),
      });
      if (res.ok) {
        setProfile({ ...profile, behavioral_tracking_enabled: nextVal });
        showStatus(nextVal ? 'Personalization enabled' : 'Personalization disabled');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateScore = async (topic: string, newScore: number) => {
    try {
      const res = await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_score', topic, score: newScore }),
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (topic: string, isBlocked: boolean) => {
    try {
      await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isBlocked ? 'unblock' : 'block', topic }),
      });
      fetchProfile();
      showStatus(isBlocked ? `Unblocked #${topic}` : `Blocked #${topic} from recommendations`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your viewing history? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/profile?action=history', { method: 'DELETE' });
      if (res.ok) {
        fetchProfile();
        showStatus('Viewing history erased.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetRecommendations = async () => {
    if (!confirm('Reset your entire recommendation profile to default state?')) return;
    try {
      const res = await fetch('/api/profile?action=reset_recommendations', { method: 'DELETE' });
      if (res.ok) {
        fetchProfile();
        showStatus('Recommendation profile reset to initial cold-start.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/interests?action=export', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reelspace-data-${profile?.username || 'user'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('User data exported successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-400">
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      {/* Top Banner / Status Notification */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-primary/20 border border-primary/40 text-accent-purple text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* User Header Profile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-card border border-border">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
            alt={profile.username}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/40 shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-white">{profile.full_name || profile.username}</h2>
            <p className="text-xs text-gray-400">@{profile.username} · {profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-accent-purple text-[10px] font-semibold">
                Autonomous Learning Active
              </span>
            </div>
          </div>
        </div>

        {/* Behavioral Tracking Master Toggle */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border/80">
          <Shield className="w-4 h-4 text-primary" />
          <div className="text-xs">
            <p className="font-semibold text-white">Dynamic Profiling</p>
            <p className="text-[10px] text-gray-400">
              {profile.behavioral_tracking_enabled ? 'Adapting to feedback' : 'Frozen / Static'}
            </p>
          </div>
          <button
            onClick={handleToggleTracking}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              profile.behavioral_tracking_enabled ? 'bg-primary justify-end' : 'bg-gray-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* Interaction Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Watched</span>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.stats.videos_watched}</p>
          <p className="text-[10px] text-gray-500">Unique discoveries</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Watch Time</span>
            <Clock className="w-4 h-4 text-accent-blue" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.stats.total_watch_seconds}s</p>
          <p className="text-[10px] text-gray-500">Dwell duration signal</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Likes Given</span>
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.stats.likes_given}</p>
          <p className="text-[10px] text-gray-500">+3.0 weight signal</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border/80 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Saved Reels</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.stats.saved_videos}</p>
          <p className="text-[10px] text-gray-500">+5.0 weight signal</p>
        </div>
      </div>

      {/* Dynamic Interest Radar & Tuning Panel */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-accent-purple">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Dynamic Interest Profile</h3>
              <p className="text-xs text-gray-400">
                Shows short-term vs long-term decayed interest values with manual override sliders.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Short-term (recent velocity)
            <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" /> Long-term (decayed history)
          </div>
        </div>

        {/* Interests Sliders & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interests.map((interest) => (
            <div
              key={interest.id}
              className={`p-4 rounded-2xl border transition-all ${
                interest.is_blocked
                  ? 'bg-red-950/20 border-red-800/40 opacity-70'
                  : 'bg-surface-elevated/70 border-border/70 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">#{interest.topic}</span>
                  {interest.is_blocked && (
                    <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-[10px] font-semibold">
                      Blocked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary font-bold">
                    {(interest.score * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => handleToggleBlock(interest.topic, interest.is_blocked)}
                    className="p-1 rounded-lg hover:bg-surface text-gray-400 hover:text-red-400 transition-colors"
                    title={interest.is_blocked ? 'Unblock topic' : 'Block topic'}
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slider for manual control */}
              {!interest.is_blocked && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={interest.score}
                    onChange={(e) => handleUpdateScore(interest.topic, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-500">
                    <span>Short: {(interest.short_term_score * 100).toFixed(0)}%</span>
                    <span>Long: {(interest.long_term_score * 100).toFixed(0)}%</span>
                    <span>Events: {interest.interaction_count}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Engine Steering Actions */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border space-y-4">
        <h4 className="font-semibold text-sm text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Data Management</span>
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          You have full sovereignty over your recommendation parameters. You can inspect all recorded behavioral signals, clear history, or wipe your recommendation vectors at any time.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-semibold text-gray-200 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-accent-blue" />
            <span>Export Data (JSON)</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-semibold text-gray-200 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Clear Viewing History</span>
          </button>

          <button
            onClick={handleResetRecommendations}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs font-semibold text-red-300 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Recommendation Vector</span>
          </button>
        </div>
      </div>
    </div>
  );
}
