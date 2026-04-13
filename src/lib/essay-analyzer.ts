let classifier: any = null;
let grammarChecker: any = null;

export async function analyzeEssay(text: string) {
  if (!classifier) {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  }
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const results = [];
  
  for (const sentence of sentences.slice(0, 20)) {
    const result = await classifier(sentence);
    results.push({ sentence: sentence.trim(), label: result[0].label, score: result[0].score });
  }
  
  const informalWords = ['gonna', 'wanna', 'kinda', 'stuff', 'things', 'like', 'okay', 'ok', 'yeah', 'nope', 'lots of', "don't", "can't", "won't", "it's", "that's"];
  const informalFound = informalWords.filter(w => text.toLowerCase().includes(w));
  
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const avgSentenceLength = wordCount / (sentences.length || 1);
  
  return {
    sentences: results,
    informalWords: informalFound,
    wordCount,
    avgSentenceLength: Math.round(avgSentenceLength),
    toneScore: informalFound.length === 0 ? 'Formal' : informalFound.length < 3 ? 'Mostly Formal' : 'Informal',
  };
}
