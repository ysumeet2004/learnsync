'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Loader, Users, Trash2, Shield } from 'lucide-react';

interface Squad {
  id: string;
  name: string;
  description: string | null;
  plan: string;
  created_at: string;
  owner_id: string;
  memberCount?: number;
  courseCount?: number;
}

export default function SquadsManagementPage() {
  const supabase = createClient();

  const [squads, setSquads] = useState<Squad[]>([]);
  const [filteredSquads, setFilteredSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  useEffect(() => {
    async function loadSquads() {
      try {
        const { data } = await supabase
          .from('squads')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          // Load member count for each squad
          const squadsWithCounts = await Promise.all(
            data.map(async (squad) => {
              const { count: memberCount } = await supabase
                .from('squad_members')
                .select('*', { count: 'exact' })
                .eq('squad_id', squad.id);

              const { count: courseCount } = await supabase
                .from('courses')
                .select('*', { count: 'exact' })
                .eq('squad_id', squad.id);

              return {
                ...squad,
                memberCount: memberCount || 0,
                courseCount: courseCount || 0,
              };
            })
          );

          setSquads(squadsWithCounts);
          setFilteredSquads(squadsWithCounts);
        }
      } catch (err) {
        console.error('Failed to load squads:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSquads();
  }, [supabase]);

  useEffect(() => {
    let filtered = squads;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((squad) =>
        squad.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by plan
    if (selectedPlan !== 'all') {
      filtered = filtered.filter((squad) => squad.plan === selectedPlan);
    }

    setFilteredSquads(filtered);
  }, [searchQuery, selectedPlan, squads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading squads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
          Squad Management
        </h1>
        <p className="text-text-secondary">
          View and manage all squads ({filteredSquads.length} total)
        </p>
      </div>

      {/* Filters */}
      <CardLg className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search by squad name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg-base text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand"
            />
          </div>

          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-bg-base text-text-primary focus:outline-none focus:border-brand"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="squad">Squad</option>
            <option value="teams">Teams</option>
          </select>
        </div>
      </CardLg>

      {/* Squads Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSquads.length === 0 ? (
          <div className="col-span-full text-center py-12 text-text-tertiary">
            No squads found
          </div>
        ) : (
          filteredSquads.map((squad) => (
            <Card key={squad.id} className="p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-text-primary text-lg">
                    {squad.name}
                  </h3>
                  <Badge
                    variant={
                      squad.plan === 'free'
                        ? 'default'
                        : squad.plan === 'pro'
                          ? 'success'
                          : squad.plan === 'squad'
                            ? 'warning'
                            : 'danger'
                    }
                  >
                    {squad.plan.toUpperCase()}
                  </Badge>
                </div>
                {squad.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {squad.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border mb-4">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Members</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {squad.memberCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Courses</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {squad.courseCount}
                  </p>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-text-tertiary mb-4">
                Created {new Date(squad.created_at).toLocaleDateString()}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 gap-2">
                  <Users size={16} />
                  View
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-text-tertiary mb-2">Total Squads</p>
          <p className="text-3xl font-bold text-text-primary">{squads.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-tertiary mb-2">Total Members</p>
          <p className="text-3xl font-bold text-text-primary">
            {squads.reduce((sum, s) => sum + (s.memberCount || 0), 0)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-tertiary mb-2">Total Courses</p>
          <p className="text-3xl font-bold text-text-primary">
            {squads.reduce((sum, s) => sum + (s.courseCount || 0), 0)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-tertiary mb-2">Avg Members/Squad</p>
          <p className="text-3xl font-bold text-text-primary">
            {squads.length > 0
              ? Math.round(
                  squads.reduce((sum, s) => sum + (s.memberCount || 0), 0) /
                    squads.length
                )
              : 0}
          </p>
        </Card>
      </div>
    </div>
  );
}
