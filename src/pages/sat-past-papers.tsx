import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Zap,
  Trophy,
  Brain,
  BookOpen,
  Sparkles,
  Calculator,
  Highlighter,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  ClipboardList,
  Check,
  RotateCcw,
  Bookmark,
  Menu,
  Eye,
  EyeOff,
  ListChecks,
  Strikethrough
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  fetchAvailablePastPapers,
  fetchPastPaperQuestions,
  SATQuestion,
  PastPaper,
  PaperModule,
  splitIntoModules,
  withTimeout
} from "@/lib/sat-questions-service";
import katex from "katex";
import "katex/dist/katex.min.css";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionImage } from "@/components/question-image";

// High-fidelity fallback past papers & questions for local testing (since count = 0 in database)
// Заглушка включается только флагом VITE_USE_MOCK_PAPERS=true — она нужна
// для локальной вёрстки без базы. По умолчанию выключена: раньше она
// подменяла собой любую ошибку запроса, и настоящие вопросы из Supabase
// на странице просто не появлялись.
const USE_MOCK_PAPERS =
  String(import.meta.env.VITE_USE_MOCK_PAPERS).toLowerCase() === "true";

const MOCK_PAST_PAPERS: PastPaper[] = [
  {
    test_period: "June 2025",
    test_version: "Version A",
    totalQuestions: 6,
    rwQuestions: 2,
    mathQuestions: 4,
  },
  {
    test_period: "August 2024",
    test_version: "INT-B",
    totalQuestions: 4,
    rwQuestions: 2,
    mathQuestions: 2,
  }
];

const MOCK_QUESTIONS: Record<string, SATQuestion[]> = {
  "June 2025|||Version A": [
    {
      id: "ebrw-mock1",
      question: "The following text is from Emily Dickinson's poem 'Hope is the thing with feathers'. \n\n'Hope' is the thing with feathers -\nThat perches in the soul -\nAnd sings the tune without the words -\nAnd never stops - at all -\n\nAs used in the text, what does the word 'perches' most nearly mean?",
      passage: "Hope is a resilient and constant presence in the human spirit, requiring no encouragement to keep singing its silent song.",
      options: ["Flies away", "Settles or rests", "Sings loudly", "Fails to remain"],
      correctAnswer: 1,
      explanation: "The word 'perches' refers to a bird resting on a branch. In the context of the poem, 'hope' is personified as a bird that rests or settles in the soul.",
      difficulty: "Easy",
      topic: "Information and Ideas",
      section: "RW",
      isFreeResponse: false,
      questionNumber: 1,
      page: 2,
      rawCorrectAnswer: "B"
    },
    {
      id: "ebrw-mock2",
      question: "While investigating the properties of noble gases, the researcher discovered that helium behaves differently under extreme pressure. Specifically, helium ______ solid under conditions exceeding 100 GPa.",
      passage: "",
      options: ["becomes", "become", "becoming", "has became"],
      correctAnswer: 0,
      explanation: "Helium is a singular noun, so the singular verb 'becomes' is the grammatically correct choice.",
      difficulty: "Medium",
      topic: "Standard English Conventions",
      section: "RW",
      isFreeResponse: false,
      questionNumber: 2,
      page: 2,
      rawCorrectAnswer: "A"
    },
    {
      id: "math-mock1",
      question: "If $2x + 5 = 15$, what is the value of $x$?",
      options: ["3", "5", "10", "15"],
      correctAnswer: 1,
      explanation: "Subtract 5 from both sides: $2x = 10$. Divide by 2: $x = 5$.",
      difficulty: "Easy",
      topic: "Algebra",
      section: "Math",
      isFreeResponse: false,
      questionNumber: 1,
      page: 21,
      rawCorrectAnswer: "B"
    },
    {
      id: "math-mock2",
      question: "A line in the $xy$-plane passes through the origin and has a slope of $3$. Which of the following points lies on the line?",
      options: ["$(1, 3)$", "$(3, 1)$", "$(0, 3)$", "$(3, 0)$"],
      correctAnswer: 0,
      explanation: "The equation of the line is $y = 3x$. Plugging in $x=1$ gives $y=3$, so $(1, 3)$ lies on the line.",
      difficulty: "Medium",
      topic: "Algebra",
      section: "Math",
      isFreeResponse: false,
      questionNumber: 2,
      page: 21,
      rawCorrectAnswer: "A"
    },
    {
      id: "math-open-mock1",
      question: "What is the positive solution to the equation $x^2 - 16 = 0$?",
      options: [],
      correctAnswer: -1,
      correctAnswerText: "4",
      explanation: "Factoring the equation gives $(x - 4)(x + 4) = 0$. The solutions are $x = 4$ and $x = -4$. The positive solution is $4$.",
      difficulty: "Medium",
      topic: "Advanced Math",
      section: "Math",
      isFreeResponse: true,
      questionNumber: 3,
      page: 21,
      rawCorrectAnswer: "4"
    },
    {
      id: "math-open-mock2",
      question: "In the triangle $ABC$, the measure of angle $B$ is $90^\\circ$. If $AB = 6$ and $BC = 8$, what is the length of $AC$?",
      options: [],
      correctAnswer: -1,
      correctAnswerText: "",
      explanation: "This is a question with an empty correct answer to test the 'Answer not available' fallback logic.",
      difficulty: "Medium",
      topic: "Geometry",
      section: "Math",
      isFreeResponse: true,
      questionNumber: 4,
      page: 22,
      rawCorrectAnswer: "" // Test case: empty correct answer
    }
  ],
  "August 2024|||INT-B": [
    {
      id: "ebrw-mock-2-1",
      question: "The author is considering changing the word 'innovative' in sentence 3. Which choice best maintains the focus on technical breakthroughs?",
      passage: "The lab's recent findings in superconductors have been labeled innovative by some, but truly revolutionary by others.",
      options: ["creative", "modern", "groundbreaking", "clever"],
      correctAnswer: 2,
      explanation: "'Groundbreaking' emphasizes technical breakthrough and aligns perfectly with the scientific context of superconductors.",
      difficulty: "Medium",
      topic: "Words in Context",
      section: "RW",
      isFreeResponse: false,
      questionNumber: 3,
      page: 2,
      rawCorrectAnswer: "C"
    },
    {
      id: "ebrw-mock-2-2",
      question: "To test the hypothesis, the team analyzed several core samples. They concluded that the samples ______ significant traces of silicate mineral.",
      passage: "",
      options: ["contain", "contains", "containing", "has contained"],
      correctAnswer: 0,
      explanation: "The subject 'samples' is plural, so it requires the plural verb 'contain'.",
      difficulty: "Easy",
      topic: "Standard English Conventions",
      section: "RW",
      isFreeResponse: false,
      questionNumber: 4,
      page: 3,
      rawCorrectAnswer: "A"
    },
    {
      id: "math-mock-2-1",
      question: "What is the sum of the solutions of the quadratic equation $x^2 - 7x + 12 = 0$?",
      options: ["3", "4", "7", "12"],
      correctAnswer: 2,
      explanation: "According to Vieta's formulas, the sum of solutions of $ax^2 + bx + c = 0$ is $-b/a$. Here, $-(-7)/1 = 7$.",
      difficulty: "Medium",
      topic: "Advanced Math",
      section: "Math",
      isFreeResponse: false,
      questionNumber: 5,
      page: 22,
      rawCorrectAnswer: "C"
    },
    {
      id: "math-open-2-2",
      question: "If $f(x) = 3x - 4$ and $f(k) = 8$, what is the value of $k$?",
      options: [],
      correctAnswer: -1,
      correctAnswerText: "4",
      explanation: "$3k - 4 = 8 \\implies 3k = 12 \\implies k = 4$.",
      difficulty: "Easy",
      topic: "Algebra",
      section: "Math",
      isFreeResponse: true,
      questionNumber: 6,
      page: 22,
      rawCorrectAnswer: "4"
    }
  ]
};

export default function SATPastPapers() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('sat-theme') as 'dark' | 'light') || 'dark');
  const [phase, setPhase] = useState<"list" | "modes" | "session" | "results">("list");
  
  // Database vs Mock states
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [mode, setMode] = useState<"exam" | "practice" | null>(null);
  const [questions, setQuestions] = useState<SATQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Модули выбранного теста и то, какой из них решаем. null = весь тест целиком.
  const [modules, setModules] = useState<PaperModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<PaperModule | null>(null);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Session states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [freeResponseInput, setFreeResponseInput] = useState("");
  const [elapsed, setElapsed] = useState(0); // practice stopwatch
  const [timeRemaining, setTimeRemaining] = useState(134 * 60); // 134 mins for exam mode
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isQuestionMenuOpen, setIsQuestionMenuOpen] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, number[]>>({});
  
  // Answers tracking
  // Store either MCQ option index or Free Response text input
  const [userAnswers, setUserAnswers] = useState<Record<string, { selected?: number; text?: string; isCorrect?: boolean; skipped?: boolean }>>({});
  
  // Feedback states for Practice mode
  const [answerConfirmed, setAnswerConfirmed] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<{ correct: boolean } | null>(null);

  // Review states after test ends
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Timer intervals
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (phase === "session") {
      if (mode === "exam") {
        timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timer!);
              window.setTimeout(() => advanceModule(), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        timer = setInterval(() => {
          setElapsed(prev => prev + 1);
        }, 1000);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, mode]);

  // Load available past papers from Supabase
  useEffect(() => {
    const getPapers = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await withTimeout(fetchAvailablePastPapers(), 15000, "Список тестов");
        // Заглушку показываем, только если её явно попросили через .env.
        // Иначе пустой ответ и ошибка запроса выглядели одинаково — как
        // «вот два теста на шесть вопросов», хотя в базе лежат настоящие.
        if (data && data.length > 0) {
          setPastPapers(data);
        } else if (USE_MOCK_PAPERS) {
          setPastPapers(MOCK_PAST_PAPERS);
        } else {
          setPastPapers([]);
        }
      } catch (err: any) {
        console.error("Failed to load past papers:", err);
        setPastPapers(USE_MOCK_PAPERS ? MOCK_PAST_PAPERS : []);
        if (!USE_MOCK_PAPERS) {
          setLoadError(err?.message || "Не удалось связаться с базой");
        }
      } finally {
        setLoading(false);
      }
    };
    getPapers();
  }, []);

  // Save theme state
  useEffect(() => {
    localStorage.setItem('sat-theme', theme);
  }, [theme]);

  // Select test
  const handleSelectPaper = async (paper: PastPaper) => {
    setSelectedPaper(paper);
    setSelectedModule(null);
    setModules([]);
    setPhase("modes");
    setModulesLoading(true);
    setError(null);
    try {
      let all: SATQuestion[] = [];
      try {
        all = await withTimeout(
          fetchPastPaperQuestions(paper.test_period, paper.test_version),
          15000, "Вопросы теста");
      } catch (e: any) {
        // Заглушка нужна и здесь: список модулей строится до старта сессии,
        // и без неё локально (без базы) экран оставался пустым.
        if (!USE_MOCK_PAPERS) throw e;
        console.warn("DB load failed, using mocks:", e);
      }
      if (all.length === 0 && USE_MOCK_PAPERS) {
        all = MOCK_QUESTIONS[`${paper.test_period}|||${paper.test_version}`] || [];
      }
      setQuestions(all);
      setModules(splitIntoModules(all));
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить вопросы теста");
    } finally {
      setModulesLoading(false);
    }
  };

  // Start exam/practice session
  const handleStartSession = async (selectedMode: "exam" | "practice") => {
    if (!selectedPaper) return;
    setMode(selectedMode);
    setLoading(true);
    setError(null);
    try {
      let fetchedQuestions: SATQuestion[] = [];
      const key = `${selectedPaper.test_period}|||${selectedPaper.test_version}`;

      // Вопросы уже загружены при выборе теста — второй раз в базу не ходим.
      if (selectedModule) {
        fetchedQuestions = selectedModule.questions;
      } else if (modules.length > 0) {
        fetchedQuestions = modules.flatMap((m) => m.questions);
      } else if (questions.length > 0) {
        fetchedQuestions = questions;
      } else {
        try {
          fetchedQuestions = await fetchPastPaperQuestions(
            selectedPaper.test_period, selectedPaper.test_version);
        } catch (e) {
          console.warn("DB question load failed, using mocks:", e);
        }
      }

      // Fallback if db returned empty or failed
      if ((!fetchedQuestions || fetchedQuestions.length === 0) && USE_MOCK_PAPERS) {
        fetchedQuestions = MOCK_QUESTIONS[key] || [];
      }

      if (fetchedQuestions.length === 0) {
        throw new Error("No questions available for this test paper.");
      }

      setQuestions(fetchedQuestions);
      setPhase("session");
      setCurrentIdx(0);
      setUserAnswers({});
      setMarkedQuestions(new Set());
      setEliminatedOptions({});
      setIsQuestionMenuOpen(false);
      setIsReferenceOpen(false);
      setIsTimerHidden(false);
      setFreeResponseInput("");
      setElapsed(0);
      // Настоящий тайминг: R&W — 32 минуты на модуль, Math — 35.
      // Раньше на любую сессию давалось 134 минуты, даже на один модуль.
      setTimeRemaining(
        (selectedModule
          ? selectedModule.minutes
          : modules[0]?.minutes || 32) * 60);
      setAnswerConfirmed(false);
      setPracticeFeedback(null);
      setIsReviewMode(false);
    } catch (err: any) {
      setError(err?.message || "Failed to initiate session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if answer is empty for a question
  const isQuestionAnswerEmpty = (q: SATQuestion) => {
    const raw = (q as any).rawCorrectAnswer;
    return !raw || raw.toString().trim() === "";
  };

  // Handle Practice Mode option confirm
  const handlePracticeConfirm = (optionIdx: number) => {
    if (answerConfirmed) return;
    const q = questions[currentIdx];
    
    // Check if the correct answer is empty (unscoped question)
    const emptyAnswer = isQuestionAnswerEmpty(q);
    
    const correct = emptyAnswer ? false : (optionIdx === q.correctAnswer);
    
    setUserAnswers(prev => ({
      ...prev,
      [q.id]: { selected: optionIdx, isCorrect: correct }
    }));
    
    setPracticeFeedback({ correct });
    setAnswerConfirmed(true);
  };

  // Handle Practice Mode open response confirm
  const handlePracticeOpenConfirm = () => {
    if (answerConfirmed || !freeResponseInput.trim()) return;
    const q = questions[currentIdx];
    
    // Check if empty
    const emptyAnswer = isQuestionAnswerEmpty(q);
    
    const correctAns = (q.correctAnswerText || "").trim().toLowerCase();
    const userAns = freeResponseInput.trim().toLowerCase();
    const correct = emptyAnswer ? false : (userAns === correctAns);

    setUserAnswers(prev => ({
      ...prev,
      [q.id]: { text: freeResponseInput, isCorrect: correct }
    }));

    setPracticeFeedback({ correct });
    setAnswerConfirmed(true);
  };

  // Handle Exam Mode selections
  const handleExamSelection = (optionIdx: number) => {
    const q = questions[currentIdx];
    setUserAnswers(prev => ({
      ...prev,
      [q.id]: { selected: optionIdx }
    }));
  };

  const handleExamOpenSubmit = (text: string) => {
    const q = questions[currentIdx];
    setUserAnswers(prev => ({
      ...prev,
      [q.id]: { text }
    }));
  };

  // Navigate questions
  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setAnswerConfirmed(false);
      setPracticeFeedback(null);
      // Load existing user answers
      const nextQ = questions[nextIdx];
      const ans = userAnswers[nextQ.id];
      if (ans) {
        setFreeResponseInput(ans.text || "");
        if (mode === "practice") {
          setAnswerConfirmed(true);
          setPracticeFeedback({ correct: ans.isCorrect || false });
        }
      } else {
        setFreeResponseInput("");
      }
    } else if (mode === "practice") {
      // Completed practice
      setPhase("results");
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setAnswerConfirmed(false);
      setPracticeFeedback(null);
      const prevQ = questions[prevIdx];
      const ans = userAnswers[prevQ.id];
      if (ans) {
        setFreeResponseInput(ans.text || "");
        if (mode === "practice") {
          setAnswerConfirmed(true);
          setPracticeFeedback({ correct: ans.isCorrect || false });
        }
      } else {
        setFreeResponseInput("");
      }
    }
  };

  // Finish exam & compile results
  const handleFinishTest = () => {
    // Process correctness for all answers in Exam mode
    const processed: typeof userAnswers = { ...userAnswers };
    questions.forEach(q => {
      const ans = processed[q.id];
      const emptyAnswer = isQuestionAnswerEmpty(q);

      if (!ans) {
        processed[q.id] = { skipped: true, isCorrect: false };
      } else if (emptyAnswer) {
        // Question is unscored
        processed[q.id] = { ...ans, isCorrect: false, skipped: false };
      } else {
        if (q.isFreeResponse) {
          const userText = (ans.text || "").trim().toLowerCase();
          const correctText = (q.correctAnswerText || "").trim().toLowerCase();
          processed[q.id] = { ...ans, isCorrect: userText === correctText, skipped: false };
        } else {
          processed[q.id] = { ...ans, isCorrect: ans.selected === q.correctAnswer, skipped: false };
        }
      }
    });

    setUserAnswers(processed);
    setPhase("results");
  };

  // Statistics calculation for results page
  const stats = useMemo(() => {
    if (questions.length === 0) return { correct: 0, incorrect: 0, skipped: 0, unscored: 0, totalScored: 0, scorePercent: 0 };
    
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let unscored = 0;

    questions.forEach(q => {
      const ans = userAnswers[q.id];
      const emptyAnswer = isQuestionAnswerEmpty(q);

      if (emptyAnswer) {
        unscored++;
      } else if (!ans || ans.skipped || (q.isFreeResponse && !ans.text?.trim()) || (!q.isFreeResponse && ans.selected === undefined)) {
        skipped++;
      } else {
        if (ans.isCorrect) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const totalScored = questions.length - unscored;
    const scorePercent = totalScored > 0 ? Math.round((correct / totalScored) * 100) : 0;

    return {
      correct,
      incorrect,
      skipped,
      unscored,
      totalScored,
      scorePercent
    };
  }, [questions, userAnswers]);

  // Review helper: load question index in results review
  const handleReviewQuestion = (idx: number) => {
    setCurrentIdx(idx);
    setIsReviewMode(true);
    setPhase("session");
  };

  const highlightSelectedText = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.toString().trim() === "") return;

    const span = document.createElement("span");
    span.className = "bg-yellow-400/50 dark:bg-yellow-500/40 text-current px-0.5 rounded";

    try {
      range.surroundContents(span);
    } catch (e) {
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      } catch (err) {
        console.error("Failed to highlight text:", err);
      }
    }
    selection.removeAllRanges();
  };

  const renderKatexText = (text: string) => {
    if (!text) return "";
    try {
      let processed = text;
      processed = processed.replace(/\\+\[([\s\S]+?)\\+\]/g, (_, math) => {
        return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      });
      processed = processed.replace(/\\+\(([\s\S]+?)\\+\)/g, (_, math) => {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      });
      processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) =>
        katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
      );
      // Пары $...$ обрабатываем, только если долларов чётное число. Иначе
      // одиночный $ (например «$5» в тексте про деньги) регулярка спарила бы
      // со следующим и покорёжила бы формулу — а «иногда не работает» это
      // ровно оно.
      if (((processed.match(/\$/g) || []).length % 2) === 0) {
        processed = processed.replace(/\$([^$]+?)\$/g, (_, math) =>
          katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
        );
      }
      return processed;
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      return text;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Модули, по которым идёт сессия: выбранный один — или все по порядку при
  // «весь тест». Нужно, чтобы в шапке показать «Модуль 1 · 5 из 27», а не
  // «5 из 98»: на экзамене вопросы идут модулями, а не сплошным списком.
  const sessionModules = selectedModule ? [selectedModule] : modules;

  // В каком модуле сейчас находимся и какой это по счёту вопрос внутри него.
  const locateQuestion = (idx: number) => {
    let offset = 0;
    for (const m of sessionModules) {
      if (idx < offset + m.questions.length) {
        return { module: m, local: idx - offset, total: m.questions.length };
      }
      offset += m.questions.length;
    }
    return { module: null as PaperModule | null, local: idx, total: questions.length };
  };
  const here = locateQuestion(currentIdx);
  const hereSubject = here.module
    ? (here.module.section === "RW" ? "Reading & Writing" : "Mathematics")
    : (questions[currentIdx]?.section === "RW" ? "Reading & Writing" : "Mathematics");

  // Настоящий passage — только если он не дублирует сам вопрос. У
  // математических вопросов парсер иногда кладёт условие и в passage, и в
  // question; тогда split-панель показывала один и тот же текст дважды —
  // слева сырой $...$, справа отрисованный. Сравниваем без $ и пробелов.
  const stripForCompare = (s?: string) => (s || "").replace(/[\s$]/g, "").toLowerCase();
  const currentQuestion = questions[currentIdx];
  const hasRealPassage = !!currentQuestion?.passage &&
    stripForCompare(currentQuestion.passage) !== stripForCompare(currentQuestion.question);

  let currentModuleStart = 0;
  for (const module of sessionModules) {
    if (module === here.module) break;
    currentModuleStart += module.questions.length;
  }
  const currentModuleEnd = Math.min(
    questions.length - 1,
    currentModuleStart + (here.module?.questions.length || questions.length) - 1
  );
  const currentModuleIndexes = Array.from(
    { length: currentModuleEnd - currentModuleStart + 1 },
    (_, index) => currentModuleStart + index
  );

  function advanceModule() {
    const moduleIndex = sessionModules.findIndex((module) => module === here.module);
    const nextModule = sessionModules[moduleIndex + 1];
    if (nextModule && currentModuleEnd < questions.length - 1) {
      const nextIndex = currentModuleEnd + 1;
      setCurrentIdx(nextIndex);
      setFreeResponseInput(userAnswers[questions[nextIndex]?.id]?.text || "");
      setTimeRemaining(nextModule.minutes * 60);
      setIsTimerHidden(false);
      setIsQuestionMenuOpen(false);
      setAnswerConfirmed(false);
      setPracticeFeedback(null);
      return;
    }
    setIsQuestionMenuOpen(false);
    handleFinishTest();
  }

  const goToQuestion = (index: number) => {
    if (index < currentModuleStart || index > currentModuleEnd) return;
    setCurrentIdx(index);
    setAnswerConfirmed(false);
    setPracticeFeedback(null);
    setFreeResponseInput(userAnswers[questions[index]?.id]?.text || "");
    setIsQuestionMenuOpen(false);
  };

  const toggleMarked = () => {
    if (!currentQuestion) return;
    setMarkedQuestions((previous) => {
      const next = new Set(previous);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const toggleEliminated = (optionIndex: number) => {
    if (!currentQuestion) return;
    setEliminatedOptions((previous) => {
      const existing = previous[currentQuestion.id] || [];
      const next = existing.includes(optionIndex)
        ? existing.filter((value) => value !== optionIndex)
        : [...existing, optionIndex];
      return { ...previous, [currentQuestion.id]: next };
    });
  };

  useEffect(() => {
    if (phase !== "session" || isReviewMode) return;
    const onShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.altKey)) return;
      const key = event.key.toLowerCase();
      if (["g", "t", "c", "r", "v", "b", "x"].includes(key)) event.preventDefault();
      if (key === "g") setIsQuestionMenuOpen((value) => !value);
      if (key === "t") setIsTimerHidden((value) => !value);
      if (key === "c" && currentQuestion?.section === "Math") setIsDesmosOpen((value) => !value);
      if (key === "r" && currentQuestion?.section === "Math") setIsReferenceOpen((value) => !value);
      if (key === "v") toggleMarked();
      if (key === "b" && currentIdx > currentModuleStart) prevQuestion();
      if (key === "x" && currentIdx < currentModuleEnd) nextQuestion();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [phase, isReviewMode, currentIdx, currentModuleStart, currentModuleEnd, currentQuestion?.id, currentQuestion?.section]);

  return (
    <Layout>
      <div className={`min-h-screen bg-canvas text-ink relative overflow-hidden font-sans selection:bg-surface-2 ${theme === 'light' ? 'light-theme' : ''}`}>
        <style>{`
          .light-theme {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .light-theme .bg-vignette {
            background: radial-gradient(circle, transparent 40%, rgba(248, 250, 252, 0.8) 100%) !important;
          }
          .light-theme .glass-3d {
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(16px) !important;
            border-color: rgba(99, 102, 241, 0.15) !important;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.8) !important;
            color: #0f172a !important;
          }
          .light-theme .glass-3d:hover {
            border-color: rgba(99, 102, 241, 0.4) !important;
          }
          .light-theme .text-shimmer {
            background: linear-gradient(135deg, #0f172a 0%, #4338ca 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
          }
          .light-theme .text-ink {
            color: #0f172a !important;
          }
          .light-theme .text-ink\\/80 {
            color: #334155 !important;
          }
          .light-theme .text-ink\\/70 {
            color: #475569 !important;
          }
          .light-theme .text-ink\\/60 {
            color: #475569 !important;
          }
          .light-theme .text-ink\\/40 {
            color: #64748b !important;
          }
          .light-theme .text-\\[\\#444\\] {
            color: #64748b !important;
          }
          .light-theme .text-\\[\\#666\\] {
            color: #475569 !important;
          }
          .light-theme .divide-white\\/5 > * {
            border-color: rgba(99, 102, 241, 0.1) !important;
          }
          .light-theme .border-white\\/5 {
            border-color: rgba(99, 102, 241, 0.1) !important;
          }
          .light-theme .border-white\\/10 {
            border-color: rgba(99, 102, 241, 0.15) !important;
          }
          .light-theme .bg-white\\/5 {
            background-color: rgba(99, 102, 241, 0.03) !important;
          }
          .light-theme .bg-white\\/10 {
            background-color: rgba(99, 102, 241, 0.06) !important;
          }
          .light-theme .hover\\:bg-white\\/5:hover {
            background-color: rgba(99, 102, 241, 0.04) !important;
          }
          .light-theme .hover\\:bg-white\\/10:hover {
            background-color: rgba(99, 102, 241, 0.08) !important;
          }
          .light-theme .hover\\:text-ink:hover {
            color: #4f46e5 !important;
          }
          .light-theme button.glass-3d:hover {
            background-color: rgba(99, 102, 241, 0.05) !important;
          }
          .light-theme .text-indigo-400 {
            color: #4f46e5 !important;
          }
          .light-theme .border-indigo-500\\/10 {
            border-color: rgba(79, 70, 229, 0.15) !important;
          }
          .light-theme .bg-indigo-500\\/5 {
            background-color: rgba(79, 70, 229, 0.04) !important;
          }
          .light-theme .text-blue-400 {
            color: #2563eb !important;
          }
          .light-theme .border-blue-500\\/10 {
            border-color: rgba(37, 99, 235, 0.15) !important;
          }
          .light-theme .bg-blue-500\\/5 {
            background-color: rgba(37, 99, 235, 0.04) !important;
          }
          .light-theme .selection\\:bg-white\\/10::selection {
            background-color: rgba(79, 70, 229, 0.15) !important;
          }
          .light-theme input {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .light-theme input:focus {
            border-color: #4f46e5 !important;
            outline: none !important;
          }

          /* KaTeX overrides */
          .katex {
            font-size: 1.1em !important;
            color: inherit !important;
            line-height: 1.25 !important;
            display: inline-block;
          }
          .katex-display {
            margin: 1.2em 0 !important;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.5rem 0;
            color: inherit !important;
          }
          .katex-html {
            color: inherit !important;
          }
          .light-theme .group .rounded-full {
            border-color: rgba(99, 102, 241, 0.25) !important;
            color: #334155 !important;
          }
          .light-theme .group:hover .rounded-full {
            border-color: #4f46e5 !important;
            color: #4f46e5 !important;
            background-color: rgba(99, 102, 241, 0.05) !important;
          }
        `}</style>
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-35" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} />

        {/* Phase 1: Test Selection List */}
        {phase === "list" && (
          <div className="max-w-[1300px] mx-auto px-6 md:px-10 py-16 md:py-20 relative z-10">
            <header className="mb-12">
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">SAT Section</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 leading-[0.95]">
                PAST PAPERS.
              </h1>
              <p className="text-sm text-ink-muted font-semibold max-w-xl">
                Solve authentic past Digital SAT exam modules by period with proper pacing, structure, and analytics.
              </p>
            </header>

            {loading ? (
              <div className="glass-3d p-16 flex flex-col items-center justify-center border-indigo-500/10 min-h-[300px]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest text-ink-subtle font-bold">Scanning database for papers...</p>
              </div>
            ) : loadError ? (
              <div className="glass-3d p-12 border-rose-500/20 bg-rose-500/[0.03] min-h-[300px] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4 text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Не удалось загрузить тесты</h3>
                </div>
                <p className="text-sm text-ink-muted font-medium mb-6 max-w-2xl leading-relaxed">
                  База ответила ошибкой. Проверь, что таблицы <code className="text-indigo-400">sat_ebrw_mcq</code>,{" "}
                  <code className="text-indigo-400">sat_math_mcq</code>, <code className="text-indigo-400">sat_math_open</code>{" "}
                  существуют и открыты на чтение (RLS) для анонимного ключа.
                </p>
                <pre className="text-xs text-rose-300/80 bg-canvas/40 border border-rose-500/10 rounded-xl p-4 overflow-x-auto">
                  {loadError}
                </pre>
              </div>
            ) : pastPapers.length === 0 ? (
              <div className="glass-3d p-12 border-line min-h-[300px] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4 text-indigo-400">
                  <FileText className="w-6 h-6" />
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Пока нет ни одного теста</h3>
                </div>
                <p className="text-sm text-ink-muted font-medium max-w-2xl leading-relaxed">
                  Запрос прошёл, но строк с заполненным <code className="text-indigo-400">test_period</code> не нашлось.
                  Загрузи вопросы в Supabase и убедись, что у них проставлен период — например «March 2026».
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastPapers.map((paper, idx) => {
                  const key = `${paper.test_period}-${paper.test_version}`;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ y: -8, scale: 1.01 }}
                      className="glass-3d p-10 flex flex-col justify-between min-h-[320px] cursor-pointer border-line hover:border-indigo-500/40 transition-all relative overflow-hidden group"
                      onClick={() => handleSelectPaper(paper)}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-8">
                            <span className="px-3.5 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[9px] font-black tracking-widest uppercase text-indigo-400">
                              Real Exam
                            </span>
                            <span className="text-xs font-black text-ink-muted uppercase">
                              {paper.test_version || "Standard"}
                            </span>
                          </div>
                          
                          <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                            {paper.test_period}
                          </h3>
                          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
                            {paper.totalQuestions} Questions Total
                          </p>
                        </div>

                        <div className="mt-8 flex gap-3 text-[10px] font-black uppercase text-ink-subtle">
                          <div className="px-3 py-1.5 bg-surface rounded-lg border border-line">
                            RW: {paper.rwQuestions}
                          </div>
                          <div className="px-3 py-1.5 bg-surface rounded-lg border border-line">
                            Math: {paper.mathQuestions}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-line relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 group-hover:text-ink transition-colors flex items-center gap-1">
                          Solve Test <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Mode Selection */}
        {phase === "modes" && selectedPaper && (
          <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-16 md:py-20 relative z-10">
            <Button
              onClick={() => { setPhase("list"); setSelectedPaper(null); }}
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-subtle hover:text-ink p-0 mb-12 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back to papers list
            </Button>

            <header className="mb-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1] mb-3">
                {selectedPaper.test_period}
              </h2>
              <p className="text-sm text-ink-muted font-medium">
                {selectedPaper.test_version || "Standard A"} · {selectedPaper.totalQuestions} вопросов
              </p>
            </header>

            {error && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl mb-8 font-bold text-sm">
                {error}
              </div>
            )}

            {/* Выбор модуля. Настоящий тест — это четыре отдельных модуля со
                своим таймингом, и готовятся обычно по одному. Секции
                разделены: смешивать Reading & Writing с математикой в одной
                сетке значит заставлять читать подписи, чтобы понять, что
                перед тобой. */}
            <section className="mb-12">
              {modulesLoading ? (
                <div className="glass-3d p-8 flex items-center gap-4">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold text-ink-muted">Загружаю вопросы теста…</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className={`w-full glass-3d px-7 py-6 mb-8 flex items-center justify-between gap-6 text-left transition-all ${
                      selectedModule === null
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "hover:border-line-strong"
                    }`}
                  >
                    <div>
                      <div className="text-base font-black tracking-tight mb-0.5">Весь тест целиком</div>
                      <div className="text-sm text-ink-muted font-medium">
                        {modules.reduce((n, m) => n + m.questions.length, 0) || selectedPaper.totalQuestions} вопросов
                        {modules.length > 0 &&
                          ` · ${Math.round(modules.reduce((n, m) => n + m.minutes, 0) / 60 * 10) / 10} ч`}
                      </div>
                    </div>
                    {selectedModule === null && (
                      <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    )}
                  </button>

                  {(["RW", "Math"] as const).map((section) => {
                    const list = modules.filter((m) => m.section === section);
                    if (list.length === 0) return null;
                    const accent =
                      section === "RW"
                        ? { dot: "bg-indigo-500", ring: "ring-indigo-500/20", border: "border-indigo-500" }
                        : { dot: "bg-emerald-500", ring: "ring-emerald-500/20", border: "border-emerald-500" };
                    return (
                      <div key={section} className="mb-8 last:mb-0">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-ink-muted">
                            {section === "RW" ? "Reading & Writing" : "Math"}
                          </h4>
                          <span className="text-xs text-ink-subtle font-medium">
                            {list.length} {list.length === 1 ? "модуль" : "модуля"}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          {list.map((m) => {
                            const active = selectedModule?.key === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => setSelectedModule(m)}
                                className={`glass-3d px-6 py-5 text-left transition-all ${
                                  active ? `${accent.border} ring-2 ${accent.ring}` : "hover:border-line-strong"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-black tracking-tight mb-1">
                                      Модуль {m.index}
                                    </div>
                                    <div className="text-sm text-ink-muted font-medium tabular-nums">
                                      {m.questions.length} вопросов · {m.minutes} мин
                                    </div>
                                  </div>
                                  {active && <Check className={`w-4 h-4 shrink-0 ${
                                    section === "RW" ? "text-indigo-500" : "text-emerald-500"
                                  }`} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {!modulesLoading && modules.length === 0 && (
                <p className="text-sm text-ink-subtle font-medium">
                  Модули не определились — в вопросах нет номеров. Тест можно решить целиком.
                </p>
              )}
            </section>

            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-ink-subtle mb-6">
              Как решаем
              {selectedModule && (
                <span className="ml-2 text-indigo-500 normal-case tracking-normal font-bold">
                  {selectedModule.label}
                </span>
              )}
            </h3>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Exam Mode */}
              <motion.div
                whileHover={{ y: -6 }}
                onClick={() => handleStartSession("exam")}
                className="glass-3d p-12 cursor-pointer border-indigo-500/15 hover:border-indigo-500/50 bg-indigo-500/[0.02] flex flex-col justify-between min-h-[380px] group transition-all"
              >
                <div>
                  <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center mb-10 text-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-500">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-4 uppercase italic">Exam Mode</h3>
                  <p className="text-sm text-ink-muted leading-relaxed font-medium">
                    Настоящий тайминг экзамена: {selectedModule
                      ? `${selectedModule.minutes} минут на ${selectedModule.questions.length} вопросов`
                      : "каждый модуль отсчитывается отдельно, как в Bluebook"}. После отправки модуля вернуться к нему нельзя; ответы проверяются в конце.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-black uppercase text-[10px] text-indigo-400 mt-10">
                  Initiate Exam <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Practice Mode */}
              <motion.div
                whileHover={{ y: -6 }}
                onClick={() => handleStartSession("practice")}
                className="glass-3d p-12 cursor-pointer border-emerald-500/15 hover:border-emerald-500/50 bg-emerald-500/[0.02] flex flex-col justify-between min-h-[380px] group transition-all"
              >
                <div>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mb-10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-500">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-4 uppercase italic">Practice Mode</h3>
                  <p className="text-sm text-ink-muted leading-relaxed font-medium">
                    Без таймера, в своём темпе. После каждого ответа сразу видно, верно или нет, и объяснение. Между вопросами можно свободно ходить туда-обратно.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-black uppercase text-[10px] text-emerald-400 mt-10">
                  Start Practice <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Phase 3: Active Test Session (Question Runner) */}
        {phase === "session" && questions.length > 0 && (
          <div className="min-h-screen bg-transparent relative overflow-hidden flex flex-col">

            {/* Bluebook-style question menu */}
            {isQuestionMenuOpen && (
              <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsQuestionMenuOpen(false)}>
                <div className="w-full max-w-2xl rounded-3xl border border-line bg-canvas shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-between px-7 py-5 border-b border-line bg-surface">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Question Menu</p>
                      <h3 className="text-lg font-black mt-1">{hereSubject} · Module {here.module?.index || 1}</h3>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setIsQuestionMenuOpen(false)} aria-label="Close question menu"><X className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-7">
                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                      {currentModuleIndexes.map((index) => {
                        const question = questions[index];
                        const answer = userAnswers[question.id];
                        const answered = question.isFreeResponse ? !!answer?.text?.trim() : answer?.selected !== undefined;
                        const marked = markedQuestions.has(question.id);
                        return (
                          <button
                            key={question.id}
                            onClick={() => goToQuestion(index)}
                            className={`relative h-12 rounded-xl border text-sm font-black transition-all ${
                              index === currentIdx
                                ? "bg-indigo-600 border-indigo-500 text-white ring-2 ring-indigo-400/30"
                                : answered
                                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                                : "bg-surface border-line text-ink hover:border-indigo-400"
                            }`}
                          >
                            {index - currentModuleStart + 1}
                            {marked && <Bookmark className="absolute -right-1.5 -top-1.5 w-4 h-4 fill-amber-400 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-5 mt-7 pt-5 border-t border-line text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500/15 border border-indigo-500/40" /> Answered</span>
                      <span className="flex items-center gap-2"><Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> For review</span>
                      <span>{currentModuleIndexes.filter((index) => {
                        const q = questions[index];
                        const a = userAnswers[q.id];
                        return q.isFreeResponse ? !!a?.text?.trim() : a?.selected !== undefined;
                      }).length} of {currentModuleIndexes.length} answered</span>
                    </div>
                    {!isReviewMode && mode === "exam" && (
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={advanceModule}
                          className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-7 font-black uppercase text-[10px] tracking-widest"
                        >
                          {currentModuleEnd < questions.length - 1 ? "Submit module" : "Submit test"}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Math reference sheet */}
            {isReferenceOpen && (
              <div className="fixed inset-0 z-[115] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsReferenceOpen(false)}>
                <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border border-line bg-canvas shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="sticky top-0 flex items-center justify-between px-7 py-5 border-b border-line bg-canvas/95 backdrop-blur z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Math Reference</p>
                      <h3 className="text-xl font-black mt-1">Common SAT formulas</h3>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setIsReferenceOpen(false)} aria-label="Close reference sheet"><X className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-7 grid md:grid-cols-2 gap-4 text-sm">
                    {[
                      ["Circle", "A = πr² · C = 2πr"],
                      ["Rectangle", "A = lw"],
                      ["Triangle", "A = ½bh"],
                      ["Pythagorean theorem", "a² + b² = c²"],
                      ["Rectangular prism", "V = lwh"],
                      ["Cylinder", "V = πr²h"],
                      ["Sphere", "V = ⁴⁄₃πr³"],
                      ["Cone", "V = ⅓πr²h"],
                      ["Special right triangles", "45°–45°–90°: x, x, x√2"],
                      ["Special right triangles", "30°–60°–90°: x, x√3, 2x"],
                      ["Degrees in a circle", "360° · 2π radians"],
                      ["Arc length", "s = rθ (θ in radians)"],
                    ].map(([label, formula], index) => (
                      <div key={`${label}-${index}`} className="rounded-2xl border border-line bg-surface p-5">
                        <p className="text-[9px] uppercase tracking-widest font-black text-ink-muted mb-2">{label}</p>
                        <p className="text-lg font-semibold">{formula}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Desmos Sidebar Modal */}
            {isDesmosOpen && (
              <div className="fixed inset-y-0 right-0 w-[600px] z-[100] bg-canvas border-l border-line shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Desmos Graphing Calculator</span>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
                </div>
                <iframe src="https://www.desmos.com/testing/cb-digital-sat/graphing" className="w-full h-[calc(100%-60px)] border-0" />
              </div>
            )}

            <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1 overflow-hidden">
              
              {/* Header Details */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (isReviewMode) {
                      setPhase("results");
                    } else {
                      setPhase("modes");
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-ink-subtle hover:text-ink"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> {isReviewMode ? "Back to Results" : "Exit Session"}
                </Button>

                {/* Info HUD */}
                <div className="flex items-center gap-8 bg-surface px-8 py-3 rounded-2xl border border-line">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                      {here.module ? `Модуль ${here.module.index}` : "Раздел"}
                    </p>
                    <p className="text-xs font-black uppercase">{hereSubject}</p>
                  </div>
                  <div className="w-px h-8 bg-surface-2" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-ink-muted uppercase tracking-widest mb-1">Вопрос</p>
                    <p className="text-sm font-black">
                      {here.local + 1} из {here.total}
                      {!selectedModule && sessionModules.length > 1 && (
                        <span className="text-ink-subtle font-bold"> · {currentIdx + 1}/{questions.length} всего</span>
                      )}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-surface-2" />
                  <button
                    type="button"
                    onClick={() => setIsTimerHidden((value) => !value)}
                    className="text-center min-w-[92px] group"
                    title="Hide or show timer (Ctrl+Alt+T)"
                  >
                    <p className="text-[8px] font-black text-ink-muted uppercase tracking-widest mb-1">
                      {isReviewMode ? "Session Mode" : (mode === "exam" ? "Time Remaining" : "Time Elapsed")}
                    </p>
                    <p className="text-sm font-black font-mono flex items-center justify-center gap-2">
                      {isReviewMode ? (
                        <span className="text-indigo-400">Review Mode</span>
                      ) : isTimerHidden && timeRemaining > 5 * 60 ? (
                        <><EyeOff className="w-4 h-4" /><span>Hidden</span></>
                      ) : (
                        mode === "exam" ? formatTime(timeRemaining) : formatTime(elapsed)
                      )}
                    </p>
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsQuestionMenuOpen(true)}
                    className="bg-surface border border-line text-ink hover:bg-surface-2 px-4 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    title="Question menu (Ctrl+Alt+G)"
                  >
                    <Menu className="w-4 h-4" /> Questions
                  </Button>
                  <Button 
                    onClick={highlightSelectedText} 
                    className="bg-surface border border-line text-ink hover:bg-surface-2 px-4 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                  >
                    <Highlighter className="w-4 h-4 text-yellow-400" /> Highlight
                  </Button>

                  {questions[currentIdx]?.section === "Math" && (
                    <>
                      <Button
                        onClick={() => setIsReferenceOpen(true)}
                        className="bg-surface border border-line text-ink hover:bg-surface-2 px-4 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                        title="Reference sheet (Ctrl+Alt+R)"
                      >
                        <BookOpen className="w-4 h-4" /> Reference
                      </Button>
                      <Button 
                        onClick={() => setIsDesmosOpen(!isDesmosOpen)} 
                        className="bg-surface border border-line text-ink hover:bg-surface-2 px-4 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                        title="Calculator (Ctrl+Alt+C)"
                      >
                        <Calculator className="w-4 h-4" /> Desmos
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="bg-surface border border-line text-ink hover:bg-surface-2 w-12 h-12 rounded-xl font-black flex items-center justify-center p-0"
                  >
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </Button>
                </div>
              </div>

              {!isReviewMode && (
                <div className="flex items-center justify-between mb-4 shrink-0 rounded-2xl border border-line bg-surface/70 px-5 py-3">
                  <button
                    type="button"
                    onClick={toggleMarked}
                    className={`flex items-center gap-2 text-xs font-black transition-colors ${markedQuestions.has(currentQuestion?.id) ? "text-amber-400" : "text-ink-muted hover:text-ink"}`}
                    title="Mark for review (Ctrl+Alt+V)"
                  >
                    <Bookmark className={`w-5 h-5 ${markedQuestions.has(currentQuestion?.id) ? "fill-amber-400" : ""}`} />
                    Mark for Review
                  </button>
                  <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-wider hidden sm:block">
                    Select text to highlight · Use the strike button to eliminate choices
                  </p>
                </div>
              )}

              {/* Main Content Arena */}
              {hasRealPassage ? (
                // Split-pane layout for questions with passage
                <div className="flex-1 overflow-hidden mb-6 flex">
                  <ResizablePanelGroup direction="horizontal" className="flex-1 w-full min-h-0">
                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-6 h-full mr-2">
                        <div className="flex items-center gap-2 mb-2 opacity-30">
                          <FileText className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Passage</span>
                        </div>
                        <div className="reading-text text-ink whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderKatexText(questions[currentIdx].passage || "") }} />
                      </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-[6px] hover:bg-indigo-500/50 bg-surface-2 transition-colors cursor-col-resize rounded-full" />

                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full pl-2">
                        <div className="glass-3d p-8 flex flex-col gap-6 mb-2">
                          {questions[currentIdx]?.imageUrl && (
                            <div className="my-2 p-6 bg-white rounded-2xl border border-slate-200 flex justify-center items-center max-w-md mx-auto shadow-sm">
                              <QuestionImage src={questions[currentIdx].imageUrl} className="max-h-[260px] object-contain" />
                            </div>
                          )}
                          <div className="text-lg font-bold leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: renderKatexText(questions[currentIdx]?.question || "") }} />
                        </div>

                        {/* Answers block */}
                        {renderAnswerSection()}
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              ) : (
                // Full screen layout for questions without passage
                <div className="flex-1 overflow-hidden grid lg:grid-cols-2 gap-8 mb-6">
                  <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    {questions[currentIdx]?.imageUrl && (
                      <div className="my-2 p-6 bg-white rounded-2xl border border-slate-200 flex justify-center items-center max-w-md mx-auto shadow-sm">
                        <QuestionImage src={questions[currentIdx].imageUrl} className="max-h-[260px] object-contain" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2 opacity-30">
                      <Brain className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Question</span>
                    </div>
                    <div className="text-lg font-bold leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: renderKatexText(questions[currentIdx]?.question || "") }} />
                  </div>

                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    {renderAnswerSection()}
                  </div>
                </div>
              )}

              {/* Bottom Test Navigator Grid / controls */}
              <div className="mt-auto pt-6 border-t border-line flex items-center justify-between shrink-0">
                <Button
                  onClick={prevQuestion}
                  disabled={currentIdx === (mode === "exam" ? currentModuleStart : 0)}
                  variant="ghost"
                  className="bg-surface border border-line text-ink hover:bg-surface-2 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-35"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                {/* Exam mode answers grid */}
                {!isReviewMode && mode === "exam" && (
                  <div className="hidden md:flex gap-1.5 max-w-[50%] overflow-x-auto py-1">
                    {currentModuleIndexes.map((idx) => {
                      const q = questions[idx];
                      const isAnswered = userAnswers[q.id]?.selected !== undefined || userAnswers[q.id]?.text;
                      const isCurrent = idx === currentIdx;
                      const isMarked = markedQuestions.has(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentIdx(idx);
                            setFreeResponseInput(userAnswers[q.id]?.text || "");
                          }}
                          className={`relative w-9 h-9 rounded-lg font-bold text-xs border flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-indigo-500 border-indigo-400 text-ink shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                              : isAnswered
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                              : "bg-surface border-line text-ink-muted hover:border-line"
                          }`}
                        >
                          {idx - currentModuleStart + 1}
                          {isMarked && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-canvas" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Complete / Next controls */}
                {isReviewMode ? (
                  <Button
                    onClick={() => {
                      if (currentIdx < questions.length - 1) {
                        nextQuestion();
                      } else {
                        setPhase("results");
                      }
                    }}
                    className="bg-white text-black hover:bg-gray-100 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    {currentIdx < questions.length - 1 ? "Next Review" : "End Review"} <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  mode === "exam" ? (
                    currentIdx === currentModuleEnd ? (
                      <Button
                        onClick={() => setIsQuestionMenuOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-2xl"
                      >
                        Review module <ListChecks className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        className="bg-white text-black hover:bg-gray-100 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </Button>
                    )
                  ) : (
                    // Practice mode
                    <Button
                      onClick={nextQuestion}
                      className="bg-white text-black hover:bg-gray-100 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest"
                    >
                      {currentIdx === questions.length - 1 ? "Complete practice" : "Next"} <ChevronRight className="w-4 h-4" />
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: Results Feedback Display */}
        {phase === "results" && selectedPaper && (
          <div className="min-h-screen bg-transparent pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto text-center relative z-10 w-full">
              
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Trophy className="w-10 h-10" />
                </div>
              </div>

              <h1 className="text-7xl font-black text-shimmer leading-none mb-4 uppercase italic tracking-tighter">
                Test Completed.
              </h1>
              <p className="text-sm font-black text-ink-muted uppercase tracking-widest mb-16">
                {selectedPaper.test_period} • {mode === "exam" ? "Exam Mode" : "Practice Mode"} Results
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                
                {/* Accuracy */}
                <div className="glass-3d p-10 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy Index</div>
                  <div className="text-7xl font-black tracking-tighter mb-4">
                    {stats.scorePercent}%
                  </div>
                  <div className="text-xs font-bold text-ink-subtle uppercase tracking-widest">
                    Of scored questions
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Correct Responses</div>
                  <div className="text-5xl font-black text-emerald-400 mb-2">{stats.correct}</div>
                  <div className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Questions</div>
                </div>

                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Incorrect / Skipped</div>
                  <div className="text-5xl font-black text-rose-400 mb-2">{stats.incorrect + stats.skipped}</div>
                  <div className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">{stats.skipped} Skipped</div>
                </div>

                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-ink-muted uppercase tracking-widest mb-4">Unscored (No Answer)</div>
                  <div className="text-5xl font-black text-ink-muted mb-2">{stats.unscored}</div>
                  <div className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Skipped from score</div>
                </div>
              </div>

              {/* Review Test Grid */}
              <div className="glass-3d p-12 text-left mb-12">
                <div className="flex items-center gap-3 mb-8">
                  <Brain className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-2xl font-black uppercase tracking-tight">Review questions</h3>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-3">
                  {questions.map((q, idx) => {
                    const ans = userAnswers[q.id];
                    const emptyAnswer = isQuestionAnswerEmpty(q);
                    
                    let bgClass = "bg-surface border-line text-ink-muted hover:bg-surface-2";
                    if (emptyAnswer) {
                      bgClass = "bg-surface-2 border-white/15 text-ink hover:bg-surface-2";
                    } else if (ans?.isCorrect) {
                      bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
                    } else if (ans && !ans.isCorrect) {
                      bgClass = "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleReviewQuestion(idx)}
                        className={`w-12 h-12 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center relative ${bgClass}`}
                        title={emptyAnswer ? "Unscored - Answer not available in DB" : (ans?.isCorrect ? "Correct" : "Incorrect")}
                      >
                        <span>{idx + 1}</span>
                        {emptyAnswer && (
                          <span className="absolute bottom-1 text-[7px] text-ink-muted uppercase scale-75">N/A</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex gap-6 justify-center">
                <Button 
                  onClick={() => {
                    setPhase("modes");
                    setUserAnswers({});
                    setElapsed(0);
                    setTimeRemaining(134 * 60);
                  }} 
                  variant="outline" 
                  className="h-18 px-12 rounded-2xl border-line text-ink font-black uppercase text-xs flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restart Test
                </Button>
                
                <Button 
                  onClick={() => {
                    setPhase("list");
                    setSelectedPaper(null);
                    setQuestions([]);
                  }} 
                  className="h-18 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs shadow-2xl hover:bg-indigo-500 hover:text-white transition-colors"
                >
                  Exit past papers
                </Button>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );

  // Render question answers (MCQ or Open) depending on state (Practice/Exam/Review)
  function renderAnswerSection() {
    const q = questions[currentIdx];
    if (!q) return null;

    const emptyAnswer = isQuestionAnswerEmpty(q);
    const ans = userAnswers[q.id];

    // If answer is empty in DB:
    // In Practice Mode: display "Answer not available" banner
    // In Review Mode: display "Answer not available" explanation
    // In Exam Mode: user can still select/type, but it won't grade them. Let's make sure it is handled.
    if (emptyAnswer && (mode === "practice" || isReviewMode)) {
      return (
        <div className="glass-3d p-10 flex flex-col items-center justify-center text-center gap-4 border-amber-500/10 bg-amber-500/5">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <h4 className="text-sm font-black uppercase tracking-widest text-amber-400">Answer not available</h4>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
            The correct answer for this question is not stored in the database. This question will not be scored.
          </p>
        </div>
      );
    }

    if (isReviewMode) {
      // Review Mode rendering
      return (
        <div className="flex flex-col gap-6">
          <div className="glass-3d p-8">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Review Session</h4>
            
            {q.isFreeResponse ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-line bg-surface text-sm">
                  <span className="font-semibold text-ink-muted">Your Response: </span>
                  <span className="font-bold text-ink ml-2">"{ans?.text || "No Response"}"</span>
                </div>
                <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-400">
                  <span className="font-semibold">Correct Answer: </span>
                  <span className="font-bold ml-2">"{q.correctAnswerText}"</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isUserSelection = ans?.selected === i;
                  const isCorrectOption = i === q.correctAnswer;
                  
                  let borderClass = "border-line";
                  let bgClass = "bg-surface";
                  let textClass = "text-ink-muted";

                  if (isCorrectOption) {
                    borderClass = "border-emerald-500";
                    bgClass = "bg-emerald-500/10";
                    textClass = "text-emerald-400";
                  } else if (isUserSelection && !ans.isCorrect) {
                    borderClass = "border-rose-500";
                    bgClass = "bg-rose-500/10";
                    textClass = "text-rose-400";
                  }

                  return (
                    <div key={i} className={`p-5 rounded-xl border ${borderClass} ${bgClass} ${textClass} flex items-center gap-4 text-sm`}>
                      <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center font-bold">
                        {letter}
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: renderKatexText(opt) }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Explanation block */}
          <div className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mastery Explanation</h4>
            </div>
            <div className="text-ink font-medium text-sm block leading-relaxed" dangerouslySetInnerHTML={{ __html: renderKatexText(q.explanation || "No explanation provided.") }} />
          </div>
        </div>
      );
    }

    if (mode === "practice") {
      // Practice mode rendering with immediate feedback
      return (
        <div className="flex flex-col gap-4">
          {q.isFreeResponse ? (
            <div className="glass-3d p-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Student-Produced Response</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={freeResponseInput}
                  onChange={(e) => setFreeResponseInput(e.target.value)}
                  disabled={answerConfirmed}
                  placeholder="Type answer here..."
                  className="flex-1 px-6 h-16 bg-surface border border-line rounded-xl text-lg font-bold text-ink focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <Button
                  onClick={handlePracticeOpenConfirm}
                  disabled={answerConfirmed || !freeResponseInput.trim()}
                  className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 h-16 px-10 rounded-xl font-black uppercase text-xs tracking-widest"
                >
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            // MCQ choices
            <div className="flex flex-col gap-4">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = ans?.selected === i;
                const isCorrectOption = i === q.correctAnswer;
                
                let btnClass = "glass-3d p-6 text-left transition-all flex items-center gap-6 border-line hover:border-line-strong hover:bg-surface";
                let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line-strong text-sm font-bold";

                if (answerConfirmed) {
                  if (isCorrectOption) {
                    btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-emerald-500 bg-emerald-500/10 text-emerald-400";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-ink text-sm font-bold border-emerald-500";
                  } else if (isSelected) {
                    btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-rose-500 bg-rose-500/10 text-rose-400";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 text-ink text-sm font-bold border-rose-500";
                  } else {
                    btnClass = "glass-3d p-6 text-left opacity-30 border-line cursor-default flex items-center gap-6";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line text-ink-subtle text-sm font-bold";
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={answerConfirmed}
                    onClick={() => handlePracticeConfirm(i)}
                    className={`group ${btnClass}`}
                  >
                    <div className={circleClass}>{letter}</div>
                    <div className="text-base font-medium flex-1" dangerouslySetInnerHTML={{ __html: renderKatexText(opt) }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation panel appears after answer confirmed */}
          <AnimatePresence>
            {answerConfirmed && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 mt-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">EXPLANATION</h4>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    practiceFeedback?.correct ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {practiceFeedback?.correct ? "Correct Choice" : "Incorrect Option"}
                  </span>
                </div>
                
                <div className="text-ink font-medium text-sm block leading-relaxed" dangerouslySetInnerHTML={{ __html: renderKatexText(q.explanation || "No explanation provided.") }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Exam mode rendering (no timing explanation, choices can be flipped back and forth)
    return (
      <div className="flex flex-col gap-4">
        {q.isFreeResponse ? (
          <div className="glass-3d p-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Student-Produced Response</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={freeResponseInput}
                onChange={(e) => {
                  setFreeResponseInput(e.target.value);
                  handleExamOpenSubmit(e.target.value);
                }}
                placeholder="Type answer here..."
                className="flex-1 px-6 h-16 bg-surface border border-line rounded-xl text-lg font-bold text-ink focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = ans?.selected === i;
              const isEliminated = (eliminatedOptions[q.id] || []).includes(i);
              
              let btnClass = "glass-3d p-6 text-left transition-all flex items-center gap-6 border-line hover:border-indigo-500/40 hover:bg-surface";
              let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line-strong text-sm font-bold text-ink group-hover:border-indigo-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5";

              if (isSelected) {
                btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-indigo-500 bg-indigo-500/10 text-indigo-400";
                circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 text-ink text-sm font-bold border-indigo-400";
              }

              return (
                <div
                  key={i}
                  className={`group relative ${btnClass} ${isEliminated ? "opacity-50" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleExamSelection(i)}
                    className="absolute inset-0 rounded-[inherit]"
                    aria-label={`Choose answer ${letter}`}
                  />
                  <div className={`${circleClass} relative pointer-events-none`}>{letter}</div>
                  <div className={`text-base font-medium flex-1 relative pointer-events-none ${isEliminated ? "line-through" : ""}`} dangerouslySetInnerHTML={{ __html: renderKatexText(opt) }} />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleEliminated(i);
                    }}
                    className={`relative z-10 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${isEliminated ? "border-rose-400/60 text-rose-400 bg-rose-500/10" : "border-line text-ink-subtle hover:text-ink hover:border-line-strong"}`}
                    title={`${isEliminated ? "Restore" : "Eliminate"} option ${letter}`}
                    aria-label={`${isEliminated ? "Restore" : "Eliminate"} answer ${letter}`}
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
