import { renderMathText } from "@/lib/render-math";

interface QuestionPassageProps {
  passage: string;
  className?: string;
}

type TableData = { title?: string; headers: string[]; rows: string[][]; tail?: string };

const removeRepeatedLead = (value: string) => {
  // OCR sometimes duplicates the source-table caption verbatim before the
  // passage. Remove only long adjacent duplicates, never repeated prose later.
  const match = value.match(/^([\s\S]{80,}?)(?:\s+)\1(?=\s+[A-Z])/);
  return match ? `${match[1]}${value.slice(match[0].length)}` : value;
};

const parsePipeTable = (value: string): TableData | null => {
  const match = value.match(/^Table\s*[—-]\s*([^:]+):\s*([\s\S]*?)(?:\.\s*\n\s*\n|$)([\s\S]*)$/i);
  if (!match) return null;
  const headers = match[1].split("|").map((cell) => cell.trim()).filter(Boolean);
  const rows = match[2].split(";")
    .map((row) => row.split("|").map((cell) => cell.trim()))
    .filter((row) => row.length === headers.length);
  return headers.length >= 2 && rows.length > 0 ? { headers, rows, tail: match[3].trim() } : null;
};

const parseCountryThreatTable = (value: string): TableData | null => {
  const entries = [...value.matchAll(/([A-Z][A-Za-z ]+?)—trees\s+(\d+),\s*fungi\s+(\d+),\s*insects\s+(\d+)/g)];
  if (entries.length < 2) return null;
  const seenCountries = new Set<string>();
  const unique = entries.filter((entry) => {
    const country = entry[1].trim().toLowerCase();
    if (seenCountries.has(country)) return false;
    seenCountries.add(country);
    return true;
  });
  const last = entries[entries.length - 1];
  const tailStart = (last.index || 0) + last[0].length;
  return {
    title: value.slice(0, entries[0].index).replace(/:\s*$/, "").trim(),
    headers: ["Country", "Non-native tree species", "Damaging fungus species", "Damaging insect species"],
    rows: unique.map((entry) => [entry[1].trim(), entry[2], entry[3], entry[4]]),
    tail: value.slice(tailStart).replace(/^\.\s*/, "").trim(),
  };
};

const parseFlowerTable = (value: string): TableData | null => {
  const entries = [...value.matchAll(/day\s*(\d+)\s*[—-]\s*(?:open flowers\s*)?(\d+),\s*(?:male reproductive success\s*)?([\d.]+),\s*(?:proportion male\s*)?([\d.]+)/gi)];
  if (entries.length < 3) return null;
  const unique: RegExpMatchArray[] = [];
  const days = new Set<string>();
  for (const entry of entries) if (!days.has(entry[1])) { days.add(entry[1]); unique.push(entry); }
  const last = unique[unique.length - 1];
  const tailStart = (last.index || 0) + last[0].length;
  const tail = value.slice(tailStart).replace(/^\.\s*/, "").trim();
  const explanationStart = tail.search(/\b(The mating environment|Researchers tested|They concluded)/i);
  return {
    title: value.slice(0, entries[0].index).replace(/:\s*$/, "").trim(),
    headers: ["Flowering day", "Open flowers", "Male reproductive success", "Proportion male"],
    rows: unique.map((entry) => [`Day ${entry[1]}`, entry[2], entry[3], entry[4]]),
    tail: explanationStart >= 0 ? tail.slice(explanationStart) : tail,
  };
};

const parseTable = (value: string) => parsePipeTable(value) || parseCountryThreatTable(value) || parseFlowerTable(value);

export function QuestionPassage({ passage, className = "" }: QuestionPassageProps) {
  const cleaned = removeRepeatedLead(passage);
  const table = parseTable(cleaned);
  if (!table) {
    return <div className={`whitespace-pre-wrap text-base leading-relaxed font-medium text-ink ${className}`} dangerouslySetInnerHTML={{ __html: renderMathText(cleaned) }} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {table.title && <p className="text-base font-medium leading-relaxed text-ink">{table.title}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-left font-sans text-sm leading-relaxed text-slate-900">
          <thead className="bg-slate-100">
            <tr>{table.headers.map((header) => <th key={header} className="border-b border-slate-300 px-4 py-3 font-bold">{header}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => <tr key={rowIndex} className="odd:bg-white even:bg-slate-50">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-slate-200 px-4 py-3 last:border-b-0" dangerouslySetInnerHTML={{ __html: renderMathText(cell) }} />)}
            </tr>)}
          </tbody>
        </table>
      </div>
      {table.tail && <div className="whitespace-pre-wrap text-base leading-relaxed font-medium text-ink" dangerouslySetInnerHTML={{ __html: renderMathText(table.tail) }} />}
    </div>
  );
}
