/**
 * SAT Question Bank - Khan Academy Style
 * Structured by topic and difficulty
 */

export interface SATQuestion {
  id: string;
  topic: string;
  category: string;
  section: 'Math' | 'RW';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passage?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  wrongExplanations: string[]; // WHY wrong answers are wrong
}

export const SAT_QUESTIONS_BANK: Record<string, SATQuestion[]> = {
  "Linear Equations": [
    {
      id: "m-lin-e1",
      topic: "Linear Equations",
      category: "Algebra",
      section: "Math",
      difficulty: "Easy",
      question: "If $2x + 5 = 15$, what is the value of $x$?",
      options: ["5", "10", "20", "5.5"],
      correctAnswer: 0,
      explanation: "Step 1: Subtract 5 from both sides: $2x = 10$. Step 2: Divide by 2: $x = 5$.",
      wrongExplanations: [
        "Result of $15-5=10$ but forgot to divide by 2.",
        "Result of $15+5=20$ (added instead of subtracted).",
        "Calculation error."
      ]
    },
    {
      id: "m-lin-e2",
      topic: "Linear Equations",
      category: "Algebra",
      section: "Math",
      difficulty: "Medium",
      question: "A taxi service charges a flat fee of $3.00 plus $1.50 per mile. If a passenger was charged $15.00, how many miles did they travel?",
      options: ["8", "10", "12", "6"],
      correctAnswer: 0,
      explanation: "Let $m$ be miles. $1.5m + 3 = 15$. Subtract 3: $1.5m = 12$. Divide by 1.5: $m = 8$.",
      wrongExplanations: [
        "Divided 15 by 1.5 without subtracting the fee.",
        "Calculation error.",
        "Subtracted 1.5 instead of 3."
      ]
    },
    {
      id: "m-lin-e3",
      topic: "Linear Equations",
      category: "Algebra",
      section: "Math",
      difficulty: "Hard",
      question: "For what value of $a$ will the equation $3(2x - a) = 6x + 12$ have infinitely many solutions?",
      options: ["-4", "4", "0", "No such value"],
      correctAnswer: 0,
      explanation: "Expand the left side: $6x - 3a = 6x + 12$. For infinite solutions, both sides must be identical. $6x = 6x$ is already true. Therefore, $-3a = 12$. Divide by -3: $a = -4$.",
      wrongExplanations: [
        "Mistake in distributing or sign error ($3a=12$).",
        "Assuming $a$ must be 0 for matching coefficients.",
        "Incorrectly assuming no solutions."
      ]
    }
  ],
  "Systems of Equations": [
    {
      id: "m-sys-e1",
      topic: "Systems of Equations",
      category: "Algebra",
      section: "Math",
      difficulty: "Medium",
      question: "What is the solution $(x, y)$ to the system below?\n$x + y = 10$\n$x - y = 4$",
      options: ["(7, 3)", "(6, 4)", "(8, 2)", "(5, 5)"],
      correctAnswer: 0,
      explanation: "Add the two equations: $(x+y) + (x-y) = 10 + 4 \\Rightarrow 2x = 14 \\Rightarrow x = 7$. Substitute $x=7$ into $x+y=10$: $7+y=10 \\Rightarrow y = 3$.",
      wrongExplanations: [
        "Matches $x+y=10$ but not $x-y=4$.",
        "Common subtraction error.",
        "Matches neither equation correctly."
      ]
    }
  ],
  "Central Ideas": [
    {
      id: "rw-ci-e1",
      topic: "Central Ideas",
      category: "Information & Ideas",
      section: "RW",
      difficulty: "Medium",
      passage: "The migration patterns of the monarch butterfly are among the most spectacular in the insect world. Every autumn, millions of monarchs fly from Canada and the United States to overwintering sites in central Mexico. This multi-generational journey requires precise biological timing and navigational skills that scientists are still working to fully understand. While many individual butterflies perish along the way, the species persists through a complex cycle of reproduction and migration that ensures the population returns north each spring.",
      question: "Which choice best summarizes the main idea of the passage?",
      options: [
        "The monarch butterfly's migration is a complex, multi-generational process that is essential for species survival.",
        "Scientists have discovered exactly how monarch butterflies navigate to Mexico each year.",
        "Individual monarch butterflies are capable of traveling thousands of miles without dying.",
        "The overwintering sites in central Mexico are the only places where monarch butterflies can survive the winter."
      ],
      correctAnswer: 0,
      explanation: "The passage discusses the scale, complexity, and importance of the migration for the species as a whole, matching choice A.",
      wrongExplanations: [
        "Too extreme/incorrect: The text says scientists are *still working* to understand navigation.",
        "Incorrect detail: The text mentions many individuals *perish*.",
        "Too narrow: Focuses only on the sites, not the migration process described."
      ]
    }
  ],
  "Transitions": [
    {
      id: "rw-tr-e1",
      topic: "Transitions",
      category: "Standard English Conventions",
      section: "RW",
      difficulty: "Easy",
      passage: "The novel was criticized for its slow pacing and underdeveloped characters. ________, it became a massive commercial success and was eventually adapted into a major motion picture.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Nevertheless", "Furthermore", "Therefore", "Similarly"],
      correctAnswer: 0,
      explanation: "The first sentence is negative (criticism), and the second is positive (success). 'Nevertheless' is the correct contrast transition.",
      wrongExplanations: [
        "Incorrect: Used for adding similar information, but these sentences contrast.",
        "Incorrect: Used for cause-effect, but failure usually doesn't *cause* success.",
        "Incorrect: Used for comparison, but these are contrasting states."
      ]
    }
  ]
};
