import { supabase } from "@/lib/supabase";
import { SAT_TABLES } from "@/lib/sat-tables";
import { renderMathText } from "@/lib/render-math";

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
  /** The parser detected a visual that must be available to solve it. */
  requiresImage?: boolean;
  wrongExplanations?: string[];
  source?: string;
  rawCorrectAnswer?: string;
  /** «Module 1» / «Module 2» — как напечатано в тесте. */
  module?: string;
  /** Номер вопроса внутри модуля: в каждом модуле нумерация с единицы. */
  questionNumber?: number;
  /** Страница исходного PDF — по ней восстанавливается порядок в тесте. */
  page?: number;
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
 * База задаётся через VITE_SAT_IMAGE_BASE; по умолчанию `/sat_images/`,
 * то есть достаточно положить папки со скринами (ebrw, math_mcq,
 * math_open) в `public/sat_images/` — имена подпапок парсер проставляет
 * в CSV сам, менять их не нужно.
 */
const RAW_IMAGE_BASE = import.meta.env.VITE_SAT_IMAGE_BASE?.trim() || "/sat_images/";
const IMAGE_BASE = RAW_IMAGE_BASE.replace(/\/+$/, "") + "/";

export function resolveImageUrl(raw: unknown): string | undefined {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  // `/sat_images/...` is an explicit application asset path. Keep it local
  // even when a remote image base is configured: the reviewed SVGs for
  // tables, graphs, and diagrams ship in `public/sat_images`, whereas only
  // parser-relative paths are expected to live in external storage.
  if (value.startsWith("/")) {
    return value;
  }
  return IMAGE_BASE + value.replace(/^\/+/, "");
}

/**
 * Банк вопросов и прошедшие тесты лежат в одних таблицах и раньше ничем
 * не различались — из-за этого в «Question Bank» приходили ровно те же
 * вопросы, что и в «Past Papers». Признак простой: у вопроса из теста
 * заполнен test_period.
 */
function excludePastPapers<T>(query: T, exclude: boolean): T {
  if (!exclude) return query;
  return (query as any).is("test_period", null);
}

const MATH_TOPIC_ALIASES: Record<string, string[]> = {
  "Algebra": ["Algebra"],
  "Advanced Math": ["Advanced Math"],
  "Problem Solving and Data Analysis": [
    "Problem Solving and Data Analysis",
    "Problem-Solving and Data Analysis",
    "Statistics",
    "Statistics and Probability",
  ],
  "Geometry and Trigonometry": ["Geometry and Trigonometry", "Geometry"],
};

export const RW_DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
] as const;

/**
 * Early imported papers used one generic `Reading & Writing` topic.  Classify
 * them from the official question wording so the bank remains useful before
 * every legacy row receives a manual taxonomy pass.
 */
export function inferRWDomain(question: string): string {
  const text = question.toLowerCase();
  if (/(standard english|conventions|punctuation|sentence boundary|comma|semicolon|colon|verb tense|subject-verb|complete the text so that it conforms)/.test(text)) {
    return "Standard English Conventions";
  }
  // Craft and Structure includes Words in Context, text purpose/structure,
  // and cross-text connections. Older imports often called these generic
  // "Reading & Writing", so infer them from College Board-style wording.
  if (/(as used in the text|as used in this context|most nearly means?|word or phrase.*most nearly|which choice.*most nearly means?|function of the underlined|function of the sentence|main purpose|primary purpose|overall structure|text structure|relationship between the texts|both texts|the author of text [12]|how would the author)/.test(text)) {
    return "Craft and Structure";
  }
  if (/(student wants|most effectively uses|transition|most logically completes|best completes the text|notes.*which choice)/.test(text)) {
    return "Expression of Ideas";
  }
  return "Information and Ideas";
}

function filterMathTopic<T>(query: T, topic?: string): T {
  if (!topic || topic === "All") return query;
  const values = MATH_TOPIC_ALIASES[topic] ?? [topic];
  return (query as any).in("topic", values);
}

/** Map "A"|"B"|"C"|"D" → 0|1|2|3 */
function letterToIndex(letter: string): number {
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter?.trim().toUpperCase()] ?? 0;
}

function isMCQAnswer(value: unknown): boolean {
  return /^[ABCD]$/i.test(String(value ?? "").trim());
}

function isTruthyImportFlag(value: unknown): boolean {
  return /^(true|1|yes)$/i.test(String(value ?? "").trim());
}

// Do not treat every mention of a graph as an image dependency: “the graph of
// y = …” can be a fully textual algebra question. These phrases specifically
// ask the learner to read data from a separate visual.
const visualReference = /\b(?:data|information|evidence)\s+from\s+(?:the\s+)?(?:table|graph|chart|figure|diagram)\b|\b(?:shown|represented|displayed)\s+(?:in|on)\s+(?:the\s+)?(?:table|graph|chart|figure|diagram)\b|\b(?:the|this|given)\s+(?:table|graph|chart|figure|diagram)\s+(?:shows|summarizes|gives|lists|represents|below)\b|\b(?:following\s+tables?|each\s+table)\b/i;
const selfContainedVisualData = /(?:Graph data|Graph description|Table\s*[—:-]|Table of values|Observed traits .*?flowering date|Fish abundance .*?station|Video game units sold|;[^\n]{1,180}—|\|)/is;

function requiresExternalVisual(row: any): boolean {
  if (isTruthyImportFlag(row.has_image)) return true;
  const text = `${row.question ?? ""}\n${row.passage ?? ""}`;
  return visualReference.test(text) && !selfContainedVisualData.test(text);
}

/** Map a raw EBRW_MCQ / Math_MCQ row to the UI shape */
function mapMCQRow(row: any, tablePrefix: string): SATQuestion {
  const rawCorrectAnswer = String(row.correct_answer ?? "").trim();
  // A few legacy imports placed Math grid-ins in the MCQ table. A numerical
  // key must be treated as a free response, never silently graded as A.
  const isFreeResponse = tablePrefix === "math" && rawCorrectAnswer !== "" && !isMCQAnswer(rawCorrectAnswer);
  return {
    // `id` is only a question number and repeats across imported test sources.
    // Use the database UUID whenever available so answers, review state and
    // progress never leak from one same-numbered question to another.
    id: `${tablePrefix}-${row.uid ?? row.id}`,
    question: row.question ?? "",
    passage: row.passage || undefined,
    options: isFreeResponse ? [] : [
      row.option_a ?? "",
      row.option_b ?? "",
      row.option_c ?? "",
      row.option_d ?? "",
    ],
    correctAnswer: isFreeResponse ? -1 : letterToIndex(rawCorrectAnswer),
    correctAnswerText: isFreeResponse ? rawCorrectAnswer : undefined,
    explanation: row.explanation ?? "",
    difficulty: row.difficulty ?? "Medium",
    topic: row.topic ?? "",
    section: tablePrefix === "ebrw" ? "RW" : "Math",
    category: row.topic ?? "",
    imageUrl: resolveImageUrl(row.image_url),
    isFreeResponse,
    hasKaTeX: false,
    requiresImage: requiresExternalVisual(row),
    source: row.source ?? "",
    rawCorrectAnswer,
    module: (row.module ?? "").toString().trim() || undefined,
    questionNumber: Number.isFinite(Number(row.question_number))
      ? Number(row.question_number)
      : undefined,
    page: Number.isFinite(Number(row.page)) ? Number(row.page) : undefined,
  };
}

/** Map a raw Math_Open row to the UI shape */
function mapOpenRow(row: any): SATQuestion {
  return {
    id: `open-${row.uid ?? row.id}`,
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
    requiresImage: requiresExternalVisual(row),
    source: row.source ?? "",
    rawCorrectAnswer: row.correct_answer ?? "",
    module: (row.module ?? "").toString().trim() || undefined,
    questionNumber: Number.isFinite(Number(row.question_number))
      ? Number(row.question_number)
      : undefined,
    page: Number.isFinite(Number(row.page)) ? Number(row.page) : undefined,
  };
}

// Do not give a learner a question with a missing key, choice or required
// visual. Graph references alone are not enough to reject a row: many fully
// solvable algebra questions describe their graph in text.
function isRenderablePracticeQuestion(question: SATQuestion): boolean {
  if (!question.question.trim() || !question.rawCorrectAnswer?.trim()) return false;
  if (!question.isFreeResponse && (!isMCQAnswer(question.rawCorrectAnswer) || question.options.some((option) => !option.trim()))) return false;
  // A malformed TeX source is data corruption, not a styling issue. Do not
  // give the learner KaTeX's red error output while that row awaits recovery
  // from the original PDF.
  if ([question.passage, question.question, ...question.options].some((value) => renderMathText(value).includes("katex-error"))) return false;
  return !question.requiresImage || Boolean(question.imageUrl);
}

function dedupePracticeQuestions(questions: SATQuestion[]): SATQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = [question.passage, question.question, ...question.options]
      .map((value) => (value ?? "").replace(/\s+/g, " ").trim().toLowerCase())
      .join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch Reading & Writing MCQ questions from `EBRW_MCQ`.
 *
 * EBRW uses the same `topic` column as the Math tables.
 */
export async function fetchRWQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
  /** Не брать вопросы из прошедших тестов. По умолчанию не берём. */
  includePastPapers?: boolean;
}): Promise<SATQuestion[]> {
  let query = excludePastPapers(
    supabase.from(SAT_TABLES.ebrwMcq).select("*"),
    !options?.includePastPapers
  );

  const isDerivedDomain = RW_DOMAINS.includes(options?.subtopic as typeof RW_DOMAINS[number]);
  if (options?.subtopic && options.subtopic !== "All" && !isDerivedDomain) {
    query = query.eq("topic", options.subtopic);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`EBRW_MCQ fetch failed: ${error.message}`);
  return dedupePracticeQuestions((data ?? [])
    .map((r) => mapMCQRow(r, "ebrw"))
    .filter(isRenderablePracticeQuestion)
    .filter(question => !isDerivedDomain || inferRWDomain(question.question) === options?.subtopic));
}

/**
 * Fetch Math MCQ questions from `Math_MCQ`.
 */
export async function fetchMathMCQQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
  /** Не брать вопросы из прошедших тестов. По умолчанию не берём. */
  includePastPapers?: boolean;
}): Promise<SATQuestion[]> {
  let query = excludePastPapers(
    supabase.from(SAT_TABLES.mathMcq).select("*"),
    !options?.includePastPapers
  );

  query = filterMathTopic(query, options?.subtopic);
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Math_MCQ fetch failed: ${error.message}`);
  return dedupePracticeQuestions((data ?? []).map((r) => mapMCQRow(r, "math")).filter(isRenderablePracticeQuestion));
}

/**
 * Fetch Math open-response questions from `Math_Open`.
 */
export async function fetchMathOpenQuestions(options?: {
  subtopic?: string;
  difficulty?: string;
  limit?: number;
  /** Не брать вопросы из прошедших тестов. По умолчанию не берём. */
  includePastPapers?: boolean;
}): Promise<SATQuestion[]> {
  let query = excludePastPapers(
    supabase.from(SAT_TABLES.mathOpen).select("*"),
    !options?.includePastPapers
  );

  query = filterMathTopic(query, options?.subtopic);
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Math_Open fetch failed: ${error.message}`);
  return dedupePracticeQuestions((data ?? []).map(mapOpenRow).filter(isRenderablePracticeQuestion));
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
const PERIOD_COLUMNS = "*";
const COMPLETE_SAT_RW_COUNT = 54;
const COMPLETE_SAT_MATH_COUNT = 44;

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
        const question = type === "rw" ? mapMCQRow(r, "ebrw") : (r.option_a !== undefined ? mapMCQRow(r, "math") : mapOpenRow(r));
        if (!isRenderablePracticeQuestion(question)) return;
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

    // A Digital SAT has 54 R&W and 44 Math questions. An incomplete import is
    // still useful for a topic bank, but it is misleading as a Past Paper.
    return Object.values(papersMap)
      .filter((p) => p.rwCount >= COMPLETE_SAT_RW_COUNT && p.mathCount >= COMPLETE_SAT_MATH_COUNT)
      .map(p => ({
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

/* ------------------------------------------------------------------ */
/*  Модули теста                                                       */
/* ------------------------------------------------------------------ */

export interface PaperModule {
  key: string;
  label: string;
  section: "RW" | "Math";
  index: number;
  minutes: number;
  questions: SATQuestion[];
  /**
   * Adaptive Module 2 papers contain two alternative branches.  The first
   * module is shared; after it, exactly one of these branches is selected.
   */
  adaptiveRoute?: string;
  adaptiveLevel?: "easy" | "hard";
}

/** Реальный цифровой SAT: R&W — 27 вопросов и 32 минуты, Math — 22 и 35. */
export const MODULE_RULES = {
  RW: { size: 27, minutes: 32, label: "Reading & Writing" },
  Math: { size: 22, minutes: 35, label: "Math" },
} as const;

/** С какого номера начинается новый модуль и после какого это считается рестартом. */
const RESTART_MAX = 3;
const MIN_BEFORE_RESTART = 8;

/**
 * Делит вопросы одного теста на модули.
 *
 * Опираться на колонку `module` нельзя: заголовок «Math Module 2» напечатан
 * в файле один раз, и парсер сохраняет его только у тех вопросов, что
 * стояли рядом с ним. У остальных там пусто. Зато нумерация в каждом
 * модуле начинается с единицы — по её рестарту модуль и определяется,
 * ровно как это делает парсер при поиске пропущенных вопросов.
 */
export function splitIntoModules(questions: SATQuestion[]): PaperModule[] {
  const modules: PaperModule[] = [];

  for (const section of ["RW", "Math"] as const) {
    const rule = MODULE_RULES[section];
    const inSection = questions
      .filter((q) => (q.section ?? "Math") === section)
      // Порядок как в файле: страница, потом номер. Для математики это
      // важно особенно — MCQ и открытые вопросы лежат в разных таблицах и
      // приходят двумя блоками, хотя в тесте идут вперемешку.
      .sort((a, b) =>
        (a.page ?? 0) - (b.page ?? 0) ||
        (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
      );

    // Группируем по странице: модуль кончается ПОСРЕДИ страницы — там же,
    // где последний вопрос первого модуля, уже напечатан заголовок второго
    // и его вопрос №1. Если внутри страницы просто отсортировать по номеру,
    // «1, 2, 27» разберётся как «новый модуль, а потом 27» — и модуль
    // разваливается на три куска вместо двух.
    const byPage = new Map<number, SATQuestion[]>();
    for (const q of inSection) {
      const page = q.page ?? 0;
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page)!.push(q);
    }

    let current: PaperModule | null = null;
    let reached = 0;

    for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
      const items = byPage.get(page)!;
      const before = reached;
      const byNumber = (a: SATQuestion, b: SATQuestion) =>
        (a.questionNumber ?? 0) - (b.questionNumber ?? 0);
      // Сначала дочитываем текущий модуль, и только потом смотрим на рестарт.
      const ordered = [
        ...items.filter((q) => (q.questionNumber ?? 0) > before).sort(byNumber),
        ...items.filter((q) => (q.questionNumber ?? 0) <= before).sort(byNumber),
      ];

      for (const q of ordered) {
        const number = q.questionNumber ?? 0;
        const restarted =
          current !== null && number > 0 && number <= RESTART_MAX && reached >= MIN_BEFORE_RESTART;

        if (current === null || restarted) {
          const index = modules.filter((m) => m.section === section).length + 1;
          current = {
            key: `${section}-${index}`,
            label: `${rule.label} — Module ${index}`,
            section,
            index,
            minutes: rule.minutes,
            questions: [],
          };
          modules.push(current);
          reached = 0;
        }

        current.questions.push(q);
        reached = Math.max(reached, number);
      }
    }
  }

  // Внутри модуля показываем по номеру, а не по странице: так же, как на экзамене.
  for (const m of modules) {
    m.questions.sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
  }

  // A source with three same-section modules is an adaptive paper: Module 1
  // followed by the Easy and Hard alternatives for Module 2. Preserve both
  // branches instead of presenting them as a fictitious "Module 3".
  for (const section of ["RW", "Math"] as const) {
    const sectionModules = modules.filter((module) => module.section === section);
    if (sectionModules.length !== 3) continue;
    const [first, easy, hard] = sectionModules;
    const expectedSize = MODULE_RULES[section].size;
    if (
      first.questions.length !== expectedSize ||
      easy.questions.length !== expectedSize ||
      hard.questions.length !== expectedSize
    ) continue;

    const route = `${section}-module-2`;
    easy.index = 2;
    easy.key = `${route}-easy`;
    easy.label = `${MODULE_RULES[section].label} — Module 2 (Easy)`;
    easy.adaptiveRoute = route;
    easy.adaptiveLevel = "easy";

    hard.index = 2;
    hard.key = `${route}-hard`;
    hard.label = `${MODULE_RULES[section].label} — Module 2 (Hard)`;
    hard.adaptiveRoute = route;
    hard.adaptiveLevel = "hard";
  }

  // R&W идёт первым, потом математика — как в настоящем тесте.
  return modules.sort(
    (a, b) => (a.section === b.section ? a.index - b.index : a.section === "RW" ? -1 : 1)
  );
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

  const rwQuestions = (rwRes.data ?? []).map((r) => mapMCQRow(r, "ebrw")).filter(isRenderablePracticeQuestion);
  const mathMcqQuestions = (mathMcqRes.data ?? []).map((r) => mapMCQRow(r, "math")).filter(isRenderablePracticeQuestion);
  const mathOpenQuestions = (mathOpenRes.data ?? []).map(mapOpenRow).filter(isRenderablePracticeQuestion);

  return [...rwQuestions, ...mathMcqQuestions, ...mathOpenQuestions];
}

