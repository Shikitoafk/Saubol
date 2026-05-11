import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { 
  Globe, 
  GraduationCap, 
  MapPin, 
  Search, 
  Sparkles, 
  ArrowRight,
  Zap,
  Building2,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Admissions() {
  const nav = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        {/* Depth Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] left-[-5%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-24 relative z-10">
          {/* Header */}
          <div className="mb-24">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-400">Admissions Strategy</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-shimmer leading-[0.85] mb-10 uppercase">
              YOUR GLOBAL <br /> FUTURE.
            </h1>
            <p className="text-xl text-[#666] font-medium max-w-2xl leading-relaxed">
              Помогаем поступить в лучшие вузы мира. Стратегия, подготовка и результат.
            </p>
          </div>

          {/* AI Matchmaker Feature */}
          <div className="glass-3d p-16 mb-20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
               <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">AI Intelligence</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tight mb-6 uppercase">AI Matchmaker</h2>
                  <p className="text-[#888] text-lg leading-relaxed mb-10">
                    Наш алгоритм анализирует твой профиль и подбирает лучшие варианты для поступления.
                  </p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-2xl px-12 h-16 font-black uppercase text-xs shadow-[0_20px_40px_rgba(255,255,255,0.1)]">Analyze My Profile</Button>
               </div>
               <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
                  {[
                    { label: "Global Reach", icon: Building2 },
                    { label: "Visa Support", icon: MapPin },
                    { label: "Essays Help", icon: GraduationCap },
                    { label: "Consulting", icon: Zap }
                  ].map((s, i) => (
                    <div key={i} className="p-8 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                       <s.icon className="w-8 h-8 mb-4 text-[#333]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">{s.label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Destination Modules */}
          <div className="grid gap-8 lg:grid-cols-3">
             {[
               { region: "USA & CANADA", desc: "Топовые вузы США и Канады.", color: "text-blue-400" },
               { region: "UK & EUROPE", desc: "Лучшее образование в Европе и Британии.", color: "text-indigo-400" },
               { region: "ASIA & GLOBAL", desc: "Инновационные вузы Азии.", color: "text-emerald-400" }
             ].map((dest, i) => (
               <div key={i} className="glass-3d p-12 group hover:scale-105 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-12">
                     <Compass className={`w-8 h-8 ${dest.color}`} />
                     <ArrowRight className="w-5 h-5 text-[#111] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">{dest.region}</h3>
                  <p className="text-xs font-bold text-[#444] uppercase tracking-widest leading-relaxed mb-10">{dest.desc}</p>
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${dest.color}`}>
                    View Strategy
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
