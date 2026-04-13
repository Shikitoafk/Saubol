let qaModel: any = null;

export async function answerQuestion(context: string, question: string) {
  if (!qaModel) {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
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
