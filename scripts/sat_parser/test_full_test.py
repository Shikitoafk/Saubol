"""Сценарий «98 из 98»: полный цифровой SAT одним файлом.

Модель здесь ИДЕАЛЬНАЯ — отдаёт все вопросы со всех показанных страниц,
с номерами. Всё, что не доехало до CSV, потеряно самим скриптом, а не Gemini.

Раскладка списана с настоящего файла (2026 March IntA, 36 страниц):

  Reading and Writing Module 1 — 27 вопросов
  Reading and Writing Module 2 — 27
  Math Module 1                — 22
  Math Module 2                — 22
                                 ---
                                  98

Три детали, на которых старый парсер и сыпался:

1. Формулировки повторяются ДОСЛОВНО. На стр. 18 оригинала вопросы 18, 19,
   20 и 21 — все «Which choice completes the text so that it conforms to the
   conventions of Standard English?». Различает их только passage.
2. Лейбл модуля напечатан лишь на заголовке модуля. На стр. 9 оригинала
   (вопросы 24-26) слова «Module» нет нигде — модель вернёт "".
3. Модуль кончается ПОСРЕДИ страницы: на стр. 27 оригинала после матвопроса
   №22 идёт заголовок «Math Module 2» и сразу вопрос №1. Нумерация
   рестартится на той же странице.
"""
import csv, json, re, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fitz, sat_parser_gemini as sp

FAILED = False


def check(cond, label):
    global FAILED
    print(("  OK   " if cond else "  FAIL ") + label)
    if not cond:
        FAILED = True


def question_at(number, page, passage, text="Which choice completes the text?"):
    return sp.Question(qtype="EBRW_MCQ", question=text, passage=passage,
                       options={"A": "one", "B": "two", "C": "three", "D": "four"},
                       number=number, page_index=page)


# --- единицы: вопрос через разворот не должен стать двумя строками ----------
# Вопрос начинается внизу листа, варианты ответа уходят на следующий. Соседние
# батчи называют «своей» разную страницу, а текст переписывают чуть по-разному
# — без допуска в одну страницу такой вопрос попадал в CSV дважды.
_tmp = Path(__file__).parent / "dedup_tmp"
shutil.rmtree(_tmp, ignore_errors=True)
_tmp.mkdir(parents=True)
_sink = sp.CsvSink(_tmp, resume=False)
_sink.write(question_at(12, 5, "Passage about bees"), "src", "", "", "")

check(_sink.is_duplicate(question_at(12, 6, "Passage about bees, continued"), "src"),
      "тот же номер на соседней странице — это один вопрос, а не два")
check(_sink.is_duplicate(question_at(12, 5, "Passage about bees"), "src"),
      "повтор из перекрытия батчей отсеивается")
check(not _sink.is_duplicate(question_at(12, 20, "Passage about tides"), "src"),
      "№12 другого модуля (через 15 страниц) сохраняется")
_sink.close()
shutil.rmtree(_tmp, ignore_errors=True)


MODULES = [
    ("Reading and Writing Module 1", "EBRW_MCQ", 27),
    ("Reading and Writing Module 2", "EBRW_MCQ", 27),
    ("Math Module 1", "MATH_MCQ", 22),
    ("Math Module 2", "MATH_MCQ", 22),
]
TOTAL = sum(n for _, _, n in MODULES)
PER_PAGE = 3

# Настоящие формулировки Reading & Writing — внутри модуля они повторяются
# слово в слово по многу раз.
EBRW_STEMS = [
    "Which choice completes the text with the most logical and precise word or phrase?",
    "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
]

# Плоский список всего теста. tag — уникальная метка вопроса, по ней в конце
# и считаем, что ничего не потерялось.
PLAN = []
for module_index, (label, qtype, count) in enumerate(MODULES):
    for number in range(1, count + 1):
        PLAN.append({"module_index": module_index, "label": label, "qtype": qtype,
                     "number": number, "tag": f"Q{len(PLAN) + 1:03d}",
                     "first_of_module": number == 1})

PAGES = [PLAN[i:i + PER_PAGE] for i in range(0, len(PLAN), PER_PAGE)]
TAGS = {item["tag"] for item in PLAN}


def as_model_output(item, page_local):
    """Вопрос так, как его вернула бы модель, глядя на страницу."""
    if item["qtype"] == "EBRW_MCQ":
        stem = EBRW_STEMS[item["number"] % len(EBRW_STEMS)]
        passage = (f"[{item['tag']}] Researchers studying the subject of passage "
                   f"{item['tag']} reported an unexpected result this year.")
        options = {"A": "persists", "B": "responds", "C": "arrives", "D": "agrees"}
        topic = "Reading & Writing"
    else:
        # Короткая матформулировка: у разных модулей совпадает дословно,
        # различаются только числа в вариантах ответа.
        stem = f"What is the value of $x$ in equation {item['number']}?"
        passage = f"[{item['tag']}]"
        options = {"A": f"${item['tag'][1:]}$", "B": "$7$", "C": "$32$", "D": "$40$"}
        topic = "Algebra"
    return {
        "type": item["qtype"], "question_number": item["number"],
        # Лейбл печатается только на заголовке модуля — дальше модель его не видит.
        "module": item["label"] if item["first_of_module"] else "",
        "passage": passage, "question": stem, "options": options,
        "correct_answer": "A", "topic": topic, "page_index": page_local,
        "has_image": False, "image_bbox": None,
    }


root = Path(__file__).parent / "full_e2e"
shutil.rmtree(root, ignore_errors=True)
pdfs, out = root / "March 2026", root / "out"
pdfs.mkdir(parents=True)
out.mkdir(parents=True)

doc = fitz.open()
for page_items in PAGES:
    page = doc.new_page()
    for i, item in enumerate(page_items):
        if item["first_of_module"]:
            page.insert_text((72, 80 + i * 200), item["label"], fontsize=14)
        page.insert_text((72, 100 + i * 200),
                         f"{item['number']}. {item['tag']}", fontsize=11)
doc.save(pdfs / "IntA EliteXSAT.pdf")
doc.close()


class PerfectBackend(sp.GeminiBackend):
    """Отдаёт ВСЕ вопросы со всех показанных страниц. Ничего не пропускает."""
    name = "perfect"

    def __init__(self):
        self.calls = 0

    def pages_of(self, parts):
        return [int(p["data"].rsplit(b"#PAGE:", 1)[1])
                for p in parts if isinstance(p, dict)]

    def generate(self, model, parts, timeout, schema):
        self.calls += 1
        rows = []
        for local, page_number in enumerate(self.pages_of(parts)):
            for item in PAGES[page_number - 1]:
                rows.append(as_model_output(item, local))
        return json.dumps(rows)


class LazyBackend(PerfectBackend):
    """Обычным проходом отдаёт лишь первые два вопроса страницы.

    Так ведёт себя настоящая модель на плотных листах: перечисляет сверху
    вниз и «выдыхается». Третий вопрос отдаёт только прицельному добору,
    который называет номера явно.
    """
    name = "lazy"

    def generate(self, model, parts, timeout, schema):
        self.calls += 1
        focus = next((p for p in parts
                      if isinstance(p, str) and "FOCUS PASS" in p), None)
        pages = self.pages_of(parts)
        rows = []
        for local, page_number in enumerate(pages):
            items = PAGES[page_number - 1]
            if focus:
                wanted = {int(n) for n in re.findall(r"\d+", focus.split("numbered")[1])}
                chosen = [it for it in items if it["number"] in wanted]
            else:
                chosen = items[:2]
            rows += [as_model_output(it, local) for it in chosen]
        return json.dumps(rows)


_real = sp.render_page


def marked(doc, index, *a, **kw):
    page_image = _real(doc, index, *a, **kw)
    page_image.jpeg += f"#PAGE:{index + 1}".encode()
    return page_image


sp.render_page = marked


def run(backend_cls, out_dir):
    """Прогон парсера с подставной моделью. -> строки всех трёх CSV."""
    out_dir.mkdir(parents=True, exist_ok=True)
    sp.build_backend = lambda *a, **k: backend_cls()
    sys.argv = ["p", "--folder", str(root), "--output", str(out_dir), "--batch", "2",
                "--overlap", "1", "--no-upload", "--delay", "0"]
    sp.main()
    collected = []
    for name in ("ebrw_mcq.csv", "math_mcq.csv", "math_open.csv"):
        path = out_dir / name
        if path.exists():
            collected += list(csv.DictReader(open(path, encoding="utf-8")))
    return collected


print("\n=== сценарий 1: модель отдаёт всё ===")
rows = run(PerfectBackend, out)

found_tags = []
for row in rows:
    # Метка внутри строки может встретиться дважды — считаем строку, не вхождения.
    found_tags += sorted(set(re.findall(
        r"Q\d{3}", f"{row.get('passage', '')} {row.get('question', '')}")))

print(f"\nстраниц в PDF: {len(PAGES)}, ожидалось вопросов: {TOTAL}, "
      f"в CSV попало: {len(rows)}")

missing = sorted(TAGS - set(found_tags))
extra = sorted(t for t in set(found_tags) if found_tags.count(t) > 1)

check(len(rows) == TOTAL,
      f"идеальная модель -> все {TOTAL} вопросов в CSV (получено {len(rows)})")
check(not missing,
      f"ни один вопрос не потерян (потеряно {len(missing)}: {missing[:15]})")
check(not extra,
      f"дубликатов нет (повторов {len(extra)}: {extra[:15]})")

# Сегментация модулей должна восстановить ровно четыре модуля из нумерации,
# хотя лейбл напечатан только на первой странице каждого.
sightings = []
for row in rows:
    number = (row.get("question_number") or "").strip()
    page = (row.get("page") or "").strip()
    if number.isdigit() and page.isdigit():
        qtype = "EBRW_MCQ" if row.get("topic") == "Reading & Writing" else "MATH_MCQ"
        sightings.append(sp.Sighting(int(number), int(page) - 1, qtype,
                                     row.get("module") or ""))
modules = sp.split_modules(sightings)
sizes = [len(m.numbers) for m in modules]
check(sizes == [27, 27, 22, 22],
      f"модули восстановлены по нумерации: {sizes} (ждали [27, 27, 22, 22])")

check(not (out / "gaps_report.txt").exists(), "отчёт о дырках пуст — всё найдено")


print("\n=== сценарий 2: модель отдаёт по 2 вопроса из 3 ===")
lazy_out = root / "out_lazy"
lazy_rows = run(LazyBackend, lazy_out)

lazy_tags = []
for row in lazy_rows:
    lazy_tags += sorted(set(re.findall(
        r"Q\d{3}", f"{row.get('passage', '')} {row.get('question', '')}")))

lazy_missing = sorted(TAGS - set(lazy_tags))
print(f"\nбез добора модель отдала бы ~{len(PAGES) * 2}, "
      f"в CSV попало: {len(lazy_rows)}")
check(not lazy_missing,
      f"добор вернул все {TOTAL} вопросов (потеряно {len(lazy_missing)}: "
      f"{lazy_missing[:15]})")
check(len(lazy_tags) == len(set(lazy_tags)),
      f"добор не наплодил дубликатов (строк {len(lazy_rows)})")

print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
