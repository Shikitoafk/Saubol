import katex from "katex";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

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
    let text = escapeHtml(value);
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
