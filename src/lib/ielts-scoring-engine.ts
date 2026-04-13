// IELTS Hybrid Scoring Engine
// Implements the 4 official IELTS Band Descriptors (TR, CC, LR, GRA)
// Combines JS heuristics with LanguageTool API for accurate scoring

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
    averageWordLength: number;
    grammarMatches: LanguageToolMatch[];
  };
}

export interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  context: {
    text: string;
    offset: number;
    length: number;
  };
  replacements: Array<{ value: string }>;
  rule: {
    id: string;
    description: string;
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
  async score(): Promise<ScoringResult> {
    // Fetch grammar errors from LanguageTool API
    const grammarMatches = await this.fetchLanguageToolErrors();
    
    const tr = this.scoreTaskResponse();
    const cc = this.scoreCoherenceCohesion();
    const lr = this.scoreLexicalResource();
    const gra = this.scoreGrammaticalRange(grammarMatches);

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
        averageWordLength: this.calculateAverageWordLength(),
        grammarMatches,
      }
    };
  }

  /**
   * Fetch grammar errors from LanguageTool API
   */
  private async fetchLanguageToolErrors(): Promise<LanguageToolMatch[]> {
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: this.essay,
          language: 'en-US',
        }),
      });

      if (!response.ok) {
        console.error('LanguageTool API error:', response.statusText);
        return [];
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('LanguageTool API fetch error:', error);
      return [];
    }
  }

  /**
   * Task Response (TR) Scoring
   * Baseline: 6.0
   * +0.5 if word count > 260
   * -1.0 if word count < 250
   */
  private scoreTaskResponse(): number {
    let score = 6.0; // Baseline score

    const wordCount = this.getWordCount();
    const minWords = this.taskType === "task1" ? 150 : 250;
    
    // Word count adjustments
    if (wordCount < minWords) {
      score -= 1.0;
    } else if (wordCount > 260) {
      score += 0.5;
    }

    // Keyword matching - check if essay addresses the prompt
    const keywordMatch = this.calculateKeywordMatch();
    if (keywordMatch > 0.7) {
      score += 0.5;
    }

    return Math.min(9.0, Math.max(0.0, score));
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
   * Baseline: 6.0
   * +1.0 if between 5 and 10 transition words
   * -0.5 if > 15 (spamming) or < 4
   */
  private scoreCoherenceCohesion(): number {
    let score = 6.0; // Baseline score

    const transitionWordCount = this.getTransitionWordCount();
    
    // Transition word adjustments
    if (transitionWordCount >= 5 && transitionWordCount <= 10) {
      score += 1.0;
    } else if (transitionWordCount > 15 || transitionWordCount < 4) {
      score -= 0.5;
    }

    return Math.min(9.0, Math.max(0.0, score));
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
   * Baseline: 6.0
   * +1.0 if average word length is high
   * -0.5 ONLY if the SAME word is repeated more than 5 times (excluding stop words)
   */
  private scoreLexicalResource(): number {
    let score = 6.0; // Baseline score

    // Average word length check
    const avgWordLength = this.calculateAverageWordLength();
    if (avgWordLength > 5) {
      score += 1.0;
    }

    // Word repetition check (only penalize if SAME word > 5 times, excluding stop words)
    const repeatedWords = this.detectRepeatedWords();
    if (repeatedWords.length > 0) {
      // Check if any word is repeated more than 5 times
      const hasOverRepeated = repeatedWords.some(word => {
        const wordCount = this.essay.toLowerCase().split(/\s+/).filter(w => w === word).length;
        return wordCount > 5;
      });
      if (hasOverRepeated) {
        score -= 0.5;
      }
    }

    return Math.min(9.0, Math.max(0.0, score));
  }

  private calculateAverageWordLength(): number {
    const words = this.essay.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return totalLength / words.length;
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

  /**
   * Grammatical Range and Accuracy (GRA) Scoring
   * Baseline: 8.0
   * Subtract 0.5 for every 3 grammar errors
   * Cap minimum at 4.0 and maximum at 9.0
   */
  private scoreGrammaticalRange(grammarMatches: LanguageToolMatch[]): number {
    let score = 8.0; // Baseline score

    // Count grammar errors from LanguageTool
    const errorCount = grammarMatches.length;
    
    // Subtract 0.5 for every 3 grammar errors
    const penalty = Math.floor(errorCount / 3) * 0.5;
    score -= penalty;

    // Cap between 4.0 and 9.0
    return Math.min(9.0, Math.max(4.0, score));
  }

  /**
   * Calculate overall band score from the 4 criteria
   */
  private calculateOverallBand(tr: number, cc: number, lr: number, gra: number): number {
    const average = (tr + cc + lr + gra) / 4;
    
    // Round to nearest 0.5
    return Math.round(average * 2) / 2;
  }
}

export default IELTSScoringEngine;
