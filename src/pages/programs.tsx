import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Layout } from "@/components/layout";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import importedPrograms from "@/data/imported-programs.json";

type Program = (typeof importedPrograms)[number];
const programs: Program[] = importedPrograms;
const subjects = ["All subjects", ...Array.from(new Set(programs.map((program) => program.subject))).sort()];
const formats = ["All formats", "In-Person", "Remote", "Both"];
const prices = ["Any price", "Free", "Paid"];

export default function Programs() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [format, setFormat] = useState(formats[0]);
  const [price, setPrice] = useState(prices[0]);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => { setVisibleCount(24); }, [query, subject, format, price]);

  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return programs.filter((program) => {
      if (subject !== subjects[0] && program.subject !== subject) return false;
      if (format !== formats[0] && program.format !== format) return false;
      if (price !== prices[0] && program.price !== price) return false;
      return !search || `${program.name} ${program.details} ${program.subject}`.toLocaleLowerCase().includes(search);
    });
  }, [query, subject, format, price]);

  return <Layout><main className="min-h-screen bg-canvas text-ink"><div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
    <header className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.17em] text-indigo-600">Opportunities directory</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Find a program that fits.</h1><p className="mt-4 text-base leading-relaxed text-ink-muted">Explore {programs.length} programs from a shared directory. Each listing links to the program website so you can check eligibility, dates and cost before applying.</p></header>
    <section className="mt-9 rounded-2xl border border-line bg-card p-5 shadow-sm" aria-label="Program filters"><div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]"><label className="block"><span className="mb-2 block text-xs font-bold text-ink-muted">Search</span><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-subtle" /><input aria-label="Search programs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Program, field or keyword" className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm outline-none focus:border-indigo-500" /></div></label><Filter label="Subject" value={subject} options={subjects} onChange={setSubject} /><Filter label="Format" value={format} options={formats} onChange={setFormat} /><Filter label="Price" value={price} options={prices} onChange={setPrice} /></div></section>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-ink-muted">{visible.length} {visible.length === 1 ? "program" : "programs"} found</p><a href={programs[0]?.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">View source sheet <ExternalLink className="h-3.5 w-3.5" /></a></div>
    {visible.length ? <><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visible.slice(0, visibleCount).map((program) => <ProgramCard key={program.id} program={program} />)}</div>{visibleCount < visible.length && <div className="mt-7 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="rounded-xl border border-line bg-card px-6 py-3 text-sm font-bold hover:border-indigo-400">Show more programs ({Math.min(visibleCount, visible.length)} of {visible.length})</button></div>}</> : <div className="mt-4 rounded-2xl border border-line bg-card px-6 py-12 text-center"><SlidersHorizontal className="mx-auto h-6 w-6 text-ink-subtle" /><p className="mt-3 font-bold">No programs match those filters.</p><button type="button" onClick={() => { setQuery(""); setSubject(subjects[0]); setFormat(formats[0]); setPrice(prices[0]); }} className="mt-3 text-sm font-semibold text-indigo-600 hover:underline">Clear filters</button></div>}
    <p className="mt-9 text-sm leading-relaxed text-ink-muted">Listings were imported from a community spreadsheet. Details can change; follow the program link for current admissions information.</p>
  </div></main></Layout>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-xs font-bold text-ink-muted">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-indigo-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }

function ProgramCard({ program }: { program: Program }) { return <article className="flex min-h-64 flex-col rounded-2xl border border-line bg-card p-5 shadow-sm"><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-700">{program.subject}</span><span className="rounded-full bg-surface-2 px-3 py-1 text-ink-muted">{program.price}</span></div><h2 className="mt-5 text-xl font-black tracking-tight">{program.name}</h2><p className="mt-2 text-sm font-semibold text-ink-muted">{program.details}</p><p className="mt-4 flex items-center gap-1 text-xs text-ink-subtle"><MapPin className="h-3.5 w-3.5" />Listed as {program.location} · {program.format}</p><div className="mt-auto flex items-center gap-4 pt-6"><Sheet><SheetTrigger className="text-sm font-bold text-indigo-600 hover:underline">Details</SheetTrigger><SheetContent className="overflow-y-auto border-line bg-card text-ink"><SheetHeader><SheetTitle className="text-2xl font-black text-ink">{program.name}</SheetTitle><SheetDescription className="text-base text-ink-muted">{program.details}</SheetDescription></SheetHeader><div className="mt-7 space-y-5 text-sm leading-relaxed"><p className="text-ink-muted">Source lists this as {program.subject}, {program.format}, {program.location}, {program.price.toLowerCase()}. This information has not been independently verified and may be outdated.</p><p className="text-xs text-ink-subtle">Imported from source row {program.sourceRow}. Check the linked site for current requirements, dates and price.</p><a href={program.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 font-bold text-background">Open listed website <ExternalLink className="h-4 w-4" /></a></div></SheetContent></Sheet><a href={program.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:underline">Program link <ExternalLink className="h-3.5 w-3.5" /></a></div></article>; }
