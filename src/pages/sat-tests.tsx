import { useState } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Target, 
  Zap, 
  ChevronRight, 
  Trophy,
  History,
  TrendingUp,
  Brain,
  ShieldCheck,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SATTests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  const testTypes = [
    {
      id: 'mini',
      title: 'Topic Sprint',
      questions: 10,
      time: '8 min',
      difficulty: 'Targeted',
      description: 'Ultra-fast module focused on your weakest Algebra concepts.',
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/5',
      border: 'border-yellow-500/20'
    },
    {
      id: 'module',
      title: 'Full Module',
      questions: 27,
      time: '35 min',
      difficulty: 'Adaptive',
      description: 'Official timing simulation for Math or R&W modules.',
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/5',
      border: 'border-indigo-500/20'
    },
    {
      id: 'full',
      title: 'Full Practice',
      questions: 54,
      time: '134 min',
      difficulty: 'Bluebook Style',
      description: 'Complete Digital SAT simulation with break and results.',
      icon: Trophy,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white pt-32 pb-20 px-10 relative overflow-hidden">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-40 animate-pulse" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-indigo-400">Simulation Control</span>
            </div>
            <h1 className="text-8xl font-black text-shimmer mb-10 uppercase italic">TESTING.</h1>
            
            <div className="flex gap-12 border-b border-white/5 pb-4">
              <button onClick={() => setActiveTab('available')} className={`text-[11px] font-black uppercase tracking-widest transition-colors pb-4 relative ${activeTab === 'available' ? 'text-white' : 'text-white/40'}`}>
                Available Simulations
                {activeTab === 'available' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-white" />}
              </button>
              <button onClick={() => setActiveTab('completed')} className={`text-[11px] font-black uppercase tracking-widest transition-colors pb-4 relative ${activeTab === 'completed' ? 'text-white' : 'text-white/40'}`}>
                Test History
                {activeTab === 'completed' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-white" />}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testTypes.map((test, i) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-3d p-12 flex flex-col justify-between group hover:border-white/20 transition-all ${test.border} ${test.bg}`}
              >
                <div>
                   <div className="flex justify-between items-start mb-12">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${test.border} bg-black/40`}>
                         <test.icon className={`w-7 h-7 ${test.color}`} />
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Format</p>
                         <p className="text-xs font-black uppercase text-white/75">{test.difficulty}</p>
                      </div>
                   </div>
                   
                   <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-4">{test.title}</h3>
                   <p className="text-[#a6a6ae] font-medium text-sm leading-relaxed mb-10">{test.description}</p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-12">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Questions</p>
                         <p className="text-xl font-black">{test.questions}</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Duration</p>
                         <p className="text-xl font-black">{test.time}</p>
                      </div>
                   </div>
                </div>

                <Button 
                  onClick={() => navigate('/sat/practice')}
                  className="w-full h-16 bg-white text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-all"
                >
                  Initiate Simulation <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Intelligence Briefing */}
          <div className="mt-32 p-16 glass-3d border-indigo-500/10 bg-indigo-500/5">
             <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <Brain className="w-8 h-8 text-indigo-400" />
                      <h4 className="text-3xl font-black uppercase tracking-tighter italic">Predictive Index.</h4>
                   </div>
                   <p className="text-lg text-[#a6a6ae] font-medium leading-relaxed">Based on your last 3 module tests, your estimated score trajectory is <span className="text-white">1480-1540</span>. We recommend a Full Practice test to confirm timing resilience.</p>
                </div>
                <div className="flex gap-6">
                   <div className="text-center p-8 glass-3d border-white/5 min-w-[160px]">
                      <p className="text-5xl font-black italic">1510</p>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2">Current Projection</p>
                   </div>
                   <div className="text-center p-8 glass-3d border-white/5 min-w-[160px]">
                      <p className="text-5xl font-black italic text-emerald-400">+70</p>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2">7-Day Delta</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
