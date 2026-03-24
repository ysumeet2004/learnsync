-- Update quizzes table schema to support AI-generated quizzes
-- Rename the existing quizzes table and create a new one with correct structure

-- First, create the new quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.course_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  generated_by_ai boolean DEFAULT false,
  is_required boolean DEFAULT false,
  total_questions integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read quizzes" ON public.quizzes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses 
        WHERE id IN (
          SELECT course_id FROM public.course_items 
          WHERE id = quizzes.item_id
        )
      )
    )
  );

CREATE POLICY "Squad leads can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses 
        WHERE id IN (
          SELECT course_id FROM public.course_items 
          WHERE id = item_id
        )
      ) AND role IN ('lead', 'instructor')
    )
  );

-- Create quiz_questions table for individual questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer_index integer NOT NULL,
  explanation text,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read quiz questions" ON public.quiz_questions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses 
        WHERE id IN (
          SELECT course_id FROM public.course_items 
          WHERE id IN (
            SELECT item_id FROM public.quizzes WHERE id = quiz_questions.quiz_id
          )
        )
      )
    )
  );

-- Update quiz_attempts table to track per-quiz attempts
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers jsonb;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT now();
ALTER TABLE public.quiz_attempts DROP COLUMN IF EXISTS selected_option;
ALTER TABLE public.quiz_attempts DROP COLUMN IF EXISTS is_correct;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_item_id ON public.quizzes(item_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_position ON public.quiz_questions(position);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON public.quiz_attempts(completed_at);
