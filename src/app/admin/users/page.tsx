'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Search,
  Loader,
  MoreVertical,
  Trash2,
  Shield,
  Mail,
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  plan: string;
  created_at: string;
  avatar_url: string | null;
  stripe_customer_id: string | null;
}

export default function UsersManagementPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          setUsers(data);
          setFilteredUsers(data);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [supabase]);

  useEffect(() => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by plan
    if (selectedPlan !== 'all') {
      filtered = filtered.filter((user) => user.plan === selectedPlan);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, selectedPlan, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
          User Management
        </h1>
        <p className="text-text-secondary">
          View and manage all users ({filteredUsers.length} total)
        </p>
      </div>

      {/* Filters */}
      <CardLg className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg-base text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand"
            />
          </div>

          {/* Plan Filter */}
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

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-bg-surface transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-text-primary">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-text-tertiary">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Plan Badge */}
                  <Badge
                    variant={
                      user.plan === 'free'
                        ? 'default'
                        : user.plan === 'pro'
                          ? 'success'
                          : user.plan === 'squad'
                            ? 'warning'
                            : 'danger'
                    }
                  >
                    {user.plan.toUpperCase()}
                  </Badge>

                  {/* Join Date */}
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-text-tertiary">Joined</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      title="View user details"
                    >
                      <Mail size={16} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      title="User options"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Stats Footer */}
      <div className="mt-6 grid md:grid-cols-4 gap-4">
        {['free', 'pro', 'squad', 'teams'].map((plan) => {
          const count = users.filter((u) => u.plan === plan).length;
          return (
            <Card key={plan} className="p-4 text-center">
              <p className="text-sm text-text-tertiary mb-2 capitalize">
                {plan} Plan
              </p>
              <p className="text-2xl font-bold text-text-primary">{count}</p>
              <p className="text-xs text-text-tertiary mt-2">
                {users.length > 0
                  ? Math.round(((count / users.length) * 100) / 100)
                  : 0}
                %
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
