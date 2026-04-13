import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

export async function semanticSearch(query: string, programs: any[], topK = 5) {
  const model = await getEmbedder();
  
  const queryEmbed = await model(query, { pooling: 'mean', normalize: true });
  const queryVec = Array.from(queryEmbed.data as Float32Array);
  
  const scored = await Promise.all(programs.map(async (p) => {
    const text = `${p.name} ${p.details} ${p.subject} ${p.price}`;
    const embed = await model(text, { pooling: 'mean', normalize: true });
    const vec = Array.from(embed.data as Float32Array);
    return { ...p, score: cosineSimilarity(queryVec, vec) };
  }));
  
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
