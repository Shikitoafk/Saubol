"""Проверка сопоставления ответов с вопросами по модулям — без модели.

Читать таблицу-ключ — забота Gemini, а вот разложить вопросы по модулям и
сопоставить с колонками ключа скрипт делает сам. Именно тут номера из
разных модулей (в каждом 1-27) могут перепутаться — это и проверяем.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fill_answers as fa
import sat_parser_gemini as sp

FAILED = False


def check(cond, label):
    global FAILED
    print(("  OK   " if cond else "  FAIL ") + label)
    if not cond:
        FAILED = True


def make_rows():
    """Полный тест: RW 27+27, Math (MCQ 1-16 + Open 17-22) ×2. page — как в CSV."""
    rows = []
    page = 1

    def add(qtype, count, open_from=None):
        nonlocal page
        for n in range(1, count + 1):
            if n % 3 == 1:
                page += 1
            qt = qtype
            if open_from is not None and n >= open_from:
                qt = "MATH_OPEN"
            rows.append({"_qtype": qt, "_number": n, "_page": page,
                         "correct_answer": ""})

    add("EBRW_MCQ", 27)
    add("EBRW_MCQ", 27)
    add("MATH_MCQ", 22, open_from=17)
    add("MATH_MCQ", 22, open_from=17)
    return rows


rows = make_rows()

# --- разложение по модулям ---------------------------------------------------
ebrw_idx = fa.module_index_by_question(rows, "EBRW")
math_idx = fa.module_index_by_question(rows, "MATH")

ebrw_mods = sorted(set(ebrw_idx.values()))
math_mods = sorted(set(math_idx.values()))
check(ebrw_mods == [1, 2], f"RW разложился на 2 модуля: {ebrw_mods}")
check(math_mods == [1, 2], f"Math разложился на 2 модуля: {math_mods}")

# №5 первого RW-модуля и №5 второго — это РАЗНЫЕ вопросы (разные страницы).
rw5 = sorted(idx for (num, _), idx in ebrw_idx.items() if num == 5)
check(rw5 == [1, 2], f"№5 есть и в модуле 1, и в модуле 2 RW: {rw5}")

# --- сопоставление ответов ---------------------------------------------------
# Ключ: у №1 в четырёх модулях РАЗНЫЕ ответы. Нельзя перепутать.
answers = {
    ("EBRW", 1, 1): "B", ("EBRW", 2, 1): "D",
    ("MATH", 1, 1): "B", ("MATH", 2, 1): "C",
    ("EBRW", 1, 5): "A", ("EBRW", 2, 5): "C",
    ("MATH", 1, 17): "14",              # grid-in первого матмодуля
}

mod_index = {"EBRW": ebrw_idx, "MATH": math_idx}
got = {}
for r in rows:
    family = sp.FAMILY[r["_qtype"]]
    index = mod_index[family].get((r["_number"], r["_page"]))
    ans = answers.get((family, index, r["_number"]))
    if ans:
        got[(family, index, r["_number"])] = ans

check(got.get(("EBRW", 1, 1)) == "B", "RW M1 №1 -> B")
check(got.get(("EBRW", 2, 1)) == "D", "RW M2 №1 -> D (не перепутан с M1)")
check(got.get(("MATH", 1, 1)) == "B", "Math M1 №1 -> B")
check(got.get(("MATH", 2, 1)) == "C", "Math M2 №1 -> C")
check(got.get(("EBRW", 1, 5)) == "A" and got.get(("EBRW", 2, 5)) == "C",
      "№5 обоих RW-модулей получил свой ответ")
check(got.get(("MATH", 1, 17)) == "14",
      "grid-in №17 матмодуля 1 -> 14 (открытый вопрос тоже сопоставился)")

# Ровно один вопрос на каждую заполненную клетку ключа — без дублей.
check(len(got) == 7, f"проставлено ровно 7 ответов, без дублей: {len(got)}")

print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
