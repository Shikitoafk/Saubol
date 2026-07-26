import { useNavigate } from "react-router-dom";
import { ChevronRight, BookOpen, Brain, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";

export default function SatPrep() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white py-32 px-10 relative overflow-hidden font-sans">
        {/* Background vignette & glow sphere */}
        <div className="absolute inset-0 bg-vignette" />
        <div 
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30 animate-pulse" 
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} 
        />

        <div className="max-w-[1300px] mx-auto relative z-10">
          <header className="mb-20">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">Digital SAT Preparation</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none text-shimmer">
              SAT ARENA.
            </h1>
            <p className="text-sm text-[#a6a6ae] font-semibold max-w-xl leading-relaxed">
              Prepare for the Digital SAT using adaptive tools, real exam timing, and granular topic diagnostics.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Card 1: Past Papers */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01 }}
              className="glass-3d p-16 flex flex-col justify-between min-h-[460px] cursor-pointer border-indigo-500/10 hover:border-indigo-500/40 transition-all relative overflow-hidden group"
              onClick={() => navigate("/sat/past-papers")}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-700 mb-16">
                    <BookOpen className="w-10 h-10 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                  </div>
                  
                  <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                    Past Papers
                  </h2>
                  <p className="text-[#a6a6ae] font-medium text-sm leading-relaxed max-w-sm">
                    Solve real Digital SAT tests from concrete exam dates under true timed or untimed practice conditions.
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="px-6 h-12 bg-white text-black hover:bg-gray-100 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Enter Arena <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Question Bank */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01 }}
              className="glass-3d p-16 flex flex-col justify-between min-h-[460px] cursor-pointer border-white/5 hover:border-indigo-500/20 transition-all relative overflow-hidden group"
              onClick={() => navigate("/sat/question-bank")}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-16">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all duration-700">
                      <Brain className="w-10 h-10 text-white/60 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:text-indigo-400 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all" />
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[9px] font-black tracking-widest uppercase text-indigo-400">
                      Coming Soon
                    </span>
                  </div>
                  
                  <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none text-shimmer">
                    Question Bank
                  </h2>
                  <p className="text-[#a6a6ae] font-medium text-sm leading-relaxed max-w-sm">
                    Granular practice sorted by specific subtopic domains and difficulty levels with performance analytics.
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="px-6 h-12 bg-white/5 border border-white/10 text-white/60 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 group-hover:bg-white group-hover:text-black transition-all">
                    Preview Details <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
