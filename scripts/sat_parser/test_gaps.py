"""Сценарий «31 из 35»: модель пропускает часть вопросов на плотных страницах."""
import csv, json, re, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fitz, sat_parser_gemini as sp

FAILED = False
def check(cond, label):
    global FAILED
    print(("  OK   " if cond else "  FAIL ") + label)
    if not cond: FAILED = True

# --- логика поиска дырок ---
def seen(numbers, qtype="EBRW_MCQ", per_page=3, label=""):
    return [sp.Sighting(n, (n - 1) // per_page, qtype, label) for n in numbers]


def numbers_of(plans):
    return sorted({n for ns, _ in plans for n in ns})


# Нет №5, найдено до №10. Нумерация оборвалась далеко от штатных 27, и ничто
# в файле не говорит, что это модуль полного теста: выпрашивать номера
# 11-27 не за что — страницы без вопросов подберёт постраничный добор.
plans = sp.find_number_gaps(seen([1, 2, 3, 4, 6, 7, 8, 9, 10]), 12)
check(numbers_of(plans) == [5], f"дырка №5 найдена, лишнего не выдумано: {numbers_of(plans)}")

tail = sp.find_number_gaps(seen(range(1, 26)), 12)        # 25 из 27
check(numbers_of(tail) == [26, 27], "хвост модуля (26, 27) добирается")

head = sp.find_number_gaps(seen(range(4, 28)), 12)        # нет №1-3
check(numbers_of(head) == [1, 2, 3], "пропущенное начало модуля тоже ищется")

full = sp.find_number_gaps(seen(range(1, 23), qtype="MATH_MCQ"), 12)
check(full == [], "полный матмодуль — дырок нет")

# Матмодуль: MATH_MCQ и MATH_OPEN — одна сквозная нумерация 1-22, а не два
# модуля по 22 вопроса.
mixed = seen(range(1, 17), qtype="MATH_MCQ") + seen(range(17, 23), qtype="MATH_OPEN")
check(sp.find_number_gaps(mixed, 12) == [],
      "MCQ и open в одном матмодуле считаются вместе")

# Два модуля подряд с одинаковой нумерацией: 1-27, затем снова 1-27.
two = (seen(range(1, 28)) +
       [sp.Sighting(n, 9 + (n - 1) // 3, "EBRW_MCQ", "") for n in range(1, 28)])
check([len(m.numbers) for m in sp.split_modules(two)] == [27, 27],
      "два модуля с одинаковыми номерами не склеиваются")
check(sp.find_number_gaps(two, 20) == [], "в двух полных модулях дырок нет")

# --- e2e: 3 вопроса на странице, модель отдаёт 2 ---
root = Path(__file__).parent / "gaps_e2e"
shutil.rmtree(root, ignore_errors=True)
pdfs, out = root / "June 2025", root / "out"
pdfs.mkdir(parents=True); out.mkdir(parents=True)
# Настоящий модуль Reading & Writing: 27 вопросов, по 3 на страницу.
doc = fitz.open()
for p in range(9):
    page = doc.new_page()
    for i in range(3):
        page.insert_text((72, 100 + i * 200), f"{p * 3 + i + 1}. Question", fontsize=12)
doc.save(pdfs / "US Version A.pdf"); doc.close()

def question(num, page_local):
    return {"type": "EBRW_MCQ", "question_number": num, "module": "Module 1",
            "question": f"Which choice completes the text of question {num}?",
            "options": {"A": "one", "B": "two", "C": "three", "D": "four"},
            "correct_answer": "A", "topic": "Reading & Writing", "page_index": page_local,
            "has_image": False, "image_bbox": None}

class LazyBackend(sp.GeminiBackend):
    """Отдаёт 3-й вопрос страницы только в прицельном доборе."""
    name = "lazy"
    def __init__(self): self.calls = 0; self.gap_calls = 0
    def generate(self, model, parts, timeout, schema):
        self.calls += 1
        gap = len(parts) > 1 and isinstance(parts[1], str) and "FOCUS PASS" in parts[1]
        images = [p for p in parts if isinstance(p, dict)]
        pages = [int(p["data"].rsplit(b"#PAGE:", 1)[1]) for p in images]
        if gap:
            self.gap_calls += 1
            wanted = {int(n) for n in re.findall(r"\d+", parts[1].split("numbered")[1].split(".")[0])}
            out = [question(n, i) for i, pg in enumerate(pages)
                   for n in ((pg - 1) * 3 + 1, (pg - 1) * 3 + 2, (pg - 1) * 3 + 3) if n in wanted]
            return json.dumps(out)
        # обычный проход: третий вопрос каждой страницы «не заметили»
        return json.dumps([question((pg - 1) * 3 + k, i)
                           for i, pg in enumerate(pages) for k in (1, 2)])

_real = sp.render_page
def marked(doc, index, *a, **kw):
    pi = _real(doc, index, *a, **kw); pi.jpeg += f"#PAGE:{index + 1}".encode(); return pi
sp.render_page = marked
sp.build_backend = lambda *a, **k: LazyBackend()

sys.argv = ["p", "--folder", str(root), "--output", str(out), "--batch", "3",
            "--overlap", "1", "--no-upload", "--delay", "0"]
sp.main()

rows = list(csv.DictReader(open(out / "ebrw_mcq.csv", encoding="utf-8")))
numbers = sorted(int(r["question_number"]) for r in rows)
check(numbers == list(range(1, 28)),
      f"собраны все 27 вопросов модуля, а не 18: получено {len(numbers)}")
check(len(numbers) == len(set(numbers)), "дубликатов нет")
check(not (out / "gaps_report.txt").exists(), "отчёт о дырках пуст — всё найдено")
print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
