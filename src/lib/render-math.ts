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
const decodeImportedEntities = (value: string) => value
  .replace(/&amp;(?=(?:lt|gt|le|ge|nbsp|#60|#62|#8804|#8805);)/gi, "&")
  .replace(/&lt;|&#60;/gi, "<")
  .replace(/&gt;|&#62;/gi, ">")
  .replace(/&le;|&#8804;/gi, "≤")
  .replace(/&ge;|&#8805;/gi, "≥")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&");

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
    let text = escapeHtml(decodeImportedEntities(value));
    text = text.replace(/\\\\?\[([\s\S]*?)\\\\?\]/g, (_, formula) => math(formula, true));
    text = text.replace(/\\\\?\(([\s\S]*?)\\\\?\)/g, (_, formula) => math(formula, false));
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => math(formula, true));
    // Do not consume price strings such as "$5". An inline formula needs two
    // delimiters and cannot contain a newline or another dollar sign.
    text = text.replace(/\$([^$\n]+?)\$/g, (_, formula) => math(formula, false));
    return text.replace(/\r?\n/g, "<br />");
  } catch (error) {
    console.warn("Could not render math", error);
    return escapeHtml(value).replace(/\r?\n/g, "<br />");
  }
}
