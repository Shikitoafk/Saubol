/**
 * SAT Lesson Content - Official Blueprint Alignment
 */

export interface LessonConcept {
  title: string;
  description: string;
  example?: string; // KaTeX supported
}

export interface SATLesson {
  id: string;
  topic: string;
  category: string;
  section: 'Math' | 'RW';
  readTime: string;
  concepts: LessonConcept[];
  commonMistakes: string[];
  workedExample: {
    question: string;
    solution: string;
  };
}

export const SAT_LESSONS: SATLesson[] = [
  {
    id: "m-lin-eq",
    topic: "Linear Equations",
    category: "Algebra",
    section: "Math",
    readTime: "4 min",
    concepts: [
      {
        title: "Slope-Intercept Form",
        description: "The most common form is $y = mx + b$, where $m$ is the slope (rise over run) and $b$ is the y-intercept.",
        example: "In $y = 3x - 5$, the slope is 3 and the line crosses the y-axis at (0, -5)."
      },
      {
        title: "Solving for X",
        description: "To solve a linear equation, perform the same operation on both sides to isolate the variable.",
        example: "$4x + 10 = 26 \\Rightarrow 4x = 16 \\Rightarrow x = 4$"
      }
    ],
    commonMistakes: [
      "Forgetting to flip the inequality sign when multiplying/dividing by a negative number.",
      "Misidentifying the y-intercept when the equation is not in $y=mx+b$ form."
    ],
    workedExample: {
      question: "If $5(x + 3) = 2x - 9$, what is the value of $x$?",
      solution: "1. Distribute: $5x + 15 = 2x - 9$\n2. Subtract $2x$ from both sides: $3x + 15 = -9$\n3. Subtract 15: $3x = -24$\n4. Divide by 3: $x = -8$"
    }
  },
  {
    id: "m-sys-eq",
    topic: "Systems of Equations",
    category: "Algebra",
    section: "Math",
    readTime: "5 min",
    concepts: [
      {
        title: "Substitution Method",
        description: "Solve one equation for a variable and substitute it into the other.",
        example: "If $y = 2x$ and $x + y = 6$, then $x + 2x = 6 \\Rightarrow 3x = 6 \\Rightarrow x = 2$."
      },
      {
        title: "Elimination Method",
        description: "Add or subtract equations to 'eliminate' one variable.",
        example: "Equation 1: $x + y = 10$, Equation 2: $x - y = 2$. Add them: $2x = 12 \\Rightarrow x = 6$."
      }
    ],
    commonMistakes: [
      "Forgetting that parallel lines (same slope, different y-intercept) have NO solution.",
      "Identical lines (same slope, same y-intercept) have INFINITE solutions."
    ],
    workedExample: {
      question: "Solve the system: \n$2x - y = 7$\n$x + y = 2$",
      solution: "1. Add the equations: $(2x - y) + (x + y) = 7 + 2$\n2. $3x = 9 \\Rightarrow x = 3$\n3. Plug back into $x + y = 2$: $3 + y = 2 \\Rightarrow y = -1$\nSolution: (3, -1)"
    }
  },
  {
    id: "rw-cent-id",
    topic: "Central Ideas",
    category: "Information & Ideas",
    section: "RW",
    readTime: "4 min",
    concepts: [
      {
        title: "Main Idea vs. Detail",
        description: "The central idea covers the entire passage. A detail only covers one part. Eliminate choices that are 'too narrow'.",
      },
      {
        title: "Eliminating Extremes",
        description: "Digital SAT answers are rarely extreme. Avoid words like 'always', 'never', or 'only' unless the text explicitly supports it.",
      }
    ],
    commonMistakes: [
      "Choosing an answer that is true based on the text but isn't the *main* focus.",
      "Bringing in outside knowledge that isn't mentioned in the passage."
    ],
    workedExample: {
      question: "What is the primary focus of a passage discussing the benefits of reforestation on local humidity levels?",
      solution: "The focus is the causal relationship between tree planting and atmospheric moisture. Wrong answers often focus only on 'planting trees' or 'climate change' generally."
    }
  },
  {
    id: "rw-trans",
    topic: "Transitions",
    category: "Standard English Conventions",
    section: "RW",
    readTime: "3 min",
    concepts: [
      {
        title: "Contrast Transitions",
        description: "Use when the second part of the sentence goes against the first.",
        example: "However, Nevertheless, Conversely, Despite this."
      },
      {
        title: "Cause-Effect Transitions",
        description: "Use when the second part happens *because* of the first.",
        example: "Therefore, Thus, Consequently, As a result."
      }
    ],
    commonMistakes: [
      "Using 'However' when the sentences actually agree (Addition).",
      "Using 'Therefore' when there is no clear logical cause-and-effect relationship."
    ],
    workedExample: {
      question: "The experiment failed to produce significant results. ____, the researchers decided to revise their hypothesis.",
      solution: "Choice: 'Consequently' or 'Therefore'. Reason: Revising the hypothesis is a direct result (effect) of the experiment's failure (cause)."
    }
  }
];
