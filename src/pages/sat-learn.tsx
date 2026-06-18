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
  const [activeTopicId, setActiveTopicId] = useState("linear_equations");
  const [phase, setPhase] = useState<Phase>("video");
  const [masteryData, setMasteryData] = useState<Record<string, number>>({
    linear_equations: 0,
    systems_equations: 0,
    quadratic: 0,
    inequalities: 0,
    transitions: 0,
    central_ideas: 0,
    grammar_boundaries: 0
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
            linear_equations: 0,
            systems_equations: 0,
            quadratic: 0,
            inequalities: 0,
            transitions: 0,
            central_ideas: 0,
            grammar_boundaries: 0
          };
          progressRows.forEach(row => {
            if (row.subtopic && row.subtopic in loadedMastery) {
              loadedMastery[row.subtopic] = row.mastery_percent || 0;
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
      name: "Math - Algebra",
      icon: Calculator,
      topics: [
        { id: "linear_equations", name: "Linear Equations", progress: masteryData.linear_equations, isLocked: false, isCompleted: masteryData.linear_equations >= 100 },
        { id: "systems_equations", name: "Systems of Equations", progress: masteryData.systems_equations, isLocked: false, isCompleted: masteryData.systems_equations >= 100 },
        { id: "quadratic", name: "Quadratic Equations", progress: masteryData.quadratic, isLocked: false, isCompleted: false },
        { id: "inequalities", name: "Linear Inequalities", progress: masteryData.inequalities, isLocked: false, isCompleted: false },
      ]
    },
    {
      name: "Reading & Writing",
      icon: FileText,
      topics: [
        { id: "central_ideas", name: "Central Ideas", progress: masteryData.central_ideas, isLocked: false, isCompleted: masteryData.central_ideas >= 100 },
        { id: "transitions", name: "Transitions", progress: masteryData.transitions, isLocked: false, isCompleted: false },
        { id: "grammar_boundaries", name: "Grammar & Punctuation", progress: masteryData.grammar_boundaries, isLocked: false, isCompleted: false },
      ]
    }
  ], [masteryData]);

  const currentVideo = useMemo(() => {
    return SAT_VIDEO_LIBRARY.math[activeTopicId] || SAT_VIDEO_LIBRARY.reading_writing[activeTopicId];
  }, [activeTopicId]);

  // Fetch questions from Supabase when active topic changes
  useEffect(() => {
    const loadTopicQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        // Determine section from topic ID
        const mathTopics = ["linear_equations", "systems_equations", "quadratic", "inequalities"];
        const section: "RW" | "Math" = mathTopics.includes(activeTopicId) ? "Math" : "RW";
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
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                  <span>SAT Learn</span>
                  <span className="opacity-40">/</span>
                  <span className="text-white/60">{categories.find(c => c.topics.some(t => t.id === activeTopicId))?.name}</span>
               </div>
               <div className="w-px h-6 bg-white/10" />
               <div className="flex items-center gap-3">
                  <p className="text-sm font-black uppercase italic tracking-tighter">{currentVideo?.title}</p>
                  <Badge className="bg-white/5 text-white/40 border-none font-black text-[9px] uppercase px-3 py-1">{phase}</Badge>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Topic Mastery</p>
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
