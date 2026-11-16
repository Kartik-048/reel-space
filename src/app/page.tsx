'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RightSidebar } from '@/components/feed/RightSidebar';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { AddVideoModal } from '@/components/ingest/AddVideoModal';

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      {/* Left Sidebar */}
      <Sidebar onOpenAddVideo={() => setIsAddModalOpen(true)} />

      {/* Main Snap Feed Content */}
      <main className="flex-1 flex justify-center h-screen overflow-hidden">
        <FeedContainer />
      </main>

      {/* Right Intelligence & Tuning Rail */}
      <RightSidebar onOpenAddVideo={() => setIsAddModalOpen(true)} />

      {/* Ingestion Modal */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
