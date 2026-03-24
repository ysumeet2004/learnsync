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
  BookOpen,
  Plus,
  Clock,
  Play,
  Loader,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseItem = Database['public']['Tables']['course_items']['Row'];

interface CourseWithItems extends Course {
  course_items?: CourseItem[];
  item_count?: number;
}

export default function CoursesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const [courses, setCourses] = useState<CourseWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const addNotification = useAppStore((s) => s.addNotification);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadCourses() {
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

        // Get courses with item counts
        const { data: coursesData } = await supabase
          .from('courses')
          .select(
            `
            *,
            course_items(id)
          `
          )
          .eq('squad_id', squadId)
          .order('created_at', { ascending: false });

        if (coursesData) {
          const coursesWithCount = coursesData.map((c: any) => ({
            ...c,
            item_count: c.course_items?.length || 0,
          }));
          setCourses(coursesWithCount);
        }
      } catch (err) {
        addNotification('Failed to load courses', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [user, squadId, supabase, addNotification]);

  async function handleDeleteCourse(courseId: string) {
    if (!confirm('Delete this course? This will remove all course items and progress data.'))
      return;

    setDeletingId(courseId);

    try {
      // Delete course (cascade will handle items + progress)
      const response = await fetch(`/api/squads/${squadId}/courses/${courseId}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      setCourses(courses.filter((c) => c.id !== courseId));
      addNotification('Course deleted', 'success');
    } catch (err) {
      addNotification('Failed to delete course', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
            <BookOpen size={28} className="text-brand" />
            Courses
          </h1>
        </div>
        {isLeadOrInstructor && (
          <Button
            variant="primary"
            onClick={() => router.push(`/squad/${squadId}/courses/new`)}
            className="gap-2"
          >
            <Plus size={18} />
            Add Course
          </Button>
        )}
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <CardLg className="text-center py-12">
          <BookOpen size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
          <p className="text-text-secondary mb-4">No courses yet</p>
          {isLeadOrInstructor && (
            <Button
              variant="primary"
              onClick={() => router.push(`/squad/${squadId}/courses/new`)}
            >
              Add Your First Course
            </Button>
          )}
        </CardLg>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              onClick={() => router.push(`/squad/${squadId}/courses/${course.id}`)}
            >
              {/* Header */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                  {isLeadOrInstructor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      disabled={deletingId === course.id}
                      className="ml-2 p-2 hover:bg-danger/10 rounded text-danger transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {course.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {course.description}
                  </p>
                )}

                {/* Source Badge */}
                <div className="mb-4">
                  <Badge variant="default">
                    {course.source === 'youtube' ? '🎬 YouTube' : '🔗 Custom'}
                  </Badge>
                </div>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-text-tertiary">
                <div className="flex items-center gap-1">
                  <Play size={14} />
                  <span>{course.item_count || 0} videos</span>
                </div>
                <span>{new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
