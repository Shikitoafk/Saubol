import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import layout from '@/components/layout';
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
          questions_answered: rawProgress.filter(d => d.answered_at.startsWith(dateStr)).length
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

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        {/* Depth Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] left-[-5%] opacity-30" />

        <div className="max-w-[1400px] mx-auto px-10 py-24 relative z-10">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-400">System Command Center</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-shimmer leading-[0.85]">
                DASHBOARD.
              </h2>
            </div>
            <div className="flex items-center gap-6 p-6 glass-3d">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <User className="w-7 h-7 text-black" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">{user?.user_metadata?.full_name?.toUpperCase() || user?.email?.split('@')[0].toUpperCase()}</p>
                <p className="text-xs font-bold text-[#444] uppercase tracking-widest">Active Student</p>
              </div>
            </div>
          </div>

          {/* IELTS Performance Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {[
              { label: 'Listening', val: progress?.ielts_stats?.listening, icon: Headphones, color: 'text-blue-400' },
              { label: 'Reading', val: progress?.ielts_stats?.reading, icon: Book, color: 'text-emerald-400' },
              { label: 'Writing', val: progress?.ielts_stats?.writing, icon: PenTool, color: 'text-indigo-400' },
              { label: 'Overall', val: progress?.ielts_stats?.overall, icon: Award, color: 'text-shimmer', bg: 'bg-white/5' }
            ].map((stat, i) => (
              <div key={i} className={`glass-3d p-10 group hover:scale-105 transition-all ${stat.bg || ''}`}>
                <div className="flex items-center justify-between mb-10">
                  <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${stat.color}`}>{stat.label}</span>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-6xl font-black mb-2 ${stat.color}`}>{stat.val || 0}</div>
                <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em]">Current Band</p>
              </div>
            ))}
          </div>

          {/* Analytics Visualizer */}
          <div className="glass-3d p-16 mb-24 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex items-center justify-between mb-20 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter">ANALYTICS.</h3>
              </div>
              <div className="flex gap-4">
                <div className="px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">Last 7 Days</div>
              </div>
            </div>
            <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progress?.daily_activity || []}>
                  <defs>
                    <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#111" />
                  <XAxis dataKey="date" stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 20 }} />
                  <YAxis stroke="#222" fontSize={10} tickLine={false} axisLine={false} tick={{ dx: -20 }} />
                  <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid #222', borderRadius: '16px', fontSize: '10px', fontBlack: true }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="questions_answered" stroke="#fff" strokeWidth={4} fill="url(#colorChart)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Logs - Wide Layout */}
          <div className="grid gap-12 lg:grid-cols-2">
            {/* IELTS Log */}
            <div className="glass-3d overflow-hidden">
              <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-2xl font-black tracking-tight">IELTS LOG</h3>
                <Button variant="ghost" className="text-[10px] font-black tracking-[0.2em] uppercase text-[#444] hover:text-white" onClick={() => navigate('/ielts/writing-checker')}>New Entry</Button>
              </div>
              <div className="divide-y divide-white/5">
                {(!progress?.ielts_activity || progress.ielts_activity.length === 0) ? (
                  <div className="p-24 text-center opacity-10 text-xs font-black uppercase tracking-[0.5em]">No Data</div>
                ) : (
                  progress.ielts_activity.map((item, i) => (
                    <div key={i} className="p-10 flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className="text-2xl font-black text-[#222] group-hover:text-white transition-colors">{(item.score / 10).toFixed(1)}</div>
                        <div>
                          <p className="font-black tracking-tight mb-1">{item.test_name?.toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{item.skill} · {new Date(item.completed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#222] group-hover:text-white transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SAT Log */}
            <div className="glass-3d overflow-hidden">
              <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-2xl font-black tracking-tight">SAT LOG</h3>
                <Button variant="ghost" className="text-[10px] font-black tracking-[0.2em] uppercase text-[#444] hover:text-white" onClick={() => navigate('/sat')}>Practice</Button>
              </div>
              <div className="divide-y divide-white/5">
                {(!progress?.recent_activity || progress.recent_activity.length === 0) ? (
                  <div className="p-24 text-center opacity-10 text-xs font-black uppercase tracking-[0.5em]">No Data</div>
                ) : (
                  progress.recent_activity.map((item, i) => (
                    <div key={i} className="p-10 flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className={`w-3 h-3 rounded-full ${item.correct ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`} />
                        <div>
                          <p className="font-black tracking-tight mb-1">{item.section?.toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{item.topic} · {item.correct ? 'Correct' : 'Missed'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-[#222] group-hover:text-white transition-all">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
