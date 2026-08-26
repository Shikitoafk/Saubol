import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  FileText,
  Clock,
  Zap,
  Sparkles,
  Brain,
  History,
  TrendingUp,
  X,
  Calculator,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  CheckSquare,
  Square,
  Sun,
  Moon,
  Highlighter
  , Menu
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/lib/supabase";
import { saveSATAnswer } from "@/lib/progress-service";
import {
  fetchMathMCQQuestions,
  fetchMathOpenQuestions,
  fetchPracticeQuestions,
  fetchRWQuestions,
  inferRWDomain,
  RW_DOMAINS,
  SATQuestion,
} from "@/lib/sat-questions-service";
import { renderMathText } from "@/lib/render-math";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionImage } from "@/components/question-image";
import { QuestionPassage } from "@/components/question-passage";

interface SubtopicInfo {
  id: string;
  name: string;
  totalQuestions: number;
  solvedQuestions: number;
  accuracy: number;
}

interface DomainInfo {
  name: string;
  subtopics: SubtopicInfo[];
}

export default function SATPractice() {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<'RW' | 'Math' | null>(null);
  const [phase, setPhase] = useState<"bank" | "subtopics" | "quiz" | "results">("bank");
  const [currentSubtopic, setCurrentSubtopic] = useState<SubtopicInfo | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<any>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, any>>({});
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('sat-theme') as 'dark' | 'light') || 'light');
  const [freeResponseInput, setFreeResponseInput] = useState("");
  const [totalRwCount, setTotalRwCount] = useState(0);
  const [totalMathCount, setTotalMathCount] = useState(0);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankTopic, setBankTopic] = useState("All");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Dynamic user progress states populated with exact broad topic values from the database
  const [rwProgress, setRwProgress] = useState<DomainInfo[]>([
    {
      name: "Reading & Writing Domains",
      subtopics: [
        ...RW_DOMAINS.map(name => ({ id: name, name, totalQuestions: 0, solvedQuestions: 0, accuracy: 0 }))
      ]
    }
  ]);

  const [mathProgress, setMathProgress] = useState<DomainInfo[]>([
    {
      name: "Math Domains",
      subtopics: [
        { id: "Algebra", name: "Algebra", totalQuestions: 0, solvedQuestions: 0, accuracy: 0 },
        { id: "Advanced Math", name: "Advanced Math", totalQuestions: 0, solvedQuestions: 0, accuracy: 0 },
        { id: "Problem Solving and Data Analysis", name: "Problem Solving and Data Analysis", totalQuestions: 0, solvedQuestions: 0, accuracy: 0 },
        { id: "Geometry and Trigonometry", name: "Geometry and Trigonometry", totalQuestions: 0, solvedQuestions: 0, accuracy: 0 }
      ]
    }
  ]);

  // Save theme state
  useEffect(() => {
    localStorage.setItem('sat-theme', theme);
  }, [theme]);

  // Load actual user progress from Supabase and dynamic question counts
  useEffect(() => {
    const fetchCountsAndProgress = async () => {
      setBankLoading(true);
      setBankError(null);
      try {
        // Use the same fetchers as the quiz. This keeps the visible total in
        // sync with the actual playable pool after invalid legacy imports are
        // filtered out (for example, a graph question whose graph is absent).
        const [rwQuestions, mathMcqQuestions, mathOpenQuestions] = await Promise.all([
          fetchRWQuestions({ limit: 1000 }),
          fetchMathMCQQuestions({ limit: 1000 }),
          fetchMathOpenQuestions({ limit: 1000 }),
        ]);

        setTotalRwCount(rwQuestions.length);

        // 2. Fetch Math MCQ and Open counts by topic
        {
          const counts: Record<string, number> = {
            "Algebra": 0,
            "Advanced Math": 0,
            "Problem Solving and Data Analysis": 0,
            "Geometry and Trigonometry": 0
          };

          const canonicalTopic = (topic: string) => {
            if (
              topic === "Statistics" ||
              topic === "Statistics and Probability" ||
              topic === "Problem-Solving and Data Analysis"
            ) {
              return "Problem Solving and Data Analysis";
            }
            if (topic === "Geometry") return "Geometry and Trigonometry";
            return topic;
          };

          mathMcqQuestions.forEach((question) => {
            const topic = canonicalTopic(question.topic ?? "");
            if (topic && counts[topic] !== undefined) {
              counts[topic]++;
            }
          });

          mathOpenQuestions.forEach((question) => {
            const topic = canonicalTopic(question.topic ?? "");
            if (topic && counts[topic] !== undefined) {
              counts[topic]++;
            }
          });

          const mathSum = Object.values(counts).reduce((a, b) => a + b, 0);
          setTotalMathCount(mathSum);

          setMathProgress(prev => prev.map(dom => ({
            ...dom,
            subtopics: dom.subtopics.map(sub => {
              if (counts[sub.id] !== undefined) {
                return { ...sub, totalQuestions: counts[sub.id] };
              }
              return sub;
            })
          })));
        }

        const rwCounts = Object.fromEntries(RW_DOMAINS.map(domain => [domain, 0])) as Record<string, number>;
        rwQuestions.forEach((question) => {
          rwCounts[inferRWDomain(question.question)]++;
        });
        setRwProgress(prev => prev.map(domain => ({
          ...domain,
          subtopics: domain.subtopics.map(sub => ({ ...sub, totalQuestions: rwCounts[sub.id] ?? 0 })),
        })));

        // 3. Fetch user progress
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: progressRows } = await supabase
          .from('sat_progress')
          .select('*')
          .eq('user_id', session.user.id);

        if (progressRows && progressRows.length > 0) {
          const updateSubtopics = (domains: DomainInfo[]) => {
            return domains.map(dom => ({
              ...dom,
              subtopics: dom.subtopics.map(sub => {
                const match = progressRows.find(r => r.subtopic?.toLowerCase() === sub.id.toLowerCase() || r.subtopic?.toLowerCase() === sub.name.toLowerCase());
                if (match) {
                  return {
                    ...sub,
                    solvedQuestions: match.questions_attempted ?? 0,
                    accuracy: match.mastery_percent ?? 0
                  };
                }
                return sub;
              })
            }));
          };
          setRwProgress(prev => updateSubtopics(prev));
          setMathProgress(prev => updateSubtopics(prev));
        }
      } catch (err) {
        console.error("Failed to load progress or counts:", err);
        setBankError("Question Bank is temporarily unavailable. Please refresh and try again.");
      } finally {
        setBankLoading(false);
      }
    };
    fetchCountsAndProgress();
  }, []);

  // Timer simulation
  useEffect(() => {
    if (phase === "quiz") {
      const interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [phase]);

  // Fetch questions from Supabase for the selected subtopic
  const loadQuestionsForSubtopic = async (subtopicId: string, isMath: boolean): Promise<any[]> => {
    const section = isMath ? "Math" : "RW";
    const questions = await fetchPracticeQuestions(section, {
      subtopic: bankTopic !== "All" ? bankTopic : subtopicId,
      limit: 1000,
    });
    return questions;
  };

  const startPracticeForSubtopic = async (subtopic: SubtopicInfo) => {
    setCurrentSubtopic(subtopic);
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const loaded = await loadQuestionsForSubtopic(subtopic.id, selectedSection === 'Math');
      if (loaded.length === 0) {
        setQuestionsError("No questions found for this topic. Please try another.");
        setQuestionsLoading(false);
        return;
      }
      setQuestions(loaded);
      setPhase("quiz");
      setCurrentIdx(0);
      setElapsed(0);
      setSessionAnswers({});
      setAnswerState(null);
      setSelectedAnswer(null);
      setFreeResponseInput("");
    } catch (err: any) {
      console.error("Failed to load questions:", err);
      setQuestionsError(err?.message || "Failed to load questions. Please try again.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const startPracticeAll = async () => {
    const list = selectedSection === 'Math' ? mathProgress : rwProgress;
    const allSubtopics = list.flatMap(d => d.subtopics);
    const eligible = bankTopic === "All" ? allSubtopics : allSubtopics.filter(s => s.id === bankTopic);
    const randomSub = eligible[Math.floor(Math.random() * eligible.length)] ?? allSubtopics[0];
    await startPracticeForSubtopic(randomSub);
  };

  const selectAnswer = (idx: number) => {
    if (answerState) return;
    setSelectedAnswer(idx);
  };

  const checkSelectedAnswer = () => {
    if (answerState || selectedAnswer === null) return;
    const q = questions[currentIdx];
    const correct = selectedAnswer === q.correctAnswer;
    setAnswerState({ selected: selectedAnswer, correct });
    setSessionAnswers(prev => ({ ...prev, [q.id]: { correct } }));

    // Persist to Database via progress-service
    if (currentSubtopic) {
      saveSATAnswer(
        selectedSection === 'Math' ? "Math" : "RW",
        currentSubtopic.name,
        correct,
        { questionId: q.id, selectedAnswer: String.fromCharCode(65 + selectedAnswer), source: q.source }
      ).catch(console.error);
    }
  };

  const handleFreeResponseSubmit = () => {
    if (answerState || !freeResponseInput.trim()) return;
    const q = questions[currentIdx];
    const userAns = freeResponseInput.trim().toLowerCase();
    const correctAns = (q.correctAnswerText || "").trim().toLowerCase();
    const correct = userAns === correctAns;

    setAnswerState({ selected: -1, correct, input: freeResponseInput });
    setSessionAnswers(prev => ({ ...prev, [q.id]: { correct } }));

    if (currentSubtopic) {
      saveSATAnswer(
        "Math",
        currentSubtopic.name,
        correct,
        { questionId: q.id, selectedAnswer: freeResponseInput.trim(), source: q.source }
      ).catch(console.error);
    }
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

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswerState(null);
      setSelectedAnswer(null);
      setFreeResponseInput("");
      setIsQuestionListOpen(false);
    } else {
      // Endless practice: loop back to the first question
      setCurrentIdx(0);
      setAnswerState(null);
      setSelectedAnswer(null);
      setFreeResponseInput("");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

          /* Light theme overrides for options circular labels */
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

        {/* Floating Theme Toggle for Bank & Subtopic phases */}
        {(phase === "bank" || phase === "subtopics") && (
          <div className="absolute top-8 right-10 z-50">
            <Button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="bg-surface border border-line text-ink hover:bg-surface-2 w-12 h-12 rounded-xl flex items-center justify-center p-0"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </Button>
          </div>
        )}

        {/* Phase 1: High Fidelity Section Grid Selection Card */}
        {phase === "bank" && (
          <div className="max-w-[1300px] mx-auto px-10 py-32 relative z-10">
            <div className="flex items-center gap-3 mb-10 opacity-60">
              <Target className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">SAT Practice</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-20 leading-none">
              QUESTION <br /> BANK.
            </h1>

            {bankError && (
              <div className="mb-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 text-sm font-semibold text-rose-500">
                {bankError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-10">
              {/* Reading & Writing Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                className="glass-3d p-16 flex flex-col justify-between min-h-[460px] cursor-pointer border-indigo-500/10 hover:border-indigo-500/40 transition-all relative overflow-hidden group"
                onClick={() => { setSelectedSection('RW'); setBankTopic('All'); setPhase('subtopics'); }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-16">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-700">
                      <BookOpen className="w-10 h-10 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                    </div>
                  </div>
                  <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                    Reading & <br /> Writing
                  </h2>
                  <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-10">
                    {bankLoading ? "Loading questions..." : `${totalRwCount} questions`}
                  </p>
                </div>
                
                <div className="flex items-center justify-between relative z-10 mt-auto">
                  <span className="px-6 h-12 bg-white text-black hover:bg-gray-100 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Open <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>

              {/* Math Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                className="glass-3d p-16 flex flex-col justify-between min-h-[460px] cursor-pointer border-blue-500/10 hover:border-blue-500/40 transition-all relative overflow-hidden group"
                onClick={() => { setSelectedSection('Math'); setBankTopic('All'); setPhase('subtopics'); }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-16">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-700">
                      <Calculator className="w-10 h-10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                    </div>
                  </div>
                  <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                    Math
                  </h2>
                  <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-10">
                    {bankLoading ? "Loading questions..." : `${totalMathCount} questions`}
                  </p>
                </div>

                <div className="flex items-center justify-between relative z-10 mt-auto">
                  <span className="px-6 h-12 bg-white text-black hover:bg-gray-100 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Open <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Phase 2: Category & Subtopic Blueprint Listing */}
        {phase === "subtopics" && selectedSection && (
          <div className="max-w-[1200px] mx-auto px-10 py-24 relative z-10">
            <header className="mb-16">
              <Button 
                onClick={() => { setPhase('bank'); setSelectedSection(null); }}
                variant="ghost" 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-subtle hover:text-ink p-0 mb-6 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Question Bank
              </Button>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-4">
                {selectedSection === 'Math' ? 'MATH BANK' : 'READING & WRITING'}
              </h1>
              <p className="text-sm text-ink-muted font-semibold max-w-xl">
                Choose a specific domain and select a topic to solve adaptive blueprints.
              </p>
            </header>

            <section className="glass-3d mb-8 border-line p-5 md:p-6">
              <div className="flex flex-wrap items-end gap-4">
                <label className="grid gap-2 text-[10px] font-black uppercase tracking-widest text-ink-subtle">
                  Topic
                  <select value={bankTopic} onChange={event => setBankTopic(event.target.value)} className="h-11 min-w-48 rounded-lg border border-line bg-surface px-3 text-sm font-bold text-ink outline-none focus:border-indigo-400">
                    <option value="All">All topics</option>
                    {selectedSection === 'Math' && mathProgress.flatMap(domain => domain.subtopics).map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.name}</option>
                    ))}
                    {selectedSection === 'RW' && RW_DOMAINS.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
                <Button onClick={() => setBankTopic('All')} variant="ghost" className="h-11 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">
                  Reset
                </Button>
              </div>
            </section>

            {/* General Practice all Banner */}
            <div className="glass-3d p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/10 bg-indigo-500/5">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-ink mb-2">Practice all topics</h3>
                <p className="text-xs text-ink-muted font-bold uppercase tracking-widest">
                  Start practicing all {selectedSection === 'Math' ? '4 domains in Math' : 'domains in Reading & Writing'}.
                </p>
              </div>
              <Button 
                onClick={startPracticeAll}
                className="bg-white text-black hover:bg-gray-200 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest shrink-0"
              >
                Start practice
              </Button>
            </div>

            {/* Loading / Error Overlay */}
            {questionsLoading && (
              <div className="glass-3d p-8 mb-12 flex items-center justify-center gap-4 border-indigo-500/10 bg-indigo-500/5">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-ink-muted">Loading questions from database...</span>
              </div>
            )}
            {questionsError && (
              <div className="glass-3d p-8 mb-12 flex items-center justify-center gap-4 border-rose-500/10 bg-rose-500/5">
                <span className="text-sm font-bold text-rose-400">{questionsError}</span>
              </div>
            )}

            {/* Blueprint Domains & Subtopic Listing */}
            <div className="space-y-12">
              {(selectedSection === 'Math' ? mathProgress : rwProgress).map((domain, i) => (
                <div key={i} className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-ink-subtle">{domain.name}</h3>
                  <div className="glass-3d overflow-hidden border-line">
                    <div className="divide-y divide-white/5">
                      {domain.subtopics.map((sub, idx) => {
                        const solvedPercent = Math.round((sub.solvedQuestions / sub.totalQuestions) * 100);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => startPracticeForSubtopic(sub)}
                            className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-surface cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-4 min-w-[280px]">
                              <div className="w-5 h-5 rounded-md border border-line-strong flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                                {sub.solvedQuestions > 0 ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-surface-2 group-hover:bg-indigo-400/40" />
                                )}
                              </div>
                              <span className="text-sm font-bold text-ink group-hover:text-ink transition-colors">{sub.name}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-4 flex-1 max-w-xs w-full">
                              <div className="h-1.5 bg-surface rounded-full overflow-hidden flex-1">
                                <div className="h-full bg-indigo-500" style={{ width: `${solvedPercent}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest whitespace-nowrap">
                                {sub.solvedQuestions}/{sub.totalQuestions}
                              </span>
                            </div>

                            {/* Accuracy badge */}
                            <div className="min-w-[80px] text-right">
                              {sub.solvedQuestions > 0 ? (
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                  sub.accuracy >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                                  sub.accuracy >= 75 ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-rose-500/10 text-rose-400'
                                }`}>
                                  ● {sub.accuracy}%
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-ink-subtle uppercase tracking-widest">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Split-Screen Interactive Quiz Sandbox */}
        {phase === "quiz" && questions.length > 0 && (
          <div className="min-h-[calc(100dvh-4rem)] bg-transparent relative overflow-hidden flex flex-col test-focus">
            {isQuestionListOpen && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setIsQuestionListOpen(false)}>
                <div className="w-full max-w-xl rounded-2xl border border-line bg-canvas shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Question list</p><h3 className="mt-1 text-lg font-black">{currentSubtopic?.name || "Practice"}</h3></div>
                    <Button size="icon" variant="ghost" onClick={() => setIsQuestionListOpen(false)} aria-label="Close question list"><X className="h-5 w-5" /></Button>
                  </div>
                  <div className="p-6">
                    <div className="grid max-h-[55vh] grid-cols-6 gap-3 overflow-y-auto pr-1 sm:grid-cols-9">
                      {questions.map((question, index) => {
                        const result = sessionAnswers[question.id];
                        const state = index === currentIdx ? "border-indigo-500 bg-indigo-500 text-white" : result?.correct === true ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-500" : result?.correct === false ? "border-rose-400/50 bg-rose-500/10 text-rose-500" : "border-line bg-surface text-ink-muted hover:border-indigo-400";
                        return <button key={question.id} onClick={() => { setCurrentIdx(index); setAnswerState(null); setSelectedAnswer(null); setFreeResponseInput(""); setIsQuestionListOpen(false); }} className={`h-11 rounded-xl border text-sm font-black transition-colors ${state}`}>{index + 1}</button>;
                      })}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-[10px] font-bold uppercase tracking-wider text-ink-muted"><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded bg-emerald-500" />Correct</span><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded bg-rose-500" />Incorrect</span><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded border border-line bg-surface" />Unanswered</span></div>
                  </div>
                </div>
              </div>
            )}
            {isDesmosOpen && (
              <div className="fixed inset-y-0 right-0 w-[600px] z-[100] bg-canvas border-l border-line shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Desmos Calculator</span>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
                </div>
                <iframe src="https://www.desmos.com/testing/cb-digital-sat/graphing" className="w-full h-[calc(100%-60px)] border-0" />
              </div>
            )}

            <div className="max-w-none mx-auto w-full px-3 sm:px-6 pt-[4.5rem] pb-2 relative z-10 flex flex-col flex-1 overflow-hidden">
              {/* Diagnostic Top bar */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <Button 
                  variant="ghost" 
                  onClick={() => setPhase("subtopics")} 
                  className="text-[10px] font-black uppercase tracking-widest text-ink-subtle hover:text-ink"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Exit Session
                </Button>

                <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-line">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Topic</p>
                    <p className="text-xs font-black uppercase max-w-[200px] truncate">{currentSubtopic?.name}</p>
                  </div>
                  <div className="w-px h-8 bg-surface-2" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-ink-muted uppercase tracking-widest mb-1">Question</p>
                    <p className="text-sm font-black">{currentIdx + 1} of {questions.length}</p>
                  </div>
                  <div className="w-px h-8 bg-surface-2" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-ink-muted uppercase tracking-widest mb-1">Timer</p>
                    <p className="text-sm font-black font-mono">{formatTime(elapsed)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button onClick={() => setIsQuestionListOpen(true)} className="bg-surface border border-line text-ink hover:bg-surface-2 px-4 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2" title="Open question list">
                    <Menu className="w-4 h-4" /> Questions
                  </Button>
                  <Button 
                    onClick={highlightSelectedText} 
                    className="bg-surface border border-line text-ink hover:bg-surface-2 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    title="Highlight Selected Text"
                  >
                    <Highlighter className="w-4 h-4 text-yellow-400" /> Highlight
                  </Button>

                  {selectedSection === 'Math' && (
                    <Button 
                      onClick={() => setIsDesmosOpen(!isDesmosOpen)} 
                      className="bg-surface border border-line text-ink hover:bg-surface-2 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4" /> Desmos
                    </Button>
                  )}

                  <Button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="bg-surface border border-line text-ink hover:bg-surface-2 w-12 h-12 rounded-xl font-black flex items-center justify-center p-0"
                    title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                  >
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </Button>
                </div>
              </div>

              {/* Main Content Arena */}
              {questions[currentIdx]?.passage ? (
                <div className="flex-1 overflow-hidden mb-2 flex">
                  <ResizablePanelGroup direction="horizontal" className="flex-1 w-full min-h-0">
                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="glass-3d rounded-xl p-5 sm:p-7 overflow-y-auto custom-scrollbar flex flex-col gap-5 h-full mr-1">
                        <div className="flex items-center gap-2 mb-2 opacity-30">
                          <FileText className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Directions / Passage</span>
                        </div>
                        <QuestionPassage passage={questions[currentIdx].passage} />
                      </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-[6px] hover:bg-indigo-500/50 bg-surface-2 transition-colors cursor-col-resize rounded-full" />

                    <ResizablePanel defaultSize={50} minSize={25} maxSize={75} className="flex flex-col min-h-0">
                      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar h-full pl-1">
                        <div className="glass-3d rounded-xl p-5 sm:p-7 flex flex-col gap-4 mb-1">
                          {questions[currentIdx]?.imageUrl && (
                            <div className="my-2 p-6 bg-white rounded-2xl border border-slate-200 flex justify-center items-center max-w-md mx-auto shadow-sm">
                              <QuestionImage
                                src={questions[currentIdx].imageUrl}
                                className="max-h-[260px] object-contain"
                              />
                            </div>
                          )}
                          <div 
                            className="text-lg font-bold leading-relaxed tracking-tight" 
                            dangerouslySetInnerHTML={{ __html: renderMathText(questions[currentIdx]?.question || "") }}
                          />
                        </div>

                        {/* Options List */}
                        <div className="flex flex-col gap-3">
                          {questions[currentIdx]?.isFreeResponse ? (
                            <div className="glass-3d p-10 flex flex-col gap-6">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Student-Produced Response</h3>
                              </div>
                              <p className="text-xs text-ink-muted leading-relaxed">
                                Enter your answer in the box below. You can enter integers, decimals, or fractions.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                  type="text"
                                  value={freeResponseInput}
                                  onChange={(e) => setFreeResponseInput(e.target.value)}
                                  disabled={!!answerState}
                                  placeholder="Type your answer here..."
                                  className="flex-1 px-6 h-16 bg-surface border border-line rounded-xl text-lg font-bold text-ink placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleFreeResponseSubmit();
                                    }
                                  }}
                                />
                                <Button
                                  onClick={handleFreeResponseSubmit}
                                  disabled={!!answerState || !freeResponseInput.trim()}
                                  className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 h-16 px-10 rounded-xl font-black uppercase text-xs tracking-widest"
                                >
                                  Confirm
                                </Button>
                              </div>

                              {answerState && (
                                <div className={`mt-4 p-6 rounded-xl border flex items-center gap-4 ${
                                  answerState.correct
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                }`}>
                                  {answerState.correct ? (
                                    <>
                                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                                      <div>
                                        <p className="text-sm font-black uppercase tracking-widest">Correct Answer</p>
                                        <p className="text-xs opacity-80">Your response "{answerState.input}" is correct.</p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-6 h-6 shrink-0" />
                                      <div>
                                        <p className="text-sm font-black uppercase tracking-widest">Incorrect Answer</p>
                                        <p className="text-xs opacity-80">Correct answer is: <strong className="font-bold">{questions[currentIdx]?.correctAnswerText}</strong></p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            questions[currentIdx]?.options?.map((opt: string, i: number) => {
                              const letter = String.fromCharCode(65 + i);
                              const isSelected = answerState?.selected === i || selectedAnswer === i;
                              const isCorrectOption = i === questions[currentIdx].correctAnswer;
                              const isWrongSelected = isSelected && !answerState?.correct;
                              
                              let btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-line hover:border-line-strong hover:bg-surface";
                              let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line-strong text-sm font-bold transition-all";
                              
                              if (answerState) {
                                if (isCorrectOption) {
                                  btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                  circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-ink text-sm font-bold border-emerald-500";
                                } else if (isWrongSelected) {
                                  btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-rose-500 bg-rose-500/10 text-rose-400";
                                  circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 text-ink text-sm font-bold border-rose-500";
                                } else {
                                  btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 opacity-30 border-line cursor-default";
                                  circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line text-sm font-bold text-ink-subtle";
                                }
                              } else {
                                btnClass = `glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-line hover:border-indigo-500/40 hover:bg-surface active:scale-[0.99] ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : ''}`;
                                circleClass = `w-10 h-10 rounded-full flex items-center justify-center border text-sm font-bold text-ink ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-line-strong group-hover:border-indigo-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5'}`;
                              }

                              return (
                                <button
                                  key={i}
                                  onClick={() => selectAnswer(i)}
                                  className={`group ${btnClass}`}
                                >
                                  <div className={circleClass}>{letter}</div>
                                  <div 
                                    className="text-base font-medium flex-1" 
                                    dangerouslySetInnerHTML={{ __html: renderMathText(opt) }}
                                  />
                                </button>
                              );
                            })
                          )}
                        </div>

                        {!questions[currentIdx]?.isFreeResponse && !answerState && (
                          <Button onClick={checkSelectedAnswer} disabled={selectedAnswer === null} className="mt-6 h-12 w-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
                            Check answer
                          </Button>
                        )}

                        <AnimatePresence>
                          {answerState && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 mt-2"
                            >
                              <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">EXPLANATION</h4>
                              </div>
                              <div 
                                className="text-ink font-medium text-sm block leading-relaxed mb-10" 
                                dangerouslySetInnerHTML={{ __html: renderMathText(questions[currentIdx]?.explanation || "") }}
                              />
                              <Button 
                                onClick={nextQuestion} 
                                className="bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2"
                              >
                                Next Question <ChevronRight className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden grid lg:grid-cols-2 gap-3 mb-2">
                  {/* Left Pane (Question text/graphics) */}
                  <div className="glass-3d rounded-xl p-5 sm:p-7 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                    {questions[currentIdx]?.imageUrl && (
                      <div className="my-2 p-6 bg-white rounded-2xl border border-slate-200 flex justify-center items-center max-w-md mx-auto shadow-sm">
                        <QuestionImage
                          src={questions[currentIdx].imageUrl}
                          className="max-h-[260px] object-contain"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2 opacity-30">
                      <Brain className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Question</span>
                    </div>
                    <div 
                      className="text-lg font-bold leading-relaxed tracking-tight" 
                      dangerouslySetInnerHTML={{ __html: renderMathText(questions[currentIdx]?.question || "") }}
                    />
                  </div>

                  {/* Right Pane (Options only) */}
                  <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                    {/* Options List */}
                    <div className="flex flex-col gap-3">
                      {questions[currentIdx]?.isFreeResponse ? (
                        <div className="glass-3d p-10 flex flex-col gap-6">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Student-Produced Response</h3>
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            Enter your answer in the box below. You can enter integers, decimals, or fractions.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <input
                              type="text"
                              value={freeResponseInput}
                              onChange={(e) => setFreeResponseInput(e.target.value)}
                              disabled={!!answerState}
                              placeholder="Type your answer here..."
                              className="flex-1 px-6 h-16 bg-surface border border-line rounded-xl text-lg font-bold text-ink placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleFreeResponseSubmit();
                                }
                              }}
                            />
                            <Button
                              onClick={handleFreeResponseSubmit}
                              disabled={!!answerState || !freeResponseInput.trim()}
                              className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 h-16 px-10 rounded-xl font-black uppercase text-xs tracking-widest"
                            >
                              Confirm
                            </Button>
                          </div>

                          {answerState && (
                            <div className={`mt-4 p-6 rounded-xl border flex items-center gap-4 ${
                              answerState.correct
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}>
                              {answerState.correct ? (
                                <>
                                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                                  <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Correct Answer</p>
                                    <p className="text-xs opacity-80">Your response "{answerState.input}" is correct.</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-6 h-6 shrink-0" />
                                  <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Incorrect Answer</p>
                                    <p className="text-xs opacity-80">Correct answer is: <strong className="font-bold">{questions[currentIdx]?.correctAnswerText}</strong></p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        questions[currentIdx]?.options?.map((opt: string, i: number) => {
                          const letter = String.fromCharCode(65 + i);
                          const isSelected = answerState?.selected === i || selectedAnswer === i;
                          const isCorrectOption = i === questions[currentIdx].correctAnswer;
                          const isWrongSelected = isSelected && !answerState?.correct;
                          
                          let btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-line hover:border-line-strong hover:bg-surface";
                          let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line-strong text-sm font-bold transition-all";
                          
                          if (answerState) {
                            if (isCorrectOption) {
                              btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-emerald-500 bg-emerald-500/10 text-emerald-400";
                              circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-ink text-sm font-bold border-emerald-500";
                            } else if (isWrongSelected) {
                              btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-rose-500 bg-rose-500/10 text-rose-400";
                              circleClass = "w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 text-ink text-sm font-bold border-rose-500";
                            } else {
                              btnClass = "glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 opacity-30 border-line cursor-default";
                              circleClass = "w-10 h-10 rounded-full flex items-center justify-center border border-line text-sm font-bold text-ink-subtle";
                            }
                          } else {
                            btnClass = `glass-3d rounded-xl p-4 text-left transition-all flex items-center gap-4 border-line hover:border-indigo-500/40 hover:bg-surface active:scale-[0.99] ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : ''}`;
                            circleClass = `w-10 h-10 rounded-full flex items-center justify-center border text-sm font-bold text-ink ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-line-strong group-hover:border-indigo-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5'}`;
                          }

                          return (
                            <button
                              key={i}
                              onClick={() => selectAnswer(i)}
                              className={`group ${btnClass}`}
                            >
                              <div className={circleClass}>{letter}</div>
                              <div 
                                className="text-base font-medium flex-1" 
                                dangerouslySetInnerHTML={{ __html: renderMathText(opt) }}
                              />
                            </button>
                          );
                        })
                      )}
                    </div>

                    {!questions[currentIdx]?.isFreeResponse && !answerState && (
                      <Button onClick={checkSelectedAnswer} disabled={selectedAnswer === null} className="mt-6 h-12 w-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
                        Check answer
                      </Button>
                    )}

                    <AnimatePresence>
                      {answerState && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 mt-2"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">EXPLANATION</h4>
                          </div>
                          <div 
                            className="text-ink font-medium text-sm block leading-relaxed mb-10" 
                            dangerouslySetInnerHTML={{ __html: renderMathText(questions[currentIdx]?.explanation || "") }}
                          />
                          <Button 
                            onClick={nextQuestion} 
                            className="bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2"
                          >
                            Next Question <ChevronRight className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Bar */}
              <div className="mt-auto pt-2 border-t border-line flex items-center justify-between shrink-0">
                <Button
                  onClick={() => {
                    if (currentIdx > 0) {
                      setCurrentIdx(prev => prev - 1);
                      setAnswerState(null);
                      setSelectedAnswer(null);
                      setFreeResponseInput("");
                    }
                  }}
                  disabled={currentIdx === 0}
                  variant="ghost"
                  className="bg-surface border border-line text-ink hover:bg-surface-2 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-35"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                <div className="hidden max-w-[56vw] items-center gap-1 overflow-x-auto py-1 md:flex" aria-label="Question navigator">
                  {questions.map((question, index) => {
                    const result = sessionAnswers[question.id];
                    const state = index === currentIdx ? "border-indigo-500 bg-indigo-500 text-white" : result?.correct === true ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-500" : result?.correct === false ? "border-rose-400/50 bg-rose-500/10 text-rose-500" : "border-line bg-surface text-ink-muted hover:border-indigo-400";
                    return <button key={question.id} onClick={() => { setCurrentIdx(index); setAnswerState(null); setSelectedAnswer(null); setFreeResponseInput(""); }} className={`h-9 w-9 shrink-0 rounded-lg border text-xs font-bold transition-colors ${state}`}>{index + 1}</button>;
                  })}
                </div>
                <div className="bg-surface border border-line rounded-xl px-4 h-12 flex items-center justify-center font-bold text-xs md:hidden">
                  {currentIdx + 1} / {questions.length}
                </div>

                <Button
                  onClick={() => {
                    if (currentIdx < questions.length - 1) {
                      setCurrentIdx(prev => prev + 1);
                      setAnswerState(null);
                      setSelectedAnswer(null);
                      setFreeResponseInput("");
                    } else {
                      // loop back
                      setCurrentIdx(0);
                      setAnswerState(null);
                      setSelectedAnswer(null);
                      setFreeResponseInput("");
                    }
                  }}
                  className="bg-white text-black hover:bg-gray-100 px-8 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: Results Feedback Display */}
        {phase === "results" && (
          <div className="min-h-screen bg-transparent pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto text-center relative z-10 w-full">
              <h1 className="text-7xl font-black text-shimmer leading-none mb-12 uppercase italic tracking-tighter">Session Over.</h1>
              
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                <div className="glass-3d p-12 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy</div>
                  <div className="text-8xl font-black tracking-tighter mb-4">
                    {Math.round((Object.values(sessionAnswers).filter((a: any) => a.correct).length / (questions.length || 1)) * 100)}%
                  </div>
                  <div className="text-xs font-bold text-ink-subtle uppercase tracking-widest">
                    {Object.values(sessionAnswers).filter((a: any) => a.correct).length} / {questions.length} correct
                  </div>
                </div>

                <div className="md:col-span-2 glass-3d p-12 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Intelligence Feedback</h3>
                  </div>
                  <p className="text-xl font-medium text-ink-muted leading-relaxed mb-8">
                    Great effort! Your performance updates your daily mastery charts. Keep expanding your accuracy index to secure a 1550+ estimation.
                  </p>
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-surface rounded-xl border border-line text-[9px] font-black uppercase tracking-widest text-emerald-400">Mastery Updated</div>
                    <div className="px-6 py-3 bg-surface rounded-xl border border-line text-[9px] font-black uppercase tracking-widest text-blue-400">Streak Maintained</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 justify-center">
                <Button 
                  onClick={() => setPhase("subtopics")} 
                  variant="outline" 
                  className="h-18 px-12 rounded-2xl border-line text-ink font-black uppercase text-xs"
                >
                  Return to Blueprints
                </Button>
                <Button 
                  onClick={() => navigate("/sat/dashboard")} 
                  className="h-18 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs shadow-2xl"
                >
                  View Analytics
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
