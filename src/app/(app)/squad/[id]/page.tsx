'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuth, useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Database } from '@/types/database';
import {
  Users,
  BookOpen,
  Settings,
  Copy,
  Share2,
  MoreVertical,
  Loader,
  TrendingUp,
  ListTodo,
  Lightbulb,
} from 'lucide-react';

type Squad = Database['public']['Tables']['squads']['Row'];
type SquadMember = Database['public']['Tables']['squad_members']['Row'];

interface SquadWithMembers extends Squad {
  squad_members?: SquadMember[];
}

export default function SquadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const [squad, setSquad] = useState<SquadWithMembers | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadSquad() {
      try {
        // Get squad data
        const { data: squadData, error: squadError } = await supabase
          .from('squads')
          .select('*')
          .eq('id', squadId)
          .single();

        if (squadError || !squadData) {
          setError('Squad not found');
          setLoading(false);
          return;
        }

        setSquad(squadData as SquadWithMembers);

        // Get members
        const { data: membersData, error: membersError } = await supabase
          .from('squad_members')
          .select('*')
          .eq('squad_id', squadId);

        if (!membersError && membersData) {
          setMembers(membersData);

          // Find current user's role
          const currentUserMember = membersData.find(
            (m) => m.user_id === user.id
          );
          if (currentUserMember) {
            setUserRole(currentUserMember.role);
          }
        }
      } catch (err) {
        setError('Failed to load squad');
      } finally {
        setLoading(false);
      }
    }

    loadSquad();
  }, [user, squadId, supabase]);

  async function handleCopyInvite() {
    if (!squad?.invite_code) return;

    const inviteUrl = `${window.location.origin}/invite/${squad.invite_code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading squad...</span>
        </div>
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardLg className="max-w-md text-center">
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {error || 'Squad not found'}
          </h1>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardLg>
      </div>
    );
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
              {squad.name}
            </h1>
            {squad.description && (
              <p className="text-lg text-text-secondary">{squad.description}</p>
            )}
          </div>
          {isLeadOrInstructor && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/squad/${squadId}/settings`)}
              className="gap-2"
            >
              <Settings size={18} />
              Settings
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-text-tertiary">Members</p>
            <p className="text-2xl font-bold text-text-primary">{members.length}</p>
          </div>
          <div>
            <p className="text-sm text-text-tertiary">Plan</p>
            <Badge variant="default">{squad.plan?.toUpperCase() || 'FREE'}</Badge>
          </div>
          <div>
            <p className="text-sm text-text-tertiary">Role</p>
            <Badge variant="success">{userRole?.toUpperCase() || 'LEARNER'}</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Members & Courses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-text-primary gap-2 flex items-center">
                <Users size={24} className="text-brand" />
                Members ({members.length})
              </h2>
              {isLeadOrInstructor && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/squad/${squadId}/members`)}
                >
                  Manage
                </Button>
              )}
            </div>

            <Card className="overflow-hidden">
              <div className="divide-y divide-border">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-text-tertiary">
                    No members yet
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 flex items-center justify-between hover:bg-bg-surface transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          User {member.user_id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-text-tertiary">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          member.role === 'lead'
                            ? 'success'
                            : member.role === 'instructor'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {member.role.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          {/* Courses Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-text-primary gap-2 flex items-center">
                <BookOpen size={24} className="text-brand" />
                Courses
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/squad/${squadId}/courses`)}
              >
                View All
              </Button>
            </div>

            <Card className="p-8 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
              <p className="text-text-secondary mb-4">No courses added yet</p>
              {isLeadOrInstructor && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/squad/${squadId}/courses/new`)}
                >
                  Add Your First Course
                </Button>
              )}
            </Card>
          </section>
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-6">
          {/* Invite Card */}
          {isLeadOrInstructor && (
            <CardLg>
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Share2 size={20} className="text-brand" />
                Invite Members
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Share this link to invite people to join your squad.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-bg-base rounded border border-border text-sm text-text-secondary truncate font-mono">
                  {squad.invite_code}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyInvite}
                  className="gap-2"
                >
                  <Copy size={16} />
                  {copiedCode ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardLg>
          )}

          {/* Quick Links */}
          <CardLg>
            <h3 className="text-lg font-bold text-text-primary mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => router.push(`/squad/${squadId}/digest`)}
              >
                <Lightbulb size={18} />
                Weekly Digest
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => router.push(`/squad/${squadId}/analytics`)}
              >
                <TrendingUp size={18} />
                Analytics
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => router.push(`/squad/${squadId}/assignments`)}
              >
                <ListTodo size={18} />
                Assignments
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push(`/squad/${squadId}/members`)}
              >
                Manage Members
              </Button>
              {isLeadOrInstructor && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => router.push(`/squad/${squadId}/settings`)}
                >
                  Squad Settings
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardLg>

          {/* Squad Info */}
          <Card className="p-4 bg-bg-base">
            <p className="text-xs text-text-tertiary font-medium mb-2">SQUAD ID</p>
            <p className="text-sm font-mono text-text-secondary break-all">{squadId}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
