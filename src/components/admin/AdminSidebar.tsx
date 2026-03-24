'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase-client';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Squads', href: '/admin/squads', icon: Zap },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Moderation', href: '/admin/moderation', icon: AlertTriangle },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="text-2xl font-heading font-bold text-brand">
          LearnSync
        </Link>
        <p className="text-xs text-text-tertiary mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);

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

      {/* Footer */}
      <div className="p-6 border-t border-border space-y-3">
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" className="w-full">
            Back to App
          </Button>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-text-secondary hover:text-danger transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
