'use client';

import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2, AlertCircle, Link as LinkIcon, Sparkles } from 'lucide-react';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded?: () => void;
}

export function AddVideoModal({
  isOpen,
  onClose,
  onVideoAdded,
}: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    setError(null);

    const parsedHashtags = hashtags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          caption: caption.trim() || undefined,
          hashtags: parsedHashtags,
          creator: creatorName.trim()
            ? {
                username: creatorName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                displayName: creatorName,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setUrl('');
          setCaption('');
          setHashtags('');
          setCreatorName('');
          onClose();
          if (onVideoAdded) onVideoAdded();
        }, 1200);
      } else {
        setError(data.error || 'Failed to ingest video');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network failure during ingestion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 text-gray-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-accent-purple">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Submit Video to Catalog</h3>
              <p className="text-xs text-gray-400">Modular Content Ingestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Video successfully ingested and classified into topics!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              Video or Reel URL *
            </label>
            <input
              type="url"
              required
              placeholder="e.g. https://www.instagram.com/reel/C8x... or .mp4 link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Supports public Instagram Reel URLs, direct MP4 streams, and educational links.
            </p>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Caption / Description
            </label>
            <textarea
              rows={2}
              placeholder="What is this video about? (Used for topic classification)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Hashtags (Optional)
            </label>
            <input
              type="text"
              placeholder="#astronomy #jwst #photography"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Creator Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Stargazer"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Classifying & Ingesting...' : 'Add to Discovery Feed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
