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
  ShieldCheck,
  Play,
  CheckCircle2,
  Clock
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
    if (stageNum < 5) setActiveStage(stageNum + 1);
  };

  const totalProgress = (completedStages.length / 5) * 100;

  const getDailyPlan = () => {
    if (completedStages.length === 0 || completedStages.includes(1) && !completedStages.includes(2)) {
      return [
        { day: "Monday", stage: 1, topic: "Punctuation & Boundaries", task: "Watch James Lu Grammar #1", practice: "OnePrepSAT Grammar (15 mins)", videoId: "grammar-1" },
        { day: "Tuesday", stage: 1, topic: "Sentence Structure", task: "Watch James Lu Grammar #2", practice: "OnePrepSAT Boundaries (15 mins)", videoId: "grammar-2" },
        { day: "Wednesday", stage: 1, topic: "Verbs & Agreement", task: "Watch James Lu Grammar #3", practice: "OnePrepSAT Agreement (15 mins)", videoId: "grammar-3" },
        { day: "Thursday", stage: 2, topic: "Transitions", task: "Watch James Lu Expression #1", practice: "OnePrepSAT Transitions (20 mins)", videoId: "expression-1" },
        { day: "Friday", stage: 2, topic: "Rhetorical Synthesis", task: "Watch James Lu Expression #2", practice: "OnePrepSAT Synthesis (20 mins)", videoId: "expression-2" },
        { day: "Weekend", stage: 2, topic: "Weekly Review", task: "Mixed Practice R&W", practice: "OnePrepSAT Module 1", videoId: "review-1" }
      ];
    }
    if (completedStages.includes(2) && !completedStages.includes(3)) {
      return [
        { day: "Monday", stage: 3, topic: "Desmos Strategy", task: "Master Graphing Functions", practice: "OnePrepSAT Algebra (20 mins)", videoId: "math-1" },
        { day: "Tuesday", stage: 3, topic: "Linear Systems", task: "Master Elimination/Substitution", practice: "OnePrepSAT Systems (20 mins)", videoId: "math-2" },
        { day: "Wednesday", stage: 3, topic: "Quadratic Equations", task: "Master Vertex Form", practice: "OnePrepSAT Quadratic (20 mins)", videoId: "math-3" },
        { day: "Thursday", stage: 3, topic: "Geometry Patterns", task: "Master Circle Theorems", practice: "OnePrepSAT Geometry (20 mins)", videoId: "math-4" },
        { day: "Friday", stage: 3, topic: "Data Analysis", task: "Master Statistics & Mean", practice: "OnePrepSAT Stats (20 mins)", videoId: "math-5" },
        { day: "Weekend", stage: 3, topic: "Full Math Simulation", task: "Timed Math Module 1+2", practice: "Bluebook Test #1 Math", videoId: "math-review" }
      ];
    }
    // Fallback for higher stages
    return [
      { day: "Current", stage: 4, topic: "Information & Ideas", task: "Master Passage Evidence", practice: "OnePrepSAT Reading (30 mins)", videoId: "reading-1" },
      { day: "Next", stage: 5, topic: "Test Simulation", task: "Full Bluebook Practice", practice: "Past Paper Simulation", videoId: "final-1" }
    ];
  };

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
                    <Calendar className="w-4 h-4" />
                    Strategic 12-Week Roadmap
                  </motion.div>
                  <h1 className="text-8xl md:text-[140px] font-black italic tracking-tighter uppercase mb-12 text-shimmer leading-[0.85]">
                    DAILY <br /> PLAN.
                  </h1>
                  <p className="text-2xl md:text-3xl text-white/40 font-medium leading-tight italic">
                    Stop guessing. <span className="text-white">Start executing.</span> <br />
                    Your specific daily tasks for Stage {completedStages.length + 1}.
                  </p>
               </div>

               <div className="w-full md:w-96 space-y-8">
                  <div className="p-8 glass-3d border-white/5 bg-white/[0.02]">
                     <div className="flex justify-between items-end mb-6">
                        <div>
                           <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-2">Preparation Mastery</p>
                           <p className="text-4xl font-black italic tracking-tighter">{Math.round(totalProgress)}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-indigo-400" />
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${totalProgress}%` }} className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                     </div>
                  </div>
               </div>
            </div>
          </header>

          {/* Daily Schedule Section */}
          <section className="mb-48">
             <div className="flex items-center gap-4 mb-12">
                <Clock className="w-6 h-6 text-indigo-400" />
                <h2 className="text-3xl font-black uppercase italic tracking-tight">Today's Focus</h2>
             </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDailyPlan().map((day, i) => (
                   <motion.div 
                     key={i} 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="glass-3d p-8 border-white/5 hover:border-white/20 transition-all group"
                   >
                      <div className="flex justify-between items-start mb-8">
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{day.day}</span>
                         <Badge className="bg-white/5 text-white/40 border-none font-black text-[8px] uppercase px-3 py-1">Stage {day.stage}</Badge>
                      </div>
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4 group-hover:text-indigo-400 transition-colors">{day.topic}</h4>
                      <p className="text-sm text-white/40 font-medium mb-8 leading-relaxed italic">"{day.task}"</p>
                      
                      <div className="space-y-4">
                         <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 group/link cursor-pointer hover:bg-white/10 transition-all">
                            <Play className="w-4 h-4 text-white/40 group-hover/link:text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Watch Video</span>
                         </div>
                         <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 group/task cursor-pointer hover:bg-indigo-500/10 transition-all">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{day.practice}</span>
                         </div>
                      </div>
                   </motion.div>
                ))}
             </div>
          </section>

          {/* Timeline View */}
          <section className="space-y-12">
            <div className="flex items-center gap-4 mb-12">
               <History className="w-6 h-6 text-indigo-400" />
               <h2 className="text-3xl font-black uppercase italic tracking-tight">Full Roadmap Timeline</h2>
            </div>
            {SAT_ROADMAP.map((stage) => (
              <RoadmapStageCard 
                key={stage.stage}
                stage={stage}
                isCompleted={completedStages.includes(stage.stage)}
                isLocked={stage.stage > 1 && !completedStages.includes(stage.stage - 1)}
                onComplete={handleComplete}
              />
            ))}
          </section>
        </div>
      </div>
    </Layout>
  );
}
