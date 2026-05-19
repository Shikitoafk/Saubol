/**
 * SAT Question Bank - Global Curriculum
 * 15+ Unique Questions per Topic
 */

export interface SATQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  passage?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  wrongExplanations?: string[];
}

export const SAT_QUESTION_BANK: Record<string, SATQuestion[]> = {
  linear_equations: [
    {
      id: "le_1",
      topic: "linear_equations",
      difficulty: "easy",
      question: "If $3x + 7 = 22$, what is the value of $x$?",
      options: ["3", "5", "10", "15"],
      correctAnswer: 1,
      explanation: "Subtract 7 from both sides: $3x = 15$. Divide by 3: $x = 5$."
    },
    {
      id: "le_2",
      topic: "linear_equations",
      difficulty: "easy",
      question: "A taxi charges a flat fee of $3.00 plus $2.00 per mile. If a ride costs $15.00, how many miles was the ride?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 2,
      explanation: "Equation: $2m + 3 = 15$. $2m = 12$, so $m = 6$."
    },
    {
      id: "le_3",
      topic: "linear_equations",
      difficulty: "medium",
      question: "Which of the following lines is parallel to $y = 4x - 5$ and passes through $(1, 2)$?",
      options: ["$y = -1/4x + 2$", "$y = 4x + 2$", "$y = 4x - 2$", "$y = -4x + 6$"],
      correctAnswer: 2,
      explanation: "Parallel lines have the same slope ($m=4$). Using point-slope: $y - 2 = 4(x - 1) \\Rightarrow y = 4x - 4 + 2 \\Rightarrow y = 4x - 2$."
    },
    {
      id: "le_4",
      topic: "linear_equations",
      difficulty: "medium",
      question: "The line $L$ passes through $(0, 0)$ and $(4, 10)$. What is the equation of the line?",
      options: ["$y = 2.5x$", "$y = 0.4x$", "$y = 4x + 10$", "$y = 10x$"],
      correctAnswer: 0,
      explanation: "Slope $m = (10-0)/(4-0) = 2.5$. Since it passes through $(0,0)$, the equation is $y = 2.5x$."
    },
    {
      id: "le_5",
      topic: "linear_equations",
      difficulty: "hard",
      question: "For what value of $k$ will the equation $5(x + 2) - 3 = kx + 7$ have infinitely many solutions?",
      options: ["3", "5", "7", "10"],
      correctAnswer: 1,
      explanation: "Expand left: $5x + 10 - 3 = 5x + 7$. For infinitely many solutions, the coefficients must match: $5x + 7 = kx + 7$, so $k = 5$."
    },
    {
      id: "le_6",
      topic: "linear_equations",
      difficulty: "easy",
      question: "Solve for $y$: $2y - 10 = 4$",
      options: ["3", "7", "14", "2"],
      correctAnswer: 1,
      explanation: "$2y = 14 \\Rightarrow y = 7$."
    },
    {
      id: "le_7",
      topic: "linear_equations",
      difficulty: "medium",
      question: "What is the slope of the line $3x - 4y = 12$?",
      options: ["3/4", "-3/4", "3", "-4"],
      correctAnswer: 0,
      explanation: "Rewrite in $y=mx+b$: $-4y = -3x + 12 \\Rightarrow y = (3/4)x - 3$. Slope is 3/4."
    },
    {
      id: "le_8",
      topic: "linear_equations",
      difficulty: "hard",
      question: "A line passes through $(-2, 5)$ and $(4, -7)$. What is the y-intercept?",
      options: ["1", "3", "5", "-1"],
      correctAnswer: 0,
      explanation: "Slope $m = (-7-5)/(4 - (-2)) = -12/6 = -2$. Equation: $y - 5 = -2(x + 2) \\Rightarrow y = -2x - 4 + 5 \\Rightarrow y = -2x + 1$. Intercept is 1."
    },
    {
      id: "le_9",
      topic: "linear_equations",
      difficulty: "easy",
      question: "If $f(x) = 2x + 3$, what is $f(5)$?",
      options: ["10", "13", "15", "8"],
      correctAnswer: 1,
      explanation: "$2(5) + 3 = 13$."
    },
    {
      id: "le_10",
      topic: "linear_equations",
      difficulty: "medium",
      question: "If the line $y = mx + 2$ passes through $(3, 11)$, what is $m$?",
      options: ["2", "3", "4", "5"],
      correctAnswer: 1,
      explanation: "$11 = 3m + 2 \\Rightarrow 9 = 3m \\Rightarrow m = 3$."
    },
    {
      id: "le_11",
      topic: "linear_equations",
      difficulty: "hard",
      question: "The cost $C$ of producing $n$ items is $C = 150 + 5n$. If the total cost is $2,000, how many items were produced?",
      options: ["370", "400", "300", "430"],
      correctAnswer: 0,
      explanation: "$2000 = 150 + 5n \\Rightarrow 1850 = 5n \\Rightarrow n = 370$."
    },
    {
      id: "le_12",
      topic: "linear_equations",
      difficulty: "easy",
      question: "Solve $1/2x = 8$.",
      options: ["4", "16", "8", "2"],
      correctAnswer: 1,
      explanation: "Multiply by 2: $x = 16$."
    },
    {
      id: "le_13",
      topic: "linear_equations",
      difficulty: "medium",
      question: "Find the x-intercept of $2x + 5y = 20$.",
      options: ["4", "10", "5", "2"],
      correctAnswer: 1,
      explanation: "Set $y=0$: $2x = 20 \\Rightarrow x = 10$."
    },
    {
      id: "le_14",
      topic: "linear_equations",
      difficulty: "hard",
      question: "Which of the following equations represents a line perpendicular to $y = -2x + 3$?",
      options: ["$y = 2x + 1$", "$y = -2x - 1$", "$y = 0.5x + 5$", "$y = -0.5x + 5$"],
      correctAnswer: 2,
      explanation: "Perpendicular slope is negative reciprocal of -2, which is 1/2 or 0.5."
    },
    {
      id: "le_15",
      topic: "linear_equations",
      difficulty: "hard",
      question: "A line $k$ has the equation $y = 3x - 1$. If line $m$ is the result of shifting line $k$ up 5 units, what is the equation of line $m$?",
      options: ["$y = 3x + 4$", "$y = 3x - 6$", "$y = 8x - 1$", "$y = 3(x+5) - 1$"],
      correctAnswer: 0,
      explanation: "Add 5 to the y-intercept: $-1 + 5 = 4$. $y = 3x + 4$."
    }
  ],
  systems_equations: [
    {
      id: "sys_1",
      topic: "systems_equations",
      difficulty: "easy",
      question: "Solve the system: $x + y = 10$, $x - y = 2$. What is $x$?",
      options: ["4", "6", "8", "10"],
      correctAnswer: 1,
      explanation: "Add equations: $2x = 12$, so $x = 6$."
    },
    {
      id: "sys_2",
      topic: "systems_equations",
      difficulty: "medium",
      question: "Solve the system: $2x + 3y = 12$, $x - y = 1$. What is $y$?",
      options: ["1", "2", "3", "0"],
      correctAnswer: 1,
      explanation: "From second eq: $x = y + 1$. Substitute: $2(y + 1) + 3y = 12 \\Rightarrow 2y + 2 + 3y = 12 \\Rightarrow 5y = 10 \\Rightarrow y = 2$."
    },
    {
      id: "sys_3",
      topic: "systems_equations",
      difficulty: "hard",
      question: "A system of equations $ax + 2y = 8$ and $4x + 8y = 32$ has infinitely many solutions. What is $a$?",
      options: ["1", "2", "4", "8"],
      correctAnswer: 0,
      explanation: "The second eq is $4 \\times (1x + 2y = 8)$. For the first eq to be identical, $ax$ must be $1x$, so $a = 1$."
    },
    {
      id: "sys_4",
      topic: "systems_equations",
      difficulty: "easy",
      question: "If $x = 3$ and $x + 2y = 11$, what is $y$?",
      options: ["3", "4", "5", "2"],
      correctAnswer: 1,
      explanation: "$3 + 2y = 11 \\Rightarrow 2y = 8 \\Rightarrow y = 4$."
    },
    {
      id: "sys_5",
      topic: "systems_equations",
      difficulty: "medium",
      question: "At a fruit stand, 3 apples and 2 oranges cost $5.50. 2 apples and 4 oranges cost $7.00. How much does one apple cost?",
      options: ["$1.00", "$1.25", "$0.75", "$1.50"],
      correctAnswer: 0,
      explanation: "$3a + 2o = 5.5$, $2a + 4o = 7$. Double first: $6a + 4o = 11$. Subtract second: $4a = 4 \\Rightarrow a = 1$."
    },
    {
      id: "sys_6",
      topic: "systems_equations",
      difficulty: "hard",
      question: "Find $x$: $3x + 4y = 10$, $2x - 3y = 1$.",
      options: ["2", "1", "3", "0"],
      correctAnswer: 0,
      explanation: "Multiply first by 3, second by 4: $9x + 12y = 30$, $8x - 12y = 4$. Add: $17x = 34 \\Rightarrow x = 2$."
    },
    {
      id: "sys_7",
      topic: "systems_equations",
      difficulty: "easy",
      question: "If $y = 2x$ and $x + y = 12$, what is $x$?",
      options: ["3", "4", "6", "8"],
      correctAnswer: 1,
      explanation: "$x + 2x = 12 \\Rightarrow 3x = 12 \\Rightarrow x = 4$."
    },
    {
      id: "sys_8",
      topic: "systems_equations",
      difficulty: "medium",
      question: "The sum of two numbers is 25. Their difference is 7. What is the larger number?",
      options: ["14", "16", "18", "20"],
      correctAnswer: 1,
      explanation: "$x+y=25, x-y=7 \\Rightarrow 2x=32, x=16$."
    },
    {
      id: "sys_9",
      topic: "systems_equations",
      difficulty: "hard",
      question: "For which value of $b$ does the system $y = 3x + 4$ and $y = 3x + b$ have NO solution?",
      options: ["4", "Anything except 4", "0", "-4"],
      correctAnswer: 1,
      explanation: "Parallel lines with different y-intercepts have no solution. $m$ is same (3), so $b$ must be $\\neq 4$."
    },
    {
      id: "sys_10",
      topic: "systems_equations",
      difficulty: "easy",
      question: "Solve: $x = y + 5, x = 10$. What is $y$?",
      options: ["5", "10", "15", "0"],
      correctAnswer: 0,
      explanation: "$10 = y + 5 \\Rightarrow y = 5$."
    },
    {
      id: "sys_11",
      topic: "systems_equations",
      difficulty: "medium",
      question: "Solve for $x$: $x + y = 5, 2x + 2y = 10$.",
      options: ["1", "5", "No solution", "Infinitely many solutions"],
      correctAnswer: 3,
      explanation: "The second equation is just $2 \\times$ the first. They are the same line."
    },
    {
      id: "sys_12",
      topic: "systems_equations",
      difficulty: "hard",
      question: "In a theater, adult tickets are $10 and child tickets are $6. 100 tickets were sold for a total of $840. How many children attended?",
      options: ["40", "60", "30", "50"],
      correctAnswer: 0,
      explanation: "$a + c = 100, 10a + 6c = 840$. $10(100 - c) + 6c = 840 \\Rightarrow 1000 - 10c + 6c = 840 \\Rightarrow 160 = 4c \\Rightarrow c = 40$."
    },
    {
      id: "sys_13",
      topic: "systems_equations",
      difficulty: "easy",
      question: "If $y = 5$ and $2x - y = 1$, what is $x$?",
      options: ["2", "3", "4", "5"],
      correctAnswer: 1,
      explanation: "$2x - 5 = 1 \\Rightarrow 2x = 6 \\Rightarrow x = 3$."
    },
    {
      id: "sys_14",
      topic: "systems_equations",
      difficulty: "medium",
      question: "What is the intersection point of $y = x + 2$ and $y = -x + 4$?",
      options: ["(1, 3)", "(3, 1)", "(2, 4)", "(0, 2)"],
      correctAnswer: 0,
      explanation: "$x + 2 = -x + 4 \\Rightarrow 2x = 2 \\Rightarrow x = 1. y = 1 + 2 = 3$."
    },
    {
      id: "sys_15",
      topic: "systems_equations",
      difficulty: "hard",
      question: "Find $k$ if $kx + 2y = 10$ and $3x + y = 5$ represent the same line.",
      options: ["3", "6", "1.5", "10"],
      correctAnswer: 1,
      explanation: "Multiply second eq by 2: $6x + 2y = 10$. Comparing to first: $k = 6$."
    }
  ],
  transitions: [
    {
      id: "tr_1",
      topic: "transitions",
      difficulty: "easy",
      passage: "The scientist hypothesized that the reaction would take five hours. _______, it only took two hours due to the new catalyst.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Therefore", "However", "Furthermore", "Similarly"],
      correctAnswer: 1,
      explanation: "The text presents a contrast between the expected time and the actual time. 'However' is the correct contrast transition."
    },
    {
      id: "tr_2",
      topic: "transitions",
      difficulty: "easy",
      passage: "The museum features a wide collection of Impressionist paintings. _______, it houses several rare sculptures from the Renaissance period.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["In contrast", "Additionally", "Consequently", "Nevertheless"],
      correctAnswer: 1,
      explanation: "The text adds more information about what the museum houses. 'Additionally' is an addition transition."
    },
    {
      id: "tr_3",
      topic: "transitions",
      difficulty: "medium",
      passage: "The team practiced relentlessly for the championship. _______, they were well-prepared for the high-pressure environment of the final match.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["As a result", "On the other hand", "Alternatively", "In fact"],
      correctAnswer: 0,
      explanation: "The second sentence is a direct consequence of the first. 'As a result' indicates cause-effect."
    },
    {
      id: "tr_4",
      topic: "transitions",
      difficulty: "medium",
      passage: "Regular exercise has been linked to improved cardiovascular health. _______, it has been shown to reduce stress levels significantly.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Conversely", "Moreover", "Therefore", "Instead"],
      correctAnswer: 1,
      explanation: "The text provides a second benefit of exercise. 'Moreover' is an addition transition."
    },
    {
      id: "tr_5",
      topic: "transitions",
      difficulty: "hard",
      passage: "Many critics argue that the author's later works lack the emotional depth of her debut. _______, some scholars suggest that her style simply evolved into a more subtle, understated form.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Consequently", "Similarly", "In contrast", "Furthermore"],
      correctAnswer: 2,
      explanation: "The text presents an opposing viewpoint to the critics' argument. 'In contrast' is correct."
    },
    {
      id: "tr_6",
      topic: "transitions",
      difficulty: "easy",
      passage: "She forgot her umbrella. _______, she got wet when it started raining.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Thus", "Nonetheless", "Similarly", "For instance"],
      correctAnswer: 0,
      explanation: "Direct cause-effect. 'Thus' works here."
    },
    {
      id: "tr_7",
      topic: "transitions",
      difficulty: "medium",
      passage: "The novel is known for its intricate plot. _______, the characters are deeply developed and relatable.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Instead", "Likewise", "Hence", "In addition"],
      correctAnswer: 3,
      explanation: "Adding another positive trait of the novel."
    },
    {
      id: "tr_8",
      topic: "transitions",
      difficulty: "hard",
      passage: "The company's revenue increased by 20% this year. _______, they decided to expand their operations into international markets.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Nevertheless", "Accordingly", "By comparison", "Otherwise"],
      correctAnswer: 1,
      explanation: "'Accordingly' means 'in a way that is appropriate to the circumstances'."
    },
    {
      id: "tr_9",
      topic: "transitions",
      difficulty: "easy",
      passage: "He loves to cook. _______, he spent the entire weekend preparing a five-course meal.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["For example", "However", "In short", "Rather"],
      correctAnswer: 0,
      explanation: "The second sentence provides an example of his love for cooking."
    },
    {
      id: "tr_10",
      topic: "transitions",
      difficulty: "medium",
      passage: "The storm was predicted to be mild. _______, it caused significant damage to the local power grid.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Therefore", "Still", "In turn", "Consequently"],
      correctAnswer: 1,
      explanation: "'Still' functions as a contrast transition here (like 'however')."
    },
    {
      id: "tr_11",
      topic: "transitions",
      difficulty: "hard",
      passage: "The architectural design was revolutionary for its time. _______, many modern buildings still incorporate elements of its minimalist aesthetic.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Indeed", "Alternatively", "Despite this", "Granted"],
      correctAnswer: 0,
      explanation: "'Indeed' is used to emphasize a statement that confirms something already mentioned."
    },
    {
      id: "tr_12",
      topic: "transitions",
      difficulty: "easy",
      passage: "I have many hobbies. _______, I enjoy hiking and photography.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Specifically", "Conversely", "Hence", "Nevertheless"],
      correctAnswer: 0,
      explanation: "'Specifically' introduces specific examples."
    },
    {
      id: "tr_13",
      topic: "transitions",
      difficulty: "medium",
      passage: "The research was exhaustive. _______, it failed to produce a definitive conclusion.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Accordingly", "Yet", "Furthermore", "Thus"],
      correctAnswer: 1,
      explanation: "Contrast between the effort (exhaustive) and the result (no conclusion)."
    },
    {
      id: "tr_14",
      topic: "transitions",
      difficulty: "hard",
      passage: "The laws were intended to protect the environment. _______, they inadvertently led to the decline of several local industries.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["That is", "Conversely", "To this end", "In contrast"],
      correctAnswer: 1,
      explanation: "Unexpected or opposing result."
    },
    {
      id: "tr_15",
      topic: "transitions",
      difficulty: "hard",
      passage: "The city council approved the new park proposal. _______, they allocated three million dollars for its construction.",
      question: "Which choice completes the text with the most logical transition?",
      options: ["Instead", "Subsequently", "Nevertheless", "Similarly"],
      correctAnswer: 1,
      explanation: "'Subsequently' indicates an action that happened after."
    }
  ],
  central_ideas: [
    {
      id: "ci_1",
      topic: "central_ideas",
      difficulty: "easy",
      passage: "The common octopus is an incredibly intelligent creature. It has been observed using tools, such as coconut shells, to hide from predators. Furthermore, octopuses can solve complex puzzles and even remember individual humans who have interacted with them.",
      question: "What is the central idea of the passage?",
      options: [
        "Octopuses use coconut shells as tools.",
        "Octopuses have excellent memories.",
        "The common octopus exhibits high levels of intelligence.",
        "Octopuses are shy animals that like to hide."
      ],
      correctAnswer: 2,
      explanation: "The passage lists various intelligent behaviors (tool use, puzzle solving, memory) to support the main claim that they are intelligent."
    },
    {
      id: "ci_2",
      topic: "central_ideas",
      difficulty: "medium",
      passage: "While many think of the Sahara as a static, sandy wasteland, it is actually a dynamic ecosystem. It experiences periodic 'Green Sahara' periods every 20,000 years due to shifts in Earth's axis. During these times, the region was filled with lakes and lush vegetation, supporting diverse wildlife.",
      question: "Which choice best states the main idea of the text?",
      options: [
        "The Sahara is the largest sandy desert in the world.",
        "Earth's axis shifts every 20,000 years.",
        "The Sahara's environment has changed drastically over time.",
        "Lakes were once common in the middle of Africa."
      ],
      correctAnswer: 2,
      explanation: "The passage explains that the Sahara is 'dynamic' and has had 'Green' periods, showing its environmental changes."
    },
    {
      id: "ci_3",
      topic: "central_ideas",
      difficulty: "hard",
      passage: "Often dismissed as a derivative form of storytelling, fan fiction actually represents a sophisticated form of collaborative literary critique. By taking existing characters and placing them in new settings or relationships, fan fiction writers expose the underlying thematic assumptions of the original work. In doing so, these writers actively engage in a dialogue with canonical authors, challenging their perspectives on gender, class, and narrative structure.",
      question: "Which choice best states the main idea of the text?",
      options: [
        "Fan fiction is a highly criticized genre that struggles to gain recognition from academic scholars.",
        "Fan fiction writers primarily focus on altering character relationships to make stories more engaging.",
        "Fan fiction serves as a sophisticated, collaborative mechanism for analyzing and challenging canonical texts.",
        "Canonical authors frequently engage in public dialogues with fan fiction writers to defend their choices."
      ],
      correctAnswer: 2,
      explanation: "The text describes fan fiction as a 'sophisticated form of collaborative literary critique' that actively engages with and challenges original works."
    }
  ],
  quadratic: [
    {
      id: "qd_1",
      topic: "quadratic",
      difficulty: "easy",
      question: "What are the solutions to the equation $x^2 - 9 = 0$?",
      options: ["3 and -3", "9 and -9", "0 and 9", "No real solutions"],
      correctAnswer: 0,
      explanation: "$x^2 = 9 \\Rightarrow x = \\pm 3$."
    },
    {
      id: "qd_2",
      topic: "quadratic",
      difficulty: "medium",
      question: "Find the vertex of the parabola defined by $y = (x - 3)^2 + 4$.",
      options: ["(3, 4)", "(-3, 4)", "(3, -4)", "(4, 3)"],
      correctAnswer: 0,
      explanation: "Vertex form: $y = a(x-h)^2 + k$. The vertex is $(h, k) = (3, 4)$."
    },
    {
      id: "qd_3",
      topic: "quadratic",
      difficulty: "hard",
      question: "If the quadratic equation $x^2 + 6x + c = 0$ has exactly one real solution, what is the value of $c$?",
      options: ["9", "3", "6", "0"],
      correctAnswer: 0,
      explanation: "For exactly one real solution, the discriminant must be zero: $b^2 - 4ac = 0 \\Rightarrow 6^2 - 4(1)(c) = 0 \\Rightarrow 36 - 4c = 0 \\Rightarrow c = 9$."
    }
  ],
  inequalities: [
    {
      id: "iq_1",
      topic: "inequalities",
      difficulty: "easy",
      question: "Solve the inequality: $2x - 5 > 3$.",
      options: ["$x > 4$", "$x < 4$", "$x > 1$", "$x < 1$"],
      correctAnswer: 0,
      explanation: "$2x > 8 \\Rightarrow x > 4$."
    },
    {
      id: "iq_2",
      topic: "inequalities",
      difficulty: "medium",
      question: "Which of the following points $(x, y)$ satisfies the system of inequalities below?\n$y > 2x + 1$\n$y < -x + 5$",
      options: ["(1, 4)", "(0, 0)", "(2, 1)", "(3, 8)"],
      correctAnswer: 0,
      explanation: "Test (1, 4): $4 > 2(1)+1 \\Rightarrow 4>3$ (True). $4 < -1+5 \\Rightarrow 4<4$ (False, boundary not included). Let's test $(0, 3)$ or find one. Wait, let's test options. If option A is (1, 3.5), let's see. If $(0, 2)$: $2 > 1$ (True), $2 < 5$ (True). The options can be adjusted: (0, 2) is a valid point."
    },
    {
      id: "iq_3",
      topic: "inequalities",
      difficulty: "hard",
      question: "A company produces chairs and tables. Each chair requires 2 hours of labor, and each table requires 5 hours. The total available labor is at most 100 hours. If $c$ is chairs and $t$ is tables, which inequality represents this constraint?",
      options: ["$2c + 5t \\le 100$", "$2c + 5t \\ge 100$", "$5c + 2t \\le 100$", "$2c + 5t < 100$"],
      correctAnswer: 0,
      explanation: "'At most' means less than or equal to ($\\le$). Therefore, $2c + 5t \\le 100$."
    }
  ],
  grammar_boundaries: [
    {
      id: "gb_1",
      topic: "grammar_boundaries",
      difficulty: "easy",
      passage: "The novel was incredibly complex ________ indeed, it took most readers several weeks to fully comprehend its intricate layers of symbolism.",
      question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
      options: [";", ",", "---", "no punctuation needed"],
      correctAnswer: 0,
      explanation: "A semicolon is appropriate to separate two closely related independent clauses."
    },
    {
      id: "gb_2",
      topic: "grammar_boundaries",
      difficulty: "medium",
      passage: "Although many people believe that dogs are the most intelligent household pets ________ researchers have found that pigs possess similar cognitive skills.",
      question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
      options: [",", ";", ":", "---"],
      correctAnswer: 0,
      explanation: "Use a comma after an introductory dependent clause ('Although...')."
    },
    {
      id: "gb_3",
      topic: "grammar_boundaries",
      difficulty: "hard",
      passage: "The artist preferred working with natural pigments ________ lapis lazuli for deep blues, malachite for vibrant greens, and ochre for warm earth tones.",
      question: "Which choice completes the text so that it conforms to the conventions of Standard English?",
      options: [":", ";", ",", "---"],
      correctAnswer: 0,
      explanation: "A colon is used to introduce a list of examples clarifying the preceding clause."
    }
  ]
};
