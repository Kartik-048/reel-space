'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DiscoverView } from '@/components/discover/DiscoverView';
import { AddVideoModal } from '@/components/ingest/AddVideoModal';

export default function DiscoverPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      <Sidebar onOpenAddVideo={() => setIsAddModalOpen(true)} />

      <main className="flex-1 h-screen overflow-y-auto">
        <DiscoverView onOpenAddVideo={() => setIsAddModalOpen(true)} />
      </main>

      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
