import csv
from pathlib import Path


FILES = [
    (
        Path(r"C:/Users/PC/Downloads/SAT_MCQ_import_full_safe.csv"),
        Path(r"C:/Users/PC/Downloads/SAT_MCQ_import_full_safe_noid.csv"),
    ),
    (
        Path(r"C:/Users/PC/Downloads/SAT_Open_import_full_safe.csv"),
        Path(r"C:/Users/PC/Downloads/SAT_Open_import_full_safe_noid.csv"),
    ),
]


def process(src: Path, dst: Path):
    if not src.exists():
        print(f"[skip] missing: {src}")
        return

    with src.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fields = [x for x in (reader.fieldnames or []) if x != "id"]
        rows = list(reader)

    with dst.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            r.pop("id", None)
            writer.writerow({k: r.get(k, "") for k in fields})

    print(f"[ok] {dst}")


def main():
    for src, dst in FILES:
        process(src, dst)


if __name__ == "__main__":
    main()
