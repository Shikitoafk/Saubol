/**
 * Имена таблиц с вопросами SAT для серверных роутов.
 *
 * Дублирует src/lib/sat-tables.ts намеренно: там значения берутся из
 * import.meta.env (сборка Vite), здесь — из process.env (Node на Vercel).
 * Значения по умолчанию должны совпадать в обоих файлах.
 */

export const SAT_TABLES = {
  ebrwMcq: process.env.SAT_TABLE_EBRW_MCQ?.trim() || "sat_ebrw_mcq",
  mathMcq: process.env.SAT_TABLE_MATH_MCQ?.trim() || "sat_math_mcq",
  mathOpen: process.env.SAT_TABLE_MATH_OPEN?.trim() || "sat_math_open",
} as const;
