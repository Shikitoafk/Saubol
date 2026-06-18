import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Timer, 
  Sparkles, 
  Target, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateWeightedScore } from "@/lib/sat-logic";
import { fetchDiagnosticQuestions, SATQuestion } from "@/lib/sat-questions-service";
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function SATDiagnostic() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetched = await fetchDiagnosticQuestions(20);
        if (fetched.length === 0) {
          setFetchError("No questions available. Please check your database.");
          setLoading(false);
          return;
        }
        setQuestions(fetched);
        setAnswers(new Array(fetched.length).fill(-1));
      } catch (err: any) {
        console.error("Failed to fetch diagnostic questions:", err);
        setFetchError(err?.message || "Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  const handleSelect = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (currentIdx < (questions?.length || 0) - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmit();
    }
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formatted = questions.map((q, i) => ({
      correct: answers?.[i] === q?.correctAnswer,
      difficulty: q?.difficulty ? (q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)) : 'Medium',
      section: (q?.section === 'Math' ? 'Math' : 'RW') as 'Math' | 'RW'
    }));

    const score = calculateWeightedScore(formatted);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('sat_diagnostic').insert({
          user_id: session.user.id,
          overall_score: score.total,
          math_score: score.math,
          rw_score: score.rw,
          weak_topics: Array.from(new Set(formatted.filter(f => !f.correct).map(f => questions[formatted.indexOf(f)]?.topic))),
          strong_topics: Array.from(new Set(formatted.filter(f => f.correct).map(f => questions[formatted.indexOf(f)]?.topic)))
        });
      }
      setResults(score);
    } catch (err) {
      console.error("Diagnostic submission failed:", err);
      // Still show results locally even if DB fails
      setResults(score);
    } finally {
      setIsSubmitting(false);
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

  if (loading) return <Layout><div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4"><Brain className="w-12 h-12 animate-spin text-indigo-500" /><p className="text-sm text-white/40 font-bold uppercase tracking-widest">Loading diagnostic...</p></div></Layout>;

  if (fetchError) return (
    <Layout>
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-6">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <p className="text-lg font-bold text-rose-400">{fetchError}</p>
        <Button onClick={() => window.location.reload()} className="bg-white text-black font-black uppercase text-xs px-8 h-12 rounded-xl">Retry</Button>
      </div>
    </Layout>
  );

  if (results) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-3d p-16 max-w-4xl w-full text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mx-auto mb-8">
               <Target className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-5xl font-black uppercase mb-12 italic tracking-tighter">Diagnostic Results.</h2>
            <div className="grid grid-cols-3 gap-8 mb-16">
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">Math Proficiency</p>
                <p className="text-4xl font-black italic">{results.math}</p>
              </div>
              <div className="p-10 bg-indigo-600 rounded-3xl shadow-[0_30px_60px_rgba(79,70,229,0.3)] border border-indigo-400/20">
                <p className="text-[10px] font-black uppercase text-white/60 mb-2">Estimated SAT</p>
                <p className="text-7xl font-black italic tracking-tighter">{results.total}</p>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">R&W Proficiency</p>
                <p className="text-4xl font-black italic">{results.rw}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-left">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Initial Weaknesses</h4>
                  <div className="space-y-2">
                     {results.weakTopics?.slice(0,3).map((t: string) => (
                        <div key={t} className="text-xs font-bold text-white/40 uppercase">→ {t.replace('_', ' ')}</div>
                     )) || <div className="text-xs font-bold text-white/40">None identified</div>}
                  </div>
               </div>
               <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-left">
                  <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-4 tracking-widest">Profile Strengths</h4>
                  <div className="space-y-2">
                     <div className="text-xs font-bold text-emerald-400/60 uppercase">✓ High Potential</div>
                     <div className="text-xs font-bold text-emerald-400/60 uppercase">✓ Academic Foundation</div>
                  </div>
               </div>
            </div>

            <Button onClick={() => navigate('/sat/roadmap')} className="w-full h-20 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 transition-all shadow-2xl">Initialize Strategic Roadmap</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const q = questions?.[currentIdx];
  if (!q) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col pt-16">
        <div className="bg-sphere top-[-10%] right-[-5%] opacity-20" />
        <div className="max-w-[1600px] mx-auto w-full px-10 py-12 relative z-10 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><Brain className="w-8 h-8 text-indigo-400" /></div>
              <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">SAT Diagnostic</h2>
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Evaluating Student Intelligence: Question {currentIdx + 1} / {questions?.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="hidden md:flex items-center gap-3 bg-white/5 px-6 py-3 rounded-xl border border-white/10">
                  <Timer className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Adaptive Session</span>
               </div>
               <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} className="h-full bg-indigo-500" />
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 flex-1 overflow-hidden">
            <div className="glass-3d p-12 overflow-y-auto custom-scrollbar flex flex-col gap-10">
              {q?.imageUrl && (
                <div className="mb-8">
                  <img src={q.imageUrl} alt="Question visual" className="max-w-full rounded-3xl border border-white/5" />
                </div>
              )}
              {q?.passage && (
                <div className="p-10 bg-white/[0.02] rounded-3xl border border-white/5 relative">
                  <div className="flex items-center gap-2 mb-6 opacity-20"><FileText className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Instructional Context</span></div>
                  <p className="text-xl leading-relaxed font-medium text-white/70 italic leading-loose">{q.passage}</p>
                </div>
              )}
              <div className="text-3xl font-black leading-[1.1] tracking-tight uppercase italic" dangerouslySetInnerHTML={{ __html: renderText(q.question) }} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {q?.options?.map((opt: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelect(i)} 
                    className={`w-full p-10 text-left rounded-3xl border transition-all flex items-center justify-between group h-24 ${answers?.[currentIdx] === i ? 'bg-white text-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]'}`}
                  >
                    <span className="text-lg font-black uppercase italic tracking-tight" dangerouslySetInnerHTML={{ __html: renderText(opt) }} />
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[11px] font-black ${answers?.[currentIdx] === i ? 'border-black' : 'border-white/10'}`}>
                       {String.fromCharCode(65 + i)}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-16 pt-10 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  onClick={prev} 
                  disabled={currentIdx === 0} 
                  className="h-16 px-8 text-[10px] font-black uppercase text-white/20 hover:text-white"
                >
                   <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button 
                  onClick={next} 
                  disabled={answers?.[currentIdx] === -1 || isSubmitting} 
                  className="bg-indigo-600 hover:bg-indigo-500 px-16 h-20 font-black uppercase text-xs rounded-2xl shadow-2xl transition-all hover:scale-105"
                >
                   {currentIdx === (questions?.length || 0) - 1 ? "Complete Evaluation" : "Confirm Answer"} <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
