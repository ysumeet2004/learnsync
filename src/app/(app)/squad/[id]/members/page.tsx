'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/utils/store';
import { Database } from '@/types/database';
import {
  Users,
  ChevronLeft,
  Trash2,
  Crown,
  Loader,
} from 'lucide-react';

type Squad = Database['public']['Tables']['squads']['Row'];
type SquadMember = Database['public']['Tables']['squad_members']['Row'];

interface MemberWithProfile extends SquadMember {
  profile?: { email: string };
}

export default function SquadMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const addNotification = useAppStore((s) => s.addNotification);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadData() {
      try {
        // Get squad
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

        setSquad(squadData);

        // Get members with profiles
        const { data: membersData, error: membersError } = await supabase
          .from('squad_members')
          .select('*')
          .eq('squad_id', squadId);

        if (!membersError && membersData) {
          setMembers(
            membersData.map((m) => ({
              ...m,
              profile: { email: `user-${m.user_id.slice(0, 8)}@learnsync.com` },
            }))
          );

          // Find current user's role
          const currentUserMember = membersData.find(
            (m) => m.user_id === user.id
          );
          if (currentUserMember) {
            setUserRole(currentUserMember.role);
          }
        }
      } catch (err) {
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, squadId, supabase]);

  async function handlePromoteToLead(memberId: string) {
    if (!['lead', 'instructor'].includes(userRole || '')) {
      addNotification('Only leads can manage roles', 'error');
      return;
    }

    setActionLoading(memberId);

    try {
      const response = await fetch(`/api/squads/${squadId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'lead' }),
      });

      const { error: updateError } = await response.json();

      if (updateError) {
        addNotification(updateError, 'error');
        return;
      }

      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: 'lead' } : m
        )
      );
      addNotification('Member role updated', 'success');
    } catch (err) {
      addNotification('Failed to update member role', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!['lead', 'instructor'].includes(userRole || '')) {
      addNotification('Only leads can remove members', 'error');
      return;
    }

    if (!confirm('Remove this member from the squad?')) return;

    setActionLoading(memberId);

    try {
      const response = await fetch(`/api/squads/${squadId}/members/${memberId}`, {
        method: 'DELETE',
      });

      const { error: deleteError } = await response.json();

      if (deleteError) {
        addNotification(deleteError, 'error');
        return;
      }

      setMembers(members.filter((m) => m.id !== memberId));
      addNotification('Member removed', 'success');
    } catch (err) {
      addNotification('Failed to remove member', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ChevronLeft size={18} />
          Back
        </Button>
        <h1 className="text-3xl font-heading font-bold text-text-primary">
          Manage Members
        </h1>
      </div>

      {error ? (
        <Card className="p-8 text-center border-danger/20 bg-danger/5">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      ) : (
        <CardLg>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
              <p className="text-text-secondary">No members in this squad yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-text-secondary text-sm">
                      User
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-secondary text-sm">
                      Role
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-text-secondary text-sm">
                      Joined
                    </th>
                    {isLeadOrInstructor && (
                      <th className="text-right py-4 px-4 font-semibold text-text-secondary text-sm">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-border hover:bg-bg-surface transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-text-primary">
                            {member.user_id === user?.id ? 'You' : `User ${member.user_id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-text-tertiary">
                            {member.profile?.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
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
                      </td>
                      <td className="py-4 px-4 text-sm text-text-secondary">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      {isLeadOrInstructor && member.user_id !== user?.id && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {member.role !== 'lead' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePromoteToLead(member.id)}
                                isLoading={actionLoading === member.id}
                                className="gap-1"
                              >
                                <Crown size={16} />
                                Promote
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              isLoading={actionLoading === member.id}
                              className="gap-1"
                            >
                              <Trash2 size={16} />
                              Remove
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info */}
          {isLeadOrInstructor && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-text-tertiary">
                💡 Tip: Promote members to Lead role to give them management permissions.
              </p>
            </div>
          )}
        </CardLg>
      )}
    </div>
  );
}
