import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../_lib/supabase";

function mapMCQRow(r: any, tablePrefix: string) {
  return {
    id: `${tablePrefix}-${r.id}`,
    question: r.question ?? "",
    optionA: r.option_a ?? "",
    optionB: r.option_b ?? "",
    optionC: r.option_c ?? "",
    optionD: r.option_d ?? "",
    correctAnswer: (r.correct_answer ?? "").trim().toUpperCase(),
    explanation: r.explanation ?? "",
    difficulty: r.difficulty ?? "Medium",
    category: r.topic ?? r.section ?? "",
    section: tablePrefix === "ebrw" ? "RW" : "Math",
    isFreeResponse: false,
    imageUrl: r.image_url ?? undefined,
    source: r.source ?? "",
  };
}

function mapOpenRow(r: any) {
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
    category: r.topic ?? "",
    section: "Math",
    isFreeResponse: true,
    imageUrl: r.image_url ?? undefined,
    source: r.source ?? "",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type = "all", difficulty, category, section } = req.query as Record<string, string>;

  try {
    const fetchMCQ = type === "all" || type === "mcq";
    const fetchOpen = type === "all" || type === "open";
    let questions: any[] = [];

    // Map section names to canonical "RW" / "Math"
    let canonicalSection = section;
    if (section === "Reading & Writing" || section === "RW") {
      canonicalSection = "RW";
    }

    if (fetchMCQ) {
      // 1. Fetch from EBRW_MCQ if not filtered to Math
      if (!canonicalSection || canonicalSection === "RW") {
        let q = supabase.from("EBRW_MCQ").select("*");
        if (difficulty && difficulty !== "All") q = q.eq("difficulty", difficulty);
        if (category) q = q.eq("section", category);
        const { data, error } = await q;
        if (error) throw error;
        questions = questions.concat((data ?? []).map((r) => mapMCQRow(r, "ebrw")));
      }

      // 2. Fetch from Math_MCQ if not filtered to RW
      if (!canonicalSection || canonicalSection === "Math") {
        let q = supabase.from("Math_MCQ").select("*");
        if (difficulty && difficulty !== "All") q = q.eq("difficulty", difficulty);
        if (category) q = q.eq("topic", category);
        const { data, error } = await q;
        if (error) throw error;
        questions = questions.concat((data ?? []).map((r) => mapMCQRow(r, "math")));
      }
    }

    if (fetchOpen) {
      // 3. Fetch from Math_Open if not filtered to RW
      if (!canonicalSection || canonicalSection === "Math") {
        let q = supabase.from("Math_Open").select("*");
        if (difficulty && difficulty !== "All") q = q.eq("difficulty", difficulty);
        if (category) q = q.eq("topic", category);
        const { data, error } = await q;
        if (error) throw error;
        questions = questions.concat((data ?? []).map(mapOpenRow));
      }
    }

    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to fetch questions" });
  }
}
