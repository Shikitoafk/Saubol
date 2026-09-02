import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, CircleCheck, Clock3, Flame, Target, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadSATTestSessions, type SATTestSessionSummary } from "@/lib/progress-service";

type TopicProgress = { topic: string; subtopic: string | null; questions_attempted: number | null; questions_correct: number | null; mastery_percent: number | null };
type DashboardData = { sessions: SATTestSessionSummary[]; topics: TopicProgress[]; streak: number };
const topicLabel = (topic: TopicProgress) => topic.subtopic || topic.topic || "SAT practice";
const dateLabel = (iso: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

export default function SATDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({ sessions: [], topics: [], streak: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const [sessions, topicsResult, streakResult] = await Promise.all([
        loadSATTestSessions(),
        supabase.from("sat_progress").select("topic, subtopic, questions_attempted, questions_correct, mastery_percent").eq("user_id", session.user.id),
        supabase.from("user_streaks").select("current_streak").eq("user_id", session.user.id).maybeSingle(),
      ]);
      if (!active) return;
      setData({ sessions, topics: (topicsResult.data || []) as TopicProgress[], streak: streakResult.data?.current_streak || 0 });
      setLoading(false);
    };
    void load().catch((error) => { console.error("SAT dashboard load failed:", error); if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  const summary = useMemo(() => {
    const attempted = data.topics.reduce((total, row) => total + Number(row.questions_attempted || 0), 0);
    const correct = data.topics.reduce((total, row) => total + Number(row.questions_correct || 0), 0);
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : null;
    const weakest = [...data.topics.filter((row) => Number(row.questions_attempted || 0) > 0)].sort((a, b) => {
      const percent = (row: TopicProgress) => Number(row.mastery_percent ?? (Number(row.questions_correct || 0) / Math.max(1, Number(row.questions_attempted || 0))) * 100);
      return percent(a) - percent(b);
    })[0];
    return { attempted, accuracy, weakest };
  }, [data.topics]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-9 h-9 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" /></div></Layout>;

  const latestSession = data.sessions[0];
  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <header className="mb-9 flex flex-col gap-5 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
            <div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-500">SAT dashboard</p><h1 className="text-4xl font-black tracking-tight md:text-5xl">Your next best step.</h1><p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">Practice with a clear goal, then use your real results to decide what comes next.</p></div>
            <Button onClick={() => navigate("/sat/past-papers")} className="h-12 shrink-0 rounded-xl bg-ink px-5 font-bold text-background hover:bg-ink/85">Take a full test <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </header>

          <section className="grid gap-4 sm:grid-cols-3" aria-label="SAT progress overview">
            <Metric icon={CircleCheck} label="Questions answered" value={String(summary.attempted)} detail={summary.accuracy === null ? "Start a set to build your record" : `${summary.accuracy}% correct overall`} />
            <Metric icon={Flame} label="Current streak" value={`${data.streak} day${data.streak === 1 ? "" : "s"}`} detail={data.streak ? "Keep it going today" : "Answer a question to begin"} />
            <Metric icon={Trophy} label="Completed tests" value={String(data.sessions.length)} detail={latestSession ? `Latest: ${latestSession.score_percent}%` : "Your reports will appear here"} />
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm md:p-7">
              <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">Recommended next</p><h2 className="mt-2 text-2xl font-black tracking-tight">{summary.weakest ? `Improve ${topicLabel(summary.weakest)}.` : "Build your baseline."}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{summary.weakest ? "This is your lowest recorded topic. A short targeted set is the fastest way to turn today’s data into improvement." : "Choose a topic and complete a short set. Saubol will use your results to highlight what needs attention."}</p></div><Target className="h-8 w-8 shrink-0 text-indigo-500" /></div>
              <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => navigate("/sat/practice")} className="h-11 rounded-xl bg-indigo-600 px-5 font-bold hover:bg-indigo-500">Practice a topic <ArrowRight className="ml-2 h-4 w-4" /></Button><Button onClick={() => navigate("/sat/question-bank")} variant="outline" className="h-11 rounded-xl border-line px-5 font-bold">Open question bank</Button></div>
            </div>
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><ChartNoAxesColumnIncreasing className="h-5 w-5 text-indigo-500" /><h2 className="font-black">Progress, not guesses</h2></div><ul className="mt-5 space-y-4 text-sm text-ink-muted"><li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />Answers are saved to your account after you check them.</li><li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />Completed past papers keep a score report in your history.</li><li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />Your topic accuracy determines what Saubol recommends next.</li></ul></div>
          </section>

          <section className="mt-8 rounded-2xl border border-line bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-line px-6 py-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-black">Recent test reports</h2><p className="mt-1 text-sm text-ink-muted">Only completed attempts are listed here.</p></div><Button onClick={() => navigate("/sat/past-papers")} variant="ghost" className="w-fit font-bold text-indigo-600 hover:text-indigo-700">Browse past papers <ArrowRight className="ml-1 h-4 w-4" /></Button></div>
            {data.sessions.length > 0 ? <div className="divide-y divide-line">{data.sessions.slice(0, 5).map((session) => <article key={session.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600"><BookOpen className="h-5 w-5" /></div><div><h3 className="truncate font-bold">{session.test_period}{session.test_version ? ` · ${session.test_version}` : ""}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><CalendarDays className="h-3.5 w-3.5" />{dateLabel(session.completed_at)} <span aria-hidden>·</span> {session.mode === "exam" ? "Full test" : "Practice"}</p></div></div><div className="flex items-center gap-5 text-sm"><span className="text-ink-muted">{session.questions_correct}/{session.total_questions} correct</span><strong className="text-base">{session.score_percent}%</strong></div></article>)}</div> : <div className="flex flex-col items-start gap-4 px-6 py-9 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">No completed test reports yet.</p><p className="mt-1 text-sm text-ink-muted">Finish a past paper to get a saved report here.</p></div><Button onClick={() => navigate("/sat/past-papers")} variant="outline" className="rounded-xl border-line font-bold">Choose a past paper</Button></div>}
          </section>
          <section className="mt-8 grid gap-4 md:grid-cols-2"><ActionCard icon={Clock3} title="Quick practice" description="Use filters for a targeted set by SAT topic and difficulty." action="Start practice" onClick={() => navigate("/sat/practice")} /><ActionCard icon={Target} title="Full exam practice" description="Use a complete, eligible past paper for a realistic timed attempt." action="View past papers" onClick={() => navigate("/sat/past-papers")} /></section>
        </div>
      </div>
    </Layout>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof CircleCheck; label: string; value: string; detail: string }) { return <article className="rounded-2xl border border-line bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.13em] text-ink-muted">{label}</p><Icon className="h-5 w-5 text-indigo-500" /></div><p className="mt-5 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-sm text-ink-muted">{detail}</p></article>; }
function ActionCard({ icon: Icon, title, description, action, onClick }: { icon: typeof Clock3; title: string; description: string; action: string; onClick: () => void }) { return <article className="flex items-start gap-4 rounded-2xl border border-line bg-card p-6 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="font-black">{title}</h2><p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p><button type="button" onClick={onClick} className="mt-4 inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700">{action} <ArrowRight className="ml-1 h-4 w-4" /></button></div></article>; }
