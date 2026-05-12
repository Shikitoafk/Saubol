/**
 * SAT Logic Engine v2.0
 * Improved scoring, realistic admissions, and intelligent study planning.
 */

export interface TopicStats {
  topic: string;
  section: 'Math' | 'RW';
  accuracy: number;
}

export interface StudyDay {
  day: string;
  topic: string;
  subtopic: string;
  questions: number;
  completed: boolean;
  type: 'practice' | 'test' | 'review';
}

export interface StudyPlan {
  week: number;
  schedule: StudyDay[];
  estimatedImprovement: number;
  focusTopics: string[];
}

const TOPICS = {
  Math: [
    { name: 'Algebra', subtopics: ['Linear Equations', 'Systems of Equations', 'Linear Inequalities'] },
    { name: 'Advanced Math', subtopics: ['Quadratic Equations', 'Exponential Functions', 'Polynomials'] },
    { name: 'Problem Solving & Data Analysis', subtopics: ['Ratios & Proportions', 'Probability', 'Statistical Inference'] },
    { name: 'Geometry & Trigonometry', subtopics: ['Right Triangles', 'Circles', 'Volume & Surface Area'] }
  ],
  RW: [
    { name: 'Craft & Structure', subtopics: ['Vocabulary in Context', 'Text Structure', 'Cross-Text Connections'] },
    { name: 'Information & Ideas', subtopics: ['Central Ideas', 'Textual Evidence', 'Inferences'] },
    { name: 'Standard English Conventions', subtopics: ['Boundaries', 'Form/Structure/Punctuation'] },
    { name: 'Expression of Ideas', subtopics: ['Transitions', 'Rhetorical Synthesis'] }
  ]
};

/**
 * Weighted scoring for diagnostic (20 questions)
 * Easy: 1.0x, Medium: 1.5x, Hard: 2.0x
 */
export function calculateDiagnosticScore(answers: { correct: boolean; section: 'Math' | 'RW'; topic: string; difficulty: 'Easy' | 'Medium' | 'Hard' }[]) {
  const calculateSection = (section: 'Math' | 'RW') => {
    const sectionAnswers = answers.filter(a => a.section === section);
    let totalWeight = 0;
    let earnedWeight = 0;

    sectionAnswers.forEach(a => {
      const weight = a.difficulty === 'Hard' ? 2.0 : a.difficulty === 'Medium' ? 1.5 : 1.0;
      totalWeight += weight;
      if (a.correct) earnedWeight += weight;
    });

    const ratio = earnedWeight / Math.max(1, totalWeight);
    // Base 200, scale to 800
    return 200 + Math.round(ratio * 600);
  };

  const mathScore = calculateSection('Math');
  const rwScore = calculateSection('RW');

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

  const weakTopics = performancePerTopic.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map(t => t.topic);
  const strongTopics = performancePerTopic.sort((a, b) => b.accuracy - a.accuracy).slice(0, 2).map(t => t.topic);

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
 * Intelligent Study Plan Generator
 * Week 1: 70% Weakest, 30% Second Weakest
 * Saturday: Practice Test, Sunday: Review
 */
export function generateStudyPlan(weakTopics: string[], strongTopics: string[]): StudyPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule: StudyDay[] = [];

  const focus1 = weakTopics[0] || 'Algebra';
  const focus2 = weakTopics[1] || 'Craft & Structure';

  days.forEach((day) => {
    if (day === 'Saturday') {
      schedule.push({ day, topic: 'Full Section', subtopic: 'Mixed Practice Test', questions: 54, completed: false, type: 'test' });
    } else if (day === 'Sunday') {
      schedule.push({ day, topic: 'Review', subtopic: 'Analysis of Incorrect Answers', questions: 0, completed: false, type: 'review' });
    } else {
      // 70% chance for primary focus (Mon, Tue, Wed, Fri), 30% for secondary (Thu)
      const isPrimary = ['Monday', 'Tuesday', 'Wednesday', 'Friday'].includes(day);
      const topic = isPrimary ? focus1 : focus2;
      
      // Find a subtopic
      const sectionTopics = [...TOPICS.Math, ...TOPICS.RW];
      const topicData = sectionTopics.find(t => t.name === topic);
      const subtopic = topicData ? topicData.subtopics[Math.floor(Math.random() * topicData.subtopics.length)] : 'General Practice';

      schedule.push({
        day,
        topic,
        subtopic,
        questions: isPrimary ? 25 : 15,
        completed: false,
        type: 'practice'
      });
    }
  });

  return {
    week: 1,
    schedule,
    estimatedImprovement: 15 + Math.round(weakTopics.length * 5),
    focusTopics: [focus1, focus2]
  };
}

/**
 * Realistic Admissions Probability Engine
 */
export function calculateAdmissionProbability(data: {
  sat: number;
  gpa: number;
  research?: boolean;
  olympiad?: boolean;
  company?: boolean;
  upwardTrend?: boolean;
  noExtracurriculars?: boolean;
  schoolRanking: number; // 1-100
}) {
  let baseChance = 0;
  let explanation: string[] = [];

  // Base rates for Kazakhstan applicants
  if (data.schoolRanking <= 10) baseChance = 5;
  else if (data.schoolRanking <= 30) baseChance = 15;
  else if (data.schoolRanking <= 50) baseChance = 25;
  else baseChance = 45;

  explanation.push(`Base international acceptance rate for Top ${data.schoolRanking}: ${baseChance}%`);

  // SAT Adjustments
  const schoolMedian = data.schoolRanking <= 10 ? 1550 : data.schoolRanking <= 30 ? 1520 : 1480;
  if (data.sat < schoolMedian) {
    const penalty = 10;
    baseChance -= penalty;
    explanation.push(`SAT ${data.sat} is below median (${schoolMedian}): -${penalty}%`);
  } else {
    const bonus = 5;
    baseChance += bonus;
    explanation.push(`SAT ${data.sat} is competitive: +${bonus}%`);
  }

  // GPA Adjustments
  if (data.gpa < 3.7) {
    baseChance -= 15;
    explanation.push(`GPA ${data.gpa} is significantly below target: -15%`);
  }

  // Factor Bonuses
  if (data.research) { baseChance += 15; explanation.push("Published research paper: +15%"); }
  if (data.olympiad) { baseChance += 10; explanation.push("International Olympiad medal: +10%"); }
  if (data.company) { baseChance += 8; explanation.push("Founded company with users: +8%"); }
  if (data.upwardTrend) { baseChance += 5; explanation.push("Strong upward GPA trend: +5%"); }

  // Factor Penalties
  if (data.noExtracurriculars) { baseChance -= 8; explanation.push("Missing extracurricular portfolio: -8%"); }

  // Clamp results
  const finalChance = Math.min(95, Math.max(2, baseChance));
  
  return {
    chance: finalChance,
    explanation,
    verdict: finalChance > 70 ? "Strong Candidate" : finalChance > 40 ? "Competitive" : "Reach / Long Shot"
  };
}

/**
 * Exam Readiness Logic
 */
export function calculateExamReadiness(accuracy: number, consistency: number, diagnosticScore: number) {
  // accuracy (0-100), consistency (0-100), diagnosticScore (400-1600)
  const scoreWeight = ((diagnosticScore - 400) / 1200) * 50; // Max 50 pts
  const accuracyWeight = (accuracy / 100) * 30; // Max 30 pts
  const consistencyWeight = (consistency / 100) * 20; // Max 20 pts
  
  return Math.min(100, Math.round(scoreWeight + accuracyWeight + consistencyWeight));
}
