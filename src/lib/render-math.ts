import katex from "katex";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

// CSV/PDF imports sometimes already contain HTML entities (for example
// `&lt;`). Decode those to text *before* escaping the whole question, so the
// learner sees the intended inequality while no imported markup can execute.
const decodeImportedEntities = (value: string) => {
  // Some CSV exports are escaped more than once: `&amp;gt;`, and sometimes
  // even `&amp;amp;gt;`. Decode a few passes before rendering, but never treat
  // the result as HTML (it is escaped again below).
  let decoded = value;
  for (let pass = 0; pass < 4; pass++) {
    const next = decoded
      .replace(/&amp;/gi, "&")
      .replace(/&lt;|&#0*60;/gi, "<")
      .replace(/&gt;|&#0*62;/gi, ">")
      .replace(/&le;|&#0*8804;/gi, "≤")
      .replace(/&ge;|&#0*8805;/gi, "≥")
      .replace(/&nbsp;/gi, " ");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};

// Gemini/PDF imports occasionally lose the `$...$` delimiters around a line
// of TeX. Only wrap a short, standalone formula line; prose is never guessed
// as mathematics, so normal passages stay untouched.
const wrapStandaloneMathLines = (value: string) => value
  .split(/(\r?\n)/)
  .map((part) => {
    if (/\r?\n/.test(part)) return part;
    const line = part.trim();
    const hasLatex = /\\(?:frac|sqrt|left|right|times|cdot|leq|geq|neq|approx|pm|text)\b/.test(line);
    const hasRelation = /(?:[≤≥<>]=?|=)/.test(line);
    const looksLikeFormula = line.length > 0 && line.length <= 140 &&
      /^[\d\s.,()+\-−*/=<>≤≥A-Za-z\\{}_^|]+$/.test(line) &&
      (hasLatex || (hasRelation && /[a-zA-Z\d]/.test(line)));
    return looksLikeFormula && !/\$/.test(line) ? `$${line}$` : part;
  })
  .join("");

const math = (value: string, displayMode: boolean) =>
  katex.renderToString(value.trim(), {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    trust: false,
  });

/**
 * Turns imported SAT text into safe HTML and supports all common LaTex forms.
 * Source data is escaped first, so an imported question cannot inject markup.
 */
export function renderMathText(value: string | null | undefined): string {
  if (!value) return "";
  try {
    let text = escapeHtml(wrapStandaloneMathLines(decodeImportedEntities(value)));
    text = text.replace(/\\\\?\[([\s\S]*?)\\\\?\]/g, (_, formula) => math(formula, true));
    text = text.replace(/\\\\?\(([\s\S]*?)\\\\?\)/g, (_, formula) => math(formula, false));
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => math(formula, true));
    // Do not consume price strings such as "$5". An inline formula needs two
    // delimiters and cannot contain a newline or another dollar sign.
    // `\$` is a literal dollar inside SAT currency formulas, e.g.
    // `$\$1,320$`. Treating that inner dollar as a delimiter used to split
    // the whole sentence and was the cause of the broken coupon-book screen.
    text = text.replace(/\$((?:\\\$|[^$\n])+?)\$/g, (_, formula) => math(formula, false));
    return text.replace(/\r?\n/g, "<br />");
  } catch (error) {
    console.warn("Could not render math", error);
    return escapeHtml(value).replace(/\r?\n/g, "<br />");
  }
}
