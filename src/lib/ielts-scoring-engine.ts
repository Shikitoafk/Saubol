// IELTS Scoring Engine
// Uses Google Gemini API for comprehensive essay evaluation

import { evaluateEssayWithGemini, GeminiResponse, GeminiFeedback } from './gemini-api';

export interface ScoringResult {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  feedback: GeminiFeedback[];
  rewrittenEssay: string;
}

export class IELTSScoringEngine {
  private taskType: "task1" | "task2";
  private prompt: string;
  private essay: string;

  constructor(taskType: "task1" | "task2", prompt: string, essay: string) {
    this.taskType = taskType;
    this.prompt = prompt;
    this.essay = essay;
  }

  /**
   * Main scoring method - uses Gemini API for comprehensive evaluation
   */
  async score(): Promise<ScoringResult> {
    const geminiResponse = await evaluateEssayWithGemini(this.taskType, this.prompt, this.essay);

    return {
      taskResponse: geminiResponse.scores.TR,
      coherenceCohesion: geminiResponse.scores.CC,
      lexicalResource: geminiResponse.scores.LR,
      grammaticalRange: geminiResponse.scores.GRA,
      overallBand: geminiResponse.scores.overall,
      feedback: geminiResponse.feedback,
      rewrittenEssay: geminiResponse.rewrittenEssay,
    };
  }
}

export default IELTSScoringEngine;
