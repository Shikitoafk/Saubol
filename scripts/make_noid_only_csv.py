import csv
from pathlib import Path


SOURCES = [
    (
        Path(r"C:/Users/PC/Downloads/SAT_MCQ_import_full_safe.csv"),
        Path(r"C:/Users/PC/Downloads/SAT_MCQ_IMPORT_NO_ID_ONLY.csv"),
    ),
    (
        Path(r"C:/Users/PC/Downloads/SAT_Open_import_full_safe.csv"),
        Path(r"C:/Users/PC/Downloads/SAT_OPEN_IMPORT_NO_ID_ONLY.csv"),
    ),
]


def build_no_id_file(src: Path, dst: Path) -> None:
    if not src.exists():
        print(f"[skip] missing source: {src}")
        return

    with src.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        input_fields = reader.fieldnames or []
        output_fields = [x for x in input_fields if x.lower() != "id"]
        rows = list(reader)

    with dst.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=output_fields)
        writer.writeheader()
        for row in rows:
            row.pop("id", None)
            row.pop("ID", None)
            writer.writerow({k: row.get(k, "") for k in output_fields})

    print(f"[ok] {dst}")
    print(f"     columns: {', '.join(output_fields)}")


def main():
    for src, dst in SOURCES:
        build_no_id_file(src, dst)


if __name__ == "__main__":
    main()
