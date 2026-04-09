import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./_lib/supabase";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { data, error } = await supabase
      .from("programs")
      .select("id, name, details, format, location, price, subject, url, overview")
      .order("name");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to fetch programs" });
  }
}
