#!/usr/bin/env python3
"""Collapse the August 2024 INT v2 Gemini draft into its 98 real questions.

The source is a Bluebook screenshot export: questions 17 and 19 in Math M1,
and question 16 in Math M2, span two consecutive pages.  A resumed Gemini
run can therefore emit several partial copies of the same item.  This script
selects the most complete transcription from the known page window and gives
every retained item its canonical module and number.  It deliberately does
not invent answers or publish the result.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path


SOURCE = "August 2024 INT v2"
PERIOD = "August 2024"
VERSION = "INT v2"
IMAGE_URLS = {
    11: "/sat_images/ebrw/august-2024-int-v2-p11-q11.svg",
    12: "/sat_images/ebrw/august-2024-int-v2-p12-q12.svg",
    14: "/sat_images/ebrw/august-2024-int-v2-p14-q14.svg",
    64: "/sat_images/math/august-2024-int-v2-p64-q9.svg",
    66: "/sat_images/math/august-2024-int-v2-p66-q10.svg",
    72: "/sat_images/math/august-2024-int-v2-p72-q16.svg",
    74: "/sat_images/math/august-2024-int-v2-p74-q17.svg",
    76: "/sat_images/math/august-2024-int-v2-p76-q19.svg",
    97: "/sat_images/math/august-2024-int-v2-p97-q16.svg",
}


def load(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader), reader.fieldnames or []


def save(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def integer(value: str | None) -> int | None:
    return int(value) if (value or "").isdigit() else None


def quality(row: dict[str, str]) -> tuple[int, int, int, int]:
    """Prefer complete question text/options, then a detected answer."""
    text = len((row.get("passage") or "").strip()) + len((row.get("question") or "").strip())
    options = sum(len((row.get(f"option_{letter}") or "").strip()) for letter in "abcd")
    image = int((row.get("has_image") or "").lower() == "true")
    answer = int(bool((row.get("correct_answer") or "").strip()))
    return (text + options, options, image, answer)


def canonical(row: dict[str, str], module: str, number: int) -> dict[str, str]:
    row = {key: (value or "") for key, value in row.items()}
    row.update(
        source=SOURCE,
        test_period=PERIOD,
        test_version=VERSION,
        module=module,
        question_number=str(number),
        id="",
        # Generated source crops include third-party watermarks. They may be
        # used for local review, never for the public site.
        image_url=IMAGE_URLS.get(integer(row.get("page")) or 0, ""),
    )
    return row


def pick(rows: list[dict[str, str]], pages: set[int], number: int, qtype: str) -> dict[str, str]:
    matches = [
        row for row in rows
        if integer(row.get("page")) in pages
        and integer(row.get("question_number")) == number
    ]
    if not matches:
        raise ValueError(f"Missing {qtype} question {number} on pages {sorted(pages)}")
    return max(matches, key=quality)


def expected_rw() -> list[tuple[str, int, set[int], str]]:
    output = []
    for number in range(1, 28):
        output.append(("Reading and Writing Module 1", number, {number}, "ebrw_mcq.csv"))
    # Page 38 is the continuation of question 10, so question 11 starts p39.
    for number in range(1, 28):
        page = number + 27 if number <= 10 else number + 28
        output.append(("Reading and Writing Module 2", number, {page}, "ebrw_mcq.csv"))
    return output


def expected_math() -> list[tuple[str, int, set[int], str]]:
    m1_types = {
        1: "math_open.csv", 2: "math_mcq.csv", 3: "math_open.csv", 4: "math_mcq.csv",
        5: "math_mcq.csv", 6: "math_mcq.csv", 7: "math_mcq.csv", 8: "math_mcq.csv",
        9: "math_mcq.csv", 10: "math_mcq.csv", 11: "math_mcq.csv", 12: "math_mcq.csv",
        13: "math_mcq.csv", 14: "math_mcq.csv", 15: "math_mcq.csv", 16: "math_open.csv",
        17: "math_mcq.csv", 18: "math_mcq.csv", 19: "math_mcq.csv", 20: "math_open.csv",
        21: "math_open.csv", 22: "math_open.csv",
    }
    output = []
    for number, filename in m1_types.items():
        # Pages 65, 74, and 77 are continuations of questions 9, 17, and 19.
        page_by_number = {
            **{n: n + 55 for n in range(1, 10)},
            **{n: n + 56 for n in range(10, 17)},
            17: 73, 18: 75, 19: 76, 20: 78, 21: 79, 22: 80,
        }
        page = page_by_number[number]
        pages = {73, 74} if number == 17 else {76, 77} if number == 19 else {page}
        output.append(("Math Module 1", number, pages, filename))

    m2_types = {
        1: "math_mcq.csv", 2: "math_mcq.csv", 3: "math_open.csv", 4: "math_open.csv",
        5: "math_mcq.csv", 6: "math_open.csv", 7: "math_mcq.csv", 8: "math_mcq.csv",
        9: "math_open.csv", 10: "math_mcq.csv", 11: "math_mcq.csv", 12: "math_mcq.csv",
        13: "math_mcq.csv", 14: "math_mcq.csv", 15: "math_open.csv", 16: "math_mcq.csv",
        17: "math_open.csv", 18: "math_mcq.csv", 19: "math_mcq.csv", 20: "math_open.csv",
        21: "math_mcq.csv", 22: "math_mcq.csv",
    }
    for number, filename in m2_types.items():
        # Page 97 is the lower half of question 16, moving questions 17-22.
        page = number + (81 if number >= 17 else 80)
        pages = {page, page + 1} if number == 16 else {page}
        output.append(("Math Module 2", number, pages, filename))
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    root = args.output
    data: dict[str, tuple[list[dict[str, str]], list[str]]] = {
        name: load(root / name)
        for name in ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")
    }
    final: dict[str, list[dict[str, str]]] = {name: [] for name in data}
    for module, number, pages, filename in expected_rw() + expected_math():
        row = pick(data[filename][0], pages, number, filename)
        final[filename].append(canonical(row, module, number))
    for filename, (rows, fields) in data.items():
        for index, row in enumerate(final[filename], 1):
            row["id"] = str(index)
        save(root / filename, fields, final[filename])
    print("Normalized 98 questions; answer and clean-visual verification still required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
