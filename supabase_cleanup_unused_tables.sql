-- Saubol: remove only legacy tables that the current application does not use.
--
-- KEEP (do not delete):
-- ielts_progress, ielts_sessions, programs, sat_diagnostic,
-- sat_ebrw_mcq, sat_math_mcq, sat_math_open, sat_progress,
-- sat_question_attempts, sat_test_sessions, user_profiles, user_streaks,
-- and saved_programs (it may not be visible in the current sidebar).
--
-- This intentionally has NO CASCADE. If Postgres reports a dependency, stop
-- and inspect it instead of forcing deletion and breaking a feature.

BEGIN;

DROP TABLE IF EXISTS public.sat_diagnostics;
DROP VIEW IF EXISTS public.sat_questions;
DROP TABLE IF EXISTS public.study_plans;
DROP TABLE IF EXISTS public.topic_performance;
DROP TABLE IF EXISTS public.user_progress;

COMMIT;
