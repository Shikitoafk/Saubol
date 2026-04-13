-- Create user_progress table
create table if not exists user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  question_id text,
  section text,
  category text,
  difficulty text,
  correct boolean,
  answered_at timestamptz default now()
);

-- Create saved_programs table
create table if not exists saved_programs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  program_name text,
  program_url text,
  saved_at timestamptz default now()
);

-- Enable RLS on both tables
alter table user_progress enable row level security;
alter table saved_programs enable row level security;

-- Drop existing policies if they exist
drop policy if exists "users own progress" on user_progress;
drop policy if exists "Users can only see own progress" on user_progress;
drop policy if exists "users own saved programs" on saved_programs;
drop policy if exists "Users can only see own saved programs" on saved_programs;

-- Create RLS policies
create policy "users own progress" on user_progress for all using (auth.uid() = user_id);
create policy "users own saved programs" on saved_programs for all using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_user_progress_user_id on user_progress(user_id);
create index if not exists idx_user_progress_answered_at on user_progress(answered_at);
create index if not exists idx_saved_programs_user_id on saved_programs(user_id);
