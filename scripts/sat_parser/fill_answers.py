"""Проставляет ответы в готовые CSV по таблице-ключу из PDF.

У этих тестов ответы лежат не отдельным файлом, а таблицей на последней
странице того же PDF: колонки 文科M1 / 文科M2 (Reading & Writing, модули
1 и 2) и 数学M1 / 数学M2 (Math, модули 1 и 2), строки — номера вопросов.
Модули в ней разделены по колонкам, поэтому одинаковые номера из разных
модулей не путаются.

Перепарсивать ради ответов не нужно — скрипт работает с уже разобранными
CSV:

    python fill_answers.py --pdf "2023 Dec Int-A.pdf" --csv-dir ./out_v9

Что делает:
  * читает таблицу-ключ с последних страниц PDF (через Gemini);
  * раскидывает вопросы из CSV по модулям — той же логикой, что и парсер
    (по рестарту нумерации), потому что колонка module почти всегда пустая;
  * ставит correct_answer там, где он был пуст, и только при однозначном
    совпадении. Клетки с «题目有误» (вопрос с ошибкой) и пустые пропускает.

Ничего не угадывает: неправильный ответ хуже пустого.
"""
import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fitz  # noqa: E402
import sat_parser_gemini as sp  # noqa: E402


# Колонка ключа -> (family, индекс модуля). Family совпадает с sp.FAMILY.
COLUMN_TO_MODULE = {
    "rw_m1": ("EBRW", 1),
    "rw_m2": ("EBRW", 2),
    "math_m1": ("MATH", 1),
    "math_m2": ("MATH", 2),
}

ANSWER_GRID_PROMPT = r"""
This page is the ANSWER KEY of an SAT practice test, printed as a grid.

It can be printed in either of two layouts — handle BOTH:

A) A GRID / TABLE. A question-number column, then one answer column per
   module. Headers may be Chinese or English:
     文科M1 = Reading & Writing Module 1 -> "rw_m1"
     文科M2 = Reading & Writing Module 2 -> "rw_m2"
     数学M1 = Math Module 1              -> "math_m1"
     数学M2 = Math Module 2              -> "math_m2"
   (文科 = Reading & Writing, 数学 = Math, M1/M2 = module 1 / 2.)

B) TEXT LISTS grouped by module, e.g.:
     Section 1 M1 R & W
       Q1-10  AACCA BADDA
       Q11-20 DBBDA ADCCA
       Q21-27 CADCA CC
     Section 1 M2 Math
       Q1-10  CDABC DA 248 DD
       Q11-20 D 0.0029 76000 D 16 3 C A B
   Here "M1/M2 R & W" -> rw_m1/rw_m2, "M1/M2 Math" -> math_m1/math_m2.
   Each "Qa-b <answers>" line gives the answers for questions a..b in order.
   Letters are often grouped in fives just for readability (AACCA BADDA =
   A A C C A B A D D A). Math lines mix single letters with multi-digit
   grid-in numbers — read them by meaning: "DA 248 DD" is D, A, 248, D, D,
   and "D 0.0029 76000 D 16 3 C A B" is D, 0.0029, 76000, D, 16, 3, C, A, B.
   Use the count (a..b) to line the answers up correctly.

Whatever the layout, return ONLY a JSON array, ONE OBJECT PER QUESTION NUMBER:
{
  "number": 1,
  "rw_m1": "B",        // letter A-D for multiple choice, null if absent
  "rw_m2": "D",
  "math_m1": "248",    // the number itself for grid-in math answers
  "math_m2": "C"
}

RULES:
- Cover every number: Reading & Writing 1-27, Math 1-22. Math columns are
  empty for numbers 23-27 -> null.
- Empty / missing = null. A flawed question ("题目有误", "error", crossed
  out) = null. Never guess or pad.
- Transcribe exactly: a letter for multiple choice, the number for grid-in
  math answers (e.g. "14", "705.6", "-13", "0.0029").
- If the page holds no answer key at all, return [].
"""

ANSWER_GRID_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "number": {"type": "integer"},
            "rw_m1": {"type": "string", "nullable": True},
            "rw_m2": {"type": "string", "nullable": True},
            "math_m1": {"type": "string", "nullable": True},
            "math_m2": {"type": "string", "nullable": True},
        },
        "required": ["number"],
    },
}


def module_index_by_question(rows: list[dict], family: str) -> dict[tuple[int, int], int]:
    """(номер, страница) -> индекс модуля (1,2,…) внутри family.

    Использует ту же разбивку по рестарту нумерации, что и парсер, поэтому
    результат совпадает с тем, как модули показаны на сайте.
    """
    sightings = []
    for r in rows:
        qtype = r["_qtype"]
        if sp.FAMILY.get(qtype) != family:
            continue
        number = r["_number"]
        page = r["_page"]
        if number is None:
            continue
        sightings.append(sp.Sighting(number, page if page is not None else 0, qtype))

    modules = [m for m in sp.split_modules(sightings) if m.family == family]
    modules.sort(key=lambda m: m.first_page)

    mapping: dict[tuple[int, int], int] = {}
    for index, module in enumerate(modules, start=1):
        for number, page in module.numbers.items():
            mapping[(number, page)] = index
    return mapping


def read_answer_grid(pool, pdf: Path, tail_pages: int, debug_log) -> dict[tuple[str, int, int], str]:
    """Читает ключ с последних tail_pages страниц. -> {(family, mod, number): answer}."""
    answers: dict[tuple[str, int, int], str] = {}
    doc = fitz.open(pdf)
    try:
        start = max(0, len(doc) - tail_pages)
        for index in range(start, len(doc)):
            page = sp.render_page(doc, index)
            parts = [ANSWER_GRID_PROMPT, pool.backend.image_part(page.jpeg)]
            rows, _ = sp.ask_model_json(pool, parts, ANSWER_GRID_SCHEMA,
                                        f"{pdf.name} ключ стр.{index + 1}", debug_log)
            for row in rows or []:
                try:
                    number = int(row.get("number"))
                except (TypeError, ValueError):
                    continue
                for column, (family, mod) in COLUMN_TO_MODULE.items():
                    value = sp.clean_text(row.get(column))
                    if value and value.lower() not in ("null", "none", "-", "—"):
                        answers[(family, mod, number)] = value
    finally:
        doc.close()
    return answers


def load_rows(csv_dir: Path):
    """Читает три CSV. -> {qtype: (path, fieldnames, rows)}."""
    tables = {}
    for qtype, name in sp.CSV_NAMES.items():
        path = csv_dir / name
        if not path.exists():
            continue
        with open(path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            rows = list(reader)
            fields = reader.fieldnames or sp.CSV_FIELDS[qtype]
        for r in rows:
            num = (r.get("question_number") or "").strip()
            page = (r.get("page") or "").strip()
            r["_qtype"] = qtype
            r["_number"] = int(num) if num.isdigit() else None
            r["_page"] = (int(page) - 1) if page.isdigit() else None
        tables[qtype] = (path, fields, rows)
    return tables


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Проставить ответы в CSV по таблице-ключу из PDF.")
    ap.add_argument("--pdf", required=True, help="PDF теста, в конце которого таблица-ключ")
    ap.add_argument("--csv-dir", required=True, help="папка с ebrw_mcq.csv / math_mcq.csv / math_open.csv")
    ap.add_argument("--tail-pages", type=int, default=4, help="сколько последних страниц смотреть")
    ap.add_argument("--models", default="", help="список моделей через запятую")
    ap.add_argument("--sdk", choices=("auto", "new", "legacy"), default="auto")
    ap.add_argument("--overwrite", action="store_true",
                    help="перезаписывать даже непустой correct_answer")
    ap.add_argument("--dry-run", action="store_true", help="не писать CSV, только показать")
    args = ap.parse_args()

    pdf = Path(args.pdf).expanduser()
    csv_dir = Path(args.csv_dir).expanduser()
    if not pdf.exists():
        print(f"нет PDF: {pdf}"); return 2
    if not csv_dir.is_dir():
        print(f"нет папки: {csv_dir}"); return 2

    sp.load_dotenv([Path.cwd() / ".env", Path(__file__).resolve().parent / ".env"])
    api_key = sp.env_any("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key:
        print("нет GEMINI_API_KEY — задай в окружении или .env"); return 2

    tables = load_rows(csv_dir)
    if not tables:
        print(f"в {csv_dir} нет CSV парсера"); return 1
    all_rows = [r for _, _, rows in tables.values() for r in rows]

    models = [m.strip() for m in args.models.split(",") if m.strip()] or sp.DEFAULT_MODEL_ROTATION
    pool = sp.ModelPool(sp.build_backend(api_key, args.sdk), models)
    debug_log = csv_dir / "answer_key_debug.log"

    answers = read_answer_grid(pool, pdf, args.tail_pages, debug_log)
    if not answers:
        print("ключ не распознан — проверь, что в конце PDF действительно таблица ответов")
        return 1
    print(f"из ключа прочитано ответов: {len(answers)}")

    mod_index = {fam: module_index_by_question(all_rows, fam) for fam in ("EBRW", "MATH")}

    filled = skipped = missing = conflicts = agree = 0
    conflict_examples: list[str] = []
    for qtype, (path, fields, rows) in tables.items():
        family = sp.FAMILY.get(qtype)
        for r in rows:
            number, page = r["_number"], r["_page"]
            if number is None or page is None:
                continue
            index = mod_index[family].get((number, page))
            if index is None:
                continue
            answer = answers.get((family, index, number))
            if not answer:
                missing += 1
                continue
            existing = (r.get("correct_answer") or "").strip()
            if existing:
                # Сверяем то, что модель проставила при разборе, с ключом.
                # Нормализуем к букве/тексту, чтобы "b" и "B" не считались разными.
                same = sp.normalize_answer(existing, qtype, {}) == \
                       sp.normalize_answer(answer, qtype, {})
                if same:
                    agree += 1
                else:
                    conflicts += 1
                    if len(conflict_examples) < 12:
                        conflict_examples.append(
                            f"{family} M{index} №{number}: было '{existing}', в ключе '{answer}'")
                if not args.overwrite:
                    skipped += 1
                    continue
            r["correct_answer"] = answer
            filled += 1

        if not args.dry_run:
            with open(path, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows)

    print(f"проставлено: {filled}, уже были: {skipped}, "
          f"без ответа в ключе: {missing}")
    print(f"из уже стоявших: совпало с ключом {agree}, "
          f"РАСХОДИТСЯ {conflicts}")
    if conflict_examples:
        print("примеры расхождений (ключу верить, разбору — нет):")
        for line in conflict_examples:
            print(f"   {line}")
        if not args.overwrite:
            print("-> запусти с --overwrite, чтобы везде поставить ответы из ключа")
    if args.dry_run:
        print("(--dry-run: файлы не изменены)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
