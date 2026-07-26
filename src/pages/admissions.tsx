import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { 
  Globe, 
  Sparkles, 
  Building2, 
  MapPin, 
  GraduationCap, 
  Zap, 
  Compass, 
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AIMatchmakerForm, { MatchmakerData } from "@/components/ai-matchmaker-form";
import AIMatchmakerResults from "@/components/ai-matchmaker-results";

export default function Admissions() {
  const nav = useNavigate();
  const [matchmakerState, setMatchmakerState] = useState<"landing" | "form" | "results">("landing");
  const [matchData, setMatchData] = useState<MatchmakerData | null>(null);

  const handleComplete = (data: MatchmakerData) => {
    setMatchData(data);
    setMatchmakerState("results");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 relative overflow-hidden font-sans">
        {/* Depth Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] left-[-5%] opacity-30" />
        
        <div className="max-w-[1400px] mx-auto px-10 py-24 relative z-10">
          {/* Header */}
          {matchmakerState === "landing" && (
            <div className="mb-24">
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-400">Admissions Strategy</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-shimmer leading-[0.85] mb-10 uppercase">
                YOUR GLOBAL <br /> FUTURE.
              </h1>
              <p className="text-xl text-ink-muted font-medium max-w-2xl leading-relaxed">
                Помогаем поступить в лучшие вузы мира. Стратегия, подготовка и результат.
              </p>
            </div>
          )}

          {/* AI Matchmaker Feature */}
          {matchmakerState === "landing" && (
            <div className="glass-3d p-20 mb-20 relative overflow-hidden group border-line">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                 <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-8">
                      <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                      <span className="text-[11px] font-black tracking-[0.4em] uppercase text-yellow-500">AI Intelligence</span>
                    </div>
                    <h2 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 uppercase leading-none">
                      AI <br /> Matchmaker
                    </h2>
                    <p className="text-ink-muted text-xl leading-relaxed mb-12 max-w-lg">
                      Наш алгоритм анализирует твой профиль и подбирает лучшие варианты для поступления.
                    </p>
                    <Button 
                      onClick={() => setMatchmakerState("form")}
                      className="bg-white text-black hover:bg-gray-100 rounded-2xl px-16 h-20 font-black uppercase text-sm shadow-[0_30px_60px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95"
                    >
                      Analyze My Profile
                    </Button>
                 </div>
                 <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                    {[
                      { label: "Global Reach", icon: Building2 },
                      { label: "Visa Support", icon: MapPin },
                      { label: "Essays Help", icon: GraduationCap },
                      { label: "Consulting", icon: Zap }
                    ].map((s, i) => (
                      <div key={i} className="w-48 h-48 p-8 bg-surface rounded-3xl border border-line flex flex-col items-center justify-center text-center group/card hover:bg-surface-2 transition-colors">
                         <s.icon className="w-10 h-10 mb-6 text-[#222] group-hover/card:text-ink transition-colors" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333] group-hover/card:text-ink-muted transition-colors">{s.label}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {matchmakerState === "form" && (
            <div className="py-20">
               <AIMatchmakerForm onComplete={handleComplete} />
            </div>
          )}

          {matchmakerState === "results" && matchData && (
            <div className="py-10">
               <AIMatchmakerResults data={matchData} onReset={() => setMatchmakerState("landing")} />
            </div>
          )}

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
                     <ArrowRight className="w-5 h-5 text-[#111] group-hover:text-ink transition-colors" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">{dest.region}</h3>
                  <p className="text-xs font-bold text-ink-subtle uppercase tracking-widest leading-relaxed mb-10">{dest.desc}</p>
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
