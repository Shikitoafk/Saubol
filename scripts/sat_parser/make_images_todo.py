"""Собирает images_todo.csv из уже готовых CSV. Без запросов к модели.

Нужен, когда парсер отработал, а список записать не смог — например,
файл был открыт в Excel и Windows не дал его перезаписать. Перегонять
файл через модель заново ради одного списка незачем: в основных CSV уже
есть всё — колонка has_image говорит, у каких вопросов рисунок, а
image_url содержит имя, под которым нужно положить скрин.

    python make_images_todo.py ./out_v8

По умолчанию пишет images_todo.csv в ту же папку. Если и он занят —
возьмёт следующее свободное имя.
"""
import argparse
import csv
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from sat_parser_gemini import (CSV_FIELDS, CSV_NAMES, IMAGES_TODO_FIELDS,
                               SUBFOLDERS, free_path)

IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp")


def truthy(value: str) -> bool:
    return str(value).strip().lower() in ("true", "1", "yes", "да")


def with_ext(name: str, ext: str) -> str:
    """Меняет расширение у имени файла картинки, остальное не трогает."""
    lowered = name.lower()
    for known in IMAGE_EXTS:
        if lowered.endswith(known):
            return name[:-len(known)] + "." + ext
    return name


def retarget_csv(path: Path, qtype: str, ext: str) -> int:
    """Переписывает расширение в image_url. -> сколько строк поменялось."""
    with open(path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    changed = 0
    for row in rows:
        target = (row.get("image_url") or "").strip()
        if not target:
            continue
        updated = with_ext(target, ext)
        if updated != target:
            row["image_url"] = updated
            changed += 1
    if not changed:
        return 0

    # Пишем через временный файл: если Excel держит оригинал, лучше упасть
    # на переименовании, чем оставить CSV наполовину переписанным.
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS[qtype], extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    try:
        os.replace(tmp, path)
    except OSError:
        tmp.unlink(missing_ok=True)
        raise
    return changed


def collect(out_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for qtype, name in CSV_NAMES.items():
        path = out_dir / name
        if not path.exists():
            continue
        with open(path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                if not truthy(row.get("has_image", "")):
                    continue
                page = (row.get("page") or "").strip()
                target = (row.get("image_url") or "").strip()
                if not target:
                    # Кроп не делался и имя не проставлено — предложим своё,
                    # по тем же правилам, что и в --manual-images.
                    number = (row.get("question_number") or "").strip()
                    tag = f"q{number}" if number else f"n{row.get('id', '')}"
                    stem = f"{row.get('source', '')}_p{int(page or 0):02d}_{tag}"
                    stem = "".join(c if c.isalnum() else "_" for c in stem).strip("_")
                    target = f"{SUBFOLDERS[qtype]}/{stem}.png"
                rows.append({
                    "source": row.get("source", ""),
                    "page": int(page) if page.isdigit() else 0,
                    "module": row.get("module", ""),
                    "question_number": row.get("question_number", ""),
                    "type": qtype,
                    "file": target,
                    "question": (row.get("question") or "")[:120],
                })
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("output", help="папка с ebrw_mcq.csv / math_mcq.csv / math_open.csv")
    ap.add_argument("--into", default=None, help="куда писать (по умолчанию туда же)")
    ap.add_argument("--ext", default=None,
                    help="сменить расширение имён картинок, например png. "
                         "Меняется и в списке, и в колонке image_url основных CSV, "
                         "чтобы они не разъехались")
    args = ap.parse_args()

    out_dir = Path(args.output).expanduser()
    if not out_dir.is_dir():
        print(f"нет такой папки: {out_dir}")
        return 2

    ext = (args.ext or "").strip().lstrip(".").lower()
    if ext:
        for qtype, name in CSV_NAMES.items():
            path = out_dir / name
            if not path.exists():
                continue
            try:
                changed = retarget_csv(path, qtype, ext)
            except OSError as exc:
                print(f"не смог переписать {name}: {exc}\n"
                      f"Закрой файл в Excel и запусти ещё раз.")
                return 1
            if changed:
                print(f"{name}: расширение картинок -> .{ext} ({changed} строк)")

    rows = collect(out_dir)
    if not rows:
        print("вопросов с картинками не нашлось — проверь колонку has_image")
        return 1

    rows.sort(key=lambda r: (r["source"], r["page"], str(r["question_number"])))
    target = Path(args.into).expanduser() if args.into else out_dir / "images_todo.csv"

    for candidate in free_path(target):
        try:
            with open(candidate, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=IMAGES_TODO_FIELDS,
                                        extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows)
            print(f"вопросов с картинками: {len(rows)} -> {candidate}")
            return 0
        except OSError as exc:
            print(f"{candidate.name}: {exc}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
