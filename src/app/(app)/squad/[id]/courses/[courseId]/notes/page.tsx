'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Database } from '@/types/database';
import {
  ChevronLeft,
  MessageSquare,
  Clock,
  Trash2,
  Loader,
  User,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Note = Database['public']['Tables']['notes']['Row'];
type CourseItem = Database['public']['Tables']['course_items']['Row'];

interface NoteWithItem extends Note {
  course_item?: CourseItem;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function NotesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [notes, setNotes] = useState<NoteWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !courseId) return;

    async function loadNotes() {
      try {
        // Get user role
        const { data: memberData } = await supabase
          .from('squad_members')
          .select('role')
          .eq('squad_id', squadId)
          .eq('user_id', user.id)
          .single();

        if (memberData) {
          setUserRole(memberData.role);
        }

        // Get course name
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single();

        if (courseData) {
          setCourseName(courseData.title);
        }

        // Get all course items
        const { data: itemsData } = await supabase
          .from('course_items')
          .select('id')
          .eq('course_id', courseId);

        if (!itemsData || itemsData.length === 0) {
          setLoading(false);
          return;
        }

        const itemIds = itemsData.map((i) => i.id);

        // Get notes for all items in course
        const { data: notesData } = await supabase
          .from('notes')
          .select('*, course_items(*)')
          .in('item_id', itemIds)
          .order('created_at', { ascending: false });

        if (notesData) {
          setNotes(notesData);
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
        addNotification('Failed to load notes', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadNotes();

    // Set up realtime subscription
    const subscription = supabase
      .channel(`course:${courseId}:notes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, courseId, squadId, supabase, addNotification]);

  async function handleDeleteNote(noteId: string) {
    setDeleting(noteId);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      setNotes(notes.filter((n) => n.id !== noteId));
      addNotification('Note deleted', 'success');
    } catch (err) {
      addNotification('Failed to delete note', 'error');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 mb-4"
        >
          <ChevronLeft size={18} />
          Back
        </Button>

        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2 gap-3 flex items-center">
          <MessageSquare size={32} className="text-brand" />
          Course Notes
        </h1>
        <p className="text-lg text-text-secondary">{courseName}</p>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <CardLg className="text-center py-12">
          <MessageSquare size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
          <p className="text-text-secondary mb-4">No notes yet</p>
          <Button
            variant="secondary"
            onClick={() => router.push(`/squad/${squadId}/courses/${courseId}`)}
          >
            Go to Course
          </Button>
        </CardLg>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <CardLg key={note.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  {/* Video Title */}
                  {note.course_item && (
                    <p className="text-sm font-medium text-text-secondary mb-2">
                      📹{' '}
                      <button
                        onClick={() =>
                          router.push(
                            `/squad/${squadId}/courses/${courseId}/watch/${note.item_id}`
                          )
                        }
                        className="hover:text-brand hover:underline"
                      >
                        {note.course_item.title}
                      </button>
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-text-tertiary mb-3 flex items-center gap-1">
                    <Clock size={12} />
                    {note.video_timestamp_seconds !== null
                      ? formatDuration(note.video_timestamp_seconds)
                      : 'General note'}
                  </p>

                  {/* Note Content */}
                  <p className="text-text-primary leading-relaxed mb-3">
                    {note.content}
                  </p>

                  {/* Metadata */}
                  <p className="text-xs text-text-tertiary">
                    {new Date(note.created_at).toLocaleDateString()} at{' '}
                    {new Date(note.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Delete Button (only for own notes) */}
                {user?.id === note.user_id && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deleting === note.id}
                    className="p-2 hover:bg-danger/10 rounded text-danger transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </CardLg>
          ))}
        </div>
      )}
    </div>
  );
}
