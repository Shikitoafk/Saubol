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
  Brain
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Try to fetch existing plan
        const { data: existingPlan } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (existingPlan) {
          setPlan(existingPlan.plan_data);
        } else {
          // Fetch diagnostic to generate new plan
          const { data: diagnostic } = await supabase
            .from('sat_diagnostics')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const newPlan = generateStudyPlan(
            diagnostic?.weak_topics || [],
            diagnostic?.strong_topics || []
          );

          await supabase.from('study_plans').insert({
            user_id: user.id,
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
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Architecting Study Plan</p>
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
            className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-yellow-400">Personalized Strategy</span>
              </div>
              <h1 className="text-7xl md:text-[120px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                AI STUDY <br /> PLAN.
              </h1>
            </div>
            
            <div className="glass-3d p-10 bg-white/[0.02] border-white/10 min-w-[300px]">
               <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Weekly Forecast</span>
               </div>
               <div className="text-5xl font-black mb-2">+{plan?.estimatedImprovement}pts</div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Expected improvement this cycle</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Schedule */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-8">Weekly Operational Cadence</h3>
              {plan?.schedule.map((day, i) => (
                <motion.div 
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-3d p-8 flex items-center justify-between group transition-all ${
                    day.completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40 border border-white/5">
                      {day.day.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight mb-1">{day.topic}</h4>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] uppercase tracking-widest">
                          <Zap className="w-3 h-3" /> {day.questions} Questions
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> ~45 min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {day.completed ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => navigate('/sat/practice')}
                      variant="ghost" 
                      className="h-12 px-6 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black"
                    >
                      Start Session <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
               <div className="glass-3d p-12 border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Recommendation</h4>
                  </div>
                  <p className="text-white/80 font-medium leading-relaxed mb-10">
                    Your diagnostic shows a critical gap in <span className="text-indigo-400 font-bold">Advanced Math</span>. We have adjusted your Thursday and Friday sessions to prioritize algebraic manipulation.
                  </p>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-white/40">Focus Score</span>
                     <span className="text-2xl font-black">94%</span>
                  </div>
               </div>

               <div className="glass-3d p-12 border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8">Mastery Metrics</h4>
                  <div className="space-y-6">
                    {[
                      { label: "Math Consistency", val: 82, color: "bg-blue-500" },
                      { label: "RW Precision", val: 68, color: "bg-indigo-500" },
                      { label: "Daily Persistence", val: 95, color: "bg-emerald-500" }
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black uppercase text-[#444] tracking-widest">{m.label}</span>
                          <span className="text-[9px] font-black text-white">{m.val}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
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
               
               <Button 
                onClick={() => navigate('/sat/dashboard')}
                className="w-full h-16 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest text-xs"
               >
                 View Performance Dashboard <ChevronRight className="ml-2 w-4 h-4" />
               </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
