import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, AlertCircle, BookOpen, Highlighter } from "lucide-react";

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

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    setSelectedText(text);
  };

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
        // Use text2text-generation for explanations
        modelRef.current = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
        setIsModelLoading(false);
      }

      // Create a prompt to explain the selected text
      const prompt = `Explain this text in simple terms: "${selectedText}"`;
      const result = await modelRef.current(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
      });

      setExplanation({
        text: result[0]?.generated_text || "Unable to generate explanation.",
        selectedText,
      });
    } catch (error) {
      console.error('SAT AI Tutor error:', error);
      setExplanation({ error: 'AI unavailable. Please try again later.' });
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" />
          SAT AI Tutor
        </h3>
        <div className="text-xs text-muted-foreground">
          Select text to get explanations
        </div>
      </div>

      <div className="space-y-3">
        {/* Instructions */}
        <p className="text-xs text-muted-foreground">
          Highlight any difficult word or phrase in the passage to get an AI-powered explanation.
        </p>

        {/* Selected Text Display */}
        {selectedText && (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-1">Selected Text</div>
            <div className="text-sm font-medium text-foreground">"{selectedText}"</div>
            <Button
              onClick={explainSelection}
              disabled={isExplaining || !selectedText.trim()}
              className="mt-2"
              size="sm"
            >
              {isModelLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Loading AI model...
                </>
              ) : isExplaining ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Explaining...
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3 mr-2" />
                  Explain
                </>
              )}
            </Button>
          </div>
        )}

        {/* Explanation Result */}
        {explanation && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md animate-in fade-in duration-300">
            {explanation.error ? (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {explanation.error}
              </div>
            ) : (
              <>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Explanation</div>
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  {explanation.text}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Powered by AI — running locally in your browser
      </div>
    </div>
  );
};

export default SATAITutor;
