let qaModel: any = null;

export async function answerQuestion(context: string, question: string) {
  if (!qaModel) {
    const pipeline = (window as any).TransformersPipeline;
    const env = (window as any).TransformersEnv;
    if (!pipeline) throw new Error('Transformers not loaded');
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
