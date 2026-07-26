import { useNavigate } from "react-router-dom";
import { ChevronLeft, Brain, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SATQuestionBank() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Glowing radial vignettes */}
        <div className="absolute inset-0 bg-vignette" />
        <div 
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-35" 
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-35" 
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)' }} 
        />

        <div className="max-w-xl mx-auto text-center px-10 relative z-10 space-y-12">
          {/* Animated Glowing Brain Icon */}
          <div className="relative flex justify-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(99,102,241,0.2)",
                  "0 0 40px rgba(99,102,241,0.4)",
                  "0 0 20px rgba(99,102,241,0.2)"
                ]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 relative"
            >
              <Brain className="w-12 h-12 text-indigo-400 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-indigo-400/30 rounded-3xl scale-[1.15]"
              />
            </motion.div>
          </div>

          {/* Texts */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/25 px-4 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Question Bank</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-shimmer">
              COMING SOON.
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-ink-muted max-w-sm mx-auto leading-relaxed">
              Practice by topic and difficulty with personalized adaptive modules.
            </p>
          </div>

          {/* Navigation Button */}
          <div>
            <Button
              onClick={() => navigate("/sat")}
              className="h-16 px-10 bg-white text-black font-black uppercase text-xs rounded-xl shadow-2xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
            >
              <ChevronLeft className="w-4 h-4" /> Go Back
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
