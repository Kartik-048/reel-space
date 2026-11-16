'use client';

import React, { useState } from 'react';
import { RecommendationExplanation } from '@/types';
import {
  Sparkles,
  X,
  Sliders,
  ShieldAlert,
  Compass,
  CheckCircle2,
  TrendingUp,
  Brain,
} from 'lucide-react';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoCaption: string;
  primaryTopic: string;
  recommendation: RecommendationExplanation;
  onBlockTopic: (topic: string) => void;
  onAdjustInterest: (topic: string, newScore: number) => void;
}

export function RecommendationModal({
  isOpen,
  onClose,
  videoCaption,
  primaryTopic,
  recommendation,
  onBlockTopic,
  onAdjustInterest,
}: RecommendationModalProps) {
  const [sliderValue, setSliderValue] = useState(
    recommendation.score_breakdown.user_topic_similarity
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const breakdown = recommendation.score_breakdown;

  const handleSaveScore = () => {
    onAdjustInterest(primaryTopic, sliderValue);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl p-6 text-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-accent-purple">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Why am I seeing this?</h3>
              <p className="text-xs text-gray-400">Recommendation Engine Transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Explanation Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/15 via-purple-900/10 to-transparent border border-primary/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent-purple shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {recommendation.primary_reason}
              </p>
              <p className="text-xs text-gray-300">
                REELSPACE ranks content using a dynamic multi-factor model that adapts with every video you watch, save, or skip.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Factor Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Ranking Factor Signals (Total Score: {(breakdown.final_score * 100).toFixed(0)}%)
          </h4>

          <div className="space-y-2.5 text-xs bg-surface-card p-4 rounded-xl border border-border/60">
            {/* 1. User-Topic Similarity */}
            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>User-Topic Alignment ({primaryTopic})</span>
                <span className="font-mono text-accent-purple font-medium">
                  {(breakdown.user_topic_similarity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, breakdown.user_topic_similarity * 100)}%` }}
                />
              </div>
            </div>

            {/* 2. Recent Interaction Decay */}
            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Recent Short-Term Velocity</span>
                <span className="font-mono text-accent-blue font-medium">
                  {(breakdown.recent_interaction * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-blue rounded-full"
                  style={{ width: `${Math.min(100, breakdown.recent_interaction * 100)}%` }}
                />
              </div>
            </div>

            {/* 3. Creator Affinity */}
            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Creator Affinity</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {(breakdown.creator_affinity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, breakdown.creator_affinity * 100)}%` }}
                />
              </div>
            </div>

            {/* 4. Exploration Potential */}
            <div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Exploration Potential & Bridge Adjacency</span>
                <span className="font-mono text-amber-400 font-medium">
                  {(breakdown.exploration_boost * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, breakdown.exploration_boost * 100)}%` }}
                />
              </div>
            </div>

            {/* 5. Diversity Penalty */}
            {breakdown.diversity_penalty > 0 && (
              <div className="text-[11px] text-amber-400/90 pt-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Anti-monotony penalty applied (-{(breakdown.diversity_penalty * 100).toFixed(0)}%) to prevent topic clustering.</span>
              </div>
            )}
          </div>
        </div>

        {/* User In-Modal Steering Controls */}
        <div className="space-y-3 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary" />
              Tune Your Affinity for #{primaryTopic}
            </span>
            <span className="text-xs font-mono text-primary font-bold">
              {(sliderValue * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sliderValue}
            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Less interested</span>
            <span>Neutral</span>
            <span>Obsessed</span>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleSaveScore}
              className="flex-1 py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Update Affinity Score</span>
              )}
            </button>

            <button
              onClick={() => {
                onBlockTopic(primaryTopic);
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Block Topic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
