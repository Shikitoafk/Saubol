import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, CircleCheck, Flame, GraduationCap, Headphones, PencilLine, Trophy } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { loadSATTestSessions, type SATTestSessionSummary } from "@/lib/progress-service";

type SATProgressRow = { questions_attempted: number | null; questions_correct: number | null };
type IELTSProgressRow = { section: string | null; subsection: string | null; best_score: number | null; updated_at: string | null };
type IeltsSession = { id: string; section: string | null; subsection: string | null; score: number | null; completed_at: string };
type DashboardData = { satRows: SATProgressRow[]; satTests: SATTestSessionSummary[]; ieltsRows: IELTSProgressRow[]; ieltsSessions: IeltsSession[]; streak: number };

const dateLabel = (iso: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({ satRows: [], satTests: [], ieltsRows: [], ieltsSessions: [], streak: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login", { replace: true }); return; }
      const [satTests, satResult, ieltsResult, ieltsSessionsResult, streakResult] = await Promise.all([
        loadSATTestSessions(),
        supabase.from("sat_progress").select("questions_attempted, questions_correct").eq("user_id", session.user.id),
        supabase.from("ielts_progress").select("section, subsection, best_score, updated_at").eq("user_id", session.user.id).order("updated_at", { ascending: false }),
        supabase.from("ielts_sessions").select("id, section, subsection, score, completed_at").eq("user_id", session.user.id).order("completed_at", { ascending: false }).limit(5),
        supabase.from("user_streaks").select("current_streak").eq("user_id", session.user.id).maybeSingle(),
      ]);
      if (!active) return;
      setData({
        satRows: (satResult.data || []) as SATProgressRow[],
        satTests,
        ieltsRows: (ieltsResult.data || []) as IELTSProgressRow[],
        ieltsSessions: (ieltsSessionsResult.data || []) as IeltsSession[],
        streak: streakResult.data?.current_streak || 0,
      });
      setLoading(false);
    };
    void load().catch((error) => { console.error("Progress dashboard load failed:", error); if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  const summary = useMemo(() => {
    const attempted = data.satRows.reduce((total, row) => total + Number(row.questions_attempted || 0), 0);
    const correct = data.satRows.reduce((total, row) => total + Number(row.questions_correct || 0), 0);
    const satAccuracy = attempted ? Math.round((correct / attempted) * 100) : null;
    const scores = data.ieltsRows.map((row) => Number(row.best_score || 0)).filter(Boolean);
    const bestIelts = scores.length ? Math.max(...scores) : null;
    return { attempted, correct, satAccuracy, bestIelts };
  }, [data]);

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" /></div></Layout>;

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
    <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Your progress</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Keep the work visible.</h1><p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">This page only uses results you have actually saved. No invented score, level, or ranking.</p></div><Button onClick={() => navigate("/sat")} className="h-11 w-fit rounded-xl bg-ink px-5 font-bold text-background hover:bg-ink/85">Continue studying <ArrowRight className="ml-2 h-4 w-4" /></Button></header>

    <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label="Study overview"><Metric icon={CircleCheck} label="SAT questions answered" value={String(summary.attempted)} detail={summary.satAccuracy === null ? "Start a set to build this record" : `${summary.satAccuracy}% correct overall`} /><Metric icon={Flame} label="Current streak" value={`${data.streak} day${data.streak === 1 ? "" : "s"}`} detail={data.streak ? "Keep it going today" : "Answer a question to begin"} /><Metric icon={Trophy} label="Best IELTS band" value={summary.bestIelts ? summary.bestIelts.toFixed(1) : "—"} detail={summary.bestIelts ? "Highest saved skill score" : "Finish an IELTS test to save a result"} /></section>

    <section className="mt-8 grid gap-5 lg:grid-cols-2"><ProgressPanel icon={GraduationCap} eyebrow="Digital SAT" title="SAT practice" description={summary.attempted ? `${summary.correct} of ${summary.attempted} saved answers are correct. Completed full tests appear below.` : "Choose a topic for targeted practice or take a full past paper when you want a baseline."} primaryLabel={summary.attempted ? "Open SAT progress" : "Start SAT practice"} primaryAction={() => navigate(summary.attempted ? "/sat/dashboard" : "/sat/practice")} secondaryLabel="Past papers" secondaryAction={() => navigate("/sat/past-papers")} /><ProgressPanel icon={Headphones} eyebrow="English proficiency" title="IELTS practice" description={data.ieltsSessions.length ? `${data.ieltsSessions.length} recent saved result${data.ieltsSessions.length === 1 ? "" : "s"}. Continue with the next reading or listening test when you are ready.` : "Your IELTS results will be saved here after you finish a timed test while signed in."} primaryLabel="Explore IELTS" primaryAction={() => navigate("/ielts")} secondaryLabel="Writing checker" secondaryAction={() => navigate("/ielts/writing-checker")} /></section>

    <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><article className="rounded-2xl border border-line bg-card shadow-sm"><div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">SAT reports</p><h2 className="mt-1 text-lg font-black">Recent completed tests</h2></div><button type="button" onClick={() => navigate("/sat/past-papers")} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">All past papers</button></div>{data.satTests.length ? <div className="divide-y divide-line">{data.satTests.slice(0, 4).map((test) => <div key={test.id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate font-bold">{test.test_period}{test.test_version ? ` · ${test.test_version}` : ""}</p><p className="mt-1 text-xs text-ink-muted">{dateLabel(test.completed_at)} · {test.questions_correct}/{test.total_questions} correct</p></div><strong className="shrink-0 text-lg">{test.score_percent}%</strong></div>)}</div> : <EmptyState icon={ChartNoAxesColumnIncreasing} text="Your completed SAT reports will appear here." action="Take a full test" onClick={() => navigate("/sat/past-papers")} />}</article>
      <article className="rounded-2xl border border-line bg-card shadow-sm"><div className="border-b border-line px-6 py-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">IELTS results</p><h2 className="mt-1 text-lg font-black">Recent attempts</h2></div>{data.ieltsSessions.length ? <div className="divide-y divide-line">{data.ieltsSessions.map((session) => <div key={session.id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate font-bold">{session.subsection || session.section || "IELTS practice"}</p><p className="mt-1 text-xs text-ink-muted">{dateLabel(session.completed_at)}</p></div><strong className="shrink-0 text-lg">{Number(session.score || 0).toFixed(1)}</strong></div>)}</div> : <EmptyState icon={PencilLine} text="Finish an IELTS test to keep a result here." action="Explore IELTS" onClick={() => navigate("/ielts")} />}</article></section>
  </div></main></Layout>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof CircleCheck; label: string; value: string; detail: string }) { return <article className="rounded-2xl border border-line bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">{label}</p><Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" /></div><p className="mt-5 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-sm text-ink-muted">{detail}</p></article>; }
function ProgressPanel({ icon: Icon, eyebrow, title, description, primaryLabel, primaryAction, secondaryLabel, secondaryAction }: { icon: typeof GraduationCap; eyebrow: string; title: string; description: string; primaryLabel: string; primaryAction: () => void; secondaryLabel: string; secondaryAction: () => void }) { return <article className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Icon className="h-5 w-5" /></div><p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-300">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2><p className="mt-3 min-h-12 text-sm leading-relaxed text-ink-muted">{description}</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={primaryAction} className="h-10 rounded-xl bg-ink px-4 font-bold text-background hover:bg-ink/85">{primaryLabel} <ArrowRight className="ml-2 h-4 w-4" /></Button><Button onClick={secondaryAction} variant="outline" className="h-10 rounded-xl border-line bg-card font-bold text-ink hover:bg-surface-2">{secondaryLabel}</Button></div></article>; }
function EmptyState({ icon: Icon, text, action, onClick }: { icon: typeof PencilLine; text: string; action: string; onClick: () => void }) { return <div className="flex min-h-44 flex-col items-start justify-center px-6 py-6"><Icon className="h-5 w-5 text-ink-subtle" /><p className="mt-3 text-sm text-ink-muted">{text}</p><button type="button" onClick={onClick} className="mt-4 inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">{action} <ArrowRight className="ml-1 h-4 w-4" /></button></div>; }
