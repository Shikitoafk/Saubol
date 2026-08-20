#!/usr/bin/env python3
"""Validate a parsed Digital SAT output directory."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


CSV_FILES = ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")
EXPECTED_MODULES = {
    "Reading and Writing Module 1": 27,
    "Reading and Writing Module 2": 27,
    "Math Module 1": 22,
    "Math Module 2": 22,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument(
        "--public-dir",
        type=Path,
        help="site public directory used to resolve root-relative image URLs",
    )
    parser.add_argument("--write-report", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir.resolve()
    errors: list[str] = []
    files: dict[str, list[dict[str, str]]] = {}
    grouped: dict[str, list[tuple[str, dict[str, str]]]] = defaultdict(list)

    for filename in CSV_FILES:
        path = output_dir / filename
        if not path.is_file():
            errors.append(f"Missing file: {filename}")
            continue
        with path.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        files[filename] = rows
        for row in rows:
            grouped[row.get("module", "")].append((filename, row))

    all_rows = [(filename, row) for filename, rows in files.items() for row in rows]
    if len(all_rows) != 98:
        errors.append(f"Expected 98 questions, found {len(all_rows)}")

    for module, expected_count in EXPECTED_MODULES.items():
        numbers: list[int] = []
        for filename, row in grouped.get(module, []):
            try:
                numbers.append(int(row.get("question_number", "")))
            except ValueError:
                errors.append(
                    f"Invalid question number in {filename}: {row.get('question_number')!r}"
                )
        expected_numbers = list(range(1, expected_count + 1))
        if sorted(numbers) != expected_numbers:
            errors.append(
                f"{module}: expected questions 1-{expected_count}, found {sorted(numbers)}"
            )

    unexpected_modules = sorted(set(grouped) - set(EXPECTED_MODULES))
    if unexpected_modules:
        errors.append(f"Unexpected module labels: {unexpected_modules}")

    image_questions = 0
    for filename, row in all_rows:
        location = f"{filename} page {row.get('page')} question {row.get('question_number')}"
        answer = row.get("correct_answer", "").strip()
        if not answer:
            errors.append(f"Blank answer: {location}")
        if filename.endswith("mcq.csv") and answer.upper() not in {"A", "B", "C", "D"}:
            errors.append(f"Invalid MCQ answer {answer!r}: {location}")
        if row.get("has_image", "").lower() == "true":
            image_questions += 1
            image_value = row.get("image_url", "")
            if image_value.startswith("/") and args.public_dir:
                image_path = args.public_dir.resolve() / image_value.lstrip("/")
            else:
                image_path = Path(image_value)
            if not image_path.is_file():
                errors.append(f"Missing image {image_path}: {location}")

    report = {
        "status": "ok" if not errors else "error",
        "total_questions": len(all_rows),
        "files": {filename: len(rows) for filename, rows in files.items()},
        "modules": {module: len(rows) for module, rows in grouped.items()},
        "answers_filled": sum(
            bool(row.get("correct_answer", "").strip()) for _, row in all_rows
        ),
        "image_questions": image_questions,
        "errors": errors,
    }

    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered)
    if args.write_report:
        (output_dir / "validation_report.json").write_text(
            rendered + "\n", encoding="utf-8"
        )
        (output_dir / "gaps_report.txt").write_text(
            "No missing questions.\n" if not errors else "\n".join(errors) + "\n",
            encoding="utf-8",
        )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
