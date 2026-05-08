import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { 
  Brain, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Code, 
  Download, 
  Image as ImageIcon, 
  X,
  Sparkles,
  Zap
} from "lucide-react";
import IELTSScoringEngine, { ScoringResult } from "@/lib/ielts-scoring-engine";
import { supabase } from "@/lib/supabase";

type TaskType = "task1" | "task2";

const IELTSWritingChecker = () => {
  const nav = useNavigate();
  const [taskType, setTaskType] = useState<TaskType>("task2");
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskImage, setTaskImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!essay.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const engine = new IELTSScoringEngine(taskType, prompt, essay, taskImage || undefined);
      const scoringResult = await engine.score();

      setResult({
        bandScore: scoringResult.overallBand,
        taskResponse: scoringResult.taskResponse,
        coherenceCohesion: scoringResult.coherenceCohesion,
        lexicalResource: scoringResult.lexicalResource,
        grammaticalRange: scoringResult.grammaticalRange,
        detailedFeedback: scoringResult.detailedFeedback,
        subScores: scoringResult.subScores,
        grammarErrors: scoringResult.feedback,
        rewrittenEssay: scoringResult.rewrittenEssay,
        wordCount: scoringResult.wordCount,
        penaltyApplied: scoringResult.penaltyApplied
      });

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ielts_progress").insert({
          user_id: user.id,
          test_name: `Writing (${taskType === "task1" ? "Task 1" : "Task 2"})`,
          skill: "writing",
          score: Math.round(scoringResult.overallBand * 10),
          total: 90,
        });
      }
    } catch (error) {
      console.error('Scoring error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTaskImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const renderHighlightedEssay = () => {
    if (!result || !result.grammarErrors) return essay;
    
    let highlighted = essay;
    // Sort errors by length descending to avoid nested replacement issues
    const sortedErrors = [...result.grammarErrors].sort((a, b) => b.errorText.length - a.errorText.length);
    
    return (
      <div className="text-lg leading-relaxed font-medium text-white/90 whitespace-pre-wrap">
        {essay.split(/(\s+)/).map((word, i) => {
          const error = result.grammarErrors.find((e: any) => 
            word.toLowerCase().replace(/[.,!?]/g, '') === e.errorText.toLowerCase().replace(/[.,!?]/g, '')
          );
          
          if (error) {
            return (
              <span key={i} className="relative group cursor-help border-b-2 border-rose-500/50 bg-rose-500/10 px-1 rounded">
                {word}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-black border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Correction</p>
                  <p className="text-white font-bold mb-2">{error.correction}</p>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Reason</p>
                  <p className="text-xs text-white/60 normal-case">{error.explanation}</p>
                </span>
              </span>
            );
          }
          return word;
        })}
      </div>
    );
  };

  const downloadReport = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white selection:bg-white/10 relative overflow-hidden font-sans print:bg-white print:text-black">
        {/* Depth Background */}
        <div className="bg-vignette print:hidden" />
        <div className="bg-sphere top-[-10%] right-[-5%] opacity-30 print:hidden" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} />
        
        <div className="max-w-[1400px] mx-auto px-10 py-20 relative z-10 print:py-0 print:px-0">
          {/* Breadcrumb */}
          <div className="mb-12 opacity-40 print:hidden">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => nav("/ielts")} className="cursor-pointer font-black uppercase tracking-widest text-[10px]">IELTS</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-black uppercase tracking-widest text-[10px] text-white">Writing Checker</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <div className="mb-20 print:mb-10">
            <div className="flex items-center gap-3 mb-6 opacity-60 print:hidden">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">AI Scoring Engine v2.5</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-shimmer leading-[0.85] mb-8 print:text-4xl print:text-black print:mb-4">
              WRITING <br /> CHECKER.
            </h1>
            <p className="text-xl text-[#666] font-medium max-w-2xl leading-relaxed print:text-sm print:text-gray-600">
              Мгновенный разбор твоего эссе с помощью Gemini AI. Оценка по критериям IELTS, исправление ошибок и Band 9.0 версия твоего текста.
            </p>
          </div>

          {/* Task Type Toggle - 3D Style */}
          <div className="mb-12 flex gap-4 print:hidden">
            {[
              { id: 'task1', label: 'Task 1 (Report)' },
              { id: 'task2', label: 'Task 2 (Essay)' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => { setTaskType(type.id as TaskType); setResult(null); }}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border ${
                  taskType === type.id 
                  ? "bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                  : "bg-white/5 text-[#444] border-white/5 hover:border-white/20"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Input Grid */}
          <div className={`grid gap-10 lg:grid-cols-2 mb-16 ${result ? 'print:hidden' : ''}`}>
            {/* Prompt Panel */}
            <div className="glass-3d p-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-[#444]">Question / Prompt</label>
                {taskType === 'task1' && (
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
                    <ImageIcon className="w-3 h-3" />
                    {taskImage ? 'Replace Image' : 'Upload Image'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <textarea
                placeholder="Paste the writing prompt here..."
                className="w-full h-80 bg-transparent border-none resize-none focus:outline-none font-medium text-lg text-white/80 placeholder:text-[#222]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {taskImage && (
                <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-white/10 group">
                  <img src={taskImage} className="w-full h-full object-cover" />
                  <button onClick={() => setTaskImage(null)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Essay Panel */}
            <div className="glass-3d p-10 flex flex-col gap-6 border-indigo-500/20 shadow-[0_20px_40px_rgba(99,102,241,0.05)]">
              <label className="text-xs font-black uppercase tracking-widest text-[#444]">Your Writing</label>
              <textarea
                placeholder="Start typing or paste your essay here..."
                className="w-full h-[500px] bg-transparent border-none resize-none focus:outline-none font-medium text-lg text-white/80 placeholder:text-[#222]"
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
              />
              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#333] uppercase tracking-widest">{essay.trim().split(/\s+/).filter(x => x).length} Words</span>
                  <span className="text-[8px] font-black text-[#222] uppercase tracking-widest">Minimum 250 Recommended</span>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !essay.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 font-black tracking-widest uppercase text-xs h-12 shadow-[0_10px_20px_rgba(79,70,229,0.3)]"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Essay"}
                </Button>
              </div>
            </div>
          </div>

          {/* Result Section */}
          {result && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              {/* Main Score Banner */}
              <div className="glass-3d p-16 flex flex-col md:flex-row items-center justify-between gap-12 bg-white/5 border-white/20 print:border-none print:bg-white print:p-0 print:mb-10 print:text-black">
                 <div className="flex items-center gap-10">
                    <div className="text-9xl font-black text-shimmer leading-none print:text-black print:text-7xl">{result.bandScore}</div>
                    <div>
                      <h3 className="text-4xl font-black tracking-tight mb-2 print:text-2xl print:text-black">OVERALL BAND</h3>
                      <p className="text-xs font-black text-[#444] uppercase tracking-[0.3em] print:text-black">Official Scoring Estimation</p>
                    </div>
                 </div>
                 <Button onClick={downloadReport} className="bg-white text-black hover:bg-gray-200 rounded-xl px-10 h-16 font-black tracking-widest uppercase text-xs print:hidden">
                    <Download className="w-4 h-4 mr-2" /> Download Report
                 </Button>
              </div>

              {/* Criteria Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
                {[
                  { label: "Task Response", score: result.taskResponse, icon: FileText, color: "text-blue-400" },
                  { label: "Coherence", score: result.coherenceCohesion, icon: MessageSquare, color: "text-emerald-400" },
                  { label: "Vocabulary", score: result.lexicalResource, icon: BookOpen, color: "text-purple-400" },
                  { label: "Grammar", score: result.grammaticalRange, icon: Code, color: "text-amber-400" }
                ].map((item, i) => (
                  <div key={i} className="glass-3d p-10 hover:scale-105 transition-all print:text-black print:border-gray-200 print:hover:scale-100">
                    <item.icon className={`w-6 h-6 mb-8 ${item.color} print:text-gray-400`} />
                    <div className="text-4xl font-black mb-1 print:text-black">{item.score}</div>
                    <span className="text-[10px] font-black text-[#333] uppercase tracking-widest print:text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Enhanced Feedback Display */}
              <div className="grid gap-10 lg:grid-cols-2">
                 {/* Essay with Highlighting */}
                 <div className="glass-3d p-12 print:text-black print:border-gray-200">
                    <h4 className="text-2xl font-black mb-10 flex items-center gap-4">
                      <FileText className="w-6 h-6 text-indigo-400 print:text-gray-400" />
                      YOUR ESSAY (WITH FEEDBACK)
                    </h4>
                    {renderHighlightedEssay()}
                 </div>

                 {/* Detailed Criterion Feedback */}
                 <div className="glass-3d p-12 print:text-black print:border-gray-200">
                    <h4 className="text-2xl font-black mb-10 flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-yellow-400 print:text-gray-400" />
                      EXAMINER FEEDBACK
                    </h4>
                    <div className="space-y-10">
                       {[
                         { id: 'TR', title: 'Task Response', content: result.detailedFeedback.tr },
                         { id: 'CC', title: 'Coherence & Cohesion', content: result.detailedFeedback.cc },
                         { id: 'LR', title: 'Lexical Resource', content: result.detailedFeedback.lr },
                         { id: 'GR', title: 'Grammar Accuracy', content: result.detailedFeedback.gra }
                       ].map((item) => (
                         <div key={item.id}>
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center font-black text-[10px] text-white/40 border border-white/10 print:text-black print:border-gray-200">{item.id}</div>
                               <h5 className="text-[10px] font-black uppercase tracking-widest text-[#444] print:text-black">{item.title}</h5>
                            </div>
                            <p className="text-[#888] leading-relaxed font-medium print:text-black print:text-sm">{item.content}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Rewritten Essay */}
              <div className="glass-3d p-12 border-indigo-500/10 print:text-black print:border-gray-200">
                <div className="flex items-center justify-between mb-10">
                   <h4 className="text-2xl font-black flex items-center gap-4">
                     <Zap className="w-6 h-6 text-indigo-400 print:text-gray-400" />
                     BAND 9.0 OPTIMIZED VERSION
                   </h4>
                   <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(result.rewrittenEssay); }} className="text-[10px] font-black uppercase text-indigo-400 print:hidden">Copy Version</Button>
                </div>
                <div className="text-lg leading-relaxed font-medium text-white/60 bg-white/5 p-10 rounded-2xl border border-white/5 print:bg-gray-50 print:text-black print:text-sm">
                   {result.rewrittenEssay}
                </div>
              </div>
              
              <div className="flex justify-center pt-10 print:hidden">
                 <Button onClick={() => setResult(null)} variant="ghost" className="text-[10px] font-black uppercase tracking-[0.5em] text-[#444] hover:text-white">
                    Start New Analysis
                 </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IELTSWritingChecker;
