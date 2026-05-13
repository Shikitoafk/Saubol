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
  Info,
  ArrowRight,
  Plus
} from "lucide-react";
import { MatchmakerData } from "./ai-matchmaker-form";
import { calculateAdmissionChance, UNIVERSITIES, ApplicantProfile, AdmissionResult } from "@/lib/admissions-logic";
import { Badge } from "@/components/ui/badge";

export default function AIMatchmakerResults({ data, onReset }: { data: MatchmakerData, onReset: () => void }) {
  const sat = parseInt(data.sat) || 1200;
  const gpa = parseFloat(data.gpa) || 3.5;
  const ielts = parseFloat(data.ielts) || 6.5;

  // Map to new profile format with defaults for missing CV fields
  const profile: ApplicantProfile = {
    gpa,
    gpaScale: gpa > 5 ? 100 : gpa > 4 ? 5.0 : 4.0,
    classRank: 'unknown',
    sat,
    ielts,
    curriculum: 'National',
    curriculumCount: 0,
    gradeTrend: 'Stable',
    hasPublishedPaper: false,
    paperStatus: 'None',
    labExperience: false,
    independentResearch: false,
    olympiadLevel: 'None',
    competitionMedals: [],
    foundedOrg: false,
    orgReach: 0,
    leadershipRole: false,
    communityService: false,
    sportsCompetitive: false,
    artsCompetitive: false,
    country: 'Kazakhstan',
    isFirstGen: false,
    financialHardship: false,
    speaksThreeLanguages: false,
    targetRegions: [data.region as any]
  };

  // Filter universities by region and take first 5
  const regionUniversities = UNIVERSITIES.filter(u => u.region === data.region).slice(0, 5);
  
  const schools = regionUniversities.map(u => {
    const res = calculateAdmissionChance(profile, u.name);
    return res || {
      schoolName: u.name,
      region: u.region,
      estimatedChance: 5,
      pros: [],
      cons: ["Profile incomplete"],
      recommendations: ["Complete full CV assessment"]
    } as AdmissionResult;
  });

  const overallMatch = schools.length > 0 
    ? Math.round(schools.reduce((acc, s) => acc + s.estimatedChance, 0) / schools.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-12 opacity-60">
        <Sparkles className="w-6 h-6 text-indigo-400" />
        <span className="text-[11px] font-black tracking-[0.5em] uppercase text-indigo-400">Admissions Probability Analysis</span>
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
               This calculation is based on historical admission rates for international applicants and your academic profile. Note: For a more accurate result (+/- 2%), use the full **Admissions Calculator** to input your research and olympiads.
             </p>
           </div>
           <div className="flex gap-4 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /> Region Base Rates Applied</div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400"><Target className="w-3.5 h-3.5" /> SAT/GPA Weighting</div>
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
                    <h5 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">{school.schoolName}</h5>
                    <div className="flex items-center gap-3">
                       <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black text-[8px] uppercase tracking-widest px-3">{school.region}</Badge>
                    </div>
                    <div className="mt-8">
                       <p className={`text-5xl font-black tracking-tighter ${school.estimatedChance > 50 ? 'text-emerald-400' : 'text-white'}`}>{school.estimatedChance}%</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-[#444]">Admission Probability</p>
                    </div>
                 </div>

                 {/* Logic Explanation */}
                 <div className="flex-1 bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                    <h6 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                       <Info className="w-3.5 h-3.5" /> Key Decision Factors
                    </h6>
                    <div className="grid md:grid-cols-2 gap-4">
                       {school.pros.map((pro, idx) => (
                         <div key={`pro-${idx}`} className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <Plus className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-xs font-medium text-emerald-400/80">{pro}</span>
                         </div>
                       ))}
                       {school.cons.map((con, idx) => (
                         <div key={`con-${idx}`} className="flex items-start gap-3 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                            <span className="text-xs font-medium text-rose-400/80">{con}</span>
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
            <h4 className="text-xl font-black uppercase tracking-tight">Strategic Recommendations</h4>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Academic</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Raising your SAT from {sat} to 1550+ is the most effective way to jump-start your application strength.</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Portfolio</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Top universities require "Hooks". Start a research project or publish a paper in your major area.</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-4">Full Analysis</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed">Use our detailed Admissions Calculator to analyze your CV/Portfolio and get a precise roadmap.</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-6">
         <Button onClick={onReset} variant="outline" className="h-16 px-12 rounded-2xl border-white/10 text-white/60 font-black uppercase text-xs hover:bg-white/5 transition-all">Recalibrate Profile</Button>
         <Button 
           onClick={() => window.location.href = '/admissions/calculator'}
           className="h-16 px-16 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs hover:bg-indigo-500 shadow-[0_20px_40px_rgba(79,70,229,0.2)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-3"
         >
            Start Full CV Analysis <ArrowRight className="w-4 h-4" />
         </Button>
      </div>
    </div>
  );
}
