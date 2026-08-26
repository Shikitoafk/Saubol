#!/usr/bin/env python3
"""Normalize the reviewed March 2026 Int-C export for publication.

The source's answer key is a scanned four-column table on page 99.  It was
visually verified before these values were transcribed.  This script writes a
separate ready-to-upload directory and refuses any incomplete 98-question set.
"""
from __future__ import annotations

import argparse
import csv
import shutil
from pathlib import Path

SOURCE = "March 2026 Int-C"
PERIOD = "March 2026"
VERSION = "Int-C"
FILES = ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")

RW_1 = "CDBACDDBAADBACDDCCBCCBDBBCC"
RW_2 = "DBBCDACABDBBCDDBCBBBDCCDCBD"
MATH_1 = ["D", "A", "D", "A", "7", "C", "27", "C", "C", "12", "102", "12.08", "D", "A", "C", "0.737", "D", "D", "50", "A", "B", "A"]
MATH_2 = ["B", "D", "B", "C", "D", "B", "C", "7", "D", "C", "D", "D", "B", "8", "A", "C", "10/3", "D", "C", "12", "A", "D"]


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames or [], list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def module_and_answer(filename: str, row: dict[str, str]) -> tuple[str, str]:
    page = int(row["page"])
    number = int(row["question_number"])
    if filename == "ebrw_mcq.csv":
        module = 1 if page <= 27 else 2
        return (
            f"Reading and Writing Module {module}",
            (RW_1 if module == 1 else RW_2)[number - 1],
        )
    module = 1 if page <= 76 else 2
    return f"Math Module {module}", (MATH_1 if module == 1 else MATH_2)[number - 1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("raw", type=Path, help="Gemini export directory")
    parser.add_argument("ready", type=Path, help="separate normalized output directory")
    args = parser.parse_args()
    args.ready.mkdir(parents=True, exist_ok=True)

    totals: dict[str, int] = {}
    module_counts: dict[str, int] = {}
    for filename in FILES:
        fields, rows = read_csv(args.raw / filename)
        for index, row in enumerate(rows, 1):
            module, answer = module_and_answer(filename, row)
            row.update(
                id=str(index), source=SOURCE, test_period=PERIOD,
                test_version=VERSION, module=module, correct_answer=answer,
            )
            # Visuals for this paper are recreated as clean local SVGs; never
            # copy a source screenshot with a distributor watermark.
            if row.get("image_url", "").endswith(".png"):
                row["image_url"] = row["image_url"][:-4] + ".svg"
            module_counts[module] = module_counts.get(module, 0) + 1
        totals[filename] = len(rows)
        write_csv(args.ready / filename, fields, rows)

    expected = {
        "Reading and Writing Module 1": 27,
        "Reading and Writing Module 2": 27,
        "Math Module 1": 22,
        "Math Module 2": 22,
    }
    if totals != {"ebrw_mcq.csv": 54, "math_mcq.csv": 37, "math_open.csv": 7} or module_counts != expected:
        shutil.rmtree(args.ready)
        raise SystemExit(f"Refusing incomplete test: totals={totals}, modules={module_counts}")

    print(f"Ready: {sum(totals.values())} questions, {module_counts}")


if __name__ == "__main__":
    main()
