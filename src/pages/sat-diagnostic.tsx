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
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateWeightedScore } from "@/lib/sat-logic";
import { SAT_QUESTION_BANK } from "@/data/sat-questions";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function SATDiagnostic() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate a 20-question diagnostic from the bank
    const diagQs: any[] = [];
    const sections = ['Math', 'RW'];
    
    sections.forEach(section => {
      const categories = Object.keys(SAT_QUESTION_BANK?.[section] || {});
      categories.forEach(cat => {
        const topics = Object.keys(SAT_QUESTION_BANK?.[section]?.[cat] || {});
        topics.forEach(topic => {
          const qs = SAT_QUESTION_BANK?.[section]?.[cat]?.[topic] || [];
          if (qs && qs.length > 0) {
            diagQs.push(...qs);
          }
        });
      });
    });

    // Shuffle and pick 20
    const shuffled = [...diagQs].sort(() => 0.5 - Math.random()).slice(0, 20);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(-1));
    setLoading(false);
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
      difficulty: q?.difficulty || 'Medium',
      section: q?.section || 'Math'
    }));

    const score = calculateWeightedScore(formatted);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('sat_diagnostics').insert({
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$$')) return <BlockMath key={i} math={part.slice(2, -2)} />;
      if (part.startsWith('$')) return <InlineMath key={i} math={part.slice(1, -1)} />;
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) return <Layout><div className="min-h-screen bg-black flex items-center justify-center"><Brain className="w-12 h-12 animate-spin text-indigo-500" /></div></Layout>;

  if (results) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-3d p-16 max-w-4xl w-full text-center">
            <h2 className="text-5xl font-black uppercase mb-12 italic">Diagnostic Results.</h2>
            <div className="grid grid-cols-3 gap-8 mb-16">
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">Math</p>
                <p className="text-4xl font-black">{results.math}</p>
              </div>
              <div className="p-10 bg-indigo-600 rounded-3xl shadow-2xl">
                <p className="text-[10px] font-black uppercase text-white/60 mb-2">Total Score</p>
                <p className="text-7xl font-black">{results.total}</p>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">R&W</p>
                <p className="text-4xl font-black">{results.rw}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/sat/study-plan')} className="w-full h-20 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl">Initialize Study Plan</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const q = questions?.[currentIdx];
  if (!q) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
        <div className="max-w-[1600px] mx-auto w-full px-10 pt-24 pb-6 relative z-10 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><Target className="w-6 h-6 text-indigo-400" /></div>
              <div><h2 className="text-xl font-black uppercase">SAT Diagnostic</h2><p className="text-[10px] font-black text-white/20 uppercase">Question {currentIdx + 1} of {questions?.length}</p></div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-xl border border-white/10"><Timer className="w-4 h-4 text-indigo-400" /><span className="text-xs font-black">ADAPTIVE EVALUATION</span></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 flex-1 overflow-hidden">
            <div className="glass-3d p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              {q?.passage && (
                <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4 opacity-30"><FileText className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Passage</span></div>
                  <p className="text-lg leading-relaxed font-medium text-white/80">{q.passage}</p>
                </div>
              )}
              <div className="text-2xl font-black leading-tight tracking-tight">{renderText(q.question)}</div>
            </div>

            <div className="space-y-4">
              {q?.options?.map((opt: string, i: number) => (
                <button key={i} onClick={() => handleSelect(i)} className={`w-full p-8 text-left rounded-2xl border transition-all flex items-center justify-between group ${answers?.[currentIdx] === i ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                  <span className="text-lg font-bold">{renderText(opt)}</span>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[10px] font-black ${answers?.[currentIdx] === i ? 'border-black' : 'border-white/10'}`}>{String.fromCharCode(65 + i)}</div>
                </button>
              ))}

              <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                <Button variant="ghost" onClick={prev} disabled={currentIdx === 0} className="text-[10px] font-black uppercase text-white/40">Back</Button>
                <Button onClick={next} disabled={answers?.[currentIdx] === -1 || isSubmitting} className="bg-indigo-600 px-12 h-16 font-black uppercase text-xs rounded-xl">{currentIdx === (questions?.length || 0) - 1 ? "Complete" : "Next"}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
