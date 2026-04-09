import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../_lib/supabase";

function mapMCQ(r: any) {
  return {
    id: `mcq-${r.id}`,
    question: r.question ?? "",
    optionA: r.option_a ?? "",
    optionB: r.option_b ?? "",
    optionC: r.option_c ?? "",
    optionD: r.option_d ?? "",
    correctAnswer: (r.correct_answer ?? "").trim().toUpperCase(),
    explanation: r.explanation ?? "",
    difficulty: r.difficulty ?? "Medium",
    category: r.category ?? "",
    section: r.section ?? "",
    isFreeResponse: false,
  };
}

function mapOpen(r: any) {
  return {
    id: `open-${r.id}`,
    question: r.question ?? "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: (r.correct_answer ?? "").trim(),
    explanation: r.explanation ?? "",
    difficulty: r.difficulty ?? "Medium",
    category: r.category ?? "",
    section: r.section ?? "",
    isFreeResponse: true,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type = "all", difficulty, category, section } = req.query as Record<string, string>;

  try {
    const fetchMCQ = type === "all" || type === "mcq";
    const fetchOpen = type === "all" || type === "open";
    let questions: any[] = [];

    if (fetchMCQ) {
      let q = supabase.from("SAT_MCQ").select("*");
      if (difficulty && difficulty !== "All") q = q.eq("difficulty", difficulty);
      if (category) q = q.eq("category", category);
      if (section) q = q.eq("section", section);
      const { data, error } = await q;
      if (error) throw error;
      questions = questions.concat((data ?? []).map(mapMCQ));
    }

    if (fetchOpen) {
      let q = supabase.from("SAT_Open").select("*");
      if (difficulty && difficulty !== "All") q = q.eq("difficulty", difficulty);
      if (category) q = q.eq("category", category);
      if (section) q = q.eq("section", section);
      const { data, error } = await q;
      if (error) throw error;
      questions = questions.concat((data ?? []).map(mapOpen));
    }

    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to fetch questions" });
  }
}
