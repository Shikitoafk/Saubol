"""Convert the user-supplied, viewable program sheet into a static site catalog.

Usage: python scripts/import_program_sheet.py input.xlsx output.json
This is a mechanical import. It does not verify current program availability.
"""

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from openpyxl import load_workbook


SOURCE_URL = "https://docs.google.com/spreadsheets/d/1QPzpKsXbK-9eqSoHLQXjzAfHySQiE251t1j-gEoMpMM/edit?gid=0"


def clean(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\ufffd", "")).strip()


def main(source, destination):
    sheet = load_workbook(source, read_only=True, data_only=True).active
    entries = []
    seen = set()
    for row_number, row in enumerate(sheet.values, start=1):
        if row_number <= 2:
            continue
        name = clean(row[0] if len(row) > 0 else "")
        detail = clean(row[2] if len(row) > 2 else "")
        format_name = clean(row[5] if len(row) > 5 else "")
        state = clean(row[6] if len(row) > 6 else "")
        price = clean(row[7] if len(row) > 7 else "")
        subject = clean(row[8] if len(row) > 8 else "")
        url = clean(row[9] if len(row) > 9 else "")
        parsed = urlparse(url)
        if not name or not detail or parsed.scheme not in ("http", "https") or not parsed.netloc:
            continue
        key = (name.casefold(), detail.casefold(), url.rstrip("/").casefold())
        if key in seen:
            continue
        seen.add(key)
        entries.append({
            "id": f"sheet-1-{row_number}",
            "name": name,
            "details": detail,
            "format": format_name if format_name in ("Remote", "In-Person", "Both") else "Unknown",
            "location": state or "Not specified",
            "price": price if price in ("Free", "Paid") else "Unknown",
            "subject": subject or "Other",
            "url": url,
            "source": SOURCE_URL,
            "sourceRow": row_number,
        })
    Path(destination).write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(entries)} distinct linked programs")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
