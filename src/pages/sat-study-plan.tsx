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
  Lock,
  BarChart3,
  Timer
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateIntelligentPlan, WeeklyPlan } from "@/lib/sat-logic";

export default function SATStudyPlan() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [masteryData, setMasteryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: diagnostic } = await supabase
          .from('sat_diagnostic')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const newPlan = generateIntelligentPlan(currentWeek, diagnostic?.weak_topics || []);
        setPlan(newPlan);

        // Fetch mastery data
        const { data: topicPerformance } = await supabase
          .from('sat_progress')
          .select('*')
          .eq('user_id', session.user.id);
        
        setMasteryData(topicPerformance?.map(t => ({
          name: t.subtopic,
          accuracy: t.mastery_percent || 0,
          section: t.topic
        })) || []);

      } catch (error) {
        console.error("Error with study plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [navigate, currentWeek]);

  if (loading) return <Layout><div className="min-h-screen bg-canvas flex items-center justify-center"><Brain className="w-12 h-12 animate-spin text-indigo-500" /></div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-32 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-yellow-400">Intelligent Tutor v3.0</span>
              </div>
              <h1 className="text-7xl md:text-[120px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                WEEK 0{currentWeek} <br /> {plan?.title?.split(' ')[0]}.
              </h1>
              <p className="text-ink-muted text-xl font-medium mt-10 max-w-xl">{plan?.objective}</p>
            </div>
            
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                <button
                  key={w}
                  onClick={() => setCurrentWeek(w)}
                  className={`w-12 h-12 rounded-xl border font-black text-[10px] transition-all ${currentWeek === w ? 'bg-white text-black border-white' : 'bg-surface border-line text-ink-muted hover:bg-surface-2'}`}
                >
                  0{w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Schedule */}
            <div className="lg:col-span-8 space-y-6">
              {plan?.schedule?.map((day, i) => (
                <motion.div 
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-3d p-8 flex items-center justify-between group transition-all ${
                    day.type === 'timed' ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-line hover:border-line'
                  }`}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-line bg-surface font-black group-hover:bg-surface-2 transition-all">
                      <span className="text-[9px] uppercase leading-none mb-1 text-ink-muted">{day.day.substring(0, 3)}</span>
                      <span className="text-xl tracking-tighter leading-none">{i + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-2xl font-black uppercase tracking-tight">{day.topic}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${day.type === 'timed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-surface text-ink-subtle'}`}>{day.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest italic">{day.subtopic}</span>
                        {day.questions > 0 && <span className="flex items-center gap-1.5 text-[10px] font-black text-ink-subtle uppercase tracking-widest"><Zap className="w-3 h-3" /> {day.questions} Qs</span>}
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-ink-subtle uppercase tracking-widest"><Clock className="w-3 h-3" /> {day.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[9px] font-black uppercase text-ink-subtle tracking-widest">{day.target}</p>
                    <Button 
                      onClick={() => navigate('/sat/practice')}
                      className="h-12 px-8 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      Begin <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sidebar: Mastery */}
            <div className="lg:col-span-4 space-y-8">
               <div className="glass-3d p-12 border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mastery Unlock System</h4>
                  </div>
                  <p className="text-ink-muted text-sm leading-relaxed mb-10">
                    User cannot advance to <span className="text-ink font-bold">Hard</span> difficulty until they hit <span className="text-indigo-400 font-bold">70% accuracy</span> on Medium for that topic.
                  </p>
                  
                  <div className="space-y-8">
                    {masteryData?.length > 0 ? masteryData.map(m => (
                      <div key={m.name}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black uppercase text-ink-subtle tracking-widest">{m.name}</span>
                          <span className="text-[9px] font-black text-ink">{m.accuracy}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${m.accuracy}%` }} className={`h-full ${m.accuracy >= 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest text-center py-10">No practice data yet</p>
                    )}
                  </div>
               </div>

               <div className="glass-3d p-12 border-line">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-ink-subtle mb-8 flex items-center gap-2"><Timer className="w-4 h-4" /> Timed Modules</h4>
                  <div className="p-6 bg-canvas/40 rounded-2xl border border-line">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">RW Timing</p>
                    <p className="text-xl font-black">32 MINUTES</p>
                    <p className="text-[9px] font-medium text-ink-subtle mt-1">27 Questions per module</p>
                  </div>
                  <div className="p-6 bg-canvas/40 rounded-2xl border border-line mt-4">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Math Timing</p>
                    <p className="text-xl font-black">35 MINUTES</p>
                    <p className="text-[9px] font-medium text-ink-subtle mt-1">22 Questions per module</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
