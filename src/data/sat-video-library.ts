/**
 * SAT Video Library - Official Khan Academy Curriculum
 * This file maps SAT topics to their respective instructional videos.
 */

export interface VideoResource {
  videoId: string;
  title: string;
  duration: string;
  topics_covered: string[];
}

export const SAT_VIDEO_LIBRARY: Record<string, Record<string, VideoResource>> = {
  math: {
    linear_equations: {
      videoId: "", // TODO: will be provided manually
      title: "Linear Equations",
      duration: "18 min",
      topics_covered: [
        "Solving for x",
        "Slope-intercept form y = mx + b",
        "Word problems",
        "Checking answers"
      ]
    },
    systems_equations: {
      videoId: "", // TODO: will be provided manually
      title: "Systems of Equations",
      duration: "14 min",
      topics_covered: [
        "Substitution method",
        "Elimination method", 
        "No solution / infinite solutions"
      ]
    },
    quadratic: {
      videoId: "", // TODO: will be provided manually
      title: "Quadratic Equations",
      duration: "22 min",
      topics_covered: [
        "Factoring",
        "Quadratic formula",
        "Vertex form"
      ]
    },
    functions: {
      videoId: "", // TODO: will be provided manually
      title: "Functions",
      duration: "16 min",
      topics_covered: [
        "Function notation f(x)",
        "Domain and range",
        "Evaluating functions"
      ]
    },
    inequalities: {
      videoId: "", // TODO: will be provided manually
      title: "Linear Inequalities",
      duration: "12 min",
      topics_covered: [
        "Solving inequalities",
        "Graphing on number line",
        "Compound inequalities"
      ]
    },
    percentages: {
      videoId: "", // TODO: will be provided manually
      title: "Percentages & Ratios",
      duration: "15 min",
      topics_covered: [
        "Percent change",
        "Ratio and proportion",
        "Unit rates"
      ]
    },
    statistics: {
      videoId: "", // TODO: will be provided manually
      title: "Statistics & Data",
      duration: "20 min",
      topics_covered: [
        "Mean, median, mode",
        "Standard deviation",
        "Scatterplots"
      ]
    },
    geometry: {
      videoId: "", // TODO: will be provided manually
      title: "Geometry & Trigonometry",
      duration: "25 min",
      topics_covered: [
        "Area and volume",
        "Triangles",
        "Circles",
        "Basic trig"
      ]
    }
  },
  reading_writing: {
    central_ideas: {
      videoId: "", // TODO: will be provided manually
      title: "Central Ideas & Details",
      duration: "12 min",
      topics_covered: [
        "Finding main idea",
        "Supporting details",
        "Eliminating wrong answers"
      ]
    },
    textual_evidence: {
      videoId: "", // TODO: will be provided manually
      title: "Command of Evidence",
      duration: "14 min",
      topics_covered: [
        "Finding evidence in passage",
        "Matching claim to evidence",
        "Quantitative evidence"
      ]
    },
    inferences: {
      videoId: "", // TODO: will be provided manually
      title: "Inferences",
      duration: "11 min",
      topics_covered: [
        "What is implied",
        "What can be concluded",
        "Avoiding over-inference"
      ]
    },
    words_in_context: {
      videoId: "", // TODO: will be provided manually
      title: "Words in Context",
      duration: "10 min",
      topics_covered: [
        "Using context clues",
        "Tone and connotation",
        "Replacing word in sentence"
      ]
    },
    transitions: {
      videoId: "", // TODO: will be provided manually
      title: "Transitions",
      duration: "9 min",
      topics_covered: [
        "Contrast transitions",
        "Addition transitions",
        "Cause-effect transitions"
      ]
    },
    grammar_boundaries: {
      videoId: "", // TODO: will be provided manually
      title: "Punctuation & Boundaries",
      duration: "16 min",
      topics_covered: [
        "Comma rules",
        "Semicolons and colons",
        "Sentence boundaries"
      ]
    },
    rhetorical_synthesis: {
      videoId: "", // TODO: will be provided manually
      title: "Rhetorical Synthesis",
      duration: "13 min",
      topics_covered: [
        "Combining notes into sentences",
        "Matching purpose to phrasing",
        "Academic writing style"
      ]
    }
  }
};
