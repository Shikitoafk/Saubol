import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Target, 
  Zap, 
  Sparkles,
  TrendingUp,
  Brain,
  ChevronRight,
  ArrowRight,
  Calculator,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { SAT_ROADMAP } from "@/data/sat-roadmap";
import RoadmapStageCard from "@/components/RoadmapStage";
import { Button } from "@/components/ui/button";

export default function SATRoadmap() {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('sat-roadmap-progress');
    if (saved) setCompletedStages(JSON.parse(saved));
  }, []);

  const handleComplete = (stageNum: number) => {
    if (completedStages.includes(stageNum)) return;
    const newCompleted = [...completedStages, stageNum];
    setCompletedStages(newCompleted);
    localStorage.setItem('sat-roadmap-progress', JSON.stringify(newCompleted));
    
    // Auto-advance
    if (stageNum < 5) setActiveStage(stageNum + 1);
  };

  const totalProgress = (completedStages.length / 5) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-32 pb-48 px-10 relative overflow-hidden">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-20" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <header className="mb-32">
            <div className="flex flex-col md:flex-row justify-between items-end gap-12">
               <div className="max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8"
                  >
                    <History className="w-4 h-4" />
                    Strategic Preparation Protocol
                  </motion.div>
                  <h1 className="text-8xl md:text-[140px] font-black italic tracking-tighter uppercase mb-12 text-shimmer leading-[0.85]">
                    THE <br /> ROADMAP.
                  </h1>
                  <p className="text-2xl md:text-3xl text-white/40 font-medium leading-tight italic">
                    Learn the rules. <span className="text-white">Master the patterns.</span> <br />
                    Score 1550+ in 10-12 weeks of focused execution.
                  </p>
               </div>

               <div className="w-full md:w-96 space-y-8">
                  <div className="p-8 glass-3d border-white/5 bg-white/[0.02]">
                     <div className="flex justify-between items-end mb-6">
                        <div>
                           <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-2">Total Roadmap Progress</p>
                           <p className="text-4xl font-black italic tracking-tighter">{Math.round(totalProgress)}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-indigo-400" />
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: `${totalProgress}%` }}
                          className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                     {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 rounded-full ${completedStages.includes(i) ? 'bg-indigo-500' : 'bg-white/5'}`} />
                     ))}
                  </div>
               </div>
            </div>
          </header>

          <div className="space-y-12">
            {SAT_ROADMAP.map((stage) => (
              <RoadmapStageCard 
                key={stage.stage}
                stage={stage}
                isCompleted={completedStages.includes(stage.stage)}
                isLocked={stage.stage > 1 && !completedStages.includes(stage.stage - 1)}
                onComplete={handleComplete}
              />
            ))}
          </div>

          <footer className="mt-32 pt-32 border-t border-white/5">
             <div className="grid md:grid-cols-3 gap-12">
                {[
                  { label: "Official Prep", value: "Bluebook App", icon: ShieldCheck, desc: "Mandatory for real-time scoring simulation." },
                  { label: "Vocabulary", value: "Quizlet Deck", icon: Brain, desc: "Add every unknown word from your practice." },
                  { label: "Target Practice", value: "OnePrepSAT", icon: Target, desc: "The engine for topic-specific mastery." }
                ].map((item, i) => (
                  <div key={i} className="p-10 glass-3d border-white/5">
                     <item.icon className="w-8 h-8 text-indigo-400 mb-6" />
                     <h4 className="text-sm font-black uppercase tracking-widest text-white/20 mb-2">{item.label}</h4>
                     <p className="text-2xl font-black italic mb-4">{item.value}</p>
                     <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
             </div>
          </footer>
        </div>
      </div>
    </Layout>
  );
}
