import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

async function generateQuizWithClaude(
  courseTitle: string,
  itemTitle: string
): Promise<QuizQuestion[]> {
  const prompt = `You are an expert educational assessment designer. Generate a multiple-choice quiz with 5 questions based on the following course material:

Course: ${courseTitle}
Video/Item: ${itemTitle}

For each question, provide:
1. A clear, well-worded question
2. Four answer options (A, B, C, D)
3. The correct answer (as a number 0-3)
4. A brief explanation of the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Why this answer is correct..."
  }
]

Generate exactly 5 questions. Make them challenging but fair, testing comprehension and application.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
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

  try {
    const questions = JSON.parse(content.text);
    return questions;
  } catch (err) {
    console.error('Failed to parse Claude response:', content.text);
    throw new Error('Failed to parse quiz from AI response');
  }
}

export async function POST(
  request: Request,
  { params: _params }: { params: { id: string; courseId: string } }
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

    const body = await request.json();
    const { item_id: itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id is required' },
        { status: 400 }
      );
    }

    // Get course item details
    const { data: item } = await supabase
      .from('course_items')
      .select('*, courses(title)')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json(
        { error: 'Course item not found' },
        { status: 404 }
      );
    }

    // Check if quiz already exists for this item
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('item_id', itemId)
      .single();

    if (existingQuiz) {
      return NextResponse.json(
        {
          data: {
            id: existingQuiz.id,
            message: 'Quiz already exists for this item',
          },
        },
        { status: 200 }
      );
    }

    // Generate quiz using Claude
    const courseTitle = (item.courses as { title?: string } | null)?.title || 'Course';
    const questions = await generateQuizWithClaude(
      courseTitle,
      item.title
    );

    // Create quiz in database with total_questions
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        item_id: itemId,
        title: `Quiz: ${item.title}`,
        description: 'Auto-generated quiz powered by AI',
        generated_by_ai: true,
        total_questions: questions.length,
        created_by: user.id,
      })
      .select()
      .single();

    if (quizError) {
      console.error('Quiz creation error:', quizError);
      return NextResponse.json(
        { error: 'Failed to create quiz' },
        { status: 500 }
      );
    }

    // Insert questions
    const questionRecords = questions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      options: q.options,
      correct_answer_index: q.correct_answer,
      explanation: q.explanation,
      position: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionRecords);

    if (questionsError) {
      console.error('Questions insertion error:', questionsError);
      return NextResponse.json(
        { error: 'Failed to add questions to quiz' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          ...quiz,
          questions_count: questions.length,
          message: 'Quiz created successfully! 🎉',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Quiz generation error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Failed to generate quiz questions' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
