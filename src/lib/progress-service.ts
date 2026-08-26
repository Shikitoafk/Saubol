import { supabase } from './supabase'

export interface SATTestSessionInput {
  testPeriod: string
  testVersion?: string | null
  mode: 'exam' | 'practice'
  moduleKey?: string | null
  totalQuestions: number
  questionsCorrect: number
  questionsIncorrect: number
  questionsSkipped: number
  unscoredQuestions: number
  scorePercent: number
  timeSpentSeconds: number
  answers: Record<string, unknown>
}

export interface SATTestSessionSummary {
  id: string
  test_period: string
  test_version: string | null
  mode: 'exam' | 'practice'
  score_percent: number
  questions_correct: number
  total_questions: number
  completed_at: string
}

/** Save one completed past-paper attempt. Unlike topic progress, this keeps a
 * complete, reviewable test result for the learner's history. */
export async function saveSATTestSession(input: SATTestSessionInput): Promise<SATTestSessionSummary | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('sat_test_sessions')
      .insert({
        user_id: user.id,
        test_period: input.testPeriod,
        test_version: input.testVersion || null,
        mode: input.mode,
        module_key: input.moduleKey || null,
        total_questions: input.totalQuestions,
        questions_correct: input.questionsCorrect,
        questions_incorrect: input.questionsIncorrect,
        questions_skipped: input.questionsSkipped,
        unscored_questions: input.unscoredQuestions,
        score_percent: input.scorePercent,
        time_spent_seconds: input.timeSpentSeconds,
        answers: input.answers,
      })
      .select('id, test_period, test_version, mode, score_percent, questions_correct, total_questions, completed_at')
      .single()

    if (error) {
      console.error('Failed to save SAT test session:', error.message)
      return null
    }
    return data as SATTestSessionSummary
  } catch (err) {
    console.error('Failed to save SAT test session:', err)
    return null
  }
}

export async function loadSATTestSessions(): Promise<SATTestSessionSummary[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('sat_test_sessions')
      .select('id, test_period, test_version, mode, score_percent, questions_correct, total_questions, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(100)

    if (error) {
      // The table is introduced by the current schema migration. Old projects
      // still work; they simply won't show history until it is applied.
      if (!/sat_test_sessions/i.test(error.message)) console.error('Failed to load SAT test sessions:', error.message)
      return []
    }
    return (data || []) as SATTestSessionSummary[]
  } catch (err) {
    console.error('Failed to load SAT test sessions:', err)
    return []
  }
}

// Save after EVERY answered question - call this immediately on answer
export async function saveIELTSAnswer(
  section: string,
  subsection: string, 
  isCorrect: boolean,
  score?: number,
  questionsAttempted: number = 1,
  questionsCorrect: number = isCorrect ? 1 : 0,
  timeSpentMinutes?: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: existing, error } = await supabase
      .from('ielts_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('section', section)
      .eq('subsection', subsection)
      .maybeSingle()

    if (error) {
      console.error('Error fetching existing IELTS progress:', error)
    }

    const newAttempted = (existing?.questions_attempted || 0) + questionsAttempted
    const newCorrect = (existing?.questions_correct || 0) + questionsCorrect
    const newBestScore = score 
      ? Math.max(score, existing?.best_score || 0)
      : existing?.best_score
    const newTimeSpent = (existing?.time_spent_minutes || 0) + (timeSpentMinutes || 0)

    const { error: upsertError } = await supabase
      .from('ielts_progress')
      .upsert({
        user_id: user.id,
        section,
        subsection,
        questions_attempted: newAttempted,
        questions_correct: newCorrect,
        last_score: score || existing?.last_score,
        best_score: newBestScore,
        time_spent_minutes: newTimeSpent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,section,subsection' })

    if (upsertError) {
      console.error('Error upserting IELTS progress:', upsertError)
      return false
    }

    // Also save this attempt to session history (ielts_sessions)
    const { error: sessionError } = await supabase
      .from('ielts_sessions')
      .insert({
        user_id: user.id,
        section,
        subsection,
        score: score || 0,
        time_spent_minutes: timeSpentMinutes || 0,
        completed_at: new Date().toISOString()
      })

    if (sessionError) {
      console.error('Error inserting IELTS session:', sessionError)
      return false
    }
    return true
  } catch (err) {
    console.error('Failed to save IELTS answer:', err)
    return false
  }
}

// Save after EVERY SAT question answered
export async function saveSATAnswer(
  topic: string,
  subtopic: string,
  isCorrect: boolean,
  details?: { questionId?: string; selectedAnswer?: string; source?: string }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error: rpcError } = await supabase.rpc('record_sat_answer', {
      p_topic: topic,
      p_subtopic: subtopic,
      p_is_correct: isCorrect,
    })

    // New deployments use an atomic database function. Keep the old path as a
    // compatibility fallback until the SQL migration is applied.
    if (!rpcError) {
      if (details?.questionId) {
        const { error: attemptError } = await supabase.from('sat_question_attempts').insert({
          user_id: user.id,
          question_id: details.questionId,
          topic,
          subtopic,
          is_correct: isCorrect,
          selected_answer: details.selectedAnswer ?? null,
          source: details.source ?? null,
        })
        if (attemptError) console.warn('SAT answer history was not saved:', attemptError.message)
      }
      return
    }

    if (!/record_sat_answer|function/i.test(rpcError.message)) {
      console.error('Error saving SAT progress:', rpcError.message)
      return
    }

    const { data: existing, error } = await supabase
      .from('sat_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', topic)
      .eq('subtopic', subtopic)
      .maybeSingle()

    if (error) {
      console.error('Error fetching existing SAT progress:', error)
    }

    const newAttempted = (existing?.questions_attempted || 0) + 1
    const newCorrect = (existing?.questions_correct || 0) + (isCorrect ? 1 : 0)
    const mastery = Math.round((newCorrect / newAttempted) * 100)
    
    // Auto-advance difficulty
    let difficulty = existing?.current_difficulty || 'easy'
    if (mastery >= 80 && difficulty === 'easy') difficulty = 'medium'
    else if (mastery >= 80 && difficulty === 'medium') difficulty = 'hard'

    const { error: upsertError } = await supabase
      .from('sat_progress')
      .upsert({
        user_id: user.id,
        topic,
        subtopic,
        questions_attempted: newAttempted,
        questions_correct: newCorrect,
        mastery_percent: mastery,
        current_difficulty: difficulty,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic,subtopic' })

    if (upsertError) {
      console.error('Error upserting SAT progress:', upsertError)
    }
  } catch (err) {
    console.error('Failed to save SAT answer:', err)
  }
}

// Load all progress on app start
export async function loadAllProgress() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [ielts, sat, diagnostic, streak] = await Promise.all([
      supabase.from('ielts_progress').select('*').eq('user_id', user.id),
      supabase.from('sat_progress').select('*').eq('user_id', user.id),
      supabase.from('sat_diagnostic').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(1),
      supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle()
    ])

    return {
      ielts: ielts.data || [],
      sat: sat.data || [],
      diagnostic: diagnostic.data?.[0] || null,
      streak: streak.data || null
    }
  } catch (err) {
    console.error('Failed to load all progress:', err)
    return null
  }
}

// Update streak daily
export async function updateStreak() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    
    const { data: existing, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user streak:', error)
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('user_streaks').insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today
      })
      if (insertError) {
        console.error('Error creating user streak:', insertError)
      }
      return
    }

    const lastActive = existing.last_active_date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastActive === today) return // already counted today
    
    const newStreak = lastActive === yesterdayStr 
      ? existing.current_streak + 1  // continued streak
      : 1  // streak broken, restart

    const { error: upsertError } = await supabase.from('user_streaks').upsert({
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, existing.longest_streak),
      last_active_date: today,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error updating user streak:', upsertError)
    }
  } catch (err) {
    console.error('Failed to update streak:', err)
  }
}
