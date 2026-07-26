import { useState, useEffect } from "react";
import {
  BookOpen,
  Headphones,
  PenTool,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  ClipboardList,
  GraduationCap,
  Loader2,
  AlertCircle,
  Brain,
  Sparkles,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  getCambridgeBooks,
  getCambridgeTests,
  getPredictionTests,
  type TestRegistryEntry,
} from "@/data/test-registry";

type Skill = "reading" | "listening" | "writing" | "speaking";
type TestType = "predictions" | "cambridge";
type Difficulty = "Easy" | "Medium" | "Hard";

interface TestItem {
  id: string;
  name: string;
  topic: string;
  difficulty: Difficulty;
  questions: number;
  time: string;
  slug: string;
}

function registryToTestItem(entry: TestRegistryEntry): TestItem {
  return {
    id: entry.slug,
    name: entry.title,
    topic: entry.topic,
    difficulty: entry.difficulty,
    questions: entry.questions,
    time: `${entry.timeMinutes} min`,
    slug: entry.slug,
  };
}

const skills: { id: Skill; icon: typeof BookOpen; title: string; description: string; color: string; bg: string }[] = [
  { id: "reading", icon: BookOpen, title: "READING", description: "Learn skimming, scanning and detail techniques", color: "text-blue-400", bg: "bg-blue-400/5" },
  { id: "listening", icon: Headphones, title: "LISTENING", description: "Train your ear with section-by-section strategies", color: "text-emerald-400", bg: "bg-emerald-400/5" },
  { id: "writing", icon: PenTool, title: "WRITING", description: "Master Task 1 & Task 2 with templates and examples", color: "text-indigo-400", bg: "bg-indigo-400/5" },
  { id: "speaking", icon: MessageCircle, title: "SPEAKING", description: "Prepare for all 3 parts with sample answers", color: "text-amber-400", bg: "bg-amber-400/5" },
];

const testTypes: { id: TestType; icon: typeof GraduationCap; title: string; description: string }[] = [
  { id: "predictions", icon: GraduationCap, title: "PREDICTION TESTS", description: "Based on recent exam patterns" },
  { id: "cambridge", icon: GraduationCap, title: "CAMBRIDGE TESTS", description: "Official Cambridge IELTS books 1–19" },
];

const CAMBRIDGE_ACADEMIC_BOOKS = getCambridgeBooks();

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

const IELTSPrep = () => {
  const nav = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedType, setSelectedType] = useState<TestType | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const level = selectedType ? 3 : selectedSkill ? 2 : 1;

  const goBack = () => {
    if (selectedType) { setSelectedType(null); setTests([]); }
    else if (selectedSkill) { setSelectedSkill(null); }
  };

  useEffect(() => {
    if (!selectedSkill || !selectedType) return;
    setLoading(true);
    setTimeout(() => {
      if (selectedType === "cambridge") {
        setTests([]);
      } else if (selectedSkill) {
        setTests(getPredictionTests(selectedSkill).map(registryToTestItem));
      } else {
        setTests([]);
      }
      setLoading(false);
    }, 400);
  }, [selectedSkill, selectedType]);

  const skillLabel = selectedSkill ? skills.find((s) => s.id === selectedSkill)?.title : "";
  const typeLabel = selectedType ? testTypes.find((t) => t.id === selectedType)?.title : "";

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 relative overflow-hidden font-sans">
        {/* Deep Ambient Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }} />
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-[1400px] mx-auto px-10 py-32 relative z-10"
        >
          {/* Header Section */}
          <motion.div variants={item} className="mb-24">
            <div className="flex items-center gap-3 mb-8 opacity-60">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
              <span className="text-[11px] font-black tracking-[0.5em] uppercase text-indigo-400">Tactical Intelligence Hub</span>
            </div>
            <h1 className="text-8xl md:text-[140px] font-black tracking-tighter text-shimmer leading-[0.8] mb-12 uppercase italic">
              IELTS <br /> MASTERY.
            </h1>
            <p className="text-2xl text-ink-muted font-medium max-w-2xl leading-tight">
              Открой доступ к передовым методикам подготовки. Мы объединили официальные материалы Cambridge и AI-технологии для твоего успеха.
            </p>
          </motion.div>

          {/* Navigation & Status */}
          <motion.div variants={item} className="mb-16 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-line pb-10">
            <Breadcrumb className="opacity-60">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => { setSelectedSkill(null); setSelectedType(null); }} className="cursor-pointer font-black uppercase tracking-[0.2em] text-[10px] hover:text-ink transition-colors">IELTS HUB</BreadcrumbLink>
                </BreadcrumbItem>
                {selectedSkill && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => setSelectedType(null)} className="cursor-pointer font-black uppercase tracking-[0.2em] text-[10px] hover:text-ink transition-colors">{skillLabel}</BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                {selectedType && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-400">{typeLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            
            {level > 1 && (
              <Button variant="ghost" onClick={goBack} className="h-14 px-8 rounded-xl border border-line text-[10px] font-black uppercase tracking-widest text-ink-subtle hover:text-ink hover:bg-surface group">
                <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Selection
              </Button>
            )}
          </motion.div>

          {/* Interactive Selection Grid */}
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {level === 1 && (
                <motion.div 
                  key="level1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {skills.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSkill(s.id)}
                      className="glass-3d p-12 text-left group hover:scale-105 transition-all border-line hover:border-line-strong relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 ${s.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center border border-line mb-12 group-hover:border-line-strong transition-all`}>
                        <s.icon className={`w-8 h-8 ${s.color}`} />
                      </div>
                      <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">{s.title}</h3>
                      <p className="text-xs font-bold text-ink-subtle uppercase tracking-widest leading-relaxed mb-12 group-hover:text-ink-muted transition-colors">{s.description}</p>
                      <div className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ${s.color}`}>
                        Select Module <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {level === 2 && (
                <motion.div 
                  key="level2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid gap-8 sm:grid-cols-2 max-w-5xl"
                >
                  {testTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className="glass-3d p-16 text-left group hover:scale-105 transition-all border-line hover:border-line-strong"
                    >
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 mb-12 group-hover:bg-indigo-500/20 transition-all">
                        <t.icon className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h3 className="text-5xl font-black mb-6 tracking-tighter uppercase italic">{t.title}</h3>
                      <p className="text-sm font-bold text-ink-subtle uppercase tracking-widest mb-12 group-hover:text-ink-muted transition-colors">{t.description}</p>
                      <div className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-ink">
                        Access Material <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {level === 3 && (
                <motion.div 
                  key="level3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-16"
                >
                   {loading ? (
                     <div className="flex flex-col items-center py-48">
                        <Loader2 className="w-20 h-20 animate-spin mb-10 text-indigo-500/20" />
                        <span className="text-xs font-black uppercase tracking-[0.8em] text-[#222] animate-pulse">Establishing Secure Uplink</span>
                     </div>
                   ) : (
                     <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {selectedType === 'cambridge' ? (
                          CAMBRIDGE_ACADEMIC_BOOKS.map(book => {
                            const bookTests = selectedSkill
                              ? getCambridgeTests(book, selectedSkill)
                              : [];
                            if (bookTests.length === 0) return null;
                            return (
                            <div key={book} className="glass-3d p-10 border-line hover:border-line-strong transition-all group">
                               <div className="flex justify-between items-center mb-10">
                                  <Badge className="bg-indigo-600/10 text-indigo-400 border-none font-black text-[9px] uppercase tracking-widest">Official Vol.</Badge>
                                  <div className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-[10px] font-black text-[#222] group-hover:text-ink transition-colors">{book}</div>
                               </div>
                               <h3 className="text-2xl font-black mb-10 tracking-tight italic uppercase">CAMBRIDGE {book}</h3>
                               <div className="flex flex-col gap-4">
                                  {bookTests.map((test) => (
                                    <Button key={test.slug} variant="ghost" className="h-14 justify-between text-[11px] font-black uppercase tracking-[0.2em] text-ink-subtle hover:text-ink border border-line hover:border-line rounded-xl transition-all hover:bg-surface" onClick={() => nav(`/ielts/test/${test.slug}`)}>
                                      Test Module {test.testNum} <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                                    </Button>
                                  ))}
                               </div>
                            </div>
                            );
                          })
                        ) : (
                          tests.map((t, i) => (
                            <div key={t.id} className="glass-3d p-10 hover:border-line-strong transition-all group relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Target className="w-24 h-24 rotate-12" />
                               </div>
                               <div className="flex justify-between items-start mb-12">
                                  <span className="text-[11px] font-black text-[#222] group-hover:text-ink uppercase tracking-widest transition-colors">Session 0{i+1}</span>
                                  <Badge className={`border-none font-black text-[9px] uppercase tracking-widest ${t.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{t.difficulty}</Badge>
                               </div>
                               <h3 className="text-2xl font-black mb-3 tracking-tighter group-hover:text-shimmer transition-all uppercase italic">{t.name}</h3>
                               <p className="text-[10px] font-black text-ink-subtle uppercase tracking-[0.2em] mb-12">{t.topic}</p>
                               <div className="flex items-center gap-8 mb-12 text-[10px] font-black text-[#222] uppercase tracking-widest">
                                  <span className="flex items-center gap-2 group-hover:text-blue-400 transition-colors"><Clock className="w-4 h-4" /> {t.time}</span>
                                  <span className="flex items-center gap-2 group-hover:text-indigo-400 transition-colors"><HelpCircle className="w-4 h-4" /> {t.questions} Q</span>
                               </div>
                               <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-[11px] tracking-widest h-16 shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105" onClick={() => nav(`/ielts/test/${t.slug}`)}>Initialize Test</Button>
                            </div>
                          ))
                        )}
                     </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Premium AI Integration Footer */}
          <motion.div variants={item} className="mt-48 glass-3d p-20 flex flex-col lg:flex-row items-center justify-between gap-16 bg-gradient-to-br from-indigo-600/[0.07] to-transparent border-indigo-500/20 relative overflow-hidden group">
             <div className="absolute inset-0 bg-sphere opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
             <div className="flex items-center gap-10 relative z-10">
                <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center border border-indigo-500/20 shadow-[0_20px_50px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-700">
                   <Brain className="w-12 h-12 text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-5xl font-black tracking-tighter mb-4 uppercase italic">Neural Writing Check.</h3>
                   <p className="text-sm font-black text-ink-muted uppercase tracking-[0.3em]">Advanced IELTS Band 9.0 Evaluation Engine</p>
                </div>
             </div>
             <Button onClick={() => nav("/ielts/writing-checker")} className="bg-white text-black hover:bg-gray-100 rounded-[2rem] px-16 h-24 font-black uppercase text-xl shadow-[0_30px_60px_rgba(255,255,255,0.15)] transition-all hover:scale-110 active:scale-95 relative z-10 group/btn">
               Launch Analyzer <Zap className="ml-4 w-6 h-6 text-indigo-600 group-hover/btn:animate-pulse" />
             </Button>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default IELTSPrep;
