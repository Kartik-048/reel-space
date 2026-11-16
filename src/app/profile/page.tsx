'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-background text-gray-100">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <ProfileDashboard />
      </main>
    </div>
  );
}
