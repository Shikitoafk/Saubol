#!/usr/bin/env python3
"""Copy verified answer keys between equivalent parser outputs."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


FILES = ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")


def key(row: dict[str, str]) -> tuple[str, str, str]:
    return row["module"], row["question_number"], row["page"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("verified", type=Path)
    parser.add_argument("target", type=Path)
    options = parser.parse_args()
    copied = 0
    for filename in FILES:
        with (options.verified / filename).open(encoding="utf-8", newline="") as handle:
            answers = {key(row): row["correct_answer"] for row in csv.DictReader(handle)}
        target = options.target / filename
        with target.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            fields, rows = reader.fieldnames, list(reader)
        assert fields
        for row in rows:
            answer = answers.get(key(row), "")
            if answer:
                row["correct_answer"] = answer
                copied += 1
        with target.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
    print(f"Copied {copied} answers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
