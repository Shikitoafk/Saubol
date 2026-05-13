import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  Zap, 
  Trophy,
  History,
  Brain,
  ChevronRight
} from "lucide-react";
import TopicSidebar from "@/components/TopicSidebar";
import LessonViewer from "@/components/LessonViewer";
import PracticeQuestion from "@/components/PracticeQuestion";
import { SAT_LESSONS } from "@/data/sat-lessons";
import { SAT_QUESTIONS_BANK } from "@/data/sat-questions-bank";

export default function SATLearn() {
  const [activeTopic, setActiveTopic] = useState("Linear Equations");
  const [phase, setPhase] = useState<"lesson" | "practice">("lesson");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [topicProgress, setTopicProgress] = useState<Record<string, number>>({
    "Linear Equations": 65,
    "Systems of Equations": 45,
    "Inequalities": 0,
    "Central Ideas": 30,
    "Transitions": 0
  });

  const currentLesson = useMemo(() => 
    SAT_LESSONS.find(l => l.topic === activeTopic) || SAT_LESSONS[0], 
  [activeTopic]);

  const currentQuestions = useMemo(() => 
    SAT_QUESTIONS_BANK[activeTopic] || [], 
  [activeTopic]);

  const categories = [
    {
      name: "Math - Algebra",
      icon: Calculator,
      topics: [
        { name: "Linear Equations", progress: topicProgress["Linear Equations"], isLocked: false, isCompleted: topicProgress["Linear Equations"] === 100 },
        { name: "Systems of Equations", progress: topicProgress["Systems of Equations"], isLocked: false, isCompleted: topicProgress["Systems of Equations"] === 100 },
        { name: "Inequalities", progress: topicProgress["Inequalities"], isLocked: topicProgress["Systems of Equations"] < 70, isCompleted: false },
      ]
    },
    {
      name: "Reading & Writing",
      icon: FileText,
      topics: [
        { name: "Central Ideas", progress: topicProgress["Central Ideas"], isLocked: false, isCompleted: false },
        { name: "Transitions", progress: topicProgress["Transitions"], isLocked: false, isCompleted: false },
      ]
    }
  ];

  const handleTopicSelect = (topic: string) => {
    setActiveTopic(topic);
    setPhase("lesson");
    setPracticeIndex(0);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setTopicProgress(prev => ({
        ...prev,
        [activeTopic]: Math.min(100, prev[activeTopic] + 5)
      }));
    }
  };

  const handleNext = () => {
    if (practiceIndex < currentQuestions.length - 1) {
      setPracticeIndex(prev => prev + 1);
    } else {
      setPhase("lesson");
      setPracticeIndex(0);
    }
  };

  return (
    <Layout>
      <div className="flex h-screen bg-black overflow-hidden pt-16">
        <TopicSidebar 
          categories={categories} 
          activeTopic={activeTopic} 
          onSelectTopic={handleTopicSelect} 
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="bg-vignette fixed inset-0 pointer-events-none" />
          
          {/* Top Bar Mastery Tracking */}
          <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-12 py-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Active Topic</p>
                  <p className="text-sm font-black uppercase text-indigo-400">{activeTopic}</p>
               </div>
               <div className="w-px h-6 bg-white/10" />
               <div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Current Phase</p>
                  <p className="text-sm font-black uppercase text-white/60">{phase === 'lesson' ? 'Learning' : 'Practicing'}</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Topic Mastery</p>
                  <p className="text-sm font-black text-emerald-400">{topicProgress[activeTopic]}%</p>
               </div>
               <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${topicProgress[activeTopic]}%` }}
                    className="h-full bg-emerald-500"
                  />
               </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopic}-${phase}-${practiceIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {phase === "lesson" ? (
                <LessonViewer 
                  lesson={currentLesson} 
                  onStartPractice={() => setPhase("practice")} 
                />
              ) : (
                <PracticeQuestion 
                  question={currentQuestions[practiceIndex]} 
                  onAnswer={handleAnswer}
                  onNext={handleNext}
                  currentIndex={practiceIndex}
                  total={currentQuestions.length}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Fixed Bottom Mastery Lock Alert */}
          {topicProgress[activeTopic] < 70 && activeTopic === "Systems of Equations" && (
            <div className="fixed bottom-10 right-10 z-[60] bg-indigo-600/10 backdrop-blur-xl border border-indigo-500/20 p-6 rounded-2xl max-w-sm shadow-2xl animate-in slide-in-from-bottom-5">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                     <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Mastery Required</p>
                     <p className="text-xs font-medium text-white/60 leading-relaxed">Reach <span className="text-white">70% mastery</span> in Systems of Equations to unlock Inequalities challenges.</p>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
