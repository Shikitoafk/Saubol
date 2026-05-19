export interface GeminiFeedback {
  errorText: string;
  correction: string;
  explanation: string;
}

export interface GeminiResponse {
  scores: {
    TR: number;
    CC: number;
    LR: number;
    GRA: number;
    overall: number;
    subScores: {
      tr: Record<string, number>;
      cc: Record<string, number>;
      lr: Record<string, number>;
      gra: Record<string, number>;
    };
  };
  feedback: {
    tr: string;
    cc: string;
    lr: string;
    gra: string;
    sentences: GeminiFeedback[];
  };
  rewrittenEssay: string;
  wordCount: number;
  penaltyApplied: string;
}

export async function evaluateEssayWithGemini(
  taskType: string,
  prompt: string,
  essay: string,
  imageBase64?: string
): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskType,
        prompt,
        essay,
        imageBase64
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const raw = await response.json();
    console.log('Gemini API Full Response:', raw);
    
    // Total defensive mapping with optional chaining
    try {
      return {
        scores: {
          TR: raw?.tr?.score ?? 0,
          CC: raw?.cc?.score ?? 0,
          LR: raw?.lr?.score ?? 0,
          GRA: raw?.gra?.score ?? 0,
          overall: raw?.overallScore ?? 0,
          subScores: {
            tr: raw?.tr?.subScores ?? {},
            cc: raw?.cc?.subScores ?? {},
            lr: raw?.lr?.subScores ?? {},
            gra: raw?.gra?.subScores ?? {}
          }
        },
        feedback: {
          tr: raw?.tr?.feedback ?? "Feedback not provided.",
          cc: raw?.cc?.feedback ?? "Feedback not provided.",
          lr: raw?.lr?.feedback ?? "Feedback not provided.",
          gra: raw?.gra?.feedback ?? "Feedback not provided.",
          sentences: Array.isArray(raw?.sentenceCorrections) 
            ? raw.sentenceCorrections.map((c: any) => ({
                errorText: c?.original ?? "",
                correction: c?.correction ?? "",
                explanation: c?.reason ?? ""
              }))
            : []
        },
        rewrittenEssay: raw?.rewrittenEssay ?? "Rewritten essay is being generated...",
        wordCount: raw?.wordCount ?? 0,
        penaltyApplied: raw?.penaltyApplied ?? "None"
      };
    } catch (mapErr) {
      console.error('Data Mapping Error:', mapErr);
      throw new Error('Could not process the AI response structure.');
    }
  } catch (error: any) {
    console.error('Evaluate Essay Error:', error);
    throw error;
  }
}
