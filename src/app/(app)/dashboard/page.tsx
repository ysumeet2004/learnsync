'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/utils/hooks';
import { createClient } from '@/lib/supabase-client';
import { Card, CardLg } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Plus, Users, BookOpen, TrendingUp } from 'lucide-react';
import { Database } from '@/types/database';

type Squad = Database['public']['Tables']['squads']['Row'];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSquads() {
      if (!user) return;

      // Get all squads where user is a member
      const { data, error } = await supabase
        .from('squad_members')
        .select('squads(*)')
        .eq('user_id', user.id);

      if (!error && data) {
        const squadList = data
          .map((m: any) => m.squads)
          .filter(Boolean);
        setSquads(squadList);
      }
      setLoading(false);
    }

    loadSquads();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-text-secondary">Loading your squads...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-text-secondary">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Squads', value: squads.length, icon: Users },
          { label: 'Courses in Progress', value: 0, icon: BookOpen },
          { label: 'Total Watch Time', value: '0h', icon: TrendingUp },
          { label: 'This Week', value: '0h', icon: TrendingUp },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-text-tertiary text-sm font-medium mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                </div>
                <Icon className="w-8 h-8 text-brand/50" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Squads Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-text-primary">
            Your Squads
          </h2>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => router.push('/squads/new')}
          >
            <Plus size={20} />
            New Squad
          </Button>
        </div>

        {squads.length === 0 ? (
          <CardLg className="text-center py-12">
            <div className="mb-6">
              <Users className="w-12 h-12 text-text-tertiary mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No squads yet
            </h3>
            <p className="text-text-secondary mb-6">
              Create your first squad to start learning with friends
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/squads/new')}
            >
              Create Your First Squad
            </Button>
          </CardLg>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {squads.map((squad) => (
              <Card
                key={squad.id}
                hover
                className="cursor-pointer"
                onClick={() => router.push(`/squad/${squad.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {squad.name}
                    </h3>
                    {squad.description && (
                      <p className="text-sm text-text-secondary mt-1">
                        {squad.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-medium text-text-tertiary">
                    Created {new Date(squad.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-brand/10 text-brand rounded">
                    {squad.plan.toUpperCase()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">
          Recent Activity
        </h2>
        <CardLg className="text-center py-12">
          <p className="text-text-secondary">
            No recent activity. Start watching a course to see it here!
          </p>
        </CardLg>
      </div>
    </div>
  );
}
