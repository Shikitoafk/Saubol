#!/usr/bin/env python3
"""Normalize the reviewed March 2025 US v2 Gemini draft.

The source PDF uses three-page visual stimuli in RW. Gemini emitted an
extra continuation as a second question, so this script removes only the two
verified duplicate records, normalizes module labels, and applies the answer
key read from the final answer-key page. It intentionally does not fabricate
the 17 required figures: those remain in images_todo.csv for clean redraws.
"""

from __future__ import annotations

import csv
from pathlib import Path


SOURCE = "March 2025 US v2 @DSATuz"
PERIOD = "March 2025 - US v2"
VERSION = "US v2"

RW_M1 = {
    1: "B", 2: "A", 3: "C", 4: "A", 5: "C", 6: "B", 7: "C", 8: "B", 9: "D",
    10: "D", 11: "B", 12: "B", 13: "C", 14: "D", 15: "C", 16: "D", 17: "B",
    18: "A", 19: "D", 20: "B", 21: "A", 22: "B", 23: "D", 24: "A", 25: "B",
    26: "D", 27: "B",
}
RW_M2 = {
    1: "B", 2: "B", 3: "B", 4: "C", 5: "A", 6: "C", 7: "B", 8: "A", 9: "B",
    10: "B", 11: "B", 12: "A", 13: "B", 14: "A", 15: "A", 16: "B", 17: "D",
    18: "B", 19: "A", 20: "A", 21: "D", 22: "B", 23: "A", 24: "C", 25: "B",
    26: "C", 27: "B",
}
MATH_M1 = {
    1: "B", 2: "24", 3: "D", 4: "D", 5: "B", 6: "C", 7: "C", 8: "D", 9: "64",
    10: "A", 11: "4", 12: "C", 13: "B", 14: "D", 15: "B", 16: "C", 17: "D",
    18: "A", 19: "48", 20: "B", 21: "349.2", 22: "9",
}
MATH_M2 = {
    1: "C", 2: "C", 3: "C", 4: "A", 5: "C", 6: "C", 7: "A", 8: "B", 9: "392",
    10: "A", 11: "D", 12: "D", 13: "A", 14: "6", 15: "B", 16: "B", 17: "B",
    18: "-6", 19: "D", 20: "D", 21: "2 or 179", 22: "638",
}

CLEAN_IMAGES = {
    59: "/sat_images/math/march-2025-us-v2-p59-q1.svg",
    70: "/sat_images/math/march-2025-us-v2-p70-q12.svg",
    71: "/sat_images/math/march-2025-us-v2-p71-q13.svg",
    75: "/sat_images/math/march-2025-us-v2-p75-q17.svg",
    79: "/sat_images/math/march-2025-us-v2-p79-q21.svg",
    80: "/sat_images/math/march-2025-us-v2-p80-q22.svg",
    83: "/sat_images/math/march-2025-us-v2-p83-q3.svg",
    84: "/sat_images/math/march-2025-us-v2-p84-q4.svg",
    86: "/sat_images/math/march-2025-us-v2-p86-q6.svg",
    88: "/sat_images/math/march-2025-us-v2-p88-q8.svg",
    96: "/sat_images/math/march-2025-us-v2-p96-q16.svg",
    97: "/sat_images/math/march-2025-us-v2-p97-q17.svg",
}

RW_CLEAN_IMAGES = {
    10: "/sat_images/ebrw/march-2025-us-v2-forest-cover.svg",
    11: "/sat_images/ebrw/march-2025-us-v2-forest-cover.svg",
    40: "/sat_images/ebrw/march-2025-us-v2-p40-q11.svg",
}


def rewrite(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        fields = csv.DictReader(handle).fieldnames
    if not fields:
        raise ValueError(f"Missing header in {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def load(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def stamp(row: dict[str, str]) -> None:
    row["source"] = SOURCE
    row["test_period"] = PERIOD
    row["test_version"] = VERSION


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    root = args.output

    rw_rows = []
    for row in load(root / "ebrw_mcq.csv"):
        page = int(row["page"])
        # Page 13 repeats the three-page visual question from page 11; page 41
        # is a continuation that the model emitted without a question number.
        if page in {13, 41}:
            continue
        stamp(row)
        is_m1 = page <= 29
        row["module"] = "Reading and Writing Module 1" if is_m1 else "Reading and Writing Module 2"
        row["correct_answer"] = (RW_M1 if is_m1 else RW_M2)[int(row["question_number"])]
        if page in RW_CLEAN_IMAGES:
            row["image_url"] = RW_CLEAN_IMAGES[page]
        rw_rows.append(row)
    rewrite(root / "ebrw_mcq.csv", rw_rows)

    for filename in ("math_mcq.csv", "math_open.csv"):
        rows = []
        for row in load(root / filename):
            page = int(row["page"])
            stamp(row)
            is_m1 = page <= 80
            row["module"] = "Math Module 1" if is_m1 else "Math Module 2"
            row["correct_answer"] = (MATH_M1 if is_m1 else MATH_M2)[int(row["question_number"])]
            if page in CLEAN_IMAGES:
                row["image_url"] = CLEAN_IMAGES[page]
            rows.append(row)
        rewrite(root / filename, rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
