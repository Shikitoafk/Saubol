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
import { Brain, Loader2, CheckCircle2, AlertCircle, ChevronLeft, BookOpen, FileText, MessageSquare, Code } from "lucide-react";
import IELTSScoringEngine, { ScoringResult } from "@/lib/ielts-scoring-engine";

type TaskType = "task1" | "task2";

const IELTSSWritingChecker = () => {
  const nav = useNavigate();
  const [taskType, setTaskType] = useState<TaskType>("task1");
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!essay.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Initialize scoring engine with Gemini API
      const engine = new IELTSScoringEngine(taskType, prompt, essay);
      
      // Use Gemini API for comprehensive evaluation
      const scoringResult = await engine.score();

      setResult({
        bandScore: scoringResult.overallBand,
        taskResponse: scoringResult.taskResponse,
        coherenceCohesion: scoringResult.coherenceCohesion,
        lexicalResource: scoringResult.lexicalResource,
        grammaticalRange: scoringResult.grammaticalRange,
        grammarErrors: scoringResult.feedback,
        rewrittenEssay: scoringResult.rewrittenEssay,
      });
    } catch (error) {
      console.error('Scoring error:', error);
      alert('Error analyzing essay. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => nav("/ielts")} className="cursor-pointer">
                IELTS
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Writing Checker</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IELTS Writing Checker</h1>
          <p className="text-muted-foreground">
            Get AI-powered feedback on your IELTS writing with band score estimation, grammar correction, and rewriting suggestions.
          </p>
        </div>

        {/* Task Type Toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border p-1 bg-muted">
            <button
              onClick={() => setTaskType("task1")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                taskType === "task1"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Task 1 (Report/Letter)
            </button>
            <button
              onClick={() => setTaskType("task2")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                taskType === "task2"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Task 2 (Essay)
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Question/Prompt</label>
            <textarea
              placeholder={taskType === "task1" 
                ? "Paste the Task 1 prompt here (e.g., describe a chart, diagram, or write a letter)..."
                : "Paste the Task 2 essay prompt here..."
              }
              className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Essay Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Essay</label>
            <textarea
              placeholder="Paste your IELTS writing here..."
              className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
            />
          </div>
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !essay.trim()}
          className="mb-8"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Essay
            </>
          )}
        </Button>

        {/* Results Dashboard */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Band Score Card */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Estimated Band Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">{result.bandScore}</div>
                <div className="text-muted-foreground">out of 9.0</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on the 4 official IELTS Band Descriptors (TR, CC, LR, GRA).
              </p>
            </div>

            {/* 4 Criteria Scores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Task Response */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Task Response</span>
                </div>
                <div className="text-2xl font-bold text-primary">{result.taskResponse}</div>
              </div>

              {/* Coherence & Cohesion */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Coherence & Cohesion</span>
                </div>
                <div className="text-2xl font-bold text-primary">{result.coherenceCohesion}</div>
              </div>

              {/* Lexical Resource */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Lexical Resource</span>
                </div>
                <div className="text-2xl font-bold text-primary">{result.lexicalResource}</div>
              </div>

              {/* Grammatical Range */}
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Grammatical Range</span>
                </div>
                <div className="text-2xl font-bold text-primary">{result.grammaticalRange}</div>
              </div>
            </div>

            {/* Grammar & Vocabulary Feedback */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Grammar & Vocabulary Feedback
              </h3>
              <div className="space-y-3">
                {result.grammarErrors && result.grammarErrors.length > 0 ? (
                  result.grammarErrors.map((error: any, index: number) => (
                    <div key={index} className="flex flex-col gap-2 p-4 bg-muted rounded-md">
                      <div className="flex items-start gap-3">
                        <span className="text-red-600 font-medium line-through bg-white px-2 py-1 rounded">{error.errorText}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-medium bg-white px-2 py-1 rounded">{error.correction}</span>
                      </div>
                      {error.explanation && (
                        <div className="text-xs text-muted-foreground mt-1">{error.explanation}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No major issues detected. Great job!</p>
                )}
              </div>
              {result.grammarErrors && result.grammarErrors.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  {result.grammarErrors.length} issue(s) found by AI
                </div>
              )}
            </div>

            {/* AI Rewritten Version */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Rewritten Version (Band 8.0/9.0)
              </h3>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm leading-relaxed">{result.rewrittenEssay}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground text-center">
          Powered by Google Gemini AI — comprehensive IELTS evaluation
        </div>
      </div>
    </Layout>
  );
};

export default IELTSSWritingChecker;
