/**
 * Имена таблиц с вопросами SAT — в одном месте.
 *
 * Раньше они были вписаны строками в семь разных файлов, причём в коде
 * стояло `EBRW_MCQ` / `Math_MCQ` / `Math_Open`, а в базе таблицы называются
 * `sat_ebrw_mcq` / `sat_math_mcq` / `sat_math_open`. Каждый запрос падал с
 * «таблица не найдена», ошибка глушилась, и страница молча показывала
 * заглушку — снаружи это выглядело как «вопросы не загрузились».
 *
 * Переопределить можно через .env, не трогая код:
 *   VITE_SAT_TABLE_EBRW_MCQ=...
 *   VITE_SAT_TABLE_MATH_MCQ=...
 *   VITE_SAT_TABLE_MATH_OPEN=...
 */

export const SAT_TABLES = {
  ebrwMcq: import.meta.env.VITE_SAT_TABLE_EBRW_MCQ?.trim() || "sat_ebrw_mcq",
  mathMcq: import.meta.env.VITE_SAT_TABLE_MATH_MCQ?.trim() || "sat_math_mcq",
  mathOpen: import.meta.env.VITE_SAT_TABLE_MATH_OPEN?.trim() || "sat_math_open",
} as const;
