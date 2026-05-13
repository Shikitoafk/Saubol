import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Info,
  Sparkles,
  Zap,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SATQuestion } from "@/data/sat-questions-bank";
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface PracticeQuestionProps {
  question: SATQuestion;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
}

export default function PracticeQuestion({ 
  question, 
  onAnswer, 
  onNext,
  currentIndex,
  total
}: PracticeQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    onAnswer(idx === question.correctAnswer);
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

  return (
    <div className="max-w-4xl mx-auto p-12 space-y-10 selection:bg-indigo-500/30">
      {/* HUD */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
           <div className="text-center">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Topic</p>
              <p className="text-sm font-black uppercase tracking-tight text-white/60">{question.topic}</p>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-center">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Difficulty</p>
              <p className={`text-sm font-black uppercase tracking-tight ${
                question.difficulty === 'Easy' ? 'text-emerald-400' : 
                question.difficulty === 'Medium' ? 'text-indigo-400' : 'text-rose-400'
              }`}>{question.difficulty}</p>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
           <BarChart3 className="w-4 h-4 text-indigo-400" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Question {currentIndex + 1} / {total}</span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-3d p-12 border-white/5">
        {question.passage && (
          <div className="p-8 bg-white/5 rounded-2xl border border-white/10 mb-10">
            <div className="flex items-center gap-2 mb-4 opacity-30">
              <Target className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Passage Analysis</span>
            </div>
            <p className="text-lg leading-relaxed font-medium text-white/80">{question.passage}</p>
          </div>
        )}
        
        <div className="text-3xl font-black leading-tight tracking-tight mb-12" dangerouslySetInnerHTML={{ __html: renderText(question.question) }} />

        {/* Options */}
        <div className="grid gap-4">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correctAnswer;
            const isSelected = selected === i;
            const status = showFeedback ? (isCorrect ? 'correct' : isSelected ? 'wrong' : 'idle') : 'idle';

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={showFeedback}
                className={`w-full p-8 text-left rounded-2xl border transition-all flex items-center justify-between group ${
                  status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.1)]' :
                  status === 'wrong' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-sm transition-colors ${
                    status === 'correct' ? 'bg-emerald-500 border-emerald-400 text-black' :
                    status === 'wrong' ? 'bg-rose-500 border-rose-400 text-black' :
                    'bg-white/5 border-white/10 text-white/20'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: renderText(opt) }} />
                </div>
                {status === 'correct' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                {status === 'wrong' && <XCircle className="w-6 h-6 text-rose-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback & Explanations */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-3d p-10 border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-3 mb-6">
                 <Sparkles className="w-5 h-5 text-indigo-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mastery Explanation</h4>
              </div>
              <div className="text-white/80 font-medium text-lg leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: renderText(question.explanation) }} />
              
              <div className="space-y-4 pt-8 border-t border-white/5">
                 <h5 className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-4">Strategic Error Analysis</h5>
                 <div className="grid md:grid-cols-2 gap-4">
                    {question.wrongExplanations.map((msg, i) => (
                       <div key={i} className="flex gap-3 p-4 bg-black/20 rounded-xl border border-white/5 opacity-60">
                          <Info className="w-3.5 h-3.5 text-[#444] shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium text-white/40 leading-relaxed italic">{msg}</p>
                       </div>
                    ))}
                 </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setSelected(null);
                setShowFeedback(false);
                onNext();
              }}
              className="w-full h-20 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
            >
              Continue to next challenge <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
