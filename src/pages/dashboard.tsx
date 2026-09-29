import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Mic, PenLine } from "lucide-react";
import { Layout } from "@/components/layout";
import { supabase } from "@/lib/supabase";

type IeltsSession = { id: string; section: string | null; subsection: string | null; score: number | null; completed_at: string };

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<IeltsSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!active) return;
      if (authError) { setError("Could not load your account. Please try again."); setLoading(false); return; }
      if (!session) { navigate("/login", { replace: true }); return; }
      const result = await supabase.from("ielts_sessions").select("id, section, subsection, score, completed_at").eq("user_id", session.user.id).order("completed_at", { ascending: false }).limit(30);
      if (!active) return;
      if (result.error) setError("Could not load saved IELTS results. Please try again later.");
      else setSessions(((result.data || []) as IeltsSession[]).filter((item) => item.section !== "speaking").slice(0, 10));
      setLoading(false);
    };
    void load().catch(() => { if (active) { setError("Could not load saved IELTS results. Please try again later."); setLoading(false); } });
    return () => { active = false; };
  }, [navigate]);

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32"><header className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Your study space</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Keep practising.</h1><p className="mt-4 text-ink-muted">Saved IELTS test attempts appear here. Writing drafts and speaking notes stay in the browser where you created them.</p></header>
    <section className="mt-9 grid gap-4 sm:grid-cols-3"><Action href="/ielts" icon={BookOpen} title="Reading & Listening" detail="Open the IELTS practice library" /><Action href="/ielts/writing" icon={PenLine} title="Writing" detail="Continue an essay draft" /><Action href="/ielts/speaking" icon={Mic} title="Speaking" detail="Record and review an answer" /></section>
    <section className="mt-10 rounded-2xl border border-line bg-card shadow-sm"><div className="border-b border-line px-6 py-5"><h2 className="text-xl font-black">Recent IELTS results</h2><p className="mt-1 text-sm text-ink-muted">Only completed attempts that were actually saved to your account.</p></div>{loading ? <p className="p-6 text-sm text-ink-muted">Loading results…</p> : error ? <p role="alert" className="p-6 text-sm text-rose-600">{error}</p> : sessions.length ? <div className="divide-y divide-line">{sessions.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-semibold">{item.subsection || item.section || "IELTS practice"}</p><p className="mt-1 text-xs text-ink-muted">{new Date(item.completed_at).toLocaleDateString()}</p></div><span className="text-lg font-black">{typeof item.score === "number" ? item.score.toFixed(1) : "—"}</span></div>)}</div> : <div className="p-6"><p className="text-sm text-ink-muted">No completed IELTS tests saved yet.</p><Link to="/ielts" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600">Explore practice <ArrowRight className="h-4 w-4" /></Link></div>}</section>
  </div></main></Layout>;
}

function Action({ href, icon: Icon, title, detail }: { href: string; icon: typeof BookOpen; title: string; detail: string }) { return <Link to={href} className="group rounded-2xl border border-line bg-card p-6 shadow-sm transition-colors hover:border-indigo-400"><Icon className="h-6 w-6 text-indigo-600" /><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-ink-muted">{detail}</p><ArrowRight className="mt-5 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>; }
