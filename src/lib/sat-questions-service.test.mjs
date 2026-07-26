/**
 * Проверка разбивки теста на модули без запуска сайта и без базы.
 *
 *   node src/lib/sat-questions-service.test.mjs
 *
 * Логика скопирована из splitIntoModules один в один: файл на TypeScript и
 * тянет за собой Supabase-клиент, поднимать который ради чистой функции
 * незачем. Если правишь splitIntoModules — правь и здесь.
 */

const MODULE_RULES = {
  RW: { size: 27, minutes: 32, label: "Reading & Writing" },
  Math: { size: 22, minutes: 35, label: "Math" },
};
const RESTART_MAX = 3;
const MIN_BEFORE_RESTART = 8;

function splitIntoModules(questions) {
  const modules = [];
  for (const section of ["RW", "Math"]) {
    const rule = MODULE_RULES[section];
    const inSection = questions
      .filter((q) => (q.section ?? "Math") === section)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.questionNumber ?? 0) - (b.questionNumber ?? 0));

    let current = null;
    let reached = 0;
    for (const q of inSection) {
      const number = q.questionNumber ?? 0;
      const restarted =
        current !== null && number > 0 && number <= RESTART_MAX && reached >= MIN_BEFORE_RESTART;
      if (current === null || restarted) {
        const index = modules.filter((m) => m.section === section).length + 1;
        current = { key: `${section}-${index}`, label: `${rule.label} — Module ${index}`,
                    section, index, minutes: rule.minutes, questions: [] };
        modules.push(current);
        reached = 0;
      }
      current.questions.push(q);
      reached = Math.max(reached, number);
    }
  }
  for (const m of modules) m.questions.sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
  return modules.sort((a, b) =>
    a.section === b.section ? a.index - b.index : a.section === "RW" ? -1 : 1);
}

let failed = false;
const check = (cond, label) => {
  console.log((cond ? "  OK   " : "  FAIL ") + label);
  if (!cond) failed = true;
};

// Полный тест как из парсера: колонка module пустая почти везде, потому что
// заголовок модуля напечатан в файле один раз.
let page = 1;
const questions = [];
const addModule = (section, size, isFreeResponse = () => false) => {
  for (let n = 1; n <= size; n++) {
    if (n % 3 === 1) page++;
    questions.push({
      id: `${section}-${questions.length}`,
      section,
      questionNumber: n,
      page,
      module: "",
      isFreeResponse: isFreeResponse(n),
    });
  }
};
addModule("RW", 27);
addModule("RW", 27);
// В матмодуле последние 6 вопросов — открытые (SPR), как на настоящем экзамене.
addModule("Math", 22, (n) => n > 16);
addModule("Math", 22, (n) => n > 16);

// Математика приходит двумя блоками из разных таблиц — сначала все MCQ,
// потом все открытые. Порядок «как в файле» должен восстановиться сам.
const shuffledLikeService = [
  ...questions.filter((q) => q.section === "RW"),
  ...questions.filter((q) => q.section === "Math" && !q.isFreeResponse),
  ...questions.filter((q) => q.section === "Math" && q.isFreeResponse),
];

const modules = splitIntoModules(shuffledLikeService);

console.log("\nмодулей:", modules.map((m) => `${m.label} (${m.questions.length})`).join(", "));

check(modules.length === 4, `найдено 4 модуля (получено ${modules.length})`);
check(
  modules.map((m) => m.questions.length).join(",") === "27,27,22,22",
  `размеры модулей 27/27/22/22 (получено ${modules.map((m) => m.questions.length).join(",")})`
);
check(
  modules.map((m) => m.label).join(" | ") ===
    "Reading & Writing — Module 1 | Reading & Writing — Module 2 | Math — Module 1 | Math — Module 2",
  "порядок и подписи модулей как на экзамене"
);
check(
  modules.every((m) =>
    m.questions.every((q, i) => q.questionNumber === i + 1)),
  "внутри модуля вопросы идут по номерам 1..N без дыр"
);
check(
  modules[2].questions.filter((q) => q.isFreeResponse).length === 6,
  "открытые вопросы попали в свой матмодуль, а не в чужой"
);
check(
  modules.map((m) => m.minutes).join(",") === "32,32,35,35",
  "тайминг модулей: 32 и 35 минут"
);

// Один модуль (например, файл только с Reading & Writing) не должен
// разваливаться на куски.
const single = splitIntoModules(questions.filter((q) => q.section === "RW").slice(0, 27));
check(single.length === 1 && single[0].questions.length === 27,
  `отдельный модуль остаётся одним (получено ${single.length})`);

// Вопросы без номеров ломать разбивку не должны.
const noNumbers = splitIntoModules([
  { section: "RW", page: 1 }, { section: "RW", page: 1 }, { section: "RW", page: 2 },
]);
check(noNumbers.length === 1 && noNumbers[0].questions.length === 3,
  "вопросы без номеров не плодят модули");

console.log(failed ? "\nFAILED" : "\nвсе проверки прошли");
process.exit(failed ? 1 : 0);
