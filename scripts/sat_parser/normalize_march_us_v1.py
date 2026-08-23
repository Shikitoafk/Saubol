#!/usr/bin/env python3
"""Normalize the reviewed March 2025 US v1 Gemini draft using its answer key."""
from __future__ import annotations
import argparse, csv
from pathlib import Path

RW1='A D B B D B C B C B A A A D B B C B C B D D D D D C D'.split()
RW2='A C A D C A A D B B A A D C A A B B D D B B B B C A C'.split()
M1='B A A A A A 5980 46 B C C D 5.25 42 C 4/3 C A B 2 32.5 D'.split()
M2=['A','B','C','D','C','7/3','B','A','D','3/5','B','D','41 or 40','D','C','D','A','A','C','923','B','27']
SOURCE, PERIOD, VERSION = 'March 2025 US v1 @DSATuz', 'March 2025 - US v1', 'US v1'
CLEAN_IMAGES = {61: '/sat_images/math/march-2025-us-v1-p61-q5.svg', 68: '/sat_images/math/march-2025-us-v1-p68-q12.svg', 74: '/sat_images/math/march-2025-us-v1-p74-q18.svg', 77: '/sat_images/math/march-2025-us-v1-p77-q21.svg', 80: '/sat_images/math/march-2025-us-v1-p80-q2.svg', 83: '/sat_images/math/march-2025-us-v1-p83-q5.svg', 88: '/sat_images/math/march-2025-us-v1-p88-q10.svg', 89: '/sat_images/math/march-2025-us-v1-p89-q11.svg'}
RW_CLEAN_IMAGES = {14: '/sat_images/ebrw/march-2025-us-v1-p14-q14.svg', 37: '/sat_images/ebrw/march-2025-us-v1-p37-q9.svg', 39: '/sat_images/ebrw/march-2025-us-v1-p39-q11.svg'}

def read(p):
    with p.open(encoding='utf-8-sig', newline='') as f: return list(csv.DictReader(f)), csv.DictReader(open(p,encoding='utf-8-sig')).fieldnames
def write(p, fields, rows):
    with p.open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
def stamp(r): r.update(source=SOURCE,test_period=PERIOD,test_version=VERSION)
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('output',type=Path); root=ap.parse_args().output
    rows,fields=read(root/'ebrw_mcq.csv')
    for r in rows:
        stamp(r); m1=int(r['page'])<=28; r['module']='Reading and Writing Module 1' if m1 else 'Reading and Writing Module 2'; r['correct_answer']=(RW1 if m1 else RW2)[int(r['question_number'])-1]
        if int(r['page']) in RW_CLEAN_IMAGES: r['image_url'] = RW_CLEAN_IMAGES[int(r['page'])]
    write(root/'ebrw_mcq.csv',fields,rows)
    for name in ('math_mcq.csv','math_open.csv'):
        rows,fields=read(root/name)
        for r in rows:
            stamp(r); m1=int(r['page'])<=78; r['module']='Math Module 1' if m1 else 'Math Module 2'; r['correct_answer']=(M1 if m1 else M2)[int(r['question_number'])-1]
            if int(r['page']) in CLEAN_IMAGES: r['image_url'] = CLEAN_IMAGES[int(r['page'])]
        write(root/name,fields,rows)
if __name__=='__main__': main()
