#!/usr/bin/env python3
"""Read-only Gemini proofreading pass for the live SAT Question Bank.

The script never changes Supabase. It writes a resumable JSONL report with a
pass/flag verdict for every question so only high-confidence findings are
repaired from the original source or hidden from learners.

    python proofread_live_question_bank.py --limit 20
    python proofread_live_question_bank.py --resume
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).parent))
from sat_parser_gemini import (  # noqa: E402
    DEFAULT_MODEL_ROTATION,
    ModelPool,
    ask_model_json,
    build_backend,
    env_any,
    load_dotenv,
)


TABLES = ("sat_ebrw_mcq", "sat_math_mcq", "sat_math_open")
PAGE_SIZE = 500
SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "key": {"type": "string"},
            "verdict": {"type": "string", "enum": ["pass", "flag"]},
            "expected_answer": {"type": "string"},
            "issues": {"type": "array", "items": {"type": "string"}},
            "confidence": {"type": "number"},
        },
        "required": ["key", "verdict", "expected_answer", "issues", "confidence"],
    },
}


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("output/question-proofread.jsonl"))
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="0 = all rows in the selected scope")
    parser.add_argument(
        "--scope",
        choices=("question-bank", "past-papers", "all"),
        default="question-bank",
        help="which live rows to proofread",
    )
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--models", default="")
    return parser.parse_args()


def load_env() -> tuple[str, str, str]:
    script_dir = Path(__file__).resolve().parent
    load_dotenv([Path.cwd() / ".env", script_dir / ".env"])
    url = env_any("VITE_SUPABASE_URL", "SUPABASE_URL")
    anon = env_any("VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY")
    gemini = env_any("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not url or not anon or not gemini:
        raise SystemExit("VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and GEMINI_API_KEY are required")
    return url.rstrip("/"), anon, gemini


def fetch_rows(base_url: str, key: str, table: str, scope: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for offset in range(0, 100000, PAGE_SIZE):
        params: dict[str, Any] = {"select": "*", "offset": offset, "limit": PAGE_SIZE}
        if scope == "question-bank":
            params["test_period"] = "is.null"
        elif scope == "past-papers":
            params["test_period"] = "not.is.null"
        response = requests.get(
            f"{base_url}/rest/v1/{table}",
            params=params,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            timeout=30,
        )
        response.raise_for_status()
        page = response.json()
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows
    raise RuntimeError(f"Too many rows returned from {table}")


def item(table: str, row: dict[str, Any]) -> dict[str, Any]:
    key = f"{table}:{row.get('uid') or row.get('id')}"
    is_open = table == "sat_math_open" or str(row.get("correct_answer", "")).strip().upper() not in {"A", "B", "C", "D"}
    return {
        "key": key,
        "type": "open" if is_open else "mcq",
        "passage": row.get("passage") or "",
        "question": row.get("question") or "",
        "choices": {} if is_open else {letter: row.get(f"option_{letter.lower()}") or "" for letter in "ABCD"},
        "stored_answer": str(row.get("correct_answer") or "").strip(),
        "source": row.get("source") or "",
        "question_number": row.get("question_number") or row.get("id") or "",
    }


def prompt(batch: list[dict[str, Any]]) -> str:
    return (
        "You are a meticulous Digital SAT content editor. Proofread and independently solve each item. "
        "Flag only objective problems: an OCR/LaTeX corruption that changes meaning, a missing essential "
        "table/figure, malformed choices, or a stored key that is demonstrably wrong. Do not flag ordinary "
        "stylistic differences. If a visual is unavailable, flag it only when the supplied text is insufficient. "
        "For valid MCQ, expected_answer must be the correct A-D letter. For valid open response, give the "
        "accepted final answer. Give a concise issue list only when flagging. Return JSON only.\n\n"
        + json.dumps(batch, ensure_ascii=False)
    )


def read_done(path: Path) -> set[str]:
    if not path.exists():
        return set()
    done = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            done.add(json.loads(line)["key"])
        except (json.JSONDecodeError, KeyError):
            continue
    return done


def main() -> int:
    options = args()
    base_url, supabase_key, gemini_key = load_env()
    options.out.parent.mkdir(parents=True, exist_ok=True)
    done = read_done(options.out) if options.resume else set()
    rows = [item(table, row) for table in TABLES for row in fetch_rows(base_url, supabase_key, table, options.scope)]
    pending = [row for row in rows if row["key"] not in done]
    if options.limit:
        pending = pending[:options.limit]
    models = [name.strip() for name in options.models.split(",") if name.strip()] or DEFAULT_MODEL_ROTATION
    pool = ModelPool(build_backend(gemini_key, "new"), models)
    mode = "a" if options.resume else "w"
    with options.out.open(mode, encoding="utf-8") as report:
        for start in range(0, len(pending), options.batch_size):
            batch = pending[start:start + options.batch_size]
            findings, _ = ask_model_json(pool, [prompt(batch)], SCHEMA, f"proofread {start + 1}-{start + len(batch)}", options.out.with_suffix(".failures.log"))
            by_key = {str(finding.get("key", "")): finding for finding in findings}
            for question in batch:
                finding = by_key.get(question["key"], {"key": question["key"], "verdict": "flag", "expected_answer": "", "issues": ["No structured Gemini result"], "confidence": 0})
                report.write(json.dumps({**question, "review": finding}, ensure_ascii=False) + "\n")
            report.flush()
            flagged = sum(1 for finding in findings if finding.get("verdict") == "flag")
            print(f"Reviewed {start + len(batch)}/{len(pending)} in this run; model flagged {flagged} in latest batch")
    print(f"Report: {options.out} — reviewed {len(pending)} questions (total {options.scope} rows: {len(rows)}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
