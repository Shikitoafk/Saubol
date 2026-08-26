-- IELTS Progress
CREATE TABLE IF NOT EXISTS ielts_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- 'listening' | 'reading' | 'writing' | 'speaking'
  subsection TEXT, -- e.g. 'map_completion', 'true_false', 'task1'
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_score DECIMAL(3,1), -- e.g. 7.5
  best_score DECIMAL(3,1),
  time_spent_minutes INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section, subsection)
);

-- IELTS Session History
CREATE TABLE IF NOT EXISTS ielts_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  subsection TEXT,
  score DECIMAL(3,1),
  answers JSONB DEFAULT '{}',
  time_spent_minutes INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAT Progress  
CREATE TABLE IF NOT EXISTS sat_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subtopic TEXT,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_percent INTEGER DEFAULT 0,
  current_difficulty TEXT DEFAULT 'easy',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic, subtopic)
);

-- One row per completed Past Paper attempt. Topic progress above is an
-- aggregate; this table powers the post-test report and the "completed" badge
-- that must remain after the learner returns to the papers list.
CREATE TABLE IF NOT EXISTS sat_test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_period TEXT NOT NULL,
  test_version TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('exam', 'practice')),
  module_key TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  questions_incorrect INTEGER NOT NULL DEFAULT 0,
  questions_skipped INTEGER NOT NULL DEFAULT 0,
  unscored_questions INTEGER NOT NULL DEFAULT 0,
  score_percent INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sat_test_sessions_user_completed_at_idx
  ON sat_test_sessions (user_id, completed_at DESC);

-- SAT Diagnostic Results
CREATE TABLE IF NOT EXISTS sat_diagnostic (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER,
  math_score INTEGER,
  rw_score INTEGER,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Streak
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (users only see their own data)
ALTER TABLE ielts_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_diagnostic ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Safety checks to drop existing policies if they already exist before creating
DROP POLICY IF EXISTS "Users own data" ON ielts_progress;
DROP POLICY IF EXISTS "Users own data" ON ielts_sessions;
DROP POLICY IF EXISTS "Users own data" ON sat_progress;
DROP POLICY IF EXISTS "Users own data" ON sat_test_sessions;
DROP POLICY IF EXISTS "Users own data" ON sat_diagnostic;
DROP POLICY IF EXISTS "Users own data" ON user_streaks;

CREATE POLICY "Users own data" ON ielts_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON ielts_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON sat_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON sat_test_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own data" ON sat_diagnostic FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON user_streaks FOR ALL USING (auth.uid() = user_id);

-- Answer events make the dashboard trustworthy: aggregates above are fast to
-- read, while this table retains the individual history needed for review.
CREATE TABLE IF NOT EXISTS sat_question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  is_correct BOOLEAN NOT NULL,
  selected_answer TEXT,
  source TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sat_question_attempts_user_answered_at_idx
  ON sat_question_attempts (user_id, answered_at DESC);

ALTER TABLE sat_question_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own SAT attempts" ON sat_question_attempts;
CREATE POLICY "Users own SAT attempts" ON sat_question_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- This keeps progress updates atomic when a learner answers quickly in more
-- than one tab. The browser falls back gracefully while this migration has not
-- yet been applied.
CREATE OR REPLACE FUNCTION public.record_sat_answer(
  p_topic TEXT,
  p_subtopic TEXT,
  p_is_correct BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO sat_progress (
    user_id, topic, subtopic, questions_attempted, questions_correct,
    mastery_percent, current_difficulty, updated_at
  ) VALUES (
    auth.uid(), p_topic, p_subtopic, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 100 ELSE 0 END, 'easy', NOW()
  )
  ON CONFLICT (user_id, topic, subtopic) DO UPDATE SET
    questions_attempted = sat_progress.questions_attempted + 1,
    questions_correct = sat_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    mastery_percent = ROUND(
      ((sat_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::numeric /
        (sat_progress.questions_attempted + 1)) * 100
    ),
    current_difficulty = CASE
      WHEN ROUND(((sat_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::numeric /
        (sat_progress.questions_attempted + 1)) * 100) >= 80
        AND sat_progress.current_difficulty = 'easy' THEN 'medium'
      WHEN ROUND(((sat_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::numeric /
        (sat_progress.questions_attempted + 1)) * 100) >= 80
        AND sat_progress.current_difficulty = 'medium' THEN 'hard'
      ELSE sat_progress.current_difficulty
    END,
    updated_at = NOW();
END;
$$;

-- Public-facing names are stored separately from Auth. The leaderboard RPC
-- exposes only these names and aggregate SAT data, never emails or IDs.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(NEW.email, '@', 1), 'Student')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Make profiles for existing users when this script is run after launch.
INSERT INTO public.user_profiles (id, display_name)
SELECT id, COALESCE(NULLIF(TRIM(raw_user_meta_data->>'full_name'), ''), SPLIT_PART(email, '@', 1), 'Student')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_sat_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  questions_attempted BIGINT,
  questions_correct BIGINT,
  accuracy INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH totals AS (
    SELECT user_id, SUM(questions_attempted)::BIGINT AS attempted, SUM(questions_correct)::BIGINT AS correct
    FROM public.sat_progress
    GROUP BY user_id
    HAVING SUM(questions_attempted) > 0
  ), ranked AS (
    SELECT
      RANK() OVER (ORDER BY correct DESC, attempted DESC, user_id) AS position,
      COALESCE(profile.display_name, 'Student') AS name,
      attempted,
      correct,
      ROUND((correct::NUMERIC / attempted) * 100)::INTEGER AS accuracy_value,
      totals.user_id = auth.uid() AS is_current
    FROM totals
    LEFT JOIN public.user_profiles profile ON profile.id = totals.user_id
  )
  SELECT position, name, attempted, correct, accuracy_value, is_current
  FROM ranked
  WHERE position <= GREATEST(1, LEAST(p_limit, 100)) OR is_current
  ORDER BY position;
$$;

REVOKE ALL ON FUNCTION public.get_sat_leaderboard(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sat_leaderboard(INTEGER) TO authenticated;
