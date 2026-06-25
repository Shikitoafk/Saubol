#!/usr/bin/env python3
"""Scan public/tests and generate standard wrappers + src/data/test-registry.ts."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public" / "tests"
STANDARD = PUBLIC / "standard"
OUT_TS = ROOT / "src" / "data" / "test-registry.ts"

SKILL_FILE = {
    "reading": "Reading.html",
    "listening": "Listening.html",
    "writing": "Writing.html",
}

WRAPPER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    *, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{ height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #f5f7fa; }}
    .topbar {{
      height: 48px; background: #fff; border-bottom: 2px solid #059669;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; gap: 12px;
    }}
    .back-btn {{
      font-size: 13px; font-weight: 600; color: #059669; text-decoration: none;
      padding: 5px 12px; border: 1px solid #05966944; border-radius: 6px;
      background: #05966912; white-space: nowrap; cursor: pointer; flex-shrink: 0;
    }}
    .title {{ font-size: 14px; font-weight: 700; color: #1e293b; text-align: center; flex: 1; }}
    .spacer {{ width: 80px; flex-shrink: 0; }}
    .frame-wrap {{ position: absolute; top: 48px; left: 0; right: 0; bottom: 0; }}
    iframe {{ width: 100%; height: 100%; border: none; }}
    .loading-msg {{
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 14px; color: #94a3b8; pointer-events: none;
    }}
  </style>
  <link rel="stylesheet" href="/tests/ielts-global.css">
</head>
<body>
  <div class="topbar">
    <a href="javascript:history.back()" class="back-btn">← Back</a>
    <div class="title">{bar_title}</div>
    <div class="spacer"></div>
  </div>
  <div class="frame-wrap">
    <div class="loading-msg" id="loading">Loading test…</div>
    <iframe src="{iframe_src}" onload="document.getElementById('loading').style.display='none'" allowfullscreen title="{title}"></iframe>
  </div>
</body>
</html>
"""

PROXY_WRAPPER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    *, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{ height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #f5f7fa; }}
    .topbar {{
      height: 48px; background: #fff; border-bottom: 2px solid #059669;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; gap: 12px;
    }}
    .back-btn {{
      font-size: 13px; font-weight: 600; color: #059669; text-decoration: none;
      padding: 5px 12px; border: 1px solid #05966944; border-radius: 6px;
      background: #05966912; white-space: nowrap; cursor: pointer; flex-shrink: 0;
    }}
    .title {{ font-size: 14px; font-weight: 700; color: #1e293b; text-align: center; flex: 1; }}
    .spacer {{ width: 80px; flex-shrink: 0; }}
    .frame-wrap {{ position: absolute; top: 48px; left: 0; right: 0; bottom: 0; }}
    iframe {{ width: 100%; height: 100%; border: none; }}
    .loading-msg {{
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 14px; color: #94a3b8; pointer-events: none;
    }}
  </style>
  <link rel="stylesheet" href="/tests/ielts-global.css">
</head>
<body>
  <div class="topbar">
    <a href="javascript:history.back()" class="back-btn">← Back</a>
    <div class="title">{bar_title}</div>
    <div class="spacer"></div>
  </div>
  <div class="frame-wrap">
    <div class="loading-msg" id="loading">Loading test…</div>
    <iframe src="/api/test-proxy?url={proxy_url}" onload="document.getElementById('loading').style.display='none'" allowfullscreen title="{title}"></iframe>
  </div>
</body>
</html>
"""


def title_case(key: str) -> str:
    return key.replace("-", " ").replace("_", " ").title()


def write_wrapper(dest: Path, *, title: str, bar_title: str, iframe_src: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        WRAPPER.format(title=title, bar_title=bar_title, iframe_src=iframe_src),
        encoding="utf-8",
    )


def engnovate_url(book: int, test: int, skill: str) -> str:
    if skill == "reading":
        path = f"https://engnovate.com/ielts-reading-tests/cambridge-ielts-{book}-academic-reading-test-{test}/"
    else:
        path = f"https://engnovate.com/ielts-listening-tests/cambridge-ielts-{book}-academic-listening-test-{test}/"
    return quote(path, safe="")


def add_entry(
    entries: list[dict],
    *,
    slug: str,
    kind: str,
    skill: str,
    title: str,
    asset_path: str,
    legacy_slugs: list[str] | None = None,
    book: int | None = None,
    test_num: int | None = None,
    questions: int = 40,
    time_minutes: int = 60,
    difficulty: str = "Hard",
    topic: str = "",
) -> None:
    entries.append(
        {
            "slug": slug,
            "kind": kind,
            "skill": skill,
            "title": title,
            "topic": topic or title,
            "assetPath": asset_path,
            "legacySlugs": legacy_slugs or [],
            "book": book,
            "testNum": test_num,
            "questions": questions,
            "timeMinutes": time_minutes,
            "difficulty": difficulty,
        }
    )


def main() -> None:
    entries: list[dict] = []

    # --- Cambridge (books 10–19) — standard wrappers with engnovate proxy ---
    for book in range(19, 9, -1):
        for test_num in range(1, 5):
            for skill in ("reading", "listening"):
                slug = f"cambridge-{book}-test-{test_num}-{skill}"
                skill_file = SKILL_FILE[skill]
                asset = f"/tests/standard/cambridge/{book}/test-{test_num}/{skill_file}"
                dest = STANDARD / "cambridge" / str(book) / f"test-{test_num}" / skill_file
                dest.parent.mkdir(parents=True, exist_ok=True)
                icon = "📖" if skill == "reading" else "🎧"
                label = skill.capitalize()
                dest.write_text(
                    PROXY_WRAPPER.format(
                        title=f"Cambridge IELTS {book} — Test {test_num} {label}",
                        bar_title=f"{icon} Cambridge IELTS {book} · Test {test_num} — {label}",
                        proxy_url=engnovate_url(book, test_num, skill),
                    ),
                    encoding="utf-8",
                )
                add_entry(
                    entries,
                    slug=slug,
                    kind="cambridge",
                    skill=skill,
                    title=f"Cambridge IELTS {book} Test {test_num}",
                    asset_path=asset,
                    legacy_slugs=[f"cambridge-ielts-{book}-academic-test-{test_num}-{skill}"],
                    book=book,
                    test_num=test_num,
                    questions=40,
                    time_minutes=60 if skill == "reading" else 40,
                )

            # Writing only where legacy file exists (book 16)
            writing_src = PUBLIC / "cambridge" / f"cambridge-{book}" / f"test-{test_num}" / "Writing.html"
            if writing_src.exists():
                slug = f"cambridge-{book}-test-{test_num}-writing"
                asset = f"/tests/standard/mock-writing/cambridge-{book}/test-{test_num}/Writing.html"
                dest = STANDARD / "mock-writing" / f"cambridge-{book}" / f"test-{test_num}" / "Writing.html"
                write_wrapper(
                    dest,
                    title=f"Cambridge IELTS {book} Test {test_num} Writing",
                    bar_title=f"✍️ Cambridge IELTS {book} · Test {test_num} — Writing",
                    iframe_src=f"/tests/cambridge/cambridge-{book}/test-{test_num}/Writing.html",
                )
                add_entry(
                    entries,
                    slug=slug,
                    kind="cambridge",
                    skill="writing",
                    title=f"Cambridge IELTS {book} Test {test_num} Writing",
                    asset_path=asset,
                    book=book,
                    test_num=test_num,
                    questions=2,
                    time_minutes=60,
                    difficulty="Medium",
                )

    # --- Reading predictions (CDI) ---
    reading_dir = PUBLIC / "reading-predictions"
    for html in sorted(reading_dir.glob("*.html")):
        file_key = html.stem
        slug = f"pred-reading-{file_key}"
        asset = f"/tests/standard/prediction/reading/{file_key}/Reading.html"
        dest = STANDARD / "prediction" / "reading" / file_key / "Reading.html"
        write_wrapper(
            dest,
            title=f"IELTS Reading — {title_case(file_key)}",
            bar_title=f"📖 Reading · {title_case(file_key)}",
            iframe_src=f"/tests/reading-predictions/{file_key}.html",
        )
        legacy = [file_key]
        if re.fullmatch(r"reading-\d+", file_key):
            legacy.append(file_key)
        add_entry(
            entries,
            slug=slug,
            kind="prediction",
            skill="reading",
            title=title_case(file_key),
            topic="Academic Reading",
            asset_path=asset,
            legacy_slugs=legacy,
            questions=13 if not file_key.startswith("practice") and not file_key.startswith("reading-") else 40,
            time_minutes=20 if "practice" not in file_key and not file_key.startswith("reading-") else 60,
            difficulty="Medium",
        )

    # --- Listening predictions (CDI) ---
    listening_dir = PUBLIC / "listening-predictions"
    for html in sorted(listening_dir.glob("*.html")):
        if html.name == "full-listening-base.html":
            continue
        file_key = html.stem
        slug = f"pred-listening-{file_key}"
        asset = f"/tests/standard/prediction/listening/{file_key}/Listening.html"
        dest = STANDARD / "prediction" / "listening" / file_key / "Listening.html"
        write_wrapper(
            dest,
            title=f"IELTS Listening — {title_case(file_key)}",
            bar_title=f"🎧 Listening · {title_case(file_key)}",
            iframe_src=f"/tests/listening-predictions/{file_key}.html",
        )
        add_entry(
            entries,
            slug=slug,
            kind="prediction",
            skill="listening",
            title=title_case(file_key),
            topic="Listening Practice",
            asset_path=asset,
            legacy_slugs=[file_key],
            questions=40,
            time_minutes=40,
            difficulty="Hard",
        )

    # --- Mock tests ---
    mock_root = PUBLIC / "mock-tests"
    for mock_dir in sorted(mock_root.glob("mock-*")):
        mock_id = mock_dir.name.replace("mock-", "")
        for skill, skill_file in SKILL_FILE.items():
            src = mock_dir / skill_file
            if not src.exists():
                continue
            slug = f"mock-{mock_id}-{skill}"
            asset = f"/tests/standard/mock/{mock_id}/{skill_file}"
            dest = STANDARD / "mock" / mock_id / skill_file
            write_wrapper(
                dest,
                title=f"Mock {mock_id} — {skill.capitalize()}",
                bar_title=f"Mock {mock_id} · {skill.capitalize()}",
                iframe_src=f"/tests/mock-tests/mock-{mock_id}/{skill_file}",
            )
            add_entry(
                entries,
                slug=slug,
                kind="mock",
                skill=skill,
                title=f"Mock Test {mock_id} {skill.capitalize()}",
                topic="Full Mock Exam",
                asset_path=asset,
                legacy_slugs=[slug],
                questions=40 if skill != "writing" else 2,
                time_minutes=60,
                difficulty="Hard",
            )

    # --- Speaking (React inline) ---
    speaking_topics = [
        ("Work & Study", "Easy"),
        ("Hometown & Culture", "Medium"),
        ("Artificial Intelligence", "Hard"),
        ("Environmental Protection", "Medium"),
        ("Leisure & Hobbies", "Easy"),
    ]
    for i, (topic, diff) in enumerate(speaking_topics, start=1):
        slug = f"speaking-topic-{i}"
        add_entry(
            entries,
            slug=slug,
            kind="speaking",
            skill="speaking",
            title=f"Speaking Topic {i}",
            topic=topic,
            asset_path="react-speaking",
            legacy_slugs=[slug],
            questions=3,
            time_minutes=15,
            difficulty=diff,
        )

    # --- SAT modules ---
    sat_root = PUBLIC / "sat"
    for section_dir in sorted(sat_root.iterdir()):
        if not section_dir.is_dir():
            continue
        section = section_dir.name.lower()
        for html in sorted(section_dir.glob("*.html")):
            file_key = html.stem
            slug = f"sat-{section}-{file_key}"
            asset = f"/tests/standard/sat/{section}/{file_key}/Module.html"
            dest = STANDARD / "sat" / section / file_key / "Module.html"
            write_wrapper(
                dest,
                title=f"SAT {section.upper()} — {file_key}",
                bar_title=f"SAT {section.upper()} · {file_key}",
                iframe_src=f"/tests/sat/{section}/{file_key}.html",
            )
            add_entry(
                entries,
                slug=slug,
                kind="sat",
                skill=section,
                title=file_key.replace("-", " ").upper(),
                topic=f"SAT {section.upper()} Module",
                asset_path=asset,
                legacy_slugs=[file_key],
                questions=27,
                time_minutes=32,
                difficulty="Hard",
            )

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(entries, indent=2)
    OUT_TS.write_text(
        f"""// AUTO-GENERATED by scripts/build_test_registry.py — do not edit manually.
export type TestKind = "cambridge" | "prediction" | "mock" | "speaking" | "sat";
export type TestSkill = "reading" | "listening" | "writing" | "speaking" | "rw" | "math";

export interface TestRegistryEntry {{
  slug: string;
  kind: TestKind;
  skill: TestSkill;
  title: string;
  topic: string;
  assetPath: string;
  legacySlugs: string[];
  book?: number;
  testNum?: number;
  questions: number;
  timeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
}}

export const TEST_REGISTRY: TestRegistryEntry[] = {payload};

const bySlug = new Map<string, TestRegistryEntry>();
const byLegacy = new Map<string, TestRegistryEntry>();

for (const entry of TEST_REGISTRY) {{
  bySlug.set(entry.slug, entry);
  for (const legacy of entry.legacySlugs) {{
    if (!byLegacy.has(legacy)) byLegacy.set(legacy, entry);
  }}
}}

export function resolveRegistryEntry(slug: string): TestRegistryEntry | undefined {{
  return bySlug.get(slug) ?? byLegacy.get(slug);
}}

export function getPredictionTests(skill: "reading" | "listening" | "writing" | "speaking"): TestRegistryEntry[] {{
  if (skill === "speaking") {{
    return TEST_REGISTRY.filter((t) => t.kind === "speaking");
  }}
  if (skill === "writing") {{
    return TEST_REGISTRY.filter((t) => t.kind === "mock" && t.skill === "writing");
  }}
  return TEST_REGISTRY.filter((t) => t.kind === "prediction" && t.skill === skill);
}}

export function getCambridgeBooks(): number[] {{
  const books = new Set<number>();
  for (const t of TEST_REGISTRY) {{
    if (t.kind === "cambridge" && t.book) books.add(t.book);
  }}
  return [...books].sort((a, b) => b - a);
}}

export function getCambridgeTests(book: number, skill: TestSkill): TestRegistryEntry[] {{
  return TEST_REGISTRY.filter(
    (t) => t.kind === "cambridge" && t.book === book && t.skill === skill && t.testNum,
  ).sort((a, b) => (a.testNum ?? 0) - (b.testNum ?? 0));
}}

export function getSatTests(): TestRegistryEntry[] {{
  return TEST_REGISTRY.filter((t) => t.kind === "sat");
}}
""",
        encoding="utf-8",
    )

    print(f"Generated {len(entries)} registry entries")
    print(f"Wrote {OUT_TS}")
    print(f"Standard wrappers under {STANDARD}")


if __name__ == "__main__":
    main()
