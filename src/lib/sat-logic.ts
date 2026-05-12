/**
 * SAT Logic Engine
 * Handles scoring calculations, study plan generation, and performance analysis.
 */

export interface TopicStats {
  topic: string;
  section: 'Math' | 'RW';
  accuracy: number;
}

export interface StudyDay {
  day: string;
  topic: string;
  questions: number;
  completed: boolean;
}

export interface StudyPlan {
  week: number;
  schedule: StudyDay[];
  estimatedImprovement: number;
}

const TOPICS = {
  Math: ['Algebra', 'Advanced Math', 'Problem Solving & Data Analysis', 'Geometry & Trigonometry'],
  RW: ['Craft & Structure', 'Information & Ideas', 'Standard English Conventions', 'Expression of Ideas']
};

/**
 * Calculates SAT score based on diagnostic performance (20 questions total)
 * Scaled from 400 to 1600.
 * In a real SAT, 20 questions is a small sample, so we extrapolate.
 */
export function calculateDiagnosticScore(answers: { correct: boolean; section: 'Math' | 'RW'; topic: string }[]) {
  const mathAnswers = answers.filter(a => a.section === 'Math');
  const rwAnswers = answers.filter(a => a.section === 'RW');

  const mathCorrect = mathAnswers.filter(a => a.correct).length;
  const rwCorrect = rwAnswers.filter(a => a.correct).length;

  // Simple extrapolation for 20 questions (10 Math, 10 RW)
  // Max possible per section in real SAT is 800.
  // Base score is 200 per section.
  const mathScore = 200 + Math.round((mathCorrect / Math.max(1, mathAnswers.length)) * 600);
  const rwScore = 200 + Math.round((rwCorrect / Math.max(1, rwAnswers.length)) * 600);

  const topics = [...new Set(answers.map(a => a.topic))];
  const performancePerTopic = topics.map(topic => {
    const topicAnswers = answers.filter(a => a.topic === topic);
    const correct = topicAnswers.filter(a => a.correct).length;
    return {
      topic,
      section: topicAnswers[0].section,
      accuracy: (correct / topicAnswers.length) * 100
    };
  });

  const weakTopics = performancePerTopic.filter(t => t.accuracy < 70).map(t => t.topic);
  const strongTopics = performancePerTopic.filter(t => t.accuracy >= 70).map(t => t.topic);

  return {
    overallScore: mathScore + rwScore,
    mathScore,
    rwScore,
    weakTopics,
    strongTopics,
    performancePerTopic
  };
}

/**
 * Generates a weekly study plan based on weak topics.
 */
export function generateStudyPlan(weakTopics: string[], strongTopics: string[]): StudyPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule: StudyDay[] = [];

  // Mix weak and strong topics, prioritizing weak ones
  const allTopics = [...weakTopics, ...strongTopics];
  if (allTopics.length === 0) {
    // Fallback if no data
    allTopics.push(...TOPICS.Math, ...TOPICS.RW);
  }

  days.forEach((day, index) => {
    // Weekend logic: Review or Rest
    if (day === 'Sunday') {
      schedule.push({ day, topic: 'Full Review', questions: 30, completed: false });
    } else if (day === 'Saturday') {
      schedule.push({ day, topic: 'Practice Test', questions: 50, completed: false });
    } else {
      // Pick a topic, rotate through weak ones first
      const topicIndex = index % Math.max(1, weakTopics.length);
      const topic = weakTopics.length > 0 ? weakTopics[topicIndex] : allTopics[index % allTopics.length];
      
      schedule.push({
        day,
        topic,
        questions: 20,
        completed: false
      });
    }
  });

  return {
    week: 1,
    schedule,
    estimatedImprovement: weakTopics.length * 15 // Roughly 15 points per weak topic targeted
  };
}

/**
 * Predicted score based on current accuracy trajectory.
 */
export function predictFutureScore(currentScore: number, accuracyTrend: number[]) {
  if (accuracyTrend.length < 2) return currentScore;
  
  const recentAccuracy = accuracyTrend[accuracyTrend.length - 1];
  const previousAccuracy = accuracyTrend[accuracyTrend.length - 2];
  
  const growthFactor = (recentAccuracy - previousAccuracy) / 100;
  const projectedScore = currentScore + (growthFactor * 200); // Max growth potential of 200 pts
  
  return Math.min(1600, Math.max(400, Math.round(projectedScore)));
}
