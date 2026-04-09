import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../_lib/supabase";

interface MetaSection {
  tree: Record<string, Record<string, { total: number; byDifficulty: Record<string, number> }>>;
  sectionTotals: Record<string, number>;
}

const VALID_SECTIONS = new Set(["Math", "Reading & Writing"]);

function buildMeta(rows: { section: string; category: string; difficulty: string }[]): MetaSection {
  const tree: MetaSection["tree"] = {};
  const sectionTotals: Record<string, number> = {};

  for (const row of rows) {
    const { section, category, difficulty } = row;
    if (!VALID_SECTIONS.has(section) || !category) continue;

    if (!tree[section]) tree[section] = {};
    if (!tree[section][category]) tree[section][category] = { total: 0, byDifficulty: {} };

    tree[section][category].total++;
    tree[section][category].byDifficulty[difficulty] =
      (tree[section][category].byDifficulty[difficulty] ?? 0) + 1;
    sectionTotals[section] = (sectionTotals[section] ?? 0) + 1;
  }

  return { tree, sectionTotals };
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const [mcqRes, openRes] = await Promise.all([
      supabase.from("SAT_MCQ").select("section, category, difficulty"),
      supabase.from("SAT_Open").select("section, category, difficulty"),
    ]);

    if (mcqRes.error) throw mcqRes.error;
    if (openRes.error) throw openRes.error;

    const mcqRows = mcqRes.data ?? [];
    const openRows = openRes.data ?? [];

    res.json({
      all: buildMeta([...mcqRows, ...openRows]),
      mcq: buildMeta(mcqRows),
      open: buildMeta(openRows),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to fetch meta" });
  }
}
