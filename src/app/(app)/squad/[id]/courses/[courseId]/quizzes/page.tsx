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
  Brain,
  Loader,
  Play,
  CheckCircle2,
  TrendingUp,
  Clock,
  FileQuestion,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];

export default function QuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !courseId) return;

    async function loadData() {
      try {
        // Get all course items
        const { data: items } = await supabase
          .from('course_items')
          .select('id')
          .eq('course_id', courseId);

        if (!items || items.length === 0) {
          setLoading(false);
          return;
        }

        const itemIds = items.map((i) => i.id);

        // Get quizzes for all items
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('*')
          .in('item_id', itemIds)
          .order('created_at', { ascending: false });

        if (quizzesData) {
          setQuizzes(quizzesData);
        }

        // Get user's quiz attempts
        if (quizzesData) {
          const quizIds = quizzesData.map((q) => q.id);
          const { data: attemptsData } = await supabase
            .from('quiz_attempts')
            .select('*')
            .in('quiz_id', quizIds)
            .eq('user_id', user.id);

          if (attemptsData) {
            setAttempts(attemptsData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
        addNotification('Failed to load quizzes', 'error');
        setLoading(false);
      }
    }

    loadData();
  }, [user, courseId, supabase, addNotification]);

  function getQuizStats(quizId: string) {
    const quizAttempts = attempts.filter((a) => a.quiz_id === quizId);
    if (quizAttempts.length === 0) {
      return { attempts: 0, bestScore: 0, lastAttempt: null };
    }

    const scores = quizAttempts.map((a) =>
      Math.round((a.score / a.total_questions) * 100)
    );
    const bestScore = Math.max(...scores);
    const lastAttempt = quizAttempts[quizAttempts.length - 1];

    return {
      attempts: quizAttempts.length,
      bestScore,
      lastAttempt,
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading quizzes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 mb-6"
      >
        <ChevronLeft size={18} />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={32} className="text-brand" />
          <h1 className="text-3xl font-heading font-bold text-text-primary">
            Course Quizzes
          </h1>
        </div>
        <p className="text-text-secondary">
          Test your knowledge and track your progress
        </p>
      </div>

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <CardLg className="text-center py-12">
          <div className="flex justify-center mb-4">
            <FileQuestion size={48} className="text-border" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            No quizzes yet
          </h2>
          <p className="text-text-secondary mb-6">
            Quizzes will be added by the course instructor
          </p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardLg>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const stats = getQuizStats(quiz.id);
            const percentage =
              stats.attempts > 0 ? stats.bestScore : null;

            return (
              <Card
                key={quiz.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer hover:bg-bg-surface/50"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-text-primary">
                        {quiz.title}
                      </h2>
                      {quiz.generated_by_ai && (
                        <Badge variant="default">AI Generated</Badge>
                      )}
                      {quiz.is_required && (
                        <Badge variant="warning">Required</Badge>
                      )}
                    </div>

                    {quiz.description && (
                      <p className="text-text-secondary mb-3 text-sm">
                        {quiz.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <FileQuestion size={16} />
                        <span>{quiz.total_questions} questions</span>
                      </div>

                      {stats.attempts > 0 && (
                        <>
                          <div className="flex items-center gap-2 text-text-secondary">
                            <CheckCircle2 size={16} />
                            <span>{stats.attempts} attempt(s)</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} />
                            <span>
                              Best:{' '}
                              <span className="font-bold text-success">
                                {percentage}%
                              </span>
                            </span>
                          </div>

                          {stats.lastAttempt && (
                            <div className="flex items-center gap-2 text-text-secondary">
                              <Clock size={16} />
                              <span>
                                Last attempt:{' '}
                                {new Date(
                                  stats.lastAttempt.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Content - Action Button & Status */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {percentage !== null && (
                      <div
                        className={`text-center ${
                          percentage >= 70
                            ? 'text-success'
                            : percentage >= 50
                              ? 'text-warning'
                              : 'text-danger'
                        }`}
                      >
                        <div className="text-2xl font-bold">{percentage}%</div>
                        <div className="text-xs">Best Score</div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/squad/${squadId}/courses/${courseId}/quizzes/${quiz.id}`
                        )
                      }
                      className="gap-2"
                    >
                      <Play size={16} />
                      {stats.attempts > 0 ? 'Retake' : 'Start'}
                    </Button>
                  </div>
                </div>

                {/* Previous Attempts - If any */}
                {stats.attempts > 1 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-text-secondary mb-2">
                      Previous attempts
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {attempts
                        .filter((a) => a.quiz_id === quiz.id)
                        .map((attempt) => {
                          const attemptPercent = Math.round(
                            (attempt.score / attempt.total_questions) * 100
                          );
                          return (
                            <button
                              key={attempt.id}
                              onClick={() =>
                                router.push(
                                  `/squad/${squadId}/courses/${courseId}/quizzes/results/${attempt.id}`
                                )
                              }
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                attemptPercent >= 70
                                  ? 'bg-success/20 text-success hover:bg-success/30'
                                  : attemptPercent >= 50
                                    ? 'bg-warning/20 text-warning hover:bg-warning/30'
                                    : 'bg-danger/20 text-danger hover:bg-danger/30'
                              }`}
                              title={new Date(
                                attempt.created_at
                              ).toLocaleDateString()}
                            >
                              {attemptPercent}%
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
