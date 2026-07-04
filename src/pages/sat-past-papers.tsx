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
  RotateCcw
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  fetchAvailablePastPapers,
  fetchPastPaperQuestions,
  SATQuestion,
  PastPaper
} from "@/lib/sat-questions-service";
import katex from "katex";
import "katex/dist/katex.min.css";
import { motion, AnimatePresence } from "framer-motion";

// High-fidelity fallback past papers & questions for local testing (since count = 0 in database)
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

  // Session states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [freeResponseInput, setFreeResponseInput] = useState("");
  const [elapsed, setElapsed] = useState(0); // practice stopwatch
  const [timeRemaining, setTimeRemaining] = useState(134 * 60); // 134 mins for exam mode
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  
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
              handleFinishTest();
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
      try {
        const data = await fetchAvailablePastPapers();
        if (data && data.length > 0) {
          setPastPapers(data);
        } else {
          // Fallback to mock papers if none exist in the database
          setPastPapers(MOCK_PAST_PAPERS);
        }
      } catch (err: any) {
        console.error("Failed to load past papers:", err);
        setPastPapers(MOCK_PAST_PAPERS);
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
  const handleSelectPaper = (paper: PastPaper) => {
    setSelectedPaper(paper);
    setPhase("modes");
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
      
      // Attempt DB load
      try {
        fetchedQuestions = await fetchPastPaperQuestions(selectedPaper.test_period, selectedPaper.test_version);
      } catch (e) {
        console.warn("DB question load failed, using mocks:", e);
      }

      // Fallback if db returned empty or failed
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        fetchedQuestions = MOCK_QUESTIONS[key] || [];
      }

      if (fetchedQuestions.length === 0) {
        throw new Error("No questions available for this test paper.");
      }

      setQuestions(fetchedQuestions);
      setPhase("session");
      setCurrentIdx(0);
      setUserAnswers({});
      setFreeResponseInput("");
      setElapsed(0);
      setTimeRemaining(134 * 60);
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
      processed = processed.replace(/\$([\s\S]+?)\$/g, (_, math) => 
        katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
      );
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

  return (
    <Layout>
      <div className={`min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-white/10 ${theme === 'light' ? 'light-theme' : ''}`}>
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
          .light-theme .text-white {
            color: #0f172a !important;
          }
          .light-theme .text-white\\/80 {
            color: #334155 !important;
          }
          .light-theme .text-white\\/70 {
            color: #475569 !important;
          }
          .light-theme .text-white\\/60 {
            color: #475569 !important;
          }
          .light-theme .text-white\\/40 {
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
          .light-theme .hover\\:text-white:hover {
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
          <div className="max-w-[1300px] mx-auto px-10 py-32 relative z-10">
            <header className="mb-20">
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">SAT Section</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                PAST PAPERS.
              </h1>
              <p className="text-sm text-[#666] font-semibold max-w-xl">
                Solve authentic past Digital SAT exam modules by period with proper pacing, structure, and analytics.
              </p>
            </header>

            {loading ? (
              <div className="glass-3d p-16 flex flex-col items-center justify-center border-indigo-500/10 min-h-[300px]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest text-[#444] font-bold">Scanning database for papers...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastPapers.map((paper, idx) => {
                  const key = `${paper.test_period}-${paper.test_version}`;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ y: -8, scale: 1.01 }}
                      className="glass-3d p-10 flex flex-col justify-between min-h-[320px] cursor-pointer border-white/5 hover:border-indigo-500/40 transition-all relative overflow-hidden group"
                      onClick={() => handleSelectPaper(paper)}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-8">
                            <span className="px-3.5 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[9px] font-black tracking-widest uppercase text-indigo-400">
                              Real Exam
                            </span>
                            <span className="text-xs font-black text-white/40 uppercase">
                              {paper.test_version || "Standard"}
                            </span>
                          </div>
                          
                          <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                            {paper.test_period}
                          </h3>
                          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                            {paper.totalQuestions} Questions Total
                          </p>
                        </div>

                        <div className="mt-8 flex gap-3 text-[10px] font-black uppercase text-white/30">
                          <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                            RW: {paper.rwQuestions}
                          </div>
                          <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                            Math: {paper.mathQuestions}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 group-hover:text-white transition-colors flex items-center gap-1">
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
          <div className="max-w-[1000px] mx-auto px-10 py-32 relative z-10">
            <Button
              onClick={() => { setPhase("list"); setSelectedPaper(null); }}
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444] hover:text-white p-0 mb-12 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back to papers list
            </Button>

            <header className="mb-16">
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-4">
                {selectedPaper.test_period}
              </h2>
              <p className="text-sm text-[#666] font-semibold uppercase tracking-widest">
                Version: {selectedPaper.test_version || "Standard A"} • {selectedPaper.totalQuestions} Questions
              </p>
            </header>

            {error && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl mb-8 font-bold text-sm">
                {error}
              </div>
            )}

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
                  <p className="text-sm text-[#666] leading-relaxed font-medium">
                    Experience a simulated test environment. A single countdown of 134 minutes limits the entire session. Answers are graded at the very end.
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
                  <p className="text-sm text-[#666] leading-relaxed font-medium">
                    Solve questions untimed at your own pace. Receive instant explanations and correctness feedback after each response. Navigate back and forth freely.
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
            
            {/* Desmos Sidebar Modal */}
            {isDesmosOpen && (
              <div className="fixed inset-y-0 right-0 w-[600px] z-[100] bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
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
                  className="text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> {isReviewMode ? "Back to Results" : "Exit Session"}
                </Button>

                {/* Info HUD */}
                <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subject</p>
                    <p className="text-xs font-black uppercase">{questions[currentIdx]?.section === "RW" ? "Reading & Writing" : "Mathematics"}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Question</p>
                    <p className="text-sm font-black">{currentIdx + 1} of {questions.length}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">
                      {isReviewMode ? "Session Mode" : (mode === "exam" ? "Time Remaining" : "Time Elapsed")}
                    </p>
                    <p className="text-sm font-black font-mono">
                      {isReviewMode ? (
                        <span className="text-indigo-400">Review Mode</span>
                      ) : (
                        mode === "exam" ? formatTime(timeRemaining) : formatTime(elapsed)
                      )}
                    </p>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={highlightSelectedText} 
                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                  >
                    <Highlighter className="w-4 h-4 text-yellow-400" /> Highlight
                  </Button>

                  {questions[currentIdx]?.section === "Math" && (
                    <Button 
                      onClick={() => setIsDesmosOpen(!isDesmosOpen)} 
                      className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4" /> Desmos
                    </Button>
                  )}

                  <Button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10 w-12 h-12 rounded-xl font-black flex items-center justify-center p-0"
                  >
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </Button>
                </div>
              </div>

              {/* Main Content Arena */}
              {questions[currentIdx]?.passage ? (
                // Split-pane layout for questions with passage
                <div className="flex-1 overflow-hidden mb-6 flex">
                  <ResizablePanelGroup direction="horizontal" className="flex-1 w-full min-h-0">
                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-6 h-full mr-2">
                        <div className="flex items-center gap-2 mb-2 opacity-30">
                          <FileText className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Passage</span>
                        </div>
                        <p className="text-base leading-relaxed font-medium text-white/80">{questions[currentIdx].passage}</p>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-[6px] hover:bg-indigo-500/50 bg-white/10 transition-colors cursor-col-resize rounded-full" />

                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full pl-2">
                        <div className="glass-3d p-8 flex flex-col gap-6 mb-2">
                          {questions[currentIdx]?.imageUrl && (
                            <div className="my-2 p-6 bg-white rounded-2xl border border-slate-200 flex justify-center items-center max-w-md mx-auto shadow-sm">
                              <img src={questions[currentIdx].imageUrl} alt="Question visual" className="max-h-[260px] object-contain" />
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
                        <img src={questions[currentIdx].imageUrl} alt="Question visual" className="max-h-[260px] object-contain" />
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
              <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between shrink-0">
                <Button
                  onClick={prevQuestion}
                  disabled={currentIdx === 0}
                  variant="ghost"
                  className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-35"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                {/* Exam mode answers grid */}
                {!isReviewMode && mode === "exam" && (
                  <div className="hidden md:flex gap-1.5 max-w-[50%] overflow-x-auto py-1">
                    {questions.map((q, idx) => {
                      const isAnswered = userAnswers[q.id]?.selected !== undefined || userAnswers[q.id]?.text;
                      const isCurrent = idx === currentIdx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentIdx(idx);
                            setFreeResponseInput(userAnswers[q.id]?.text || "");
                          }}
                          className={`w-9 h-9 rounded-lg font-bold text-xs border flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                              : isAnswered
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                              : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                          }`}
                        >
                          {idx + 1}
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
                    currentIdx === questions.length - 1 ? (
                      <Button
                        onClick={handleFinishTest}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-2xl"
                      >
                        Submit Test <Check className="w-4 h-4" />
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
              <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-16">
                {selectedPaper.test_period} • {mode === "exam" ? "Exam Mode" : "Practice Mode"} Results
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                
                {/* Accuracy */}
                <div className="glass-3d p-10 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy Index</div>
                  <div className="text-7xl font-black tracking-tighter mb-4">
                    {stats.scorePercent}%
                  </div>
                  <div className="text-xs font-bold text-white/20 uppercase tracking-widest">
                    Of scored questions
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Correct Responses</div>
                  <div className="text-5xl font-black text-emerald-400 mb-2">{stats.correct}</div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Questions</div>
                </div>

                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Incorrect / Skipped</div>
                  <div className="text-5xl font-black text-rose-400 mb-2">{stats.incorrect + stats.skipped}</div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{stats.skipped} Skipped</div>
                </div>

                <div className="glass-3d p-8 flex flex-col items-center justify-center">
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Unscored (No Answer)</div>
                  <div className="text-5xl font-black text-white/60 mb-2">{stats.unscored}</div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Skipped from score</div>
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
                    
                    let bgClass = "bg-white/5 border-white/5 text-white/60 hover:bg-white/10";
                    if (emptyAnswer) {
                      bgClass = "bg-white/10 border-white/15 text-white/80 hover:bg-white/20";
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
                          <span className="absolute bottom-1 text-[7px] text-white/40 uppercase scale-75">N/A</span>
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
                  className="h-18 px-12 rounded-2xl border-white/10 text-white font-black uppercase text-xs flex items-center gap-2"
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
          <p className="text-xs text-white/50 leading-relaxed max-w-sm">
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
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 text-sm">
                  <span className="font-semibold text-white/40">Your Response: </span>
                  <span className="font-bold text-white ml-2">"{ans?.text || "No Response"}"</span>
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
                  
                  let borderClass = "border-white/5";
                  let bgClass = "bg-white/5";
                  let textClass = "text-white/60";

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
            <div className="text-white/70 font-medium text-sm block leading-relaxed" dangerouslySetInnerHTML={{ __html: renderKatexText(q.explanation || "No explanation provided.") }} />
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
                  className="flex-1 px-6 h-16 bg-white/5 border border-white/10 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                
                let btnClass = "glass-3d p-6 text-left transition-all flex items-center gap-6 border-white/10 hover:border-white/20 hover:bg-white/[0.02]";
                let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-white/25 text-sm font-bold";

                if (answerConfirmed) {
                  if (isCorrectOption) {
                    btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-emerald-500 bg-emerald-500/10 text-emerald-400";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-white text-sm font-bold border-emerald-500";
                  } else if (isSelected) {
                    btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-rose-500 bg-rose-500/10 text-rose-400";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 text-white text-sm font-bold border-rose-500";
                  } else {
                    btnClass = "glass-3d p-6 text-left opacity-30 border-white/5 cursor-default flex items-center gap-6";
                    circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/30 text-sm font-bold";
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
                
                <div className="text-white/70 font-medium text-sm block leading-relaxed" dangerouslySetInnerHTML={{ __html: renderKatexText(q.explanation || "No explanation provided.") }} />
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
                className="flex-1 px-6 h-16 bg-white/5 border border-white/10 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = ans?.selected === i;
              
              let btnClass = "glass-3d p-6 text-left transition-all flex items-center gap-6 border-white/10 hover:border-indigo-500/40 hover:bg-white/5";
              let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-sm font-bold text-white/80 group-hover:border-indigo-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5";

              if (isSelected) {
                btnClass = "glass-3d p-6 text-left flex items-center gap-6 border-indigo-500 bg-indigo-500/10 text-indigo-400";
                circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 text-white text-sm font-bold border-indigo-400";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleExamSelection(i)}
                  className={`group ${btnClass}`}
                >
                  <div className={circleClass}>{letter}</div>
                  <div className="text-base font-medium flex-1" dangerouslySetInnerHTML={{ __html: renderKatexText(opt) }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
