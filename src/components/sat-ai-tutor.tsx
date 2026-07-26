import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, AlertCircle, BookOpen, Sparkles, Zap, ChevronRight } from "lucide-react";

interface SATAITutorProps {
  passage: string;
  question?: string;
}

const SATAITutor = ({ passage, question }: SATAITutorProps) => {
  const [selectedText, setSelectedText] = useState("");
  const [explanation, setExplanation] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const modelRef = useRef<any>(null);

  const explainSelection = async () => {
    if (!selectedText.trim()) return;
    setIsExplaining(true);
    setExplanation(null);
    try {
      const pipeline = (window as any).TransformersPipeline;
      const env = (window as any).TransformersEnv;
      if (!pipeline) throw new Error('Transformers not loaded');
      if (!modelRef.current) {
        setIsModelLoading(true);
        env.allowLocalModels = false;
        modelRef.current = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
        setIsModelLoading(false);
      }
      const prompt = `Explain this text in simple terms: "${selectedText}"`;
      const result = await modelRef.current(prompt, { max_new_tokens: 150, temperature: 0.7 });
      setExplanation({ text: result[0]?.generated_text || "Unable to generate explanation.", selectedText });
    } catch (error) {
      setExplanation({ error: 'AI Intelligence Offline. Please reconnect.' });
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="glass-3d p-8 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-shimmer">SAT AI TUTOR</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-[#222]">Neural Link Active</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest leading-relaxed">
          Highlight any complex text in the passage to receive an AI-powered semantic breakdown.
        </p>

        {selectedText && (
          <div className="p-6 bg-surface rounded-2xl border border-line animate-in slide-in-from-bottom-2 duration-500">
            <div className="text-[8px] font-black text-[#222] uppercase tracking-[0.3em] mb-3">Target Text</div>
            <div className="text-sm font-medium text-ink leading-relaxed italic mb-6">"{selectedText}"</div>
            <Button
              onClick={explainSelection}
              disabled={isExplaining || !selectedText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-[0_10px_20px_rgba(79,70,229,0.2)]"
            >
              {isModelLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calibrating...
                </>
              ) : isExplaining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Segment
                </>
              )}
            </Button>
          </div>
        )}

        {explanation && (
          <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 animate-in fade-in duration-700">
            {explanation.error ? (
              <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {explanation.error}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI Insight</span>
                </div>
                <div className="text-sm font-medium text-ink-muted leading-relaxed">
                  {explanation.text}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-line text-[8px] font-black text-[#111] uppercase tracking-[0.4em] text-center">
        Edge Computing Runtime — Private & Local
      </div>
    </div>
  );
};

export default SATAITutor;
