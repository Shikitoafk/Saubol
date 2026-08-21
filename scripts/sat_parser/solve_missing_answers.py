#!/usr/bin/env python3
"""Fill missing SAT CSV answers with Gemini, without guessing image-only items."""

from __future__ import annotations

import argparse
import csv
import json
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


FILES = ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")
ANSWER_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "key": {"type": "string"},
            "answer": {"type": "string"},
        },
        "required": ["key", "answer"],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_dir", type=Path)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--include-images", action="store_true")
    parser.add_argument("--pdf", type=Path, help="Source PDF for image-dependent rows")
    parser.add_argument("--models", default="")
    return parser.parse_args()


def prompt_for(items: list[dict[str, str]]) -> str:
    payload = []
    for item in items:
        payload.append(
            {
                "key": item["_key"],
                "type": "open" if item["_file"] == "math_open.csv" else "mcq",
                "passage": item.get("passage", ""),
                "question": item.get("question", ""),
                "choices": {
                    "A": item.get("option_a", ""),
                    "B": item.get("option_b", ""),
                    "C": item.get("option_c", ""),
                    "D": item.get("option_d", ""),
                },
            }
        )
    return (
        "Solve these Digital SAT questions carefully. Return one answer for every key. "
        "For mcq, answer with exactly A, B, C, or D. For open response, return only the "
        "final accepted numeric expression, with no explanation. Do not infer missing "
        "chart or diagram data. Return only the requested JSON array.\n\n"
        + json.dumps(payload, ensure_ascii=False)
    )


def main() -> int:
    args = parse_args()
    root = args.csv_dir.resolve()
    script_dir = Path(__file__).resolve().parent
    load_dotenv([Path.cwd() / ".env", script_dir / ".env"])
    api_key = env_any("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY or GOOGLE_API_KEY is required")

    rows_by_file: dict[str, list[dict[str, str]]] = {}
    pending: list[dict[str, str]] = []
    for filename in FILES:
        path = root / filename
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        rows_by_file[filename] = rows
        for index, row in enumerate(rows):
            if row.get("correct_answer", "").strip():
                continue
            if not args.include_images and row.get("has_image", "").lower() == "true":
                continue
            row["_file"] = filename
            row["_index"] = str(index)
            row["_key"] = f"{filename}:{index}"
            pending.append(row)

    models = [m.strip() for m in args.models.split(",") if m.strip()]
    pool = ModelPool(build_backend(api_key, "new"), models or DEFAULT_MODEL_ROTATION)
    batches: list[list[dict[str, str]]] = []
    text_batch: list[dict[str, str]] = []
    for item in pending:
        if item.get("has_image", "").lower() == "true":
            if text_batch:
                batches.append(text_batch)
                text_batch = []
            batches.append([item])
        else:
            text_batch.append(item)
            if len(text_batch) >= args.batch_size:
                batches.append(text_batch)
                text_batch = []
    if text_batch:
        batches.append(text_batch)

    pdf = pymupdf.open(args.pdf) if args.pdf else None
    filled = 0
    processed = 0
    for batch in batches:
        parts: list[object] = [prompt_for(batch)]
        if batch[0].get("has_image", "").lower() == "true":
            if pdf is None:
                raise SystemExit("--pdf is required with --include-images")
            page_number = int(batch[0]["page"])
            pixmap = pdf[page_number - 1].get_pixmap(
                matrix=pymupdf.Matrix(1.5, 1.5), alpha=False
            )
            parts.append(pool.backend.image_part(pixmap.tobytes("jpeg", jpg_quality=82)))
        objects, _ = ask_model_json(
            pool,
            parts,
            ANSWER_SCHEMA,
            f"answers {processed + 1}-{processed + len(batch)}",
            root / "answer_solver_failures.log",
        )
        by_key = {str(obj.get("key", "")): str(obj.get("answer", "")).strip() for obj in objects}
        for item in batch:
            answer = by_key.get(item["_key"], "")
            if item["_file"] != "math_open.csv":
                answer = answer.upper()
                if answer not in {"A", "B", "C", "D"}:
                    continue
            elif not answer:
                continue
            rows_by_file[item["_file"]][int(item["_index"])]["correct_answer"] = answer
            filled += 1
        processed += len(batch)
        print(f"Solved {filled}/{len(pending)}")

    for filename, rows in rows_by_file.items():
        path = root / filename
        fieldnames = [name for name in rows[0] if not name.startswith("_")]
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows({key: row.get(key, "") for key in fieldnames} for row in rows)
    print(f"Filled {filled} missing answers; skipped image-dependent rows unless requested.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
