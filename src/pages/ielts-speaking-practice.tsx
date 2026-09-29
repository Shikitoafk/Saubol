import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Mic, MicOff, RotateCcw } from "lucide-react";
import { Layout } from "@/components/layout";
import { speakingPrompts } from "@/data/ielts-practice";

type RecorderState = "idle" | "requesting" | "recording";

export default function IELTSSpeakingPractice() {
  const { topicId } = useParams();
  const topic = speakingPrompts.find((item) => item.id === topicId) ?? speakingPrompts[0];
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [question, setQuestion] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [timerMode, setTimerMode] = useState<"prep" | "answer">("answer");
  const [timerRunning, setTimerRunning] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioExtension, setAudioExtension] = useState("webm");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [complete, setComplete] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const topicIdRef = useRef(topic.id);
  topicIdRef.current = topic.id;

  useEffect(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
    setPart(1); setQuestion(0); setNotes(""); setComplete(false); setTimerMode("answer"); setSecondsLeft(120); setTimerRunning(false);
    try { setNotes(localStorage.getItem(`saubol:ielts:speaking:${topic.id}:notes`) || ""); } catch { /* Notes remain in memory. */ }
  }, [topic.id]);

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft, timerRunning]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const replaceAudio = (url: string | null) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
  };

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser. You can still practise aloud and make notes.");
      return;
    }
    setRecorderState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      const recordedTopicId = topic.id;
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size && topicIdRef.current === recordedTopicId) {
          setAudioExtension(blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm");
          replaceAudio(URL.createObjectURL(blob));
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecorderState("idle");
      };
      recorder.start();
      setRecorderState("recording");
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecorderState("idle");
      setError("Microphone access was denied or unavailable. Allow microphone access to record, or practise aloud without recording.");
    }
  };

  const stopRecording = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); };
  const updateNotes = (value: string) => {
    setNotes(value);
    try { localStorage.setItem(`saubol:ielts:speaking:${topic.id}:notes`, value); } catch { /* Notes remain in memory. */ }
  };
  const changePart = (value: 1 | 2 | 3) => {
    stopRecording(); setPart(value); setQuestion(0); setTimerRunning(false); setTimerMode(value === 2 ? "prep" : "answer"); setSecondsLeft(value === 2 ? 60 : 120); setError("");
  };
  const questions = part === 1 ? topic.part1 : topic.part3;
  const next = () => {
    stopRecording();
    if (part !== 2 && question < questions.length - 1) setQuestion((value) => value + 1);
    else if (part < 3) changePart((part + 1) as 2 | 3);
    else { setComplete(true); try { localStorage.setItem(`saubol:ielts:speaking:${topic.id}:completed`, new Date().toISOString()); } catch { /* Local completion unavailable. */ } }
  };

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32"><Link to="/ielts" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> IELTS practice</Link>
    <header className="mt-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Speaking practice</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Speak with confidence.</h1><p className="mt-4 max-w-2xl text-ink-muted">Follow the three-part format, record yourself and listen back. This is self-practice: no automatic band score is assigned.</p></header>
    <div className="mt-7 flex flex-wrap gap-2">{speakingPrompts.map((item) => <Link key={item.id} to={`/ielts/speaking/${item.id}`} className={`rounded-full border px-4 py-2 text-sm font-semibold ${item.id === topic.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-line bg-card hover:border-indigo-400"}`}>{item.title}</Link>)}</div>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-wrap gap-2">{([1, 2, 3] as const).map((value) => <button key={value} type="button" onClick={() => changePart(value)} className={`rounded-lg px-4 py-2 text-sm font-bold ${part === value ? "bg-ink text-background" : "bg-surface-2 text-ink-muted"}`}>Part {value}</button>)}</div><p className="mt-8 text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{topic.title} · Part {part}{part !== 2 ? ` · Question ${question + 1} of ${questions.length}` : " · Cue card"}</p>
      {part === 2 ? <div className="mt-5"><h2 className="text-2xl font-black leading-tight">{topic.cue}</h2><p className="mt-6 font-semibold">You should say:</p><ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7">{topic.points.map((point) => <li key={point}>{point}</li>)}</ul><p className="mt-5 text-sm text-ink-muted">Take one minute to prepare, then speak for up to two minutes. The timer is optional.</p></div> : <h2 className="mt-5 min-h-36 text-2xl font-black leading-tight sm:text-3xl">{questions[question]}</h2>}
      <button type="button" onClick={next} className="mt-8 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-background">{part === 3 && question === questions.length - 1 ? "Finish practice" : "Next question"}</button>
      {complete && <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800">Practice completed. Listen to your recording and review your notes. No score has been calculated.</p>}
    </section><aside className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black">Your practice desk</h2><div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-2xl font-black tabular-nums">{Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}</span><button type="button" onClick={() => setTimerRunning((value) => !value)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface-2">{timerRunning ? "Pause timer" : "Start timer"}</button><button type="button" onClick={() => { setSecondsLeft(part === 2 && timerMode === "prep" ? 60 : 120); setTimerRunning(false); }} aria-label="Reset timer" className="rounded-lg border border-line p-2 hover:bg-surface-2"><RotateCcw className="h-4 w-4" /></button></div>
      {part === 2 && <div className="mt-4 flex gap-2"><button type="button" onClick={() => { setTimerMode("prep"); setSecondsLeft(60); setTimerRunning(false); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${timerMode === "prep" ? "bg-indigo-600 text-white" : "border border-line"}`}>Prepare · 1 min</button><button type="button" onClick={() => { setTimerMode("answer"); setSecondsLeft(120); setTimerRunning(false); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${timerMode === "answer" ? "bg-indigo-600 text-white" : "border border-line"}`}>Speak · 2 min</button></div>}
      <div className="mt-6"><button type="button" disabled={recorderState === "requesting"} onClick={recorderState === "recording" ? stopRecording : startRecording} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{recorderState === "recording" ? <><MicOff className="h-4 w-4" /> Stop recording</> : <><Mic className="h-4 w-4" /> {recorderState === "requesting" ? "Requesting microphone…" : "Record answer"}</>}</button><p className="mt-3 text-xs leading-relaxed text-ink-muted">Recording stays on this device and is not uploaded or saved automatically. Download it before leaving this page.</p>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}{audioUrl && <div className="mt-4"><audio controls src={audioUrl} className="w-full" aria-label="Play your answer" /><a href={audioUrl} download={`saubol-speaking-${topic.id}.${audioExtension}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"><Download className="h-4 w-4" /> Download recording</a></div>}</div>
      <label className="mt-7 block text-sm font-bold" htmlFor="speaking-notes">Notes and self-review</label><textarea id="speaking-notes" value={notes} onChange={(event) => updateNotes(event.target.value)} placeholder="Was your answer clear? Did you develop ideas and use a range of vocabulary?" className="mt-2 min-h-44 w-full rounded-xl border border-line bg-canvas p-3 text-sm leading-6 outline-none focus:border-indigo-500" /><p className="mt-2 text-xs text-ink-subtle">Notes save in this browser. For official scoring, use feedback from a qualified examiner.</p></aside></div>
    <p className="mt-8 text-sm text-ink-muted">See the <a href="https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">official IELTS sample questions</a> for the test format.</p>
  </div></main></Layout>;
}
