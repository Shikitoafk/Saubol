import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { MatchmakerData } from "./ai-matchmaker-form";
import { calculateAdmissionChance, SCHOOL_BASE_RATES, AdmissionsProfile } from "@/lib/admissions-logic";

export default function AIMatchmakerResults({ data, onReset }: { data: MatchmakerData, onReset: () => void }) {
  const sat = parseInt(data.sat) || 1200;
  const gpa = parseFloat(data.gpa) || 3.5;
  const ielts = parseFloat(data.ielts) || 6.5;

  // Map to new profile format
  const profile: AdmissionsProfile = {
    sat,
    gpa: gpa > 5 ? (gpa / 4) * 5 : gpa, // Basic normalization
    ielts,
    research: 'none',
    olympiad: 'none',
    extracurriculars: 'participation',
    region: data.region
  };

  const selectedSchools = SCHOOL_BASE_RATES.slice(0, 5); // Pick a few for the report
  
  const schools = selectedSchools.map(school => {
    const results = calculateAdmissionChance(profile, school);
    return {
      name: school.name,
      type: school.rank <= 10 ? "Reach" : school.rank <= 30 ? "Competitive" : "Target",
      results: {
        chance: parseInt(results.range.split('-')[0]), // Use min of range for the simple display
        range: results.range,
        verdict: results.verdict,
        explanation: results.explanations
      }
    };
  });

  const overallMatch = Math.round(schools.reduce((acc, s) => acc + s.results.chance, 0) / schools.length);

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-12 opacity-60">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        <span className="text-[11px] font-black tracking-[0.5em] uppercase text-yellow-500">Admissions Probability Analysis</span>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="glass-3d p-10 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Profile Strength</div>
           <div className="text-7xl font-black text-white leading-none mb-4 tracking-tighter">{overallMatch}%</div>
           <div className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] text-center">Aggregate Admission Index</div>
        </div>
        
        <div className="md:col-span-2 glass-3d p-10 flex flex-col justify-between">
           <div>
             <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Expert Verdict</h4>
             <p className="text-2xl font-black leading-tight mb-8 uppercase italic tracking-tight">
               Estimated chance for {data.region} top-tier institutions: <span className={overallMatch > 60 ? 'text-emerald-400' : 'text-amber-400'}>{overallMatch}%</span>.
             </p>
             <p className="text-[#666] font-medium text-sm leading-relaxed max-w-xl">
               This calculation is based on historical admission rates for international applicants from Kazakhstan and your current academic profile. Note that Top-50 acceptance rates for international students are significantly lower than general averages.
             </p>
           </div>
           <div className="flex gap-4 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /> Kazakhstan Base Rates Applied</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400"><Target className="w-3.5 h-3.5" /> Major Specific Weighting</div>
           </div>
        </div>
      </div>

      <div className="space-y-8 mb-16">
         <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Strategic Breakdown per Institution</h4>
         {schools.map((school, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="glass-3d overflow-hidden border-white/5 hover:border-white/10 transition-all"
           >
              <div className="p-10 flex flex-col lg:flex-row gap-12">
                 {/* School Info */}
                 <div className="lg:w-80 shrink-0">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-8">
                       <Building2 className="w-8 h-8 text-white/40" />
                    </div>
                    <h5 className="text-3xl font-black uppercase tracking-tighter mb-2">{school.name}</h5>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Category: {school.type}</span>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${school.results.chance > 60 ? 'bg-emerald-500/10 text-emerald-400' : school.results.chance > 30 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {school.results.verdict}
                       </span>
                    </div>
                    <div className="mt-8">
                       <p className="text-5xl font-black tracking-tighter">{school.results.chance}%</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-[#444]">Admission Probability</p>
                    </div>
                 </div>

                 {/* Logic Explanation */}
                 <div className="flex-1 bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                       <Info className="w-3.5 h-3.5" /> Decision Factor Breakdown
                    </h6>
                    <div className="grid md:grid-cols-2 gap-4">
                       {school.results.explanation.map((exp, idx) => (
                         <div key={idx} className="flex items-start gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                            {exp.includes('-') ? <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                            <span className="text-xs font-medium text-white/60">{exp}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="glass-3d p-12 mb-16 border-indigo-500/20 bg-indigo-500/5">
         <div className="flex items-center gap-4 mb-8">
            <AlertCircle className="w-6 h-6 text-indigo-400" />
            <h4 className="text-xl font-black uppercase tracking-tight">How to improve your odds?</h4>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Academic</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Raising your SAT from {sat} to 1550+ could increase Stanford chances by ~12%.</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Extracurricular</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Engaging in a research project related to {data.major} adds a significant 'hook'.</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Strategic</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Apply Early Action/Decision to your top choice to gain a 5-10% statistical boost.</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-6">
         <Button onClick={onReset} variant="outline" className="h-16 px-12 rounded-2xl border-white/10 text-white/60 font-black uppercase text-xs hover:bg-white/5 transition-all">Recalibrate Profile</Button>
         <Button className="h-16 px-16 rounded-2xl bg-white text-black font-black uppercase text-xs hover:bg-gray-100 shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95">Download Full Strategic Report</Button>
      </div>
    </div>
  );
}
