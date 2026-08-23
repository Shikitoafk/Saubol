#!/usr/bin/env python3
"""Extract a Digital SAT PDF that already has a usable text layer.

This is intentionally a conservative fallback for vendor PDFs.  It never sends
the question text to an OCR service: questions and choices come straight from
the PDF text layer, leaving only answer verification for a separate step.
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

import pymupdf


MCQ_FIELDS = [
    "id", "source", "test_period", "test_version", "module", "question_number",
    "passage", "question", "option_a", "option_b", "option_c", "option_d",
    "correct_answer", "topic", "has_image", "image_url", "page",
]
OPEN_FIELDS = [field for field in MCQ_FIELDS if field not in {"option_a", "option_b", "option_c", "option_d"}]
QUESTION_START = re.compile(r"(?m)^\s*(\d{1,2})\)\s*")
# Some EliteXSAT PDF pages store all options on one line and substitute Cyrillic
# lookalikes (notably `В`) for Latin letters during PDF extraction.
OPTION_START = re.compile(r"(?m)^\s*([AАBВCСDД])\.\s*")
INLINE_OPTION_START = re.compile(r"(?<![A-Za-zА-Яа-я])([AАBВCСDД])\.\s*")
QUESTION_PHRASE = re.compile(
    r"(?m)^\s*((?:Which|What|How|For which|The student wants|Based on|According to|In the).+\?)\s*$"
)
# Text layers do not preserve underlines.  Keep narrowly scoped verified
# overrides here; the page number is stable within the source PDF.
UNDERLINE_OVERRIDES = {
    ("Reading and Writing Module 1", 5): "Vertical gene transfer involves the transmission of genetic material from a parent to offspring: horizontal gene transfer, on the other hand, involves the exchange of genetic material between organisms not in a parent-offspring relationship.",
    ("Reading and Writing Module 2", 8): "intraspecific contact with perceived outsiders.",
}
VISUAL_ASSETS = {
    ("Reading and Writing Module 1", 9): "/sat_images/ebrw/2025_Aug_V3_p02_q09_clean.svg",
    ("Reading and Writing Module 1", 12): "/sat_images/ebrw/2025_Aug_V3_p03_q12_clean.svg",
    ("Reading and Writing Module 1", 13): "/sat_images/ebrw/2025_Aug_V3_p03_q12_clean.svg",
    ("Reading and Writing Module 2", 12): "/sat_images/ebrw/2025_Aug_V3_p08_q12_clean.svg",
}


def clean(text: str) -> str:
    text = text.replace("\u200b", "").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()


def split_choices(block: str, *, allow_inline: bool = False) -> tuple[str, dict[str, str]] | None:
    matches = list((INLINE_OPTION_START if allow_inline else OPTION_START).finditer(block))
    latin = {"A": "A", "А": "A", "B": "B", "В": "B", "C": "C", "С": "C", "D": "D", "Д": "D"}
    labels = [latin[m.group(1)] for m in matches]
    if len(matches) != 4 or labels != list("ABCD"):
        return None
    stem = block[:matches[0].start()].strip()
    choices: dict[str, str] = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(block)
        choices[labels[index]] = clean(block[match.end():end]).replace("\n", " ")
    return stem, choices


def split_stem(stem: str) -> tuple[str, str]:
    lines = [line.strip() for line in stem.splitlines() if line.strip()]
    for index in range(len(lines) - 1, -1, -1):
        if QUESTION_PHRASE.match(lines[index]):
            return clean(" ".join(lines[:index])), clean(" ".join(lines[index:]))
    # Math questions frequently have the entire prompt in one paragraph.
    return "", clean(" ".join(lines))


def restore_underline(module: str, number: int, passage: str) -> str:
    target = UNDERLINE_OVERRIDES.get((module, number))
    if not target:
        return passage
    if target not in passage:
        raise ValueError(f"Underline target was not found for {module} question {number}")
    return passage.replace(target, f"<u>{target}</u>", 1)


def parse_rw_page(text: str) -> list[tuple[int, str, dict[str, str]]]:
    starts = list(QUESTION_START.finditer(text))
    results = []
    for index, match in enumerate(starts):
        end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        parsed = split_choices(text[match.end():end])
        if parsed:
            results.append((int(match.group(1)), parsed[0], parsed[1]))
    return results


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--source", required=True)
    parser.add_argument("--period", default="")
    parser.add_argument("--version", default="")
    return parser.parse_args()


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    options = args()
    document = pymupdf.open(options.pdf)
    pages = [clean(page.get_text()) for page in document]
    output = options.output
    output.mkdir(parents=True, exist_ok=True)
    rw_rows: list[dict[str, str]] = []
    math_rows: list[dict[str, str]] = []
    open_rows: list[dict[str, str]] = []
    rejected: list[str] = []
    rw_module = 1
    math_module = 1
    math_number = 0
    for page_index, text in enumerate(pages, start=1):
        if "Verbal M1" in text:
            rw_module = 1
        elif "Verbal M2" in text:
            rw_module = 2
        parsed = parse_rw_page(text)
        if parsed:
            for number, stem, choices in parsed:
                passage, question = split_stem(stem)
                module = f"Reading and Writing Module {rw_module}"
                visual = VISUAL_ASSETS.get((module, number), "")
                row = {
                    "id": str(len(rw_rows) + 1), "source": options.source,
                    "test_period": options.period, "test_version": options.version,
                    "module": module,
                    "question_number": str(number), "passage": restore_underline(module, number, passage), "question": question,
                    "option_a": choices["A"], "option_b": choices["B"],
                    "option_c": choices["C"], "option_d": choices["D"],
                    "correct_answer": "", "topic": "Reading & Writing", "has_image": str(bool(visual)),
                    "image_url": visual, "page": str(page_index),
                }
                rw_rows.append(row)
            continue
        # Every non-verbal page in this format holds exactly one math question.
        choice_parse = split_choices(text, allow_inline=True)
        if page_index <= 11:
            if text:
                rejected.append(f"page {page_index}: non-verbal page without four A-D choices")
            continue
        if not text:
            continue
        math_number += 1
        if math_number == 23:
            math_module, math_number = 2, 1
        if choice_parse:
            stem, choices = choice_parse
            passage, question = split_stem(stem)
            row = {
            "id": str(len(math_rows) + 1), "source": options.source,
            "test_period": options.period, "test_version": options.version,
            "module": f"Math Module {math_module}", "question_number": str(math_number),
            "passage": passage, "question": question, "option_a": choices["A"],
            "option_b": choices["B"], "option_c": choices["C"], "option_d": choices["D"],
            "correct_answer": "", "topic": "Math", "has_image": "False", "image_url": "",
            "page": str(page_index),
            }
            math_rows.append(row)
        else:
            # Grid-in pages do not show answer choices.  The decorative question
            # number is often merged with a watermark, so sequence is canonical.
            _, question = split_stem(text)
            open_rows.append({
                "id": str(len(open_rows) + 1), "source": options.source,
                "test_period": options.period, "test_version": options.version,
                "module": f"Math Module {math_module}", "question_number": str(math_number),
                "passage": "", "question": question, "correct_answer": "", "topic": "Math",
                "has_image": "False", "image_url": "", "page": str(page_index),
            })
    write_csv(output / "ebrw_mcq.csv", MCQ_FIELDS, rw_rows)
    write_csv(output / "math_mcq.csv", MCQ_FIELDS, math_rows)
    write_csv(output / "math_open.csv", OPEN_FIELDS, open_rows)
    (output / "text_layer_rejected.txt").write_text("\n".join(rejected) + "\n", encoding="utf-8")
    print(f"RW={len(rw_rows)} Math MCQ={len(math_rows)} Math open={len(open_rows)} rejected_pages={len(rejected)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
