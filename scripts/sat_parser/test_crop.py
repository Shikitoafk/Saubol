"""Кроп картинки не должен резать таблицу пополам.

Модель ставит bbox на глаз и регулярно промахивается внутрь: у таблицы
отрезается левый столбец, у графика — подписи осей. Фиксированный отступ
не помогает, потому что промах то на процент, то на восемь. Проверяем, что
рамка сама раздвигается до белого поля и при этом не съедает пол-листа.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from PIL import Image, ImageDraw
import sat_parser_gemini as sp

FAILED = False


def check(cond, label):
    global FAILED
    print(("  OK   " if cond else "  FAIL ") + label)
    if not cond:
        FAILED = True


def make_page(watermark=False):
    """Лист с текстом вопроса сверху, таблицей посередине и вариантами снизу."""
    img = Image.new("RGB", (900, 1200), "white")
    draw = ImageDraw.Draw(img)
    draw.text((60, 80), "Question 14: the table shows the area of five states.",
              fill="black")
    # Таблица: рамка + два столбца, от x=200 до x=700, от y=300 до y=640.
    draw.rectangle([200, 300, 700, 640], outline="black", width=3)
    draw.line([450, 300, 450, 640], fill="black", width=3)
    for i in range(1, 5):
        y = 300 + i * 68
        draw.line([200, y, 700, y], fill="black", width=2)
        draw.text((230, y - 50), f"State {i}", fill="black")
        draw.text((500, y - 50), f"{i * 1111}", fill="black")
    draw.text((60, 800), "A) 4,453    B) 3,606    C) 1,311    D) 2,188", fill="black")
    if watermark:
        # Светло-розовый водяной знак поверх всего листа, как в оригинале.
        for y in range(0, 1200, 90):
            for x in range(0, 900, 220):
                draw.text((x, y), "EliteXSAT | Eljan", fill=(246, 214, 214))
    return img


TABLE = (200, 300, 700, 640)


def covers_table(box):
    return (box[0] <= TABLE[0] and box[1] <= TABLE[1]
            and box[2] >= TABLE[2] and box[3] >= TABLE[3])


# Модель промахнулась внутрь: срезала левый столбец и заголовок таблицы.
page = make_page()
tight = (0.42, 0.29, 0.79, 0.52)          # x0=378, y0=348, x1=711, y1=624
raw = sp.crop_by_normalized_bbox(page, tight, pad=0.012, grow=0.0)
fixed = sp.crop_by_normalized_bbox(page, tight, pad=0.012, grow=0.06)

print(f"без раздвижения: {raw.size}, с раздвижением: {fixed.size}")
check(raw.size[0] < fixed.size[0], "рамка расширилась влево, а не осталась как была")

grown = sp.expand_to_whitespace(page, (378, 348, 711, 624), round(0.15 * 1200))
print(f"рамка {(378, 348, 711, 624)} -> {grown}, таблица {TABLE}")
check(covers_table(grown), "таблица попала в кроп целиком")
check(grown[1] > 200, "вверх не уехало до текста вопроса (y=80)")
check(grown[3] < 780, "вниз не уехало до вариантов ответа (y=800)")

# Тот же лист, но под водяными знаками: они не должны считаться содержимым.
marked = make_page(watermark=True)
grown_marked = sp.expand_to_whitespace(marked, (378, 348, 711, 624), round(0.15 * 1200))
print(f"под водяным знаком: {grown_marked}")
check(covers_table(grown_marked), "под водяным знаком таблица тоже попала целиком")
check(grown_marked[0] > 60 and grown_marked[2] < 860,
      "водяной знак не растянул рамку на весь лист")

# Рамка уже правильная — раздвигать нечего.
exact = sp.expand_to_whitespace(page, TABLE, round(0.15 * 1200))
check(exact[0] >= TABLE[0] - 20 and exact[2] <= TABLE[2] + 20,
      f"точную рамку почти не трогаем: {exact}")

# Выключенное раздвижение остаётся выключенным.
check(sp.expand_to_whitespace(page, (378, 348, 711, 624), 0) == (378, 348, 711, 624),
      "--bbox-grow 0 ничего не двигает")

print("\nFAILED" if FAILED else "\nвсе проверки прошли")
sys.exit(1 if FAILED else 0)
