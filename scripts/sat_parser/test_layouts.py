"""Разные раскладки одним парсером, без флагов под каждый файл.

Файлы приходят непохожие: где-то один вопрос занимает целый лист, где-то на
странице шесть скриншотов подряд. Проверяем, что --batch auto сам подбирает
размер батча, а размер модуля берётся из напечатанного заголовка, а не из
зашитых 27/22.
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


# --- единицы: выбор батча по плотности --------------------------------------
check(sp.choose_batch(6) == 1, "6 вопросов на листе -> батч 1")
check(sp.choose_batch(3) == 2, "3 вопроса на листе -> батч 2")
check(sp.choose_batch(1) == 6, "1 вопрос на листе -> батч 6")
check(sp.choose_batch(0) == sp.AUTO_FALLBACK_BATCH, "проба пустая -> запасной батч")


# --- единицы: размер модуля не выдумывается ----------------------------------
def seen(numbers, qtype="EBRW_MCQ", per_page=3, total=None):
    return [sp.Sighting(n, (n - 1) // per_page, qtype, "", total) for n in numbers]


# Подборка из 15 задач — законченный файл, а не модуль с 12 потерянными.
drill = sp.find_number_gaps(seen(range(1, 16)), 6)
check(drill == [], f"файл-подборка на 15 вопросов: лишних номеров не ищем ({drill})")

# Заголовок объявил 40 вопросов — верим заголовку, а не зашитым 27.
declared = sp.find_number_gaps(seen(range(1, 36), total=40), 14)
check(sorted({n for ns, _ in declared for n in ns}) == [36, 37, 38, 39, 40],
      "объявленный в заголовке размер модуля важнее зашитого")

# Полный тест: один модуль дотянул до 27, значит формат стандартный — у
# соседнего модуля хвост добираем даже без заголовка.
standard = seen(range(1, 28)) + [sp.Sighting(n, 9 + (n - 1) // 3, "EBRW_MCQ")
                                 for n in range(1, 21)]
check(sorted({n for ns, _ in sp.find_number_gaps(standard, 20) for n in ns})
      == [21, 22, 23, 24, 25, 26, 27],
      "в стандартном тесте хвост второго модуля добирается")

# Заголовок прочитан неверно: в модуле на 27 вопросов «80». Верить нельзя —
# иначе добор уходит выпрашивать номера, которых в файле нет.
bogus = (seen(range(1, 28), total=80)
         + [sp.Sighting(n, 9 + (n - 1) // 3, "EBRW_MCQ", "", 80) for n in range(1, 28)])
asked = sorted({n for ns, _ in sp.find_number_gaps(bogus, 18) for n in ns})
check(asked == [], f"кривой размер модуля из заголовка не разносит добор: {asked[:12]}")

# И длинные списки номеров не уезжают в один запрос: модель их игнорирует.
sparse_module = seen([1, 2, 3], total=60)
for numbers, _ in sp.find_number_gaps(sparse_module, 30):
    check(len(numbers) <= sp.MAX_NUMBERS_PER_GAP_REQUEST,
          f"в одном запросе не больше {sp.MAX_NUMBERS_PER_GAP_REQUEST} номеров "
          f"(было {len(numbers)})")


# --- e2e: два файла с разной плотностью --------------------------------------
root = Path(__file__).parent / "layouts_e2e"
shutil.rmtree(root, ignore_errors=True)

# (имя, вопросов на страницу, всего вопросов, объявлено в заголовке)
CASES = [("sparse", 1, 12, 12), ("dense", 6, 30, 30)]
LAYOUT = {}

for name, per_page, total, declared_total in CASES:
    folder = root / name
    folder.mkdir(parents=True)
    pages = [list(range(i + 1, min(i + per_page, total) + 1))
             for i in range(0, total, per_page)]
    LAYOUT[name] = {"pages": pages, "per_page": per_page, "total": total,
                    "declared": declared_total}
    doc = fitz.open()
    for page_numbers in pages:
        page = doc.new_page()
        for i, number in enumerate(page_numbers):
            page.insert_text((60, 60 + i * 120), f"{number}. Question", fontsize=10)
    doc.save(folder / f"March 2026 {name}.pdf")
    doc.close()


class LazyBackend(sp.GeminiBackend):
    """Отдаёт не больше двух вопросов со страницы — как модель на плотном листе."""
    name = "lazy"

    def __init__(self):
        self.batch_sizes = []

    def generate(self, model, parts, timeout, schema):
        tags = [p["data"].rsplit(b"#PAGE:", 1)[1].decode() for p in parts
                if isinstance(p, dict)]
        # Счёт блоков модели даётся легко — отвечает честно, в отличие от
        # обычного извлечения, где она выдыхается после второго вопроса.
        if any(isinstance(p, str) and "just count" in p for p in parts):
            case, page_index = tags[0].split("|")
            return json.dumps({
                "questions_on_page": len(LAYOUT[case]["pages"][int(page_index)])})
        focus = next((p for p in parts
                      if isinstance(p, str) and "FOCUS PASS" in p), None)
        if not focus:
            self.batch_sizes.append(len(tags))
        rows = []
        for local, tag in enumerate(tags):
            case, page_index = tag.split("|")
            layout = LAYOUT[case]
            numbers = layout["pages"][int(page_index)]
            if focus:
                wanted = {int(n) for n in re.findall(r"\d+", focus.split("numbered")[1])}
                numbers = [n for n in numbers if n in wanted]
            else:
                numbers = numbers[:2]
            for number in numbers:
                rows.append({
                    "type": "EBRW_MCQ", "question_number": number,
                    "module": "Module 1", "module_total": layout["declared"],
                    "passage": f"[{case}-{number}] context for question {number}",
                    "question": "Which choice completes the text with the most "
                                "logical and precise word or phrase?",
                    "options": {"A": "one", "B": "two", "C": "three", "D": "four"},
                    "correct_answer": "A", "topic": "Reading & Writing",
                    "page_index": local, "has_image": False, "image_bbox": None,
                })
        return json.dumps(rows)


_real = sp.render_page
CURRENT_CASE = {"name": ""}


def marked(doc, index, *a, **kw):
    page_image = _real(doc, index, *a, **kw)
    page_image.jpeg += f"#PAGE:{CURRENT_CASE['name']}|{index}".encode()
    return page_image


sp.render_page = marked

for name, per_page, total, _ in CASES:
    CURRENT_CASE["name"] = name
    backend = LazyBackend()
    sp.build_backend = lambda *a, **k: backend
    out = root / f"out_{name}"
    out.mkdir(parents=True)
    sys.argv = ["p", "--folder", str(root / name), "--output", str(out),
                "--no-upload", "--delay", "0"]
    sp.main()

    rows = list(csv.DictReader(open(out / "ebrw_mcq.csv", encoding="utf-8")))
    tags = {t for row in rows for t in re.findall(rf"{name}-\d+", row["passage"])}
    expected = {f"{name}-{n}" for n in range(1, total + 1)}

    # Батч, выбранный после пробы (первые замеры — сама проба, по одной странице).
    chosen = [s for s in backend.batch_sizes[1:]] or [1]
    print(f"\n[{name}] {per_page} вопрос(ов) на странице, "
          f"батчи: {sorted(set(backend.batch_sizes))}, строк в CSV: {len(rows)}")

    check(not (expected - tags),
          f"[{name}] собраны все {total} вопросов "
          f"(потеряно {len(expected - tags)}: {sorted(expected - tags)[:10]})")
    check(len(rows) == total, f"[{name}] лишних строк нет ({len(rows)} из {total})")
    if per_page >= 6:
        check(max(chosen) == 1, f"[{name}] на плотном файле выбран батч 1 ({chosen[0]})")
    else:
        check(max(chosen) > 1, f"[{name}] на разреженном файле батч крупнее 1 ({chosen[0]})")

print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
