'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardLg } from '@/components/ui/Card';
import { Loader, TrendingUp, Users, BookOpen, Zap } from 'lucide-react';

interface Analytics {
  activeUsers: number;
  newUsersThisMonth: number;
  quizzesCompletedThisMonth: number;
  coursesCreatedThisMonth: number;
  topSquads: Array<{
    name: string;
    memberCount: number;
    courseCount: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const supabase = createClient();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        // Get active users (logged in this month)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const { count: activeCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Get new users this month
        const { count: newUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .gte('created_at', oneMonthAgo.toISOString());

        // Get quiz completions this month
        const { count: quizCompletions } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact' })
          .gte('created_at', oneMonthAgo.toISOString());

        // Get courses created this month
        const { count: coursesCreated } = await supabase
          .from('courses')
          .select('*', { count: 'exact' })
          .gte('created_at', oneMonthAgo.toISOString());

        // Get top squads
        const { data: squads } = await supabase
          .from('squads')
          .select('id, name')
          .limit(5);

        const topSquads = [];
        if (squads) {
          for (const squad of squads) {
            const { count: memberCount } = await supabase
              .from('squad_members')
              .select('*', { count: 'exact' })
              .eq('squad_id', squad.id);

            const { count: courseCount } = await supabase
              .from('courses')
              .select('*', { count: 'exact' })
              .eq('squad_id', squad.id);

            topSquads.push({
              name: squad.name,
              memberCount: memberCount || 0,
              courseCount: courseCount || 0,
            });
          }
        }

        setAnalytics({
          activeUsers: activeCount || 0,
          newUsersThisMonth: newUsersCount || 0,
          quizzesCompletedThisMonth: quizCompletions || 0,
          coursesCreatedThisMonth: coursesCreated || 0,
          topSquads,
        });
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
          Analytics
        </h1>
        <p className="text-text-secondary">
          System-wide metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Active Users</p>
              <p className="text-3xl font-bold text-text-primary">
                {analytics?.activeUsers}
              </p>
            </div>
            <Users size={24} className="text-brand opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary">All time</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">New This Month</p>
              <p className="text-3xl font-bold text-text-primary">
                {analytics?.newUsersThisMonth}
              </p>
            </div>
            <TrendingUp size={24} className="text-success opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Quizzes Done</p>
              <p className="text-3xl font-bold text-text-primary">
                {analytics?.quizzesCompletedThisMonth}
              </p>
            </div>
            <BookOpen size={24} className="text-brand opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary">This month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Courses Added</p>
              <p className="text-3xl font-bold text-text-primary">
                {analytics?.coursesCreatedThisMonth}
              </p>
            </div>
            <Zap size={24} className="text-warning opacity-20" />
          </div>
          <p className="text-xs text-text-tertiary">This month</p>
        </Card>
      </div>

      {/* Top Squads */}
      <CardLg>
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Top Squads
        </h2>

        <div className="space-y-4">
          {analytics?.topSquads.map((squad, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-bg-base rounded-lg">
              <div>
                <p className="font-semibold text-text-primary">{squad.name}</p>
                <div className="flex gap-4 text-sm text-text-tertiary mt-1">
                  <span>{squad.memberCount} members</span>
                  <span>{squad.courseCount} courses</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">
                  {idx + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardLg>
    </div>
  );
}
