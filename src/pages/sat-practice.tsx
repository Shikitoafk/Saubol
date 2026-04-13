import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import katex, { renderMathInElement } from "katex";
import { KATEX_OPTS, MATH_CMDS, tryKaTeX } from "./katex-utils";
import { env } from "@xenova/transformers";
import { answerQuestion } from "@/lib/reading-assistant";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  Shuffle,
  Eye,
  BookOpen,
  Calculator,
  ListFilter,
  Play,
  X,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

/* Add global KaTeX CSS fixes */
const katexStyles = `
.katex { 
  font-size: 1em !important; 
  line-height: 1.2;
}
.katex-display { 
  font-size: 1em !important; 
  margin: 0.5em 0; 
  line-height: 1.2;
}
.katex-html { 
  white-space: normal; 
}
.katex .base {
  position: relative;
  white-space: nowrap;
  width: min-content;
}
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = katexStyles;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════════════════════════════════
   KaTeX rendering
   ════════════════════════════════════════════════════════════════════ */
const KATEX_OPTS = { throwOnError: false, errorColor: "#f87171" };

const MATH_CMDS = new Set([
  "sqrt","frac","pi","phi","psi","tau","epsilon","eta","kappa","nu","xi","rho",
  "zeta","varphi","varepsilon","times","cdot","div","pm","mp","neq","ne","approx",
  "infty","le","ge","leq","geq","alpha","beta","gamma","Gamma","delta","Delta",
  "theta","Theta","lambda","Lambda","mu","sigma","Sigma","omega","Omega","chi","Chi",
  "sum","prod","int","oint","lim","log","ln","exp","sin","cos","tan","cot","sec",
  "csc","arcsin","arccos","arctan","sinh","cosh","tanh","max","min","sup","inf",
  "rightarrow","leftarrow","Rightarrow","Leftarrow","to","in","notin","subset",
  "supset","cup","cap","forall","exists","partial","nabla","perp","parallel",
  "angle","triangle","vec","hat","bar","overline","binom","ldots","cdots","circ",
  "ell","text","mathrm","mathbf","mathbb","not","neg",
]);

function tryKaTeX(math: string, display = false): string | null {
  try { return katex.renderToString(math, { ...KATEX_OPTS, displayMode: display }); }
  catch { return null; }
}

/** Apply a transformation only to plain-text segments (outside existing $…$ math). */
function applyToTextParts(text: string, fn: (s: string) => string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/);
  return parts.map((p, i) => (i % 2 === 0 ? fn(p) : p)).join("");
}

/**
 * cleanQuestion — normalises raw question text and wraps every math
 * expression in $…$ so that renderKaTeX can render them uniformly.
 *
 * Handles:
 *   sqrt(x)           →  \sqrt{x}   →  $\sqrt{x}$
 *   Npi / word pi     →  N\pi       →  $N\pi$
 *   \sqrt{…}, \frac   →  $\sqrt{…}$
 *   x^2, (expr)^n     →  $x^{2}$
 */
function cleanQuestion(raw: string): string {
  if (!raw) return "";
  let out = raw;

  // ---- 1. Handle ^{...} without $ (wrap in $) ----------------------
  out = applyToTextParts(out, (seg) => {
    // Handle ^{...} patterns that aren't already in math mode
    seg = seg.replace(/(\w+)\^(\{[^{}]+\})/g, "$$$1^$2$$");
    return seg;
  });

  // ---- 2. Handle \frac without $ (wrap in $) -----------------------
  out = applyToTextParts(out, (seg) => {
    // Handle \frac{...}{...} patterns that aren't already in math mode
    seg = seg.replace(/\\frac(\{[^{}]+\})(\{[^{}]+\})/g, "$$\\frac$1$2$$");
    return seg;
  });

  // ---- 3. Handle standalone numbers like "2^2" -> $2^{2}$ -----------
  out = applyToTextParts(out, (seg) => {
    // Handle number^number patterns that aren't already in math mode
    seg = seg.replace(/(\d+)\^(\d+)/g, "$$$1^{$2}$$");
    // Handle number^{...} patterns
    seg = seg.replace(/(\d+)\^(\{[^{}]+\})/g, "$$$1^$2$$");
    return seg;
  });

  // ---- 4. Normalise non-LaTeX notation -----------------------------
  // sqrt(X) -> \sqrt{X}
  out = out.replace(/(?<![a-zA-Z\\])sqrt\(([^)]*)\)/g, "\\sqrt{$1}");
  // [letter]sqrt{ -> [letter]\sqrt{  (e.g. asqrt{ -> a\sqrt{)
  out = out.replace(/([a-zA-Z0-9])sqrt(\{)/g, "$1\\sqrt$2");
  // Npi / N.Npi -> N\pi   (e.g. 112pi -> 112\pi)
  out = out.replace(/(\d+(?:\.\d+)?)pi(?![a-zA-Z])/g, "$1\\pi");
  // "pi" after an operator/digit  (e.g. "= 16pi.")
  out = out.replace(/([\d\s*+\-/(=,])pi([\s*+\-/)^,.])/g, "$1\\pi$2");

  // Common OCR artifact: x2 / y3 / t10 intended as powers.
  // Convert standalone variable+digits tokens to caret form.
  out = applyToTextParts(out, (seg) => {
    // x2 -> x^2, y10 -> y^10
    seg = seg.replace(/\b([a-zA-Z])(\d{1,2})\b/g, "$1^$2");
    // 4x2 -> 4x^2 (keeps coefficient)
    seg = seg.replace(/(\d)([a-zA-Z])(\d{1,2})(?!\d)/g, "$1$2^$3");
    return seg;
  });

  // ---- 5. Wrap \LaTeX commands in $...$ (skip existing math regions) --
  out = applyToTextParts(out, (seg) =>
    seg.replace(
      /\\([a-zA-Z]+)((?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}){0,2})/g,
      (match, cmd) => (MATH_CMDS.has(cmd) ? `$${match}$` : match)
    )
  );

  // ---- 6. Wrap bare caret expressions in $...$ (skip math regions) ----
  out = applyToTextParts(out, (seg) => {
    // (expr)^exponent  e.g. (x+2)^2  (1.001)^((x-4)/2)
    seg = seg.replace(
      /\(([^()]*)\)\^([a-zA-Z0-9{}()+\-*/\\]+)/g,
      "$$($1)^{$2}$$"
    );
    // var^exponent  e.g. x^2  t^3  4.9t^2  f^n
    // (?<![\\{]) guards against matching inside already-processed LaTeX
    seg = seg.replace(/(?<![\\{])([a-zA-Z])\^([a-zA-Z0-9]+)(?![a-zA-Z0-9])/g, "$$$1^{$2}$$");
    return seg;
  });

  return out;
}

function renderKaTeX(raw: string): string {
  if (!raw) return "";
  let out = cleanQuestion(raw);

  // Render $$ … $$ display blocks
  out = out.replace(/\$\$([^$]+?)\$\$/gs, (_, m) =>
    tryKaTeX(m, true) ?? `$$${m}$$`
  );

  // Render $ … $ inline math
  out = out.replace(/\$([^$\n]{1,600}?)\$/g, (_, m) =>
    tryKaTeX(m) ?? `$${m}$`
  );

  return out;
}

function MathText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const html = useMemo(() => renderKaTeX(text || ""), [text]);
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════ */
interface SATQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  category: string;
  section: string;
  isFreeResponse: boolean;
}

interface MetaCategory { total: number; byDifficulty: Record<string, number>; }
interface SectionMeta { tree: Record<string, Record<string, MetaCategory>>; sectionTotals: Record<string, number>; }
interface Meta { all: SectionMeta; mcq: SectionMeta; open: SectionMeta; }
type QuestionType = "all" | "mcq" | "open";

type RawSATMetaRow = { section: string; category: string; difficulty: string };
type RawMCQRow = {
  id: string | number;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  explanation: string | null;
  difficulty: string | null;
  category: string | null;
  section: string | null;
};
type RawOpenRow = {
  id: string | number;
  question: string | null;
  correct_answer: string | null;
  explanation: string | null;
  difficulty: string | null;
  category: string | null;
  section: string | null;
};

type Phase = "bank" | "quiz" | "results";
type AnswerState =
  | { type: "mc"; selected: string; correct: boolean }
  | { type: "fr"; userAnswer: string; correct: boolean }
  | null;

/* ════════════════════════════════════════════════════════════════════
   Persistence
   ════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = "sat_practice_progress";

function loadProgress(): Record<string, { correct: boolean; timestamp: number }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

async function saveProgress(questionId: string, question: SATQuestion, correct: boolean) {
  // Fallback to localStorage for logged out users
  const p = loadProgress();
  p[questionId] = { correct, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

async function saveProgressToSupabase(question: SATQuestion, correct: boolean) {
  try {
    console.log('SAT Practice: Saving progress to Supabase...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('SAT Practice: No session found, skipping Supabase save');
      return; // not logged in, skip
    }
    
    console.log('SAT Practice: Session found, saving to user_progress table');
    await supabase.from('user_progress').insert({
      user_id: session.user.id,
      question_id: question.id,
      section: question.section,
      category: question.category,
      difficulty: question.difficulty,
      correct: correct,
    });
    
    console.log('SAT Practice: Progress saved successfully to Supabase');
  } catch (error) {
    console.error('SAT Practice: Error saving progress to Supabase:', error);
  }
}

/* ════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════ */
function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function normalizeAnswer(a: string) {
  return a.trim().toLowerCase().replace(/\s+/g, "");
}

const VALID_SECTIONS = new Set(["Math", "Reading & Writing"]);

function buildMeta(rows: RawSATMetaRow[]): SectionMeta {
  const tree: SectionMeta["tree"] = {};
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

function mapMCQ(r: RawMCQRow): SATQuestion {
  return {
    id: `mcq-${r.id}`,
    question: r.question ?? "",
    optionA: r.option_a ?? "",
    optionB: r.option_b ?? "",
    optionC: r.option_c ?? "",
    optionD: r.option_d ?? "",
    correctAnswer: (r.correct_answer ?? "").trim().toUpperCase(),
    explanation: r.explanation ?? "",
    difficulty: r.difficulty ?? "Medium",
    category: r.category ?? "",
    section: r.section ?? "",
    isFreeResponse: false,
  };
}

function mapOpen(r: RawOpenRow): SATQuestion {
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
    category: r.category ?? "",
    section: r.section ?? "",
    isFreeResponse: true,
  };
}

async function fetchSATMeta(): Promise<Meta> {
  const [mcqRes, openRes] = await Promise.all([
    supabase.from("SAT_MCQ").select("section, category, difficulty"),
    supabase.from("SAT_Open").select("section, category, difficulty"),
  ]);

  if (mcqRes.error) throw mcqRes.error;
  if (openRes.error) throw openRes.error;

  const mcqRows = (mcqRes.data ?? []) as RawSATMetaRow[];
  const openRows = (openRes.data ?? []) as RawSATMetaRow[];

  return {
    all: buildMeta([...mcqRows, ...openRows]),
    mcq: buildMeta(mcqRows),
    open: buildMeta(openRows),
  };
}

async function fetchQuestionsFromSupabase(section?: string, category?: string, type: QuestionType = "all"): Promise<SATQuestion[]> {
  const fetchMCQ = type === "all" || type === "mcq";
  const fetchOpen = type === "all" || type === "open";
  let questions: SATQuestion[] = [];

  if (fetchMCQ) {
    let q = supabase.from("SAT_MCQ").select("*");
    if (category) q = q.eq("category", category);
    if (section) q = q.eq("section", section);
    const { data, error } = await q;
    if (error) throw error;
    questions = questions.concat(((data ?? []) as RawMCQRow[]).map(mapMCQ));
  }

  if (fetchOpen) {
    let q = supabase.from("SAT_Open").select("*");
    if (category) q = q.eq("category", category);
    if (section) q = q.eq("section", section);
    const { data, error } = await q;
    if (error) throw error;
    questions = questions.concat(((data ?? []) as RawOpenRow[]).map(mapOpen));
  }

  return questions;
}

/* ════════════════════════════════════════════════════════════════════
   Circular Timer
   ════════════════════════════════════════════════════════════════════ */
function CircleTimer({ elapsed }: { elapsed: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = (elapsed % 60) / 60;
  const dash = circ * (1 - fill);
  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg width="56" height="56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(129,140,248,0.7)" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
      </svg>
      <span className="relative z-10 text-[11px] font-mono text-white/70">{formatTime(elapsed)}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Desmos Calculator Panel
   ════════════════════════════════════════════════════════════════════ */
function DesmosPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"graphing" | "scientific">("graphing");
  const src = mode === "graphing"
    ? "https://www.desmos.com/calculator"
    : "https://www.desmos.com/scientific";

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-all"
        style={{ 
          width: "40px", 
          height: "40px", 
          background: "#6b7280", 
          border: "none",
          boxShadow: "none"
        }}
        title={open ? "Close calculator" : "Open Desmos calculator"}
      >
        {open
          ? <X className="h-4 w-4 text-white" />
          : <span className="text-white text-sm font-medium">⌗</span>
        }
      </button>

      <div
        className="fixed top-0 right-0 z-40 flex flex-col shadow-2xl transition-transform duration-300"
        style={{
          width: 400,
          height: "100dvh",
          background: "#0e1629",
          border: "1px solid rgba(99,102,241,0.2)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span className="text-sm font-semibold text-white/80">Calculator</span>
          <div className="flex gap-1">
            {(["graphing", "scientific"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${mode === m ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <iframe src={src} title="Desmos" className="flex-1 w-full" style={{ border: "none" }} />
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Bank sub-components
   ════════════════════════════════════════════════════════════════════ */
const SECTION_STYLE: Record<string, { bg: string; icon: typeof BookOpen }> = {
  "Reading & Writing": { bg: "from-violet-500 to-purple-600", icon: BookOpen },
  Math: { bg: "from-sky-400 to-blue-500", icon: Calculator },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-600", Medium: "text-amber-600", Hard: "text-red-500",
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${on ? "bg-blue-500" : "bg-gray-300"}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function Dropdown({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:border-primary/50 transition-colors">
        <span className="text-muted-foreground text-xs">{label}:</span>
        <span className="font-medium">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg border bg-white shadow-lg py-1">
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${value === opt ? "font-semibold text-primary" : "text-foreground"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════════ */
export default function SATPractice() {
  const nav = useNavigate();

  const [meta, setMeta] = useState<Meta | null>(null);
  const [allQuestions, setAllQuestions] = useState<SATQuestion[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [multiSelect, setMultiSelect] = useState(false);
  const [randomize, setRandomize] = useState(true);
  const [showAttempts, setShowAttempts] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterCompleted, setFilterCompleted] = useState("All");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [questionType, setQuestionType] = useState<QuestionType>("all");

  const [phase, setPhase] = useState<Phase>("bank");
  const [questions, setQuestions] = useState<SATQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<{ type: QuestionType | null; selected: string | null }>({ type: null, selected: null });
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, { selected?: string; correct?: boolean }>>({});
  const [elapsed, setElapsed] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Reading Assistant state
  const [passageText, setPassageText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [isAnalyzingQuestion, setIsAnalyzingQuestion] = useState(false);
  const frInputRef = useRef<HTMLInputElement>(null);

  const progress = loadProgress();

  useEffect(() => {
    fetchSATMeta()
      .then((d) => setMeta(d))
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoadingMeta(false));
  }, []);

  // Render math after every question loads
  useEffect(() => {
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
        ],
        throwOnError: false,
      });
    }
  }, [currentIdx, answerState]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => () => stopTimer(), [stopTimer]);

  function topicKey(section: string, category?: string) {
    return category ? `${section}::${category}` : section;
  }

  function toggleTopic(key: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const activeMeta = meta ? meta[questionType] : null;

  function countForTopics(topics: Set<string>) {
    if (!activeMeta) return 0;
    let total = 0;
    for (const key of topics) {
      const [section, category] = key.split("::");
      if (category) total += activeMeta.tree[section]?.[category]?.total ?? 0;
      else total += activeMeta.sectionTotals[section] ?? 0;
    }
    return total;
  }

  function applyLocalFilters(qs: SATQuestion[]) {
    if (filterDifficulty !== "All") qs = qs.filter((q) => q.difficulty === filterDifficulty);
    const prog = loadProgress();
    if (filterCompleted === "New") qs = qs.filter((q) => !prog[q.id]);
    if (filterCompleted === "Completed") qs = qs.filter((q) => !!prog[q.id]);
    if (randomize) qs = [...qs].sort(() => Math.random() - 0.5);
    return qs;
  }

  async function fetchQuestions(section?: string, category?: string, type: QuestionType = "all") {
    return fetchQuestionsFromSupabase(section, category, type);
  }

  function launchQuiz(qs: SATQuestion[]) {
    const filtered = applyLocalFilters(qs);
    if (filtered.length === 0) { setLoadingQuestions(false); return; }
    setAllQuestions(filtered);
    setQuestions(filtered);
    setCurrentIdx(0);
    setAnswerState(null);
    setShowExp(false);
    setFrInput("");
    setSessionAnswers({});
    setElapsed(0);
    setPhase("quiz");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function startQuiz(section?: string, category?: string) {
    setLoadingQuestions(true);
    setFetchError(null);
    try { launchQuiz(await fetchQuestions(section, category, questionType)); }
    catch (e: any) { setFetchError(e.message); }
    finally { setLoadingQuestions(false); }
  }

  async function startMultiSelect() {
    if (selectedTopics.size === 0) return;
    setLoadingQuestions(true);
    setFetchError(null);
    try {
      let qs: SATQuestion[] = [];
      for (const key of selectedTopics) {
        const [section, category] = key.split("::");
        const batch = await fetchQuestions(section, category || undefined, questionType);
        qs = qs.concat(batch);
      }
      const seen = new Set<string>();
      qs = qs.filter((q) => { if (seen.has(q.id)) return false; seen.add(q.id); return true; });
      launchQuiz(qs);
    } catch (e: any) { setFetchError(e.message); }
    finally { setLoadingQuestions(false); }
  }

  function handleMCAnswer(label: string) {
    if (answerState) return;
    const q = questions[currentIdx];
    const correct = label === q.correctAnswer;
    setAnswerState({ type: "mc", selected: label, correct });
    setShowExp(true);
    setSessionAnswers((p) => ({ ...p, [q.id]: { selected: label, correct } }));
    saveProgress(q.id, q, correct); // localStorage
    saveProgressToSupabase(q, correct); // Supabase
  }

  function handleFRAnswer() {
    if (answerState || !frInput.trim()) return;
    const q = questions[currentIdx];
    const correct = normalizeAnswer(frInput) === normalizeAnswer(q.correctAnswer);
    setAnswerState({ type: "fr", userAnswer: frInput, correct });
    setShowExp(true);
    setSessionAnswers((p) => ({ ...p, [q.id]: { selected: frInput, correct } }));
    saveProgress(q.id, q, correct);
    saveProgressToSupabase(q, correct); // ADD THIS
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setAnswerState(null);
      setShowExp(false);
      setFrInput("");
      setTimeout(() => frInputRef.current?.focus(), 50);
    } else {
      stopTimer();
      setPhase("results");
    }
  }

  function exitQuiz() {
    stopTimer();
    setPhase("bank");
    setSelectedTopics(new Set());
  }

  /* ── Results ─────────────────────────────────────────────────────── */
  if (phase === "results") {
    const total = Object.keys(sessionAnswers).length;
    const correct = Object.values(sessionAnswers).filter((a) => a.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <Layout>
        <section className="hero-gradient py-16 text-primary-foreground">
          <div className="container text-center">
            <h1 className="text-4xl font-bold">Session Complete</h1>
          </div>
        </section>
        <div className="container py-12 max-w-2xl">
          <div className="rounded-2xl border bg-card shadow-sm p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <div className="text-6xl font-bold mb-1">{pct}%</div>
            <p className="text-muted-foreground text-lg mb-6">{correct} correct out of {total} questions</p>
            <div className="w-full bg-muted rounded-full h-3 mb-8">
              <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { v: correct, label: "Correct", cls: "emerald" },
                { v: total - correct, label: "Incorrect", cls: "red" },
                { v: formatTime(elapsed), label: "Time", cls: "blue" },
              ].map(({ v, label, cls }) => (
                <div key={label} className={`rounded-xl bg-${cls}-50 border border-${cls}-200 p-4`}>
                  <div className={`text-2xl font-bold text-${cls}-700`}>{v}</div>
                  <div className={`text-xs text-${cls}-600 mt-1`}>{label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={exitQuiz} className="gap-2"><RotateCcw className="h-4 w-4" /> Back to Question Bank</Button>
              <Button variant="outline" onClick={() => nav("/sat")} className="gap-2"><ChevronLeft className="h-4 w-4" /> Back to SAT</Button>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-10 mb-4">Question Review</h2>
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => {
              const ans = sessionAnswers[q.id];
              return (
                <div key={q.id} className={`rounded-xl border p-5 ${ans?.correct ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
                  <div className="flex items-start gap-3">
                    {ans?.correct ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                        <span className={`text-xs font-semibold ${DIFFICULTY_COLORS[q.difficulty] || ""}`}>{q.difficulty}</span>
                        <span className="text-xs text-muted-foreground">{q.category}</span>
                      </div>
                      <MathText text={q.question} className="text-sm text-foreground leading-relaxed line-clamp-3" />
                      {ans && !ans.correct && (
                        <p className="text-xs mt-2 text-red-700">
                          Your answer: <strong>{ans.selected}</strong> · Correct: <strong>{q.correctAnswer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Quiz — Focus Mode: Pure white, minimal, original ───────────────────── */
  if (phase === "quiz") {
    const q = questions[currentIdx];
    const isFR = q.isFreeResponse;
    const sessionCorrect = Object.values(sessionAnswers).filter((a) => a.correct).length;
    const pctDone = ((currentIdx) / questions.length) * 100;

    function mcOptionStyle(label: string) {
      if (!answerState || answerState.type !== "mc") {
        return "border-transparent bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
      }
      if (label === q.correctAnswer) return "border-green-600 bg-green-50 text-green-800";
      if (answerState.selected === label) return "border-red-600 bg-red-50 text-red-800";
      return "border-transparent bg-white opacity-35 text-gray-500";
    }

    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif" }}>

        {/* Ultra thin progress bar at very top */}
        <div className="h-0.5" style={{ background: "#e5e7eb" }}>
          <div className="h-0.5 transition-all duration-500" style={{ width: `${pctDone}%`, background: "#2563eb" }} />
        </div>

        {/* SAT Reading Assistant */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-border p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                <Brain className="inline-block h-4 w-4 mr-2" />
                Reading Assistant
              </h3>
              <button
                onClick={() => {
                  setPassageText("");
                  setQuestionText("");
                  setAiAnswer(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1">Paste passage text:</label>
                <textarea
                  placeholder="Paste a difficult passage here..."
                  className="w-full h-24 p-2 text-xs border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1">Ask a question:</label>
                <input
                  placeholder="What is the main idea of this passage?"
                  className="w-full p-2 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>
              
              <Button
                onClick={async () => {
                  if (!passageText.trim() || !questionText.trim()) return;
                  
                  setIsAnalyzingQuestion(true);
                  setAiAnswer(null);
                  
                  try {
                    const result = await answerQuestion(passageText, questionText);
                    setAiAnswer(result);
                  } catch (error) {
                    console.error('Reading assistant error:', error);
                  } finally {
                    setIsAnalyzingQuestion(false);
                  }
                }}
                disabled={isAnalyzingQuestion || !passageText.trim() || !questionText.trim()}
                className="w-full"
                size="sm"
              >
                {isAnalyzingQuestion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding Answer...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Find Answer
                  </>
                )}
              </Button>
              
              {aiAnswer && (
                <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                  <div className="text-xs font-medium text-foreground mb-2">AI Answer:</div>
                  <div className="text-xs text-muted-foreground">{aiAnswer.answer}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(aiAnswer.score * 100)}%
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Powered by AI — running locally in your browser
            </div>
          </div>
        </div>

        {/* Top navigation */}
        <div className="sticky top-0 z-40 shrink-0" style={{ background: "#ffffff", borderBottom: "1px solid #f3f4f6" }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between h-14 px-6">
            <button onClick={exitQuiz} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">
              ← Question Bank
            </button>
            <div className="text-gray-400 text-xs font-mono">
              {currentIdx + 1} / {questions.length}
            </div>
            <div className="text-gray-400 text-xs font-mono">
              {formatTime(elapsed)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 pb-24">

          {/* Category + difficulty pills */}
          <div className="flex items-center gap-2 mb-8">
            {q.category && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {q.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-medium">
              {q.difficulty === "Easy" && <span className="text-green-600">●</span>}
              {q.difficulty === "Medium" && <span className="text-amber-600">●</span>}
              {q.difficulty === "Hard" && <span className="text-red-600">●</span>}
              <span className="text-gray-600">{q.difficulty}</span>
            </span>
            {isFR && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                Free Response
              </span>
            )}
          </div>

          {/* Question text */}
          <div className="mb-12" style={{ paddingTop: "40px", paddingBottom: "32px" }}>
            <MathText text={q.question} className="text-gray-900 leading-relaxed" style={{ fontSize: "18px", lineHeight: "1.85", fontWeight: "400" }} />
          </div>

          {/* MC options */}
          {!isFR && (
            <div className="flex flex-col gap-1.5 mb-8">
              {[
                { label: "A", text: q.optionA },
                { label: "B", text: q.optionB },
                { label: "C", text: q.optionC },
                { label: "D", text: q.optionD },
              ].map(({ label, text }) => (
                <button
                  key={label}
                  onClick={() => handleMCAnswer(label)}
                  disabled={!!answerState}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-120 cursor-pointer disabled:cursor-default border-l-4 ${mcOptionStyle(label)}`}
                  style={{ height: "52px" }}
                >
                  <span className="font-mono text-xs text-gray-500" style={{ minWidth: "13px" }}>
                    {label}
                  </span>
                  <MathText text={text} className="flex-1 leading-relaxed" style={{ fontSize: "15px" }} />
                  {answerState?.type === "mc" && label === q.correctAnswer && (
                    <span className="text-green-600 font-semibold">✓</span>
                  )}
                  {answerState?.type === "mc" && answerState.selected === label && !answerState.correct && (
                    <span className="text-red-600 font-semibold">✗</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Free response */}
          {isFR && (
            <div className="mb-8">
              {!answerState ? (
                <div className="flex gap-3 items-end">
                  <input
                    ref={frInputRef}
                    type="text"
                    value={frInput}
                    onChange={(e) => setFrInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleFRAnswer(); }}
                    placeholder="Type your answer…"
                    className="flex-1 text-gray-900 placeholder-gray-400 text-sm border-0 border-b border-gray-300 focus:border-gray-600 outline-none pb-1 transition-colors"
                    style={{ maxWidth: "640px" }}
                    autoFocus
                  />
                  <button
                    onClick={handleFRAnswer}
                    disabled={!frInput.trim()}
                    className="text-blue-600 text-sm font-medium hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {answerState.correct ? (
                      <span className="text-green-700 font-medium">Correct!</span>
                    ) : (
                      <span className="text-red-700 font-medium">Incorrect — the answer is {q.correctAnswer}</span>
                    )}
                  </div>
                  <p className="text-gray-600">Your answer: {(answerState as { type: "fr"; userAnswer: string; correct: boolean }).userAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExp && q.explanation && (
            <div className="mb-8 text-sm animate-in fade-in duration-300"
              style={{
                borderLeft: "4px solid",
                borderLeftColor: answerState?.correct ? "#16a34a" : "#dc2626",
                backgroundColor: "#ffffff",
                padding: "16px 20px",
                borderRadius: "0",
                color: answerState?.correct ? "#14532d" : "#7f1d1d"
              }}>
              <MathText text={q.explanation} className="leading-relaxed" style={{ fontSize: "14px", lineHeight: "1.7" }} />
            </div>
          )}

          {/* Next button */}
          {answerState && (
            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors duration-150"
              >
                {currentIdx < questions.length - 1 ? "Next →" : "See Results →"}
              </button>
            </div>
          )}
        </div>

        <DesmosPanel />
      </div>
    );
  }

  /* ── Question Bank browser ───────────────────────────────────────── */
  const SECTIONS = ["Reading & Writing", "Math"];
  const selectedCount = countForTopics(selectedTopics);

  return (
    <Layout>
      <div className="container max-w-5xl py-8 pb-24">

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-primary/50 transition-colors">
            <ListFilter className="h-4 w-4" /> Filters <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Toggle on={multiSelect} onChange={(v) => { setMultiSelect(v); setSelectedTopics(new Set()); }} />
            Select multiple topics
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Toggle on={randomize} onChange={setRandomize} />
            <Shuffle className="h-3.5 w-3.5 text-muted-foreground" /> Randomize order
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Toggle on={showAttempts} onChange={setShowAttempts} />
            <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Show previous attempts
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Dropdown label="Difficulty" options={["All", "Easy", "Medium", "Hard"]} value={filterDifficulty} onChange={setFilterDifficulty} />
          <Dropdown label="Completed" options={["All", "New", "Completed"]} value={filterCompleted} onChange={setFilterCompleted} />
        </div>

        {/* Question type toggle */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-lg border border-border bg-muted/40 w-fit">
          {([
            { key: "all",  label: "All Questions" },
            { key: "mcq",  label: "Multiple Choice" },
            { key: "open", label: "Free Response"   },
          ] as { key: QuestionType; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setQuestionType(key); setSelectedTopics(new Set()); }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
                questionType === key
                  ? "bg-background shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {fetchError && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {fetchError}
          </div>
        )}

        {(loadingMeta || loadingQuestions) && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">{loadingMeta ? "Loading question bank…" : "Loading questions…"}</span>
          </div>
        )}

        {!loadingMeta && activeMeta && (
          <div className="grid gap-6 lg:grid-cols-2">
            {SECTIONS.map((section) => {
              const style = SECTION_STYLE[section];
              const Icon = style.icon;
              const sectionTotal = activeMeta.sectionTotals[section] ?? 0;
              const categories = activeMeta.tree[section] ?? {};
              const sectionKey = topicKey(section);
              const sectionSelected = selectedTopics.has(sectionKey);

              return (
                <div key={section} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-r ${style.bg} p-5 flex items-center justify-between`}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="h-4 w-4 text-white/80" />
                        <h2 className="text-lg font-bold text-white">{section}</h2>
                      </div>
                      <p className="text-sm text-white/70">{sectionTotal.toLocaleString()} questions</p>
                    </div>
                    <button
                      onClick={() => multiSelect ? toggleTopic(sectionKey) : startQuiz(section)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${multiSelect && sectionSelected ? "bg-white/30 text-white border-2 border-white" : "bg-white text-gray-800 hover:bg-white/90"}`}
                    >
                      {multiSelect && sectionSelected ? "✓ Selected" : "Review All Topics"}
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {Object.entries(categories)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([cat, data]) => {
                        const catKey = topicKey(section, cat);
                        const isSelected = selectedTopics.has(catKey);
                        const answered = Object.keys(progress).filter((id) => {
                          const q = allQuestions.find((q) => q.id === id);
                          return q?.section === section && q?.category === cat;
                        }).length;

                        return (
                          <button
                            key={cat}
                            onClick={() => multiSelect ? toggleTopic(catKey) : startQuiz(section, cat)}
                            className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${isSelected ? "bg-primary/8 border-l-4 border-primary" : "hover:bg-muted/50"}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {multiSelect && (
                                <span className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                                  {isSelected && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                                </span>
                              )}
                              <span className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}>{cat}</span>
                              {showAttempts && answered > 0 && (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 leading-none">{answered}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              <span className="text-sm text-muted-foreground">
                                {filterDifficulty !== "All"
                                  ? (data.byDifficulty[filterDifficulty] ?? 0).toLocaleString()
                                  : data.total.toLocaleString()
                                } questions
                              </span>
                              {!multiSelect && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {multiSelect && selectedTopics.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={startMultiSelect}
              disabled={loadingQuestions}
              className="flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start {selectedCount.toLocaleString()} Questions
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
