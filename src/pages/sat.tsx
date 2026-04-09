import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  ClipboardList,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Section = "rw" | "math";
type TestType = "full" | "module";

interface TestItem {
  id: string;
  name: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: number;
  time: string;
  slug: string;
  section: Section;
}

const sections: { id: Section; icon: typeof BookOpen; title: string; description: string; color: string }[] = [
  {
    id: "rw",
    icon: BookOpen,
    title: "Reading & Writing",
    description: "Information & Ideas, Craft & Structure, Expression of Ideas, Standard English",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-200 hover:border-blue-400",
  },
  {
    id: "math",
    icon: Calculator,
    title: "Math",
    description: "Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 hover:border-emerald-400",
  },
];

const testTypes: { id: TestType; icon: typeof ClipboardList; title: string; description: string }[] = [
  {
    id: "full",
    icon: ClipboardList,
    title: "Full Practice Tests",
    description: "Official College Board Digital SAT practice tests (Tests 1–6)",
  },
  {
    id: "module",
    icon: Layers,
    title: "Module Practice",
    description: "Practice individual modules to target specific skills and difficulty levels",
  },
];

const rwFullTests: TestItem[] = [
  { id: "rw-1-m1", name: "Practice Test 1 — Module 1", topic: "Information & Ideas · Craft & Structure", difficulty: "Medium", questions: 27, time: "32 min", slug: "sat1-rw-m1", section: "rw" },
  { id: "rw-1-m2", name: "Practice Test 1 — Module 2", topic: "Expression of Ideas · Standard English", difficulty: "Hard", questions: 27, time: "32 min", slug: "sat1-rw-m2", section: "rw" },
  { id: "rw-2-m1", name: "Practice Test 2 — Module 1", topic: "Information & Ideas · Craft & Structure", difficulty: "Medium", questions: 27, time: "32 min", slug: "sat2-rw-m1", section: "rw" },
  { id: "rw-2-m2", name: "Practice Test 2 — Module 2", topic: "Expression of Ideas · Standard English", difficulty: "Hard", questions: 27, time: "32 min", slug: "sat2-rw-m2", section: "rw" },
  { id: "rw-3-m1", name: "Practice Test 3 — Module 1", topic: "Information & Ideas · Craft & Structure", difficulty: "Easy", questions: 27, time: "32 min", slug: "sat3-rw-m1", section: "rw" },
  { id: "rw-3-m2", name: "Practice Test 3 — Module 2", topic: "Expression of Ideas · Standard English", difficulty: "Medium", questions: 27, time: "32 min", slug: "sat3-rw-m2", section: "rw" },
];

const mathFullTests: TestItem[] = [
  { id: "math-1-m1", name: "Practice Test 1 — Module 1", topic: "Algebra · Problem-Solving & Data Analysis", difficulty: "Medium", questions: 27, time: "35 min", slug: "sat1-math-m1", section: "math" },
  { id: "math-1-m2", name: "Practice Test 1 — Module 2", topic: "Advanced Math · Geometry & Trigonometry", difficulty: "Hard", questions: 27, time: "35 min", slug: "sat1-math-m2", section: "math" },
  { id: "math-2-m1", name: "Practice Test 2 — Module 1", topic: "Algebra · Problem-Solving & Data Analysis", difficulty: "Medium", questions: 27, time: "35 min", slug: "sat2-math-m1", section: "math" },
  { id: "math-2-m2", name: "Practice Test 2 — Module 2", topic: "Advanced Math · Geometry & Trigonometry", difficulty: "Hard", questions: 27, time: "35 min", slug: "sat2-math-m2", section: "math" },
  { id: "math-3-m1", name: "Practice Test 3 — Module 1", topic: "Algebra · Problem-Solving & Data Analysis", difficulty: "Easy", questions: 27, time: "35 min", slug: "sat3-math-m1", section: "math" },
  { id: "math-3-m2", name: "Practice Test 3 — Module 2", topic: "Advanced Math · Geometry & Trigonometry", difficulty: "Medium", questions: 27, time: "35 min", slug: "sat3-math-m2", section: "math" },
];

const rwModuleTests: TestItem[] = [
  { id: "rw-mod-1", name: "Craft & Structure — Set A", topic: "Words in Context, Text Structure & Purpose, Cross-Text", difficulty: "Easy", questions: 13, time: "16 min", slug: "rw-craft-a", section: "rw" },
  { id: "rw-mod-2", name: "Information & Ideas — Set A", topic: "Command of Evidence, Central Ideas, Inferences", difficulty: "Medium", questions: 13, time: "16 min", slug: "rw-info-a", section: "rw" },
  { id: "rw-mod-3", name: "Expression of Ideas — Set A", topic: "Rhetorical Synthesis, Transitions", difficulty: "Medium", questions: 8, time: "10 min", slug: "rw-expr-a", section: "rw" },
  { id: "rw-mod-4", name: "Standard English — Set A", topic: "Boundaries, Form/Structure/Sense", difficulty: "Easy", questions: 11, time: "13 min", slug: "rw-std-a", section: "rw" },
  { id: "rw-mod-5", name: "Craft & Structure — Set B", topic: "Words in Context, Text Structure & Purpose, Cross-Text", difficulty: "Hard", questions: 13, time: "16 min", slug: "rw-craft-b", section: "rw" },
  { id: "rw-mod-6", name: "Information & Ideas — Set B", topic: "Command of Evidence, Central Ideas, Inferences", difficulty: "Hard", questions: 13, time: "16 min", slug: "rw-info-b", section: "rw" },
];

const mathModuleTests: TestItem[] = [
  { id: "math-mod-1", name: "Algebra — Set A", topic: "Linear Equations, Systems, Linear Functions", difficulty: "Easy", questions: 13, time: "15 min", slug: "math-algebra-a", section: "math" },
  { id: "math-mod-2", name: "Advanced Math — Set A", topic: "Nonlinear Equations, Polynomials, Functions", difficulty: "Medium", questions: 13, time: "15 min", slug: "math-advanced-a", section: "math" },
  { id: "math-mod-3", name: "Problem-Solving & Data — Set A", topic: "Ratios, Rates, Statistics, Probability", difficulty: "Medium", questions: 10, time: "12 min", slug: "math-data-a", section: "math" },
  { id: "math-mod-4", name: "Geometry & Trigonometry — Set A", topic: "Area, Volume, Angles, Trigonometry", difficulty: "Hard", questions: 9, time: "11 min", slug: "math-geo-a", section: "math" },
  { id: "math-mod-5", name: "Algebra — Set B", topic: "Linear Equations, Systems, Linear Functions", difficulty: "Hard", questions: 13, time: "15 min", slug: "math-algebra-b", section: "math" },
  { id: "math-mod-6", name: "Advanced Math — Set B", topic: "Nonlinear Equations, Polynomials, Functions", difficulty: "Hard", questions: 13, time: "15 min", slug: "math-advanced-b", section: "math" },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

const AVAILABLE_SLUGS = new Set([
  "sat1-rw-m1",
  "sat1-math-m1",
]);

export default function SatPrep() {
  const nav = useNavigate();
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedType, setSelectedType] = useState<TestType | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const level = selectedType ? 3 : selectedSection ? 2 : 1;

  const animate = (dir: "forward" | "back", cb: () => void) => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { cb(); setAnimating(false); }, 220);
  };

  const goToSection = (s: Section) => animate("forward", () => setSelectedSection(s));
  const goToType = (t: TestType) => animate("forward", () => setSelectedType(t));

  const goBack = () => {
    if (selectedType) {
      animate("back", () => { setSelectedType(null); setTests([]); });
    } else if (selectedSection) {
      animate("back", () => setSelectedSection(null));
    }
  };

  useEffect(() => {
    if (!selectedSection || !selectedType) return;
    if (selectedSection === "rw") {
      setTests(selectedType === "full" ? rwFullTests : rwModuleTests);
    } else {
      setTests(selectedType === "full" ? mathFullTests : mathModuleTests);
    }
  }, [selectedSection, selectedType]);

  const slideClass = animating
    ? direction === "forward" ? "animate-slide-in-forward" : "animate-slide-in-back"
    : "";

  const sectionLabel = selectedSection ? sections.find((s) => s.id === selectedSection)?.title : "";
  const typeLabel = selectedType ? testTypes.find((t) => t.id === selectedType)?.title : "";

  return (
    <Layout>
      <section className="hero-gradient py-16 text-primary-foreground">
        <div className="container text-center">
          <h1 className="text-4xl font-bold md:text-5xl">SAT Preparation</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg opacity-90">
            Master the Digital SAT with section-by-section practice modules and full official tests
          </p>
        </div>
      </section>

      <div className="container pt-8 pb-2">
        <div className="flex items-center gap-4">
          {level > 1 && (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {level === 1 ? (
                  <BreadcrumbPage>SAT</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => animate("back", () => { setSelectedSection(null); setSelectedType(null); setTests([]); })}
                  >
                    SAT
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {selectedSection && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {level === 2 ? (
                      <BreadcrumbPage>{sectionLabel}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => animate("back", () => { setSelectedType(null); setTests([]); })}
                      >
                        {sectionLabel}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {selectedType && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{typeLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <section className="container pb-20">
        <div className={`transition-all duration-220 ${slideClass}`}>

          {/* Level 1: Section selection */}
          {level === 1 && (
            <>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => goToSection(s.id)}
                    className={`group flex flex-col rounded-xl border-2 bg-gradient-to-br p-8 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-md ${s.color}`}
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 shadow-sm group-hover:scale-110 transition-transform">
                      <s.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground flex-1 leading-relaxed">{s.description}</p>
                    <span className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
                      Practice Now <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-10">
                <button
                  onClick={() => nav("/sat/practice")}
                  className="group w-full flex items-center justify-between rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-7 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-md hover:border-violet-400"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 shadow-sm group-hover:scale-110 transition-transform">
                      <ClipboardList className="h-7 w-7 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-card-foreground">Practice Questions</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-lg">
                        Adaptive question bank — filter by difficulty, category, and section. Timer, explanations & progress tracking included.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-violet-500 shrink-0 ml-4" />
                </button>
              </div>
            </>
          )}

          {/* Level 2: Test type selection */}
          {level === 2 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {testTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => goToType(t.id)}
                  className="group flex flex-col rounded-xl border bg-card p-8 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <t.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground flex-1">{t.description}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    View Tests <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Level 3: Test list */}
          {level === 3 && (
            <div className="mt-4">
              {tests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p>Loading tests…</p>
                </div>
              )}

              {tests.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tests.map((t, i) => {
                    const available = AVAILABLE_SLUGS.has(t.slug);
                    return (
                      <div
                        key={t.id}
                        className={`group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all ${available ? "hover:-translate-y-1 hover:shadow-md hover:border-primary/30" : "opacity-70"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            {selectedSection === "rw" ? "R&W" : "Math"} · {i + 1}
                          </span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[t.difficulty]}`}>
                            {t.difficulty}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-card-foreground leading-snug">{t.name}</h3>
                        {t.topic && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t.topic}</p>}
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3.5 w-3.5" /> {t.questions} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {t.time}
                          </span>
                        </div>
                        <Button
                          className="mt-5"
                          size="sm"
                          variant={available ? "default" : "outline"}
                          onClick={() => available && nav(`/sat/test/${t.section}/${t.slug}`)}
                          disabled={!available}
                        >
                          {available ? "Start Test" : "Coming Soon"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
