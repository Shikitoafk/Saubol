import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import katex from "katex";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  Shuffle,
  Eye,
  BookOpen,
  Calculator,
  ListFilter,
  Play,
  X,
  Brain,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  History,
  Target
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import SATAITutor from "@/components/sat-ai-tutor";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

/* ════════════════════════════════════════════════════════════════════
   KaTeX & Helpers
   ════════════════════════════════════════════════════════════════════ */
const KATEX_OPTS = { throwOnError: false, errorColor: "#f87171" };

function renderKaTeX(raw: string): string {
  if (!raw) return "";
  // Fix potential escaping issues from DB
  const clean = raw.replace(/\\\\/g, "\\");
  try {
    return clean.replace(/\$\$([^$]+?)\$\$/gs, (_, m) => katex.renderToString(m, { ...KATEX_OPTS, displayMode: true }))
                .replace(/\$([^$\n]{1,600}?)\$/g, (_, m) => katex.renderToString(m, KATEX_OPTS));
  } catch { return clean; }
}

function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderKaTeX(text || ""), [text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function normalizeAnswer(a: string) {
  return a.trim().toLowerCase().replace(/\s+/g, "");
}

/* ════════════════════════════════════════════════════════════════════
   Types & Fetching
   ════════════════════════════════════════════════════════════════════ */
interface SATQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  category: string;
  section: string;
  isFreeResponse: boolean;
  image_url?: string;
}

type QuestionType = "all" | "mcq" | "open";
type Phase = "bank" | "quiz" | "results";

/* ════════════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════════════ */
export default function SATPractice() {
  const nav = useNavigate();
  const [meta, setMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<SATQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("bank");
  const [loading, setLoading] = useState(true);
  const [answerState, setAnswerState] = useState<any>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, any>>({});
  const [elapsed, setElapsed] = useState(0);
  const [frInput, setFrInput] = useState("");
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const timerRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: mcq, error: mcqErr } = await supabase.from("SAT_MCQ").select("*");
        const { data: open, error: openErr } = await supabase.from("SAT_Open").select("*");
        
        if (mcqErr || openErr) throw new Error(mcqErr?.message || openErr?.message);

        const allQs: SATQuestion[] = [
          ...(mcq || []).map(r => ({
            id: `mcq-${r.id}`,
            question: r.question,
            optionA: r.option_a,
            optionB: r.option_b,
            optionC: r.option_c,
            optionD: r.option_d,
            correctAnswer: r.correct_answer,
            explanation: r.explanation,
            difficulty: r.difficulty,
            category: r.category,
            section: r.section,
            isFreeResponse: false,
            image_url: r.image_url
          })),
          ...(open || []).map(r => ({
            id: `open-${r.id}`,
            question: r.question,
            optionA: "", optionB: "", optionC: "", optionD: "",
            correctAnswer: r.correct_answer,
            explanation: r.explanation,
            difficulty: r.difficulty,
            category: r.category,
            section: r.section,
            isFreeResponse: true,
            image_url: r.image_url
          }))
        ];
        setQuestions(allQs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const startQuiz = (qs: SATQuestion[]) => {
    if (!qs || qs.length === 0) {
      alert("No questions available for this section yet. System recalibration in progress.");
      return;
    }
    setQuestions(qs.sort(() => Math.random() - 0.5));
    setPhase("quiz");
    setCurrentIdx(0);
    setElapsed(0);
    setMarkedQuestions(new Set());
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const toggleMark = () => {
    const next = new Set(markedQuestions);
    if (next.has(currentIdx)) next.delete(currentIdx);
    else next.add(currentIdx);
    setMarkedQuestions(next);
  };

  const exitQuiz = () => {
    clearInterval(timerRef.current);
    setPhase("bank");
    setIsDesmosOpen(false);
  };

  const handleMCAnswer = async (label: string) => {
    if (answerState) return;
    const q = questions[currentIdx];
    const correct = label === q.correctAnswer;
    setAnswerState({ selected: label, correct });
    setSessionAnswers(p => ({ ...p, [q.id]: { correct } }));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_progress').insert({
        user_id: session.user.id,
        question_id: q.id,
        section: q.section,
        category: q.category,
        difficulty: q.difficulty,
        correct
      });
    }
  };

  const handleFRAnswer = async () => {
    if (answerState || !frInput.trim()) return;
    const q = questions[currentIdx];
    const correct = normalizeAnswer(frInput) === normalizeAnswer(q.correctAnswer);
    setAnswerState({ selected: frInput, correct });
    setSessionAnswers(p => ({ ...p, [q.id]: { correct } }));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_progress').insert({
        user_id: session.user.id,
        question_id: q.id,
        section: q.section,
        category: q.category,
        difficulty: q.difficulty,
        correct
      });
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setAnswerState(null);
      setFrInput("");
    } else {
      clearInterval(timerRef.current);
      setPhase("results");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </div>
  );

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center p-10">
          <div className="glass-3d p-12 text-center max-w-lg border-rose-500/20">
             <div className="flex items-center justify-center gap-3 mb-6 opacity-60">
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <span className="text-[10px] font-black tracking-[0.5em] uppercase text-rose-500">System Failure</span>
             </div>
             <h2 className="text-4xl font-black tracking-tighter uppercase mb-6">SAT Link Broken.</h2>
             <p className="text-[#666] mb-10 font-medium leading-relaxed italic uppercase tracking-widest text-xs">
                We encountered a tactical error while fetching the SAT question bank. 
                <br /> {error}
             </p>
             <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl shadow-xl">Re-establish Connection</Button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Bank ───────────────────────────────────────────────────────── */
  if (phase === "bank") {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-10 relative overflow-hidden">
           <div className="bg-vignette" />
           <div className="bg-sphere top-[-10%] left-[-10%] opacity-20" style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }} />
           
           <div className="max-w-[1400px] mx-auto relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                 <div>
                    <div className="flex items-center gap-3 mb-6 opacity-60">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-400">Adaptive Intelligence v3.0</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-shimmer leading-none">SAT HUB.</h1>
                 </div>
                 <div className="flex gap-4">
                    <div className="glass-3d p-6 min-w-[160px]">
                       <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Total Questions</p>
                       <p className="text-3xl font-black">{questions.length}</p>
                    </div>
                    <div className="glass-3d p-6 min-w-[160px]">
                       <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-2">Solved Today</p>
                       <p className="text-3xl font-black text-emerald-400">0</p>
                    </div>
                 </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-10">
                 {/* Main Prep Cards */}
                 <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
                    <div className="glass-3d p-12 group cursor-pointer border-blue-500/10 hover:border-blue-500/40 transition-all flex flex-col justify-between min-h-[400px]" onClick={() => startQuiz(questions.filter(q => q.section === "Math"))}>
                       <div>
                          <div className="flex justify-between items-start mb-10">
                             <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                                <Calculator className="w-8 h-8 text-blue-400" />
                             </div>
                             <Badge className="bg-blue-500/10 text-blue-400 border-none font-black text-[8px] uppercase tracking-widest">Digital SAT</Badge>
                          </div>
                          <h3 className="text-5xl font-black mb-4">MATH</h3>
                          <p className="text-[#666] text-lg font-medium leading-relaxed">Алгебра, геометрия и тригонометрия с использованием Desmos.</p>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-widest mt-12">
                          Start Practice <ChevronRight className="w-4 h-4" />
                       </div>
                    </div>

                    <div className="glass-3d p-12 group cursor-pointer border-purple-500/10 hover:border-purple-500/40 transition-all flex flex-col justify-between min-h-[400px]" onClick={() => startQuiz(questions.filter(q => q.section === "Reading & Writing"))}>
                       <div>
                          <div className="flex justify-between items-start mb-10">
                             <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                                <BookOpen className="w-8 h-8 text-purple-400" />
                             </div>
                             <Badge className="bg-purple-500/10 text-purple-400 border-none font-black text-[8px] uppercase tracking-widest">Digital SAT</Badge>
                          </div>
                          <h3 className="text-5xl font-black mb-4">READING</h3>
                          <p className="text-[#666] text-lg font-medium leading-relaxed">Анализ текстов, грамматика и логика на английском языке.</p>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-purple-400 uppercase tracking-widest mt-12">
                          Start Practice <ChevronRight className="w-4 h-4" />
                       </div>
                    </div>
                 </div>

                 {/* Sidebar: Path & Stats */}
                 <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="glass-3d p-10 bg-indigo-600/5 border-indigo-500/10">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Your Learning Path
                       </h4>
                       <div className="space-y-8">
                          {[
                            { label: "Foundation", status: "Complete", color: "text-emerald-400" },
                            { label: "Middle Module", status: "In Progress", color: "text-blue-400" },
                            { label: "Advanced Level", status: "Locked", color: "text-white/20" }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <span className="text-sm font-bold text-white/80">{item.label}</span>
                               <span className={`text-[9px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-10 pt-8 border-t border-white/5">
                          <p className="text-[9px] font-black text-[#444] uppercase tracking-widest mb-4">Daily Goal: 20 Questions</p>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                             <div className="w-0 h-full bg-indigo-500 transition-all" />
                          </div>
                       </div>
                    </div>

                    <div className="glass-3d p-10">
                       <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Recent Achievements</h4>
                       <div className="flex flex-wrap gap-3">
                          {[Zap, Trophy, Sparkles].map((Icon, i) => (
                            <div key={i} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                               <Icon className="w-5 h-5 text-[#444]" />
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  /* ── Quiz ───────────────────────────────────────────────────────── */
  if (phase === "quiz") {
    const q = questions[currentIdx];
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex flex-col">
          <div className="bg-vignette" />
          
          {/* Desmos Sidebar Overlay */}
          {isDesmosOpen && (
            <div className="fixed inset-y-0 right-0 w-full lg:w-[600px] z-[100] bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
               <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                     <Calculator className="w-4 h-4 text-blue-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Desmos Graphing Calculator</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
               </div>
               <iframe 
                 src="https://www.desmos.com/testing/cb-digital-sat/graphing" 
                 className="w-full h-[calc(100%-60px)] border-0"
                 title="Desmos"
               />
            </div>
          )}

          <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1">
             <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-6">
                   <Button variant="ghost" onClick={exitQuiz} className="text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white"><ChevronLeft className="w-4 h-4 mr-2" /> Exit</Button>
                   <Button variant="ghost" onClick={toggleMark} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${markedQuestions.has(currentIdx) ? 'text-yellow-400' : 'text-[#444] hover:text-white'}`}>
                      <Target className="w-4 h-4" /> {markedQuestions.has(currentIdx) ? 'Marked' : 'Mark for Review'}
                   </Button>
                </div>
                
                <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Module</p>
                      <p className="text-sm font-black">{q.section}</p>
                   </div>
                   <div className="w-px h-8 bg-white/10" />
                   <div className="text-center">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Question</p>
                      <p className="text-sm font-black">{currentIdx + 1} of {questions.length}</p>
                   </div>
                   <div className="w-px h-8 bg-white/10" />
                   <div className="text-center min-w-[80px]">
                      <div className="flex items-center justify-center gap-2 mb-1">
                         <Clock className="w-3 h-3 text-blue-400" />
                         <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Time</p>
                      </div>
                      <p className="text-xl font-black tabular-nums leading-none">{formatTime(elapsed)}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   {q.section === "Math" && (
                     <Button onClick={() => setIsDesmosOpen(!isDesmosOpen)} className={`px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isDesmosOpen ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                        <Calculator className="w-4 h-4 mr-2" /> Desmos
                     </Button>
                   )}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                   <div className="glass-3d p-10 flex flex-col sticky top-0">
                      <div className="text-xl font-medium leading-relaxed mb-10"><MathText text={q.question} /></div>
                      {q.image_url && <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center"><img src={q.image_url} className="max-h-[300px] invert hue-rotate-180 brightness-200" /></div>}
                   </div>
                   
                   <div className="flex flex-col gap-4">
                      {!q.isFreeResponse ? (
                        ["A", "B", "C", "D"].map((label) => (
                          <button key={label} onClick={() => handleMCAnswer(label)} className={`glass-3d p-6 text-left transition-all ${answerState ? (label === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : (answerState.selected === label ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'opacity-20')) : 'bg-white/5 hover:bg-white/10 hover:translate-x-2'}`}>
                            <div className="flex items-center gap-5">
                               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 font-black text-sm">{label}</div>
                               <div className="text-base font-medium flex-1"><MathText text={(q as any)[`option${label}`]} /></div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="glass-3d p-10">
                           <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4">Student-Produced Response</p>
                           <input type="text" className="w-full bg-transparent border-b-2 border-white/10 pb-4 text-4xl font-black focus:outline-none focus:border-white transition-colors" placeholder="ENTER ANSWER" value={frInput} onChange={e => setFrInput(e.target.value)} disabled={!!answerState} autoFocus />
                           {!answerState ? <Button onClick={handleFRAnswer} className="mt-12 bg-white text-black hover:bg-gray-200 w-full h-16 font-black uppercase text-xs rounded-xl shadow-xl">Submit Answer</Button> : <div className={`mt-12 p-6 rounded-xl border font-black text-center ${answerState.correct ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>{answerState.correct ? 'CORRECT' : `EXPECTED: ${q.correctAnswer}`}</div>}
                        </div>
                      )}
                      
                      {answerState && (
                        <div className="glass-3d p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center gap-3 mb-4"><Sparkles className="w-4 h-4 text-indigo-400" /><h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Explanation</h4></div>
                           <MathText text={q.explanation} className="text-[#666] font-medium text-sm block leading-relaxed" />
                           <Button onClick={nextQuestion} className="mt-8 bg-white text-black hover:bg-gray-100 w-full h-14 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 group">
                              Next Question <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                           </Button>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Question Navigation Footer */}
             <div className="mt-auto border-t border-white/10 pt-6 flex items-center justify-between shrink-0">
                <div className="flex flex-wrap gap-2">
                   {questions.map((_, i) => (
                     <button
                       key={i}
                       onClick={() => { if (!answerState) { setCurrentIdx(i); setFrInput(""); } }}
                       className={`w-8 h-8 rounded-lg border text-[10px] font-black flex items-center justify-center transition-all ${i === currentIdx ? 'bg-white text-black border-white' : (sessionAnswers[questions[i].id] ? (sessionAnswers[questions[i].id].correct ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-rose-500/20 border-rose-500/40 text-rose-500') : (markedQuestions.has(i) ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400' : 'border-white/10 text-[#444] hover:border-white/30'))}`}
                     >
                       {i + 1}
                     </button>
                   ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-[#222] uppercase tracking-widest">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Done</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Marked</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20" /> Unseen</div>
                </div>
             </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Results ────────────────────────────────────────────────────── */
  if (phase === "results") {
    const total = questions.length;
    const correct = Object.values(sessionAnswers).filter(a => a.correct).length;
    const pct = Math.round((correct / total) * 100);

    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="bg-vignette" />
           <div className="max-w-[1000px] mx-auto text-center relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
                 <Trophy className="w-8 h-8 text-yellow-400" />
                 <span className="text-sm font-black tracking-[0.5em] uppercase text-yellow-400">Session Complete</span>
              </div>
              <h1 className="text-7xl font-black text-shimmer leading-none mb-12">RESULTS.</h1>
              <div className="glass-3d p-20 mb-12 max-w-2xl mx-auto">
                 <div className="text-8xl font-black text-white leading-none mb-4 tracking-tighter">{pct}%</div>
                 <div className="flex items-center justify-center gap-12 mb-16">
                    <div className="text-center">
                       <p className="text-4xl font-black">{correct}</p>
                       <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-2">Correct</p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="text-center">
                       <p className="text-4xl font-black">{total - correct}</p>
                       <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-2">Incorrect</p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="text-center">
                       <p className="text-4xl font-black">{formatTime(elapsed)}</p>
                       <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-2">Time spent</p>
                    </div>
                 </div>
                 <Button onClick={exitQuiz} className="bg-white text-black hover:bg-gray-200 rounded-2xl px-16 h-20 text-xl font-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95">Back to Bank</Button>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  return null;
}

