import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardList, Clock, Target } from "lucide-react";
import { Layout } from "@/components/layout";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink">
        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-32 sm:px-10 sm:pt-40">
          <section className="grid gap-12 border-b border-line pb-16 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="mb-6 text-sm font-semibold text-indigo-600">Your study space for what comes next</p>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
                Prepare with clarity.
                <span className="block text-ink-muted">Move abroad with confidence.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-ink-muted">
                Free IELTS practice and a focused SAT question bank — designed for the work that actually gets you ready.
              </p>
              <button type="button" onClick={() => navigate("/sat/practice")} className="mt-9 inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-canvas transition-colors hover:bg-ink-muted">
                Start SAT practice <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <aside className="border-l border-line pl-6 lg:pb-1">
              <p className="text-sm font-medium text-ink">No feed. No noise.</p>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Pick a test, stay with the question, and keep moving. Saubol is made to feel like a dependable desk, not another app fighting for your attention.
              </p>
            </aside>
          </section>

          <section className="grid gap-5 py-14 md:grid-cols-2">
            <button type="button" onClick={() => navigate("/ielts")} className="group rounded-2xl border border-line bg-surface p-7 text-left transition-colors hover:border-line-strong hover:bg-surface-2 sm:p-9">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5" /></div>
                <ArrowRight className="h-5 w-5 text-ink-subtle transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-10 text-sm font-medium text-ink-muted">English proficiency</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">IELTS practice</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">Reading and listening practice in a calm, timed test environment.</p>
              <span className="mt-7 inline-block text-sm font-semibold text-ink">Explore IELTS</span>
            </button>

            <button type="button" onClick={() => navigate("/sat/practice")} className="group rounded-2xl border border-line bg-surface p-7 text-left transition-colors hover:border-line-strong hover:bg-surface-2 sm:p-9">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><ClipboardList className="h-5 w-5" /></div>
                <ArrowRight className="h-5 w-5 text-ink-subtle transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-10 text-sm font-medium text-ink-muted">College admissions</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">SAT question bank</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">Work by section, skill, and difficulty — then focus on the gaps that matter.</p>
              <span className="mt-7 inline-block text-sm font-semibold text-ink">Start practising</span>
            </button>
          </section>

          <section className="grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
            <div className="flex gap-4"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" /><div><h3 className="text-sm font-semibold">Study at your pace</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Short practice sessions or a full timed test when you have the space.</p></div></div>
            <div className="flex gap-4"><Target className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" /><div><h3 className="text-sm font-semibold">Find the weak point</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Choose the skill you want to improve instead of scrolling through a pile of content.</p></div></div>
            <div className="flex gap-4"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" /><div><h3 className="text-sm font-semibold">Keep it practical</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Materials are the point. The interface stays out of your way.</p></div></div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
