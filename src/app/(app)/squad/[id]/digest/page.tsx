'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRequireAuth } from '@/utils/hooks';
import {
  ChevronLeft,
  Lightbulb,
  TrendingUp,
  Target,
  Award,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

interface QuizStats {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  attemptCount: number;
  bestScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface DigestData {
  quizzes: QuizStats[];
  insights: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

export default function DigestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;

  const addNotification = useAppStore((s) => s.addNotification);

  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !squadId) return;

    async function loadDigest() {
      try {
        const response = await fetch(`/api/squads/${squadId}/digest`);
        const { data, error } = await response.json();

        if (error) {
          addNotification(error, 'error');
          return;
        }

        setDigest(data);
      } catch (err) {
        console.error('Failed to load digest:', err);
        addNotification('Failed to load digest', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadDigest();
  }, [user, squadId, addNotification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Generating your digest...</span>
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">Failed to load digest</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const overallScore =
    digest.quizzes.length > 0
      ? Math.round(
          digest.quizzes.reduce((sum, q) => sum + q.percentage, 0) /
            digest.quizzes.length
        )
      : 0;

  const periodStart = new Date(digest.periodStart);
  const periodEnd = new Date(digest.periodEnd);

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
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb size={32} className="text-brand" />
          <h1 className="text-3xl font-heading font-bold text-text-primary">
            Weekly Digest
          </h1>
        </div>
        <p className="text-text-secondary">
          {periodStart.toLocaleDateString()} -{' '}
          {periodEnd.toLocaleDateString()}
        </p>
      </div>

      {/* Overall Score Card */}
      {digest.quizzes.length > 0 && (
        <CardLg className="mb-8 bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">
                Overall Performance
              </h2>
              <p className="text-text-secondary">
                You took {digest.quizzes.length} quiz
                {digest.quizzes.length !== 1 ? 'zes' : ''} this week with{' '}
                {digest.quizzes.reduce((sum, q) => sum + q.attemptCount, 0)}{' '}
                total attempts
              </p>
            </div>
            <div
              className={`text-center ${
                overallScore >= 70 ? 'text-success' : 'text-warning'
              }`}
            >
              <div className="text-5xl font-bold">{overallScore}%</div>
              <div className="text-sm">Average Score</div>
            </div>
          </div>
        </CardLg>
      )}

      {/* AI Insights */}
      <CardLg className="mb-8">
        <div className="flex items-start gap-4">
          <Lightbulb size={24} className="text-brand flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-text-primary mb-3">AI Insights</h3>
            <div className="prose prose-sm text-text-secondary max-w-none">
              {digest.insights.split('\n').map((line, i) => (
                <p key={i} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardLg>

      {/* Quiz Summary */}
      {digest.quizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">
            Quiz Performance
          </h2>

          <div className="space-y-3">
            {digest.quizzes.map((quiz, index) => {
              const getTrendIcon = (trend: string) => {
                if (trend === 'improving')
                  return (
                    <TrendingUp size={16} className="text-success" />
                  );
                if (trend === 'declining')
                  return (
                    <AlertCircle size={16} className="text-danger" />
                  );
                return <Target size={16} className="text-text-tertiary" />;
              };

              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-primary mb-2">
                        {quiz.quizTitle}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                        <span>Score: {quiz.score}/{quiz.totalQuestions}</span>
                        <span>Attempts: {quiz.attemptCount}</span>
                        <span>Best: {quiz.bestScore}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getTrendIcon(quiz.trend)}
                      <div
                        className={`text-right ${
                          quiz.percentage >= 70
                            ? 'text-success'
                            : quiz.percentage >= 50
                              ? 'text-warning'
                              : 'text-danger'
                        }`}
                      >
                        <div className="text-2xl font-bold">
                          {quiz.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-2 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        quiz.percentage >= 70
                          ? 'bg-success'
                          : quiz.percentage >= 50
                            ? 'bg-warning'
                            : 'bg-danger'
                      }`}
                      style={{ width: `${quiz.percentage}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {digest.quizzes.length === 0 && (
        <Card className="p-12 text-center">
          <Award size={48} className="mx-auto mb-4 text-border" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            No quizzes yet
          </h3>
          <p className="text-text-secondary">
            Complete some quizzes this week to see your performance digest
          </p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-8">
        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
          Back to Squad
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => {
            window.location.reload();
          }}
        >
          Refresh Digest
        </Button>
      </div>
    </div>
  );
}
