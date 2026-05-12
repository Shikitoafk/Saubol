import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  GraduationCap, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles
} from "lucide-react";
import { MatchmakerData } from "./ai-matchmaker-form";

export default function AIMatchmakerResults({ data, onReset }: { data: MatchmakerData, onReset: () => void }) {
  const sat = parseInt(data.sat) || 0;
  const gpa = parseFloat(data.gpa) || 0;

  // Mock matching logic
  const getProbability = () => {
    if (sat > 1500 && gpa > 3.8) return 85;
    if (sat > 1400 && gpa > 3.5) return 65;
    return 45;
  };

  const schools = [
    { name: "Stanford University", type: "Reach", chance: "High Risk", color: "text-rose-500" },
    { name: "UC Berkeley", type: "Match", chance: "Favorable", color: "text-emerald-500" },
    { name: "University of Toronto", type: "Safety", chance: "Guaranteed", color: "text-blue-500" }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-12 opacity-60">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        <span className="text-[11px] font-black tracking-[0.5em] uppercase text-yellow-500">Your Personalized Strategy</span>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="glass-3d p-10 flex flex-col items-center justify-center border-yellow-500/20">
           <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4">Match Rating</div>
           <div className="text-7xl font-black text-white leading-none mb-4 tracking-tighter">{getProbability()}%</div>
           <div className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">Compatibility with {data.major}</div>
        </div>
        
        <div className="md:col-span-2 glass-3d p-10">
           <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-8">Executive Summary</h4>
           <p className="text-xl font-medium leading-relaxed mb-6">
             Based on your SAT score of <span className="text-white">{data.sat}</span> and GPA of <span className="text-white">{data.gpa}</span>, you are a strong candidate for <span className="text-yellow-500 uppercase">{data.region}</span> universities.
           </p>
           <div className="flex gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /> High Potential</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400"><Target className="w-3.5 h-3.5" /> Strong Match</div>
           </div>
        </div>
      </div>

      <div className="space-y-6 mb-16">
         <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-8">Target Institution Roadmap</h4>
         {schools.map((school, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="glass-3d p-8 flex items-center justify-between group hover:border-white/20"
           >
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <Building2 className="w-6 h-6 text-white/60" />
                 </div>
                 <div>
                    <h5 className="text-xl font-black uppercase tracking-tight">{school.name}</h5>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{school.type} Institution</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className={`text-[10px] font-black uppercase tracking-widest ${school.color} mb-1`}>{school.chance}</p>
                 <Button variant="ghost" className="h-8 px-0 text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white">View strategy <ChevronRight className="w-3 h-3 ml-1" /></Button>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="flex justify-center gap-6">
         <Button onClick={onReset} variant="outline" className="h-16 px-12 rounded-2xl border-white/10 text-white/60 font-black uppercase text-xs hover:bg-white/5">Start Over</Button>
         <Button className="h-16 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs hover:bg-gray-100 shadow-xl">Contact Consultant</Button>
      </div>
    </div>
  );
}
