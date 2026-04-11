#!/usr/bin/env python3
"""Generate Cambridge IELTS Academic Reading.html / Listening.html shells."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "public" / "tests" / "cambridge"
BOOKS = list(range(19, 9, -1))  # 19 down to 10
TESTS = [1, 2, 3, 4]


def reading_html(book: int, test: int) -> str:
    q1 = "\n          ".join(
        f'<div class="q">Q{i}</div>' for i in range(1, 14)
    )
    q2 = "\n          ".join(
        f'<div class="q">Q{i}</div>' for i in range(14, 27)
    )
    q3 = "\n          ".join(
        f'<div class="q">Q{i}</div>' for i in range(27, 41)
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cambridge IELTS {book} Academic — Reading — Test {test}</title>
  <style>
    :root {{
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --primary: #2563eb;
      --primary-soft: #dbeafe;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 16px;
      padding-bottom: 48px;
    }}
    .bar {{
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }}
    .bar h1 {{ font-size: 1rem; font-weight: 600; }}
    .meta {{ display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.875rem; color: var(--muted); }}
    .pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: #1e40af;
      font-weight: 600;
      font-size: 0.75rem;
    }}
    .wrap {{ max-width: 960px; margin: 0 auto; padding: 24px 20px 0; }}
    .hint {{
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.875rem;
      margin-bottom: 24px;
    }}
    .passage {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 20px 8px;
      margin-bottom: 20px;
    }}
    .passage h2 {{
      font-size: 1.1rem;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .passage h2 span {{
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .passage .body {{
      color: var(--muted);
      font-size: 0.9375rem;
      margin-bottom: 16px;
      white-space: pre-wrap;
    }}
    .q-block {{
      border-top: 1px solid var(--border);
      padding: 16px 0;
    }}
    .q-block h3 {{ font-size: 0.875rem; margin-bottom: 10px; color: var(--text); }}
    .q-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
    }}
    .q {{
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.8125rem;
      color: var(--muted);
      background: #f1f5f9;
    }}
    footer {{
      max-width: 960px;
      margin: 32px auto 0;
      padding: 0 20px;
      font-size: 0.8125rem;
      color: var(--muted);
    }}
  </style>
</head>
<body>
  <div class="bar">
    <h1>Cambridge IELTS {book} Academic — Reading — Test {test}</h1>
    <div class="meta">
      <span class="pill">60 minutes</span>
      <span>40 questions</span>
    </div>
  </div>
  <div class="wrap">
    <p class="hint">
      This page is a timed practice shell (three passages, 40 questions). Add your licensed Cambridge IELTS {book} Academic reading passages and questions here, or use it alongside the official book.
    </p>

    <section class="passage">
      <h2><span>Passage 1</span> Reading passage</h2>
      <div class="body">[ Passage text — Questions 1–13 ]</div>
      <div class="q-block">
        <h3>Questions 1–13</h3>
        <div class="q-grid">
          {q1}
        </div>
      </div>
    </section>

    <section class="passage">
      <h2><span>Passage 2</span> Reading passage</h2>
      <div class="body">[ Passage text — Questions 14–26 ]</div>
      <div class="q-block">
        <h3>Questions 14–26</h3>
        <div class="q-grid">
          {q2}
        </div>
      </div>
    </section>

    <section class="passage">
      <h2><span>Passage 3</span> Reading passage</h2>
      <div class="body">[ Passage text — Questions 27–40 ]</div>
      <div class="q-block">
        <h3>Questions 27–40</h3>
        <div class="q-grid">
          {q3}
        </div>
      </div>
    </section>
  </div>
  <footer>Saubol — layout matches academic reading sections (1–13, 14–26, 27–40). No login required.</footer>
</body>
</html>
"""


def listening_section(label: str, start: int, end: int) -> str:
    qs = "\n          ".join(f'<div class="q">Q{i}</div>' for i in range(start, end + 1))
    return f"""    <section class="part">
      <h2><span>{label}</span> Listen and answer questions {start}–{end}</h2>
      <div class="audio-row">
        <span class="pill">Audio</span>
        <span class="muted">Add MP3 or embed from your licensed materials.</span>
      </div>
      <div class="q-block">
        <div class="q-grid">
          {qs}
        </div>
      </div>
    </section>"""


def listening_html(book: int, test: int) -> str:
    sections = "\n\n".join(
        [
            listening_section("Section 1", 1, 10),
            listening_section("Section 2", 11, 20),
            listening_section("Section 3", 21, 30),
            listening_section("Section 4", 31, 40),
        ]
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cambridge IELTS {book} Academic — Listening — Test {test}</title>
  <style>
    :root {{
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --primary: #2563eb;
      --primary-soft: #dbeafe;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 16px;
      padding-bottom: 48px;
    }}
    .bar {{
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }}
    .bar h1 {{ font-size: 1rem; font-weight: 600; }}
    .meta {{ display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.875rem; color: var(--muted); }}
    .pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: #1e40af;
      font-weight: 600;
      font-size: 0.75rem;
    }}
    .wrap {{ max-width: 960px; margin: 0 auto; padding: 24px 20px 0; }}
    .hint {{
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.875rem;
      margin-bottom: 24px;
    }}
    .part {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }}
    .part h2 {{
      font-size: 1.05rem;
      margin-bottom: 12px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }}
    .part h2 span {{
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .audio-row {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      font-size: 0.875rem;
    }}
    .audio-row .muted {{ color: var(--muted); }}
    .q-block {{ border-top: 1px solid var(--border); padding-top: 14px; }}
    .q-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
    }}
    .q {{
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.8125rem;
      color: var(--muted);
      background: #f1f5f9;
    }}
    footer {{
      max-width: 960px;
      margin: 32px auto 0;
      padding: 0 20px;
      font-size: 0.8125rem;
      color: var(--muted);
    }}
  </style>
</head>
<body>
  <div class="bar">
    <h1>Cambridge IELTS {book} Academic — Listening — Test {test}</h1>
    <div class="meta">
      <span class="pill">~30 minutes audio</span>
      <span>40 questions</span>
    </div>
  </div>
  <div class="wrap">
    <p class="hint">
      Four sections, ten questions each (1–40). Add instructions, transcripts, and audio from your licensed Cambridge IELTS {book} Academic materials.
    </p>

{sections}
  </div>
  <footer>Saubol — listening shell (sections 1–4). No login required.</footer>
</body>
</html>
"""


def main() -> None:
    count = 0
    for book in BOOKS:
        for test in TESTS:
            d = BASE / f"cambridge-ielts-{book}-academic" / f"test-{test}"
            d.mkdir(parents=True, exist_ok=True)
            (d / "Reading.html").write_text(reading_html(book, test), encoding="utf-8")
            (d / "Listening.html").write_text(listening_html(book, test), encoding="utf-8")
            count += 2
    print(f"Wrote {count} files under {BASE}")


if __name__ == "__main__":
    main()
