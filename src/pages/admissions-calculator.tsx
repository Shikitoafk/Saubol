import { useState } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Info, 
  TrendingUp,
  Target,
  GraduationCap,
  Globe,
  ArrowRight,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateAdmissionChance, SCHOOL_BASE_RATES, AdmissionsProfile } from "@/lib/admissions-logic";

export default function AdmissionsCalculator() {
  const [profile, setProfile] = useState<AdmissionsProfile>({
    sat: 1450,
    gpa: 4.5,
    ielts: 7.5,
    research: 'none',
    olympiad: 'none',
    extracurriculars: 'participation',
    region: 'Kazakhstan'
  });

  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    setLoading(true);
    setTimeout(() => {
      const calculated = SCHOOL_BASE_RATES.map(school => ({
        school,
        ...calculateAdmissionChance(profile, school)
      }));
      setResults(calculated);
      setLoading(false);
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white pt-32 pb-20 px-10 relative overflow-hidden">
        <div className="bg-vignette" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-emerald-400">Decision Engine v3.0</span>
            </div>
            <h1 className="text-8xl font-black text-shimmer mb-10 uppercase italic">PROBABILITY.</h1>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Form Column */}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-3d p-10 space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Target className="w-5 h-5 text-indigo-400" /> Applicant Profile
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">SAT Score ({profile.sat})</label>
                    <input type="range" min="1000" max="1600" step="10" value={profile.sat} onChange={e => setProfile({...profile, sat: parseInt(e.target.value)})} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">GPA (Scale 5.0) ({profile.gpa})</label>
                    <input type="range" min="3.0" max="5.0" step="0.1" value={profile.gpa} onChange={e => setProfile({...profile, gpa: parseFloat(e.target.value)})} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">IELTS Score</label>
                    <select value={profile.ielts} onChange={e => setProfile({...profile, ielts: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black uppercase tracking-widest">
                      {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">Research Experience</label>
                    <select value={profile.research} onChange={e => setProfile({...profile, research: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black">
                      <option value="none">No Research</option>
                      <option value="lab">Lab Assistant / Experience</option>
                      <option value="preprint">Preprint / Submitted</option>
                      <option value="published">Published in Journal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">Olympiad Achievements</label>
                    <select value={profile.olympiad} onChange={e => setProfile({...profile, olympiad: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black">
                      <option value="none">No Olympiads</option>
                      <option value="regional">Regional Winner</option>
                      <option value="national_bronze_silver">National Silver/Bronze</option>
                      <option value="national_gold">National Gold</option>
                      <option value="international">International Medal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-3 block">Extracurriculars</label>
                    <select value={profile.extracurriculars} onChange={e => setProfile({...profile, extracurriculars: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black">
                      <option value="participation">Standard Participation</option>
                      <option value="leadership">Leadership Role (Club President/Captain)</option>
                      <option value="founder">Founder of Impactful Project/Org</option>
                    </select>
                  </div>

                  <Button onClick={handleCalculate} disabled={loading} className="w-full h-16 bg-white text-black font-black uppercase text-xs rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Calculate Probabilities"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {!results ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center glass-3d border-dashed border-white/10 opacity-40">
                     <Sparkles className="w-12 h-12 mb-6 text-white/20" />
                     <p className="text-[10px] font-black uppercase tracking-[0.5em]">Enter profile data to simulate admissions</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {results.map((res, i) => (
                      <div key={i} className="glass-3d overflow-hidden border-white/5">
                        <div className="p-10 flex flex-col lg:flex-row gap-12">
                          <div className="lg:w-80 shrink-0">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-8"><Building2 className="w-8 h-8 text-white/40" /></div>
                            <h5 className="text-3xl font-black uppercase tracking-tighter mb-2">{res.school.name}</h5>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${res.verdict === 'Competitive Candidate' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{res.verdict}</span>
                            <div className="mt-8">
                              <p className="text-6xl font-black tracking-tighter">{res.range}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#444]">Chance Range</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-8">
                            <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                               <h6 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Decision Logic</h6>
                               <div className="grid md:grid-cols-2 gap-4">
                                  {res.explanations.map((exp: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                                       {exp.includes('-') ? <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                                       <span className="text-[10px] font-medium text-white/60">{exp}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                            
                            <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                               <h6 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Path to 40%+</h6>
                               <div className="space-y-3">
                                  {res.improvements.map((imp: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-white/80 uppercase tracking-tight">
                                       <ArrowRight className="w-3.5 h-3.5 text-emerald-500" /> {imp}
                                    </div>
                                  ))}
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
