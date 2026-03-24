'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Home,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  CreditCard,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/utils/store';
import { createClient } from '@/lib/supabase-client';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Analytics', href: '/squad/analytics', icon: BarChart3 },
  { label: 'Assignments', href: '/squad/assignments', icon: Users },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/squad/settings', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const currentSquad = useAppStore((state) => state.currentSquad);
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:relative w-64 h-screen bg-bg-surface border-r border-border flex flex-col transition-transform duration-300 z-50 md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="text-2xl font-heading font-bold text-brand">
            LearnSync
          </Link>
        </div>

        {/* Squad selector */}
        {currentSquad && (
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-text-tertiary uppercase mb-3">
              Current Squad
            </div>
            <button className="w-full flex items-center justify-between p-3 bg-bg-elevated rounded-lg hover:bg-bg-base transition-colors text-left group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {currentSquad.name}
                </p>
              </div>
              <ChevronDown
                size={16}
                className="ml-2 text-text-tertiary group-hover:text-text-secondary"
              />
            </button>
            <Button variant="secondary" size="sm" className="w-full mt-3 gap-2">
              <Plus size={16} />
              New Squad
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-base'
                )}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-6 border-t border-border space-y-3">
          <Link href="/account" className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" className="w-full">
              Account
            </Button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-text-secondary hover:text-danger transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
