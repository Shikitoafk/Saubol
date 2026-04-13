import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let qaModel: any = null;

export async function answerQuestion(context: string, question: string) {
  if (!qaModel) {
    qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad');
  }
  const result = await qaModel(question, context);
  return {
    answer: result.answer,
    score: result.score,
    start: result.start,
    end: result.end,
  };
}
