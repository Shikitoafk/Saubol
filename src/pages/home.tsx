import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Target, 
  Brain, 
  Globe, 
  ChevronRight,
  Headphones,
  LayoutDashboard,
  Clock,
  Zap,
  Sparkles
} from 'lucide-react';
import { Layout } from "@/components/layout";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 font-sans relative overflow-hidden">
        {/* 3D Background Elements */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] left-[-5%] opacity-40 animate-pulse" />
        <div className="bg-sphere bottom-[-10%] right-[-5%] opacity-30" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} />

        <main>
          {/* Hero Section - Wider and 3D */}
          <section className="pt-48 pb-32 px-10">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex items-center gap-3 mb-10 opacity-60">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-black tracking-[0.4em] uppercase text-blue-400">Elite Education 2026</span>
              </div>
              <h1 className="text-7xl md:text-[120px] font-black tracking-tighter mb-12 leading-[0.85] text-shimmer">
                BEYOND THE <br />
                LIMITS.
              </h1>
              <div className="grid md:grid-cols-2 gap-20 items-end">
                <p className="text-2xl text-[#888] leading-relaxed font-medium max-w-xl">
                  Персонализированная подготовка нового поколения. Мы не просто учим — мы проектируем твое будущее в лучших университетах мира.
                </p>
                <div className="flex items-center gap-6">
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-100 rounded-2xl px-12 h-20 text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.15)]"
                    onClick={() => navigate('/login')}
                  >
                    START NOW <ArrowRight className="ml-3 w-6 h-6" />
                  </Button>
                  <div className="hidden sm:block group cursor-pointer">
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                      <Zap className="w-8 h-8 text-white group-hover:scale-125 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3D Feature Grid - Spacious */}
          <section className="py-32 px-10 max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* IELTS Module - Huge and 3D */}
              <div className="lg:col-span-7 glass-3d p-16 flex flex-col justify-between min-h-[600px] group cursor-pointer" onClick={() => navigate('/ielts')}>
                <div>
                  <div className="flex justify-between items-start mb-12">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
                        <Headphones className="w-8 h-8 text-white" />
                     </div>
                     <span className="text-xs font-black tracking-[0.3em] uppercase text-indigo-400">Advanced Module</span>
                  </div>
                  <h3 className="text-6xl font-black mb-8 leading-tight">IELTS <br /> INTENSIVE</h3>
                  <p className="text-[#888] text-2xl leading-relaxed max-w-lg">
                    Глубокая аналитика Writing и адаптивные тренировки Listening/Reading. Твой путь к 8.5+ начинается здесь.
                  </p>
                </div>
                <div className="flex items-center gap-12 mt-12 pt-12 border-t border-white/5">
                   <div className="flex flex-col gap-1">
                      <span className="text-3xl font-black text-white">99%</span>
                      <span className="text-xs font-bold text-[#444] uppercase tracking-widest">Success Rate</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-3xl font-black text-white">AI</span>
                      <span className="text-xs font-bold text-[#444] uppercase tracking-widest">Engine Powered</span>
                   </div>
                </div>
              </div>

              {/* SAT Module - 3D */}
              <div className="lg:col-span-5 glass-3d p-16 flex flex-col justify-between min-h-[600px] group cursor-pointer" onClick={() => navigate('/sat')}>
                <div>
                  <div className="flex justify-between items-start mb-12">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
                        <Target className="w-8 h-8 text-white" />
                     </div>
                  </div>
                  <h3 className="text-5xl font-black mb-8 leading-tight">SAT <br /> MASTERY</h3>
                  <p className="text-[#888] text-xl leading-relaxed">
                    Адаптивные тесты нового поколения. Мы анализируем каждый твой клик, чтобы ускорить прогресс.
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/5 group-hover:border-white/20 transition-all">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#666] uppercase tracking-widest">Next Session</span>
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform" />
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* Shimmer CTA */}
          <section className="section-spacing px-10 pb-32">
            <div className="max-w-[1400px] mx-auto glass-3d p-24 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <h2 className="text-6xl md:text-9xl font-black mb-16 tracking-tighter text-shimmer">DREAM BIG.</h2>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-2xl px-16 h-24 text-2xl font-black shadow-[0_30px_60px_rgba(255,255,255,0.1)] transition-all hover:scale-110 active:scale-95"
                onClick={() => navigate('/login')}
              >
                GET FULL ACCESS
              </Button>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
