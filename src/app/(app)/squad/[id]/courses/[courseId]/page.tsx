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
  Play,
  Clock,
  BookOpen,
  Trash2,
  Loader,
  MessageSquare,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseItem = Database['public']['Tables']['course_items']['Row'];

interface CourseItemWithProgress extends CourseItem {
  progress?: { percent_watched: number; completed: boolean };
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [items, setItems] = useState<CourseItemWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const addNotification = useAppStore((s) => s.addNotification);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !squadId || !courseId) return;

    async function loadCourseDetails() {
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

        // Get course
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .eq('squad_id', squadId)
          .single();

        if (courseData) {
          setCourse(courseData);
        }

        // Get items
        const { data: itemsData } = await supabase
          .from('course_items')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true });

        if (itemsData) {
          // Fetch progress for each item
          const itemsWithProgress = await Promise.all(
            itemsData.map(async (item) => {
              const { data: progressData } = await supabase
                .from('progress')
                .select('percent_watched, completed')
                .eq('item_id', item.id)
                .eq('user_id', user.id)
                .single();

              return {
                ...item,
                progress: progressData,
              };
            })
          );

          setItems(itemsWithProgress);
        }
      } catch (err) {
        addNotification('Failed to load course details', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadCourseDetails();
  }, [user, squadId, courseId, supabase, addNotification]);

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Delete this video?')) return;

    setDeleting(itemId);

    try {
      const response = await fetch(
        `/api/squads/${squadId}/courses/${courseId}/items/${itemId}`,
        { method: 'DELETE' }
      );

      const { error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      setItems(items.filter((i) => i.id !== itemId));
      addNotification('Item deleted', 'success');
    } catch (err) {
      addNotification('Failed to delete item', 'error');
    } finally {
      setDeleting(null);
    }
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');
  const totalDuration = items.reduce((sum, item) => sum + (item.duration_seconds || 0), 0);
  const completedCount = items.filter((i) => i.progress?.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading course...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">Course not found</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
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

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-lg text-text-secondary mb-4">{course.description}</p>
            )}
          </div>
          {isLeadOrInstructor && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/squad/${squadId}/courses/${courseId}/notes`)}
                className="gap-2"
              >
                <MessageSquare size={16} />
                Notes
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/squad/${squadId}/courses/${courseId}/settings`)}
              >
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-text-tertiary">Source</p>
            <Badge variant="default">
              {course.source === 'youtube' ? '🎬 YouTube' : '🔗 Custom'}
            </Badge>
          </div>
          <div>
            <p className="text-text-tertiary mb-1">Videos</p>
            <p className="font-semibold text-text-primary">{items.length}</p>
          </div>
          <div>
            <p className="text-text-tertiary mb-1">Total Duration</p>
            <p className="font-semibold text-text-primary flex items-center gap-1">
              <Clock size={16} />
              {formatDuration(totalDuration)}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary mb-1">Completed</p>
            <p className="font-semibold text-text-primary">
              {completedCount}/{items.length}
            </p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <CardLg>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary">No videos in this course yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item, index) => (
              <div key={item.id} className="p-4 hover:bg-bg-surface transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div
                    className="w-32 h-20 bg-gradient-to-br from-brand to-brand/50 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/squad/${squadId}/courses/${courseId}/watch/${item.id}`
                      )
                    }
                  >
                    <Play size={32} className="text-white opacity-70 group-hover:opacity-100" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div>
                        <p className="text-sm text-text-tertiary mb-1">
                          Video {index + 1}
                        </p>
                        <h3
                          className="font-semibold text-text-primary hover:text-brand cursor-pointer line-clamp-2"
                          onClick={() =>
                            router.push(
                              `/squad/${squadId}/courses/${courseId}/watch/${item.id}`
                            )
                          }
                        >
                          {item.title}
                        </h3>
                      </div>

                      {isLeadOrInstructor && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deleting === item.id}
                          className="p-2 hover:bg-danger/10 rounded text-danger transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {item.progress && (
                      <div className="mb-2">
                        <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.progress.completed ? 'bg-success' : 'bg-brand'
                            }`}
                            style={{
                              width: `${Math.max(item.progress.percent_watched || 0, 5)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Duration & Status */}
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(item.duration_seconds || 0)}
                      </span>
                      {item.progress?.completed ? (
                        <span className="text-success font-medium">✓ Completed</span>
                      ) : item.progress?.percent_watched ? (
                        <span className="text-brand">
                          {Math.round(item.progress.percent_watched)}% watched
                        </span>
                      ) : (
                        <span>Not started</span>
                      )}
                    </div>
                  </div>

                  {/* Play Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/squad/${squadId}/courses/${courseId}/watch/${item.id}`
                      )
                    }
                    className="gap-2 flex-shrink-0"
                  >
                    <Play size={16} />
                    Watch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardLg>
    </div>
  );
}
