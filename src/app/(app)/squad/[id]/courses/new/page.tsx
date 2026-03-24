'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { CardLg } from '@/components/ui/Card';
import CourseCreationForm from '@/components/forms/CourseCreationForm';
import { Database } from '@/types/database';
import { Loader, Film } from 'lucide-react';

type Squad = Database['public']['Tables']['squads']['Row'];

export default function NewCoursePage() {
  const { id: squadId } = useParams();
  const { user } = useRequireAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadSquad() {
      try {
        const { data } = await supabase
          .from('squads')
          .select('*')
          .eq('id', squadId)
          .single();

        setSquad(data);
      } catch (err) {
        console.error('Failed to load squad');
      } finally {
        setLoading(false);
      }
    }

    loadSquad();
  }, [user, squadId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2 gap-3 flex items-center">
          <Film size={32} className="text-brand" />
          Add Course to {squad?.name}
        </h1>
        <p className="text-lg text-text-secondary">
          Import your course content and start tracking progress
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <CardLg>
          <h3 className="font-bold text-text-primary mb-2">📺 YouTube</h3>
          <p className="text-sm text-text-secondary">
            Import videos from any public YouTube playlist or channel
          </p>
        </CardLg>
        <CardLg>
          <h3 className="font-bold text-text-primary mb-2">✨ Auto-Extract</h3>
          <p className="text-sm text-text-secondary">
            We automatically fetch video duration and metadata
          </p>
        </CardLg>
      </div>

      {/* Form */}
      <CardLg>
        <CourseCreationForm />
      </CardLg>
    </div>
  );
}
