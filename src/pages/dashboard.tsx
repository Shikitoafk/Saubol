import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/layout';
import {
  Target,
  Trophy,
  Zap,
  History,
  TrendingUp,
  User,
  LogOut,
  PenTool,
  Brain,
  Headphones,
  Book,
  Award,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface UserProgress {
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  current_streak: number;
  favorite_section: string;
  recent_activity: any[];
  daily_activity: any[];
  ielts_activity: any[];
  ielts_stats: {
    writing: number;
    listening: number;
    reading: number;
    overall: number;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndProgress = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          navigate('/login');
          return;
        }
        setUser(session.user);

        // Fetch SAT Progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .order('answered_at', { ascending: false });

        // Fetch IELTS Progress
        const { data: ieltsData } = await supabase
          .from('ielts_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        const rawProgress = progressData || [];
        const rawIelts = ieltsData || [];

        const totalQuestions = rawProgress.length;
        const correctAnswers = rawProgress.filter(d => d.correct).length;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyActivity = last7Days.map(dateStr => ({
          date: dateStr,
          questions_answered: rawProgress.filter(d => (d.answered_at || d.created_at || "").startsWith(dateStr)).length
        }));

        const getAvgBySkill = (skill: string) => {
          const filtered = rawIelts.filter(d => d.skill?.toLowerCase() === skill.toLowerCase());
          return filtered.length === 0 ? 0 : Number((filtered.reduce((acc, curr) => acc + (curr.score || 0), 0) / filtered.length / 10).toFixed(1));
        };

        setProgress({
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          accuracy,
          current_streak: 0,
          favorite_section: 'Writing',
          recent_activity: rawProgress.slice(0, 5).map(d => ({
            section: d.section,
            topic: d.topic || 'General',
            correct: d.correct,
            date: d.answered_at
          })),
          daily_activity: dailyActivity,
          ielts_activity: rawIelts.slice(0, 10).map(d => ({
            test_name: d.test_name,
            score: d.score,
            skill: d.skill,
            completed_at: d.completed_at
          })),
          ielts_stats: {
            writing: getAvgBySkill('writing'),
            listening: getAvgBySkill('listening'),
            reading: getAvgBySkill('reading'),
            overall: rawIelts.length > 0 ? Number((rawIelts.reduce((acc, curr) => acc + (curr.score || 0), 0) / rawIelts.length / 10).toFixed(1)) : 0
          }
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    getUserAndProgress();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/5 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10">
        <div className="glass-3d p-10 text-center max-w-md border-rose-500/20">
          <p className="text-rose-500 font-black uppercase tracking-widest mb-4">Tactical Error Detected</p>
          <p className="text-[#666] mb-8 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-100 w-full h-12 font-black uppercase text-xs rounded-xl">Recalibrate System</Button>
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        {/* Deep Ambient Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }} />
        <div className="bg-sphere bottom-[-10%] right-[-10%] opacity-30" style={{ width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-[1400px] mx-auto px-10 py-32 relative z-10"
        >
          {/* Mission Control Header */}
          <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-blue-400">Tactical Oversight Unit</span>
              </div>
              <h2 className="text-7xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] uppercase italic">
                Mission <br /> Control.
              </h2>
            </div>
            <div className="flex items-center gap-8 p-10 glass-3d border-white/10 bg-white/[0.03]">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_15px_40px_rgba(255,255,255,0.15)] relative overflow-hidden group">
                <User className="w-10 h-10 text-black relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter uppercase">{user?.user_metadata?.full_name || 'Member'}</p>
                <div className="flex items-center gap-3 mt-2">
                   <div className="px-3 py-1 bg-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">Level 12</div>
                   <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Global Rank: #412</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Core Performance Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
            {[
              { label: 'Intelligence', val: progress?.ielts_stats?.listening, icon: Headphones, color: 'text-blue-400', desc: 'Listening Depth' },
              { label: 'Analytical', val: progress?.ielts_stats?.reading, icon: Book, color: 'text-emerald-400', desc: 'Reading Precision' },
              { label: 'Strategic', val: progress?.ielts_stats?.writing, icon: PenTool, color: 'text-indigo-400', desc: 'Writing Complexity' },
              { label: 'Command', val: progress?.ielts_stats?.overall, icon: Award, color: 'text-shimmer', desc: 'Total Efficiency', bg: 'bg-white/5' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                variants={item}
                whileHover={{ scale: 1.05, translateY: -10 }}
                className={`glass-3d p-12 group transition-all border-white/5 hover:border-white/20 ${stat.bg || ''}`}
              >
                <div className="flex items-center justify-between mb-12">
                  <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${stat.color}`}>{stat.label}</span>
                  <stat.icon className={`w-7 h-7 ${stat.color} group-hover:rotate-12 transition-transform`} />
                </div>
                <div className={`text-7xl font-black mb-4 ${stat.color} tracking-tighter`}>{stat.val || 0}</div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.val || 0) * 10}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className={`h-full bg-current ${stat.color}`} 
                   />
                </div>
                <p className="text-[9px] font-black text-[#444] uppercase tracking-widest">{stat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tactical Analytics Visualizer */}
          <motion.div variants={item} className="glass-3d p-20 mb-32 relative overflow-hidden group border-white/10 bg-white/[0.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-24 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-5xl font-black tracking-tighter uppercase">Visual Intel.</h3>
                  <p className="text-xs font-bold text-[#444] uppercase tracking-widest mt-1">Growth trajectory over 7 cycles</p>
                </div>
              </div>
              <div className="flex gap-4">
                 {[1, 2, 3].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i === 3 ? 'bg-blue-500' : 'bg-white/10'}`} />)}
              </div>
            </div>
            <div className="h-[500px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progress?.daily_activity || []}>
                  <defs>
                    <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111" />
                  <XAxis dataKey="date" stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 20 }} />
                  <YAxis stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dx: -20 }} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', padding: '20px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#444', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="questions_answered" stroke="#6366f1" strokeWidth={5} fill="url(#colorChart)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Activity Nexus */}
          <div className="grid gap-12 lg:grid-cols-2">
            {/* IELTS Nexus */}
            <motion.div variants={item} className="glass-3d overflow-hidden border-white/5">
              <div className="p-16 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase">IELTS Stream</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Live Evaluation History</p>
                </div>
                <Button variant="ghost" className="h-14 px-8 rounded-xl border border-white/10 text-[10px] font-black tracking-widest uppercase hover:bg-white/5" onClick={() => navigate('/ielts/writing-checker')}>New Intel</Button>
              </div>
              <div className="divide-y divide-white/5">
                {(!progress?.ielts_activity || progress.ielts_activity.length === 0) ? (
                  <div className="p-32 text-center opacity-10 text-[10px] font-black uppercase tracking-[0.8em]">Archive Empty</div>
                ) : (
                  progress.ielts_activity.map((item, i) => (
                    <div key={i} className="p-12 flex items-center justify-between hover:bg-white/5 transition-all group cursor-pointer">
                      <div className="flex items-center gap-10">
                        <div className="text-4xl font-black text-[#111] group-hover:text-white transition-colors">{(item.score / 10).toFixed(1)}</div>
                        <div>
                          <p className="text-xl font-black tracking-tight mb-1 uppercase italic">{item.test_name}</p>
                          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{item.skill} · {new Date(item.completed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:border-white/20 group-hover:bg-white/5 transition-all">
                        <ChevronRight className="w-5 h-5 text-[#222] group-hover:text-white" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* SAT Nexus */}
            <motion.div variants={item} className="glass-3d overflow-hidden border-white/5">
              <div className="p-16 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                 <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase">SAT Stream</h3>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Real-time Logic Log</p>
                </div>
                <Button variant="ghost" className="h-14 px-8 rounded-xl border border-white/10 text-[10px] font-black tracking-widest uppercase hover:bg-white/5" onClick={() => navigate('/sat')}>Engage Bank</Button>
              </div>
              <div className="divide-y divide-white/5">
                {(!progress?.recent_activity || progress.recent_activity.length === 0) ? (
                  <div className="p-32 text-center opacity-10 text-[10px] font-black uppercase tracking-[0.8em]">No Signals Detected</div>
                ) : (
                  progress.recent_activity.map((item, i) => (
                    <div key={i} className="p-12 flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-10">
                        <div className={`w-4 h-4 rounded-full ${item.correct ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'}`} />
                        <div>
                          <p className="text-xl font-black tracking-tight mb-1 uppercase italic">{item.section}</p>
                          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{item.topic} · {item.correct ? 'Valid Logic' : 'Failed Signal'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-[#111] group-hover:text-white transition-all">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
