/**
 * SAT Study Roadmap - Proven Preparation Strategy
 * 5 Stages to 1550+
 */

export interface RoadmapVideo {
  title: string;
  videoId: string;
  url: string;
}

export interface RoadmapStage {
  stage: number;
  title: string;
  subtitle: string;
  duration: string;
  difficulty?: string;
  why: string;
  videos?: RoadmapVideo[];
  topics?: string[];
  subtopics?: {
    name: string;
    description: string;
    strategy: string;
    tip?: string;
    mustMemorize?: string[];
  }[];
  phases?: {
    name: string;
    duration: string;
    video?: RoadmapVideo;
    videos?: RoadmapVideo[];
    tip?: string;
    strategy?: string;
  }[];
  practiceTarget: string;
  masteryGoal?: string;
  tip?: string;
  mistakeProtocol?: string;
  dailyPractice?: string[];
  summerHabit?: string;
  vocabularyNote?: string;
  rule?: string;
  weeklySchedule?: string[];
  testSources?: string[];
  hardQuestions?: string;
  weekSummary?: string;
}

export const SAT_ROADMAP: RoadmapStage[] = [
  {
    stage: 1,
    title: "Grammar & Conventions",
    subtitle: "Fastest wins. Master these first.",
    duration: "3-4 days",
    difficulty: "Medium",
    why: "Grammar is rule-based. Once you learn the rules, you get these questions right every time. Highest ROI per hour.",
    videos: [
      { title: "Grammar Part 1", videoId: "hSCNS0PJnZg", url: "https://youtu.be/hSCNS0PJnZg" },
      { title: "Grammar Part 2", videoId: "WL61t23IOyE", url: "https://youtu.be/WL61t23IOyE" },
      { title: "Grammar Part 3", videoId: "-qK1rXOFFVI", url: "https://youtu.be/-qK1rXOFFVI" },
      { title: "Grammar Part 4", videoId: "-qK1rXOFFVI", url: "https://youtu.be/-qK1rXOFFVI" }
    ],
    topics: [
      "Punctuation rules (commas, semicolons, colons)",
      "Sentence boundaries",
      "Subject-verb agreement",
      "Pronoun agreement",
      "Modifier placement"
    ],
    practiceTarget: "Complete ALL grammar questions on OnePrepSAT (https://oneprep.app)",
    masteryGoal: "90%+ accuracy before moving to Stage 2",
    tip: "After watching each video, go to OnePrepSAT and do ALL grammar questions for that specific rule. Don't move on until you understand WHY each wrong answer is wrong."
  },
  {
    stage: 2,
    title: "Expression of Ideas",
    subtitle: "Quick to learn, just needs practice.",
    duration: "3-4 days",
    why: "Only 2 question types. Can be done in same week as Grammar.",
    subtopics: [
      {
        name: "Transitions",
        description: "However, therefore, thus, furthermore, etc.",
        strategy: "Memorize what each transition signals: contrast / addition / cause-effect / example. Then it's just matching.",
        mustMemorize: [
          "However / Nevertheless / Yet → CONTRAST",
          "Therefore / Thus / Consequently → CAUSE-EFFECT", 
          "Furthermore / Moreover / Additionally → ADDITION",
          "For example / For instance → EXAMPLE",
          "In other words / That is → CLARIFICATION"
        ]
      },
      {
        name: "Rhetorical Synthesis",
        description: "Student notes / bullet points questions",
        strategy: "Read the QUESTION first, not all the notes. The question tells you exactly what to look for. Only one answer will match the specific requirement asked.",
        tip: "You don't need to read all bullet points carefully. Find the one that matches what the question asks for."
      }
    ],
    practiceTarget: "Complete ALL Transitions + Rhetorical Synthesis on OnePrepSAT (https://oneprep.app)",
    weekSummary: "By end of Week 1: Grammar + Expression of Ideas = ~35% of SAT R&W section done and mastered."
  },
  {
    stage: 3,
    title: "Math: 750+",
    subtitle: "Desmos + targeted practice = 750 is very achievable",
    duration: "1-2 weeks",
    why: "Desmos + targeted practice = 750 is very achievable.",
    phases: [
      {
        name: "Phase A: Master Desmos first",
        duration: "2-3 days",
        video: {
          title: "Desmos Guide for SAT",
          videoId: "e-O4nwVHQ-Y",
          url: "https://youtu.be/e-O4nwVHQ-Y"
        },
        tip: "Desmos can solve many SAT math problems in 10 seconds. Learn it before anything else. Start with easy questions, use Desmos on everything to build the habit."
      },
      {
        name: "Phase B: Remaining Math Topics",
        duration: "1 week",
        videos: [
          { title: "Trigonometry", videoId: "u6LL3Pbo3HI", url: "https://youtu.be/u6LL3Pbo3HI" },
          { title: "Geometry", videoId: "f315tX5MYYE", url: "https://youtu.be/f315tX5MYYE" },
          { title: "Advanced Algebra", videoId: "rytygT3oFO4", url: "https://youtu.be/rytygT3oFO4" },
          { title: "Advanced Math", videoId: "wThmYHwbOVo", url: "https://youtu.be/wThmYHwbOVo" }
        ],
        strategy: "Watch video for topic → immediately go to OnePrepSAT and complete ALL questions for that topic → analyze every mistake"
      }
    ],
    practiceTarget: "Complete ALL math modules on OnePrepSAT (https://oneprep.app)",
    mistakeProtocol: "Every wrong answer: figure out EXACTLY why you got it wrong before moving on. Was it a concept gap? Careless error? Time pressure? Different fixes for each."
  },
  {
    stage: 4,
    title: "Reading: Information & Ideas + Craft & Structure",
    subtitle: "The hardest part. Takes the most time. Start early.",
    duration: "May → July (entire summer)",
    why: "This is not rule-based like grammar. It requires understanding, inference, and vocabulary. Cannot be rushed.",
    videos: [
      { title: "Information & Ideas Strategy", videoId: "-9z5qNcm3ck", url: "https://youtu.be/-9z5qNcm3ck" },
      { title: "Craft & Structure Strategy", videoId: "NBECQxDBQQs", url: "https://youtu.be/NBECQxDBQQs" }
    ],
    dailyPractice: [
      "Do reading questions on OnePrepSAT every single day",
      "Every unknown word from passages AND answer choices → add to Quizlet immediately",
      "SAT reuses vocabulary constantly — your Quizlet deck grows into a cheat sheet"
    ],
    summerHabit: "Consume English content daily: read articles, watch shows in English without subtitles. Your brain needs to think in English naturally.",
    vocabularyNote: "Build a Quizlet deck of SAT vocabulary. Add words from: passage texts, wrong answer choices, correct answer choices. After 2 months you will start recognizing the same words repeatedly.",
    practiceTarget: "Daily reading practice on OnePrepSAT (https://oneprep.app)"
  },
  {
    stage: 5,
    title: "August: Pure Test Mode",
    subtitle: "Stop learning. Start testing.",
    duration: "4 weeks before exam",
    why: "Stop learning. Start testing.",
    rule: "No more topic study. Only full timed tests.",
    weeklySchedule: [
      "1-2 full practice tests per week",
      "Strict timing — phone away, real conditions",
      "After each test: analyze EVERY wrong answer deeply",
      "Keep reviewing Grammar and Math weekly so you don't forget"
    ],
    testSources: [
      "Bluebook (official College Board app) — use these first",
      "Past SAT papers",
      "OnePrepSAT full tests (https://oneprep.app)"
    ],
    hardQuestions: "Pull the hardest questions from your mistake log and redo them. If you're still missing the same type — go back to that topic for 1 day, then return to test mode.",
    practiceTarget: "OnePrepSAT Full Length Tests"
  }
];
