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
  Check,
  X,
  TrendingUp,
  Loader,
  Calendar,
  Clock,
} from 'lucide-react';

type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;

  const supabase = createClient();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const attemptId = (params.attemptId as string) || '';

  useEffect(() => {
    if (!user || !attemptId) return;

    async function loadAttempt() {
      try {
        // Get specific attempt
        const { data: attemptData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('id', attemptId)
          .single();

        if (attemptData) {
          setAttempt(attemptData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load quiz attempt:', err);
        setLoading(false);
      }
    }

    loadAttempt();
  }, [user, attemptId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading results...</span>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">Quiz attempt not found</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const answers = attempt.answers || [];

  // Extract answers if stored as JSON
  const parsedAnswers = Array.isArray(answers)
    ? answers
    : typeof answers === 'string'
      ? JSON.parse(answers)
      : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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

      {/* Score Card */}
      <CardLg className="mb-8">
        <div className="text-center mb-8">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              percentage >= 70
                ? 'bg-success/10'
                : percentage >= 50
                  ? 'bg-warning/10'
                  : 'bg-danger/10'
            }`}
          >
            <span
              className={`text-4xl font-bold ${
                percentage >= 70
                  ? 'text-success'
                  : percentage >= 50
                    ? 'text-warning'
                    : 'text-danger'
              }`}
            >
              {percentage}%
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Quiz Results
          </h1>

          <p className="text-lg text-text-secondary mb-4">
            You scored{' '}
            <span className="font-bold text-brand">
              {attempt.score}/{attempt.total_questions}
            </span>
          </p>

          <div className="flex gap-4 justify-center text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(attempt.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              {new Date(attempt.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {parsedAnswers.filter((a: any) => a.is_correct).length}
            </div>
            <p className="text-sm text-text-secondary">Correct</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger">
              {parsedAnswers.filter((a: any) => !a.is_correct).length}
            </div>
            <p className="text-sm text-text-secondary">Incorrect</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {parsedAnswers.length}
            </div>
            <p className="text-sm text-text-secondary">Total</p>
          </div>
        </div>
      </CardLg>

      {/* Feedback */}
      <CardLg className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-brand" />
          <h2 className="text-lg font-bold text-text-primary">
            Performance Feedback
          </h2>
        </div>

        <p className="text-text-secondary">
          {percentage >= 80
            ? 'Excellent work! You have a strong understanding of the material. Consider advancing to the next section.'
            : percentage >= 60
              ? 'Good effort! You have a solid grasp of the material. Review the questions you got wrong to strengthen your knowledge.'
              : 'Keep practicing! Review the material and try the quiz again to improve your score.'}
        </p>
      </CardLg>

      {/* Answer Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Answer Review</h2>

        {parsedAnswers.map((answer: any, index: number) => (
          <Card
            key={index}
            className={`p-5 border-l-4 ${
              answer.is_correct ? 'border-l-success' : 'border-l-danger'
            } bg-bg-surface`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-text-primary">
                Question {index + 1}
              </h3>
              <Badge
                variant={answer.is_correct ? 'success' : 'danger'}
                className="gap-1 flex items-center"
              >
                {answer.is_correct ? (
                  <>
                    <Check size={14} />
                    Correct
                  </>
                ) : (
                  <>
                    <X size={14} />
                    Incorrect
                  </>
                )}
              </Badge>
            </div>

            {/* Show answers info if available */}
            {answer.user_answer !== undefined && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-secondary">Your answer: </span>
                  <span className="text-text-primary font-medium">
                    Option {answer.user_answer + 1}
                  </span>
                </div>
                {!answer.is_correct && (
                  <div>
                    <span className="text-text-secondary">Correct answer: </span>
                    <span className="text-success font-medium">
                      Option {answer.correct_answer + 1}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() =>
            router.push(`/squad/${squadId}/courses/${courseId}/quizzes`)
          }
        >
          Back to Quizzes
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => window.location.reload()}
        >
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
