#!/usr/bin/env python3
"""Generate Cambridge IELTS proxy wrapper pages (Reading / Listening) for books 10–19."""
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "tests" / "cambridge"
BOOKS = list(range(19, 9, -1))
TESTS = [1, 2, 3, 4]

WRAPPER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cambridge IELTS {book} — Test {test} {skill_label}</title>
  <style>
    *, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{ height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #f5f7fa; }}
    .topbar {{
      height: 48px;
      background: #fff;
      border-bottom: 2px solid #059669;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      gap: 12px;
    }}
    .back-btn {{
      font-size: 13px; font-weight: 600; color: #059669;
      text-decoration: none; padding: 5px 12px;
      border: 1px solid #05966944; border-radius: 6px;
      background: #05966912; white-space: nowrap;
      cursor: pointer; flex-shrink: 0;
    }}
    .back-btn:hover {{ opacity: .8; }}
    .title {{
      font-size: 14px; font-weight: 700; color: #1e293b;
      text-align: center; flex: 1;
    }}
    .spacer {{ width: 80px; flex-shrink: 0; }}
    .frame-wrap {{
      position: absolute;
      top: 48px; left: 0; right: 0; bottom: 0;
    }}
    iframe {{ width: 100%; height: 100%; border: none; }}
    .loading-msg {{
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px; color: #94a3b8; pointer-events: none;
    }}
  </style>
  <link rel="stylesheet" href="/tests/ielts-global.css">
</head>
<body>
  <div class="topbar">
    <a href="javascript:history.back()" class="back-btn">← Back</a>
    <div class="title">{icon} Cambridge IELTS {book} · Test {test} — {skill_label}</div>
    <div class="spacer"></div>
  </div>
  <div class="frame-wrap">
    <div class="loading-msg" id="loading">Loading test…</div>
    <iframe
      src="/api/test-proxy?url={proxy_url}"
      onload="document.getElementById('loading').style.display='none'"
      allowfullscreen
      title="Cambridge IELTS {book} Test {test} {skill_label}"
    ></iframe>
  </div>
</body>
</html>
"""


def engnovate_url(book: int, test: int, skill: str) -> str:
    if skill == "reading":
        path = f"https://engnovate.com/ielts-reading-tests/cambridge-ielts-{book}-academic-reading-test-{test}/"
    else:
        path = f"https://engnovate.com/ielts-listening-tests/cambridge-ielts-{book}-academic-listening-test-{test}/"
    return quote(path, safe="")


def main() -> None:
    count = 0
    for book in BOOKS:
        for test in TESTS:
            for skill, label, icon in (
                ("reading", "Reading", "📖"),
                ("listening", "Listening", "🎧"),
            ):
                dest = OUT / f"cambridge-{book}" / f"test-{test}" / f"{label}.html"
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(
                    WRAPPER.format(
                        book=book,
                        test=test,
                        skill_label=label,
                        icon=icon,
                        proxy_url=engnovate_url(book, test, skill),
                    ),
                    encoding="utf-8",
                )
                count += 1
    print(f"Wrote {count} proxy wrapper pages under {OUT}")


if __name__ == "__main__":
    main()
