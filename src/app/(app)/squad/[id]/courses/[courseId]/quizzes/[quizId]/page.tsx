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
  ChevronRight,
  Check,
  X,
  Brain,
  Loader,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];

interface Question extends QuizQuestion {
  user_answer?: number;
  is_correct?: boolean;
}

type State = 'loading' | 'answering' | 'review' | 'complete';

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;
  const quizId = params.quizId as string;

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!user || !quizId) return;

    async function loadQuiz() {
      try {
        // Get quiz
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizData) {
          setQuiz(quizData);
        }

        // Get questions
        const { data: questionsData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position', { ascending: true });

        if (questionsData) {
          setQuestions(questionsData);
          setState('answering');
        }
      } catch (err) {
        console.error('Failed to load quiz:', err);
        addNotification('Failed to load quiz', 'error');
      }
    }

    loadQuiz();
  }, [user, quizId, supabase, addNotification]);

  function handleSelectAnswer(optionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[currentIndex].user_answer = optionIndex;
    setQuestions(newQuestions);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);

    try {
      // Calculate score
      let correctCount = 0;
      const questionsWithGrade = questions.map((q) => {
        const isCorrect = q.user_answer === q.correct_answer_index;
        if (isCorrect) correctCount++;
        return { ...q, is_correct: isCorrect };
      });

      setQuestions(questionsWithGrade);
      setScore(correctCount);

      // Save attempt to database
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          score: correctCount,
          total_questions: questions.length,
          answers: questions.map((q, i) => ({
            question_id: q.id,
            user_answer: q.user_answer,
            correct_answer: q.correct_answer_index,
            is_correct: questionsWithGrade[i].is_correct,
          })),
        })
        .select()
        .single();

      if (attemptError) {
        addNotification('Failed to save quiz attempt', 'error');
        return;
      }

      setState('complete');
      addNotification(
        `Quiz completed! You scored ${correctCount}/${questions.length} 🎉`,
        'success'
      );
    } catch (err) {
      addNotification('Failed to submit quiz', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">Quiz not found</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Complete state
  if (state === 'complete') {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-base to-bg-surface flex items-center justify-center px-4">
        <CardLg className="max-w-md w-full text-center">
          <div className="mb-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                percentage >= 70
                  ? 'bg-success/10'
                  : percentage >= 50
                    ? 'bg-warning/10'
                    : 'bg-danger/10'
              }`}
            >
              <span
                className={`text-3xl font-bold ${
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
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {percentage >= 70
              ? 'Great Job! 🎉'
              : percentage >= 50
                ? 'Good Effort!'
                : 'Keep Practicing!'}
          </h1>

          <p className="text-lg text-text-secondary mb-6">
            You scored{' '}
            <span className="font-bold text-brand">
              {score}/{questions.length}
            </span>
          </p>

          <div className="space-y-2 mb-8">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Review Answers
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                router.push(`/squad/${squadId}/courses/${courseId}/quizzes`)
              }
            >
              Back to Quizzes
            </Button>
          </div>
        </CardLg>
      </div>
    );
  }

  // Answering state
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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

        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 gap-2 flex items-center">
          <Brain size={28} className="text-brand" />
          {quiz.title}
        </h1>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-text-secondary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <CardLg className="mb-8">
        {/* Question Text */}
        <h2 className="text-xl font-bold text-text-primary mb-6">
          {currentQuestion.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                currentQuestion.user_answer === index
                  ? 'border-brand bg-brand/10'
                  : 'border-border hover:border-text-tertiary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    currentQuestion.user_answer === index
                      ? 'border-brand bg-brand'
                      : 'border-text-tertiary'
                  }`}
                >
                  {currentQuestion.user_answer === index && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={
                    currentQuestion.user_answer === index
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary'
                  }
                >
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft size={18} />
            Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={submitting}
              className="gap-2"
            >
              <Check size={18} />
              Submit Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              className="gap-2"
            >
              Next
              <ChevronRight size={18} />
            </Button>
          )}
        </div>
      </CardLg>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 items-center justify-center">
        <p className="text-sm text-text-secondary mr-2">Go to:</p>
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-all ${
              index === currentIndex
                ? 'bg-brand text-white'
                : q.user_answer !== undefined
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-bg-surface text-text-secondary hover:bg-border'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
