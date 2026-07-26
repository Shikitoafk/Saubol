import { motion } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Zap, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticeCompleteProps {
  topic: string;
  score: number;
  total: number;
  onRetry: () => void;
  onNext: () => void;
}

export default function PracticeComplete({ topic, score, total, onRetry, onNext }: PracticeCompleteProps) {
  const percentage = Math.round((score / total) * 100);
  const isMastered = percentage >= 70;

  return (
    <div className="max-w-4xl mx-auto p-12 text-center relative selection:bg-indigo-500/30">
      <div className="bg-sphere top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" style={{ width: '600px', height: '600px' }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10"
      >
        <div className="w-32 h-32 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
           <Trophy className="w-16 h-16 text-indigo-400" />
        </div>

        <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-4">{topic} COMPLETE.</h1>
        <p className="text-white/60 font-black uppercase tracking-[0.4em] text-[10px] mb-16">Session performance summarized</p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
           <div className="glass-3d p-10 border-white/5">
              <p className="text-[9px] font-black uppercase text-white/40 mb-4 tracking-widest">Accuracy</p>
              <p className="text-4xl font-black italic tracking-tighter">{score}/{total}</p>
           </div>
           <div className="glass-3d p-10 border-white/5 bg-indigo-500/5 border-indigo-500/20">
              <p className="text-[9px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Mastery Level</p>
              <p className={`text-4xl font-black italic tracking-tighter ${isMastered ? 'text-emerald-400' : 'text-indigo-400'}`}>{percentage}%</p>
           </div>
           <div className="glass-3d p-10 border-white/5">
              <p className="text-[9px] font-black uppercase text-white/40 mb-4 tracking-widest">Global Rank</p>
              <p className="text-4xl font-black italic tracking-tighter text-shimmer">TOP 5%</p>
           </div>
        </div>

        {/* Strength/Weakness Analysis */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 text-left">
           <div className="glass-3d p-10 border-emerald-500/10 bg-emerald-500/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Core Strengths</h4>
              </div>
              <ul className="space-y-3">
                 <li className="text-sm font-medium text-white/75">✓ Fundamental Principles</li>
                 <li className="text-sm font-medium text-white/75">✓ Standard Procedures</li>
                 <li className="text-sm font-medium text-white/75">✓ Basic Interpretation</li>
              </ul>
           </div>
           <div className="glass-3d p-10 border-indigo-500/10 bg-indigo-500/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                 <Target className="w-5 h-5 text-indigo-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target for Review</h4>
              </div>
              <ul className="space-y-3">
                 <li className="text-sm font-medium text-white/75">• Complex Word Problems</li>
                 <li className="text-sm font-medium text-white/75">• Time Management (Last 5 Qs)</li>
                 <li className="text-sm font-medium text-white/75">• Multistep Equations</li>
              </ul>
           </div>
        </div>

        <div className="p-12 glass-3d border-white/5 mb-16">
           <div className="flex items-center justify-between gap-8 text-left">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Brain className="w-7 h-7 text-indigo-400" />
                 </div>
                 <div>
                    <h5 className="text-xl font-black uppercase italic tracking-tight">AI Recommendation</h5>
                    <p className="text-sm text-white/60 max-w-md mt-1">
                       {isMastered 
                         ? `Excellent performance. You are ready to move on to the next topic.` 
                         : `You're close to mastery. We recommend reviewing the word problem sections before continuing.`
                       }
                    </p>
                 </div>
              </div>
              {isMastered && (
                 <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                    <Zap className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Next Topic Unlocked</span>
                 </div>
              )}
           </div>
        </div>

        <div className="flex gap-4">
           <Button 
             variant="outline" 
             onClick={onRetry}
             className="flex-1 h-20 border-white/10 hover:bg-white/5 text-white/60 font-black uppercase text-xs rounded-2xl transition-all"
           >
              <RotateCcw className="mr-3 w-4 h-4" /> Retry Session
           </Button>
           <Button 
             onClick={onNext}
             className="flex-[2] h-20 bg-white text-black hover:bg-gray-100 font-black uppercase text-xs rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-4"
           >
              Proceed to Next Concept <ArrowRight className="w-5 h-5" />
           </Button>
        </div>
      </motion.div>
    </div>
  );
}
