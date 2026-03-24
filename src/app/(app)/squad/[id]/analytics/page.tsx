'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import { Database } from '@/types/database';
import {
  TrendingUp,
  Users,
  BookOpen,
  Loader,
  Trophy,
  Target,
} from 'lucide-react';

type SquadMember = Database['public']['Tables']['squad_members']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];
type Progress = Database['public']['Tables']['progress']['Row'];

interface MemberStats {
  memberId: string;
  memberEmail: string;
  totalCourses: number;
  totalItems: number;
  completedItems: number;
  totalProgress: number;
  avgProgress: number;
}

interface CourseStats {
  courseId: string;
  title: string;
  totalItems: number;
  completedCount: number;
  completionRate: number;
  avgProgress: number;
}

export default function AnalyticsPage() {
  const params = useParams();
  const squadId = params.id as string;
  const { user } = useRequireAuth();

  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [squadStats, setSquadStats] = useState({
    totalMembers: 0,
    totalCourses: 0,
    totalItems: 0,
    completedItems: 0,
    avgSquadProgress: 0,
  });

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadAnalytics() {
      try {
        // Get all squad members
        const { data: membersData } = await supabase
          .from('squad_members')
          .select('*')
          .eq('squad_id', squadId);

        // Get all courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*, course_items(id)')
          .eq('squad_id', squadId);

        // Get all progress for squad
        const { data: courseItems } = await supabase
          .from('course_items')
          .select('id, course_id, courses(id)')
          .eq('courses.squad_id', squadId);

        if (!courseItems || courseItems.length === 0) {
          setLoading(false);
          return;
        }

        const itemIds = courseItems.map((ci: any) => ci.id);

        const { data: progressData } = await supabase
          .from('progress')
          .select('*')
          .in('item_id', itemIds);

        // Calculate member stats
        if (membersData) {
          const memberStats: MemberStats[] = membersData.map((member) => {
            const memberProgress = progressData?.filter(
              (p) => p.user_id === member.user_id
            ) || [];

            const memberItems = courseItems?.filter((ci: any) =>
              itemIds.includes(ci.id)
            ) || [];

            const completedCount = memberProgress.filter(
              (p) => p.completed
            ).length;

            const totalProgress =
              memberProgress.length > 0
                ? memberProgress.reduce((sum, p) => sum + (p.percent_watched || 0), 0) /
                  memberProgress.length
                : 0;

            return {
              memberId: member.id,
              memberEmail: `user-${member.user_id.slice(0, 8)}@learnsync`,
              totalCourses: coursesData?.length || 0,
              totalItems: memberItems.length,
              completedItems: completedCount,
              totalProgress: completedCount,
              avgProgress: Math.round(totalProgress),
            };
          });

          setMembers(memberStats);
        }

        // Calculate course stats
        if (coursesData) {
          const courseStats: CourseStats[] = coursesData.map((course: any) => {
            const courseItemIds = course.course_items?.map((ci: any) => ci.id) || [];
            const courseProgress = progressData?.filter((p) =>
              courseItemIds.includes(p.item_id)
            ) || [];

            const completed = courseProgress.filter((p) => p.completed).length;
            const total = courseItemIds.length;
            const avgProgress =
              courseProgress.length > 0
                ? Math.round(
                    courseProgress.reduce((sum, p) => sum + (p.percent_watched || 0), 0) /
                      courseProgress.length
                  )
                : 0;

            return {
              courseId: course.id,
              title: course.title,
              totalItems: total,
              completedCount: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
              avgProgress,
            };
          });

          setCourseStats(courseStats);
        }

        // Calculate overall stats
        if (membersData && coursesData) {
          const totalItems = courseItems?.length || 0;
          const completedItems = progressData?.filter((p) => p.completed).length || 0;
          const avgProgress =
            progressData && progressData.length > 0
              ? Math.round(
                  progressData.reduce((sum, p) => sum + (p.percent_watched || 0), 0) /
                    progressData.length
                )
              : 0;

          setSquadStats({
            totalMembers: membersData.length,
            totalCourses: coursesData.length,
            totalItems,
            completedItems,
            avgSquadProgress: avgProgress,
          });
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    // Load initially
    loadAnalytics();

    // Set up realtime subscription for progress updates
    const subscription = supabase
      .channel(`squad:${squadId}:progress`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress',
        },
        () => {
          // Reload analytics on any progress change
          loadAnalytics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, squadId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2 gap-3 flex items-center">
          <TrendingUp size={32} className="text-brand" />
          Squad Analytics
        </h1>
        <p className="text-text-secondary">
          Track your squad's learning progress in real-time
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-text-tertiary text-sm font-medium mb-1">Members</p>
          <p className="text-3xl font-bold text-text-primary">
            {squadStats.totalMembers}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-text-tertiary text-sm font-medium mb-1">Courses</p>
          <p className="text-3xl font-bold text-text-primary">
            {squadStats.totalCourses}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-text-tertiary text-sm font-medium mb-1">Videos</p>
          <p className="text-3xl font-bold text-text-primary">
            {squadStats.totalItems}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-text-tertiary text-sm font-medium mb-1">
            Completed
          </p>
          <p className="text-3xl font-bold text-success">
            {squadStats.completedItems}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20">
          <p className="text-text-tertiary text-sm font-medium mb-1">
            Avg Progress
          </p>
          <p className="text-3xl font-bold text-brand">
            {squadStats.avgSquadProgress}%
          </p>
        </Card>
      </div>

      {/* Courses Performance */}
      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-4 gap-2 flex items-center">
          <BookOpen size={24} className="text-brand" />
          Course Performance
        </h2>

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No courses yet</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <CardLg key={course.courseId}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {course.completedCount}/{course.totalItems} videos completed
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-bg-surface rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {course.completionRate}% Complete
                    </span>
                    <span className="text-brand font-medium">
                      {course.avgProgress}% Avg
                    </span>
                  </div>
                </div>
              </CardLg>
            ))}
          </div>
        )}
      </div>

      {/* Member Progress */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-4 gap-2 flex items-center">
          <Users size={24} className="text-brand" />
          Member Progress
        </h2>

        {members.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No members yet</p>
          </Card>
        ) : (
          <CardLg>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-secondary text-sm">
                      Member
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-text-secondary text-sm">
                      Completed
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-text-secondary text-sm">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.memberId}
                      className="border-b border-border hover:bg-bg-surface transition-colors last:border-b-0"
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-text-primary">
                          {member.memberEmail}
                        </p>
                        <p className="text-sm text-text-tertiary">
                          {member.totalItems} videos
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="success">
                          {member.completedItems}/{member.totalItems}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-32 h-2 bg-bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand"
                              style={{
                                width: `${Math.min(member.avgProgress, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-text-primary w-12 text-right">
                            {member.avgProgress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardLg>
        )}
      </div>
    </div>
  );
}
