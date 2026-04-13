// Google Gemini API utility for IELTS essay evaluation

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

const GEMINI_API_KEY = "AIzaSyCJmfEYIinvA4wQTcMTXiK2P0UsYO9Z4L4";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function evaluateEssayWithGemini(
  taskType: "task1" | "task2",
  prompt: string,
  essay: string
): Promise<GeminiResponse> {
  const systemPrompt = `You are a strict, professional IELTS examiner. Evaluate the following essay based on the official TR, CC, LR, and GRA rubrics. Return ONLY a valid JSON object with this exact structure:
{
  "scores": { "TR": 6.0, "CC": 6.5, "LR": 6.0, "GRA": 5.5, "overall": 6.0 },
  "feedback": [
    { "errorText": "volcanic calling", "correction": "strong calling", "explanation": "Unnatural collocation." }
  ],
  "rewrittenEssay": "The fully rewritten Band 9.0 version of the essay goes here..."
}

Task Type: ${taskType.toUpperCase()}
Prompt: ${prompt}
Essay: ${essay}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      throw new Error('No response text from Gemini API');
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

    const parsedResponse: GeminiResponse = JSON.parse(jsonString);
    return parsedResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
