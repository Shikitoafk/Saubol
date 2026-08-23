#!/usr/bin/env python3
"""Cache local OCR text for scan-only SAT PDFs.

No question page leaves the computer.  The cache makes it possible to audit
and repair a scan without repeatedly spending an external vision-model quota.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pymupdf
from rapidocr_onnxruntime import RapidOCR


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--scale", type=float, default=1.45)
    options = parser.parse_args()
    document = pymupdf.open(options.pdf)
    options.output.mkdir(parents=True, exist_ok=True)
    ocr = RapidOCR()
    for index, page in enumerate(document, start=1):
        target = options.output / f"page-{index:03}.txt"
        if (
            target.exists()
            and target.stat().st_size > 30
            and target.with_suffix(".json").exists()
        ):
            continue
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(options.scale, options.scale), alpha=False)
        result, _ = ocr(pixmap.tobytes("png"))
        text = "\n".join(item[1] for item in result or [])
        target.write_text(text + "\n", encoding="utf-8")
        positions = [
            {"x": round(item[0][0][0]), "y": round(item[0][0][1]), "text": item[1]}
            for item in result or []
        ]
        target.with_suffix(".json").write_text(
            json.dumps({"width": pixmap.width, "height": pixmap.height, "lines": positions}, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"OCR {index}/{len(document)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
