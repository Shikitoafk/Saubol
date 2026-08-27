#!/usr/bin/env node
/**
 * Read-only integrity audit for the SAT Question Bank stored in Supabase.
 *
 * It finds records that cannot safely be shown to a learner: missing answer
 * choices, broken entity/LaTex fragments, absent visual assets, and duplicate
 * imported content. It never alters Supabase. Use its JSON report to repair
 * questions from the original PDF before publishing them again.
 *
 *   node scripts/sat_parser/audit_live_question_bank.mjs
 *   node scripts/sat_parser/audit_live_question_bank.mjs --out audit.json
 */

import { readFileSync, writeFileSync } from "node:fs";

const TABLES = ["sat_ebrw_mcq", "sat_math_mcq", "sat_math_open"];
const PAGE_SIZE = 1000;

function envValue(name) {
  const source = readFileSync(".env", "utf8");
  const line = source.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${name}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "") || "";
}

const url = envValue("VITE_SUPABASE_URL");
const key = envValue("VITE_SUPABASE_ANON_KEY") || envValue("SUPABASE_ANON_KEY");
if (!url || !key) throw new Error("Missing Supabase URL or anon key in .env");

async function fetchAll(table) {
  const rows = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&order=uid.asc&offset=${start}&limit=${PAGE_SIZE}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

const visualReference = /\b(?:the|this|given)\s+(?:table|graph|chart|figure|diagram)\b|\b(?:table|graph|chart|figure|diagram)\s+(?:shows|summarizes|gives|lists|represents)\b|\b(?:following\s+tables?|each\s+table)\b/i;
const textTable = /Table\s*[—-]|—trees\s+\d+|Observed traits .*?flowering date|Fish abundance .*?station|Video game units sold|;[^\n]{1,180}—/is;

function countUnescapedDollar(text) {
  let count = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === "$" && text[index - 1] !== "\\") count++;
  }
  return count;
}

function recordIssue(issues, kind, table, row, details = "") {
  issues.push({
    kind,
    table,
    uid: row.uid,
    source: row.source || "",
    module: row.module || "",
    question_number: row.question_number ?? row.id ?? "",
    details,
    preview: `${row.passage || ""}\n${row.question || ""}`.replace(/\s+/g, " ").slice(0, 220),
  });
}

function auditRow(table, row, issues) {
  const isOpen = table === "sat_math_open";
  const fields = [row.passage, row.question, row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean).join("\n");
  if (!String(row.question || "").trim()) recordIssue(issues, "missing_question", table, row);
  if (!String(row.correct_answer || "").trim()) recordIssue(issues, "missing_answer", table, row);
  if (!isOpen && [row.option_a, row.option_b, row.option_c, row.option_d].some((value) => !String(value || "").trim())) {
    recordIssue(issues, "missing_choice", table, row);
  }
  if (!isOpen && !/^[ABCD]$/i.test(String(row.correct_answer || "").trim())) {
    recordIssue(issues, "invalid_mcq_answer", table, row, String(row.correct_answer || ""));
  }
  if (/&(gt|lt|amp|le|ge);|&#(?:0*60|0*62|0*8804|0*8805);/i.test(fields)) {
    recordIssue(issues, "encoded_html_entity", table, row);
  }
  if (countUnescapedDollar(fields) % 2 !== 0) recordIssue(issues, "unpaired_math_delimiter", table, row);
  if (/\\(?:frac|sqrt|left|right|leq|geq)\b/.test(fields) && !/[\\$]/.test(fields)) {
    recordIssue(issues, "unwrapped_latex", table, row);
  }
  const needsVisual = visualReference.test(fields);
  const hasImage = Boolean(String(row.image_url || "").trim());
  if (String(row.has_image).toLowerCase() === "true" && !hasImage) recordIssue(issues, "missing_image_url", table, row);
  if (needsVisual && !hasImage && !textTable.test(fields)) recordIssue(issues, "missing_visual_source", table, row);
}

const all = await Promise.all(TABLES.map(async (table) => [table, await fetchAll(table)]));
const issues = [];
const duplicates = [];
for (const [table, rows] of all) {
  const seen = new Map();
  for (const row of rows) {
    auditRow(table, row, issues);
    const fingerprint = [row.passage, row.question, row.option_a, row.option_b, row.option_c, row.option_d]
      .map((value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase())
      .join("|");
    if (!fingerprint.replace(/\|/g, "")) continue;
    const first = seen.get(fingerprint);
    if (first) duplicates.push({ table, first_uid: first.uid, duplicate_uid: row.uid, source: row.source || "", preview: String(row.question || "").slice(0, 180) });
    else seen.set(fingerprint, row);
  }
}

const byKind = Object.fromEntries([...new Set(issues.map(({ kind }) => kind))].sort().map((kind) => [kind, issues.filter((issue) => issue.kind === kind).length]));
const report = {
  generated_at: new Date().toISOString(),
  read_only: true,
  totals: Object.fromEntries(all.map(([table, rows]) => [table, rows.length])),
  issue_counts: byKind,
  duplicate_count: duplicates.length,
  issues,
  duplicates,
};

const destination = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "";
const output = `${JSON.stringify(report, null, 2)}\n`;
if (destination) writeFileSync(destination, output);
else process.stdout.write(output);
