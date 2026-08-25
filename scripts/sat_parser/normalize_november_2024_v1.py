#!/usr/bin/env python3
"""Normalize the reviewed November SAT screen export into one complete test."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

SOURCE, PERIOD, VERSION = "November 2024 Version 1", "November 2024", "Version 1"
FILES = ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv")
RW1 = "B C B B C B D C A A A A C B D A D C D C A A B B D C B".split()
RW2 = "A A A A A B A D A A A C A A B B A B B A A A A B C A D".split()
M1 = "B B C A A 9.5 A 139 C B D 12 B D 17 1.5 D D C 233 D A".split()
M2 = "D A D A C A D 14 B D 27 B 3 C B A 4.232 C 6.25 A A 288".split()
IMAGE_URLS = {
    12: "/sat_images/ebrw/november-2024-v1-p12-q12.svg",
    13: "/sat_images/ebrw/november-2024-v1-p13-q13.svg",
    38: "/sat_images/ebrw/november-2024-v1-p38-q11.svg",
    40: "/sat_images/ebrw/november-2024-v1-p40-q13.svg",
    63: "/sat_images/math/november-2024-v1-p63-q9.svg",
    64: "/sat_images/math/november-2024-v1-p64-q10.svg",
    65: "/sat_images/math/november-2024-v1-p65-q11.svg",
    67: "/sat_images/math/november-2024-v1-p67-q13.svg",
    77: "/sat_images/math/november-2024-v1-p77-q1.svg",
    83: "/sat_images/math/november-2024-v1-p83-q6.svg",
    84: "/sat_images/math/november-2024-v1-p84-q7.svg",
    88: "/sat_images/math/november-2024-v1-p88-q11.svg",
}


def load(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader), reader.fieldnames or []


def num(value: str | None):
    return int(value) if (value or "").isdigit() else None


def score(row: dict[str, str]):
    text = len((row.get("passage") or "").strip()) + len((row.get("question") or "").strip())
    choices = sum(len((row.get(f"option_{c}") or "").strip()) for c in "abcd")
    return text + choices, choices


def pick(rows, page, question, label):
    options = [r for r in rows if num(r.get("page")) == page and num(r.get("question_number")) == question]
    if not options:
        raise ValueError(f"Missing {label} question {question} on page {page}")
    return max(options, key=score)


def stamp(row, module, question, answer):
    row = {k: v or "" for k, v in row.items()}
    row.update(id="", source=SOURCE, test_period=PERIOD, test_version=VERSION,
               module=module, question_number=str(question), correct_answer=answer,
               # Only clean redraws receive public URLs. Never expose PDF crops.
               image_url=IMAGE_URLS.get(num(row.get("page")), ""))
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    root = parser.parse_args().output
    loaded = {name: load(root / name) for name in FILES}
    raw = {name: data[0] for name, data in loaded.items()}
    result = {name: [] for name in FILES}
    for q in range(1, 28):
        result["ebrw_mcq.csv"].append(stamp(pick(raw["ebrw_mcq.csv"], q, q, "RW M1"), "Reading and Writing Module 1", q, RW1[q - 1]))
        result["ebrw_mcq.csv"].append(stamp(pick(raw["ebrw_mcq.csv"], q + 27, q, "RW M2"), "Reading and Writing Module 2", q, RW2[q - 1]))
    m1_open = {6, 8, 12, 15, 16, 20}
    for q in range(1, 23):
        filename = "math_open.csv" if q in m1_open else "math_mcq.csv"
        result[filename].append(stamp(pick(raw[filename], q + 54, q, "Math M1"), "Math Module 1", q, M1[q - 1]))
    m2_open = {8, 11, 13, 17, 19, 22}
    for q in range(1, 23):
        filename = "math_open.csv" if q in m2_open else "math_mcq.csv"
        page = q + 76 if q <= 3 else q + 77  # page 80 continues M2 question 3
        result[filename].append(stamp(pick(raw[filename], page, q, "Math M2"), "Math Module 2", q, M2[q - 1]))
    for name, (_, fields) in loaded.items():
        for index, row in enumerate(result[name], 1): row["id"] = str(index)
        with (root / name).open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields); writer.writeheader(); writer.writerows(result[name])
    print("Normalized 98 questions and applied the PDF's answer key.")


if __name__ == "__main__":
    main()
