// IELTS Hybrid Scoring Engine
// Implements the 4 official IELTS Band Descriptors (TR, CC, LR, GRA)
// Combines JS heuristics with AI prompts for accurate scoring

export interface ScoringResult {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  details: {
    wordCount: number;
    wordCountPenalty: string;
    keywordMatch: number;
    transitionWordsUsed: string[];
    transitionWordCount: number;
    paragraphCount: number;
    repeatedWords: string[];
    basicWordsWithAlternatives: Array<{ word: string; alternatives: string[] }>;
    grammarErrors: number;
    grammarCorrections: string;
  };
}

export interface AIPrompts {
  extractKeywords: string;
  suggestAlternatives: string;
  correctGrammar: string;
}

export class IELTSScoringEngine {
  private taskType: "task1" | "task2";
  private prompt: string;
  private essay: string;

  // Academic transition words for CC scoring
  private transitionWords = [
    "furthermore", "moreover", "in addition", "additionally", "also",
    "consequently", "therefore", "thus", "as a result", "hence",
    "nevertheless", "nonetheless", "however", "on the other hand", "in contrast",
    "to illustrate", "for example", "for instance", "specifically",
    "in conclusion", "to sum up", "overall", "in summary",
    "meanwhile", "simultaneously", "subsequently", "previously",
    "firstly", "secondly", "finally", "lastly", "moreover",
    "although", "despite", "while", "whereas", "yet",
    "thereby", "whereby", "henceforth", "hereby"
  ];

  // Basic words to flag for LR scoring
  private basicWords = [
    "good", "bad", "nice", "big", "small", "important", "very", "really",
    "things", "stuff", "people", "think", "believe", "say", "tell",
    "want", "need", "get", "make", "use", "help", "show",
    "happy", "sad", "angry", "problem", "issue", "way", "method"
  ];

  constructor(taskType: "task1" | "task2", prompt: string, essay: string) {
    this.taskType = taskType;
    this.prompt = prompt;
    this.essay = essay;
  }

  /**
   * Main scoring method - aggregates all 4 criteria
   */
  async score(aiPrompts?: AIPrompts, aiResults?: {
    keywords?: string[];
    alternatives?: Array<{ word: string; alternatives: string[] }>;
    correctedText?: string;
  }): Promise<ScoringResult> {
    const tr = this.scoreTaskResponse();
    const cc = this.scoreCoherenceCohesion();
    const lr = await this.scoreLexicalResource(aiResults?.alternatives);
    const gra = await this.scoreGrammaticalRange(aiResults?.correctedText);

    const overallBand = this.calculateOverallBand(tr, cc, lr, gra);

    return {
      taskResponse: tr,
      coherenceCohesion: cc,
      lexicalResource: lr,
      grammaticalRange: gra,
      overallBand,
      details: {
        wordCount: this.getWordCount(),
        wordCountPenalty: this.getWordCountPenalty(),
        keywordMatch: this.calculateKeywordMatch(),
        transitionWordsUsed: this.getTransitionWordsUsed(),
        transitionWordCount: this.getTransitionWordCount(),
        paragraphCount: this.getParagraphCount(),
        repeatedWords: this.detectRepeatedWords(),
        basicWordsWithAlternatives: aiResults?.alternatives || [],
        grammarErrors: aiResults?.correctedText ? this.countGrammarErrors(aiResults.correctedText) : 0,
        grammarCorrections: aiResults?.correctedText || "",
      }
    };
  }

  /**
   * Task Response (TR) Scoring
   */
  private scoreTaskResponse(): number {
    let score = 7.0; // Start with a decent base score

    // Word count penalty
    const wordCount = this.getWordCount();
    const minWords = this.taskType === "task1" ? 150 : 250;
    
    if (wordCount < minWords) {
      const penalty = Math.floor((minWords - wordCount) / 25) * 0.5;
      score = Math.max(4.0, score - penalty);
    }

    // Keyword matching - check if essay addresses the prompt
    const keywordMatch = this.calculateKeywordMatch();
    if (keywordMatch < 0.3) {
      score -= 1.0;
    } else if (keywordMatch < 0.5) {
      score -= 0.5;
    } else if (keywordMatch > 0.7) {
      score += 0.5;
    }

    return Math.min(9.0, Math.max(4.0, score));
  }

  private getWordCount(): number {
    return this.essay.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  private getWordCountPenalty(): string {
    const wordCount = this.getWordCount();
    const minWords = this.taskType === "task1" ? 150 : 250;
    
    if (wordCount < minWords) {
      return `Under minimum word count (${minWords}): ${wordCount} words`;
    }
    return "Meets word count requirement";
  }

  private calculateKeywordMatch(): number {
    // Extract nouns and verbs from prompt (simple approach)
    const promptWords = this.prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3);

    const essayWords = this.essay
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);

    // Count matches
    let matches = 0;
    promptWords.forEach(pword => {
      if (essayWords.some(eword => eword.includes(pword) || pword.includes(eword))) {
        matches++;
      }
    });

    return promptWords.length > 0 ? matches / promptWords.length : 0;
  }

  /**
   * Coherence and Cohesion (CC) Scoring
   */
  private scoreCoherenceCohesion(): number {
    let score = 6.0;

    // Transition word usage
    const transitionWordsUsed = this.getTransitionWordsUsed();
    const transitionWordCount = this.getTransitionWordCount();
    
    // Good variety of transition words
    if (transitionWordCount >= 5) {
      score += 1.0;
    } else if (transitionWordCount >= 3) {
      score += 0.5;
    } else if (transitionWordCount === 0) {
      score -= 1.0;
    }

    // Penalize overuse (spamming)
    if (transitionWordCount > 15) {
      score -= 0.5;
    }

    // Paragraph structure
    const paragraphCount = this.getParagraphCount();
    const minParagraphs = this.taskType === "task1" ? 2 : 3;
    
    if (paragraphCount < minParagraphs) {
      score -= 1.0;
    } else if (paragraphCount >= 4) {
      score += 0.5;
    }

    return Math.min(9.0, Math.max(4.0, score));
  }

  private getTransitionWordsUsed(): string[] {
    const essayLower = this.essay.toLowerCase();
    const used: string[] = [];
    
    this.transitionWords.forEach(word => {
      if (essayLower.includes(word)) {
        used.push(word);
      }
    });

    return used;
  }

  private getTransitionWordCount(): number {
    const essayLower = this.essay.toLowerCase();
    let count = 0;
    
    this.transitionWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = essayLower.match(regex);
      if (matches) {
        count += matches.length;
      }
    });

    return count;
  }

  private getParagraphCount(): number {
    return this.essay.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  }

  /**
   * Lexical Resource (LR) Scoring
   */
  private async scoreLexicalResource(aiAlternatives?: Array<{ word: string; alternatives: string[] }>): Promise<number> {
    let score = 6.0;

    // Detect word repetition
    const repeatedWords = this.detectRepeatedWords();
    if (repeatedWords.length > 3) {
      score -= 1.0;
    } else if (repeatedWords.length > 1) {
      score -= 0.5;
    }

    // AI-provided alternatives for basic words
    if (aiAlternatives && aiAlternatives.length > 0) {
      // If the essay uses many basic words but AI can suggest alternatives, penalize
      const basicWordCount = this.countBasicWords();
      if (basicWordCount > 5) {
        score -= 0.5;
      }
      // If AI found many opportunities for improvement
      if (aiAlternatives.length > 3) {
        score -= 0.5;
      }
    } else {
      // Without AI, use simple heuristic
      const basicWordCount = this.countBasicWords();
      if (basicWordCount > 10) {
        score -= 1.0;
      } else if (basicWordCount > 5) {
        score -= 0.5;
      }
    }

    // Vocabulary diversity (unique words / total words)
    const diversity = this.calculateVocabularyDiversity();
    if (diversity > 0.7) {
      score += 0.5;
    } else if (diversity < 0.4) {
      score -= 0.5;
    }

    return Math.min(9.0, Math.max(4.0, score));
  }

  private detectRepeatedWords(): string[] {
    const words = this.essay
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2);

    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Exclude common words
    const commonWords = ["the", "and", "of", "to", "a", "in", "is", "that", "for", "it", "as", "with", "on"];
    const repeated: string[] = [];
    
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= 5 && !commonWords.includes(word)) {
        repeated.push(word);
      }
    });

    return repeated;
  }

  private countBasicWords(): number {
    const essayLower = this.essay.toLowerCase();
    let count = 0;
    
    this.basicWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = essayLower.match(regex);
      if (matches) {
        count += matches.length;
      }
    });

    return count;
  }

  private calculateVocabularyDiversity(): number {
    const words = this.essay
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (words.length === 0) return 0;

    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  /**
   * Grammatical Range and Accuracy (GRA) Scoring
   */
  private async scoreGrammaticalRange(aiCorrectedText?: string): Promise<number> {
    let score = 6.0;

    if (aiCorrectedText) {
      // Compare original with AI-corrected text
      const errorCount = this.countGrammarErrors(aiCorrectedText);
      
      // Fewer errors = higher score
      if (errorCount === 0) {
        score = 8.0;
      } else if (errorCount <= 2) {
        score = 7.5;
      } else if (errorCount <= 5) {
        score = 7.0;
      } else if (errorCount <= 10) {
        score = 6.0;
      } else if (errorCount <= 20) {
        score = 5.0;
      } else {
        score = 4.0;
      }
    } else {
      // Without AI, use simple heuristics
      // Check for common grammar mistakes
      const commonErrors = this.detectCommonGrammarErrors();
      score = Math.max(4.0, 6.0 - commonErrors * 0.5);
    }

    // Check sentence variety
    const sentenceVariety = this.calculateSentenceVariety();
    if (sentenceVariety > 0.7) {
      score += 0.5;
    } else if (sentenceVariety < 0.3) {
      score -= 0.5;
    }

    return Math.min(9.0, Math.max(4.0, score));
  }

  private countGrammarErrors(correctedText: string): number {
    // Simple diff approach: count character differences
    const original = this.essay.replace(/\s+/g, " ").trim();
    const corrected = correctedText.replace(/\s+/g, " ").trim();
    
    let differences = 0;
    const maxLength = Math.max(original.length, corrected.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (original[i] !== corrected[i]) {
        differences++;
      }
    }

    // Normalize by text length
    return Math.round(differences / Math.max(original.length, 1) * 100);
  }

  private detectCommonGrammarErrors(): number {
    let errors = 0;
    const essayLower = this.essay.toLowerCase();

    // Check for common errors
    const errorPatterns = [
      /\bi\b(?!\s+am)/g, // "I" not followed by "am"
      /\ba\b(?=\s+[aeiou])/g, // "a" before vowel
      /\bthere\s+are\s+a\b/g, // "there are a"
      /\bwas\s+were\b/g, // subject-verb agreement
      /\bwere\s+was\b/g,
      /\bdon't\s+has\b/g,
      /\bdoesn't\s+have\b/g,
    ];

    errorPatterns.forEach(pattern => {
      const matches = essayLower.match(pattern);
      if (matches) {
        errors += matches.length;
      }
    });

    return errors;
  }

  private calculateSentenceVariety(): number {
    const sentences = this.essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    // Calculate standard deviation
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Higher stdDev relative to avg = more variety
    return Math.min(1, stdDev / avgLength);
  }

  /**
   * Calculate overall band score from the 4 criteria
   */
  private calculateOverallBand(tr: number, cc: number, lr: number, gra: number): number {
    const average = (tr + cc + lr + gra) / 4;
    
    // Round to nearest 0.5
    return Math.round(average * 2) / 2;
  }

  /**
   * Generate AI prompts for the scoring engine
   */
  static generateAIPrompts(prompt: string, essay: string): AIPrompts {
    return {
      extractKeywords: `Extract the main keywords (nouns and verbs) from this IELTS prompt: "${prompt}". Return as a comma-separated list.`,
      suggestAlternatives: `Analyze this IELTS essay and identify 3-5 basic or informal words. For each, suggest 2-3 C1/C2 level academic alternatives. Essay: "${essay}". Format as JSON: [{"word": "...", "alternatives": [...]}]`,
      correctGrammar: `Correct all grammatical errors in this IELTS essay. Keep the meaning the same but fix grammar, punctuation, and sentence structure. Essay: "${essay}"`
    };
  }
}

export default IELTSScoringEngine;
