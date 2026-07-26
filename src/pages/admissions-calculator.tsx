import { useState } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Target, 
  Trophy, 
  Globe, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  Zap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Info,
  TrendingUp,
  FlaskConical,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UNIVERSITIES } from "@/data/universities";
import { FullApplicantProfile, calculateChances, DetailedAdmissionResult } from "@/lib/admissions-logic";
import { Badge } from "@/components/ui/badge";

export default function AdmissionsCalculator() {
  const [step, setStep] = useState(1);
  const [region, setRegion] = useState<'usa_canada' | 'uk_europe' | 'asia_global'>('usa_canada');
  const [showResults, setShowResults] = useState(false);
  const [profile, setProfile] = useState<FullApplicantProfile>({
    gpa: 0,
    gpaScale: 4.0,
    sat: 0,
    ielts: 0,
    gradeTrend: 'stable',
    ibApCourses: 'none',
    research: 'none',
    olympiad: 'none',
    competitionMedals: [],
    ec: 'none',
    firstGen: false,
    financialHardship: false,
    languages3plus: false,
    uniqueStory: false,
    region: 'usa_canada'
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const calculate = () => {
    setShowResults(true);
  };

  const results = UNIVERSITIES
    .filter(u => u.region === region)
    .map(u => calculateChances({ ...profile, region }, u));

  return (
    <Layout>
      <div className="min-h-screen bg-canvas pt-32 pb-48 px-10 relative overflow-hidden">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] right-[-10%] opacity-20" />

        <div className="max-w-6xl mx-auto relative z-10">
          {!showResults ? (
            <div className="grid lg:grid-cols-3 gap-16">
               <div className="lg:col-span-1">
                  <header className="mb-16">
                     <div className="flex items-center gap-3 mb-6 opacity-60">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Admissions Intelligence</span>
                     </div>
                     <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-8 leading-none">CV <br /> ANALYZER.</h1>
                     <p className="text-ink-muted text-lg font-medium leading-relaxed italic">
                        Input your profile dimensions. Get realistic admission probabilities based on international data.
                     </p>
                  </header>

                  <div className="space-y-6">
                     {[1, 2, 3].map(i => (
                        <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${step === i ? 'bg-surface border-line' : 'opacity-30 border-transparent'}`}>
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${step === i ? 'bg-indigo-500 text-ink' : 'bg-surface text-ink-muted'}`}>
                              0{i}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{i === 1 ? 'Academics' : i === 2 ? 'Research & Honors' : 'Activities'}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                     {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-3d p-12 space-y-12">
                           <div className="flex items-center gap-4 mb-8">
                              <GraduationCap className="w-8 h-8 text-indigo-400" />
                              <h3 className="text-3xl font-black uppercase italic tracking-tight">Step 1: Academic Profile</h3>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">GPA / Scale</label>
                                 <div className="flex gap-2">
                                    <input type="number" step="0.01" className="flex-1 h-14 bg-surface border border-line rounded-xl px-6 font-bold" placeholder="3.9" onChange={e => setProfile({...profile, gpa: parseFloat(e.target.value)})}/>
                                    <select className="w-24 h-14 bg-surface border border-line rounded-xl px-4 font-bold" onChange={e => setProfile({...profile, gpaScale: parseFloat(e.target.value)})}>
                                       <option value="4.0">4.0</option>
                                       <option value="5.0">5.0</option>
                                       <option value="100">100</option>
                                    </select>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">SAT Score</label>
                                 <input type="number" className="w-full h-14 bg-surface border border-line rounded-xl px-6 font-bold" placeholder="1550" onChange={e => setProfile({...profile, sat: parseInt(e.target.value)})}/>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">IELTS / TOEFL</label>
                                 <input type="number" step="0.5" className="w-full h-14 bg-surface border border-line rounded-xl px-6 font-bold" placeholder="7.5" onChange={e => setProfile({...profile, ielts: parseFloat(e.target.value)})}/>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">IB / AP Courses</label>
                                 <select className="w-full h-14 bg-surface border border-line rounded-xl px-6 font-bold" onChange={e => setProfile({...profile, ibApCourses: e.target.value as any})}>
                                    <option value="none">None</option>
                                    <option value="1-2">1-2 Courses</option>
                                    <option value="3-5">3-5 Courses</option>
                                    <option value="6+">6+ Courses</option>
                                 </select>
                              </div>
                              <div className="space-y-4 md:col-span-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Grade Trend</label>
                                 <div className="grid grid-cols-3 gap-4">
                                    {['improving', 'stable', 'declining'].map(t => (
                                       <button key={t} onClick={() => setProfile({...profile, gradeTrend: t as any})} className={`h-14 rounded-xl border font-bold uppercase text-[10px] transition-all ${profile.gradeTrend === t ? 'bg-indigo-500 border-indigo-400 text-ink shadow-xl' : 'bg-surface border-line text-ink-muted'}`}>
                                          {t}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <Button onClick={next} className="w-full h-20 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs shadow-2xl">
                              Next Step <ArrowRight className="ml-2 w-4 h-4" />
                           </Button>
                        </motion.div>
                     )}

                     {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-3d p-12 space-y-12">
                           <div className="flex items-center gap-4 mb-8">
                              <FlaskConical className="w-8 h-8 text-indigo-400" />
                              <h3 className="text-3xl font-black uppercase italic tracking-tight">Step 2: Research & Honors</h3>
                           </div>

                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Research Experience</label>
                                 <div className="grid grid-cols-1 gap-3">
                                    {[
                                      { id: 'none', label: 'No research experience' },
                                      { id: 'lab', label: 'Lab / Research experience only' },
                                      { id: 'project', label: 'Independent research project' },
                                      { id: 'submitted', label: 'Submitted paper (Under review)' },
                                      { id: 'published', label: 'Published paper in real journal' }
                                    ].map(r => (
                                       <button key={r.id} onClick={() => setProfile({...profile, research: r.id as any})} className={`w-full h-16 rounded-xl border px-6 font-bold text-left transition-all flex items-center justify-between ${profile.research === r.id ? 'bg-indigo-500 border-indigo-400 text-ink shadow-xl' : 'bg-surface border-line text-ink-muted hover:bg-surface-2'}`}>
                                          <span className="text-xs uppercase">{r.label}</span>
                                          {profile.research === r.id && <CheckCircle2 className="w-5 h-5" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Olympiads & Honors</label>
                                 <div className="grid grid-cols-1 gap-3">
                                    {[
                                      { id: 'none', label: 'None' },
                                      { id: 'regional', label: 'Regional level' },
                                      { id: 'national_other', label: 'National Bronze/Silver' },
                                      { id: 'national_gold', label: 'National Gold' },
                                      { id: 'international', label: 'International Medal (IBO/IMO/etc)' }
                                    ].map(o => (
                                       <button key={o.id} onClick={() => setProfile({...profile, olympiad: o.id as any})} className={`w-full h-16 rounded-xl border px-6 font-bold text-left transition-all flex items-center justify-between ${profile.olympiad === o.id ? 'bg-indigo-500 border-indigo-400 text-ink shadow-xl' : 'bg-surface border-line text-ink-muted hover:bg-surface-2'}`}>
                                          <span className="text-xs uppercase">{o.label}</span>
                                          {profile.olympiad === o.id && <CheckCircle2 className="w-5 h-5" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <Button onClick={prev} variant="outline" className="h-20 px-10 rounded-2xl border-line text-ink-muted font-black uppercase text-xs">Back</Button>
                              <Button onClick={next} className="flex-1 h-20 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs shadow-2xl">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
                           </div>
                        </motion.div>
                     )}

                     {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-3d p-12 space-y-12">
                           <div className="flex items-center gap-4 mb-8">
                              <Users className="w-8 h-8 text-indigo-400" />
                              <h3 className="text-3xl font-black uppercase italic tracking-tight">Step 3: Activities & Background</h3>
                           </div>

                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Extracurriculars</label>
                                 <div className="grid grid-cols-1 gap-3">
                                    {[
                                      { id: 'none', label: 'None / Minimal' },
                                      { id: 'member', label: 'Member of clubs/teams' },
                                      { id: 'leadership', label: 'Leadership role (Captain/Pres)' },
                                      { id: 'founded_small', label: 'Founded organization (<50 members)' },
                                      { id: 'founded_large', label: 'Founded organization (100+ members/users)' }
                                    ].map(e => (
                                       <button key={e.id} onClick={() => setProfile({...profile, ec: e.id as any})} className={`w-full h-16 rounded-xl border px-6 font-bold text-left transition-all flex items-center justify-between ${profile.ec === e.id ? 'bg-indigo-500 border-indigo-400 text-ink shadow-xl' : 'bg-surface border-line text-ink-muted hover:bg-surface-2'}`}>
                                          <span className="text-xs uppercase">{e.label}</span>
                                          {profile.ec === e.id && <CheckCircle2 className="w-5 h-5" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Background Modifiers</label>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                      { id: 'firstGen', label: 'First-Gen Student' },
                                      { id: 'financialHardship', label: 'Financial Hardship' },
                                      { id: 'languages3plus', label: 'Polyglot (3+ Lang)' },
                                      { id: 'uniqueStory', label: 'Unique Personal Story' }
                                    ].map(b => (
                                       <button key={b.id} onClick={() => setProfile({...profile, [b.id]: !(profile as any)[b.id]})} className={`h-20 rounded-xl border px-6 font-bold transition-all flex items-center gap-4 ${(profile as any)[b.id] ? 'bg-indigo-500 border-indigo-400 text-ink' : 'bg-surface border-line text-ink-muted'}`}>
                                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${(profile as any)[b.id] ? 'bg-white border-white' : 'border-line-strong'}`}>
                                             {(profile as any)[b.id] && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                                          </div>
                                          <span className="text-[10px] uppercase text-left">{b.label}</span>
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Select Target Region</label>
                                 <div className="grid grid-cols-3 gap-4">
                                    {[
                                      { id: 'usa_canada', label: 'USA & CANADA' },
                                      { id: 'uk_europe', label: 'UK & EUROPE' },
                                      { id: 'asia_global', label: 'ASIA & GLOBAL' }
                                    ].map(r => (
                                       <button key={r.id} onClick={() => setRegion(r.id as any)} className={`h-20 rounded-xl border font-black uppercase text-[10px] transition-all ${region === r.id ? 'bg-white text-black border-white shadow-2xl scale-105' : 'bg-surface border-line text-ink-muted hover:bg-surface-2'}`}>
                                          {r.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <Button onClick={prev} variant="outline" className="h-20 px-10 rounded-2xl border-line text-ink-muted font-black uppercase text-xs">Back</Button>
                              <Button onClick={calculate} className="flex-1 h-20 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl font-black uppercase text-xs shadow-[0_20px_40px_rgba(79,70,229,0.3)]">Generate Full Analysis <Zap className="ml-2 w-4 h-4 fill-current" /></Button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
          ) : (
            <div className="space-y-16">
               <header className="flex flex-col md:flex-row justify-between items-end gap-12">
                  <div>
                     <Button onClick={() => setShowResults(false)} variant="link" className="text-indigo-400 p-0 h-auto font-black uppercase text-[10px] tracking-[0.2em] mb-6">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Recalibrate Profile
                     </Button>
                     <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">THE <br /> RESULTS.</h1>
                  </div>
                  <div className="flex gap-4">
                     <div className="p-6 glass-3d border-line text-center min-w-[200px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-ink-subtle mb-2">Region Filtered</p>
                        <p className="text-xl font-black italic text-indigo-400 uppercase tracking-tighter">{region.replace('_', ' & ')}</p>
                     </div>
                  </div>
               </header>

               <div className="grid gap-12">
                  {results.map((res, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-3d overflow-hidden border-line"
                    >
                       <div className="p-12 flex flex-col lg:flex-row gap-16">
                          <div className="lg:w-96 shrink-0">
                             <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center border border-line mb-8">
                                <Building2 className="w-8 h-8 text-ink-muted" />
                             </div>
                             <h4 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">{res.schoolName}</h4>
                             <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black text-[9px] uppercase tracking-widest px-4 mb-10">Target Region</Badge>
                             
                             <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-ink-subtle">Admission Probability</p>
                                   <p className="text-3xl font-black italic tracking-tighter text-indigo-400">{res.low}-{res.high}%</p>
                                </div>
                                <div className="h-3 w-full bg-surface rounded-full overflow-hidden relative">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${res.high}%` }}
                                     className="absolute h-full bg-indigo-500/20"
                                   />
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${res.low}%` }}
                                     className="absolute h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="flex-1 space-y-12">
                             <div>
                                <h6 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
                                   <TrendingUp className="w-4 h-4" /> Why this estimate?
                                </h6>
                                <div className="grid md:grid-cols-2 gap-4">
                                   {res.pros.map((pro, idx) => (
                                      <div key={idx} className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                                         <Plus className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                         <span className="text-xs font-bold text-emerald-400/80">{pro}</span>
                                      </div>
                                   ))}
                                   {res.cons.map((con, idx) => (
                                      <div key={idx} className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 flex items-start gap-3">
                                         <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                         <span className="text-xs font-bold text-rose-400/80">{con}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div>
                                <h6 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 flex items-center gap-2">
                                   <Zap className="w-4 h-4" /> Tactical Upgrades
                                </h6>
                                <div className="space-y-3">
                                   {res.recommendations.map((rec, idx) => (
                                      <div key={idx} className="p-5 bg-surface rounded-2xl border border-line flex items-center gap-4 group">
                                         <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                         <span className="text-xs font-black uppercase italic tracking-tight">{rec}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
