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
  Sparkles,
  FileText,
  MessageSquare,
  Code
} from 'lucide-react';
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 font-sans relative overflow-hidden">
        {/* Deep Ambient Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }} />
        <div className="bg-sphere bottom-[-10%] right-[-10%] opacity-30" style={{ width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />

        <main className="relative z-10">
          {/* Hero Section - The "WOW" Opener */}
          <section className="pt-64 pb-32 px-10">
            <div className="max-w-[1400px] mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col gap-12"
              >
                <div className="flex items-center gap-4 opacity-60">
                  <div className="w-12 h-[1px] bg-blue-500" />
                  <span className="text-[10px] font-black tracking-[0.6em] uppercase text-blue-400">Next Generation Education Platform</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] text-shimmer mb-8">
                  DREAM. <br />
                  SUCCEED. <br />
                  REPEAT.
                </h1>

                <div className="grid lg:grid-cols-2 gap-20 items-end">
                  <p className="text-3xl text-[#666] leading-tight font-medium max-w-2xl">
                    Saubol — это твой персональный штаб для поступления в топ-100 вузов мира. Мы объединили AI-технологии и экспертный опыт.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <Button 
                      size="lg" 
                      className="bg-white text-black hover:bg-gray-100 rounded-2xl px-16 h-24 text-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_30px_60px_rgba(255,255,255,0.1)] group"
                      onClick={() => navigate('/login')}
                    >
                      START JOURNEY <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </Button>
                    <div className="flex -space-x-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-14 h-14 rounded-full border-4 border-black bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden">
                           <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Student" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-14 h-14 rounded-full border-4 border-black bg-blue-600 flex items-center justify-center text-[10px] font-black">
                        500+
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>


          {/* Main Features Grid */}
          <section className="py-48 px-10 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
               <div>
                  <div className="flex items-center gap-3 mb-6 opacity-60">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">Core Ecosystem</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase">Powering your <br /> potential.</h2>
               </div>
               <p className="text-[#666] text-xl font-medium max-w-sm mb-4">
                 Инструменты мирового уровня, доступные каждому абитуриенту Saubol.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
              {/* IELTS - Huge Card */}
              <div className="lg:col-span-8 glass-3d p-16 min-h-[600px] flex flex-col justify-between group cursor-pointer overflow-hidden relative" onClick={() => navigate('/ielts')}>
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Headphones className="w-64 h-64 rotate-12" />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-12 group-hover:border-white/40 transition-all">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-5xl font-black mb-8 leading-tight">IELTS <br /> MASTERING.</h3>
                  <p className="text-[#888] text-2xl leading-relaxed max-w-lg font-medium">
                    Адаптивная система подготовки с искусственным интеллектом для анализа твоего Writing и Speaking.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mt-12">
                  Explore Module <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* SAT - Vertical Card */}
              <div className="lg:col-span-4 glass-3d p-16 flex flex-col justify-between min-h-[600px] group cursor-pointer" onClick={() => navigate('/sat')}>
                <div>
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-12 group-hover:border-white/40 transition-all">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-5xl font-black mb-8 leading-tight">SAT <br /> HUB.</h3>
                  <p className="text-[#888] text-xl leading-relaxed font-medium">
                    Полный банк вопросов Digital SAT с подробными разборами и стратегиями.
                  </p>
                </div>
                <div className="w-full h-24 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                   <div className="flex gap-2 animate-pulse">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-8 h-8 rounded bg-white/10" />)}
                   </div>
                </div>
              </div>

              {/* Programs - Bottom Left */}
              <div className="lg:col-span-5 glass-3d p-16 min-h-[500px] group cursor-pointer" onClick={() => navigate('/programs')}>
                 <div className="flex justify-between items-start mb-12">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/40 transition-all">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-4 py-2">500+ Programs</Badge>
                 </div>
                 <h3 className="text-5xl font-black mb-6 uppercase">Opportunities.</h3>
                 <p className="text-[#666] text-xl leading-relaxed font-medium">Летние школы и лагеря по всему миру.</p>
              </div>

              {/* Admissions - Bottom Right */}
              <div className="lg:col-span-7 glass-3d p-16 min-h-[500px] group cursor-pointer" onClick={() => navigate('/admissions')}>
                 <div className="flex justify-between items-start mb-12">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/40 transition-all">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                 </div>
                 <h3 className="text-6xl font-black mb-6 uppercase tracking-tighter">Admissions.</h3>
                 <p className="text-[#666] text-2xl leading-relaxed font-medium max-w-md">Пошаговый гид по поступлению: от выбора вуза до получения оффера.</p>
              </div>
            </div>
          </section>

          {/* AI Advantage Section */}
          <section className="py-48 px-10 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
             <div className="bg-sphere top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" style={{ width: '800px', height: '800px' }} />
             <div className="max-w-[1400px] mx-auto text-center relative z-10">
                <div className="flex items-center justify-center gap-3 mb-12 opacity-60">
                   <Brain className="w-6 h-6 text-indigo-400" />
                   <span className="text-[12px] font-black tracking-[0.6em] uppercase text-indigo-400">Intelligence Accelerated</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-16 leading-none">THE AI <br /> ADVANTAGE.</h2>
                <div className="grid md:grid-cols-3 gap-12 text-left">
                   {[
                     { title: "Smart Scoring", desc: "Мгновенная оценка эссе по официальным критериям IELTS с детальным разбором ошибок." },
                     { title: "Predictive Analytics", desc: "Прогнозируем твой результат на основе текущей динамики и пробелов в знаниях." },
                     { title: "Personalized Path", desc: "AI адаптирует сложность вопросов под твой уровень, экономя время на обучение." }
                   ].map((item, i) => (
                     <div key={i} className="glass-3d p-12 hover:bg-white/5 transition-colors">
                        <h4 className="text-2xl font-black mb-6 uppercase text-indigo-400">{item.title}</h4>
                        <p className="text-[#666] leading-relaxed font-medium">{item.desc}</p>
                     </div>
                   ))}
                </div>
             </div>
          </section>

          {/* Footer CTA */}
          <section className="py-64 px-10">
            <div className="max-w-[1400px] mx-auto glass-3d p-32 text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative z-10">
                  <h2 className="text-5xl md:text-[80px] font-black mb-16 tracking-tighter leading-none text-shimmer">UNLEASH <br /> YOUR FUTURE.</h2>
                  <p className="text-2xl text-[#666] mb-20 font-medium max-w-2xl mx-auto">Присоединяйся к сообществу Saubol и начни свой путь в лучшие университеты мира уже сегодня.</p>
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-100 rounded-3xl px-20 h-28 text-3xl font-black shadow-[0_40px_80px_rgba(255,255,255,0.1)] transition-all hover:scale-110 active:scale-95"
                    onClick={() => navigate('/login')}
                  >
                    JOIN SAUBOL
                  </Button>
               </div>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
