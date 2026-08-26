import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookMarked, CheckCircle2, LockKeyhole } from "lucide-react";
import { Layout } from "@/components/layout";

export default function SATCollections() {
  const navigate = useNavigate();

  return (
    <Layout>
      <main className="min-h-screen bg-canvas px-6 pb-20 pt-28 text-ink sm:px-10">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => navigate("/sat")} className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> SAT home
          </button>

          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-indigo-500"><BookMarked className="h-4 w-4" /> Curated practice</div>
              <h1 className="font-display text-5xl font-black italic tracking-tight sm:text-7xl">COLLECTIONS.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">Focused sets by topic, level, or goal. Collections are separate from full Past Papers and the adaptive Question Bank.</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-xs font-semibold text-ink-muted">New verified sets will appear here.</div>
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="glass-3d min-h-64 border-indigo-500/20 p-8">
              <span className="inline-flex rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Math</span>
              <h2 className="mt-8 text-3xl font-black tracking-tight">Hard problem sets</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">High-difficulty practice, organized by SAT Math topic. Each question must have a verified answer before publication.</p>
              <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-ink-muted"><CheckCircle2 className="h-4 w-4 text-indigo-500" /> Answer-check workflow enabled</div>
            </article>
            <article className="glass-3d min-h-64 border-line p-8">
              <LockKeyhole className="h-7 w-7 text-ink-muted" />
              <h2 className="mt-7 text-3xl font-black tracking-tight">Licensed or original only</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">This space is ready for material you created, own, or have permission to publish. It avoids mixing third-party books into public SAT practice.</p>
            </article>
          </section>
        </div>
      </main>
    </Layout>
  );
}
