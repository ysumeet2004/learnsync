-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  plan text DEFAULT 'free' CHECK (plan IN ('free','pro','squad','teams')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Squads table
CREATE TABLE IF NOT EXISTS public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE DEFAULT substr(md5(random()::text), 0, 9),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  plan text DEFAULT 'free' CHECK (plan IN ('free','pro','squad','teams')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read squads they are a member of" ON public.squads
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members WHERE squad_id = id
    )
  );

CREATE POLICY "Squad owners can update their squads" ON public.squads
  FOR UPDATE USING (auth.uid() = owner_id);

-- Squad members table
CREATE TABLE IF NOT EXISTS public.squad_members (
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'learner' CHECK (role IN ('learner','lead','instructor')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (squad_id, user_id)
);

ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read squad memberships" ON public.squad_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members WHERE squad_id = squad_id
    )
  );

CREATE POLICY "Squad leads can manage members" ON public.squad_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id = squad_members.squad_id AND role IN ('lead', 'instructor')
    )
  );

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  title text NOT NULL,
  source text NOT NULL CHECK (source IN ('youtube','udemy','custom')),
  source_url text NOT NULL,
  playlist_id text,
  thumbnail_url text,
  total_items integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read courses" ON public.courses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members WHERE squad_id = courses.squad_id
    )
  );

CREATE POLICY "Squad leads can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id = squad_id AND role IN ('lead', 'instructor')
    )
  );

-- Course items table
CREATE TABLE IF NOT EXISTS public.course_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_id text NOT NULL,
  duration_seconds integer,
  position integer NOT NULL,
  thumbnail_url text,
  transcript text
);

ALTER TABLE public.course_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read course items" ON public.course_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses WHERE id = course_items.course_id
      )
    )
  );

-- Watch events table (time-series)
CREATE TABLE IF NOT EXISTS public.watch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  item_id uuid REFERENCES public.course_items(id),
  event_type text CHECK (event_type IN ('play','pause','seek','complete','heartbeat')),
  position_seconds float,
  percent_watched float,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.watch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own watch events" ON public.watch_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch events" ON public.watch_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress table (materialised)
CREATE TABLE IF NOT EXISTS public.progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.course_items(id) ON DELETE CASCADE,
  percent_watched float DEFAULT 0,
  is_complete boolean DEFAULT false,
  watch_time_seconds integer DEFAULT 0,
  last_watched_at timestamptz,
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Squad members can read progress of squad members" ON public.progress
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses 
        WHERE id IN (
          SELECT course_id FROM public.course_items 
          WHERE id = progress.item_id
        )
      )
    )
  );

CREATE POLICY "Users can update their own progress" ON public.progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.course_items(id) ON DELETE CASCADE,
  content text NOT NULL,
  video_timestamp_seconds float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Squad members can read notes on shared videos" ON public.notes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.courses 
        WHERE id IN (
          SELECT course_id FROM public.course_items 
          WHERE id = notes.item_id
        )
      )
    )
  );

CREATE POLICY "Users can create notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can read assignments" ON public.assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members WHERE squad_id = assignments.squad_id
    )
  );

CREATE POLICY "Squad leads can create assignments" ON public.assignments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id = squad_id AND role IN ('lead', 'instructor')
    )
  );

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  content text,
  file_url text,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read submissions for their assignments" ON public.submissions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT created_by FROM public.assignments 
      WHERE id = submissions.assignment_id
    )
  );

CREATE POLICY "Users can submit their own work" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.course_items(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
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

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  selected_option integer,
  is_correct boolean,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_courses_squad_id ON public.courses(squad_id);
CREATE INDEX IF NOT EXISTS idx_course_items_course_id ON public.course_items(course_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_user_id ON public.watch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_item_id ON public.watch_events(item_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_created_at ON public.watch_events(created_at);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_item_id ON public.progress(item_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_item_id ON public.notes(item_id);
CREATE INDEX IF NOT EXISTS idx_assignments_squad_id ON public.assignments(squad_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_item_id ON public.quizzes(item_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- Create function to auto-insert profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
