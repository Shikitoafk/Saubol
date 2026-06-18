import { supabase } from "@/lib/supabase";

/**
 * SAT Questions Service — Supabase
 *
 * Fetches questions from three Supabase tables:
 *   EBRW_MCQ   → Reading & Writing (MCQ)
 *   Math_MCQ   → Math (MCQ)
 *   Math_Open  → Math (free-response / open)
 */

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface SATQuestion {
  id: string;
  question: string;
  passage?: string;
  options: string[];
  correctAnswer: number; // 0-3 index for MCQ, -1 for free-response
  correctAnswerText?: string; // raw text for free-response questions
  explanation: string;
  difficulty: string;
  topic?: string;
  section?: string;
  category?: string;
  imageUrl?: string;
  isFreeResponse: boolean;
  hasKaTeX?: boolean;
  wrongExplanations?: string[];
  source?: string;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Map "A"|"B"|"C"|"D" → 0|1|2|3 */
function letterToIndex(letter: string): number {
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter?.trim().toUpperCase()] ?? 0;
}

/** Map a raw EBRW_MCQ / Math_MCQ row to the UI shape */
function mapMCQRow(row: any, tablePrefix: string): SATQuestion {
  return {
    id: `${tablePrefix}-${row.id}`,
    question: row.question ?? "",
    passage: row.passage || undefined,
    options: [
      row.option_a ?? "",
      row.option_b ?? "",
      row.option_c ?? "",
      row.option_d ?? "",
    ],
    correctAnswer: letterToIndex(row.correct_answer),
    explanation: row.explanation ?? "",
    difficulty: row.difficulty ?? "Medium",
    // EBRW_MCQ has `section`, Math_MCQ has `topic`
    topic: row.topic ?? row.section ?? "",
    section: tablePrefix === "ebrw" ? "RW" : "Math",
    category: row.section ?? row.topic ?? "",
    imageUrl: row.image_url || undefined,
    isFreeResponse: false,
    hasKaTeX: false,
    source: row.source ?? "",
  };
}

/** Map a raw Math_Open row to the UI shape */
function mapOpenRow(row: any): SATQuestion {
  return {
    id: `open-${row.id}`,
    question: row.question ?? "",
    passage: row.passage || undefined,
    options: [],
    correctAnswer: -1,
    correctAnswerText: (row.correct_answer ?? "").toString().trim(),
    explanation: row.explanation ?? "",
    difficulty: row.difficulty ?? "Medium",
    topic: row.topic ?? "",
    section: "Math",
    category: row.topic ?? "",
    imageUrl: row.image_url || undefined,
    isFreeResponse: true,
    hasKaTeX: false,
    source: row.source ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch Reading & Writing MCQ questions from `EBRW_MCQ`.
 *
 * TODO: Once real `section` column values are known, add mapping from
 * UI subtopic IDs (e.g. "cross_text_connections", "transitions") to
 * the actual column values stored in Supabase.
 */
export async function fetchRWQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
}): Promise<SATQuestion[]> {
  let query = supabase.from("EBRW_MCQ").select("*");

  // TODO: Map UI subtopic IDs to real `section` column values in Supabase.
  // Example:  if (options?.subtopic) query = query.eq("section", mapSubtopicToSection(options.subtopic));
  if (options?.difficulty && options.difficulty !== "All") {
    query = query.eq("difficulty", options.difficulty);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`EBRW_MCQ fetch failed: ${error.message}`);
  return (data ?? []).map((r) => mapMCQRow(r, "ebrw"));
}

/**
 * Fetch Math MCQ questions from `Math_MCQ`.
 *
 * TODO: Once real `topic` column values are known, add mapping from
 * UI subtopic IDs (e.g. "linear_eq_1var", "quadratic") to
 * the actual column values stored in Supabase.
 */
export async function fetchMathMCQQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
}): Promise<SATQuestion[]> {
  let query = supabase.from("Math_MCQ").select("*");

  // TODO: Map UI subtopic IDs to real `topic` column values in Supabase.
  // Example:  if (options?.subtopic) query = query.eq("topic", mapSubtopicToTopic(options.subtopic));
  if (options?.difficulty && options.difficulty !== "All") {
    query = query.eq("difficulty", options.difficulty);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Math_MCQ fetch failed: ${error.message}`);
  return (data ?? []).map((r) => mapMCQRow(r, "math"));
}

/**
 * Fetch Math open-response questions from `Math_Open`.
 */
export async function fetchMathOpenQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
}): Promise<SATQuestion[]> {
  let query = supabase.from("Math_Open").select("*");

  // TODO: Map UI subtopic IDs to real `topic` column values in Supabase.
  if (options?.difficulty && options.difficulty !== "All") {
    query = query.eq("difficulty", options.difficulty);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Math_Open fetch failed: ${error.message}`);
  return (data ?? []).map(mapOpenRow);
}

/**
 * Fetch questions for a practice session by section.
 * Combines MCQ (+ Open for Math) into a single shuffled list.
 */
export async function fetchPracticeQuestions(
  section: "RW" | "Math",
  options?: { subtopic?: string; difficulty?: string; limit?: number }
): Promise<SATQuestion[]> {
  const limit = options?.limit ?? 10;

  if (section === "RW") {
    return fetchRWQuestions({ ...options, limit });
  }

  // Math: fetch both MCQ and Open, then combine
  const [mcq, open] = await Promise.all([
    fetchMathMCQQuestions({ ...options, limit }),
    fetchMathOpenQuestions({ ...options, limit: Math.max(3, Math.floor(limit / 3)) }),
  ]);

  const combined = [...mcq, ...open];
  // Shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.slice(0, limit);
}

/**
 * Fetch a diagnostic set — random sample across ALL tables.
 */
export async function fetchDiagnosticQuestions(
  count: number = 20
): Promise<SATQuestion[]> {
  const perTable = Math.ceil(count / 3);

  const [rw, mathMcq, mathOpen] = await Promise.all([
    fetchRWQuestions({ limit: perTable }),
    fetchMathMCQQuestions({ limit: perTable }),
    fetchMathOpenQuestions({ limit: Math.max(3, Math.floor(perTable / 2)) }),
  ]);

  const all = [...rw, ...mathMcq, ...mathOpen];
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}
