'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RightSidebar } from '@/components/feed/RightSidebar';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { AddVideoModal } from '@/components/ingest/AddVideoModal';

export default function FollowingPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      <Sidebar onOpenAddVideo={() => setIsAddModalOpen(true)} />

      <main className="flex-1 flex justify-center h-screen overflow-hidden">
        <FeedContainer endpoint="/api/feed" />
      </main>

      <RightSidebar onOpenAddVideo={() => setIsAddModalOpen(true)} />

      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
