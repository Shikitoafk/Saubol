import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import katex from "katex";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calculator,
  BookOpen,
  Zap,
  Clock,
  Target,
  Sparkles,
  FileText,
  Brain,
  TrendingUp,
  X,
  ArrowRight
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

/* ════════════════════════════════════════════════════════════════════
   KaTeX Rendering Engine
   ════════════════════════════════════════════════════════════════════ */
function renderMath(text: string): string {
  if (!text) return "";
  try {
    return text.replace(/\$\$([^$]+?)\$\$/gs, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: false }))
               .replace(/\$([^$\n]{1,1000}?)\$/g, (_, m) => katex.renderToString(m, { throwOnError: false }));
  } catch { return text; }
}

function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMath(text || ""), [text]);
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
  passage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  section: string;
  isFreeResponse: boolean;
  image_url?: string;
}

type Phase = "bank" | "quiz" | "results";

export default function SATPractice() {
  const nav = useNavigate();
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
  const masterBank = useRef<SATQuestion[]>([]);
  const [sessionProgress, setSessionProgress] = useState<any[]>([]);
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
            passage: r.passage,
            optionA: r.option_a,
            optionB: r.option_b,
            optionC: r.option_c,
            optionD: r.option_d,
            correctAnswer: r.correct_answer,
            explanation: r.explanation,
            difficulty: r.difficulty || 'Medium',
            category: r.category,
            section: r.section,
            isFreeResponse: false,
            image_url: r.image_url
          })),
          ...(open || []).map(r => ({
            id: `open-${r.id}`,
            question: r.question,
            passage: r.passage,
            optionA: "", optionB: "", optionC: "", optionD: "",
            correctAnswer: r.correct_answer,
            explanation: r.explanation,
            difficulty: r.difficulty || 'Medium',
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
      alert("System recalibration required. Question bank currently empty for this sector.");
      return;
    }
    masterBank.current = qs;
    
    // Adaptive initial pick
    const mediumQs = qs.filter(q => q.difficulty === "Medium");
    const firstQ = mediumQs.length > 0 
      ? mediumQs[Math.floor(Math.random() * mediumQs.length)] 
      : qs[Math.floor(Math.random() * qs.length)];
      
    setQuestions([firstQ]);
    setPhase("quiz");
    setCurrentIdx(0);
    setElapsed(0);
    setMarkedQuestions(new Set());
    setSessionAnswers({});
    setSessionProgress([]);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const updateTopicPerformance = async (userId: string, q: SATQuestion, correct: boolean) => {
    try {
      const { data: currentPerf } = await supabase
        .from('topic_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', q.category)
        .maybeSingle();

      if (currentPerf) {
        await supabase.from('topic_performance').update({
          questions_answered: currentPerf.questions_answered + 1,
          questions_correct: currentPerf.questions_correct + (correct ? 1 : 0),
        }).eq('id', currentPerf.id);
      } else {
        await supabase.from('topic_performance').insert({
          user_id: userId,
          topic: q.category,
          section: q.section,
          questions_answered: 1,
          questions_correct: correct ? 1 : 0
        });
      }

      // Streak update logic
      const today = new Date().toISOString().split('T')[0];
      const { data: streak } = await supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle();
      if (streak) {
        if (streak.last_activity_date !== today) {
          const isConsecutive = new Date(streak.last_activity_date).getTime() >= new Date(today).getTime() - 86400000;
          const nextStreak = isConsecutive ? streak.current_streak + 1 : 1;
          await supabase.from('user_streaks').update({
            current_streak: nextStreak,
            last_activity_date: today,
            longest_streak: Math.max(nextStreak, streak.longest_streak)
          }).eq('user_id', userId);
        }
      } else {
        await supabase.from('user_streaks').insert({
          user_id: userId,
          current_streak: 1,
          last_activity_date: today,
          longest_streak: 1
        });
      }
    } catch (err) { console.error("Metrics sync error:", err); }
  };

  const handleMCAnswer = async (label: string) => {
    if (answerState) return;
    const q = questions[currentIdx];
    const correct = label === q.correctAnswer;
    setAnswerState({ selected: label, correct });
    setSessionAnswers(p => ({ ...p, [q.id]: { correct } }));
    setSessionProgress(p => [...p, { difficulty: q.difficulty, correct, category: q.category, section: q.section }]);
    
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
      await updateTopicPerformance(session.user.id, q, correct);
    }
  };

  const handleFRAnswer = async () => {
    if (answerState || !frInput.trim()) return;
    const q = questions[currentIdx];
    const correct = normalizeAnswer(frInput) === normalizeAnswer(q.correctAnswer);
    setAnswerState({ selected: frInput, correct });
    setSessionAnswers(p => ({ ...p, [q.id]: { correct } }));
    setSessionProgress(p => [...p, { difficulty: q.difficulty, correct, category: q.category, section: q.section }]);
    
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
      await updateTopicPerformance(session.user.id, q, correct);
    }
  };

  const nextQuestion = () => {
    if (questions.length < 10) {
      const lastResult = sessionAnswers[questions[currentIdx].id];
      const currentDiff = questions[currentIdx].difficulty;
      const diffs = ["Easy", "Medium", "Hard"];
      let nextDiffIdx = diffs.indexOf(currentDiff);
      
      if (lastResult.correct) nextDiffIdx = Math.min(nextDiffIdx + 1, 2);
      else nextDiffIdx = Math.max(nextDiffIdx - 1, 0);
      
      const nextDiff = diffs[nextDiffIdx];
      const usedIds = new Set(questions.map(q => q.id));
      let pool = masterBank.current.filter(q => q.difficulty === nextDiff && !usedIds.has(q.id));
      if (pool.length === 0) pool = masterBank.current.filter(q => !usedIds.has(q.id));
      
      if (pool.length > 0) {
        const nextQ = pool[Math.floor(Math.random() * pool.length)];
        setQuestions(prev => [...prev, nextQ]);
        setCurrentIdx(i => i + 1);
        setAnswerState(null);
        setFrInput("");
        return;
      }
    }
    clearInterval(timerRef.current);
    setPhase("results");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-white" />
    </div>
  );

  if (phase === "bank") {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-10 relative overflow-hidden">
           <div className="bg-vignette" />
           <div className="max-w-[1400px] mx-auto relative z-10">
              <div className="mb-20">
                 <div className="flex items-center gap-3 mb-6 opacity-60">
                   <Target className="w-5 h-5 text-blue-400" />
                   <span className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-400">Tactical Practice Hub</span>
                 </div>
                 <h1 className="text-8xl font-black text-shimmer leading-none uppercase italic">SAT PRACTICE.</h1>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                 <div className="glass-3d p-16 group cursor-pointer border-blue-500/10 hover:border-blue-500/40 transition-all min-h-[500px] flex flex-col justify-between" onClick={() => startQuiz(questions.filter(q => q.section === "Math"))}>
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all mb-12">
                       <Calculator className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                       <h3 className="text-5xl font-black mb-6">MATH SECTION</h3>
                       <p className="text-[#666] text-xl font-medium leading-relaxed max-w-sm">Algebra, Geometry, and Advanced Functions with Desmos support.</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-widest mt-12">Engage Math Module <ChevronRight className="w-4 h-4" /></div>
                 </div>

                 <div className="glass-3d p-16 group cursor-pointer border-purple-500/10 hover:border-purple-500/40 transition-all min-h-[500px] flex flex-col justify-between" onClick={() => startQuiz(questions.filter(q => q.section === "Reading & Writing"))}>
                    <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all mb-12">
                       <BookOpen className="w-10 h-10 text-purple-400" />
                    </div>
                    <div>
                       <h3 className="text-5xl font-black mb-6">R&W SECTION</h3>
                       <p className="text-[#666] text-xl font-medium leading-relaxed max-w-sm">Contextual reading and grammatical conventions with full passages.</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-purple-400 uppercase tracking-widest mt-12">Engage R&W Module <ChevronRight className="w-4 h-4" /></div>
                 </div>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  if (phase === "quiz") {
    const q = questions[currentIdx];
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex flex-col">
          <div className="bg-vignette" />
          
          {isDesmosOpen && (
            <div className="fixed inset-y-0 right-0 w-full lg:w-[600px] z-[100] bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
               <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-400" /><span className="text-[10px] font-black uppercase tracking-widest">Desmos</span></div>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
               </div>
               <iframe src="https://www.desmos.com/testing/cb-digital-sat/graphing" className="w-full h-[calc(100%-60px)] border-0" title="Desmos" />
            </div>
          )}

          <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1">
             <div className="flex items-center justify-between mb-8 shrink-0">
                <Button variant="ghost" onClick={() => setPhase("bank")} className="text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white"><ChevronLeft className="w-4 h-4 mr-2" /> Exit</Button>
                <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                   <div className="text-center"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Section</p><p className="text-sm font-black uppercase tracking-tight">{q.section}</p></div>
                   <div className="w-px h-8 bg-white/10" />
                   <div className="text-center min-w-[80px]"><div className="flex items-center justify-center gap-2 mb-1"><Clock className="w-3 h-3 text-blue-400" /><p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Time</p></div><p className="text-xl font-black tabular-nums leading-none">{formatTime(elapsed)}</p></div>
                </div>
                {q.section === "Math" && <Button onClick={() => setIsDesmosOpen(!isDesmosOpen)} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Desmos</Button>}
             </div>

             <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8">
                <div className="grid lg:grid-cols-2 gap-10 items-start">
                   <div className="glass-3d p-10 flex flex-col gap-8">
                      {q.passage && (
                        <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                           <div className="flex items-center gap-2 mb-4 opacity-30"><FileText className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Passage Text</span></div>
                           <p className="text-lg leading-relaxed font-medium text-white/80 italic">{q.passage}</p>
                        </div>
                      )}
                      <div className="text-2xl font-black leading-tight tracking-tight"><MathText text={q.question} /></div>
                      {q.image_url && <div className="p-6 bg-white/5 rounded-2xl flex items-center justify-center"><img src={q.image_url} className="max-h-[300px] invert hue-rotate-180 brightness-200" /></div>}
                   </div>
                   
                   <div className="flex flex-col gap-4">
                      {!q.isFreeResponse ? (
                        ["A", "B", "C", "D"].map((label) => (
                          <button key={label} onClick={() => handleMCAnswer(label)} className={`glass-3d p-8 text-left transition-all ${answerState ? (label === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : (answerState.selected === label ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'opacity-20')) : 'bg-white/5 hover:bg-white/10 hover:translate-x-2'}`}>
                            <div className="flex items-center gap-6">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-sm">{label}</div>
                               <div className="text-lg font-bold"><MathText text={(q as any)[`option${label}`]} /></div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="glass-3d p-10">
                           <input type="text" className="w-full bg-transparent border-b-2 border-white/10 pb-4 text-4xl font-black focus:outline-none focus:border-white transition-colors" placeholder="ENTER ANSWER" value={frInput} onChange={e => setFrInput(e.target.value)} disabled={!!answerState} autoFocus />
                           {!answerState && <Button onClick={handleFRAnswer} className="mt-12 bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl shadow-xl">Submit</Button>}
                        </div>
                      )}
                      
                      {answerState && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5">
                           <div className="flex items-center gap-3 mb-6"><Sparkles className="w-4 h-4 text-indigo-400" /><h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Step-by-Step Explanation</h4></div>
                           <MathText text={q.explanation} className="text-white/70 font-medium text-sm block leading-relaxed mb-10" />
                           <Button onClick={nextQuestion} className="bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2">Next Mission <ChevronRight className="w-4 h-4" /></Button>
                        </motion.div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === "results") {
    const total = questions.length;
    const correct = Object.values(sessionAnswers).filter((a: any) => a.correct).length;
    const pct = Math.round((correct / total) * 100);
    
    // Detect Weak Point
    const errors = sessionProgress.filter(p => !p.correct);
    const weakTopic = errors.length > 0 ? errors.reduce((acc, curr) => {
       acc[curr.category] = (acc[curr.category] || 0) + 1;
       return acc;
    }, {} as any) : null;
    const topWeak = weakTopic ? Object.entries(weakTopic).sort((a: any, b: any) => b[1] - a[1])[0][0] : null;

    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="bg-vignette" />
           <div className="max-w-[1200px] mx-auto text-center relative z-10 w-full">
              <h1 className="text-8xl font-black text-shimmer leading-none mb-12 uppercase italic tracking-tighter">MISSION STATS.</h1>
              
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                 <div className="glass-3d p-12 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy Rating</div>
                    <div className="text-8xl font-black tracking-tighter mb-4">{pct}%</div>
                    <div className="text-xs font-bold text-white/20 uppercase tracking-widest">{correct} / {total} correct</div>
                 </div>
                 
                 <div className="md:col-span-2 glass-3d p-12 flex flex-col justify-center text-left">
                    <div className="flex items-center gap-3 mb-8">
                       <Brain className="w-6 h-6 text-indigo-400" />
                       <h3 className="text-2xl font-black uppercase tracking-tight">Session Review</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12">
                       <div>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Critical Weakness</p>
                          <p className="text-xl font-black uppercase tracking-tight text-rose-400 mb-2">{topWeak || "None Detected"}</p>
                          <p className="text-sm font-medium text-[#666] leading-relaxed">System analysis suggests reviewing conceptual fundamentals in this sector to increase precision.</p>
                       </div>
                       <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-4">Tactical Tip</p>
                          <p className="text-xs font-bold text-white/60 leading-relaxed italic">
                             "Don't rush on {topWeak || 'Mixed'} questions. The extra 10 seconds spent reading the passage carefully increases accuracy by 22%."
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex gap-6 justify-center">
                 <Button onClick={() => setPhase("bank")} variant="outline" className="h-18 px-12 rounded-2xl border-white/10 text-white font-black uppercase text-xs">Back to Prep Hub</Button>
                 <Button onClick={() => nav("/sat/dashboard")} className="h-18 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs shadow-2xl">View Long-term Analytics</Button>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  return null;
}
