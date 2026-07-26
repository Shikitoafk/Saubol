import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Trophy,
  History,
  Brain,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Star
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { supabase } from "@/lib/supabase";
import { calculateExamReadiness } from "@/lib/sat-logic";

export default function SATDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Fetch Diagnostics
        const { data: diagnostics } = await supabase
          .from('sat_diagnostic')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        // Fetch Topic Performance
        const { data: topicPerformance } = await supabase
          .from('sat_progress')
          .select('*')
          .eq('user_id', session.user.id);

        // Fetch Streak
        const { data: streak } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const latestDiagnostic = diagnostics?.[0] || { overall_score: 400, math_score: 200, rw_score: 200 };
        
        // Mock score history for chart if none exists
        const scoreHistory = diagnostics?.length ? 
          diagnostics.map(d => ({ 
            date: new Date(d.completed_at).toLocaleDateString(), 
            score: d.overall_score 
          })).reverse() : 
          [
            { date: 'Initial', score: 400 },
            { date: 'Target', score: 1550 }
          ];

        // Process topic accuracy
        const topicData = topicPerformance?.map(t => ({
          name: t.subtopic || t.topic,
          accuracy: t.mastery_percent || 0,
          section: t.topic
        })) || [
          { name: 'Algebra', accuracy: 0, section: 'Math' },
          { name: 'Geometry', accuracy: 0, section: 'Math' }
        ];

        const avgAccuracy = topicData.length > 0 ? topicData.reduce((acc, curr) => acc + curr.accuracy, 0) / topicData.length : 0;
        const readiness = calculateExamReadiness(avgAccuracy, (streak?.current_streak || 0) * 10, latestDiagnostic.overall_score);

        setStats({
          currentScore: latestDiagnostic.overall_score,
          mathScore: latestDiagnostic.math_score,
          rwScore: latestDiagnostic.rw_score,
          streak: streak?.current_streak || 0,
          readiness,
          scoreHistory,
          topicData
        });

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-40 animate-pulse" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-32 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Target className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-indigo-400">Strategic Command</span>
              </div>
              <h1 className="text-7xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                SAT <br /> COMMAND.
              </h1>
            </div>
            
            <div className="flex items-center gap-8 p-12 glass-3d border-indigo-500/20 bg-indigo-500/5">
               <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-line flex flex-col items-center justify-center">
                     <p className="text-3xl font-black">{stats.readiness}%</p>
                     <p className="text-[8px] font-black uppercase text-indigo-400">Readiness</p>
                  </div>
                  <svg className="absolute inset-0 -rotate-90 w-32 h-32">
                     <circle cx="64" cy="64" r="60" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-indigo-500" strokeDasharray={`${stats.readiness * 3.77} 377`} />
                  </svg>
               </div>
               <div className="w-px h-24 bg-surface-2" />
               <div>
                  <p className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                     <Zap className="w-3.5 h-3.5 text-yellow-500" /> Streak Consistency
                  </p>
                  <p className="text-6xl font-black tracking-tighter italic">{stats.streak} DAYS</p>
               </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
            {[
              { label: 'Intelligence Base', val: stats.currentScore, sub: 'Weighted Diagnostic Score', icon: ShieldCheck, color: 'text-ink' },
              { label: 'Math Precision', val: stats.mathScore, sub: 'Algebra & Advanced Functions', icon: Activity, color: 'text-blue-400' },
              { label: 'R&W Semantic accuracy', val: stats.rwScore, sub: 'Context & Conventions', icon: Star, color: 'text-indigo-400' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-3d p-12 group hover:border-line-strong transition-all border-line"
              >
                <div className="flex justify-between items-start mb-12">
                   <stat.icon className={`w-10 h-10 ${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase tracking-widest text-ink-subtle">Level</span>
                      <span className="text-xs font-black uppercase tracking-tighter">Certified</span>
                   </div>
                </div>
                <div className={`text-8xl font-black mb-4 ${stat.color} tracking-tighter italic`}>{stat.val}</div>
                <div className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.4em] mb-2">{stat.label}</div>
                <p className="text-[11px] font-bold text-ink-subtle uppercase tracking-widest leading-none">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-12 mb-32">
             <div className="glass-3d p-16 border-line">
                <div className="flex items-center justify-between mb-16">
                   <div>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic">Score Velocity</h3>
                      <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest mt-2">Aggregated performance trajectory</p>
                   </div>
                </div>
                <div className="h-[400px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.scoreHistory}>
                         <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                               <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111" />
                         <XAxis dataKey="date" stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 20 }} />
                         <YAxis stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dx: -20 }} domain={[400, 1600]} />
                         <Tooltip
                            contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', padding: '20px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                         />
                         <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={6} fill="url(#colorScore)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="glass-3d p-16 border-line">
                <div className="flex items-center justify-between mb-16">
                   <div>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic">Topic Precision</h3>
                      <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest mt-2">Semantic accuracy across SAT sectors</p>
                   </div>
                </div>
                <div className="h-[400px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topicData} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={140} tickLine={false} axisLine={false} />
                         <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px' }}
                         />
                         <Bar dataKey="accuracy" radius={[0, 10, 10, 0]}>
                            {stats.topicData.map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={entry.section === 'Math' ? '#3b82f6' : '#6366f1'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Premium Call to Action */}
          <div className="glass-3d p-20 flex flex-col md:flex-row items-center justify-between gap-12 bg-surface border-line">
             <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-8">
                   <Sparkles className="w-8 h-8 text-yellow-500" />
                   <h3 className="text-6xl font-black uppercase tracking-tighter italic">Ready for 1550?</h3>
                </div>
                <p className="text-xl text-ink-muted font-medium leading-relaxed">Твоя готовность к экзамену составляет <span className="text-ink">{stats.readiness}%</span>. Мы рекомендуем сфокусироваться на Advanced Math, чтобы достичь целевого показателя в этом месяце.</p>
             </div>
             <div className="flex gap-6">
                <Button onClick={() => navigate('/sat/practice')} className="h-20 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">Engage Practice</Button>
                <Button onClick={() => navigate('/sat/study-plan')} variant="outline" className="h-20 px-12 rounded-2xl border-line text-ink-muted font-black uppercase text-xs hover:bg-surface">Update Strategy</Button>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
