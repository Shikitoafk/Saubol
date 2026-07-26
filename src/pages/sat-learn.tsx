import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Brain,
  History,
  Lock,
  ArrowRight
} from "lucide-react";
import TopicSidebar, { Category } from "@/components/TopicSidebar";
import TopicVideoPage from "@/components/TopicVideoPage";
import PracticeSession from "@/components/PracticeSession";
import PracticeComplete from "@/components/PracticeComplete";
import { SAT_VIDEO_LIBRARY } from "@/data/sat-video-library";
import { fetchPracticeQuestions, SATQuestion } from "@/lib/sat-questions-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Phase = "video" | "practice" | "complete";

export default function SATLearn() {
  const [activeTopicId, setActiveTopicId] = useState("Algebra");
  const [phase, setPhase] = useState<Phase>("video");
  const [masteryData, setMasteryData] = useState<Record<string, number>>({
    "Algebra": 0,
    "Advanced Math": 0,
    "Geometry": 0,
    "Statistics": 0,
    "Reading & Writing": 0
  });
  const [currentQuestions, setCurrentQuestions] = useState<SATQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: progressRows } = await supabase
          .from('sat_progress')
          .select('*')
          .eq('user_id', session.user.id);

        if (progressRows) {
          const loadedMastery: Record<string, number> = {
            "Algebra": 0,
            "Advanced Math": 0,
            "Geometry": 0,
            "Statistics": 0,
            "Reading & Writing": 0
          };
          progressRows.forEach(row => {
            const topicKey = Object.keys(loadedMastery).find(
              key => row.subtopic?.toLowerCase() === key.toLowerCase()
            );
            if (topicKey) {
              loadedMastery[topicKey] = row.mastery_percent || 0;
            }
          });
          setMasteryData(loadedMastery);
        }
      } catch (err) {
        console.error("Failed to fetch SAT mastery progress:", err);
      }
    };

    fetchProgress();
  }, [activeTopicId, phase]);

  const categories: Category[] = useMemo(() => [
    {
      name: "Math Domains",
      icon: Calculator,
      topics: [
        { id: "Algebra", name: "Algebra", progress: masteryData["Algebra"] || 0, isLocked: false, isCompleted: (masteryData["Algebra"] || 0) >= 100 },
        { id: "Advanced Math", name: "Advanced Math", progress: masteryData["Advanced Math"] || 0, isLocked: false, isCompleted: (masteryData["Advanced Math"] || 0) >= 100 },
        { id: "Geometry", name: "Geometry", progress: masteryData["Geometry"] || 0, isLocked: false, isCompleted: (masteryData["Geometry"] || 0) >= 100 },
        { id: "Statistics", name: "Statistics", progress: masteryData["Statistics"] || 0, isLocked: false, isCompleted: (masteryData["Statistics"] || 0) >= 100 },
      ]
    },
    {
      name: "Reading & Writing Domains",
      icon: FileText,
      topics: [
        { id: "Reading & Writing", name: "Reading & Writing", progress: masteryData["Reading & Writing"] || 0, isLocked: false, isCompleted: (masteryData["Reading & Writing"] || 0) >= 100 },
      ]
    }
  ], [masteryData]);

  const currentVideo = useMemo(() => {
    const videoMapping: Record<string, { category: "math" | "reading_writing"; key: string }> = {
      "Algebra": { category: "math", key: "linear_equations" },
      "Advanced Math": { category: "math", key: "quadratic" },
      "Geometry": { category: "math", key: "geometry" },
      "Statistics": { category: "math", key: "statistics" },
      "Reading & Writing": { category: "reading_writing", key: "transitions" }
    };
    const mapped = videoMapping[activeTopicId];
    if (mapped) {
      return SAT_VIDEO_LIBRARY[mapped.category][mapped.key];
    }
    return null;
  }, [activeTopicId]);

  // Fetch questions from Supabase when active topic changes
  useEffect(() => {
    const loadTopicQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        const section: "RW" | "Math" = activeTopicId === "Reading & Writing" ? "RW" : "Math";
        const fetched = await fetchPracticeQuestions(section, {
          subtopic: activeTopicId,
          limit: 15,
        });
        setCurrentQuestions(fetched);
      } catch (err: any) {
        console.error("Failed to load topic questions:", err);
        setQuestionsError(err?.message || "Failed to load questions.");
        setCurrentQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };
    loadTopicQuestions();
  }, [activeTopicId]);

  const handleTopicSelect = (id: string) => {
    setActiveTopicId(id);
    setPhase("video");
  };

  const handleCompletePractice = (score: number) => {
    const percentage = Math.round((score / currentQuestions.length) * 100);
    setMasteryData(prev => ({
      ...prev,
      [activeTopicId]: Math.max(prev[activeTopicId], percentage)
    }));
    setPhase("complete");
  };

  const handleNextTopic = () => {
    let found = false;
    for (const cat of categories) {
      for (const topic of cat.topics) {
        if (found) {
          handleTopicSelect(topic.id);
          return;
        }
        if (topic.id === activeTopicId) found = true;
      }
    }
    setPhase("video");
  };

  return (
    <Layout>
      <div className="flex h-screen bg-black overflow-hidden pt-16">
        <TopicSidebar 
          categories={categories} 
          activeTopicId={activeTopicId} 
          onSelectTopic={handleTopicSelect} 
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-vignette">
          <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-12 py-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span>SAT Learn</span>
                  <span className="opacity-40">/</span>
                  <span className="text-white/75">{categories.find(c => c.topics.some(t => t.id === activeTopicId))?.name}</span>
               </div>
               <div className="w-px h-6 bg-white/10" />
               <div className="flex items-center gap-3">
                  <p className="text-sm font-black uppercase italic tracking-tighter">{currentVideo?.title}</p>
                  <Badge className="bg-white/5 text-white/60 border-none font-black text-[9px] uppercase px-3 py-1">{phase}</Badge>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Topic Mastery</p>
                  <p className="text-sm font-black text-white">{masteryData[activeTopicId]}%</p>
               </div>
               <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${masteryData[activeTopicId]}%` }}
                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  />
               </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopicId}-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pb-32"
            >
              {phase === "video" && currentVideo && (
                <TopicVideoPage 
                  video={currentVideo} 
                  onStartPractice={() => setPhase("practice")} 
                />
              )}

              {phase === "practice" && (
                <PracticeSession 
                  topic={currentVideo?.title || "Practice Session"}
                  questions={currentQuestions}
                  onComplete={handleCompletePractice}
                />
              )}

              {phase === "complete" && (
                <PracticeComplete 
                  topic={currentVideo?.title || "Session"}
                  score={Math.round((masteryData[activeTopicId] / 100) * currentQuestions.length)}
                  total={currentQuestions.length}
                  onRetry={() => setPhase("practice")}
                  onNext={handleNextTopic}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </Layout>
  );
}
