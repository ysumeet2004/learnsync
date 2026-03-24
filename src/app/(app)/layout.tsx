'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/utils/hooks';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useRequireAuth
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
