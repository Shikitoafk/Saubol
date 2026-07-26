"""Ручной режим картинок: парсер говорит, какие скрины нужны.

Координаты рисунка модель называет на глаз и промахивается в обе стороны —
то срежет половину таблицы, то захватит лишнее. Поэтому есть режим, в
котором скрипт ничего не режет, а составляет список: какой вопрос, на какой
странице, и под каким именем положить скрин. Имя проставляется в CSV сразу,
так что после раскладки файлов ничего править не нужно.
"""
import csv, json, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fitz, sat_parser_gemini as sp

FAILED = False


def check(cond, label):
    global FAILED
    print(("  OK   " if cond else "  FAIL ") + label)
    if not cond:
        FAILED = True


# 12 вопросов по 2 на страницу; у каждого третьего есть рисунок, причём у
# части из них модель не смогла назвать координаты (bbox = null).
TOTAL, PER_PAGE = 12, 2
PLAN = [{"number": n,
         "has_image": n % 3 == 0,
         "bbox": [0.2, 0.3, 0.7, 0.6] if n % 6 == 0 else None}
        for n in range(1, TOTAL + 1)]
PAGES = [PLAN[i:i + PER_PAGE] for i in range(0, TOTAL, PER_PAGE)]
WITH_IMAGE = [item["number"] for item in PLAN if item["has_image"]]

root = Path(__file__).parent / "manual_e2e"
shutil.rmtree(root, ignore_errors=True)
pdfs, out, img_dir = root / "March 2026", root / "out", root / "img"
pdfs.mkdir(parents=True)

doc = fitz.open()
for page_items in PAGES:
    page = doc.new_page()
    for i, item in enumerate(page_items):
        page.insert_text((60, 90 + i * 260), f"{item['number']}. Question", fontsize=11)
doc.save(pdfs / "IntA.pdf")
doc.close()


class Backend(sp.GeminiBackend):
    name = "fake"

    def generate(self, model, parts, timeout, schema):
        pages = [int(p["data"].rsplit(b"#PAGE:", 1)[1])
                 for p in parts if isinstance(p, dict)]
        if any(isinstance(p, str) and "just count" in p for p in parts):
            return json.dumps({"questions_on_page": PER_PAGE})
        rows = []
        for local, page_number in enumerate(pages):
            for item in PAGES[page_number - 1]:
                rows.append({
                    "type": "MATH_MCQ", "question_number": item["number"],
                    "module": "Module 1", "module_total": TOTAL,
                    "passage": "", "question": f"Question {item['number']} about a table",
                    "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                    "correct_answer": "A", "topic": "Algebra", "page_index": local,
                    "has_image": item["has_image"], "image_bbox": item["bbox"],
                })
        return json.dumps(rows)


_real = sp.render_page


def marked(doc, index, *a, **kw):
    page_image = _real(doc, index, *a, **kw)
    page_image.jpeg += f"#PAGE:{index + 1}".encode()
    return page_image


sp.render_page = marked
sp.build_backend = lambda *a, **k: Backend()

sys.argv = ["p", "--folder", str(root), "--output", str(out), "--no-upload",
            "--manual-images", "--images-dir", str(img_dir), "--delay", "0"]
sp.main()

rows = list(csv.DictReader(open(out / "math_mcq.csv", encoding="utf-8")))
todo = list(csv.DictReader(open(out / "images_todo.csv", encoding="utf-8")))

print(f"\nвопросов {len(rows)}, из них с картинками {len(WITH_IMAGE)}, "
      f"в списке {len(todo)}")

check(len(rows) == TOTAL, f"все {TOTAL} вопросов на месте (получено {len(rows)})")
check(sorted(int(r["question_number"]) for r in todo) == WITH_IMAGE,
      f"в списке ровно вопросы с рисунками: {[r['question_number'] for r in todo]}")

# Вопрос с рисунком, но без координат, тоже должен попасть в список: раньше
# has_image сбрасывался в False и такой вопрос молча исчезал.
no_bbox = [item["number"] for item in PLAN if item["has_image"] and not item["bbox"]]
check(set(no_bbox) <= {int(r["question_number"]) for r in todo},
      f"вопросы с рисунком, но без координат, тоже в списке: {no_bbox}")

# Имя файла в CSV и в списке — одно и то же, и оно осмысленное.
by_number = {int(r["question_number"]): r for r in rows}
mismatch = [r["question_number"] for r in todo
            if by_number[int(r["question_number"])]["image_url"] != r["file"]]
check(not mismatch, f"имя файла в CSV совпадает со списком (расходятся: {mismatch})")

sample = todo[0]
folder = sp.SUBFOLDERS["MATH_MCQ"]
check(sample["file"].startswith(f"{folder}/") and sample["file"].endswith(".jpg"),
      f"файл лежит в папке по типу вопроса: {sample['file']}")
check(f"q{sample['question_number']}" in sample["file"]
      and f"p{int(sample['page']):02d}" in sample["file"],
      f"в имени есть страница и номер вопроса: {sample['file']}")
check(sample["question"] and sample["page"],
      "в списке есть текст вопроса и страница — чтобы найти его в PDF")

# Папки под скрины созданы заранее.
check((img_dir / folder).is_dir(), "папка для скринов создана заранее")

# Ничего не нарезано: в ручном режиме картинки не трогаем.
check(not list((img_dir / folder).glob("*.jpg")),
      "скрипт не положил своих кропов — их кладёт человек")

print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
