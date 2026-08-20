#!/usr/bin/env python3
"""Append a manually recovered parser row and mark its source page complete."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--question-json", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    parser.add_argument("--source-key", required=True)
    parser.add_argument("--batch", type=int, required=True, help="zero-based batch/page")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    with args.csv.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        fields = list(reader.fieldnames or [])
    if not fields:
        raise SystemExit(f"CSV has no header: {args.csv}")

    row = json.loads(args.question_json.read_text(encoding="utf-8"))
    row["id"] = str(max((int(item["id"]) for item in rows), default=0) + 1)
    missing = [field for field in fields if field not in row]
    extra = [field for field in row if field not in fields]
    if missing or extra:
        raise SystemExit(f"Field mismatch; missing={missing}, extra={extra}")

    duplicate = any(
        item.get("source") == row["source"]
        and item.get("question_number") == str(row["question_number"])
        and item.get("page") == str(row["page"])
        for item in rows
    )
    if not duplicate:
        rows.append({field: row[field] for field in fields})
        with args.csv.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    state = json.loads(args.state.read_text(encoding="utf-8"))
    file_state = state["files"][args.source_key]
    for key in ("batches", "covered"):
        file_state[key] = sorted(set(file_state.get(key, [])) | {args.batch})
    args.state.write_text(json.dumps(state, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("already present" if duplicate else "question appended")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
