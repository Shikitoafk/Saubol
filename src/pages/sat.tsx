import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardList, Target, Sparkles, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function SatPrep() {
  const nav = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        {/* Depth Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] right-[-5%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-24 relative z-10">
          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Target className="w-5 h-5 text-violet-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-violet-400">Adaptive Test Bank v4.0</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-shimmer leading-[0.85] mb-8 uppercase">
              SAT <br /> PREPARATION.
            </h1>
            <p className="text-xl text-[#666] font-medium max-w-2xl leading-relaxed">
              Адаптивные тесты нового поколения для Digital SAT. Мы анализируем твой прогресс, чтобы давать именно те вопросы, которые поднимут твой балл.
            </p>
          </div>

          {/* Main Practice Card - 3D */}
          <div className="glass-3d p-16 flex flex-col lg:flex-row items-center justify-between gap-12 group">
            <div className="flex items-start gap-10">
              <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                <ClipboardList className="w-10 h-10 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
              </div>
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-violet-400">Adaptive Learning</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight mb-6 uppercase">Practice Questions</h2>
                <p className="text-[#888] text-lg leading-relaxed">
                  Полная база вопросов Digital SAT с фильтрами по секциям, категориям и сложности. Включает режим таймера и подробные разборы каждого решения.
                </p>
              </div>
            </div>
            <Button
              onClick={() => nav("/sat/practice")}
              className="bg-white text-black hover:bg-gray-100 rounded-2xl px-12 h-20 text-xl font-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              START PRACTICE <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
             <span>Designed for 1550+ Score</span>
             <span className="mt-4 md:mt-0 italic">Saubol Analytics System</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
