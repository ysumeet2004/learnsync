'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { CardLg, Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppStore } from '@/utils/store';
import { Database } from '@/types/database';
import {
  ChevronLeft,
  Settings,
  Loader,
  RefreshCw,
  Copy,
  Trash2,
} from 'lucide-react';
import { squadSchema } from '@/lib/validations';

type Squad = Database['public']['Tables']['squads']['Row'];

export default function SquadSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const [squad, setSquad] = useState<Squad | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadSquad() {
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
        setFormData({
          name: squadData.name,
          description: squadData.description || '',
        });

        // Get user role
        const { data: memberData } = await supabase
          .from('squad_members')
          .select('role')
          .eq('squad_id', squadId)
          .eq('user_id', user.id)
          .single();

        if (memberData) {
          setUserRole(memberData.role);

          // Check authorization
          if (!['lead', 'instructor'].includes(memberData.role)) {
            setError('Only leads can access settings');
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load squad settings');
        setLoading(false);
      }
    }

    loadSquad();
  }, [user, squadId, supabase]);

  async function handleSaveChanges() {
    try {
      squadSchema.parse(formData);
      setErrors({});
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      err.errors?.forEach((e: any) => {
        newErrors[e.path[0]] = e.message;
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const { error: updateError } = await response.json();

      if (updateError) {
        addNotification(updateError, 'error');
        return;
      }

      setSquad({ ...squad!, ...formData });
      addNotification('Squad settings saved', 'success');
    } catch (err) {
      addNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateCode() {
    if (!confirm('Generate a new invite code? Old code will stop working.')) return;

    try {
      const response = await fetch(`/api/squads/${squadId}/invite`, {
        method: 'POST',
      });

      const { data, error: codeError } = await response.json();

      if (codeError) {
        addNotification(codeError, 'error');
        return;
      }

      setSquad({ ...squad!, invite_code: data.invite_code });
      addNotification('New invite code generated', 'success');
    } catch (err) {
      addNotification('Failed to generate code', 'error');
    }
  }

  async function handleCopyInvite() {
    if (!squad?.invite_code) return;

    const inviteUrl = `${window.location.origin}/invite/${squad.invite_code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleDeleteSquad() {
    if (
      !confirm(
        'Are you sure you want to delete this squad? This action cannot be undone and will remove all data.'
      )
    )
      return;

    try {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: 'DELETE',
      });

      const { error: deleteError } = await response.json();

      if (deleteError) {
        addNotification(deleteError, 'error');
        return;
      }

      addNotification('Squad deleted', 'success');
      router.push('/dashboard');
    } catch (err) {
      addNotification('Failed to delete squad', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center border-danger/20 bg-danger/5">
          <p className="text-danger mb-4">{error || 'Squad not found'}</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');

  if (!isLeadOrInstructor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center border-danger/20 bg-danger/5">
          <p className="text-danger">You don't have permission to access settings</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
        <h1 className="text-3xl font-heading font-bold text-text-primary gap-2 flex items-center">
          <Settings size={28} className="text-brand" />
          Squad Settings
        </h1>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <CardLg>
          <h2 className="text-xl font-bold text-text-primary mb-6">
            General Settings
          </h2>

          <div className="space-y-4">
            <Input
              label="Squad Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              placeholder="Enter squad name"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What is this squad about?"
                className="w-full px-4 py-3 bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <Button
              variant="primary"
              onClick={handleSaveChanges}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </div>
        </CardLg>

        {/* Invite Settings */}
        <CardLg>
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Invite Link
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Current Invite Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-bg-surface rounded-lg border border-border font-mono text-sm text-text-secondary flex items-center">
                  {squad.invite_code}
                </div>
                <Button
                  variant="secondary"
                  onClick={handleCopyInvite}
                  className="gap-2"
                >
                  <Copy size={18} />
                  {copiedCode ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleRegenerateCode}
              className="gap-2"
            >
              <RefreshCw size={18} />
              Generate New Code
            </Button>

            <p className="text-sm text-text-tertiary">
              Share the invite code or full link with others to let them join your squad.
            </p>
          </div>
        </CardLg>

        {/* Danger Zone */}
        <Card className="border-danger/20 bg-danger/5 p-6">
          <h2 className="text-lg font-bold text-danger mb-4">Danger Zone</h2>

          <div>
            <p className="text-sm text-text-secondary mb-4">
              Deleting this squad will permanently remove all data including courses,
              progress, and notes.
            </p>
            <Button
              variant="danger"
              onClick={handleDeleteSquad}
              className="gap-2"
            >
              <Trash2 size={18} />
              Delete Squad
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
