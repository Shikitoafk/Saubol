import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Target,
  Sparkles,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SATQuestion } from "@/lib/sat-questions-service";
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { saveSATAnswer } from "@/lib/progress-service";

interface PracticeSessionProps {
  topic: string;
  questions: SATQuestion[];
  onComplete: (score: number) => void;
}

export default function PracticeSession({ topic, questions, onComplete }: PracticeSessionProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    const isCorrect = idx === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    
    // Save SAT Answer immediately in background
    const isMath = ["linear_equations", "systems_equations", "quadratic", "inequalities"].includes(currentQuestion.topic);
    const category = isMath ? "Math" : "RW";
    saveSATAnswer(category, currentQuestion.topic || "General", isCorrect).catch(console.error);
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(prev => prev + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      onComplete(correctCount);
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

  return (
    <div className="max-w-5xl mx-auto p-12">
      {/* Session HUD */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
           <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Current Focus</p>
              <p className="text-sm font-black uppercase text-indigo-400">{topic}</p>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Complexity</p>
              <p className={`text-sm font-black uppercase tracking-tight ${
                index < 8 ? 'text-emerald-400' : index < 18 ? 'text-indigo-400' : 'text-rose-400'
              }`}>
                {index < 8 ? 'Foundational' : index < 18 ? 'Application' : 'High Difficulty'}
              </p>
           </div>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-white/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Question {index + 1} of {questions.length}</span>
           </div>
           <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progress}%` }} className="h-full bg-indigo-500" />
           </div>
        </div>
      </div>

      <div className="glass-3d p-12 border-white/5 relative overflow-hidden">
         {currentQuestion.imageUrl && (
            <div className="mb-8">
              <img src={currentQuestion.imageUrl} alt="Question visual" className="max-w-full rounded-2xl border border-white/5" />
            </div>
         )}

         {currentQuestion.passage && (
            <div className="mb-12 p-10 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-indigo-500">
               <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-6">Reading Passage</p>
               <p className="text-xl leading-relaxed text-white/80 font-medium">{currentQuestion.passage}</p>
            </div>
         )}

         <div className="text-3xl font-black italic tracking-tighter leading-tight mb-12" dangerouslySetInnerHTML={{ __html: renderText(currentQuestion.question) }} />

         <div className="grid gap-4">
            {currentQuestion.options.map((opt, i) => {
               const isCorrect = i === currentQuestion.correctAnswer;
               const isSelected = selected === i;
               const status = showFeedback ? (isCorrect ? 'correct' : isSelected ? 'wrong' : 'idle') : 'idle';

               return (
                  <button
                    key={i}
                    disabled={showFeedback}
                    onClick={() => handleSelect(i)}
                    className={`w-full p-8 rounded-2xl border transition-all flex items-center justify-between group ${
                      status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                      status === 'wrong' ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' :
                      'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                     <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-sm transition-all ${
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

      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
             <div className={`glass-3d p-10 border-white/5 ${selected === currentQuestion.correctAnswer ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                <div className="flex items-center gap-3 mb-6">
                   <Sparkles className={`w-5 h-5 ${selected === currentQuestion.correctAnswer ? 'text-emerald-400' : 'text-rose-400'}`} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">
                     {selected === currentQuestion.correctAnswer ? 'Strategic Success' : 'Strategy Adjustment'}
                   </h4>
                </div>
                
                <div className="text-white/80 text-lg leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: renderText(currentQuestion.explanation) }} />

                {selected !== currentQuestion.correctAnswer && (
                   <div className="pt-8 border-t border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                         <ShieldAlert className="w-4 h-4 text-rose-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">The Trap</span>
                      </div>
                      <p className="text-sm font-medium text-white/40 italic leading-relaxed">
                         {currentQuestion.wrongExplanations?.[selected || 0] || "CollegeBoard often includes this option for students who miss a critical step in the procedure."}
                      </p>
                   </div>
                )}
             </div>

             <Button 
               onClick={handleNext}
               className="w-full h-20 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
             >
                {index < questions.length - 1 ? 'Analyze Next Challenge' : 'Finalize Session'} <ArrowRight className="w-5 h-5" />
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
