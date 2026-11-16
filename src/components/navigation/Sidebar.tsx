'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Users,
  Flame,
  Bookmark,
  History,
  Heart,
  Sliders,
  Sparkles,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  onOpenAddVideo?: () => void;
}

export function Sidebar({ onOpenAddVideo }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'For You', href: '/', icon: Compass, badge: 'Smart' },
    { label: 'Following', href: '/following', icon: Users },
    { label: 'Discover', href: '/discover', icon: Flame },
    { label: 'Collections', href: '/collections', icon: Bookmark },
    { label: 'Liked Reels', href: '/liked', icon: Heart },
    { label: 'History', href: '/history', icon: History },
    { label: 'Tuning & Profile', href: '/profile', icon: Sliders },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface/90 border-r border-border p-4 justify-between z-30 select-none">
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <Link href="/" className="flex items-center gap-3 px-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-wider text-white">REELSPACE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-accent-purple font-mono font-semibold">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Self-Learning Discovery</p>
            </div>
          </Link>

          {/* Quick Submit Video Button */}
          {onOpenAddVideo && (
            <button
              onClick={onOpenAddVideo}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white font-medium text-sm shadow-md shadow-primary/20 transition-all duration-200 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Reel / URL</span>
            </button>
          )}

          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-surface-elevated text-white border border-primary/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-surface-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-primary' : 'text-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-primary/20 text-accent-purple">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Algorithm Status & Privacy Badge */}
        <div className="p-3.5 rounded-xl bg-surface-card/60 border border-border/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Engine Active
            </span>
            <span className="text-[10px] font-mono text-gray-500">v1.4-hybrid</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Continuously learning from your dwell time, likes, and topic explorations.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-primary hover:underline">
            <Link href="/profile">Tune weights & privacy</Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-lg border-t border-border flex items-center justify-around z-40 px-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
