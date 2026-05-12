import { SAT_QUESTION_BANK } from "@/data/sat-questions";

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
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule: StudyDay[] = [];

  // Safety check for weakTopics
  const safeWeakTopics = (weakTopics && weakTopics.length > 0) ? weakTopics : ['Algebra', 'Information & Ideas'];
  const primaryFocus = safeWeakTopics?.[0];
  const secondaryFocus = safeWeakTopics?.[1] || safeWeakTopics?.[0];

  let title = "";
  let objective = "";

  if (weekNum === 1) {
    title = "Diagnostic Phase";
    objective = "Identify top 3 weak topics and establish baseline.";
    days.forEach(day => {
      if (day === 'Monday') {
        schedule.push({ day, topic: 'Full Diagnostic', subtopic: 'Initial Assessment', questions: 40, estimatedTime: "60 min", target: "Complete all sections", completed: false, type: 'test' });
      } else {
        schedule.push({ day, topic: 'Review', subtopic: 'Diagnostic Analysis', questions: 0, estimatedTime: "30 min", target: "Review every wrong answer", completed: false, type: 'review' });
      }
    });
  } else if (weekNum >= 2 && weekNum <= 4) {
    title = "Intensive Focus Phase";
    objective = "70% focus on weakest topics, 30% on review.";
    days.forEach(day => {
      const isFocused = ['Monday', 'Wednesday', 'Friday'].includes(day);
      const isMixed = ['Tuesday', 'Thursday'].includes(day);
      
      if (isFocused) {
        schedule.push({ day, topic: primaryFocus, subtopic: 'Intensive Practice', questions: 25, estimatedTime: "45 min", target: "Goal: 80% accuracy", completed: false, type: 'practice' });
      } else if (isMixed) {
        schedule.push({ day, topic: 'Mixed Review', subtopic: 'Retention Check', questions: 15, estimatedTime: "30 min", target: "Goal: Maintain 70% accuracy", completed: false, type: 'practice' });
      } else if (day === 'Saturday') {
        schedule.push({ day, topic: 'Timed Module', subtopic: 'RW or Math Focus', questions: 27, estimatedTime: "35 min", target: "Real SAT timing", completed: false, type: 'timed' });
      } else {
        schedule.push({ day, topic: 'Analysis', subtopic: 'Review Mistakes', questions: 0, estimatedTime: "45 min", target: "No more than 2 repeat errors", completed: false, type: 'review' });
      }
    });
  } else if (weekNum >= 5 && weekNum <= 6) {
    title = "Timing & Strategy";
    objective = "Simulate real SAT timing (32m RW, 35m Math).";
    days.forEach(day => {
      if (day === 'Saturday') {
        schedule.push({ day, topic: 'Full Module', subtopic: 'Timed Simulation', questions: 54, estimatedTime: "70 min", target: "Perfect timing management", completed: false, type: 'timed' });
      } else {
        schedule.push({ day, topic: 'Mixed Practice', subtopic: 'Speed Drills', questions: 30, estimatedTime: "45 min", target: "80% accuracy under pressure", completed: false, type: 'practice' });
      }
    });
  } else {
    title = "Final Polish";
    objective = "Full practice tests + targeted final review.";
    days.forEach(day => {
      if (day === 'Saturday') {
        schedule.push({ day, topic: 'Full Practice Test', subtopic: 'Digital SAT Simulation', questions: 98, estimatedTime: "134 min", target: "Target Score: +50 from baseline", completed: false, type: 'test' });
      } else {
        schedule.push({ day, topic: 'Targeted Review', subtopic: 'Last Weak Spots', questions: 20, estimatedTime: "40 min", target: "Zero conceptual errors", completed: false, type: 'review' });
      }
    });
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
