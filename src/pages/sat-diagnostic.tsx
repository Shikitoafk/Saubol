import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Timer, 
  Sparkles, 
  Target, 
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateDiagnosticScore } from "@/lib/sat-logic";
import katex from "katex";

interface Question {
  id: string;
  section: 'Math' | 'RW';
  topic: string;
  passage?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  // --- READING & WRITING (10 Questions) ---
  {
    id: "rw1",
    section: "RW",
    topic: "Information & Ideas",
    difficulty: "Medium",
    passage: "In 2012, the Curiosity rover landed on Mars with a primary mission to determine if the planet ever had the environmental conditions to support microbial life. Over the years, the rover has discovered significant evidence of liquid water in Mars's past, including ancient streambeds and minerals that form only in wet environments. These findings suggest that Mars was once a far more hospitable world than the cold, dry desert it is today.",
    text: "Which of the following best states the main purpose of the passage?",
    options: [
      "To describe the specific minerals found by the Curiosity rover.",
      "To argue that Mars currently supports microbial life.",
      "To explain how Curiosity's discoveries support the idea of a hospitable ancient Mars.",
      "To detail the technological capabilities of the Curiosity rover."
    ],
    correctAnswer: 2
  },
  {
    id: "rw2",
    section: "RW",
    topic: "Craft & Structure",
    difficulty: "Easy",
    passage: "The novelist's latest work is characterized by its ___ prose, which avoids unnecessary ornamentation in favor of direct, punchy sentences that mirror the urgency of the plot.",
    text: "Which choice completes the text with the most logical and precise word or phrase?",
    options: ["florid", "spare", "convoluted", "pedantic"],
    correctAnswer: 1
  },
  {
    id: "rw3",
    section: "RW",
    topic: "Standard English Conventions",
    difficulty: "Medium",
    passage: "The team of researchers from three different universities ___ presented their groundbreaking findings at the international conference last October.",
    text: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["have", "has", "is", "were"],
    correctAnswer: 1
  },
  {
    id: "rw4",
    section: "RW",
    topic: "Information & Ideas",
    difficulty: "Hard",
    passage: "Recent studies of the 19th-century artist's journals reveal a profound preoccupation with the concept of 'liminality'—the state of being on a threshold. While critics have long focused on the vibrant colors of his landscapes, the journals suggest that the true subject of his work was the transition between light and shadow, representing the precarious balance of the human psyche.",
    text: "Based on the passage, which of the following would the artist most likely agree with?",
    options: [
      "Color is the most important element of any landscape painting.",
      "The journals of an artist are often more revealing than their finished works.",
      "Art should capture the moments of transition rather than static states.",
      "Landscape painting is inferior to psychological portraiture."
    ],
    correctAnswer: 2
  },
  {
    id: "rw5",
    section: "RW",
    topic: "Expression of Ideas",
    difficulty: "Medium",
    passage: "Astronomers have identified a new exoplanet, Gliese 1214 b, which is estimated to be about 2.7 times the size of Earth. ___ unlike Earth, Gliese 1214 b is thought to have a thick, steam-filled atmosphere and a surface composed primarily of water in a 'supercritical' state.",
    text: "Which choice completes the text with the most logical transition?",
    options: ["Consequently,", "Similarly,", "However,", "Furthermore,"],
    correctAnswer: 2
  },
  {
    id: "rw6",
    section: "RW",
    topic: "Standard English Conventions",
    difficulty: "Easy",
    passage: "Each of the participants in the study ___ required to sign a consent form before the first session began.",
    text: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["was", "were", "are", "have been"],
    correctAnswer: 0
  },
  {
    id: "rw7",
    section: "RW",
    topic: "Craft & Structure",
    difficulty: "Hard",
    passage: "Critics of the early 20th-century poet often dismissed her work as 'domestic' due to its focus on everyday household objects. However, a modern re-evaluation suggests that these objects serve as complex metaphors for the geopolitical tensions of the era, elevating the mundane to the status of profound political commentary.",
    text: "The passage implies that the early critics' view of the poet's work was:",
    options: ["insightful and nuanced.", "overly focused on political subtext.", "reductive and lacked depth.", "ahead of its time."],
    correctAnswer: 2
  },
  {
    id: "rw8",
    section: "RW",
    topic: "Information & Ideas",
    difficulty: "Medium",
    passage: "In a laboratory experiment, researchers found that plants exposed to moderate levels of white noise grew 15% faster than those in a silent environment. The noise appears to stimulate the opening of stomata, which are the small pores on leaves used for gas exchange, allowing for more efficient photosynthesis.",
    text: "Which finding, if true, would most directly support the researchers' hypothesis?",
    options: [
      "Plants in the silent environment had larger leaves than those in the noise environment.",
      "Plants exposed to very loud noise showed stunted growth patterns.",
      "Plants in the noise environment showed significantly higher CO2 uptake than the silent group.",
      "Different species of plants responded differently to the white noise."
    ],
    correctAnswer: 2
  },
  {
    id: "rw9",
    section: "RW",
    topic: "Expression of Ideas",
    difficulty: "Easy",
    passage: "The bridge was completed ahead of schedule. ___ the city was able to open the main thoroughfare to traffic before the holiday rush.",
    text: "Which choice completes the text with the most logical transition?",
    options: ["In contrast,", "As a result,", "Nevertheless,", "For example,"],
    correctAnswer: 1
  },
  {
    id: "rw10",
    section: "RW",
    topic: "Standard English Conventions",
    difficulty: "Medium",
    passage: "Neither the principal nor the teachers ___ able to convince the students to stay in the cafeteria during the fire drill.",
    text: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    options: ["was", "were", "is", "has been"],
    correctAnswer: 1
  },

  // --- MATH (10 Questions) ---
  {
    id: "m1",
    section: "Math",
    topic: "Algebra",
    difficulty: "Easy",
    text: "If $3x - 7 = 14$, what is the value of $x + 5$?",
    options: ["7", "12", "10", "15"],
    correctAnswer: 1
  },
  {
    id: "m2",
    section: "Math",
    topic: "Advanced Math",
    difficulty: "Medium",
    text: "If $f(x) = x^2 - 4x + 7$, what is the minimum value of the function $f$?",
    options: ["2", "3", "7", "-1"],
    correctAnswer: 1
  },
  {
    id: "m3",
    section: "Math",
    topic: "Problem Solving & Data Analysis",
    difficulty: "Easy",
    text: "A sample of 200 lightbulbs contains 6 defective ones. If a company orders 5,000 of these lightbulbs, how many would you expect to be defective?",
    options: ["120", "150", "300", "600"],
    correctAnswer: 1
  },
  {
    id: "m4",
    section: "Math",
    topic: "Geometry & Trigonometry",
    difficulty: "Hard",
    text: "In a circle with center $O$, the measure of central angle $\\angle AOB$ is $\\frac{\\pi}{3}$ radians. If the radius of the circle is 6, what is the length of arc $AB$?",
    options: ["$2\\pi$", "$\\pi$", "$3\\pi$", "$6\\pi$"],
    correctAnswer: 0
  },
  {
    id: "m5",
    section: "Math",
    topic: "Algebra",
    difficulty: "Medium",
    text: "The line $y = 2x + k$ passes through the point $(3, 10)$. What is the value of $k$?",
    options: ["4", "16", "7", "13"],
    correctAnswer: 0
  },
  {
    id: "m6",
    section: "Math",
    topic: "Advanced Math",
    difficulty: "Hard",
    text: "If $x^2 + y^2 = 25$ and $xy = 12$, what is the value of $(x+y)^2$?",
    options: ["37", "49", "61", "13"],
    correctAnswer: 1
  },
  {
    id: "m7",
    section: "Math",
    topic: "Geometry & Trigonometry",
    difficulty: "Medium",
    text: "A right triangle has a hypotenuse of length 13 and one leg of length 5. What is the area of the triangle?",
    options: ["65", "60", "30", "12"],
    correctAnswer: 2
  },
  {
    id: "m8",
    section: "Math",
    topic: "Algebra",
    difficulty: "Hard",
    text: "For what value of $a$ does the system of equations $ax + 2y = 8$ and $3x + y = 4$ have infinitely many solutions?",
    options: ["6", "3", "1.5", "No such value"],
    correctAnswer: 0
  },
  {
    id: "m9",
    section: "Math",
    topic: "Problem Solving & Data Analysis",
    difficulty: "Medium",
    text: "The mean of five numbers is 20. If a sixth number is added, the new mean becomes 22. What is the value of the sixth number?",
    options: ["22", "30", "32", "2"],
    correctAnswer: 2
  },
  {
    id: "m10",
    section: "Math",
    topic: "Advanced Math",
    difficulty: "Easy",
    text: "Which of the following is equivalent to $\\sqrt{48}$?",
    options: ["$4\\sqrt{3}$", "$3\\sqrt{4}$", "$16\\sqrt{3}$", "$2\\sqrt{12}$"],
    correctAnswer: 0
  }
];

export default function SATDiagnostic() {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(DIAGNOSTIC_QUESTIONS.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSelect = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (currentIdx < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmit();
    }
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const formattedAnswers = DIAGNOSTIC_QUESTIONS.map((q, i) => ({
      correct: answers[i] === q.correctAnswer,
      section: q.section,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    const scoreData = calculateDiagnosticScore(formattedAnswers);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('sat_diagnostics').insert({
          user_id: session.user.id,
          overall_score: scoreData.overallScore,
          math_score: scoreData.mathScore,
          rw_score: scoreData.rwScore,
          weak_topics: scoreData.weakTopics,
          strong_topics: scoreData.strongTopics
        });
      }
      setResults(scoreData);
    } catch (error) {
      console.error("Error saving diagnostic:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMath = (text: string) => {
    if (!text) return "";
    try {
      return text.replace(/\$\$([^$]+?)\$\$/gs, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: false }))
                 .replace(/\$([^$\n]{1,1000}?)\$/g, (_, m) => katex.renderToString(m, { throwOnError: false }));
    } catch { return text; }
  };

  if (results) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-3d p-16 max-w-4xl w-full text-center"
          >
            <div className="flex justify-center mb-10">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                <Target className="w-12 h-12 text-indigo-400" />
              </div>
            </div>
            <h2 className="text-5xl font-black tracking-tighter uppercase mb-4">Intelligence Analysis Complete.</h2>
            <p className="text-white/40 uppercase tracking-widest text-xs mb-12">Weighted Performance Evaluation</p>
            
            <div className="grid grid-cols-3 gap-8 mb-16">
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">Math Proficiency</p>
                <p className="text-4xl font-black">{results.mathScore}</p>
              </div>
              <div className="p-8 bg-indigo-600 rounded-3xl shadow-[0_20px_40px_rgba(79,70,229,0.3)]">
                <p className="text-[10px] font-black uppercase text-white/60 mb-2">Estimated SAT</p>
                <p className="text-6xl font-black">{results.overallScore}</p>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 mb-2">R&W Proficiency</p>
                <p className="text-4xl font-black">{results.rwScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 text-left mb-16">
               <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6">Top Sectors</h4>
                  <div className="space-y-4">
                    {results.strongTopics.map((t: string) => (
                      <div key={t} className="flex items-center gap-3 text-sm font-bold uppercase tracking-tight text-white/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t}
                      </div>
                    ))}
                  </div>
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6">Critical Weaknesses</h4>
                  <div className="space-y-4">
                    {results.weakTopics.map((t: string) => (
                      <div key={t} className="flex items-center gap-3 text-sm font-bold uppercase tracking-tight text-white/80">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> {t}
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <Button 
              onClick={() => navigate('/sat/study-plan')}
              className="w-full h-16 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Generate AI Study Path <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const q = DIAGNOSTIC_QUESTIONS[currentIdx];

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-10%] right-[-5%] opacity-20" />
        
        <div className="max-w-6xl mx-auto px-10 py-32 relative z-10">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Brain className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Full SAT Diagnostic</h2>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Question {currentIdx + 1} of {DIAGNOSTIC_QUESTIONS.length}</p>
              </div>
            </div>
            <div className="flex gap-4">
               <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'border-rose-500/20 text-rose-500' : q.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-500' : 'border-emerald-500/20 text-emerald-500'}`}>
                  {q.difficulty}
               </div>
               <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Timer className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black tabular-nums">ADAPTIVE MODE</span>
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
             {/* Question/Passage Column */}
             <div className="glass-3d p-10 flex flex-col gap-8">
                {q.passage && (
                  <div className="p-8 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-6 opacity-30">
                       <FileText className="w-4 h-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Context Passage</span>
                    </div>
                    <p className="text-lg leading-relaxed font-medium text-white/80 italic">
                      {q.passage}
                    </p>
                  </div>
                )}
                <div className="text-2xl font-black leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: renderMath(q.text) }} />
             </div>

             {/* Answers Column */}
             <div className="space-y-4">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-full p-8 text-left rounded-2xl border transition-all flex items-center justify-between group ${
                      answers[currentIdx] === i 
                      ? 'bg-white text-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg font-bold" dangerouslySetInnerHTML={{ __html: renderMath(opt) }} />
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[10px] font-black ${
                      answers[currentIdx] === i ? 'border-black' : 'border-white/10 group-hover:border-white/30'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  </button>
                ))}

                <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                  <Button 
                    variant="ghost" 
                    onClick={prev} 
                    disabled={currentIdx === 0}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    onClick={next}
                    disabled={answers[currentIdx] === -1 || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-12 h-16 font-black uppercase text-xs shadow-2xl"
                  >
                    {currentIdx === DIAGNOSTIC_QUESTIONS.length - 1 ? (isSubmitting ? "Scoring..." : "Complete Test") : "Next Question"} <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
             </div>
          </div>

          <div className="mt-12">
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIdx + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
                />
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
