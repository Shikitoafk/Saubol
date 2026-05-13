import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ClipboardList, 
  Target, 
  Sparkles, 
  ArrowRight,
  Calculator,
  BookOpen,
  Zap,
  Clock,
  TrendingUp,
  Brain,
  History
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function SatPrep() {
  const nav = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} />
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-[1400px] mx-auto px-10 py-32 relative z-10"
        >
          {/* Header Section */}
          <motion.div variants={item} className="mb-32 flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8 opacity-60">
                <Target className="w-6 h-6 text-violet-400" />
                <span className="text-[11px] font-black tracking-[0.5em] uppercase text-violet-400">Adaptive Intelligence Hub</span>
              </div>
              <h1 className="text-8xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] mb-12 uppercase italic">
                SAT <br /> STRATEGIST.
              </h1>
              <p className="text-2xl text-[#666] font-medium max-w-2xl leading-tight mb-12">
                Персонализированная система подготовки к Digital SAT. Мы используем адаптивные алгоритмы для максимизации твоего результата.
              </p>
              
              <div className="flex flex-wrap gap-6">
                <Button 
                  onClick={() => nav("/sat/diagnostic")}
                  className="bg-white text-black hover:bg-gray-100 rounded-2xl px-12 h-20 font-black uppercase text-xs shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95"
                >
                  Start Diagnostic <Sparkles className="ml-2 w-4 h-4 fill-current" />
                </Button>
                <Button 
                  onClick={() => nav("/sat/dashboard")}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 rounded-2xl px-12 h-20 font-black uppercase text-xs transition-all"
                >
                  Performance Dashboard <TrendingUp className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* AI Advisor Card */}
            <div className="glass-3d p-12 w-full md:w-96 border-indigo-500/20 bg-indigo-500/5">
               <div className="flex items-center gap-3 mb-8">
                  <Brain className="w-6 h-6 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Study Advisor</span>
               </div>
               <p className="text-white/60 text-sm font-medium leading-relaxed mb-10">
                 Ваш план подготовки еще не активен. Пройдите диагностику, чтобы система построила ваш личный путь к 1550+.
               </p>
               <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/20">
                  <History className="w-4 h-4" /> Last analyzed: Never
               </div>
            </div>
          </motion.div>

          {/* Strategic Modules */}
          <div className="grid lg:grid-cols-2 gap-10">
             {/* Learn Hub */}
             <motion.div 
               variants={item}
               whileHover={{ scale: 1.02, translateY: -10 }}
               className="glass-3d p-16 flex flex-col justify-between min-h-[500px] group cursor-pointer border-emerald-500/10 hover:border-emerald-500/40 relative overflow-hidden"
               onClick={() => nav("/sat/learn")}
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-16">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-700">
                         <BookOpen className="w-10 h-10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Foundation</Badge>
                   </div>
                   <h2 className="text-6xl font-black mb-6 tracking-tighter uppercase italic">LEARN <br /> HUB.</h2>
                   <p className="text-xl text-[#666] font-medium leading-relaxed max-w-sm mb-12 group-hover:text-[#888] transition-colors">
                      Уроки по всем темам SAT с примерами, стратегиями и мгновенной практикой. Овладей каждой концепцией на 100%.
                   </p>
                </div>
                <div className="flex items-center justify-between relative z-10 mt-auto">
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><Zap className="w-3.5 h-3.5" /> Topic Mastery</div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><History className="w-3.5 h-3.5" /> Lessons + Practice</div>
                   </div>
                   <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <ArrowRight className="w-6 h-6" />
                   </div>
                </div>
             </motion.div>

             {/* Test Hub */}
             <motion.div 
               variants={item}
               whileHover={{ scale: 1.02, translateY: -10 }}
               className="glass-3d p-16 flex flex-col justify-between min-h-[500px] group cursor-pointer border-indigo-500/10 hover:border-indigo-500/40 relative overflow-hidden"
               onClick={() => nav("/sat/tests")}
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-16">
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-700">
                         <Target className="w-10 h-10 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Evaluation</Badge>
                   </div>
                   <h2 className="text-6xl font-black mb-6 tracking-tighter uppercase italic">TEST <br /> HUB.</h2>
                   <p className="text-xl text-[#666] font-medium leading-relaxed max-w-sm mb-12 group-hover:text-[#888] transition-colors">
                      Полноценные симуляции Digital SAT. От 10-минутных спринтов до полных тестов на время.
                   </p>
                </div>
                <div className="flex items-center justify-between relative z-10 mt-auto">
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><Clock className="w-3.5 h-3.5" /> Full Simulation</div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><TrendingUp className="w-3.5 h-3.5" /> Score Analysis</div>
                   </div>
                   <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <ArrowRight className="w-6 h-6" />
                   </div>
                </div>
             </motion.div>
          </div>

          {/* Practice Hubs (Math/RW) */}
          <div className="grid lg:grid-cols-2 gap-10 mt-10">
             {/* Math Module */}
             <motion.div 
               variants={item}
               whileHover={{ scale: 1.02, translateY: -10 }}
               className="glass-3d p-16 flex flex-col justify-between min-h-[500px] group cursor-pointer border-blue-500/10 hover:border-blue-500/40 relative overflow-hidden"
               onClick={() => nav("/sat/practice")}
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-16">
                      <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-700">
                         <Calculator className="w-10 h-10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Module 01</Badge>
                   </div>
                   <h2 className="text-6xl font-black mb-6 tracking-tighter uppercase italic">MATH <br /> PRACTICE.</h2>
                   <p className="text-xl text-[#666] font-medium leading-relaxed max-w-sm mb-12 group-hover:text-[#888] transition-colors">
                      Алгебра, Продвинутая математика, Геометрия и Анализ данных. Полная интеграция с Desmos.
                   </p>
                </div>
                <div className="flex items-center justify-between relative z-10 mt-auto">
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><Clock className="w-3.5 h-3.5" /> Adaptive Timer</div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><Zap className="w-3.5 h-3.5" /> 800+ Questions</div>
                   </div>
                   <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <ArrowRight className="w-6 h-6" />
                   </div>
                </div>
             </motion.div>

             {/* RW Module */}
             <motion.div 
               variants={item}
               whileHover={{ scale: 1.02, translateY: -10 }}
               className="glass-3d p-16 flex flex-col justify-between min-h-[500px] group cursor-pointer border-violet-500/10 hover:border-violet-500/40 relative overflow-hidden"
               onClick={() => nav("/sat/practice")}
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-16">
                      <div className="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-500/20 transition-all duration-700">
                         <BookOpen className="w-10 h-10 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
                      </div>
                      <Badge className="bg-violet-500/10 text-violet-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Module 02</Badge>
                   </div>
                   <h2 className="text-6xl font-black mb-6 tracking-tighter uppercase italic">READING <br /> PRACTICE.</h2>
                   <p className="text-xl text-[#666] font-medium leading-relaxed max-w-sm mb-12 group-hover:text-[#888] transition-colors">
                      Анализ литературных и научных текстов, Грамматика и Риторика. Повышаем точность понимания.
                   </p>
                </div>
                <div className="flex items-center justify-between relative z-10 mt-auto">
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><TrendingUp className="w-3.5 h-3.5" /> High Precision</div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#444]"><Sparkles className="w-3.5 h-3.5" /> Level-based</div>
                   </div>
                   <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <ArrowRight className="w-6 h-6" />
                   </div>
                </div>
             </motion.div>
          </div>

          {/* Tactical Bottom Section */}
          <motion.div variants={item} className="mt-48 pb-20">
             <div className="max-w-4xl">
                <h3 className="text-7xl md:text-[100px] font-black tracking-tighter uppercase mb-12 leading-none">
                  DESIGNED FOR 1550+.
                </h3>
                <p className="text-2xl md:text-3xl text-[#444] font-bold uppercase tracking-tight leading-[1.1] max-w-3xl">
                   НАША ПЛАТФОРМА АНАЛИЗИРУЕТ КАЖДЫЙ ТВОЙ ОТВЕТ. ЧЕМ БОЛЬШЕ ТЫ ПРАКТИКУЕШЬСЯ, ТЕМ ТОЧНЕЕ НАШИ ПРОГНОЗЫ. 
                </p>
             </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
