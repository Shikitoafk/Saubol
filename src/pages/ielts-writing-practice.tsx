import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock3, ExternalLink, PenLine } from "lucide-react";
import { Layout } from "@/components/layout";
import { writingPrompts } from "@/data/ielts-practice";
import { officialPracticeCollections, officialWritingSamples } from "@/data/ielts-official-practice";

const draftKey = (id: string) => `saubol:ielts:writing:${id}`;
const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

export default function IELTSWritingPractice() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(officialWritingSamples[0].id);
  const [essay, setEssay] = useState("");
  const [sourcePrompt, setSourcePrompt] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number>(officialWritingSamples[0].suggestedMinutes * 60);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const officialPrompt = officialWritingSamples.find((item) => item.id === selectedId);
  const originalPrompt = writingPrompts.find((item) => item.id === selectedId) ?? writingPrompts[0];
  const task = officialPrompt?.task ?? originalPrompt.task;
  const minimumWords = officialPrompt?.minimumWords ?? originalPrompt.minimumWords;
  const suggestedMinutes = officialPrompt?.suggestedMinutes ?? originalPrompt.suggestedMinutes;
  const wordCount = useMemo(() => countWords(essay), [essay]);

  useEffect(() => {
    try {
      setEssay(localStorage.getItem(draftKey(selectedId)) || "");
      setSourcePrompt(localStorage.getItem(`${draftKey(selectedId)}:source`) || "");
      setSaved(true);
    } catch { setEssay(""); setSourcePrompt(""); setSaved(false); }
    setSecondsLeft(suggestedMinutes * 60);
    setRunning(false);
  }, [selectedId, suggestedMinutes]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running, secondsLeft]);

  const openChecker = () => {
    const instruction = officialPrompt ? sourcePrompt.trim() : originalPrompt.instruction;
    if (!instruction || !essay.trim()) return;
    try { sessionStorage.setItem("saubol:ielts:writing-checker-draft", JSON.stringify({ taskType: task === 1 ? "task1" : "task2", prompt: instruction, essay })); } catch { /* Checker still opens for manual input. */ }
    navigate("/ielts/writing-checker");
  };

  const updateSourcePrompt = (value: string) => {
    setSourcePrompt(value);
    try { localStorage.setItem(`${draftKey(selectedId)}:source`, value); } catch { /* The field still works in memory. */ }
  };

  const updateEssay = (value: string) => {
    setEssay(value);
    try { localStorage.setItem(draftKey(selectedId), value); setSaved(true); } catch { setSaved(false); }
  };

  const chooseTask = (id: string) => {
    setSelectedId(id);
    document.getElementById("writing-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
    <Link to="/ielts" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> IELTS practice</Link>
    <header className="mt-8 max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Academic Writing</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Practise with official samples.</h1><p className="mt-4 text-ink-muted">Open the original task from its publisher, then write your answer here. Your draft saves in this browser. AI feedback is optional and is not an official IELTS score.</p></header>
    <section className="mt-9" aria-labelledby="official-writing-heading"><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600">Real sample materials</p><h2 id="official-writing-heading" className="mt-2 text-2xl font-black">Official Writing tasks</h2><p className="mt-2 text-sm text-ink-muted">Complete wording and visual data remain on the publisher’s site.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{officialWritingSamples.map((item) => <article key={item.id} className={`rounded-2xl border bg-card p-5 shadow-sm ${selectedId === item.id ? "border-indigo-500 ring-2 ring-indigo-200" : "border-line"}`}><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Task {item.task} · {item.source}</p><h3 className="mt-2 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm text-ink-muted">{item.description}</p><div className="mt-4 flex flex-wrap gap-2"><a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-bold hover:bg-surface-2">Open task <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => chooseTask(item.id)} className="rounded-lg bg-ink px-3 py-2 text-sm font-bold text-background">Write here</button></div></article>)}</div>
      <p className="mt-4 text-sm text-ink-muted">More practice: {officialPracticeCollections.writing.map((item, index) => <span key={item.url}>{index > 0 && " · "}<a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">{item.title}</a></span>)}. IDP resources may vary by region.</p></section>
    <section className="mt-10" aria-labelledby="original-writing-heading"><h2 id="original-writing-heading" className="text-lg font-black">Extra Saubol exercises</h2><p className="mt-1 text-sm text-ink-muted">Original IELTS-style prompts, not past exam papers.</p><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Original Writing tasks">{writingPrompts.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selectedId === item.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-line bg-card text-ink hover:border-indigo-400"}`}>Task {item.task}: {item.title}</button>)}</div></section>
    <div id="writing-workspace" className="mt-6 scroll-mt-24 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600">Writing Task {task} · {officialPrompt ? "Official sample" : "Saubol exercise"}</p><h2 className="mt-3 text-2xl font-black">{officialPrompt?.title ?? originalPrompt.title}</h2>
      {officialPrompt ? <><p className="mt-5 text-base leading-7">This task is published by {officialPrompt.source}. Open the original to see the complete wording{task === 1 ? " and visual data" : ""}. Keep it open while you write.</p><a href={officialPrompt.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Open official task <ExternalLink className="h-4 w-4" /></a><label htmlFor="official-writing-prompt" className="mt-7 block text-sm font-bold">Paste the exact task wording for optional AI feedback</label><textarea id="official-writing-prompt" value={sourcePrompt} onChange={(event) => updateSourcePrompt(event.target.value)} placeholder="Paste the official prompt here if you want feedback later." className="mt-2 min-h-32 w-full rounded-xl border border-line bg-canvas p-3 text-sm leading-6 outline-none focus:border-indigo-500" /><p className="mt-2 text-xs text-ink-subtle">This field stays in your browser unless you request AI feedback.{task === 1 && " Also upload an image of the chart or diagram on the feedback screen; text alone cannot show its data."}</p></> : <><p className="mt-5 text-base leading-7">{originalPrompt.instruction}</p>{"rows" in originalPrompt && <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr>{originalPrompt.columns.map((column) => <th key={column} className="border-b border-line px-3 py-3 font-bold">{column}</th>)}</tr></thead><tbody>{originalPrompt.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="border-b border-line px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div>}</>}
      <p className="mt-6 text-sm text-ink-muted">Write at least {minimumWords} words. Suggested time: {suggestedMinutes} minutes.</p></section>
    <section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-black"><PenLine className="h-5 w-5" /> Your response</h2><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" /><span aria-live="polite">{Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}</span><button type="button" onClick={() => setRunning((value) => !value)} className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2">{running ? "Pause" : "Start"}</button><button type="button" onClick={() => { setRunning(false); setSecondsLeft(suggestedMinutes * 60); }} className="rounded-lg border border-line px-3 py-1 hover:bg-surface-2">Reset</button></div></div><textarea value={essay} onChange={(event) => updateEssay(event.target.value)} aria-label="Your writing response" placeholder="Start writing here…" className="mt-5 min-h-[400px] w-full resize-y rounded-xl border border-line bg-canvas p-4 text-base leading-7 outline-none focus:border-indigo-500" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><p className={wordCount >= minimumWords ? "font-semibold text-emerald-700" : "text-ink-muted"}>{wordCount} / {minimumWords} words · {saved ? "Draft saved on this device" : "Draft could not be saved on this device"}</p><button type="button" onClick={openChecker} disabled={!essay.trim() || (Boolean(officialPrompt) && !sourcePrompt.trim())} className="rounded-xl bg-ink px-5 py-3 font-bold text-background disabled:cursor-not-allowed disabled:opacity-40">Get optional AI feedback</button></div><p className="mt-3 text-xs leading-relaxed text-ink-subtle">For official samples, paste the exact task wording before requesting feedback. Choosing feedback sends your prompt and response to Google Gemini. Do not include private information.</p></section></div>
  </div></main></Layout>;
}
