import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardList } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function SatPrep() {
  const nav = useNavigate();

  return (
    <Layout>
      <section className="hero-gradient py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="text-4xl font-bold md:text-5xl">SAT Preparation</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg opacity-90">
            Prepare for the Digital SAT with adaptive practice questions, explanations, and progress tracking.
          </p>
        </div>
      </section>

      <section className="container pb-20">
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-8 shadow-sm">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                <ClipboardList className="h-7 w-7 text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">Practice Questions</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Adaptive SAT question bank with filters by section, category, and difficulty. Includes timer mode and detailed explanations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => nav("/sat/practice")}
              className="w-full bg-violet-600 text-white hover:bg-violet-700 sm:w-auto"
            >
              Start Practice <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
