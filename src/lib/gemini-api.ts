// API utility for IELTS essay evaluation
// Calls the Vercel serverless function to securely evaluate essays

export interface GeminiScores {
  TR: number;
  CC: number;
  LR: number;
  GRA: number;
  overall: number;
}

export interface GeminiFeedback {
  errorText: string;
  correction: string;
  explanation: string;
}

export interface GeminiResponse {
  scores: GeminiScores;
  feedback: GeminiFeedback[];
  rewrittenEssay: string;
}

export async function evaluateEssayWithGemini(
  taskType: "task1" | "task2",
  prompt: string,
  essay: string
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const parsedResponse: GeminiResponse = await response.json();
    return parsedResponse;
  } catch (error) {
    console.error('Essay evaluation error:', error);
    throw error;
  }
}
