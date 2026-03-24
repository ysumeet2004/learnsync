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
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader,
  ListTodo,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'];

interface AssignmentWithSubmissions extends Assignment {
  submissions?: Submission[];
}

type Status = 'not_started' | 'in_progress' | 'submitted' | 'graded';

export default function AssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [assignments, setAssignments] = useState<AssignmentWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadAssignments() {
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

        // Get all assignments for squad
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*, submissions(*)')
          .eq('squad_id', squadId)
          .order('created_at', { ascending: false });

        if (assignmentsData) {
          setAssignments(assignmentsData);
        }
      } catch (err) {
        console.error('Failed to load assignments:', err);
        addNotification('Failed to load assignments', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();

    // Set up realtime subscription
    const subscription = supabase
      .channel(`squad:${squadId}:assignments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
        },
        () => {
          loadAssignments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, squadId, supabase, addNotification]);

  async function handleDeleteAssignment(assignmentId: string) {
    if (!confirm('Delete this assignment?')) return;

    try {
      const response = await fetch(`/api/squads/${squadId}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      setAssignments(assignments.filter((a) => a.id !== assignmentId));
      addNotification('Assignment deleted', 'success');
    } catch (err) {
      addNotification('Failed to delete assignment', 'error');
    }
  }

  const isLeadOrInstructor = ['lead', 'instructor'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading assignments...</span>
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
            <ListTodo size={28} className="text-brand" />
            Assignments
          </h1>
        </div>
        {isLeadOrInstructor && (
          <Button
            variant="primary"
            onClick={() => router.push(`/squad/${squadId}/assignments/new`)}
            className="gap-2"
          >
            <Plus size={18} />
            New Assignment
          </Button>
        )}
      </div>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <CardLg className="text-center py-12">
          <ListTodo size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
          <p className="text-text-secondary mb-4">No assignments yet</p>
          {isLeadOrInstructor && (
            <Button
              variant="primary"
              onClick={() => router.push(`/squad/${squadId}/assignments/new`)}
            >
              Create First Assignment
            </Button>
          )}
        </CardLg>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const totalSubmissions = assignment.submissions?.length || 0;
            const submittedCount = assignment.submissions?.filter(
              (s) => s.status === 'submitted' || s.status === 'graded'
            ).length || 0;

            const userSubmission = assignment.submissions?.find(
              (s) => s.user_id === user?.id
            );

            const dueDate = assignment.due_date
              ? new Date(assignment.due_date)
              : null;
            const isOverdue = dueDate && dueDate < new Date();

            return (
              <Card
                key={assignment.id}
                hover
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/squad/${squadId}/assignments/${assignment.id}`)
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {assignment.title}
                      </h3>
                      {isOverdue && (
                        <Badge variant="danger" className="flex-shrink-0">
                          Overdue
                        </Badge>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {assignment.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-text-tertiary">
                      {dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {dueDate.toLocaleDateString()}
                        </span>
                      )}
                      {isLeadOrInstructor && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-success" />
                          {submittedCount}/{totalSubmissions} submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Status (If not Lead) */}
                  {!isLeadOrInstructor && userSubmission && (
                    <Badge
                      variant={
                        userSubmission.status === 'graded'
                          ? 'success'
                          : 'default'
                      }
                      className="flex-shrink-0"
                    >
                      {userSubmission.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}

                  {/* Delete Button (Lead Only) */}
                  {isLeadOrInstructor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAssignment(assignment.id);
                      }}
                      className="p-2 hover:bg-danger/10 rounded text-danger transition-colors flex-shrink-0 ml-4"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
