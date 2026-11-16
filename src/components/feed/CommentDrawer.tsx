'use client';

import React, { useState, useEffect } from 'react';
import { CommentItem } from '@/lib/storage/store';
import { X, Send, MessageSquare, User } from 'lucide-react';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoCaption: string;
}

export function CommentDrawer({
  isOpen,
  onClose,
  videoId,
  videoCaption,
}: CommentDrawerProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !videoId) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/comments?videoId=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-surface border-l border-border flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">Comments ({comments.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Loading thoughts...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-600" />
              <p className="text-sm font-medium text-gray-300">No comments yet</p>
              <p className="text-xs text-gray-500">
                Be the first to share your perspective on this discovery!
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3 text-xs">
                {c.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.avatar_url}
                    alt={c.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200">@{c.username}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add your insight (improves your recommendations)..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary text-white transition-all active:scale-95 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
