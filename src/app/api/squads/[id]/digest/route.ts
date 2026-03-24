import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface QuizStats {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  attemptCount: number;
  bestScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

async function generateInsightsWithClaude(
  userName: string,
  stats: QuizStats[]
): Promise<string> {
  const prompt = `You are an educational coach analyzing a learner's quiz performance. Generate personalized, encouraging insights based on this data:

Learner: ${userName}
${stats
  .map(
    (s) => `
- ${s.quizTitle} 
  Current Score: ${s.percentage}% (${s.score}/${s.totalQuestions})
  Best Score: ${s.bestScore}%
  Attempts: ${s.attemptCount}
  Trend: ${s.trend}
`
  )
  .join('')}

Provide insights on:
1. **Strengths** - What areas is the learner doing well in?
2. **Growth Areas** - What needs improvement?
3. **Next Steps** - 2-3 specific recommendations for improvement
4. **Motivation** - An encouraging message acknowledging their effort

Keep it concise (150-200 words), friendly, and actionable. Use markdown formatting.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const squadId = params.id;

    // Verify user is in squad
    const { data: member } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Get all quizzes for courses in this squad
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('squad_id', squadId);

    if (!courses || courses.length === 0) {
      return NextResponse.json(
        {
          data: {
            quizzes: [],
            insights: 'No courses found in this squad.',
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    const courseIds = courses.map((c) => c.id);

    // Get all course items
    const { data: items } = await supabase
      .from('course_items')
      .select('id')
      .in('course_id', courseIds);

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          data: {
            quizzes: [],
            insights: 'No course items found.',
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    const itemIds = items.map((i) => i.id);

    // Get all quizzes
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title')
      .in('item_id', itemIds);

    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json(
        {
          data: {
            quizzes: [],
            insights: 'No quizzes found in this squad.',
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    const quizIds = quizzes.map((q) => q.id);

    // Get user's quiz attempts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .in('quiz_id', quizIds)
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Aggregate stats by quiz
    const statsMap = new Map<string, QuizStats>();

    if (attempts && attempts.length > 0) {
      for (const attempt of attempts) {
        const quiz = quizzes.find((q) => q.id === attempt.quiz_id);
        if (!quiz) continue;

        const key = quiz.id;
        const percentage = Math.round(
          (attempt.score / attempt.total_questions) * 100
        );

        if (!statsMap.has(key)) {
          statsMap.set(key, {
            quizTitle: quiz.title,
            score: attempt.score,
            totalQuestions: attempt.total_questions,
            percentage,
            attemptCount: 1,
            bestScore: percentage,
            trend: 'stable',
          });
        } else {
          const stats = statsMap.get(key)!;
          stats.attemptCount += 1;
          stats.bestScore = Math.max(stats.bestScore, percentage);

          // Simple trend: compare last attempt to best
          if (percentage > stats.bestScore * 0.9) {
            stats.trend = 'improving';
          } else if (percentage < stats.percentage * 0.85) {
            stats.trend = 'declining';
          }

          stats.score = attempt.score;
          stats.percentage = percentage;
        }
      }
    }

    const stats = Array.from(statsMap.values());

    // Generate insights using Claude
    let insights = 'No quiz attempts in the past week yet. Keep practicing!';
    if (stats.length > 0) {
      insights = await generateInsightsWithClaude(
        profile?.display_name || 'Learner',
        stats
      );
    }

    return NextResponse.json(
      {
        data: {
          quizzes: stats,
          insights,
          generatedAt: new Date().toISOString(),
          periodStart: sevenDaysAgo.toISOString(),
          periodEnd: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Digest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
