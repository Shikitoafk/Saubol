import { supabase } from "@/lib/supabase";
import { SAT_TABLES } from "@/lib/sat-tables";

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
  rawCorrectAnswer?: string;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Приводит значение image_url к ссылке, которую поймёт браузер.
 *
 * Парсер кладёт в CSV путь вида `math_mcq/December_2023_..._p04_q11.png` —
 * это путь внутри папки со скринами, а не URL. Браузер такой путь
 * открыть не может, поэтому картинки не показывались. Полные ссылки
 * (например из Supabase Storage) пропускаем как есть.
 *
 * База задаётся через VITE_SAT_IMAGE_BASE; по умолчанию `/sat-images/`,
 * то есть достаточно положить папку со скринами в `public/sat-images/`.
 */
const IMAGE_BASE = (import.meta.env.VITE_SAT_IMAGE_BASE?.trim() || "/sat-images/").replace(/\/+$/, "") + "/";

export function resolveImageUrl(raw: unknown): string | undefined {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return IMAGE_BASE + value.replace(/^\/+/, "");
}

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
    imageUrl: resolveImageUrl(row.image_url),
    isFreeResponse: false,
    hasKaTeX: false,
    source: row.source ?? "",
    rawCorrectAnswer: row.correct_answer ?? "",
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
    imageUrl: resolveImageUrl(row.image_url),
    isFreeResponse: true,
    hasKaTeX: false,
    source: row.source ?? "",
    rawCorrectAnswer: row.correct_answer ?? "",
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
  let query = supabase.from(SAT_TABLES.ebrwMcq).select("*");

  if (options?.subtopic && options.subtopic !== "All") {
    query = query.eq("section", options.subtopic);
  }
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
 */
export async function fetchMathMCQQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
}): Promise<SATQuestion[]> {
  let query = supabase.from(SAT_TABLES.mathMcq).select("*");

  if (options?.subtopic && options.subtopic !== "All") {
    query = query.eq("topic", options.subtopic);
  }
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
  let query = supabase.from(SAT_TABLES.mathOpen).select("*");

  if (options?.subtopic && options.subtopic !== "All") {
    query = query.eq("topic", options.subtopic);
  }
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

/* ------------------------------------------------------------------ */
/*  Past Papers API                                                    */
/* ------------------------------------------------------------------ */

export interface PastPaper {
  test_period: string;
  test_version: string;
  totalQuestions: number;
  rwQuestions: number;
  mathQuestions: number;
}

/**
 * Прошедшие тесты = строки с заполненным `test_period`.
 *
 * Раньше отбор шёл по `.eq("source_type", "past_paper")`, но такой колонки
 * в таблицах нет: CSV из парсера её не создаёт. Postgres на фильтр по
 * несуществующей колонке отвечает ошибкой, ошибка глушилась — и загруженные
 * вопросы «не отображались». Период же проставляется у каждой строки.
 */
const PERIOD_COLUMNS = "test_period, test_version";

/**
 * Ограничение по времени на запрос к базе.
 *
 * Supabase-клиент своего таймаута не имеет: если до базы не достучаться,
 * промис висит бесконечно, и страница навсегда остаётся на «Scanning
 * database...». Лучше показать причину, чем крутить спиннер.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 15000, label = "Запрос к базе"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: нет ответа за ${ms / 1000} с`)), ms)
    ),
  ]);
}

export async function fetchAvailablePastPapers(): Promise<PastPaper[]> {
  try {
    const [rwRes, mathRes, openRes] = await Promise.all([
      supabase.from(SAT_TABLES.ebrwMcq).select(PERIOD_COLUMNS).not("test_period", "is", null),
      supabase.from(SAT_TABLES.mathMcq).select(PERIOD_COLUMNS).not("test_period", "is", null),
      supabase.from(SAT_TABLES.mathOpen).select(PERIOD_COLUMNS).not("test_period", "is", null),
    ]);

    const failed = [rwRes, mathRes, openRes].find((r) => r.error);
    if (failed?.error) {
      throw new Error(failed.error.message);
    }

    const papersMap: Record<string, { test_period: string; test_version: string; rwCount: number; mathCount: number }> = {};

    const processRows = (rows: any[] | null, type: "rw" | "math") => {
      rows?.forEach(r => {
        const period = r.test_period?.trim();
        if (!period) return;
        const version = r.test_version?.trim() || "";
        const key = `${period}|||${version}`;
        if (!papersMap[key]) {
          papersMap[key] = { test_period: period, test_version: version, rwCount: 0, mathCount: 0 };
        }
        if (type === "rw") {
          papersMap[key].rwCount++;
        } else {
          papersMap[key].mathCount++;
        }
      });
    };

    processRows(rwRes.data, "rw");
    processRows(mathRes.data, "math");
    processRows(openRes.data, "math");

    return Object.values(papersMap).map(p => ({
      test_period: p.test_period,
      test_version: p.test_version,
      totalQuestions: p.rwCount + p.mathCount,
      rwQuestions: p.rwCount,
      mathQuestions: p.mathCount,
    }));
  } catch (e: any) {
    // Раньше ошибка глушилась и возвращался пустой список — снаружи это
    // выглядело как «тестов нет», хотя на деле запрос не проходил. Пусть
    // страница покажет причину.
    console.error("fetchAvailablePastPapers error:", e);
    throw new Error(e?.message || "Не удалось загрузить список тестов");
  }
}

export async function fetchPastPaperQuestions(
  test_period: string,
  test_version?: string
): Promise<SATQuestion[]> {
  let rwQuery = supabase.from(SAT_TABLES.ebrwMcq).select("*").eq("test_period", test_period);
  let mathMcqQuery = supabase.from(SAT_TABLES.mathMcq).select("*").eq("test_period", test_period);
  let mathOpenQuery = supabase.from(SAT_TABLES.mathOpen).select("*").eq("test_period", test_period);

  if (test_version) {
    rwQuery = rwQuery.eq("test_version", test_version);
    mathMcqQuery = mathMcqQuery.eq("test_version", test_version);
    mathOpenQuery = mathOpenQuery.eq("test_version", test_version);
  }

  rwQuery = rwQuery.order("id", { ascending: true });
  mathMcqQuery = mathMcqQuery.order("id", { ascending: true });
  mathOpenQuery = mathOpenQuery.order("id", { ascending: true });

  const [rwRes, mathMcqRes, mathOpenRes] = await Promise.all([
    rwQuery,
    mathMcqQuery,
    mathOpenQuery
  ]);

  if (rwRes.error) throw new Error(`EBRW_MCQ fetch failed: ${rwRes.error.message}`);
  if (mathMcqRes.error) throw new Error(`Math_MCQ fetch failed: ${mathMcqRes.error.message}`);
  if (mathOpenRes.error) throw new Error(`Math_Open fetch failed: ${mathOpenRes.error.message}`);

  const rwQuestions = (rwRes.data ?? []).map((r) => mapMCQRow(r, "ebrw"));
  const mathMcqQuestions = (mathMcqRes.data ?? []).map((r) => mapMCQRow(r, "math"));
  const mathOpenQuestions = (mathOpenRes.data ?? []).map(mapOpenRow);

  return [...rwQuestions, ...mathMcqQuestions, ...mathOpenQuestions];
}

