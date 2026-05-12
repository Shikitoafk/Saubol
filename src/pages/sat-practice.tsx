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
  Calculator
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { SAT_QUESTION_BANK } from "@/data/sat-questions";
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from "framer-motion";

export default function SATPractice() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"bank" | "quiz" | "results">("bank");
  const [answerState, setAnswerState] = useState<any>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, any>>({});
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const startQuiz = (qs: any[]) => {
    // Safety check
    if (!qs || qs.length === 0) {
      alert("No questions found for this topic.");
      return;
    }
    setQuestions(qs);
    setPhase("quiz");
    setCurrentIdx(0);
    setElapsed(0);
    setSessionAnswers({});
    setAnswerState(null);
  };

  const handleAnswer = async (idx: number) => {
    if (answerState) return;
    const q = questions?.[currentIdx];
    const correct = idx === q?.correctAnswer;
    setAnswerState({ selected: idx, correct });
    setSessionAnswers(p => ({ ...p, [q?.id]: { correct } }));

    // Sync to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('user_progress').insert({
          user_id: session.user.id,
          question_id: q?.id,
          correct
        });
      }
    } catch (err) {
      console.error("Progress sync failed:", err);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < (questions?.length || 0) - 1) {
      setCurrentIdx(i => i + 1);
      setAnswerState(null);
    } else {
      setPhase("results");
    }
  };

  const renderText = (text: string) => {
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

  if (phase === "bank") {
    const sections = Object.keys(SAT_QUESTION_BANK || {});
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <h1 className="text-8xl font-black text-shimmer mb-20 uppercase italic">Prep Hub.</h1>
            <div className="grid lg:grid-cols-2 gap-10">
              {sections.map(section => (
                <div key={section} className="glass-3d p-12">
                  <h2 className="text-4xl font-black mb-10 flex items-center gap-4">
                    {section === 'Math' ? <Calculator className="w-8 h-8 text-blue-400" /> : <FileText className="w-8 h-8 text-purple-400" />}
                    {section} Modules
                  </h2>
                  <div className="grid gap-4">
                    {Object.keys(SAT_QUESTION_BANK?.[section] || {}).map(cat => (
                      <div key={cat} className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">{cat.replace(/_/g, ' ')}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(SAT_QUESTION_BANK?.[section]?.[cat] || {}).map(topic => (
                            <button
                              key={topic}
                              onClick={() => startQuiz(SAT_QUESTION_BANK?.[section]?.[cat]?.[topic])}
                              className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              {topic.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === "quiz") {
    const q = questions?.[currentIdx];
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
          {isDesmosOpen && (
            <div className="fixed inset-y-0 right-0 w-[600px] z-[100] bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
               <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest">Desmos Calculator</span>
                  <Button size="icon" variant="ghost" onClick={() => setIsDesmosOpen(false)}><X className="w-4 h-4" /></Button>
               </div>
               <iframe src="https://www.desmos.com/testing/cb-digital-sat/graphing" className="w-full h-[calc(100%-60px)] border-0" />
            </div>
          )}

          <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <Button variant="ghost" onClick={() => setPhase("bank")} className="text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white"><ChevronLeft className="w-4 h-4 mr-2" /> Exit</Button>
              <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                 <div className="text-center"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Module</p><p className="text-sm font-black">{q?.topic?.replace(/_/g, ' ')}</p></div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="text-center"><p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Question</p><p className="text-sm font-black">{currentIdx + 1} of {questions?.length}</p></div>
              </div>
              <div className="flex items-center gap-4">
                {q?.section === 'Math' && <Button onClick={() => setIsDesmosOpen(!isDesmosOpen)} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Calculator</Button>}
              </div>
            </div>

            <div className="flex-1 overflow-hidden grid lg:grid-cols-2 gap-10">
              <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                {q?.passage && (
                  <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4 opacity-30"><FileText className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Passage</span></div>
                    <p className="text-lg leading-relaxed font-medium text-white/80">{q.passage}</p>
                  </div>
                )}
                <div className="text-2xl font-black leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: renderText(q?.question || "") }} />
              </div>
              
              <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {q?.options?.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`glass-3d p-8 text-left transition-all ${answerState ? (i === q?.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : (answerState.selected === i ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'opacity-20')) : 'bg-white/5 hover:bg-white/10 hover:translate-x-2'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-sm">{String.fromCharCode(65 + i)}</div>
                      <div className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: renderText(opt) }} />
                    </div>
                  </button>
                ))}

                <AnimatePresence>
                  {answerState && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5 mt-6">
                       <div className="flex items-center gap-3 mb-6"><Sparkles className="w-4 h-4 text-indigo-400" /><h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Strategy & Explanation</h4></div>
                       <div className="text-white/70 font-medium text-sm block leading-relaxed mb-10" dangerouslySetInnerHTML={{ __html: renderText(q?.explanation || "") }} />
                       <Button onClick={nextQuestion} className="bg-white text-black hover:bg-gray-100 w-full h-16 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2">Next Question <ChevronRight className="w-4 h-4" /></Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === "results") {
    const total = questions?.length || 0;
    const correct = Object.values(sessionAnswers || {}).filter((a: any) => a.correct).length;
    const pct = Math.round((correct / (total || 1)) * 100);

    return (
      <Layout>
        <div className="min-h-screen bg-black text-white pt-24 p-10 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="max-w-[1200px] mx-auto text-center relative z-10 w-full">
              <h1 className="text-8xl font-black text-shimmer leading-none mb-12 uppercase italic tracking-tighter">Session Over.</h1>
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                 <div className="glass-3d p-12 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Accuracy</div>
                    <div className="text-8xl font-black tracking-tighter mb-4">{pct}%</div>
                    <div className="text-xs font-bold text-white/20 uppercase tracking-widest">{correct} / {total} correct</div>
                 </div>
                 <div className="md:col-span-2 glass-3d p-12 flex flex-col justify-center text-left">
                    <div className="flex items-center gap-3 mb-8">
                       <Brain className="w-6 h-6 text-indigo-400" />
                       <h3 className="text-2xl font-black uppercase tracking-tight">Intelligence Feedback</h3>
                    </div>
                    <p className="text-xl font-medium text-white/60 leading-relaxed mb-8">
                       {pct >= 80 ? "Exceptional mastery demonstrated. Recommend advancing to Hard difficulty for this topic." : 
                        pct >= 60 ? "Solid foundation. Continue targeted practice to reach 80% accuracy before moving on." : 
                        "Fundamentals require reinforcement. Review the strategy and explanations for incorrect answers."}
                    </p>
                    <div className="flex gap-4">
                       <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400">Mastery Updated</div>
                       <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400">Streak Maintained</div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-6 justify-center">
                 <Button onClick={() => setPhase("bank")} variant="outline" className="h-18 px-12 rounded-2xl border-white/10 text-white font-black uppercase text-xs">Return to Hub</Button>
                 <Button onClick={() => navigate("/sat/dashboard")} className="h-18 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs shadow-2xl">View Analytics</Button>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  return null;
}
