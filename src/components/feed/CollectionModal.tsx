'use client';

import React, { useState, useEffect } from 'react';
import { Collection } from '@/types';
import { Bookmark, Plus, Check, X, FolderHeart, Sparkles } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onSaveToCollection: (collectionId: string) => void;
}

export function CollectionModal({
  isOpen,
  onClose,
  videoId,
  onSaveToCollection,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };

    loadCollections();
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [...prev, data.collection]);
        setNewCollectionName('');
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSaveToCollection(id);
    setTimeout(() => {
      onClose();
      setSelectedId(null);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 text-gray-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">Save to Collection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Collections List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {collections.map((c) => {
            const isChosen = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isChosen
                    ? 'bg-primary/20 border-primary text-white'
                    : 'bg-surface-card border-border/70 hover:border-primary/40 text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary">
                    <FolderHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {c.video_count || 0} saved videos
                    </p>
                  </div>
                </div>
                {isChosen && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Create Collection Toggle / Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Astrophotography Gems"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newCollectionName.trim()}
                className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
              >
                Create & Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-1.5 px-3 rounded-lg bg-surface-elevated text-gray-300 text-xs hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-primary text-gray-400 hover:text-primary text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Collection</span>
          </button>
        )}
      </div>
    </div>
  );
}
