#!/usr/bin/env python3
"""Normalize the reviewed November real SAT Gemini draft using the PDF answer key."""
from __future__ import annotations
import argparse, csv
from pathlib import Path

RW1 = 'B C B B C B D C A A A A C B D A D C D C A A B C D C B'.split()
RW2 = 'A A A A A B A D A A A C A A B B A B B A A A A B C A D'.split()
M1 = 'B B C A A 9.5 A 139 C B D 12 B D 17 1.5 D D C 233 D A'.split()
M2 = 'D A D A C A D 14 B D 27 B 3 C B A 4.232 C 6.25 A A 288'.split()
SOURCE, PERIOD, VERSION = 'November Real SAT @DSATuz', 'November 2023 - Real', 'Real'
RW_IMAGES = {12: '/sat_images/ebrw/november-real-p12-q12.svg', 13: '/sat_images/ebrw/november-real-p13-q13.svg', 38: '/sat_images/ebrw/november-real-p38-q11.svg', 40: '/sat_images/ebrw/november-real-p40-q13.svg'}
MATH_IMAGES = {63: '/sat_images/math/november-real-p63-q9.svg', 64: '/sat_images/math/november-real-p64-q10.svg', 65: '/sat_images/math/november-real-p65-q11.svg', 67: '/sat_images/math/november-real-p67-q13.svg', 77: '/sat_images/math/november-real-p77-q1.svg', 79: '/sat_images/math/november-real-p80-q3.svg', 83: '/sat_images/math/november-real-p83-q6.svg', 84: '/sat_images/math/november-real-p84-q7.svg', 88: '/sat_images/math/november-real-p88-q11.svg'}

def load(path: Path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f)), csv.DictReader(path.open(encoding='utf-8-sig')).fieldnames

def save(path: Path, fields, rows):
    with path.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)

def valid_rows(rows):
    seen = set()
    for row in rows:
        if not (row.get('page') or '').isdigit() or not (row.get('question_number') or '').isdigit():
            continue
        key = (row['page'], row['question_number'])
        if key in seen:
            continue
        seen.add(key)
        yield row

def stamp(row, module, answers):
    row.update(source=SOURCE, test_period=PERIOD, test_version=VERSION, module=module)
    row['correct_answer'] = answers[int(row['question_number']) - 1]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('output', type=Path); root = ap.parse_args().output
    rows, fields = load(root / 'ebrw_mcq.csv')
    out = []
    for row in valid_rows(rows):
        first = int(row['page']) <= 27
        stamp(row, 'Reading and Writing Module 1' if first else 'Reading and Writing Module 2', RW1 if first else RW2)
        if int(row['page']) in RW_IMAGES: row['image_url'] = RW_IMAGES[int(row['page'])]
        out.append(row)
    save(root / 'ebrw_mcq.csv', fields, out)
    for name in ('math_mcq.csv', 'math_open.csv'):
        rows, fields = load(root / name); out = []
        for row in valid_rows(rows):
            first = int(row['page']) <= 76
            stamp(row, 'Math Module 1' if first else 'Math Module 2', M1 if first else M2)
            if int(row['page']) in MATH_IMAGES: row['image_url'] = MATH_IMAGES[int(row['page'])]
            out.append(row)
        save(root / name, fields, out)
    # Question 3 in Math module 2 spans pages 79-80. Gemini mistakenly emits
    # the page-80 table as a second grid-in question; attach it to the MCQ.
    mcq, mcq_fields = load(root / 'math_mcq.csv')
    opened, open_fields = load(root / 'math_open.csv')
    continuation = next((r for r in opened if r['page'] == '80' and r['question_number'] == '3'), None)
    if continuation:
        for row in mcq:
            if row['page'] == '79' and row['question_number'] == '3':
                row['has_image'], row['image_url'] = 'True', continuation['image_url']
        opened = [r for r in opened if r is not continuation]
    save(root / 'math_mcq.csv', mcq_fields, mcq)
    save(root / 'math_open.csv', open_fields, opened)

if __name__ == '__main__': main()
