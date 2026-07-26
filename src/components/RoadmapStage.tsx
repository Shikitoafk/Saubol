import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ExternalLink, 
  Play, 
  Target, 
  Zap, 
  AlertCircle,
  Clock,
  ArrowRight,
  Lightbulb,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoadmapStage } from "@/data/sat-roadmap";

interface RoadmapStageProps {
  stage: RoadmapStage;
  isCompleted: boolean;
  isLocked: boolean;
  onComplete: (stage: number) => void;
}

export default function RoadmapStageCard({ stage, isCompleted, isLocked, onComplete }: RoadmapStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-3d p-12 border-line relative overflow-hidden transition-all ${
        isLocked ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
        <div className="flex-1 space-y-10">
           <header>
              <div className="flex items-center gap-3 mb-6">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic border ${
                    isCompleted ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-surface border-line text-ink-muted'
                 }`}>
                    {stage.stage}
                 </div>
                 <div className="flex items-center gap-3 px-3 py-1 bg-surface rounded-full border border-line">
                    <Clock className="w-3 h-3 text-ink-muted" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-ink-muted">{stage.duration}</span>
                 </div>
                 {isCompleted && (
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                       <CheckCircle2 className="w-4 h-4" /> Completed
                    </div>
                 )}
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4 text-shimmer">{stage.title}</h2>
              <p className="text-ink-muted text-lg font-medium italic">{stage.subtitle}</p>
           </header>

           <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                 <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
                       <Lightbulb className="w-4 h-4" /> Strategic Rationale
                    </h4>
                    <p className="text-ink-muted text-sm leading-relaxed font-medium">{stage.why}</p>
                 </div>

                 {stage.videos && (
                    <div>
                       <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
                          <Play className="w-4 h-4" /> Instructional Content
                       </h4>
                       <div className="space-y-3">
                          {stage.videos.map((vid, i) => (
                             <a 
                               key={i} 
                               href={vid.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line hover:bg-surface-2 transition-all group"
                             >
                                <span className="text-sm font-bold group-hover:text-indigo-400">{vid.title}</span>
                                <ExternalLink className="w-4 h-4 text-ink-subtle group-hover:text-indigo-400" />
                             </a>
                          ))}
                       </div>
                    </div>
                 )}

                 {stage.topics && (
                    <div>
                       <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Topics Covered</h4>
                       <div className="grid grid-cols-1 gap-3">
                          {stage.topics.map((t, i) => (
                             <div key={i} className="flex items-center gap-3 text-sm font-medium text-ink-muted">
                                <div className="w-1.5 h-1.5 rounded-full bg-surface-2" /> {t}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div className="p-8 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> Practice Target
                    </h4>
                    <p className="text-ink font-black italic tracking-tight mb-6">{stage.practiceTarget}</p>
                    <div className="flex items-center gap-3 px-4 py-3 bg-canvas/40 rounded-xl border border-line text-[10px] font-bold text-ink-muted">
                       <Target className="w-4 h-4 text-emerald-400" /> Goal: {stage.masteryGoal || "100% Completion"}
                    </div>
                 </div>

                 {stage.tip && (
                    <div className="p-8 glass-3d border-line bg-surface">
                       <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-shimmer mb-4 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" /> High-ROI Tip
                       </h4>
                       <p className="text-sm font-medium text-ink-muted leading-relaxed italic">"{stage.tip}"</p>
                    </div>
                 )}

                 {stage.subtopics && (
                    <div className="space-y-6">
                       {stage.subtopics.map((sub, i) => (
                          <div key={i} className="space-y-3">
                             <p className="text-sm font-black uppercase italic tracking-tighter text-indigo-400">{sub.name}</p>
                             <p className="text-xs text-ink-muted leading-relaxed">{sub.strategy}</p>
                             {sub.mustMemorize && (
                                <div className="p-4 bg-surface rounded-xl border border-line space-y-1">
                                   {sub.mustMemorize.map((m, idx) => (
                                      <div key={idx} className="text-[10px] font-bold text-emerald-400/80 tracking-tight">{m}</div>
                                   ))}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="w-full md:w-64 space-y-6">
           <div className="glass-3d p-8 border-line bg-surface text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-ink-subtle mb-4">Stage Status</p>
              <p className={`text-xl font-black italic ${isCompleted ? 'text-emerald-400' : 'text-shimmer'}`}>
                 {isCompleted ? 'MASTERED' : 'IN PROGRESS'}
              </p>
           </div>
           
           {!isCompleted && (
              <Button 
                onClick={() => onComplete(stage.stage)}
                className="w-full h-20 bg-white text-black hover:bg-gray-100 font-black uppercase text-xs rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                 Mark as Complete <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
           )}
        </div>
      </div>

      {/* Decorative Stage Number Background */}
      <div className="absolute -bottom-10 -right-10 text-[200px] font-black text-ink/[0.02] italic select-none pointer-events-none">
        0{stage.stage}
      </div>
    </motion.div>
  );
}
