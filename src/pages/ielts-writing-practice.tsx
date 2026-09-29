import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock3, PenLine } from "lucide-react";
import { Layout } from "@/components/layout";
import { writingPrompts } from "@/data/ielts-practice";

const draftKey = (id: string) => `saubol:ielts:writing:${id}`;
const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

export default function IELTSWritingPractice() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(writingPrompts[0].id);
  const [essay, setEssay] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number>(writingPrompts[0].suggestedMinutes * 60);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const prompt = writingPrompts.find((item) => item.id === selectedId) ?? writingPrompts[0];
  const wordCount = useMemo(() => countWords(essay), [essay]);

  useEffect(() => {
    try { setEssay(localStorage.getItem(draftKey(selectedId)) || ""); setSaved(true); } catch { setEssay(""); setSaved(false); }
    setSecondsLeft(prompt.suggestedMinutes * 60);
    setRunning(false);
  }, [selectedId, prompt.suggestedMinutes]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running, secondsLeft]);

  const openChecker = () => {
    try { sessionStorage.setItem("saubol:ielts:writing-checker-draft", JSON.stringify({ taskType: prompt.task === 1 ? "task1" : "task2", prompt: prompt.instruction, essay })); } catch { /* Checker still opens for manual input. */ }
    navigate("/ielts/writing-checker");
  };

  const updateEssay = (value: string) => {
    setEssay(value);
    try { localStorage.setItem(draftKey(selectedId), value); setSaved(true); } catch { setSaved(false); }
  };

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
    <Link to="/ielts" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> IELTS practice</Link>
    <header className="mt-8 max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Academic Writing</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Write under real conditions.</h1><p className="mt-4 text-ink-muted">Original IELTS-style tasks. Work at your own pace or use the suggested timer. Drafts save in this browser; feedback from the optional AI checker is an estimate, not an official IELTS score.</p></header>
    <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Writing tasks">{writingPrompts.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selectedId === item.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-line bg-card text-ink hover:border-indigo-400"}`}>Task {item.task}: {item.title}</button>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600">Writing Task {prompt.task}</p><h2 className="mt-3 text-2xl font-black">{prompt.title}</h2><p className="mt-5 text-base leading-7">{prompt.instruction}</p>{"rows" in prompt && <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr>{prompt.columns.map((column) => <th key={column} className="border-b border-line px-3 py-3 font-bold">{column}</th>)}</tr></thead><tbody>{prompt.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="border-b border-line px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div>}<p className="mt-6 text-sm text-ink-muted">Write at least {prompt.minimumWords} words. Suggested time: {prompt.suggestedMinutes} minutes.</p><p className="mt-4 text-xs text-ink-subtle">These practice prompts are original exercises, not past IELTS exam papers.</p></section>
    <section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-black"><PenLine className="h-5 w-5" /> Your response</h2><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" /><span aria-live="polite">{Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}</span><button type="button" onClick={() => setRunning((value) => !value)} className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2">{running ? "Pause" : "Start"}</button><button type="button" onClick={() => { setRunning(false); setSecondsLeft(prompt.suggestedMinutes * 60); }} className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2">Reset</button></div></div><textarea value={essay} onChange={(event) => updateEssay(event.target.value)} aria-label="Your writing response" placeholder="Start writing here…" className="mt-5 min-h-[400px] w-full resize-y rounded-xl border border-line bg-canvas p-4 text-base leading-7 outline-none focus:border-indigo-500" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><p className={wordCount >= prompt.minimumWords ? "font-semibold text-emerald-700" : "text-ink-muted"}>{wordCount} / {prompt.minimumWords} words · {saved ? "Draft saved on this device" : "Draft could not be saved on this device"}</p><button type="button" onClick={openChecker} disabled={!essay.trim()} className="rounded-xl bg-ink px-5 py-3 font-bold text-background disabled:cursor-not-allowed disabled:opacity-40">Get optional AI feedback</button></div><p className="mt-3 text-xs leading-relaxed text-ink-subtle">Choosing feedback sends your prompt and response to Google Gemini. Do not include private information. You can practise without using this feature.</p></section></div>
    <p className="mt-8 text-sm text-ink-muted">For official format and free sample questions, see <a href="https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">IELTS Academic sample questions</a>.</p>
  </div></main></Layout>;
}
