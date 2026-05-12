/**
 * SAT Question Bank - Official Blueprint Alignment
 * Structure: Section -> Category -> Topic -> Questions[]
 */

export interface SATOption {
  label: string; // A, B, C, D
  text: string;
}

export interface SATQuestion {
  id: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passage?: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3
  explanation: string;
  category: string;
  topic: string;
  section: 'Math' | 'RW';
  hasKaTeX?: boolean;
}

export const SAT_QUESTION_BANK: Record<string, any> = {
  Math: {
    Algebra: {
      Linear_Equations_1Var: [
        {
          id: "m-alg-1",
          difficulty: "Easy",
          question: "If $3x + 7 = 19$, what is the value of $x$?",
          options: ["4", "6", "12", "26"],
          correctAnswer: 0,
          explanation: "Subtract 7 from both sides: $3x = 12$. Divide by 3: $x = 4$.",
          category: "Algebra",
          topic: "Linear equations in 1 variable",
          section: "Math",
          hasKaTeX: true
        },
        {
          id: "m-alg-2",
          difficulty: "Medium",
          question: "If $\\frac{2}{3}(x - 4) = 8$, what is the value of $x$?",
          options: ["8", "12", "16", "20"],
          correctAnswer: 2,
          explanation: "Multiply by $\\frac{3}{2}$: $x - 4 = 12$. Add 4: $x = 16$.",
          category: "Algebra",
          topic: "Linear equations in 1 variable",
          section: "Math",
          hasKaTeX: true
        },
        {
          id: "m-alg-3",
          difficulty: "Hard",
          question: "For what value of $k$ will the equation $5(2x - 3) + k = 10x + 7$ have no solutions?",
          options: ["7", "-15", "22", "No such value exists"],
          correctAnswer: 3,
          explanation: "Expanding the left side gives $10x - 15 + k = 10x + 7$. For no solutions, the constants must be different while coefficients of $x$ are the same. $10x = 10x$ is always true. $-15 + k = 7$ would mean $k = 22$, but that would make it 'infinitely many solutions'. Since the question asks for 'no solutions', and the $x$ terms always cancel out to $0=0$ if constants match, there is no $k$ that makes the $x$ terms different.",
          category: "Algebra",
          topic: "Linear equations in 1 variable",
          section: "Math",
          hasKaTeX: true
        }
      ],
      Systems_of_Linear_Equations: [
        {
          id: "m-alg-4",
          difficulty: "Medium",
          question: "What is the solution $(x, y)$ to the system: \n$$y = 2x + 1$$\n$$x + y = 7$$",
          options: ["(2, 5)", "(3, 4)", "(4, 3)", "(5, 2)"],
          correctAnswer: 0,
          explanation: "Substitute $y$: $x + (2x + 1) = 7 \\Rightarrow 3x + 1 = 7 \\Rightarrow 3x = 6 \\Rightarrow x = 2$. Then $y = 2(2) + 1 = 5$.",
          category: "Algebra",
          topic: "Systems of linear equations",
          section: "Math",
          hasKaTeX: true
        }
      ]
    },
    Advanced_Math: {
      Nonlinear_Functions: [
        {
          id: "m-adv-1",
          difficulty: "Medium",
          question: "Which of the following is a factor of $x^2 - 5x + 6$?",
          options: ["$x + 2$", "$x - 2$", "$x + 3$", "$x + 6$"],
          correctAnswer: 1,
          explanation: "$x^2 - 5x + 6 = (x - 2)(x - 3)$.",
          category: "Advanced Math",
          topic: "Nonlinear functions",
          section: "Math",
          hasKaTeX: true
        }
      ]
    },
    Problem_Solving_Data: {
      Probability: [
        {
          id: "m-psd-1",
          difficulty: "Easy",
          question: "A bag contains 5 red marbles and 3 blue marbles. If one marble is drawn at random, what is the probability it is red?",
          options: ["3/8", "5/8", "1/2", "5/3"],
          correctAnswer: 1,
          explanation: "Total marbles = 8. Red marbles = 5. Probability = 5/8.",
          category: "Problem Solving & Data Analysis",
          topic: "Probability",
          section: "Math",
          hasKaTeX: false
        }
      ]
    }
  },
  RW: {
    Information_Ideas: {
      Central_Ideas: [
        {
          id: "rw-ii-1",
          difficulty: "Medium",
          passage: "The study of bioluminescence in deep-sea organisms has revealed a complex array of biological functions beyond simple illumination. Researchers have observed that some species of jellyfish use rhythmic flashes to startle predators, while certain anglerfish rely on glowing lures to attract prey in the absolute darkness of the midnight zone. Furthermore, recent evidence suggests that bioluminescence may also play a crucial role in intra-species communication, allowing individuals to identify potential mates or signal territorial boundaries in an environment where visual cues are otherwise non-existent.",
          question: "Which choice best states the central idea of the text?",
          options: [
            "Bioluminescence is primarily used by deep-sea organisms to navigate the dark environment of the ocean floor.",
            "The evolutionary development of bioluminescence was driven by the need to attract prey in the midnight zone.",
            "Bioluminescence serves a variety of essential survival and social functions for organisms living in deep-sea environments.",
            "Deep-sea organisms have developed more complex communication systems than those living in shallower waters."
          ],
          correctAnswer: 2,
          explanation: "The text discusses multiple functions (defense, hunting, communication), making 'variety of essential survival and social functions' the best summary.",
          category: "Information & Ideas",
          topic: "Central ideas & details",
          section: "RW"
        }
      ],
      Inferences: [
        {
          id: "rw-ii-2",
          difficulty: "Hard",
          passage: "In the late 19th century, the introduction of the Bessemer process revolutionized the steel industry by allowing for the mass production of high-quality steel at a fraction of the previous cost. Before this innovation, steel was a luxury material used primarily for small items like tools and cutlery, while large structures were built with brittle cast iron or expensive wrought iron. Following the adoption of the Bessemer process, the price of steel dropped by over 80%, leading to a sudden boom in the construction of skyscrapers and transcontinental railroads that would have been financially impossible just a decade earlier.",
          question: "Based on the text, what can be reasonably inferred about the construction of skyscrapers prior to the late 19th century?",
          options: [
            "They were built using wrought iron, which made them susceptible to structural failure.",
            "The high cost of suitable building materials was a primary barrier to their development.",
            "The Bessemer process was initially kept secret by a few powerful construction firms.",
            "Architects preferred the aesthetic qualities of cast iron over the strength of steel."
          ],
          correctAnswer: 1,
          explanation: "The text states steel was 'luxury' and structures were 'expensive' or 'brittle' before the Bessemer process made steel cheap, implying cost was the barrier.",
          category: "Information & Ideas",
          topic: "Inferences",
          section: "RW"
        }
      ]
    },
    Craft_Structure: {
      Words_in_Context: [
        {
          id: "rw-cs-1",
          difficulty: "Easy",
          passage: "Despite the composer's reputation for being extremely ___, his private letters reveal a man who was deeply concerned with the opinions of his peers and went to great lengths to secure their approval.",
          question: "Which choice completes the text with the most logical and precise word or phrase?",
          options: ["aloof", "gregarious", "industrious", "sensitive"],
          correctAnswer: 0,
          explanation: "The word 'aloof' (distant) contrasts with 'deeply concerned with opinions', making it the logical choice.",
          category: "Craft & Structure",
          topic: "Words in context",
          section: "RW"
        }
      ]
    },
    Standard_English_Conventions: {
      Boundaries: [
        {
          id: "rw-sec-1",
          difficulty: "Medium",
          passage: "The architectural firm designed the new library to be both functional and ___ the building features large windows for natural light and an open floor plan that encourages collaboration.",
          question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
          options: ["beautiful;", "beautiful,", "beautiful", "beautiful:"],
          correctAnswer: 0,
          explanation: "A semicolon is needed to join two independent clauses.",
          category: "Standard English Conventions",
          topic: "Boundaries (punctuation)",
          section: "RW"
        }
      ]
    }
  }
};
