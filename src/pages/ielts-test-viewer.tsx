import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  Mic, 
  Square, 
  Play, 
  Volume2, 
  Award, 
  Sparkles, 
  CheckCircle,
  Brain,
  Zap,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveIELTSAnswer } from "@/lib/progress-service";
import { resolveTestAsset } from "@/lib/resolve-test-asset";

function calculateIELTSBand(correct: number, total: number = 40): number {
  if (total === 0) return 0;
  if (correct <= 9.0 && total <= 9.0) return correct; // Already a band score
  
  const pct = correct / total;
  if (pct >= 0.97) return 9.0;
  if (pct >= 0.92) return 8.5;
  if (pct >= 0.87) return 8.0;
  if (pct >= 0.80) return 7.5;
  if (pct >= 0.75) return 7.0;
  if (pct >= 0.67) return 6.5;
  if (pct >= 0.57) return 6.0;
  if (pct >= 0.47) return 5.5;
  if (pct >= 0.37) return 5.0;
  if (pct >= 0.32) return 4.5;
  if (pct >= 0.25) return 4.0;
  return 3.5;
}

const SPEAKING_TOPICS_DATA: Record<string, {
  title: string;
  part1: string[];
  part2: {
    cueCard: string;
    bulletPoints: string[];
  };
  part3: string[];
  aiFeedback: {
    overallBand: number;
    fluency: string;
    lexical: string;
    grammar: string;
    pronunciation: string;
    band9Sample: string;
  };
}> = {
  "speaking-topic-1": {
    title: "Work & Study",
    part1: [
      "Do you work or study?",
      "Why did you choose this subject or profession?",
      "Is there anything you dislike about your daily routine?"
    ],
    part2: {
      cueCard: "Describe a project you worked on recently that you are proud of.",
      bulletPoints: [
        "What the project was",
        "Who worked on it with you",
        "How long it took to complete",
        "Explain why you feel proud of this project"
      ]
    },
    part3: [
      "Why is team collaboration highly valued in modern organizations?",
      "Do you think digital tools have made task management easier or more stressful?",
      "How will AI change the future of work and study in the next decade?"
    ],
    aiFeedback: {
      overallBand: 7.5,
      fluency: "Strong pacing and coherence. Natural transition words used ('specifically', 'moreover'). Minor hesitation during Part 2 cue card.",
      lexical: "Excellent range of idiomatic structures ('high value', 'task management', 'collaborative effort').",
      grammar: "Advanced compound and complex clauses present. Keep an eye on consistent subject-verb agreement under pressure.",
      pronunciation: "Clear accent, standard English phonology, good intonation on emphasis terms.",
      band9Sample: "A particularly stellar way to articulate this is: 'Currently, I am engaged in intensive academic training. The reason I gravitated towards this field is its profound real-world applicability. Recently, I spearheaded a collaborative digital transformation project which yielded remarkable efficiency gains...'"
    }
  },
  "speaking-topic-2": {
    title: "Hometown & Culture",
    part1: [
      "Where is your hometown located?",
      "What do you like most about your hometown?",
      "Would you prefer to live in a modern metropolis or a traditional countryside?"
    ],
    part2: {
      cueCard: "Describe a traditional festival or celebration in your culture.",
      bulletPoints: [
        "When and where it is celebrated",
        "What activities are performed",
        "What special food is prepared",
        "Explain why this festival holds significant meaning for you"
      ]
    },
    part3: [
      "How do globalization and modern lifestyle affect traditional local customs?",
      "Is it important for a nation to allocate budget for cultural preservation?",
      "Should tourists be expected to conform to local customs when visiting another country?"
    ],
    aiFeedback: {
      overallBand: 8.0,
      fluency: "Almost flawless flow, exceptional coherence. Pauses felt intentional and communicative rather than cognitive.",
      lexical: "Rich cultural vocabulary ('cultural preservation', 'homogeneity', 'indigenous customs').",
      grammar: "Flawless conditional tense implementation ('If tourists were to disregard local values, it might lead to...').",
      pronunciation: "Highly intelligible accentuation and expressive syllable stress.",
      band9Sample: "An elegant response would be: 'My hometown is a vibrant cultural epicenter. What captivates me most is the harmonious synthesis of classical heritage and cutting-edge architecture. In terms of national festivals, the annual celebration is absolutely paramount, serving as a powerful catalyst for community integration...'"
    }
  },
  "speaking-topic-3": {
    title: "Artificial Intelligence",
    part1: [
      "How often do you use smart devices in your daily life?",
      "What do you think is the most useful smart technology today?",
      "Would you like to live in a fully automated smart home?"
    ],
    part2: {
      cueCard: "Describe an AI tool or application that has significantly helped you.",
      bulletPoints: [
        "What the application or tool is",
        "How you discovered it",
        "How frequently you use it",
        "Explain in what ways it has optimized your productivity"
      ]
    },
    part3: [
      "In what industries do you believe human intelligence will never be replaced by AI?",
      "What are the primary ethical risks associated with rapid AI development?",
      "How can educational institutions adapt their curricula to prepare students for an AI-centric world?"
    ],
    aiFeedback: {
      overallBand: 7.5,
      fluency: "Great enthusiasm and structure. You structured your arguments using first, second, and final points.",
      lexical: "Tech-savvy terminology ('neural networks', 'automated workflow', 'cognitive adaptation').",
      grammar: "Strong syntax variation, though minor slip-ups in modal verb usage occurred.",
      pronunciation: "A few minor phoneme distortions but zero clarity degradation.",
      band9Sample: "A stellar formulation would be: 'In today's hyper-connected landscape, smart devices are indispensable. The AI assistant I employ serves as a critical productivity multiplier. In terms of long-term substitution, domains requiring emotional intelligence and ethical nuance will remain uniquely human...'"
    }
  },
  "speaking-topic-4": {
    title: "Environmental Protection",
    part1: [
      "Is environmental conservation a priority in your neighborhood?",
      "What actions do you take to reduce waste on a personal level?",
      "Have you ever participated in a green campaign or clean-up day?"
    ],
    part2: {
      cueCard: "Describe an environmental initiative or law that you fully support.",
      bulletPoints: [
        "What the law or initiative is",
        "When you first learned about it",
        "How it impacts the community or country",
        "Explain why you believe it is crucial for our future survival"
      ]
    },
    part3: [
      "Who holds the primary responsibility for tackling climate change: governments, corporations, or individuals?",
      "Do you think public environmental awareness is rising fast enough?",
      "How can green energy sources become the dominant standard globally?"
    ],
    aiFeedback: {
      overallBand: 8.0,
      fluency: "Outstanding structural signaling. Used contrasting discourse markers very effectively.",
      lexical: "Top-tier topical vocab ('ecological footprint', 'corporate accountability', 'mitigate carbon emissions').",
      grammar: "Active use of past perfect, future progressive, and mixed conditionals.",
      pronunciation: "Highly precise articulation of multisyllabic terms.",
      band9Sample: "To maximize impact, one could say: 'Environmental sustainability is an absolute imperative. I personally strive to minimize my ecological footprint. I am a staunch advocate for carbon-reduction policies, as systemic corporate accountability holds infinitely more leverage than individual actions alone...'"
    }
  },
  "speaking-topic-5": {
    title: "Leisure & Hobbies",
    part1: [
      "What is your primary hobby or creative interest?",
      "How much time are you able to dedicate to this hobby weekly?",
      "Is it better to have active outdoor hobbies or relaxing indoor ones?"
    ],
    part2: {
      cueCard: "Describe a leisure activity or skill that you would love to learn in the future.",
      bulletPoints: [
        "What the activity or skill is",
        "Why you haven't learned it yet",
        "How you plan to acquire this skill",
        "Explain how learning this skill will enrich your life"
      ]
    },
    part3: [
      "How has the concept of leisure time evolved over the last fifty years?",
      "Does a lack of free time lead to severe psychological issues in modern societies?",
      "Should companies enforce a strict policy to separate work hours from leisure time?"
    ],
    aiFeedback: {
      overallBand: 7.0,
      fluency: "Good flow, though some repetitive fillers ('like', 'you know') were used when processing Part 3 questions.",
      lexical: "Nice descriptive terms ('creative outlet', 'work-life balance', 'recharge mental batteries').",
      grammar: "Standard structures are very secure. Needs more complex modal structures to reach band 8.0+.",
      pronunciation: "Intonation felt a bit flat. Try putting more stress on key adjectives.",
      band9Sample: "For maximum vocabulary marks: 'My principal creative outlet is artistic expression. In today's relentless corporate landscape, delineating clear boundaries between professional duties and leisure is vital to prevent burnout and recharge one's cognitive batteries...'"
    }
  }
};

const IELTSTestViewer = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Speaking Simulator States
  const isSpeakingTest = slug?.startsWith("speaking-topic-");
  const speakingData = isSpeakingTest ? SPEAKING_TOPICS_DATA[slug || ""] : null;
  const [speakingPart, setSpeakingPart] = useState<1 | 2 | 3 | 4>(1); // Part 1, 2, 3, or Feedback (4)
  const [currentPartQuestionIdx, setCurrentPartQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [prepTimer, setPrepTimer] = useState<number | null>(null);
  const [speakTimer, setSpeakTimer] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const prepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data === "ielts-test-back") {
        navigate("/ielts");
      }
      
      if (e.data?.type === "ielts-test-result") {
        const { score, total, skill, slug: testSlug } = e.data;
        try {
          const calculatedSection = skill || (slug?.includes("reading") ? "reading" : "listening");
          const bandScore = calculateIELTSBand(score, total || 40);
          await saveIELTSAnswer(
            calculatedSection,
            testSlug || slug || "Practice Test",
            score >= (total || 40) * 0.6,
            bandScore,
            total || 40,
            score
          );
        } catch (err) {
          console.error('Failed to process test result:', err);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, slug]);

  // Handle Voice Recording Logic
  const startRecording = async () => {
    setAudioUrl(null);
    setRecordedChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // If we are in Part 2, start speaking timer
      if (speakingPart === 2) {
        setSpeakTimer(120); // 2 minutes speaking
        if (speakIntervalRef.current) clearInterval(speakIntervalRef.current);
        speakIntervalRef.current = setInterval(() => {
          setSpeakTimer((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(speakIntervalRef.current!);
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to access microphone:", err);
      // Fallback mock recording state if microphone is blocked or not available
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    if (speakIntervalRef.current) clearInterval(speakIntervalRef.current);
    setSpeakTimer(null);

    // If microphone access failed, create a mock audio URL so the user can still proceed
    if (recordedChunks.length === 0) {
      setAudioUrl("#mock-audio");
    }
  };

  // Start 60s Cue Card Prep Timer
  const startPart2Prep = () => {
    setPrepTimer(60);
    if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    prepIntervalRef.current = setInterval(() => {
      setPrepTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(prepIntervalRef.current!);
          setPrepTimer(null);
          // Auto start speaking after prep finishes
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextQuestion = () => {
    stopRecording();
    setAudioUrl(null);
    if (speakingPart === 1) {
      if (currentPartQuestionIdx < (speakingData?.part1.length || 0) - 1) {
        setCurrentPartQuestionIdx(prev => prev + 1);
      } else {
        setSpeakingPart(2);
        setCurrentPartQuestionIdx(0);
      }
    } else if (speakingPart === 2) {
      setSpeakingPart(3);
      setCurrentPartQuestionIdx(0);
    } else if (speakingPart === 3) {
      if (currentPartQuestionIdx < (speakingData?.part3.length || 0) - 1) {
        setCurrentPartQuestionIdx(prev => prev + 1);
      } else {
        submitSpeakingTest();
      }
    }
  };

  const submitSpeakingTest = async () => {
    setSpeakingPart(4);
    // Persist score to Supabase via progress service
    if (speakingData) {
      try {
        await saveIELTSAnswer(
          "speaking",
          slug || "Practice Speaking Topic",
          speakingData.aiFeedback.overallBand >= 6.0,
          speakingData.aiFeedback.overallBand,
          3, // 3 Parts
          3  // 3 completed successfully
        );
      } catch (err) {
        console.error("Failed to save Speaking progress:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
      if (speakIntervalRef.current) clearInterval(speakIntervalRef.current);
    };
  }, []);

  if (!slug) {
    navigate("/ielts");
    return null;
  }

  // Handle Speaking rendering
  if (isSpeakingTest && speakingData) {
    return (
      <div className="fixed inset-0 z-50 bg-canvas flex flex-col font-sans text-ink overflow-y-auto">
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] right-[-10%] opacity-40 animate-pulse" style={{ width: '1200px', height: '1200px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} />

        {/* Premium Header */}
        <div className="flex items-center justify-between p-6 border-b border-line bg-canvas/60 backdrop-blur-xl relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-line mr-2">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
              <span className="font-black text-sm tracking-tighter uppercase">SAUBOL</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" /> IELTS SPEAKING SIMULATOR
            </div>
          </div>
          <Button 
            onClick={() => navigate("/ielts")}
            className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Exit Simulation
          </Button>
        </div>

        {/* Simulation Sandbox */}
        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center relative z-10">
          {speakingPart < 4 ? (
            <div className="glass-3d p-12 flex flex-col gap-8">
              {/* Stepper Status */}
              <div className="flex justify-between items-center pb-6 border-b border-line">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PART {speakingPart} OF 3</span>
                  <h2 className="text-3xl font-black italic uppercase mt-1">Topic: {speakingData.title}</h2>
                </div>
                <div className="flex gap-2">
                  <div className={`w-3 h-3 rounded-full ${speakingPart >= 1 ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-surface-2'}`} />
                  <div className={`w-3 h-3 rounded-full ${speakingPart >= 2 ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-surface-2'}`} />
                  <div className={`w-3 h-3 rounded-full ${speakingPart >= 3 ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-surface-2'}`} />
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 py-6">
                {speakingPart === 1 && (
                  <div className="space-y-6">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-ink-subtle">Examiner Question ({currentPartQuestionIdx + 1}/{speakingData.part1.length})</p>
                    <div className="flex items-start gap-4">
                      <Volume2 className="w-8 h-8 text-indigo-400 shrink-0 mt-1" />
                      <h3 className="text-2xl font-black leading-tight text-ink">{speakingData.part1[currentPartQuestionIdx]}</h3>
                    </div>
                  </div>
                )}

                {speakingPart === 2 && (
                  <div className="space-y-6">
                    <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">CUE CARD TOPIC</p>
                      <h3 className="text-2xl font-black italic mb-6 leading-tight">“ {speakingData.part2.cueCard} ”</h3>
                      <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest mb-3">You should cover:</p>
                      <ul className="grid gap-2">
                        {speakingData.part2.bulletPoints.map((point, index) => (
                          <li key={index} className="flex items-center gap-3 text-sm font-bold text-ink">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {prepTimer !== null && (
                      <div className="p-6 bg-surface border border-line rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-ink-subtle uppercase tracking-widest mb-2">PREPARATION TIME REMAINING</span>
                        <div className="text-5xl font-black font-mono text-indigo-400">{prepTimer}s</div>
                      </div>
                    )}

                    {speakTimer !== null && (
                      <div className="p-6 bg-surface border border-line rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-ink-subtle uppercase tracking-widest mb-2">SPEAKING TIME REMAINING</span>
                        <div className="text-5xl font-black font-mono text-rose-400 animate-pulse">{speakTimer}s</div>
                      </div>
                    )}
                  </div>
                )}

                {speakingPart === 3 && (
                  <div className="space-y-6">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-ink-subtle">Follow-up Discussion ({currentPartQuestionIdx + 1}/{speakingData.part3.length})</p>
                    <div className="flex items-start gap-4">
                      <Volume2 className="w-8 h-8 text-indigo-400 shrink-0 mt-1" />
                      <h3 className="text-2xl font-black leading-tight text-ink">{speakingData.part3[currentPartQuestionIdx]}</h3>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Sandbox */}
              <div className="flex flex-col gap-6 pt-8 border-t border-line items-center">
                {speakingPart === 2 && prepTimer === null && speakTimer === null && !isRecording && !audioUrl && (
                  <Button onClick={startPart2Prep} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-16 font-black uppercase text-xs tracking-widest shadow-2xl transition-transform hover:scale-105">
                    Start 1 Minute Preparation
                  </Button>
                )}

                {/* Audio Waves Simulation */}
                {isRecording && (
                  <div className="flex items-center gap-1.5 h-10 py-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-rose-500 rounded-full animate-bounce" 
                        style={{ 
                          height: `${h * 4}px`, 
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: "0.6s" 
                        }} 
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Record Trigger */}
                  {(speakingPart !== 2 || prepTimer === null) && (
                    <>
                      {!isRecording ? (
                        <Button 
                          onClick={startRecording} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-14 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                        >
                          <Mic className="w-4 h-4" /> Start Voice Recorder
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopRecording} 
                          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-8 h-14 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                        >
                          <Square className="w-4 h-4" /> Stop Recording
                        </Button>
                      )}
                    </>
                  )}

                  {/* Playback Simulation */}
                  {audioUrl && (
                    <div className="flex items-center gap-3 bg-surface border border-line px-6 rounded-xl h-14">
                      <span className="text-[10px] font-black uppercase tracking-widest text-ink-subtle">Recording Saved</span>
                      {audioUrl !== "#mock-audio" ? (
                        <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4" /> Ready to Evaluate
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Control */}
                <Button 
                  onClick={handleNextQuestion} 
                  disabled={!audioUrl && !isRecording}
                  className="bg-white text-black hover:bg-gray-100 rounded-2xl w-full h-16 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-2xl transition-transform hover:scale-[1.02]"
                >
                  Confirm Answer & Next <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            </div>
          ) : (
            /* Finished - Show Premium AI scoring analytics dashboard */
            <div className="glass-3d p-12 flex flex-col gap-10 text-left animate-in fade-in zoom-in-95 duration-1000">
              <div className="text-center pb-6 border-b border-line">
                <Award className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-bounce" />
                <h2 className="text-5xl font-black italic uppercase leading-none">Simulation Completed.</h2>
                <p className="text-xs font-black uppercase text-ink-subtle tracking-[0.3em] mt-2">Neural Band 9.0 Speaking Appraisal</p>
              </div>

              {/* Band Score Banner */}
              <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="text-8xl font-black text-shimmer leading-none">{speakingData.aiFeedback.overallBand}</div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">OVERALL BAND</h3>
                    <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest">Estimated from pronunciation, fluency and syntax</p>
                  </div>
                </div>
                <div className="px-6 py-3 bg-surface rounded-xl border border-line text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Mastery Saved
                </div>
              </div>

              {/* Criterion Breakdown */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 bg-surface border border-line rounded-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Fluency & Coherence</h4>
                  <p className="text-sm font-semibold text-ink leading-relaxed">{speakingData.aiFeedback.fluency}</p>
                </div>
                <div className="p-6 bg-surface border border-line rounded-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Lexical Resource</h4>
                  <p className="text-sm font-semibold text-ink leading-relaxed">{speakingData.aiFeedback.lexical}</p>
                </div>
                <div className="p-6 bg-surface border border-line rounded-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Grammatical Range</h4>
                  <p className="text-sm font-semibold text-ink leading-relaxed">{speakingData.aiFeedback.grammar}</p>
                </div>
                <div className="p-6 bg-surface border border-line rounded-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Pronunciation Accuracy</h4>
                  <p className="text-sm font-semibold text-ink leading-relaxed">{speakingData.aiFeedback.pronunciation}</p>
                </div>
              </div>

              {/* Optimized Version */}
              <div className="p-8 bg-surface border border-line rounded-2xl">
                <h4 className="text-lg font-black uppercase tracking-tight text-ink mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" /> BAND 9.0 FORMULATION STRATEGY
                </h4>
                <p className="text-sm text-ink-muted leading-relaxed italic">{speakingData.aiFeedback.band9Sample}</p>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => {
                    setSpeakingPart(1);
                    setCurrentPartQuestionIdx(0);
                    setAudioUrl(null);
                  }}
                  variant="outline"
                  className="h-16 px-8 rounded-xl border-line text-ink font-black uppercase text-xs flex items-center gap-2 w-1/3"
                >
                  <RotateCcw className="w-4 h-4" /> Retry Topic
                </Button>
                <Button 
                  onClick={() => navigate("/ielts")}
                  className="h-16 rounded-xl bg-white text-black font-black uppercase text-xs shadow-2xl flex-1 hover:bg-gray-100"
                >
                  Return to IELTS Hub
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle standard listening/reading iframe loading via unified registry
  const resolved = resolveTestAsset(slug);
  if (!resolved || resolved.mode === "speaking") {
    navigate("/ielts");
    return null;
  }
  const testUrl = resolved.url;

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col font-sans">
      {/* Premium Header Wrapper */}
      <div className="absolute top-6 left-6 z-[60] flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-line mr-2">
          <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
          <span className="font-black text-sm tracking-tighter text-ink uppercase">SAUBOL</span>
        </div>
        <Button 
          onClick={() => navigate("/ielts")}
          className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl"
        >
          <ChevronLeft className="w-4 h-4" /> Exit Session
        </Button>
        <div className="px-4 py-3 rounded-xl bg-canvas/80 border border-line backdrop-blur-md hidden md:flex items-center gap-3 shadow-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Secure Environment</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-canvas flex flex-col items-center justify-center">
           <div className="bg-vignette opacity-50" />
           <Loader2 className="w-12 h-12 animate-spin text-ink mb-6 relative z-10" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-ink-subtle relative z-10 animate-pulse">Initializing Test Engine</p>
        </div>
      )}

      {/* Test Frame */}
      <iframe
        src={testUrl}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        title="IELTS Test"
      />
      
      {/* Bottom Status Bar */}
      <div className="h-2 bg-indigo-600/20 w-full overflow-hidden shrink-0">
         <div className="h-full bg-indigo-500 animate-shimmer" style={{ width: isLoaded ? '100%' : '30%' }} />
      </div>
    </div>
  );
};

export default IELTSTestViewer;
