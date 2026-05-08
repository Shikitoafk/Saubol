// Vercel Serverless Function (Pure ESM JavaScript)
export default async function handler(req, res) {
  console.log("Evaluate API (JS) called. Method:", req.method);
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { taskType, prompt, essay, imageBase64 } = req.body || {};
    if (!essay || !taskType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_KEY2 = process.env.GEMINI_API_KEY2;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY missing");
      return res.status(500).json({ error: 'Server API key configuration error' });
    }

    const systemPrompt = `You are an expert, objective, and highly accurate IELTS Writing Examiner. Evaluate the user's essay based on the official IELTS Public Band Descriptors.

Your evaluation must be realistic. DO NOT be overly harsh. 
- For GRA Band 8: The majority of sentences must be error-free. 2-3 minor slips or occasional errors are perfectly acceptable for an 8.0. Do not drop the score to 6.0 just because of a few minor agreement or spelling mistakes if the overall structure is complex and accurate.
- For GRA Band 7: Good control of grammar, but may make a few errors. 
- For LR Band 8: Uses a wide vocabulary fluently with occasional inaccuracies in word choice. 

You will receive:
1. TASK_TYPE
2. TASK_PROMPT (Text description)
3. USER_ESSAY (The student's writing)
4. IMAGE (Optional photo of the chart/table/prompt)

EVALUATION PROCESS:
Step 1: Analyze Task Achievement (Task 1) / Task Response (Task 2).
Step 2: Analyze Coherence and Cohesion.
Step 3: Analyze Lexical Resource.
Step 4: Analyze Grammatical Range and Accuracy.
Step 5: Identify the top 3 grammatical or lexical errors and correct them.

For each of the 4 main criteria, provide a comprehensive paragraph explaining the score, and evaluate specific sub-criteria on a scale of 1 to 9 (whole numbers only for sub-criteria).

OUTPUT FORMAT:
Ensure the LLM returns ONLY a valid JSON object matching this exact structure. Do not use markdown code blocks.
{
  "wordCount": 0,
  "penaltyApplied": "None",
  "tr": {
    "score": 0.0,
    "feedback": "Paragraph explaining the TR/TA score...",
    "subScores": {
      "relevanceToPrompt": 0,
      "clarityOfPosition": 0,
      "depthOfIdeas": 0,
      "appropriatenessOfFormat": 0,
      "relevantExamples": 0
    }
  },
  "cc": {
    "score": 0.0,
    "feedback": "Paragraph explaining the CC score...",
    "subScores": {
      "logicalOrganization": 0,
      "introAndConclusion": 0,
      "cohesiveDevices": 0,
      "paragraphing": 0
    }
  },
  "lr": {
    "score": 0.0,
    "feedback": "Paragraph explaining the LR score...",
    "subScores": {
      "vocabularyRange": 0,
      "lexicalAccuracy": 0,
      "spellingAndWordFormation": 0
    }
  },
  "gra": {
    "score": 0.0,
    "feedback": "Paragraph explaining the GRA score...",
    "subScores": {
      "sentenceStructureVariety": 0,
      "grammarAccuracy": 0,
      "punctuationUsage": 0
    }
  },
  "sentenceCorrections":[
    {
      "original": "string",
      "correction": "string",
      "reason": "string"
    }
  ],
  "rewrittenEssay": "A Band 9.0 optimized version of the student's essay, maintaining the original ideas but elevating the language and structure."
}`;

    const userMessage = `TASK_TYPE: ${taskType}\nTASK_PROMPT: ${prompt || 'N/A'}\nUSER_ESSAY: ${essay}`;

    const callGemini = async (modelName, apiKey, keyIndex, apiVersion = 'v1beta') => {
      console.log(`Trying Gemini model: ${modelName} via ${apiVersion} using Key #${keyIndex + 1} (${apiKey.substring(0, 10)}...)`);
      
      const parts = [{ text: userMessage }];
      
      if (imageBase64) {
        console.log("Adding image to Gemini request...");
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              { role: 'user', parts: parts }
            ],
            generationConfig: { 
              temperature: 0.1, 
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            }
          })
        }
      );
      return response;
    };

    let apiResponse;
    const modelsToTry = [
      { name: 'gemini-2.5-flash', version: 'v1beta' },
      { name: 'gemini-2.5-pro', version: 'v1beta' },
      { name: 'gemini-2.0-flash', version: 'v1beta' },
      { name: 'gemini-2.0-flash-lite', version: 'v1beta' },
      { name: 'gemini-flash-latest', version: 'v1beta' },
      { name: 'gemini-pro-latest', version: 'v1beta' }
    ];

    // Helper for IELTS overall rounding rules
    const calculateIeltsOverall = (tr, cc, lr, gra) => {
      const avg = (Number(tr) + Number(cc) + Number(lr) + Number(gra)) / 4;
      const decimal = avg % 1;
      const integer = Math.floor(avg);

      if (decimal === 0.25) return integer + 0.5;
      if (decimal === 0.75) return integer + 1.0;
      if ([0.125, 0.375, 0.625, 0.875].includes(decimal)) {
        return Math.floor(avg * 2) / 2; // Round DOWN to nearest 0.5
      }
      return Math.round(avg * 2) / 2; // Standard 0.5 rounding
    };

    const apiKeys = [GEMINI_API_KEY, GEMINI_API_KEY2].filter(Boolean);

    for (const model of modelsToTry) {
      for (let i = 0; i < apiKeys.length; i++) {
        const key = apiKeys[i];
        const apiResponse = await callGemini(model.name, key, i, model.version);
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (text) {
            try {
              // Clean markdown if AI wrapped it in ```json ... ```
              const cleanText = text.replace(/```json|```/g, "").trim();
              const result = JSON.parse(cleanText);

              // Add overall score
              result.overallScore = calculateIeltsOverall(
                result.tr.score, 
                result.cc.score, 
                result.lr.score, 
                result.gra.score
              );

              return res.status(200).json(result);
            } catch (parseErr) {
              console.warn(`Model ${model.name} with key ${key.substring(0,5)} returned invalid JSON:`, parseErr.message);
            }
          }
          console.warn(`Model ${model.name} with key ${key.substring(0,5)} returned empty content, trying next key/model...`);
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.warn(`Model ${model.name} with key ${key.substring(0,5)} failed with ${apiResponse.status}:`, JSON.stringify(errorData));
          
          const isRateLimited = apiResponse.status === 429;
          const isOverloaded = apiResponse.status === 503;
          const isNotFound = apiResponse.status === 404;
          
          if (isRateLimited || isOverloaded || isNotFound) {
            console.log(`Switching due to ${apiResponse.status}...`);
            continue; // Try next key for THIS model, or next model
          }
          break; // Stop for other fatal errors (e.g. 400 Bad Request)
        }
      }
    }

    return res.status(503).json({ 
      error: 'Gemini AI is currently unavailable. All available models failed to process the request.',
      details: 'Check Vercel logs for specific model errors.'
    });

  } catch (error) {
    console.error("API Crash:", error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
