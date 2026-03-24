'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import {
  Users,
  Zap,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Loader,
} from 'lucide-react';

interface Statistics {
  totalUsers: number;
  totalSquads: number;
  totalCourses: number;
  totalQuizzes: number;
  activePlans: {
    free: number;
    pro: number;
    squad: number;
    teams: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Get total squads
        const { count: squadCount } = await supabase
          .from('squads')
          .select('*', { count: 'exact' });

        // Get total courses
        const { count: courseCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact' });

        // Get total quizzes
        const { count: quizCount } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact' });

        // Get plan distribution
        const { data: plans } = await supabase
          .from('profiles')
          .select('plan');

        const planCounts = {
          free: 0,
          pro: 0,
          squad: 0,
          teams: 0,
        };

        if (plans) {
          plans.forEach((p: any) => {
            const plan = (p.plan || 'free') as keyof typeof planCounts;
            planCounts[plan]++;
          });
        }

        setStats({
          totalUsers: userCount || 0,
          totalSquads: squadCount || 0,
          totalCourses: courseCount || 0,
          totalQuizzes: quizCount || 0,
          activePlans: planCounts,
        });
      } catch (err) {
        console.error('Failed to load statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
          Admin Dashboard
        </h1>
        <p className="text-text-secondary">
          Manage users, squads, courses, and system settings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Users</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.totalUsers}
              </p>
            </div>
            <Users size={24} className="text-brand opacity-20" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={() => router.push('/admin/users')}
          >
            Manage
            <ArrowRight size={16} />
          </Button>
        </Card>

        {/* Total Squads */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Squads</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.totalSquads}
              </p>
            </div>
            <Zap size={24} className="text-branch opacity-20" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={() => router.push('/admin/squads')}
          >
            Manage
            <ArrowRight size={16} />
          </Button>
        </Card>

        {/* Total Courses */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.totalCourses}
              </p>
            </div>
            <BookOpen size={24} className="text-brand opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary mt-4">Across all squads</p>
        </Card>

        {/* Total Quizzes */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">AI Quizzes</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.totalQuizzes}
              </p>
            </div>
            <TrendingUp size={24} className="text-brand opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary mt-4">Generated so far</p>
        </Card>
      </div>

      {/* Plan Distribution */}
      <CardLg className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Plan Distribution
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(stats?.activePlans || {}).map(([plan, count]) => (
            <div key={plan} className="p-4 bg-bg-base rounded-lg">
              <p className="text-sm text-text-tertiary mb-2 capitalize">{plan}</p>
              <p className="text-2xl font-bold text-text-primary">{count}</p>
              <p className="text-xs text-text-tertiary mt-2">
                {stats?.totalUsers
                  ? Math.round(((count / stats.totalUsers) * 100) / 100)
                  : 0}
                %
              </p>
            </div>
          ))}
        </div>
      </CardLg>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <CardLg>
          <h3 className="text-lg font-bold text-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push('/admin/users')}
            >
              View All Users
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push('/admin/squads')}
            >
              View All Squads
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push('/admin/moderation')}
            >
              Review Flagged Content
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push('/admin/analytics')}
            >
              View Analytics
            </Button>
          </div>
        </CardLg>

        <CardLg>
          <h3 className="text-lg font-bold text-text-primary mb-4">
            System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">API Status</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">Database</span>
              <Badge variant="success">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">Auth System</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-text-secondary">Stripe</span>
              <Badge variant="success">Connected</Badge>
            </div>
          </div>
        </CardLg>
      </div>
    </div>
  );
}
