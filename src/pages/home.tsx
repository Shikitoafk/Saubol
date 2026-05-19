import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Target, 
  Brain, 
  ChevronRight,
  Clock,
  Zap,
  Sparkles,
  BookOpen,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 font-sans relative overflow-hidden">
        {/* Deep Ambient Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }} />
        
        <main className="relative z-10">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-[1400px] mx-auto px-10 py-32"
          >
            {/* Hero Section */}
            <motion.div variants={item} className="text-center mb-32 pt-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                <Sparkles className="w-3 h-3" />
                Adaptive Intelligence Preparation
              </div>
              
              <h1 className="text-7xl md:text-[140px] font-black tracking-tighter text-shimmer mb-12 uppercase italic leading-[0.85]">
                SAT <br /> STRATEGIST.
              </h1>
              
              <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto font-medium mb-16 leading-relaxed">
                Learn every concept. Practice every question type. <br />
                <span className="text-white">Score 1550+ with the world's most advanced SAT platform.</span>
              </p>
            </motion.div>

            {/* Three Clear Paths */}
            <div className="grid lg:grid-cols-3 gap-8 mb-48">
               {/* Path 1: Diagnostic */}
               <motion.div 
                 variants={item}
                 whileHover={{ translateY: -10 }}
                 className="glass-3d p-12 flex flex-col justify-between min-h-[450px] border-emerald-500/10 hover:border-emerald-500/30 group cursor-pointer"
                 onClick={() => navigate("/sat/diagnostic")}
               >
                  <div>
                     <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-10 group-hover:bg-emerald-500/20 transition-all">
                        <Target className="w-10 h-10 text-emerald-400" />
                     </div>
                     <h3 className="text-4xl font-black uppercase italic mb-6">1. START HERE.</h3>
                     <p className="text-white/40 text-lg font-medium leading-relaxed mb-10">
                        Diagnostic Test: Find your weak spots in 20 minutes with our blueprint-aligned exam.
                     </p>
                  </div>
                  <Button className="w-full h-16 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform shadow-[0_20px_40px_rgba(255,255,255,0.05)]">
                     Begin Analysis <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </motion.div>

               {/* Path 2: Learn */}
               <motion.div 
                 variants={item}
                 whileHover={{ translateY: -10 }}
                 className="glass-3d p-12 flex flex-col justify-between min-h-[450px] border-indigo-500/10 hover:border-indigo-500/30 group cursor-pointer"
                 onClick={() => navigate("/sat/learn")}
               >
                  <div>
                     <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-10 group-hover:bg-indigo-500/20 transition-all">
                        <BookOpen className="w-10 h-10 text-indigo-400" />
                     </div>
                     <h3 className="text-4xl font-black uppercase italic mb-6">2. LEARN.</h3>
                     <p className="text-white/40 text-lg font-medium leading-relaxed mb-10">
                        Topic Library: Master every SAT concept with interactive lessons and video-first practice.
                     </p>
                  </div>
                  <Button className="w-full h-16 bg-indigo-600 text-white font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform shadow-[0_20px_40px_rgba(79,70,229,0.1)]">
                     Open Library <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </motion.div>

               {/* Path 3: Test */}
               <motion.div 
                 variants={item}
                 whileHover={{ translateY: -10 }}
                 className="glass-3d p-12 flex flex-col justify-between min-h-[450px] border-rose-500/10 hover:border-rose-500/30 group cursor-pointer"
                 onClick={() => navigate("/sat/tests")}
               >
                  <div>
                     <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-10 group-hover:bg-rose-500/20 transition-all">
                        <Clock className="w-10 h-10 text-rose-400" />
                     </div>
                     <h3 className="text-4xl font-black uppercase italic mb-6">3. TEST.</h3>
                     <p className="text-white/40 text-lg font-medium leading-relaxed mb-10">
                        Practice Tests: Timed simulations in the official Digital SAT format. Real-time scoring.
                     </p>
                  </div>
                  <Button className="w-full h-16 bg-rose-600 text-white font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform shadow-[0_20px_40px_rgba(225,29,72,0.1)]">
                     Enter Simulation <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </motion.div>
            </div>

            {/* Admissions Separate Section */}
            <motion.div 
              variants={item}
              whileHover={{ scale: 1.01 }}
              className="glass-3d p-16 border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-16 mb-48"
            >
               <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-6 opacity-30">
                     <ShieldCheck className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Global Admissions Intelligence</span>
                  </div>
                  <h4 className="text-6xl font-black uppercase italic mb-6 tracking-tighter">Admissions Calculator.</h4>
                  <p className="text-white/40 text-xl font-medium leading-relaxed">
                     Upload your full profile including research, olympiads, and extracurriculars. Get realistic admission chances for top universities globally.
                  </p>
               </div>
               <div className="flex flex-col gap-6 w-full md:w-auto">
                  <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                     <TrendingUp className="w-5 h-5 text-emerald-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-white/60">International Data Engine</span>
                  </div>
                  <Button 
                    onClick={() => navigate("/admissions/calculator")}
                    className="h-24 px-16 border border-white/10 bg-white text-black hover:bg-gray-100 font-black uppercase text-sm rounded-3xl transition-all shadow-2xl"
                  >
                     Analyze my CV <Calculator className="ml-4 w-6 h-6" />
                  </Button>
               </div>
            </motion.div>

            {/* SAT Study Roadmap - Visual Timeline */}
            <motion.div variants={item} className="mb-48">
               <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                  <div>
                     <div className="flex items-center gap-3 mb-4 opacity-40">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">12-Week Strategic Protocol</span>
                     </div>
                     <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">STUDY <br /> ROADMAP.</h2>
                  </div>
                  <Button 
                    onClick={() => navigate("/sat/roadmap")}
                    variant="link" 
                    className="text-white/40 hover:text-white uppercase font-black tracking-widest text-[10px] p-0 h-auto"
                  >
                     View Full Strategy <ArrowRight className="ml-2 w-3 h-3" />
                  </Button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { id: 1, title: "GRAMMAR", dur: "3-4 days", prog: 100, active: true },
                    { id: 2, title: "EXPRESSION", dur: "3-4 days", prog: 0 },
                    { id: 3, title: "MATH", dur: "1-2 weeks", prog: 0 },
                    { id: 4, title: "READING", dur: "May-July", prog: 0 },
                    { id: 5, title: "TESTS", dur: "August", prog: 0 }
                  ].map((s, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate("/sat/roadmap")}
                      className={`glass-3d p-6 border-white/5 cursor-pointer group transition-all ${s.active ? 'bg-indigo-500/5 border-indigo-500/20' : ''}`}
                    >
                       <div className="flex justify-between items-center mb-6">
                          <span className={`text-[9px] font-black italic ${s.prog === 100 ? 'text-emerald-400' : 'text-white/20'}`}>
                             {s.prog === 100 ? '✓' : `[${s.id}]`}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-20">{s.dur}</span>
                       </div>
                       <h4 className={`text-sm font-black uppercase italic mb-4 ${s.active ? 'text-indigo-400' : 'text-white/60'}`}>{s.title}</h4>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${s.prog === 100 ? 'bg-emerald-500' : 'bg-white/10'}`} style={{ width: `${s.prog || 0}%` }} />
                       </div>
                       {s.active && (
                          <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-4 animate-pulse">Current Focus</p>
                       )}
                    </motion.div>
                  ))}
               </div>
            </motion.div>

            {/* AI Core Stats */}
            <div className="grid md:grid-cols-3 gap-12 mb-48 text-center">
               {[
                 { label: "Concepts Mastered", value: "250+", icon: Brain, color: "text-indigo-400" },
                 { label: "Practice Questions", value: "8,000+", icon: Zap, color: "text-yellow-400" },
                 { label: "Target Score", value: "1550+", icon: Sparkles, color: "text-emerald-400" }
               ].map((stat, i) => (
                 <motion.div key={i} variants={item} className="p-10 glass-3d border-white/5">
                    <stat.icon className={`w-10 h-10 ${stat.color} mx-auto mb-6`} />
                    <p className="text-5xl font-black mb-2 italic tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">{stat.label}</p>
                 </motion.div>
               ))}
            </div>
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}
