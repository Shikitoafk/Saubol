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
  ArrowUpRight
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
import { predictFutureScore } from "@/lib/sat-logic";

export default function SATDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch Diagnostics
        const { data: diagnostics } = await supabase
          .from('sat_diagnostics')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        // Fetch Recent Practice
        const { data: practice } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('answered_at', { ascending: false });

        // Fetch Topic Performance
        const { data: topicPerformance } = await supabase
          .from('topic_performance')
          .select('*')
          .eq('user_id', user.id);

        // Fetch Streak
        const { data: streak } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
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
            { date: 'Current', score: latestDiagnostic.overall_score }
          ];

        // Process topic accuracy
        const topicData = topicPerformance?.map(t => ({
          name: t.topic,
          accuracy: Math.round((t.questions_correct / Math.max(1, t.questions_answered)) * 100),
          section: t.section
        })) || [
          { name: 'Algebra', accuracy: 65, section: 'Math' },
          { name: 'Geometry', accuracy: 45, section: 'Math' },
          { name: 'Reading', accuracy: 80, section: 'RW' },
          { name: 'Writing', accuracy: 72, section: 'RW' }
        ];

        setStats({
          currentScore: latestDiagnostic.overall_score,
          mathScore: latestDiagnostic.math_score,
          rwScore: latestDiagnostic.rw_score,
          streak: streak?.current_streak || 0,
          predictedScore: predictFutureScore(latestDiagnostic.overall_score, [60, 70, 75]), // Mock trend
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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-40 animate-pulse" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-32 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Target className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-indigo-400">Mission Intelligence</span>
              </div>
              <h1 className="text-7xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                SAT <br /> INSIGHTS.
              </h1>
            </div>
            
            <div className="flex items-center gap-8 p-10 glass-3d border-white/10 bg-white/[0.03]">
               <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Current Trajectory</p>
                  <p className="text-5xl font-black text-emerald-400 tracking-tighter uppercase italic">{stats.predictedScore}</p>
               </div>
               <div className="w-px h-16 bg-white/10" />
               <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Daily Streak</p>
                  <div className="flex items-center gap-3">
                     <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                     <p className="text-4xl font-black tracking-tighter">{stats.streak} DAYS</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
            {[
              { label: 'Overall Score', val: stats.currentScore, sub: 'Diagnostic Average', icon: Trophy, color: 'text-white' },
              { label: 'Math Precision', val: stats.mathScore, sub: 'Algebra & Advanced', icon: Brain, color: 'text-blue-400' },
              { label: 'R&W Accuracy', val: stats.rwScore, sub: 'Evidence Based', icon: Sparkles, color: 'text-indigo-400' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-3d p-12 group hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-12">
                   <stat.icon className={`w-8 h-8 ${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                   <Badge className="bg-white/5 text-white/40 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Verified</Badge>
                </div>
                <div className={`text-7xl font-black mb-4 ${stat.color} tracking-tighter`}>{stat.val}</div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">{stat.label}</div>
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-12 mb-32">
             {/* Score Progress Chart */}
             <div className="glass-3d p-16">
                <div className="flex items-center justify-between mb-16">
                   <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase italic">Score Velocity</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Growth trajectory over cycles</p>
                   </div>
                   <Button variant="ghost" className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-[#444] hover:text-white border border-white/10">Full History</Button>
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
                         <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fill="url(#colorScore)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Topic Accuracy Chart */}
             <div className="glass-3d p-16">
                <div className="flex items-center justify-between mb-16">
                   <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase italic">Topic Precision</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Accuracy % across critical sectors</p>
                   </div>
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                   </div>
                </div>
                <div className="h-[400px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.topicData} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={120} tickLine={false} axisLine={false} />
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

          {/* Action Center */}
          <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 glass-3d p-16 border-indigo-500/20 bg-indigo-500/5 group">
                <div className="flex justify-between items-start mb-12">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-[0_20px_40px_rgba(79,70,229,0.4)]">
                      <Zap className="w-8 h-8 text-white" />
                   </div>
                   <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Priority Next Step</div>
                </div>
                <h4 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-tight italic">Practice Advanced Math.</h4>
                <p className="text-[#666] font-medium text-lg leading-relaxed mb-12">Твой текущий уровень в Math Hub — 620. Исправь ошибки в Algebra, чтобы достичь 700+ уже на следующей неделе.</p>
                <Button 
                  onClick={() => navigate('/sat/practice')}
                  className="bg-white text-black hover:bg-gray-100 rounded-2xl px-12 h-16 font-black uppercase text-xs transition-all group-hover:scale-105"
                >
                  Engage Practice <ArrowUpRight className="ml-2 w-4 h-4" />
                </Button>
             </div>
             
             <div className="w-full md:w-96 space-y-8">
                <div className="glass-3d p-10 border-white/5">
                   <div className="flex items-center gap-3 mb-6">
                      <History className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Recent Activity</span>
                   </div>
                   <div className="space-y-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                           <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Math Practice</span>
                           </div>
                           <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">2h ago</span>
                        </div>
                      ))}
                   </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/sat/study-plan')}
                  className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Adjust AI Study Plan <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-1 rounded text-[8px] font-bold ${className}`}>
      {children}
    </span>
  );
}
