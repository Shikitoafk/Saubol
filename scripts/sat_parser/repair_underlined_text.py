#!/usr/bin/env python3
"""Restore lost SAT underline markers from original PDF pages.

The parser historically flattened visual underlines. This script finds local
questions whose prompt says "underlined", shows their original PDF page to
Gemini, and writes an idempotent SQL patch containing only exact <u> markers.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

import pymupdf

from sat_parser_gemini import (
    DEFAULT_MODEL_ROTATION,
    ModelPool,
    ask_model_json,
    build_backend,
    env_any,
    load_dotenv,
)


SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "key": {"type": "string"},
            "underlined_texts": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["key", "underlined_texts"],
    },
}


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=Path("output/sat_parser"))
    parser.add_argument("--pdf-root", type=Path, required=True)
    parser.add_argument("--sql-output", type=Path, required=True)
    parser.add_argument("--models", default="")
    parser.add_argument("--skip", type=int, default=0, help="Skip this many unique pages")
    parser.add_argument("--limit", type=int, default=0, help="Process at most this many unique pages")
    return parser.parse_args()


def source_key(value: str) -> str:
    value = value.rsplit("/", 1)[-1]
    value = re.sub(r"\s+", " ", value).strip()
    return value.casefold()


def find_pdfs(root: Path) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for path in root.rglob("*.pdf"):
        name = re.sub(r"\s*\(\d+\)$", "", path.stem).strip()
        result.setdefault(source_key(name), path)
    return result


def collect_questions(output_root: Path) -> list[dict[str, str]]:
    unique: dict[tuple[str, str], dict[str, str]] = {}
    for csv_path in output_root.rglob("ebrw_mcq.csv"):
        with csv_path.open(encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                if "underlined" not in row.get("question", "").casefold():
                    continue
                source = row.get("source", "").strip()
                page = row.get("page", "").strip()
                passage = row.get("passage", "").strip()
                if source and page and passage:
                    unique.setdefault((source, page), row)
    return list(unique.values())


def prompt(items: list[dict[str, str]]) -> str:
    payload = [
        {
            "key": f"{row['source']}|{row['page']}",
            "passage": row["passage"],
            "question": row["question"],
        }
        for row in items
    ]
    return (
        "Each supplied item is a Digital SAT Reading and Writing question. "
        "Inspect its matching PDF page image. The stored passage lost its visual "
        "underlines. Return the exact text of every visibly underlined portion, "
        "copied exactly as it occurs in the supplied stored passage. Do not return "
        "anything that is not visibly underlined. Return one JSON object per key, "
        "including an empty array only if no underline is visible.\n\n"
        + json.dumps(payload, ensure_ascii=False)
    )


def sql_literal(text: str) -> str:
    return "'" + text.replace("'", "''") + "'"


def add_markers(passage: str, pieces: list[str]) -> str | None:
    result = passage
    for piece in sorted({p.strip() for p in pieces if p.strip()}, key=len, reverse=True):
        if "<u>" in piece:
            piece = piece.replace("<u>", "").replace("</u>", "")
        if f"<u>{piece}</u>" in result:
            continue
        if piece not in result:
            return None
        result = result.replace(piece, f"<u>{piece}</u>", 1)
    return result


def main() -> int:
    args = arguments()
    script_dir = Path(__file__).resolve().parent
    load_dotenv([Path.cwd() / ".env", script_dir / ".env", Path(r"C:\Users\PC\Desktop\Saubol\.env")])
    api_key = env_any("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY or GOOGLE_API_KEY is required")

    pdfs = find_pdfs(args.pdf_root)
    rows = collect_questions(args.output_root)
    groups: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        pdf = pdfs.get(source_key(row["source"]))
        if pdf:
            groups[(str(pdf), row["page"])].append(row)
        else:
            print(f"MISSING PDF: {row['source']}")
    jobs = sorted([
        (Path(pdf_path), page, items)
        for (pdf_path, page), items in groups.items()
    ], key=lambda job: (str(job[0]), int(job[1])))
    if args.skip:
        jobs = jobs[args.skip:]
    if args.limit:
        jobs = jobs[: args.limit]

    models = [m.strip() for m in args.models.split(",") if m.strip()] or DEFAULT_MODEL_ROTATION
    pool = ModelPool(build_backend(api_key, "new"), models)
    updates: list[tuple[str, str, str, str]] = []
    failures: list[str] = []
    for index, (pdf_path, page, items) in enumerate(jobs, 1):
        pdf = pymupdf.open(pdf_path)
        page_index = int(page) - 1
        pix = pdf[page_index].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
        pdf.close()
        objects, _ = ask_model_json(
            pool,
            [prompt(items), pool.backend.image_part(pix.tobytes("jpeg", jpg_quality=85))],
            SCHEMA,
            f"underlines {index}/{len(jobs)}",
            args.sql_output.with_suffix(".failures.log"),
        )
        extracted = {str(obj.get("key", "")): obj.get("underlined_texts", []) for obj in objects}
        for row in items:
            key = f"{row['source']}|{row['page']}"
            marked = add_markers(row["passage"], extracted.get(key, []))
            if marked is None or marked == row["passage"]:
                failures.append(key)
                continue
            updates.append((row["source"], row["page"], row["passage"], marked))
        print(f"Processed {index}/{len(jobs)} pages; patches: {len(updates)}")

    lines = ["BEGIN;"]
    for source, page, old, new in updates:
        lines += [
            "UPDATE public.sat_ebrw_mcq",
            f"SET passage = {sql_literal(new)}",
            f"WHERE source = {sql_literal(source)} AND page = {sql_literal(page)}",
            f"  AND passage = {sql_literal(old)};",
        ]
    lines += ["COMMIT;", ""]
    args.sql_output.parent.mkdir(parents=True, exist_ok=True)
    args.sql_output.write_text("\n".join(lines), encoding="utf-8")
    args.sql_output.with_suffix(".unresolved.txt").write_text("\n".join(failures), encoding="utf-8")
    print(f"Wrote {args.sql_output}: {len(updates)} updates, {len(failures)} unresolved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
