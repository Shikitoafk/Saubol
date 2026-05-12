import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Target, 
  Zap, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Brain,
  History,
  Lock,
  BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateStudyPlan, StudyPlan } from "@/lib/sat-logic";

export default function SATStudyPlan() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreatePlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: existingPlan } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('active', true)
          .maybeSingle();

        if (existingPlan) {
          setPlan(existingPlan.plan_data);
        } else {
          const { data: diagnostic } = await supabase
            .from('sat_diagnostics')
            .select('*')
            .eq('user_id', session.user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const newPlan = generateStudyPlan(
            diagnostic?.weak_topics || [],
            diagnostic?.strong_topics || []
          );

          await supabase.from('study_plans').insert({
            user_id: session.user.id,
            plan_data: newPlan
          });

          setPlan(newPlan);
        }
      } catch (error) {
        console.error("Error with study plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreatePlan();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">Calibrating Weekly Cycle</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-yellow-400">Tactical Strategy</span>
              </div>
              <h1 className="text-7xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                WEEK 01 <br /> PLAN.
              </h1>
            </div>
            
            <div className="flex gap-8">
               <div className="glass-3d p-10 bg-indigo-500/5 border-indigo-500/10 min-w-[280px]">
                  <div className="flex items-center gap-3 mb-6">
                     <Target className="w-5 h-5 text-indigo-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Primary Focus</span>
                  </div>
                  <div className="text-3xl font-black uppercase tracking-tighter mb-2">{plan?.focusTopics[0]}</div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">70% of weekly volume</p>
               </div>
               <div className="glass-3d p-10 bg-white/[0.02] border-white/10 min-w-[280px]">
                  <div className="flex items-center gap-3 mb-6">
                     <TrendingUp className="w-5 h-5 text-emerald-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Exp. Growth</span>
                  </div>
                  <div className="text-4xl font-black mb-2">+{plan?.estimatedImprovement}pts</div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Target for this cycle</p>
               </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Schedule */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Operational Cadence</h3>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#444]"><CheckCircle2 className="w-3 h-3" /> Completed</div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-400"><Clock className="w-3 h-3" /> Scheduled</div>
                 </div>
              </div>

              {plan?.schedule.map((day, i) => (
                <motion.div 
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-3d p-8 flex items-center justify-between group transition-all ${
                    day.completed ? 'border-emerald-500/20 bg-emerald-500/5' : 
                    day.type === 'test' ? 'border-indigo-500/20 bg-indigo-500/5' :
                    day.type === 'review' ? 'border-amber-500/20 bg-amber-500/5' :
                    'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-8">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-black transition-all ${
                       day.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/40 group-hover:bg-white/10'
                    }`}>
                      <span className="text-[9px] uppercase leading-none mb-1">{day.day.substring(0, 3)}</span>
                      <span className="text-xl tracking-tighter leading-none">{i + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <h4 className="text-2xl font-black uppercase tracking-tight">{day.topic}</h4>
                         <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                            day.type === 'test' ? 'bg-indigo-500/20 text-indigo-400' : 
                            day.type === 'review' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/20'
                         }`}>{day.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] uppercase tracking-widest italic">
                          {day.subtopic}
                        </span>
                        {day.questions > 0 && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> {day.questions} Qs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {day.completed ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => navigate('/sat/practice')}
                        className="h-14 px-8 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                        {day.type === 'review' ? 'Start Review' : day.type === 'test' ? 'Begin Test' : 'Engage'} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sidebar: Intelligence */}
            <div className="lg:col-span-4 space-y-8">
               <div className="glass-3d p-12 border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Adaptive Logic</h4>
                  </div>
                  <p className="text-white/80 font-medium leading-relaxed mb-10 text-sm">
                    Based on your diagnostic, we have front-loaded <span className="text-indigo-400 font-bold uppercase">{plan?.focusTopics[0]}</span>. This week focuses on building structural accuracy before increasing complexity in Week 2.
                  </p>
                  <div className="space-y-4">
                     <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-[#444] uppercase tracking-widest mb-2">Weekend Objective</p>
                        <p className="text-xs font-bold text-white/60">Mixed-difficulty Full Section simulation.</p>
                     </div>
                  </div>
               </div>

               <div className="glass-3d p-12 border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 flex items-center gap-2">
                     <BarChart3 className="w-4 h-4" /> Readiness Index
                  </h4>
                  <div className="space-y-8">
                    {[
                      { label: "Target Topic Mastery", val: 12, color: "bg-indigo-500" },
                      { label: "Consistency Score", val: 85, color: "bg-emerald-500" },
                      { label: "Exam Endurance", val: 40, color: "bg-amber-500" }
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black uppercase text-[#444] tracking-widest">{m.label}</span>
                          <span className="text-[9px] font-black text-white">{m.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${m.val}%` }}
                             className={`h-full ${m.color}`}
                           />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="glass-3d p-10 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all">
                  <div className="flex items-center gap-4">
                     <Lock className="w-5 h-5 text-[#333]" />
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest">Week 02</p>
                        <p className="text-[9px] font-bold text-[#444] uppercase tracking-widest">Unlocks Saturday</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#222]" />
               </div>
               
               <Button 
                onClick={() => navigate('/sat/dashboard')}
                variant="ghost"
                className="w-full h-16 border border-white/5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/5"
               >
                 View Strategic Dash <ChevronRight className="ml-2 w-4 h-4" />
               </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
