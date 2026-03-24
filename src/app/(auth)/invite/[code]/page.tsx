'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Button from '@/components/ui/Button';
import { CardLg } from '@/components/ui/Card';
import { useAuth } from '@/utils/hooks';
import { useAppStore } from '@/utils/store';
import { Users, Lock, ArrowRight } from 'lucide-react';
import { Database } from '@/types/database';

type Squad = Database['public']['Tables']['squads']['Row'];

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const code = params.code as string;

  useEffect(() => {
    async function loadSquadInfo() {
      try {
        // Get squad info by invite code (public query)
        const { data, error: squadError } = await supabase
          .from('squads')
          .select('id, name, description, plan, created_at')
          .eq('invite_code', code)
          .single();

        if (squadError || !data) {
          setError('Invalid or expired invite link');
          setLoading(false);
          return;
        }

        setSquad(data as Squad);

        // Get member count
        const { count, error: countError } = await supabase
          .from('squad_members')
          .select('*', { count: 'exact', head: true })
          .eq('squad_id', data.id);

        if (!countError && count) {
          setMemberCount(count);
        }
      } catch (err) {
        setError('Failed to load squad information');
      } finally {
        setLoading(false);
      }
    }

    loadSquadInfo();
  }, [code, supabase]);

  async function handleJoinSquad() {
    if (!user) {
      router.push(`/login?redirect=/invite/${code}`);
      return;
    }

    setJoiningLoading(true);

    try {
      const response = await fetch('/api/squads/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      });

      const { data, error: joinError } = await response.json();

      if (joinError) {
        addNotification(joinError, 'error');
        setError(joinError);
        return;
      }

      addNotification(`Joined "${data.squad_name}"! 🎉`, 'success');
      router.push(`/squad/${data.squad_id}`);
    } catch (err) {
      addNotification('Failed to join squad', 'error');
      setError('Failed to join squad');
    } finally {
      setJoiningLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-base to-bg-surface flex items-center justify-center">
        <div className="text-text-secondary">Loading squad details...</div>
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-base to-bg-surface flex items-center justify-center px-4">
        <CardLg className="max-w-md text-center">
          <Lock className="w-12 h-12 text-danger mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
            Invalid Invite Link
          </h1>
          <p className="text-text-secondary mb-6">
            {error || 'This invite link is invalid or has expired.'}
          </p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </CardLg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base to-bg-surface flex items-center justify-center px-4 py-8">
      <CardLg className="max-w-2xl w-full">
        {/* Squad Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
            {squad.name}
          </h1>
          {squad.description && (
            <p className="text-lg text-text-secondary">{squad.description}</p>
          )}
        </div>

        {/* Squad Info */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8 p-6 bg-bg-base rounded-xl border border-border">
          <div>
            <Users className="w-6 h-6 text-brand mb-2" />
            <p className="text-2xl font-bold text-text-primary">{memberCount}</p>
            <p className="text-sm text-text-tertiary">Members</p>
          </div>

          <div>
            <Lock className="w-6 h-6 text-brand mb-2" />
            <p className="text-lg font-semibold text-text-primary">
              {squad.plan?.toUpperCase() || 'FREE'}
            </p>
            <p className="text-sm text-text-tertiary">Plan</p>
          </div>

          <div>
            <ArrowRight className="w-6 h-6 text-brand mb-2" />
            <p className="text-sm text-text-primary font-medium">Ready to join</p>
            <p className="text-sm text-text-tertiary">Start learning today</p>
          </div>
        </div>

        {/* Join Section */}
        <div className="space-y-4">
          {!authLoading && !user ? (
            <>
              <p className="text-text-secondary mb-4">
                You need to be signed in to join this squad.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/login?redirect=/invite/${code}`)}
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/signup?invite=${code}`)}
                  className="flex-1"
                >
                  Create Account
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-4">
                Ready to join {squad.name} and start learning together?
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleJoinSquad}
                isLoading={joiningLoading}
                className="w-full gap-2"
              >
                <Users size={20} />
                Join Squad
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>

        {/* Benefits */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm font-medium text-text-secondary mb-4">
            What you'll get:
          </p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>✓ Auto-tracked watch progress</li>
            <li>✓ Real-time squad dashboard</li>
            <li>✓ Collaborative notes and discussions</li>
            <li>✓ Progress analytics and leaderboards</li>
          </ul>
        </div>
      </CardLg>
    </div>
  );
}
