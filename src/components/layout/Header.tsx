'use client';

import { useAuth } from '@/utils/hooks';
import { useAppStore } from '@/utils/store';
import { Menu, Bell, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user } = useAuth();
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  return (
    <header className="h-16 border-b border-border bg-bg-surface/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 hover:bg-bg-elevated rounded-lg transition-colors"
      >
        <Menu size={20} className="text-text-secondary" />
      </button>

      {/* Search bar (placeholder) */}
      <div className="hidden sm:flex flex-1 mx-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-bg-elevated rounded-lg transition-colors text-text-secondary hover:text-text-primary">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
        </button>

        {/* User menu placeholder */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-primary">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-text-tertiary">Free Plan</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
