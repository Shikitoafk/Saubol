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
  Square
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { saveSATAnswer } from "@/lib/progress-service";
import { fetchPracticeQuestions, SATQuestion } from "@/lib/sat-questions-service";
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from "framer-motion";

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
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Dynamic user progress states populated with exact broad topic values from the database
  const [rwProgress, setRwProgress] = useState<DomainInfo[]>([
    {
      name: "Reading & Writing Domains",
      subtopics: [
        { id: "Reading & Writing", name: "Reading & Writing", totalQuestions: 329, solvedQuestions: 0, accuracy: 0 }
      ]
    }
  ]);

  const [mathProgress, setMathProgress] = useState<DomainInfo[]>([
    {
      name: "Math Domains",
      subtopics: [
        { id: "Algebra", name: "Algebra", totalQuestions: 221, solvedQuestions: 0, accuracy: 0 },
        { id: "Advanced Math", name: "Advanced Math", totalQuestions: 48, solvedQuestions: 0, accuracy: 0 },
        { id: "Geometry", name: "Geometry", totalQuestions: 49, solvedQuestions: 0, accuracy: 0 },
        { id: "Statistics", name: "Statistics", totalQuestions: 28, solvedQuestions: 0, accuracy: 0 }
      ]
    }
  ]);

  // Load actual user progress from Supabase if available
  useEffect(() => {
    const fetchSupabaseProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: progressRows } = await supabase
          .from('sat_progress')
          .select('*')
          .eq('user_id', session.user.id);

        if (progressRows && progressRows.length > 0) {
          // Map database stats into progress state dynamically
          const updateSubtopics = (domains: DomainInfo[]) => {
            return domains.map(dom => ({
              ...dom,
              subtopics: dom.subtopics.map(sub => {
                const match = progressRows.find(r => r.subtopic?.toLowerCase() === sub.id.toLowerCase() || r.subtopic?.toLowerCase() === sub.name.toLowerCase());
                if (match) {
                  return {
                    ...sub,
                    solvedQuestions: match.questions_correct ?? 0,
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
        console.error("Failed to load custom progress:", err);
      }
    };
    fetchSupabaseProgress();
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
    // TODO: Pass subtopicId for filtering once real column values are mapped
    const questions = await fetchPracticeQuestions(section, {
      subtopic: subtopicId,
      limit: 10,
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
    const randomSub = allSubtopics[Math.floor(Math.random() * allSubtopics.length)];
    await startPracticeForSubtopic(randomSub);
  };

  const handleAnswerSelection = (idx: number) => {
    if (answerState) return;
    const q = questions[currentIdx];
    const correct = idx === q.correctAnswer;
    setAnswerState({ selected: idx, correct });
    setSessionAnswers(prev => ({ ...prev, [q.id]: { correct } }));

    // Persist to Database via progress-service
    if (currentSubtopic) {
      saveSATAnswer(
        selectedSection === 'Math' ? "Math" : "RW",
        currentSubtopic.name,
        correct
      ).catch(console.error);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswerState(null);
    } else {
      setPhase("results");
    }
  };

  const renderKatexText = (text: string) => {
    if (!text) return "";
    try {
      return text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => 
        katex.renderToString(math, { displayMode: true, throwOnError: false })
      ).replace(/\$([\s\S]+?)\$/g, (_, math) => 
        katex.renderToString(math, { displayMode: false, throwOnError: false })
      );
    } catch (e) {
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
      <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-white/10">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-35" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} />

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

            <div className="grid md:grid-cols-2 gap-10">
              {/* Reading & Writing Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                className="glass-3d p-16 flex flex-col justify-between min-h-[460px] cursor-pointer border-indigo-500/10 hover:border-indigo-500/40 transition-all relative overflow-hidden group"
                onClick={() => { setSelectedSection('RW'); setPhase('subtopics'); }}
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
                  <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-10">1492 questions</p>
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
                onClick={() => { setSelectedSection('Math'); setPhase('subtopics'); }}
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
                  <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-10">2390 questions</p>
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
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444] hover:text-white p-0 mb-6 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Question Bank
              </Button>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-4">
                {selectedSection === 'Math' ? 'MATH BANK' : 'READING & WRITING'}
              </h1>
              <p className="text-sm text-[#666] font-semibold max-w-xl">
                Choose a specific domain and select a topic to solve adaptive blueprints.
              </p>
            </header>

            {/* General Practice all Banner */}
            <div className="glass-3d p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/10 bg-indigo-500/5">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">Practice all topics</h3>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">
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
                <span className="text-sm font-bold text-white/60">Loading questions from database...</span>
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
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#444]">{domain.name}</h3>
                  <div className="glass-3d overflow-hidden border-white/5">
                    <div className="divide-y divide-white/5">
                      {domain.subtopics.map((sub, idx) => {
                        const solvedPercent = Math.round((sub.solvedQuestions / sub.totalQuestions) * 100);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => startPracticeForSubtopic(sub)}
                            className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-4 min-w-[280px]">
                              <div className="w-5 h-5 rounded-md border border-white/20 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                                {sub.solvedQuestions > 0 ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-indigo-400/40" />
                                )}
                              </div>
                              <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{sub.name}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-4 flex-1 max-w-xs w-full">
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1">
                                <div className="h-full bg-indigo-500" style={{ width: `${solvedPercent}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
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
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">—</span>
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
          <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
            {isDesmosOpen && (
              <div className="fixed inset-y-0 right-0 w-[600px] z-[100] bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Desmos Calculator</span>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
                </div>
                <iframe src="https://www.desmos.com/testing/cb-digital-sat/graphing" className="w-full h-[calc(100%-60px)] border-0" />
              </div>
            )}

            <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1">
              {/* Diagnostic Top bar */}
              <div className="flex items-center justify-between mb-8 shrink-0">
                <Button 
                  variant="ghost" 
                  onClick={() => setPhase("subtopics")} 
                  className="text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Exit Session
                </Button>

                <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Topic</p>
                    <p className="text-xs font-black uppercase max-w-[200px] truncate">{currentSubtopic?.name}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Question</p>
                    <p className="text-sm font-black">{currentIdx + 1} of {questions.length}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Timer</p>
                    <p className="text-sm font-black font-mono">{formatTime(elapsed)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {selectedSection === 'Math' && (
                    <Button 
                      onClick={() => setIsDesmosOpen(!isDesmosOpen)} 
                      className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4" /> Desmos
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Content Arena */}
              <div className="flex-1 overflow-hidden grid lg:grid-cols-2 gap-10">
                {/* Left Prompt / Passage Column */}
                <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                  {questions[currentIdx]?.imageUrl && (
                    <div className="mb-6">
                      <img
                        src={questions[currentIdx].imageUrl}
                        alt="Question visual"
                        className="max-w-full rounded-2xl border border-white/10"
                      />
                    </div>
                  )}
                  {questions[currentIdx]?.passage && (
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2 mb-4 opacity-30">
                        <FileText className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Directions / Passage</span>
                      </div>
                      <p className="text-base leading-relaxed font-medium text-white/80">{questions[currentIdx].passage}</p>
                    </div>
                  )}
                  <div 
                    className="text-xl font-black leading-tight tracking-tight" 
                    dangerouslySetInnerHTML={{ __html: renderKatexText(questions[currentIdx]?.question || "") }} 
                  />
                </div>

                {/* Right Options Column */}
                <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                  {questions[currentIdx]?.options?.map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerSelection(i)}
                      className={`glass-3d p-8 text-left transition-all ${
                        answerState 
                          ? (i === questions[currentIdx].correctAnswer 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : (answerState.selected === i ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'opacity-20')) 
                          : 'bg-white/5 hover:bg-white/10 hover:translate-x-2'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-sm">{String.fromCharCode(65 + i)}</div>
                        <div className="text-base font-bold" dangerouslySetInnerHTML={{ __html: renderKatexText(opt) }} />
                      </div>
                    </button>
                  ))}

                  <AnimatePresence>
                    {answerState && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 mt-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">EXPLANATION</h4>
                        </div>
                        <div 
                          className="text-white/70 font-medium text-sm block leading-relaxed mb-10" 
                          dangerouslySetInnerHTML={{ __html: renderKatexText(questions[currentIdx]?.explanation || "") }} 
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
            </div>
          </div>
        )}

        {/* Phase 4: Results Feedback Display */}
        {phase === "results" && (
          <div className="min-h-screen bg-black text-white pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto text-center relative z-10 w-full">
              <h1 className="text-7xl font-black text-shimmer leading-none mb-12 uppercase italic tracking-tighter">Session Over.</h1>
              
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                <div className="glass-3d p-12 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy</div>
                  <div className="text-8xl font-black tracking-tighter mb-4">
                    {Math.round((Object.values(sessionAnswers).filter((a: any) => a.correct).length / (questions.length || 1)) * 100)}%
                  </div>
                  <div className="text-xs font-bold text-white/20 uppercase tracking-widest">
                    {Object.values(sessionAnswers).filter((a: any) => a.correct).length} / {questions.length} correct
                  </div>
                </div>

                <div className="md:col-span-2 glass-3d p-12 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Intelligence Feedback</h3>
                  </div>
                  <p className="text-xl font-medium text-white/60 leading-relaxed mb-8">
                    Great effort! Your performance updates your daily mastery charts. Keep expanding your accuracy index to secure a 1550+ estimation.
                  </p>
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400">Mastery Updated</div>
                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400">Streak Maintained</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 justify-center">
                <Button 
                  onClick={() => setPhase("subtopics")} 
                  variant="outline" 
                  className="h-18 px-12 rounded-2xl border-white/10 text-white font-black uppercase text-xs"
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
