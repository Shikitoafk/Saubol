/**
 * SAT Logic Engine v3.0
 * Mastery, Intelligent Study Planning, and Adaptive Scoring.
 */

export interface TopicMastery {
  topic: string;
  accuracy: number;
  questionsAnswered: number;
  level: 'Easy' | 'Medium' | 'Hard';
}

export interface StudyDay {
  day: string;
  topic: string;
  subtopic: string;
  questions: number;
  estimatedTime: string; // e.g. "45 min"
  target: string;
  completed: boolean;
  type: 'practice' | 'test' | 'review' | 'timed';
}

export interface WeeklyPlan {
  week: number;
  title: string;
  schedule: StudyDay[];
  objective: string;
}

/**
 * Determines if a user can unlock a specific difficulty level.
 * Rule: User cannot advance to Hard until they hit 70% accuracy on Medium for that topic.
 */
export function canUnlockLevel(accuracy: number, currentLevel: string): boolean {
  if (currentLevel === 'Easy' && accuracy >= 60) return true;
  if (currentLevel === 'Medium' && accuracy >= 70) return true;
  return false;
}

/**
 * Generates an 8-week intelligent study plan.
 */
export function generateIntelligentPlan(weekNum: number, weakTopics: string[]): WeeklyPlan {
  const schedule: StudyDay[] = [];

  // Safety check for weakTopics
  const safeWeakTopics = (weakTopics && weakTopics.length > 0) ? weakTopics : ['Algebra', 'Information & Ideas'];
  const primaryFocus = safeWeakTopics?.[0];
  const secondaryFocus = safeWeakTopics?.[1] || safeWeakTopics?.[0];

  let title = "";
  let objective = "";

  if (weekNum === 1) {
    title = "Diagnostic & Baseline";
    objective = "Establish your base score and start mastering foundational grammar and algebra.";
    
    schedule.push({ day: 'Monday', topic: 'Full Diagnostic', subtopic: 'Initial Assessment', questions: 40, estimatedTime: "60 min", target: "Complete all sections", completed: false, type: 'test' });
    schedule.push({ day: 'Tuesday', topic: 'Linear Equations', subtopic: 'Algebra Fundamentals', questions: 15, estimatedTime: "30 min", target: "Slope-intercept & equations", completed: false, type: 'practice' });
    schedule.push({ day: 'Wednesday', topic: 'Punctuation Rules', subtopic: 'Grammar Boundaries', questions: 15, estimatedTime: "30 min", target: "Commas, Semicolons & Colons", completed: false, type: 'practice' });
    schedule.push({ day: 'Thursday', topic: 'Systems of Equations', subtopic: 'Algebra Systems', questions: 15, estimatedTime: "30 min", target: "Substitution & Elimination", completed: false, type: 'practice' });
    schedule.push({ day: 'Friday', topic: 'Transitions', subtopic: 'Expression of Ideas', questions: 15, estimatedTime: "30 min", target: "Contrast & Cause-effect transitions", completed: false, type: 'practice' });
    schedule.push({ day: 'Saturday', topic: 'Weekly Assessment', subtopic: 'Timed Foundations', questions: 20, estimatedTime: "30 min", target: "Goal: 70%+ accuracy", completed: false, type: 'timed' });
    schedule.push({ day: 'Sunday', topic: 'Strategic Review', subtopic: 'Mistake Protocol Analysis', questions: 0, estimatedTime: "25 min", target: "Analyze every incorrect answer", completed: false, type: 'review' });

  } else if (weekNum >= 2 && weekNum <= 4) {
    title = "Intensive Focus Phase";
    objective = "70% focus on weak areas, 30% on mixed retention drills.";
    
    schedule.push({ day: 'Monday', topic: primaryFocus, subtopic: 'Intensive Practice', questions: 25, estimatedTime: "45 min", target: "Goal: 80% accuracy", completed: false, type: 'practice' });
    schedule.push({ day: 'Tuesday', topic: 'Central Ideas', subtopic: 'Reading Comprehension', questions: 15, estimatedTime: "35 min", target: "Analyze passage arguments", completed: false, type: 'practice' });
    schedule.push({ day: 'Wednesday', topic: secondaryFocus, subtopic: 'Intensive Drill', questions: 25, estimatedTime: "45 min", target: "Goal: 80% accuracy", completed: false, type: 'practice' });
    schedule.push({ day: 'Thursday', topic: 'Quadratic Equations', subtopic: 'Advanced Nonlinear Math', questions: 15, estimatedTime: "35 min", target: "Factoring & quadratic formula", completed: false, type: 'practice' });
    schedule.push({ day: 'Friday', topic: 'Transitions & Boundaries', subtopic: 'Standard English', questions: 20, estimatedTime: "40 min", target: "Speed and punctuation rules", completed: false, type: 'practice' });
    schedule.push({ day: 'Saturday', topic: 'Timed Module', subtopic: 'RW or Math Focus', questions: 27, estimatedTime: "35 min", target: "Real SAT timing", completed: false, type: 'timed' });
    schedule.push({ day: 'Sunday', topic: 'Analysis & Log', subtopic: 'Review Mistakes', questions: 0, estimatedTime: "45 min", target: "No more than 2 repeat errors", completed: false, type: 'review' });

  } else if (weekNum >= 5 && weekNum <= 6) {
    title = "Timing & Strategy";
    objective = "Master pacing under strict Digital SAT conditions.";
    
    schedule.push({ day: 'Monday', topic: 'Speed Drills', subtopic: 'Reading & Writing Focus', questions: 30, estimatedTime: "40 min", target: "Goal: 80% accuracy", completed: false, type: 'practice' });
    schedule.push({ day: 'Tuesday', topic: 'Desmos Masterclass', subtopic: 'Math Shortcut Tricks', questions: 20, estimatedTime: "35 min", target: "Solve in under 30 seconds", completed: false, type: 'practice' });
    schedule.push({ day: 'Wednesday', topic: 'Inference Passage', subtopic: 'Information & Ideas', questions: 15, estimatedTime: "35 min", target: "Identify text implications", completed: false, type: 'practice' });
    schedule.push({ day: 'Thursday', topic: 'Grammar boundaries', subtopic: 'Punctuation boundary speed', questions: 25, estimatedTime: "30 min", target: "Goal: 95% accuracy", completed: false, type: 'practice' });
    schedule.push({ day: 'Friday', topic: 'Geometry & Trig', subtopic: 'Circles & Triangles', questions: 20, estimatedTime: "35 min", target: "Master formulas & trig ratios", completed: false, type: 'practice' });
    schedule.push({ day: 'Saturday', topic: 'Full Module', subtopic: 'Timed Simulation', questions: 54, estimatedTime: "70 min", target: "Perfect timing management", completed: false, type: 'timed' });
    schedule.push({ day: 'Sunday', topic: 'Pacing Analysis', subtopic: 'Mistake Log Audit', questions: 0, estimatedTime: "45 min", target: "Review time-drained questions", completed: false, type: 'review' });

  } else {
    title = "Final Polish";
    objective = "Full practice tests + targeted high-ROI reviews.";
    
    schedule.push({ day: 'Monday', topic: 'Hard Questions Drill', subtopic: 'Algebra & Inference', questions: 20, estimatedTime: "40 min", target: "Zero concept gaps remaining", completed: false, type: 'practice' });
    schedule.push({ day: 'Tuesday', topic: 'Command of Evidence', subtopic: 'Textual analysis speed', questions: 15, estimatedTime: "30 min", target: "Match claims with exact proof", completed: false, type: 'practice' });
    schedule.push({ day: 'Wednesday', topic: 'Nonlinear Functions', subtopic: 'Graphs and Parabolas', questions: 20, estimatedTime: "35 min", target: "Identify intercepts and vertexes", completed: false, type: 'practice' });
    schedule.push({ day: 'Thursday', topic: 'Rhetorical Synthesis', subtopic: 'Note combination speedrun', questions: 25, estimatedTime: "30 min", target: "Goal: Perfect score on notes Qs", completed: false, type: 'practice' });
    schedule.push({ day: 'Friday', topic: 'Vocabulary Prep', subtopic: 'Quizlet Deck Review', questions: 0, estimatedTime: "30 min", target: "Review 100+ SAT words", completed: false, type: 'review' });
    schedule.push({ day: 'Saturday', topic: 'Full Practice Test', subtopic: 'Digital SAT Simulation', questions: 98, estimatedTime: "134 min", target: "Target Score: +50 from baseline", completed: false, type: 'test' });
    schedule.push({ day: 'Sunday', topic: 'Targeted Review', subtopic: 'Last Weak Spots', questions: 20, estimatedTime: "40 min", target: "Zero conceptual errors", completed: false, type: 'review' });
  }

  return { week: weekNum, title, schedule, objective };
}

/**
 * Calculates SAT score based on performance.
 */
export function calculateWeightedScore(answers: { correct: boolean; difficulty: string; section: 'Math' | 'RW' }[]) {
  // Safety check
  if (!answers || answers.length === 0) return { math: 200, rw: 200, total: 400 };

  const calculateSection = (section: 'Math' | 'RW') => {
    const sectionAnswers = answers.filter(a => a.section === section);
    if (sectionAnswers.length === 0) return 200;

    let totalWeight = 0;
    let earnedWeight = 0;

    sectionAnswers.forEach(a => {
      const weight = a.difficulty === 'Hard' ? 2.0 : a.difficulty === 'Medium' ? 1.5 : 1.0;
      totalWeight += weight;
      if (a.correct) earnedWeight += weight;
    });

    const ratio = earnedWeight / Math.max(1, totalWeight);
    return 200 + Math.round(ratio * 600);
  };

  const math = calculateSection('Math');
  const rw = calculateSection('RW');
  return { math, rw, total: math + rw };
}

/**
 * Calculates exam readiness index (0-100).
 */
export function calculateExamReadiness(accuracy: number, consistency: number, score: number): number {
  const scoreWeight = ((score - 400) / 1200) * 100;
  const readiness = (accuracy * 0.4) + (Math.min(consistency, 100) * 0.2) + (scoreWeight * 0.4);
  return Math.min(Math.round(readiness), 99);
}
