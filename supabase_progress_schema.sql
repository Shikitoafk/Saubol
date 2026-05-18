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
ALTER TABLE sat_diagnostic ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Safety checks to drop existing policies if they already exist before creating
DROP POLICY IF EXISTS "Users own data" ON ielts_progress;
DROP POLICY IF EXISTS "Users own data" ON ielts_sessions;
DROP POLICY IF EXISTS "Users own data" ON sat_progress;
DROP POLICY IF EXISTS "Users own data" ON sat_diagnostic;
DROP POLICY IF EXISTS "Users own data" ON user_streaks;

CREATE POLICY "Users own data" ON ielts_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON ielts_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON sat_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON sat_diagnostic FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON user_streaks FOR ALL USING (auth.uid() = user_id);
