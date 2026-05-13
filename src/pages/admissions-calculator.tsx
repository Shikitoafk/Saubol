import { useState } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  GraduationCap, 
  Search, 
  Trophy, 
  Users, 
  Globe,
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  FlaskConical,
  Languages,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateDetailedAdmissions, ApplicantProfile, AdmissionResult } from "@/lib/admissions-logic";

export default function AdmissionsCalculator() {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState<AdmissionResult[] | null>(null);
  const [formData, setFormData] = useState<ApplicantProfile>({
    gpa: 4.0,
    gpaScale: 4.0,
    classRank: 'unknown',
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
    country: '',
    isFirstGen: false,
    financialHardship: false,
    speaksThreeLanguages: false,
    targetRegions: ['US']
  });

  const handleCalculate = () => {
    const res = calculateDetailedAdmissions(formData);
    setResults(res);
  };

  const toggleRegion = (region: any) => {
    setFormData(prev => ({
      ...prev,
      targetRegions: prev.targetRegions.includes(region) 
        ? prev.targetRegions.filter(r => r !== region)
        : [...prev.targetRegions, region]
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-32 pb-20 px-10 relative overflow-hidden">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-20" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-20 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
              <Calculator className="w-4 h-4" />
              Global Intelligence Engine
            </div>
            <h1 className="text-8xl font-black italic tracking-tighter uppercase mb-6">AI ADMISSIONS.</h1>
            <p className="text-white/40 text-xl font-medium max-w-2xl mx-auto">Upload your full profile. Get realistic admission chances based on historical data for international applicants.</p>
          </header>

          {!results ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-5 gap-2 mb-12">
                 {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${step >= i ? 'bg-indigo-500' : 'bg-white/5'}`} />
                 ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-3d p-12 border-white/5"
                >
                  {step === 1 && (
                    <div className="space-y-10">
                       <h3 className="text-4xl font-black uppercase italic flex items-center gap-4">
                          <GraduationCap className="w-8 h-8 text-indigo-400" /> SECTION 1: ACADEMICS
                       </h3>
                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-white/20">GPA & Scale</label>
                             <div className="flex gap-4">
                                <Input type="number" placeholder="GPA" className="h-14 bg-white/5" onChange={e => setFormData({...formData, gpa: parseFloat(e.target.value)})} />
                                <select className="bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black uppercase" onChange={e => setFormData({...formData, gpaScale: parseFloat(e.target.value)})}>
                                   <option value="4.0">/ 4.0</option>
                                   <option value="5.0">/ 5.0</option>
                                   <option value="100">/ 100</option>
                                </select>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-white/20">SAT Score (Optional)</label>
                             <Input type="number" placeholder="400 - 1600" className="h-14 bg-white/5" onChange={e => setFormData({...formData, sat: parseInt(e.target.value)})} />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Grade Trend</label>
                             <div className="grid grid-cols-3 gap-2">
                                {['Improving', 'Stable', 'Declining'].map(t => (
                                   <button 
                                     key={t}
                                     onClick={() => setFormData({...formData, gradeTrend: t as any})}
                                     className={`p-4 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.gradeTrend === t ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10'}`}
                                   >
                                      {t}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-10">
                       <h3 className="text-4xl font-black uppercase italic flex items-center gap-4">
                          <FlaskConical className="w-8 h-8 text-indigo-400" /> SECTION 2: RESEARCH
                       </h3>
                       <div className="grid gap-6">
                          <button 
                            onClick={() => setFormData({...formData, paperStatus: formData.paperStatus === 'Published' ? 'None' : 'Published'})}
                            className={`p-10 rounded-2xl border text-left flex items-center justify-between transition-all ${formData.paperStatus === 'Published' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5'}`}
                          >
                             <div>
                                <p className="text-xl font-black uppercase mb-1 italic tracking-tight">Published Paper?</p>
                                <p className="text-xs text-white/40">In a peer-reviewed journal or competition</p>
                             </div>
                             <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${formData.paperStatus === 'Published' ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'}`}>
                                {formData.paperStatus === 'Published' && <div className="w-2 h-2 bg-white rounded-full" />}
                             </div>
                          </button>
                          <div className="grid md:grid-cols-2 gap-4">
                             <button onClick={() => setFormData({...formData, labExperience: !formData.labExperience})} className={`p-8 rounded-2xl border text-sm font-black uppercase transition-all ${formData.labExperience ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 opacity-40'}`}>Lab Research</button>
                             <button onClick={() => setFormData({...formData, independentResearch: !formData.independentResearch})} className={`p-8 rounded-2xl border text-sm font-black uppercase transition-all ${formData.independentResearch ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 opacity-40'}`}>Independent Project</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-10">
                       <h3 className="text-4xl font-black uppercase italic flex items-center gap-4">
                          <Trophy className="w-8 h-8 text-indigo-400" /> SECTION 3: OLYMPIADS
                       </h3>
                       <div className="grid gap-4">
                          {[
                            { id: 'International', label: 'International Medal', sub: 'IBO, IPhO, IMO, IChO, etc' },
                            { id: 'NationalGold', label: 'National Gold', sub: 'Highest level in your country' },
                            { id: 'NationalSilverBronze', label: 'National Silver/Bronze', sub: 'Top tier national placement' }
                          ].map(opt => (
                            <button 
                              key={opt.id}
                              onClick={() => setFormData({...formData, olympiadLevel: opt.id as any})}
                              className={`p-8 rounded-2xl border text-left flex items-center justify-between transition-all ${formData.olympiadLevel === opt.id ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5'}`}
                            >
                               <div>
                                  <p className="text-lg font-black uppercase mb-1 italic tracking-tight">{opt.label}</p>
                                  <p className="text-[10px] text-white/20 uppercase tracking-widest">{opt.sub}</p>
                               </div>
                               <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${formData.olympiadLevel === opt.id ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'}`}>
                                  {formData.olympiadLevel === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-10">
                       <h3 className="text-4xl font-black uppercase italic flex items-center gap-4">
                          <Users className="w-8 h-8 text-indigo-400" /> SECTION 4: EXTRACURRICULARS
                       </h3>
                       <div className="space-y-8">
                          <div className={`p-10 rounded-2xl border transition-all ${formData.foundedOrg ? 'bg-indigo-600/5 border-indigo-500/40' : 'bg-white/5 border-white/5'}`}>
                             <div className="flex items-center justify-between mb-8">
                                <p className="text-xl font-black uppercase italic tracking-tight">Founded an Org/Startup?</p>
                                <button onClick={() => setFormData({...formData, foundedOrg: !formData.foundedOrg})} className={`w-12 h-6 rounded-full relative transition-all ${formData.foundedOrg ? 'bg-indigo-500' : 'bg-white/10'}`}>
                                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.foundedOrg ? 'right-1' : 'left-1'}`} />
                                </button>
                             </div>
                             {formData.foundedOrg && (
                                <div className="space-y-4">
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Approximate reach (users/members)</label>
                                   <Input type="number" placeholder="e.g. 500" className="bg-black/40 h-14" onChange={e => setFormData({...formData, orgReach: parseInt(e.target.value)})} />
                                </div>
                             )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                             <button onClick={() => setFormData({...formData, leadershipRole: !formData.leadershipRole})} className={`p-8 rounded-2xl border text-sm font-black uppercase transition-all ${formData.leadershipRole ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 opacity-40'}`}>Leadership Role</button>
                             <button onClick={() => setFormData({...formData, communityService: !formData.communityService})} className={`p-8 rounded-2xl border text-sm font-black uppercase transition-all ${formData.communityService ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 opacity-40'}`}>Community Service</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-10">
                       <h3 className="text-4xl font-black uppercase italic flex items-center gap-4">
                          <Globe className="w-8 h-8 text-indigo-400" /> SECTION 5: TARGET REGION
                       </h3>
                       <div className="grid grid-cols-2 gap-4">
                          {['US', 'UK', 'Canada', 'Asia', 'Australia'].map(reg => (
                            <button 
                              key={reg}
                              onClick={() => toggleRegion(reg as any)}
                              className={`p-10 rounded-2xl border text-center transition-all ${formData.targetRegions.includes(reg as any) ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5'}`}
                            >
                               <p className="text-2xl font-black italic tracking-tighter uppercase mb-2">{reg}</p>
                               <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{formData.targetRegions.includes(reg as any) ? 'Selected' : 'Click to add'}</p>
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="mt-12 flex justify-between">
                    {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-white/40 uppercase font-black tracking-widest text-[10px]">Back</Button>}
                    <Button 
                      className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase italic tracking-widest text-xs px-10 h-16 rounded-xl"
                      onClick={() => step < 5 ? setStep(step + 1) : handleCalculate()}
                    >
                      {step === 5 ? 'Analyze Results' : 'Continue'} <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <div className="flex justify-between items-end mb-16">
                  <div>
                     <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-4 text-shimmer">YOUR ANALYSIS.</h2>
                     <p className="text-white/40 uppercase font-black tracking-[0.3em] text-[10px]">Based on global international applicant benchmarks</p>
                  </div>
                  <Button variant="outline" onClick={() => setResults(null)} className="border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest px-8">Recalculate</Button>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  {results.map((res, i) => (
                    <motion.div 
                      key={res.schoolName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-3d p-12 border-white/5 flex flex-col justify-between group"
                    >
                       <div>
                          <div className="flex justify-between items-start mb-10">
                             <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic group-hover:text-indigo-400 transition-colors">{res.schoolName}</h3>
                                <Badge className="mt-2 bg-indigo-500/10 text-indigo-400 border-none font-black text-[9px] uppercase tracking-widest px-3">{res.region}</Badge>
                             </div>
                             <div className="text-right">
                                <p className="text-4xl font-black italic tracking-tighter text-emerald-400">{res.estimatedChance}%</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Est. Chance</p>
                             </div>
                          </div>

                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-12">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${res.estimatedChance}%` }}
                               className="h-full bg-emerald-500"
                             />
                          </div>

                          <div className="space-y-8">
                             <div>
                                <p className="text-[9px] font-black uppercase text-emerald-500/60 mb-4 tracking-widest">Strength Profile</p>
                                <div className="space-y-3">
                                   {res.pros.map((pro, idx) => (
                                      <div key={idx} className="flex gap-3 text-sm font-medium text-white/60">
                                         <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <Plus className="w-3 h-3 text-emerald-500" />
                                         </div>
                                         {pro}
                                      </div>
                                   ))}
                                </div>
                             </div>

                             {res.cons.length > 0 && (
                               <div>
                                  <p className="text-[9px] font-black uppercase text-rose-500/60 mb-4 tracking-widest">Growth Areas</p>
                                  <div className="space-y-3">
                                     {res.cons.map((con, idx) => (
                                        <div key={idx} className="flex gap-3 text-sm font-medium text-rose-400/60">
                                           <AlertCircle className="w-5 h-5 shrink-0" />
                                           {con}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                             )}

                             {res.recommendations.length > 0 && (
                               <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                                  <p className="text-[9px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Strategic Roadmap</p>
                                  <div className="space-y-4">
                                     {res.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-sm font-black italic tracking-tight uppercase">
                                           <ArrowRight className="w-4 h-4 text-indigo-400" />
                                           {rec}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>

               <div className="p-12 glass-3d border-yellow-500/10 bg-yellow-500/[0.02] text-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-500 mb-4">Disclaimer</p>
                  <p className="text-white/40 text-sm font-medium leading-relaxed max-w-3xl mx-auto italic">
                     Estimated chance based on historical data for international applicants. These calculations are probabilistic models and do not guarantee admission. Top 5 universities are hard-capped at 40% due to yield protection and extreme competition.
                  </p>
               </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
