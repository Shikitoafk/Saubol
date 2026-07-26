#!/usr/bin/env python3
"""
SAT PDF -> CSV (+ Supabase Storage) parser (v4)
================================================

Читает PDF постранично (как картинки), просит Gemini найти SAT-вопросы,
раскладывает их в 3 CSV (EBRW_MCQ, Math_MCQ, Math_Open), заливает картинки
вопросов в Supabase Storage и определяет test_period / test_version по
имени файла (с фолбэком на Gemini по обложке).

Что изменилось по сравнению с v3
--------------------------------
* Ключи больше не в коде: только переменные окружения / .env (см. --help).
* JSON-режим модели (response_mime_type + схема) — модель физически не может
  вернуть markdown-обёртку или сломанный LaTeX-экранинг.
* Многоуровневый разбор ответа: JSON -> починка бэкслэшей -> поштучное
  спасение объектов -> просьба к модели починить. Батч больше не теряется
  целиком из-за одного битого вопроса.
* Пул моделей с временными кулдаунами вместо «сгорела — выбыла навсегда»:
  429 на минуту больше не убивает модель до конца запуска.
* Картинки в API уходят пережатыми в JPEG (в разы меньше трафика и токенов),
  а кропы для Supabase режутся из полноразмерного рендера.
* Нормализация вопросов: тип, буква ответа, LaTeX-разделители, номер вопроса.
* Дедуп по нормализованному тексту + (номер, модуль) — перекрытие батчей
  больше не плодит почти-дубликаты.
* Ответы из файлов-ключей (answer keys) больше не выбрасываются, а
  подставляются в correct_answer (--answer-keys, по умолчанию включено).
* Resume теперь по батчам, а не по файлам: падение на 300-й странице не
  заставляет перечитывать PDF с начала.
* --concurrency: несколько батчей в полёте одновременно.
* Локальное сохранение картинок (--images-dir), если Supabase не нужен.
* Всё пишется через logging, есть --dry-run.

Установка:
    pip install -r requirements.txt

Запуск:
    export GEMINI_API_KEY=...
    export SUPABASE_URL=...            # опционально
    export SUPABASE_SERVICE_KEY=...    # опционально
    python sat_parser_gemini.py --folder ./pdfs --output ./out --resume
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import logging
import os
import random
import re
import sys
import threading
import time
import unicodedata
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence
from urllib.parse import quote

import fitz  # pymupdf
import requests
from PIL import Image

log = logging.getLogger("sat_parser")


# =============================== НАСТРОЙКИ ==================================
# Ключи берутся из окружения или из .env рядом со скриптом. В коде их нет и
# быть не должно — файл ездит по гиту и чатам.

# Порядок: сначала самые сильные, дальше по убыванию. Модели, которых нет на
# ключе, отваливаются по 404 на первом же запросе и просто пропускаются, так
# что список можно держать «с запасом на будущее».
# Точные ID под свой ключ смотри через --list-models.
DEFAULT_MODEL_ROTATION = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
]

REQUEST_TIMEOUT_SEC = 120      # защита от зависания на одном запросе
MAX_RETRIES_PER_MODEL = 3      # попыток на модель до переключения дальше
JSON_FIX_RETRIES = 2           # попыток попросить модель починить свой же JSON
RATE_LIMIT_COOLDOWN_SEC = 60   # база кулдауна модели после 429
DAILY_QUOTA_COOLDOWN_SEC = 6 * 3600

RENDER_DPI = 200               # рендер для кропов картинок (качество)
# Плотные страницы (несколько скриншотов вопросов на листе) при 1600px
# читаются моделью хуже: мелкий текст в вариантах ответа сливается.
API_MAX_SIDE = 2000            # длинная сторона картинки, уходящей в модель
API_JPEG_QUALITY = 80

MONTHS = {
    "jan": "January", "feb": "February", "mar": "March", "apr": "April",
    "may": "May", "jun": "June", "jul": "July", "aug": "August",
    "sep": "September", "oct": "October", "nov": "November", "dec": "December",
}

VERSION_PATTERNS = [
    r"North\s+US\s+Version\s*[A-Z0-9]+",
    r"US\s+Version\s*[A-Z0-9]+",
    r"INT[\s\-]?Version\s*[A-Z0-9]+",
    r"INT[\s\-]?Test\s*[A-Z0-9]+",
    r"INT[\s\-]?[A-Z](?![a-z])",
    r"INT\s+[A-Z](?=\s)",
    r"Version\s*[A-Z0-9]+",
    r"Test\s*[A-Z0-9]+",
    r"Module\s*\d+(?:\s*\(Ver\s*\d+\))?",
    r"\bV\d+\b",
    r"Ver\s*\d+",
]

QTYPES = ("EBRW_MCQ", "MATH_MCQ", "MATH_OPEN")


# ================================ .env ======================================

def load_dotenv(paths: Sequence[Path]) -> None:
    """Минимальный .env-лоадер: KEY=VALUE, без перезаписи уже заданных переменных."""
    for path in paths:
        if not path.is_file():
            continue
        try:
            for raw in path.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
        except OSError as exc:  # noqa: PERF203
            log.debug("не смог прочитать %s: %s", path, exc)


def env_any(*names: str, default: str = "") -> str:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value.strip()
    return default


# ========================= ИМЯ ФАЙЛА -> ПЕРИОД ==============================

def is_answer_key_file(filename: str) -> bool:
    """Файл — ключ с ответами, а не вариант с вопросами."""
    return bool(re.search(r"\b(answers?|ans|keys?|answer[\s_\-]?key|solutions?)\b", filename, re.I))


def extract_period_from_filename(filename: str) -> tuple[str | None, str | None]:
    """Возвращает (period | None, version | None). period в виде 'June 2025'."""
    period = None
    m = re.search(
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+"
        r"(?:\d{1,2}(?:st|nd|rd|th)?,?\s+)?(\d{4})",
        filename, re.I,
    )
    if m:
        period = f"{MONTHS[m.group(1)[:3].lower()]} {m.group(2)}"
    else:
        m = re.search(
            r"\b(\d{4})[\s_\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?",
            filename, re.I,
        )
        if m:
            period = f"{MONTHS[m.group(2)[:3].lower()]} {m.group(1)}"

    version = None
    for pattern in VERSION_PATTERNS:
        vm = re.search(pattern, filename, re.I)
        if vm:
            version = re.sub(r"\s+", " ", vm.group(0).strip())
            break

    return period, version


def extract_period_from_path(pdf_path: Path, root: Path) -> tuple[str | None, str | None]:
    """Ищет период и версию в имени файла, затем в именах родительских папок.

    Типичная раскладка — 'SAT Qs/June 2025/US Version A.pdf': месяц лежит в
    папке, версия в файле. Имя файла приоритетнее, дальше идём вверх по дереву.
    """
    try:
        parts = list(pdf_path.relative_to(root).parts)
    except ValueError:
        parts = [pdf_path.name]

    period = version = None
    for name in reversed(parts):          # файл, затем папки снизу вверх
        found_period, found_version = extract_period_from_filename(name)
        period = period or found_period
        version = version or found_version
        if period and version:
            break
    return period, version


def source_id(pdf_path: Path, root: Path) -> str:
    """Идентификатор варианта для CSV/дедупа.

    Одно только имя файла не годится: 'Module 1.pdf' лежит в каждой месячной
    папке, и по такому ключу вопросы разных тестов схлопнулись бы в дубликаты.
    """
    try:
        relative = pdf_path.relative_to(root)
    except ValueError:
        return pdf_path.stem
    return relative.with_suffix("").as_posix()


def build_test_period_label(period: str | None, version: str | None) -> str:
    if period and version:
        return f"{period} - {version}"
    if period:
        return period
    if version:
        return f"Unknown - {version}"
    return "Unknown"


# ============================ БЭКЕНДЫ GEMINI ================================
# Поддерживаются оба SDK: новый google-genai и легаси google-generativeai.
# Новый умеет response_schema и модели gemini-3.x, легаси оставлен, чтобы
# скрипт не падал на старом окружении.

class StopAllModels(Exception):
    """Все модели выбыли: дневные лимиты, отсутствие доступа и т.п."""


class GeminiBackend:
    name = "base"

    def generate(self, model: str, parts: list[Any], timeout: int,
                 schema: dict | None) -> str:
        raise NotImplementedError

    @staticmethod
    def image_part(jpeg_bytes: bytes) -> Any:
        return {"mime_type": "image/jpeg", "data": jpeg_bytes}


class NewSDKBackend(GeminiBackend):
    """google-genai (from google import genai)."""

    name = "google-genai"

    def __init__(self, api_key: str) -> None:
        from google import genai
        from google.genai import types

        self._types = types
        self._client = genai.Client(api_key=api_key)
        self._schema_supported = True

    def image_part(self, jpeg_bytes: bytes) -> Any:
        return self._types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg")

    def generate(self, model: str, parts: list[Any], timeout: int,
                 schema: dict | None) -> str:
        config: dict[str, Any] = {
            "response_mime_type": "application/json",
            "http_options": self._types.HttpOptions(timeout=timeout * 1000),
        }
        if schema and self._schema_supported:
            config["response_schema"] = schema
        try:
            resp = self._client.models.generate_content(
                model=model, contents=parts,
                config=self._types.GenerateContentConfig(**config),
            )
        except Exception as exc:
            if schema and self._schema_supported and _looks_like_schema_error(exc):
                log.warning("модель/SDK не приняли response_schema, дальше без неё: %s",
                            str(exc)[:160])
                self._schema_supported = False
                return self.generate(model, parts, timeout, None)
            raise
        return _text_from_response(resp)


class LegacySDKBackend(GeminiBackend):
    """google-generativeai (import google.generativeai as genai)."""

    name = "google-generativeai"

    def __init__(self, api_key: str) -> None:
        import google.generativeai as genai

        self._genai = genai
        genai.configure(api_key=api_key)
        self._schema_supported = False  # легаси-SDK капризен к dict-схемам

    def generate(self, model: str, parts: list[Any], timeout: int,
                 schema: dict | None) -> str:
        gm = self._genai.GenerativeModel(model)
        resp = gm.generate_content(
            parts,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": timeout},
        )
        return _text_from_response(resp)


def _looks_like_broken_google_namespace(exc: Exception) -> bool:
    """Классическая поломка: 'cannot import name genai from google'.

    Пакет 'google' (или обломки старого) кладёт в site-packages свой
    google/__init__.py, из-за чего google перестаёт быть namespace-пакетом
    и подпакеты вроде google.genai становятся невидимыми.
    """
    msg = str(exc).lower()
    return "cannot import name" in msg and "google" in msg


def _looks_like_schema_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "schema" in msg or "response_schema" in msg


class TruncatedResponse(Exception):
    """Модель упёрлась в лимит выходных токенов и оборвала ответ на середине.

    Несёт с собой то, что успело прийти: из обрезанного JSON обычно спасается
    часть вопросов, а остальные страницы вызывающий код перезапросит меньшими
    батчами. Без этой проверки обрыв выглядит как «на страницах было мало
    вопросов» — самая обидная и незаметная потеря данных.
    """

    def __init__(self, text: str) -> None:
        super().__init__("ответ обрезан по лимиту выходных токенов")
        self.text = text


def _finish_reason(resp: Any) -> str:
    for cand in getattr(resp, "candidates", None) or []:
        return str(getattr(cand, "finish_reason", "") or "")
    return ""


def _is_truncated(finish: str) -> bool:
    # Новый SDK: 'FinishReason.MAX_TOKENS'. Легаси-протобуф: '2'.
    return "MAX_TOKENS" in finish.upper() or finish.strip() == "2"


def _text_from_response(resp: Any) -> str:
    """Достаёт текст, не падая на пустых/заблокированных ответах."""
    text = getattr(resp, "text", None)
    if not text:
        chunks: list[str] = []
        for cand in getattr(resp, "candidates", None) or []:
            content = getattr(cand, "content", None)
            for part in getattr(content, "parts", None) or []:
                part_text = getattr(part, "text", None)
                if part_text:
                    chunks.append(part_text)
        text = "".join(chunks)

    finish = _finish_reason(resp)
    if text and _is_truncated(finish):
        raise TruncatedResponse(text)
    if text:
        return text
    raise RuntimeError(f"пустой ответ модели (finish_reason={finish or 'unknown'})")


def list_available_models(api_key: str, prefer: str = "auto") -> int:
    """Печатает ID моделей, доступных этому ключу (для --models)."""
    backend = build_backend(api_key, prefer)
    names: list[str] = []
    try:
        if isinstance(backend, NewSDKBackend):
            for model in backend._client.models.list():
                actions = getattr(model, "supported_actions", None) or []
                if not actions or "generateContent" in actions:
                    names.append(str(model.name).replace("models/", ""))
        else:
            for model in backend._genai.list_models():
                if "generateContent" in getattr(model, "supported_generation_methods", []):
                    names.append(str(model.name).replace("models/", ""))
    except Exception as exc:
        log.error("не удалось получить список моделей: %s", str(exc)[:300])
        return 1

    interesting = [n for n in names if "gemini" in n and "embedding" not in n]
    print("\nДоступные модели (генерация текста):")
    for name in sorted(interesting):
        print(f"  {name}")
    print(f"\nВсего: {len(interesting)}. Передавать так:\n"
          f"  --models \"модель1,модель2,модель3\"\n")
    return 0


def build_backend(api_key: str, prefer: str = "auto") -> GeminiBackend:
    errors: list[str] = []
    order = {
        "auto": (NewSDKBackend, LegacySDKBackend),
        "new": (NewSDKBackend,),
        "legacy": (LegacySDKBackend,),
    }[prefer]
    for cls in order:
        try:
            backend = cls(api_key)
            log.info("SDK: %s", backend.name)
            if isinstance(backend, LegacySDKBackend):
                log.warning("это устаревший SDK: response_schema не применяется, "
                            "битого JSON будет больше, обновлений пакет не получает. "
                            "Модели gemini-3.x вызывать умеет, но лучше починить "
                            "новый SDK — причина в предупреждении выше.")
            return backend
        except Exception as exc:
            # Молча падать нельзя: тихий откат на легаси-SDK выглядит как
            # «всё работает», но без JSON-схемы.
            log.warning("SDK %s недоступен: %s", cls.name, str(exc)[:300])
            if _looks_like_broken_google_namespace(exc):
                log.warning(
                    "Похоже, пространство имён 'google' сломано посторонним "
                    "пакетом. Лечится так:\n"
                    "    pip uninstall -y google google-generativeai\n"
                    "    pip install --upgrade --force-reinstall google-genai\n"
                    "  Проверка (должно напечатать None и путь до site-packages):\n"
                    "    python -c \"import google; print(google.__file__, google.__path__)\"")
            errors.append(f"{cls.name}: {exc}")
    raise SystemExit(
        "Не удалось инициализировать Gemini SDK.\n  " + "\n  ".join(errors)
        + "\nУстанови: pip install google-genai"
    )


# ============================== ПУЛ МОДЕЛЕЙ =================================

@dataclass
class ModelState:
    name: str
    cooldown_until: float = 0.0
    disabled: bool = False
    reason: str = ""

    def available(self, now: float) -> bool:
        return not self.disabled and self.cooldown_until <= now


class ModelPool:
    """Ротация моделей с временными кулдаунами. Потокобезопасен."""

    def __init__(self, backend: GeminiBackend, model_names: Sequence[str],
                 timeout: int = REQUEST_TIMEOUT_SEC) -> None:
        self.backend = backend
        self.timeout = timeout
        self.states = [ModelState(name) for name in model_names]
        self._lock = threading.Lock()
        self._cursor = 0

    def _pick(self) -> ModelState:
        """Ближайшая доступная модель; ждёт кулдаун, если все на паузе."""
        while True:
            with self._lock:
                now = time.time()
                count = len(self.states)
                for offset in range(count):
                    idx = (self._cursor + offset) % count
                    state = self.states[idx]
                    if state.available(now):
                        self._cursor = idx
                        return state
                alive = [s for s in self.states if not s.disabled]
                if not alive:
                    raise StopAllModels(
                        "Все модели выбыли: " +
                        "; ".join(f"{s.name} ({s.reason})" for s in self.states)
                    )
                wait = max(1.0, min(s.cooldown_until for s in alive) - now)
            log.warning("все модели на кулдауне, жду %.0fс", wait)
            time.sleep(min(wait, 60))

    def _demote(self, state: ModelState, *, seconds: float | None, reason: str) -> None:
        with self._lock:
            if seconds is None:
                state.disabled = True
                state.reason = reason
                log.warning("модель %s отключена: %s", state.name, reason)
            else:
                state.cooldown_until = time.time() + seconds
                state.reason = reason
                log.warning("модель %s на паузе %.0fс: %s", state.name, seconds, reason)
            self._cursor = (self._cursor + 1) % len(self.states)

    def generate(self, parts: list[Any], schema: dict | None = None) -> str:
        deadline_attempts = len(self.states) * MAX_RETRIES_PER_MODEL + 4
        for _ in range(deadline_attempts):
            state = self._pick()
            for attempt in range(1, MAX_RETRIES_PER_MODEL + 1):
                try:
                    return self.backend.generate(state.name, parts, self.timeout, schema)
                except (StopAllModels, TruncatedResponse):
                    # Обрыв по токенам — не вина модели, повтор даст то же самое.
                    # Разбираться с ним должен вызывающий код: меньшим батчем.
                    raise
                except Exception as exc:
                    kind, wait = classify_error(exc, attempt)
                    msg = str(exc)[:180]
                    if kind == "fatal":
                        self._demote(state, seconds=None, reason=msg)
                        break
                    if kind == "daily":
                        self._demote(state, seconds=DAILY_QUOTA_COOLDOWN_SEC, reason=msg)
                        break
                    if kind == "rate":
                        self._demote(state, seconds=wait, reason="rate limit")
                        break
                    log.warning("[%s] ошибка (%d/%d): %s",
                                state.name, attempt, MAX_RETRIES_PER_MODEL, msg)
                    if attempt == MAX_RETRIES_PER_MODEL:
                        self._demote(state, seconds=RATE_LIMIT_COOLDOWN_SEC, reason=msg)
                    else:
                        time.sleep(wait)
        raise StopAllModels("исчерпан бюджет попыток по всем моделям")


def classify_error(exc: Exception, attempt: int) -> tuple[str, float]:
    """-> (kind, seconds_to_wait). kind: fatal | daily | rate | transient."""
    msg = str(exc)
    low = msg.lower()

    if "404" in msg or "not_found" in low or "permission" in low or "api key" in low:
        return "fatal", 0.0
    if "per day" in low or "perday" in low or "daily" in low:
        return "daily", 0.0
    if "429" in msg or "resource_exhausted" in low or "quota" in low or "rate limit" in low:
        # Gemini часто отдаёт retry_delay { seconds: N } — уважаем его.
        m = re.search(r"retry_?delay[^0-9]{0,20}(\d+)", msg, re.I)
        wait = float(m.group(1)) if m else RATE_LIMIT_COOLDOWN_SEC * attempt
        return "rate", min(max(wait, 5.0), 300.0)
    return "transient", min(4.0 * attempt + random.uniform(0, 2), 30.0)


# ============================== PDF / КАРТИНКИ ==============================

@dataclass
class PageImage:
    index: int              # 0-based номер страницы в PDF
    full: Image.Image       # полноразмерный рендер (для кропов)
    jpeg: bytes             # пережатая версия для отправки в модель

    @property
    def number(self) -> int:
        return self.index + 1


def render_page(doc: fitz.Document, index: int, dpi: int = RENDER_DPI,
                api_max_side: int = API_MAX_SIDE) -> PageImage:
    pix = doc[index].get_pixmap(dpi=dpi)
    full = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")

    api_img = full
    longest = max(full.size)
    if longest > api_max_side:
        scale = api_max_side / longest
        api_img = full.resize(
            (max(1, int(full.width * scale)), max(1, int(full.height * scale))),
            Image.LANCZOS,
        )
    buf = io.BytesIO()
    api_img.save(buf, format="JPEG", quality=API_JPEG_QUALITY, optimize=True)
    return PageImage(index=index, full=full, jpeg=buf.getvalue())


def crop_by_normalized_bbox(img: Image.Image, bbox: Sequence[float],
                            pad: float = 0.012,
                            max_area: float = 0.92) -> Image.Image | None:
    """bbox = [x0, y0, x1, y1] в долях 0-1. Возвращает кроп или None."""
    if not bbox or len(bbox) != 4:
        return None
    try:
        x0, y0, x1, y1 = (float(v) for v in bbox)
    except (TypeError, ValueError):
        return None
    if any(v != v for v in (x0, y0, x1, y1)):  # NaN
        return None

    x0, x1 = sorted((x0, x1))
    y0, y1 = sorted((y0, y1))
    # Модель иногда отдаёт координаты в пикселях или в 0-100 — чиним.
    if max(x1, y1) > 1.5:
        scale = 100.0 if max(x1, y1) <= 100.0 else max(img.size)
        x0, y0, x1, y1 = (v / scale for v in (x0, y0, x1, y1))

    x0, y0 = max(0.0, x0 - pad), max(0.0, y0 - pad)
    x1, y1 = min(1.0, x1 + pad), min(1.0, y1 + pad)
    if x1 - x0 < 0.02 or y1 - y0 < 0.02:
        return None
    if (x1 - x0) * (y1 - y0) > max_area:
        log.debug("bbox покрывает почти всю страницу — считаем мусором")
        return None

    w, h = img.size
    box = (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))
    if box[2] - box[0] < 24 or box[3] - box[1] < 24:
        return None
    return img.crop(box)


# ============================== SUPABASE ====================================

class SupabaseUploader:
    def __init__(self, url: str, key: str, bucket: str, enabled: bool = True) -> None:
        self.url = url.rstrip("/")
        self.key = key
        self.bucket = bucket
        self.enabled = bool(enabled and url and key and bucket)
        self._bucket_checked = False
        self._lock = threading.Lock()
        self._session = requests.Session()

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.key}", "apikey": self.key}

    def ensure_bucket(self) -> None:
        """Создаёт публичный бакет, если его нет (иначе загрузка молча 404-ит)."""
        with self._lock:
            if self._bucket_checked or not self.enabled:
                return
            self._bucket_checked = True
            try:
                r = self._session.get(f"{self.url}/storage/v1/bucket/{self.bucket}",
                                      headers=self._headers, timeout=20)
                if r.status_code == 200:
                    return
                if r.status_code == 404:
                    created = self._session.post(
                        f"{self.url}/storage/v1/bucket", headers=self._headers,
                        json={"name": self.bucket, "id": self.bucket, "public": True},
                        timeout=20,
                    )
                    if created.status_code in (200, 201):
                        log.info("создан публичный бакет %s", self.bucket)
                    else:
                        log.warning("не смог создать бакет %s: %s %s", self.bucket,
                                    created.status_code, created.text[:160])
                else:
                    log.warning("проверка бакета вернула %s: %s",
                                r.status_code, r.text[:160])
            except requests.RequestException as exc:
                log.warning("проверка бакета не удалась: %s", exc)

    def upload(self, img: Image.Image, subfolder: str, name: str,
               retries: int = 3) -> str | None:
        if not self.enabled:
            return None
        self.ensure_bucket()

        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=85, optimize=True)
        data = buf.getvalue()

        path = f"{subfolder}/{slugify(name)}.jpg"
        endpoint = f"{self.url}/storage/v1/object/{self.bucket}/{quote(path)}"
        headers = {**self._headers, "Content-Type": "image/jpeg", "x-upsert": "true"}

        for attempt in range(1, retries + 1):
            try:
                r = self._session.post(endpoint, headers=headers, data=data, timeout=45)
                if r.status_code in (200, 201):
                    return (f"{self.url}/storage/v1/object/public/"
                            f"{self.bucket}/{quote(path)}")
                if r.status_code in (400, 409):  # уже есть — дожимаем через PUT
                    r = self._session.put(endpoint, headers=headers, data=data, timeout=45)
                    if r.status_code in (200, 201):
                        return (f"{self.url}/storage/v1/object/public/"
                                f"{self.bucket}/{quote(path)}")
                log.warning("[supabase %s] %s: %s", attempt, r.status_code, r.text[:160])
            except requests.RequestException as exc:
                log.warning("[supabase %s] сеть: %s", attempt, exc)
            time.sleep(2 * attempt)
        return None


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("_")
    return (value or "file")[:120]


# ============================== ПРОМПТЫ =====================================

PERIOD_FALLBACK_PROMPT = (
    "Look at this cover/first page of an SAT practice test. "
    'Return ONLY a JSON object like {"period": "June 2025", "version": "US Version A"} '
    "where period is the month and year of this test administration and version is the "
    "form/version label if printed. Use null for anything you cannot determine."
)

PERIOD_SCHEMA = {
    "type": "object",
    "properties": {"period": {"type": "string"}, "version": {"type": "string"}},
}

EXTRACT_PROMPT = r"""
You are extracting real SAT practice-test questions from scanned test pages
(images provided, in page order).

Return ONLY a JSON array. Each element is one full question:

{
  "type": "EBRW_MCQ" | "MATH_MCQ" | "MATH_OPEN",
  "question_number": 12,          // the number printed next to the question, null if absent
  "module": "Module 1",           // section/module label if visible, else ""
  "module_total": 27,             // total declared in the module header ("27 QUESTIONS"), else null
  "passage": "reading passage text if present, else empty string",
  "question": "the question text itself (without the answer options)",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},   // omit for MATH_OPEN
  "correct_answer": "A" | "B" | "C" | "D" | numeric answer for MATH_OPEN | null,
  "topic": "broad subject area, e.g. Algebra, Geometry, Statistics, Advanced Math, Reading & Writing",
  "page_index": 0,               // 0-based index of the image this question is printed on
  "has_image": true | false,
  "image_bbox": [x0, y0, x1, y1] | null,
  "image_page_index": 0
}

PAGE LAYOUT VARIES — DO NOT ASSUME ONE:
- These files come in every shape. A page may hold a single question, or be a
  screenshot collage of 5-6 separate questions. Never assume a fixed number.
- Each question is its own object in the array — never merge two questions into
  one, and never return just the first question of a page.
- Work page by page, top to bottom, left to right. For each page, first count how
  many separate question blocks it contains, then emit exactly that many objects
  with the correct "page_index".
- A question block = a question number + its text + its answer options (if any).
- A question may START on one page and CONTINUE on the next (its options can be
  split across the page break). Emit it once, with the page_index of the page
  where its number is printed, and include the text from both pages.

MODULE HEADERS:
- A module header looks like "Reading and Writing Module 1" / "Math Module 2",
  usually followed by a count like "27 QUESTIONS". Put that count in
  "module_total" for EVERY question of that module, not only the first one.
- A module header can appear in the MIDDLE of a page: the previous module's
  last question is above it and question 1 of the new module below it. When
  that happens the numbering restarts at 1 on the same page — transcribe the
  numbers exactly as printed, do not renumber them to keep them ascending.
- If no header is visible on these pages, use "" for module and null for
  module_total. Do not guess.

IMAGE RULES:
- image_bbox is normalized 0-1 coordinates ([0,0] = top-left) of ONLY the
  question's actual figure/graph/table, on the page named by image_page_index
  (0-based index into the images provided in THIS request).
- Exclude UI chrome: "Mark for Review" buttons, progress bars, toolbars, page
  numbers, and watermarks (e.g. "@CookingSAT", "@EliteXSAT").
- If the question has no figure, set has_image=false and image_bbox=null.
  Plain text, equations and answer options are NOT images.

COMPLETENESS — THIS IS CRITICAL:
- These pages are numbered/sequential questions from a real SAT test. Assume
  EVERY page (or pair of pages) contains a question unless it is clearly a
  cover page, instructions page, or blank page.
- Go through the images ONE BY ONE, in order, and extract every question you
  can find. Do not stop early, do not summarize, do not skip a question just
  because it resembles another one.
- Some questions may repeat ones from a previous request (batches overlap on
  purpose) — include them anyway, duplicates are filtered automatically.

FORMATTING RULES:
- Wrap ALL math expressions in $...$ (inline LaTeX):
  "x^2" -> "$x^2$", "1/9(x-4)^2" -> "$\frac{1}{9}(x-4)^2$", "sqrt(89)" -> "$\sqrt{89}$".
- Every MATH_MCQ / MATH_OPEN question and its options must use proper LaTeX
  commands (\frac, \sqrt, \pi, ...), never plain text like x^2 or 1/9.
- Transcribe text exactly as printed. Do not invent or "fix" questions.
- If a page has no complete question, skip it. Return [] if the batch has none.
"""

QUESTION_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": list(QTYPES)},
            "question_number": {"type": "integer", "nullable": True},
            "module": {"type": "string", "nullable": True},
            "module_total": {"type": "integer", "nullable": True},
            "passage": {"type": "string", "nullable": True},
            "question": {"type": "string"},
            "options": {
                "type": "object",
                "properties": {
                    "A": {"type": "string"}, "B": {"type": "string"},
                    "C": {"type": "string"}, "D": {"type": "string"},
                },
                "nullable": True,
            },
            "correct_answer": {"type": "string", "nullable": True},
            "topic": {"type": "string", "nullable": True},
            "page_index": {"type": "integer", "nullable": True},
            "has_image": {"type": "boolean"},
            "image_bbox": {"type": "array", "items": {"type": "number"}, "nullable": True},
            "image_page_index": {"type": "integer", "nullable": True},
        },
        "required": ["type", "question"],
    },
}

PAGE_COUNT_PROMPT = (
    "Count how many separate question blocks are printed on this page of an SAT "
    "practice test.\n"
    "A question block = a question number with its text, and its answer options "
    "if it has any. Count a block whose text starts on this page even if it "
    "continues onto the next page. Do not count a block that started on the "
    "previous page and merely finishes here.\n"
    "Do not transcribe anything — just count.\n"
    'Return ONLY {"questions_on_page": N}. Return 0 for a cover or instructions page.'
)

PAGE_COUNT_SCHEMA = {
    "type": "object",
    "properties": {"questions_on_page": {"type": "integer"}},
}

ANSWER_KEY_PROMPT = r"""
These pages are the answer key of an SAT practice test. Extract every printed
answer.

Return ONLY a JSON array of objects:
{
  "module": "Module 1",   // section/module label the answer belongs to, "" if none printed
  "number": 12,           // question number
  "answer": "B"           // letter for multiple choice, or the exact numeric/text answer
}

Include every answer visible on the pages, in order. Do not invent answers.
"""

ANSWER_KEY_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "module": {"type": "string", "nullable": True},
            "number": {"type": "integer"},
            "answer": {"type": "string"},
        },
        "required": ["number", "answer"],
    },
}


# ============================ РАЗБОР JSON ===================================

def strip_code_fences(text: str) -> str:
    t = text.strip()
    t = re.sub(r"^\s*```[a-zA-Z0-9]*\s*", "", t)
    t = re.sub(r"\s*```\s*$", "", t)
    return t.strip()


def slice_json_container(text: str) -> str:
    """Вырезает первый сбалансированный [...] или {...}, игнорируя скобки в строках."""
    start = None
    opener = closer = ""
    for i, ch in enumerate(text):
        if ch in "[{":
            start, opener = i, ch
            closer = "]" if ch == "[" else "}"
            break
    if start is None:
        return text

    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return text[start:]


def sanitize_json_backslashes(text: str) -> str:
    """Экранирует «голые» LaTeX-бэкслэши, которые ломают JSON.

    \\b \\f \\n \\r \\t — валидные JSON-escape'ы, но одновременно начала
    LaTeX-команд (\\boxed, \\frac, \\neq, \\right, \\times). Считаем их
    настоящими escape'ами, только если дальше не идёт буква.
    """
    unambiguous = set('"\\/')
    control_letters = set("bfnrt")

    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "\\" and i + 1 < n:
            nxt = text[i + 1]
            if nxt in unambiguous:
                out.append(ch); out.append(nxt); i += 2; continue
            if nxt in control_letters:
                following = text[i + 2] if i + 2 < n else ""
                if not following.isalpha():
                    out.append(ch); out.append(nxt); i += 2; continue
                out.append("\\\\"); i += 1; continue
            if nxt == "u" and re.match(r"^[0-9a-fA-F]{4}", text[i + 2:i + 6]):
                out.append(ch); out.append(nxt); i += 2; continue
            out.append("\\\\")
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def iter_top_level_objects(text: str) -> Iterator[str]:
    """Отдаёт куски `{...}` верхнего уровня — для поштучного спасения битого массива."""
    depth = 0
    start = None
    in_string = False
    escaped = False
    for i, ch in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                yield text[start:i + 1]
                start = None


# \frac — это ВАЛИДНЫЙ JSON: \f = form feed, дальше "rac". Поэтому json.loads
# не падает, а тихо превращает LaTeX в управляющие символы. Чиним обратно.
CONTROL_TO_LATEX = {"\x0c": "\\f", "\x08": "\\b", "\x0b": "\\v", "\x07": "\\a"}

# \t, \n, \r в тексте задач бывают настоящими, поэтому их разворачиваем обратно
# только перед началом реальной LaTeX-команды (\times, \neq, \right, ...).
CONTROL_LATEX_WORDS = {
    ("\t", "t"): r"(?:imes|heta|ext(?:bf|it)?|an|riangle|ilde|o)",
    ("\n", "n"): r"(?:eq|abla|ewline|otin|ot|orm|u)",
    ("\r", "r"): r"(?:ight|ho|angle|ceil|floor)",
}
CONTROL_LATEX_RE = [
    (ch, letter, re.compile(re.escape(ch) + words + r"\b"))
    for (ch, letter), words in CONTROL_LATEX_WORDS.items()
]


def repair_control_latex(value: str) -> str:
    for ch, replacement in CONTROL_TO_LATEX.items():
        if ch in value:
            value = value.replace(ch, replacement)
    for ch, letter, pattern in CONTROL_LATEX_RE:
        if ch in value:
            value = pattern.sub(lambda m: "\\" + letter + m.group(0)[1:], value)
    return value


def repair_structure(node: Any) -> Any:
    if isinstance(node, str):
        return repair_control_latex(node)
    if isinstance(node, list):
        return [repair_structure(x) for x in node]
    if isinstance(node, dict):
        return {k: repair_structure(v) for k, v in node.items()}
    return node


def coerce_list(data: Any) -> list[dict]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for value in data.values():
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]
        return [data]
    return []


def parse_json_payload(raw: str) -> list[dict] | None:
    """JSON -> починка бэкслэшей -> поштучное спасение. None, если совсем никак."""
    candidate = slice_json_container(strip_code_fences(raw))
    for text in (candidate, sanitize_json_backslashes(candidate)):
        try:
            return coerce_list(repair_structure(json.loads(text, strict=False)))
        except (json.JSONDecodeError, ValueError):
            continue

    salvaged: list[dict] = []
    for chunk in iter_top_level_objects(candidate):
        for text in (chunk, sanitize_json_backslashes(chunk)):
            try:
                obj = json.loads(text, strict=False)
            except (json.JSONDecodeError, ValueError):
                continue
            if isinstance(obj, dict):
                salvaged.append(repair_structure(obj))
            break
    if salvaged:
        log.warning("JSON битый, спасено объектов: %d", len(salvaged))
        return salvaged
    return None


def ask_model_json(pool: ModelPool, parts: list[Any], schema: dict | None,
                   context: str, debug_log: Path | None) -> tuple[list[dict], bool]:
    """-> (объекты, был ли ответ обрезан по лимиту токенов)."""
    truncated = False
    try:
        raw = pool.generate(parts, schema)
    except TruncatedResponse as exc:
        raw, truncated = exc.text, True

    parsed = parse_json_payload(raw)
    if parsed is not None:
        return parsed, truncated
    if truncated:
        # Чинить обрезанный JSON бессмысленно — конца у него просто нет.
        dump_failed_batch(debug_log, raw, context + " (обрезан)")
        return [], True

    fix_prompt = (
        "The following text was supposed to be a valid JSON array but failed to parse. "
        "A common cause is unescaped backslashes inside LaTeX math (e.g. \\frac, \\sqrt) — "
        "every backslash inside a JSON string must be doubled. "
        "Return ONLY the corrected, valid JSON array:\n\n" + raw[:12000]
    )
    for _ in range(JSON_FIX_RETRIES):
        try:
            fixed = pool.generate([fix_prompt], schema)
        except StopAllModels:
            raise
        except TruncatedResponse:
            return [], True
        except Exception as exc:
            log.warning("починка JSON не удалась: %s", str(exc)[:150])
            continue
        parsed = parse_json_payload(fixed)
        if parsed is not None:
            return parsed, False

    log.error("JSON не разобран, батч пропущен (%s)", context)
    dump_failed_batch(debug_log, raw, context)
    return [], False


def dump_failed_batch(debug_log: Path | None, raw: str, context: str) -> None:
    if not debug_log:
        return
    try:
        with open(debug_log, "a", encoding="utf-8") as fh:
            fh.write(f"\n\n===== FAILED BATCH {context} =====\n")
            fh.write(raw[:8000])
    except OSError:
        pass


# ======================= НОРМАЛИЗАЦИЯ ВОПРОСОВ ==============================

MATH_HINT = re.compile(r"\b(math|algebra|geometry|trigonometr|statistic|equation)\b", re.I)


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    text = text.replace(" ", " ").replace("−", "-")
    # \( ... \) и \[ ... \] -> $...$ / $$...$$
    text = re.sub(r"\\\((.+?)\\\)", r"$\1$", text, flags=re.S)
    text = re.sub(r"\\\[(.+?)\\\]", r"$$\1$$", text, flags=re.S)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_type(raw_type: Any, options: dict, topic: str, question: str) -> str | None:
    t = str(raw_type or "").upper().replace("-", "_").replace(" ", "_")
    has_options = len(options) >= 2

    if "OPEN" in t or "GRID" in t or "SPR" in t:
        return "MATH_OPEN" if not has_options else "MATH_MCQ"
    if "MATH" in t:
        return "MATH_MCQ" if has_options else "MATH_OPEN"
    if "EBRW" in t or "READ" in t or "WRIT" in t or "VERBAL" in t or "ENGLISH" in t:
        return "EBRW_MCQ" if has_options else None
    # Тип не распознан — решаем по содержимому.
    if MATH_HINT.search(topic) or MATH_HINT.search(question[:200]):
        return "MATH_MCQ" if has_options else "MATH_OPEN"
    return "EBRW_MCQ" if has_options else None


def normalize_options(raw: Any) -> dict[str, str]:
    options: dict[str, str] = {}
    if isinstance(raw, dict):
        items = raw.items()
    elif isinstance(raw, list):
        items = zip("ABCD", raw)
    else:
        return options
    for key, value in items:
        letter = str(key).strip().upper()[:1]
        if letter in "ABCD":
            text = clean_text(value)
            # Модель иногда дублирует букву: "A) 12" -> "12"
            text = re.sub(r"^\(?[A-D][).:]\s+", "", text)
            if text:
                options[letter] = text
    return options


def normalize_answer(raw: Any, qtype: str, options: dict[str, str]) -> str:
    answer = clean_text(raw)
    if not answer or answer.lower() in {"null", "none", "n/a", "unknown"}:
        return ""
    if qtype == "MATH_OPEN":
        return answer
    letter = answer.strip().strip("().: ").upper()
    if len(letter) == 1 and letter in "ABCD":
        return letter
    m = re.match(r"^\(?([A-D])[).:]", answer.strip(), re.I)
    if m:
        return m.group(1).upper()
    # Модель вернула текст варианта — ищем совпадение среди опций.
    for key, value in options.items():
        if value and value.strip().lower() == answer.strip().lower():
            return key
    return answer


@dataclass
class Question:
    qtype: str
    question: str
    passage: str = ""
    options: dict[str, str] = field(default_factory=dict)
    correct_answer: str = ""
    topic: str = ""
    number: int | None = None
    module: str = ""
    module_total: int | None = None   # «27 QUESTIONS» из заголовка модуля
    has_image: bool = False
    bbox: list[float] | None = None
    page_index: int | None = None    # страница PDF с самим вопросом (0-based)
    image_page: int | None = None    # страница PDF с рисунком (обычно та же)


# Абсолютные номера страниц кладём в raw ещё до нормализации: батч могли
# раздробить, и локальные индексы модели относятся уже к подбатчу.
ABS_PAGE_KEY = "_abs_page"
ABS_IMAGE_PAGE_KEY = "_abs_image_page"
PAGE_EXPLICIT_KEY = "_page_explicit"   # модель сама указала страницу, не догадка


def attach_absolute_pages(rows: list[dict], pages: Sequence[PageImage]) -> list[dict]:
    """Переводит page_index/image_page_index модели в номера страниц PDF."""
    def resolve(value: Any, default: int) -> int:
        try:
            local = int(value)
        except (TypeError, ValueError):
            return default
        if 0 <= local < len(pages):
            return pages[local].index
        return default

    fallback = pages[0].index if pages else 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        raw_index = row.get("page_index")
        row[PAGE_EXPLICIT_KEY] = isinstance(raw_index, (int, float)) or (
            isinstance(raw_index, str) and raw_index.strip().isdigit())
        row[ABS_PAGE_KEY] = resolve(raw_index, fallback)
        row[ABS_IMAGE_PAGE_KEY] = resolve(row.get("image_page_index"), row[ABS_PAGE_KEY])
    return rows


def normalize_question(raw: dict, pages: Sequence[PageImage]) -> Question | None:
    question_text = clean_text(raw.get("question"))
    if len(question_text) < 8:
        return None

    options = normalize_options(raw.get("options"))
    topic = clean_text(raw.get("topic"))
    qtype = normalize_type(raw.get("type"), options, topic, question_text)
    if qtype not in QTYPES:
        return None
    if qtype != "MATH_OPEN" and len(options) < 2:
        return None  # «MCQ» без вариантов — почти всегда мусор/обрывок
    if qtype == "MATH_OPEN":
        options = {}

    number = raw.get("question_number")
    try:
        number = int(number) if number is not None else None
    except (TypeError, ValueError):
        number = None
    if number is not None and not (0 < number <= 60):
        number = None

    module_total = raw.get("module_total")
    try:
        module_total = int(module_total) if module_total is not None else None
    except (TypeError, ValueError):
        module_total = None
    if module_total is not None and not (0 < module_total <= 100):
        module_total = None

    bbox = raw.get("image_bbox")
    bbox = list(bbox) if isinstance(bbox, (list, tuple)) and len(bbox) == 4 else None
    has_image = bool(raw.get("has_image")) and bbox is not None

    known = {p.index for p in pages}
    page_index = raw.get(ABS_PAGE_KEY)
    if page_index not in known:
        page_index = pages[0].index if pages else None
    image_page = raw.get(ABS_IMAGE_PAGE_KEY)
    if image_page not in known:
        image_page = page_index
    if has_image and image_page is None:
        has_image, bbox = False, None

    return Question(
        qtype=qtype,
        question=question_text,
        passage=clean_text(raw.get("passage")),
        options=options,
        correct_answer=normalize_answer(raw.get("correct_answer"), qtype, options),
        topic=topic,
        number=number,
        module=clean_text(raw.get("module")),
        module_total=module_total,
        has_image=has_image,
        bbox=bbox,
        page_index=page_index,
        image_page=image_page,
    )


def fingerprint(passage: Any, question: Any, options: Any = None) -> str:
    """Отпечаток вопроса для дедупа: passage + текст вопроса + варианты.

    Только по тексту вопроса дедупить нельзя. В Reading & Writing десятки
    вопросов сформулированы ДОСЛОВНО одинаково («Which choice completes the
    text with the most logical and precise word or phrase?») и различаются
    исключительно passage — по одному стему половина модуля схлопнулась бы
    в одну строку. Варианты ответа в отпечатке страхуют короткие
    математические вопросы, у которых и формулировка совпадает.

    Отпечаток намеренно «широкий»: лишняя строка в CSV видна и правится,
    а молча потерянный вопрос — нет. От повторов из перекрытия батчей есть
    второй ключ, по номеру и странице.
    """
    if isinstance(options, dict):
        chosen = " ".join(str(options.get(letter, "")) for letter in ("A", "B", "C", "D"))
    else:
        chosen = " ".join(str(value) for value in options) if options else ""
    joined = f"{passage or ''} {question or ''} {chosen}"
    return re.sub(r"[^a-z0-9]+", "", joined.lower())[:400]


def dedup_key(q: Question, source: str) -> tuple:
    return (source, q.qtype, fingerprint(q.passage, q.question, q.options))


def number_key(q: Question, source: str) -> tuple | None:
    """Второй, независимый ключ дедупа: номер вопроса на конкретной странице.

    Страница в ключе обязательна. Без неё вопрос №5 второго модуля считается
    повтором вопроса №5 первого: в цифровом SAT нумерация в каждом модуле
    начинается с единицы, а лейбл модуля модель отдаёт не всегда.
    Повтор из перекрытия батчей — это один и тот же номер на одной и той же
    странице, так что от перекрытий ключ по-прежнему защищает.
    """
    if q.number is None or q.page_index is None:
        return None
    return (source, q.qtype, q.module.lower(), q.number, q.page_index)


# ============================== ОТВЕТЫ (KEYS) ===============================

def find_answer_key(question_pdf: Path, answer_keys: Sequence[Path]) -> Path | None:
    """Подбирает ключ ответов к варианту по «очищенному» имени файла."""
    def norm(name: str) -> str:
        name = re.sub(r"\b(answers?|ans|keys?|solutions?|scoring)\b", " ", name, flags=re.I)
        return re.sub(r"[^a-z0-9]+", "", name.lower())

    target = norm(question_pdf.stem)
    if not target:
        return None

    # Варианты разложены по папкам-периодам, так что ключ из той же папки
    # почти всегда правильный, а из чужой — почти всегда нет.
    same_dir = [k for k in answer_keys if k.parent == question_pdf.parent]
    for scope in (same_dir, list(answer_keys)):
        best: tuple[int, Path] | None = None
        for key in scope:
            candidate = norm(key.stem)
            if not candidate:
                continue
            if candidate == target:
                return key
            if candidate in target or target in candidate:
                score = min(len(candidate), len(target))
                if best is None or score > best[0]:
                    best = (score, key)
        if best:
            return best[1]
        if scope is same_dir and len(same_dir) == 1:
            return same_dir[0]   # в папке ровно один ключ — он и есть нужный
    return None


def parse_answer_key(pool: ModelPool, pdf: Path, batch_size: int,
                     debug_log: Path | None) -> dict[tuple[str, int], str]:
    """-> {(module_lower, number): answer}. Модуль может быть ''."""
    answers: dict[tuple[str, int], str] = {}
    ambiguous: set[tuple[str, int]] = set()
    doc = fitz.open(pdf)
    try:
        for start in range(0, len(doc), batch_size):
            pages = [render_page(doc, i)
                     for i in range(start, min(start + batch_size, len(doc)))]
            parts: list[Any] = [ANSWER_KEY_PROMPT]
            parts += [pool.backend.image_part(p.jpeg) for p in pages]
            rows, _ = ask_model_json(pool, parts, ANSWER_KEY_SCHEMA,
                                     f"{pdf.name} key p{start + 1}", debug_log)
            for row in rows:
                try:
                    number = int(row.get("number"))
                except (TypeError, ValueError):
                    continue
                answer = clean_text(row.get("answer"))
                if not answer:
                    continue
                module = clean_text(row.get("module")).lower()
                key = (module, number)
                if key in answers and answers[key] != answer:
                    ambiguous.add(key)
                answers[key] = answer
    finally:
        doc.close()

    for key in ambiguous:
        answers.pop(key, None)
    return answers


def apply_answer_key(q: Question, answers: dict[tuple[str, int], str]) -> bool:
    if q.correct_answer or q.number is None or not answers:
        return False
    module = q.module.lower()
    candidates = [value for (mod, num), value in answers.items()
                  if num == q.number and (not module or not mod or mod == module)]
    unique = {c for c in candidates}
    if len(unique) != 1:
        return False
    q.correct_answer = normalize_answer(unique.pop(), q.qtype, q.options)
    return True


# ============================== ЗАПИСЬ CSV ==================================

FIELDS_MCQ = ["id", "source", "test_period", "test_version", "module", "question_number",
              "passage", "question", "option_a", "option_b", "option_c", "option_d",
              "correct_answer", "topic", "has_image", "image_url", "page"]
FIELDS_OPEN = ["id", "source", "test_period", "test_version", "module", "question_number",
               "passage", "question", "correct_answer", "topic", "has_image",
               "image_url", "page"]

CSV_FIELDS = {"EBRW_MCQ": FIELDS_MCQ, "MATH_MCQ": FIELDS_MCQ, "MATH_OPEN": FIELDS_OPEN}
CSV_NAMES = {"EBRW_MCQ": "ebrw_mcq.csv", "MATH_MCQ": "math_mcq.csv",
             "MATH_OPEN": "math_open.csv"}
SUBFOLDERS = {"EBRW_MCQ": "ebrw", "MATH_MCQ": "math_mcq", "MATH_OPEN": "math_open"}


class CsvSink:
    """Три CSV + счётчики id + дедуп. Пишет только главный поток."""

    def __init__(self, out_dir: Path, resume: bool) -> None:
        self.paths = {k: out_dir / name for k, name in CSV_NAMES.items()}
        self.handles: dict[str, Any] = {}
        self.writers: dict[str, csv.DictWriter] = {}
        self.counters: dict[str, int] = {}
        self.seen: set[tuple] = set()
        self.seen_numbers: set[tuple] = set()
        self.resume = resume

        for qtype, path in self.paths.items():
            append = resume and path.exists()
            if append:
                self._check_header(path, CSV_FIELDS[qtype])
            fh = open(path, "a" if append else "w", newline="", encoding="utf-8")
            writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS[qtype], extrasaction="ignore")
            if not append:
                writer.writeheader()
            self.handles[qtype] = fh
            self.writers[qtype] = writer
            self.counters[qtype] = self._load_existing(path, qtype) if append else 0

    @staticmethod
    def _check_header(path: Path, fields: Sequence[str]) -> None:
        with open(path, newline="", encoding="utf-8") as fh:
            header = next(csv.reader(fh), [])
        if header and header != list(fields):
            raise SystemExit(
                f"{path} создан старой версией скрипта (другие колонки).\n"
                f"Запусти с новым --output или удали старые CSV."
            )

    def _load_existing(self, path: Path, qtype: str) -> int:
        rows = 0
        with open(path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                rows += 1
                options = {letter: row.get(f"option_{letter.lower()}", "")
                           for letter in ("A", "B", "C", "D")}
                self.seen.add((row.get("source", ""), qtype,
                               fingerprint(row.get("passage"), row.get("question"),
                                           options)))
                number = (row.get("question_number") or "").strip()
                page = (row.get("page") or "").strip()
                if number.isdigit() and page.isdigit():
                    self.seen_numbers.add((row.get("source", ""), qtype,
                                           (row.get("module") or "").lower(),
                                           int(number), int(page) - 1))
        return rows

    def is_duplicate(self, q: Question, source: str) -> bool:
        if dedup_key(q, source) in self.seen:
            return True
        nkey = number_key(q, source)
        return bool(nkey and nkey in self.seen_numbers)

    def write(self, q: Question, source: str, period: str, version: str,
              image_url: str) -> int:
        self.seen.add(dedup_key(q, source))
        nkey = number_key(q, source)
        if nkey:
            self.seen_numbers.add(nkey)

        self.counters[q.qtype] += 1
        row = {
            "id": self.counters[q.qtype],
            "source": source,
            "test_period": period,
            "test_version": version,
            "module": q.module,
            "question_number": q.number if q.number is not None else "",
            "passage": q.passage,
            "question": q.question,
            "correct_answer": q.correct_answer,
            "topic": q.topic,
            # has_image — что на странице есть рисунок, image_url — что мы его
            # сохранили. Расхождение = вопрос, который стоит проверить руками.
            "has_image": q.has_image,
            "image_url": image_url,
            "page": (q.page_index + 1) if q.page_index is not None else "",
        }
        if q.qtype != "MATH_OPEN":
            row.update({
                "option_a": q.options.get("A", ""), "option_b": q.options.get("B", ""),
                "option_c": q.options.get("C", ""), "option_d": q.options.get("D", ""),
            })
        self.writers[q.qtype].writerow(row)
        return self.counters[q.qtype]

    def flush(self) -> None:
        for fh in self.handles.values():
            fh.flush()

    def close(self) -> None:
        for fh in self.handles.values():
            fh.close()


# ============================== СОСТОЯНИЕ ===================================

class RunState:
    """Прогресс по батчам, чтобы --resume не перечитывал файл с начала."""

    def __init__(self, path: Path, enabled: bool, signature: str) -> None:
        self.path = path
        self.enabled = enabled
        self.data: dict[str, Any] = {"signature": signature, "files": {}}
        if enabled and path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                loaded.setdefault("files", {})
                if loaded.get("signature") != signature:
                    # Изменились --batch/--overlap: номера батчей больше не
                    # совпадают, но полностью готовые файлы всё ещё готовы.
                    log.warning("разбиение на батчи изменилось — "
                                "недоделанные файлы будут перечитаны целиком")
                    for entry in loaded["files"].values():
                        entry["batches"] = []
                    loaded["signature"] = signature
                self.data = loaded
            except (json.JSONDecodeError, OSError):
                log.warning("не смог прочитать %s, начинаю прогресс заново", path)

    def done_batches(self, source: str) -> set[int]:
        entry = self.data["files"].get(source, {})
        return set(entry.get("batches", []))

    def is_file_done(self, source: str) -> bool:
        return bool(self.data["files"].get(source, {}).get("done"))

    def covered_pages(self, source: str) -> set[int]:
        """Страницы, с которых уже что-то извлекли (переживает перезапуск)."""
        return set(self.data["files"].get(source, {}).get("covered", []))

    def file_plan(self, source: str) -> dict | None:
        """Размер батча, подобранный для этого файла на прошлом запуске.

        Без этого --resume перемерил бы плотность заново и мог получить
        другой батч — номера батчей поехали бы, и файл перечитался целиком.
        """
        plan = self.data["files"].get(source, {}).get("plan")
        if isinstance(plan, dict) and "batch" in plan and "probe" in plan:
            return plan
        return None

    def set_file_plan(self, source: str, batch: int, probe: int) -> None:
        self._entry(source)["plan"] = {"batch": batch, "probe": probe}
        self.save()

    def mark_batch(self, source: str, batch_index: int,
                   covered: Iterable[int] = ()) -> None:
        entry = self._entry(source)
        if batch_index not in entry["batches"]:
            entry["batches"].append(batch_index)
        entry["covered"] = sorted(set(entry.get("covered", [])) | set(covered))
        self.save()

    def mark_covered(self, source: str, covered: Iterable[int]) -> None:
        entry = self._entry(source)
        entry["covered"] = sorted(set(entry.get("covered", [])) | set(covered))
        self.save()

    def _entry(self, source: str) -> dict:
        return self.data["files"].setdefault(
            source, {"batches": [], "covered": [], "done": False})

    def mark_file(self, source: str) -> None:
        self._entry(source)["done"] = True
        self.save()

    def save(self) -> None:
        try:
            self.path.write_text(json.dumps(self.data, ensure_ascii=False, indent=1),
                                 encoding="utf-8")
        except OSError as exc:
            log.debug("состояние не сохранено: %s", exc)


# ============================== ОСНОВНОЙ ЦИКЛ ===============================

def plan_batches(n_pages: int, batch_size: int, overlap: int,
                 first_page: int = 0) -> list[tuple[int, int]]:
    step = max(1, batch_size - overlap)
    batches: list[tuple[int, int]] = []
    start = first_page
    while start < n_pages:
        end = min(start + batch_size, n_pages)
        batches.append((start, end))
        if end >= n_pages:
            break
        start += step
    return batches


# Автоподбор батча. Файлы приходят очень разные: где-то один вопрос на лист,
# где-то шесть скриншотов на странице. Гнать и то и другое одним размером
# батча нельзя: на плотных листах модель выдыхается и отдаёт первые два
# вопроса, на редких — впустую тратится запрос на страницу.
AUTO_TARGET_QUESTIONS = 6   # столько вопросов за запрос считаем комфортными
AUTO_MAX_BATCH = 6
AUTO_PROBE_PAGES = 3        # сколько страниц смотрим поодиночке, чтобы замерить
AUTO_FALLBACK_BATCH = 2     # если проба ничего не нашла


def choose_batch(density: float) -> int:
    """Сколько страниц класть в запрос при такой плотности вопросов."""
    if density <= 0:
        return AUTO_FALLBACK_BATCH
    return max(1, min(AUTO_MAX_BATCH, round(AUTO_TARGET_QUESTIONS / density)))


def run_ordered(fn, items: Sequence[Any], executor: ThreadPoolExecutor | None,
                concurrency: int) -> Iterator[Any]:
    """Выполняет fn по items, отдавая результаты строго по порядку.

    Одновременно «в полёте» не больше concurrency+1 задач: иначе
    ThreadPoolExecutor.map поставил бы в очередь все батчи сразу и
    накопил бы в памяти полноразмерные рендеры всего PDF.
    """
    if executor is None:
        for item in items:
            yield fn(item)
        return

    pending: deque = deque()
    it = iter(items)
    try:
        for item in it:
            pending.append(executor.submit(fn, item))
            if len(pending) <= concurrency:
                continue
            yield pending.popleft().result()
        while pending:
            yield pending.popleft().result()
    finally:
        for future in pending:
            future.cancel()


def detect_period_via_gemini(pool: ModelPool, page: PageImage,
                             debug_log: Path | None) -> tuple[str | None, str | None]:
    try:
        parts = [PERIOD_FALLBACK_PROMPT, pool.backend.image_part(page.jpeg)]
        rows, _ = ask_model_json(pool, parts, PERIOD_SCHEMA, "period", debug_log)
        if rows:
            data = rows[0]
            return (clean_text(data.get("period")) or None,
                    clean_text(data.get("version")) or None)
    except StopAllModels:
        raise
    except Exception as exc:
        log.warning("определение периода не удалось: %s", str(exc)[:150])
    return None, None


def count_questions_on_page(pool: ModelPool, page: PageImage,
                            debug_log: Path | None) -> int:
    """Спрашивает у модели, сколько вопросов на странице. 0 — не смогла.

    Отдельный вопрос, потому что считать блоки модель умеет заметно лучше,
    чем переписывать их: на плотном листе она вернёт 6 вопросов в счёте,
    даже если при обычном извлечении осилит только два. Именно по этому
    числу и подбирается размер батча.
    """
    try:
        parts = [PAGE_COUNT_PROMPT, pool.backend.image_part(page.jpeg)]
        rows, _ = ask_model_json(pool, parts, PAGE_COUNT_SCHEMA, "подсчёт", debug_log)
        if rows:
            value = int(rows[0].get("questions_on_page") or 0)
            return value if 0 <= value <= 40 else 0
    except StopAllModels:
        raise
    except Exception as exc:
        log.debug("подсчёт вопросов на странице не удался: %s", str(exc)[:150])
    return 0


def extract_from_pages(pool: ModelPool, pages: Sequence[PageImage],
                       args: argparse.Namespace, context: str) -> list[dict]:
    """Вытаскивает вопросы со страниц, дробя батч, если ответ обрезало.

    Обрыв по токенам — главная причина «мало вопросов»: модель начинает
    перечислять и упирается в лимит, а хвост страниц просто теряется.
    Половиним батч и добираем остаток, пока не дойдём до одной страницы.
    """
    parts: list[Any] = [EXTRACT_PROMPT]
    parts += [pool.backend.image_part(p.jpeg) for p in pages]
    rows, truncated = ask_model_json(pool, parts, QUESTION_SCHEMA, context, args.debug_log)

    if truncated and len(pages) > 1:
        mid = len(pages) // 2
        log.warning("%s: ответ обрезан по лимиту токенов, делю на %d + %d страниц",
                    context, mid, len(pages) - mid)
        left = extract_from_pages(pool, pages[:mid], args,
                                  f"{context} [1-{mid}]")
        right = extract_from_pages(pool, pages[mid:], args,
                                   f"{context} [{mid + 1}-{len(pages)}]")
        return left + right

    if truncated:
        log.warning("%s: ответ обрезан даже на одной странице — спасено %d вопросов. "
                    "Если страница плотная, поможет --dpi/--api-max-side побольше",
                    context, len(rows))

    return attach_absolute_pages(rows, pages)


GAP_PROMPT_TEMPLATE = (
    "FOCUS PASS. A previous pass over these exact pages missed the questions "
    "numbered {numbers}. Extract ONLY those questions, in the same JSON format.\n"
    "Look carefully: a missed question is usually squeezed into a corner, split "
    "across two columns, or visually glued to the question above it. If one of "
    "these numbers is genuinely not printed on these pages, just omit it. "
    "Return [] if none of them are here.\n"
)

# Цифровой SAT: модуль Reading & Writing — 27 вопросов, модуль Math — 22.
# Размер считаем по СЕКЦИИ, а не по типу вопроса: внутри математического
# модуля нумерация 1-22 сквозная, а MATH_MCQ и MATH_OPEN идут вперемешку —
# отдельным «модулем MATH_OPEN на 22 вопроса» их считать нельзя.
FAMILY = {"EBRW_MCQ": "EBRW", "MATH_MCQ": "MATH", "MATH_OPEN": "MATH"}
EXPECTED_MODULE_SIZE = {"EBRW": 27, "MATH": 22}

MODULE_RESTART_MAX = 3       # новый модуль начинается с номера не больше этого
MODULE_MIN_BEFORE_RESET = 8  # ...и только если до него нумерация ушла так далеко
MIN_KNOWN_FOR_EXPECTED = 3   # сколько номеров нужно, чтобы поверить в размер модуля
STANDARD_SIZE_TOLERANCE = 4  # насколько модуль может не дотянуть до штатных 27/22
GAP_PAGE_SPAN = 3            # максимум страниц в одном доборе


@dataclass
class Sighting:
    """Факт «видели вопрос №n на странице p». Копится ДО дедупа."""
    number: int
    page: int
    qtype: str
    label: str = ""
    total: int | None = None      # объявленный размер модуля, если напечатан


@dataclass
class Module:
    """Один модуль теста: сплошной диапазон страниц со своей нумерацией."""
    family: str
    label: str
    numbers: dict[int, int] = field(default_factory=dict)   # номер -> страница
    declared_total: int | None = None    # «27 QUESTIONS» из заголовка

    @property
    def max_number(self) -> int:
        return max(self.numbers) if self.numbers else 0

    @property
    def first_page(self) -> int:
        return min(self.numbers.values()) if self.numbers else 0

    @property
    def last_page(self) -> int:
        return max(self.numbers.values()) if self.numbers else 0


def _starts_new_module(current: Module, seen: Sighting) -> bool:
    """Начался ли на этом вопросе новый модуль.

    Опираемся в первую очередь на рестарт нумерации: в цифровом SAT каждый
    модуль начинает счёт с единицы. Лейбл модуля («Math Module 2») — только
    подтверждение: он напечатан лишь на заголовке модуля, и со страницы
    в середине модуля модель вернёт пустую строку.

    Проверять «этот номер уже есть в модуле» здесь нельзя: на границе
    модулей номер как раз повторяется (после 27 идёт снова 1), и такая
    проверка склеила бы оба модуля в один.
    """
    if seen.number > current.max_number:
        return False                       # нумерация просто продолжается
    label_changed = bool(seen.label and current.label and seen.label != current.label)
    restarted = (seen.number <= MODULE_RESTART_MAX
                 and current.max_number >= MODULE_MIN_BEFORE_RESET)
    return restarted or label_changed


def split_modules(sightings: Sequence[Sighting]) -> list[Module]:
    """Режет поток найденных вопросов на модули.

    Ключ — не лейбл, а нумерация. Полный тест это R&W Module 1 (1-27),
    R&W Module 2 (1-27), Math Module 1 (1-22), Math Module 2 (1-22): номера
    повторяются четыре раза, и если считать модулем «всё с лейблом Module 1»
    (а тем более «всё с пустым лейблом»), три четверти теста выглядят
    повтором первого модуля и никаких дырок в нумерации не видно.
    """
    modules: list[Module] = []
    by_family: dict[str, list[Sighting]] = {}
    for seen in sightings:
        by_family.setdefault(FAMILY.get(seen.qtype, seen.qtype), []).append(seen)

    for family, items in by_family.items():
        # Страница -> {номер: наблюдение}. Повторы из перекрытия батчей
        # схлопываем здесь, чтобы порядок обхода не зависел от того, сколько
        # раз модель показала одну и ту же страницу.
        by_page: dict[int, dict[int, Sighting]] = {}
        for seen in items:
            page = by_page.setdefault(seen.page, {})
            known = page.get(seen.number)
            # Из нескольких наблюдений одного номера берём самое содержательное:
            # лейбл и размер модуля модель отдаёт не с каждой страницы.
            if known is None:
                page[seen.number] = seen
            else:
                known.label = known.label or seen.label
                known.total = known.total or seen.total

        current: Module | None = None
        for page in sorted(by_page):
            numbers = by_page[page]
            # Модуль может кончиться ПОСРЕДИ страницы: в оригинале после
            # матвопроса №22 сразу идёт заголовок Module 2 и вопрос №1.
            # Поэтому сначала дочитываем текущий модуль (номера больше уже
            # виденного), и только потом смотрим на рестарт нумерации.
            reached = current.max_number if current else 0
            order = (sorted(n for n in numbers if n > reached)
                     + sorted(n for n in numbers if n <= reached))
            for number in order:
                seen = numbers[number]
                if current is None or _starts_new_module(current, seen):
                    current = Module(family=family, label=seen.label)
                    modules.append(current)
                current.numbers.setdefault(number, page)
                if seen.label and not current.label:
                    current.label = seen.label
                if seen.total and not current.declared_total:
                    current.declared_total = seen.total

    return sorted(modules, key=lambda m: (m.first_page, m.family))


def _looks_like_standard_test(modules: Sequence[Module]) -> bool:
    """Похож ли файл на обычный цифровой SAT (модули по 27 и 22 вопроса).

    Нужно, чтобы не тянуть 27/22 на файлы другого формата. Подборка задач на
    15 вопросов — законченный файл, а не «модуль, в котором потерялось 12
    штук»: без этой проверки парсер выпрашивал бы у модели несуществующие
    номера и писал бы их в отчёт о дырках.
    """
    for module in modules:
        expected = EXPECTED_MODULE_SIZE.get(module.family)
        if not expected:
            continue
        if module.declared_total == expected:
            return True
        # Ровно до 27 модуль мог и не дойти — как раз последних вопросов и
        # недосчитались. Поэтому засчитываем и «почти дотянул»: важно, что
        # нумерация подошла к штатному размеру, а не остановилась на 15.
        if expected - STANDARD_SIZE_TOLERANCE <= module.max_number <= expected:
            return True
    return False


def _module_bounds(modules: Sequence[Module], n_pages: int) -> list[tuple[Module, int, int]]:
    """Диапазон страниц каждого модуля — где искать его пропавшие вопросы."""
    bounds: list[tuple[Module, int, int]] = []
    for i, module in enumerate(modules):
        start = max(0, module.first_page - 1)     # заголовок модуля мог съесть страницу
        following = modules[i + 1].first_page - 1 if i + 1 < len(modules) else n_pages - 1
        end = min(n_pages - 1, max(module.last_page, following))
        bounds.append((module, start, max(start, end)))
    return bounds


def find_number_gaps(sightings: Sequence[Sighting], n_pages: int,
                     page_span: int = GAP_PAGE_SPAN) -> list[tuple[list[int], list[int]]]:
    """Ищет пропущенные номера вопросов. -> [(номера, страницы-кандидаты)].

    Вопросы в модуле пронумерованы подряд, поэтому дырка в нумерации — это
    доказательство пропажи, а не догадка. Ищем во всём диапазоне 1..размер
    модуля: пропасть может и первый вопрос, и весь хвост, а не только номер
    между двумя найденными.
    """
    plans: list[tuple[list[int], list[int]]] = []
    modules = split_modules(sightings)
    standard = _looks_like_standard_test(modules)

    for module, start_page, end_page in _module_bounds(modules, n_pages):
        known = sorted(module.numbers)
        if len(known) < 2:
            continue                       # слишком мало данных, чтобы судить

        limit = module.max_number
        if module.declared_total:
            # Сам файл сказал, сколько в модуле вопросов, — это точнее любых
            # догадок и работает на любом формате, не только на полном тесте.
            limit = max(limit, module.declared_total)
        elif standard and len(known) >= MIN_KNOWN_FOR_EXPECTED:
            limit = max(limit, EXPECTED_MODULE_SIZE.get(module.family, 0))

        missing = [n for n in range(1, limit + 1) if n not in module.numbers]
        if not missing:
            continue

        # Окно страниц для номера: между страницами ближайших найденных соседей.
        def window(number: int) -> tuple[int, int]:
            lower = [n for n in known if n < number]
            upper = [n for n in known if n > number]
            lo = module.numbers[lower[-1]] if lower else start_page
            hi = module.numbers[upper[0]] if upper else end_page
            if hi < lo:
                lo, hi = hi, lo
            return max(0, lo), min(n_pages - 1, hi)

        # Номера с одинаковым окном добираются одним запросом.
        groups: dict[tuple[int, int], list[int]] = {}
        for number in missing:
            groups.setdefault(window(number), []).append(number)

        for (lo, hi), numbers in groups.items():
            pages = list(range(lo, hi + 1))
            # Широкое окно режем на куски: десяток страниц в одном запросе
            # модель разбирает так же лениво, как и обычный батч.
            for i in range(0, len(pages), max(1, page_span)):
                plans.append((list(numbers), pages[i:i + max(1, page_span)]))

    # Разные модули могли попросить одни и те же страницы — это один запрос.
    merged: dict[tuple[int, ...], list[int]] = {}
    for numbers, pages in plans:
        key = tuple(pages)
        merged.setdefault(key, [])
        merged[key] += [n for n in numbers if n not in merged[key]]
    return [(sorted(numbers), list(pages))
            for pages, numbers in sorted(merged.items())]


def process_pdf(pdf_path: Path, pool: ModelPool, sink: CsvSink, state: RunState,
                uploader: SupabaseUploader, args: argparse.Namespace,
                period: str, version: str, source: str,
                answers: dict[tuple[str, int], str]) -> dict[str, int]:
    doc = fitz.open(pdf_path)
    stats = {"questions": 0, "duplicates": 0, "images": 0, "answers_filled": 0,
             "gaps": 0}
    try:
        render_lock = threading.Lock()
        sightings: list[Sighting] = []             # все увиденные номера, до дедупа

        def render(indexes: Sequence[int]) -> list[PageImage]:
            with render_lock:  # PyMuPDF не любит параллельный доступ к одному doc
                return [render_page(doc, i, args.dpi, args.api_max_side) for i in indexes]

        def store(raw_questions: list[dict], pages: Sequence[PageImage]) -> tuple[int, set]:
            """Пишет вопросы в CSV. -> (сколько записано, какие страницы покрыты)."""
            written = 0
            touched: set[int] = set()
            # Если модель не проставила page_index ни одному вопросу, привязать
            # их к страницам нечем. Значит и судить, что она что-то пропустила,
            # мы не можем: считаем показанные страницы разобранными, иначе
            # добор впустую перезапросит весь файл.
            if raw_questions and not any(r.get(PAGE_EXPLICIT_KEY) for r in raw_questions):
                touched |= {p.index for p in pages}

            for raw in raw_questions:
                q = normalize_question(raw, pages)
                if q is None:
                    continue
                # Страницу считаем разобранной, даже если вопрос оказался
                # дубликатом: значит модель её видела и что-то с неё достала.
                if q.page_index is not None:
                    touched.add(q.page_index)
                # Номера копим тоже до проверки на дубликат — иначе повтор
                # из перекрытия батчей выглядел бы как дырка в нумерации.
                if q.number is not None:
                    sightings.append(Sighting(
                        number=q.number,
                        page=q.page_index if q.page_index is not None else 0,
                        qtype=q.qtype,
                        label=q.module or "",
                        total=q.module_total))
                if sink.is_duplicate(q, source):
                    stats["duplicates"] += 1
                    continue
                if apply_answer_key(q, answers):
                    stats["answers_filled"] += 1

                image_url = ""
                if q.has_image and q.image_page is not None:
                    page = next((p for p in pages if p.index == q.image_page), None)
                    cropped = (crop_by_normalized_bbox(page.full, q.bbox, args.bbox_pad)
                               if page else None)
                    if cropped is not None:
                        name = f"{source}_{q.qtype.lower()}_{sink.counters[q.qtype] + 1}"
                        local_path = ""
                        if args.images_dir:
                            local_dir = Path(args.images_dir) / SUBFOLDERS[q.qtype]
                            local_dir.mkdir(parents=True, exist_ok=True)
                            target = local_dir / f"{slugify(name)}.jpg"
                            cropped.save(target, quality=88, optimize=True)
                            local_path = str(target)
                        image_url = uploader.upload(
                            cropped, SUBFOLDERS[q.qtype], name) or ""
                        # Без Supabase ссылкой служит локальный файл.
                        image_url = image_url or local_path
                        if image_url:
                            stats["images"] += 1
                    elif q.bbox:
                        log.debug("bbox отброшен как некорректный: %s", q.bbox)

                sink.write(q, source, build_test_period_label(period, version),
                           version or "", image_url)
                written += 1
                stats["questions"] += 1
            return written, touched

        def run_batch(item: tuple[int, tuple[int, int]]):
            batch_index, (start, end) = item
            pages = render(range(start, end))
            context = f"{source} стр. {start + 1}-{end}"
            return batch_index, (start, end), pages, extract_from_pages(
                pool, pages, args, context)

        def probe_density() -> tuple[int, float]:
            """Смотрит первые страницы поодиночке. -> (сколько посмотрел, плотность).

            Плотность берём как максимум по странице, а не среднее: обложка и
            страница с инструкцией занизили бы среднее, и на плотный файл
            встал бы слишком крупный батч.
            """
            best = 0.0
            looked = 0
            for index in range(min(AUTO_PROBE_PAGES, len(doc))):
                pages = render([index])
                raw = extract_from_pages(pool, pages, args,
                                         f"{source} проба стр. {index + 1}")
                written, touched = store(raw, pages)
                sink.flush()
                state.mark_batch(source, looked, touched | {index})
                looked += 1
                if args.delay:
                    time.sleep(args.delay)
                if not written:
                    continue       # обложка или страница с инструкцией
                # Само извлечение занижает плотность: на плотном листе модель
                # отдаёт первые два вопроса и останавливается. Поэтому берём
                # ещё и её же счёт блоков — считает она честнее.
                best = max(float(written),
                           float(count_questions_on_page(pool, pages[0], args.debug_log)))
                if args.delay:
                    time.sleep(args.delay)
                break
            return looked, best

        plan = state.file_plan(source)
        if plan:
            batch_size, probed = plan["batch"], plan["probe"]
        elif args.auto_batch:
            probed, density = probe_density()
            batch_size = choose_batch(density)
            log.info("%s: на странице примерно %g вопрос(ов) -> батч %d",
                     pdf_path.name, density, batch_size)
            state.set_file_plan(source, batch_size, probed)
        else:
            batch_size, probed = args.batch, 0

        overlap = min(args.overlap, batch_size - 1) if batch_size > 1 else 0
        batches = ([(i, i + 1) for i in range(probed)]
                   + plan_batches(len(doc), batch_size, overlap, first_page=probed))
        done = state.done_batches(source)
        todo = [(i, rng) for i, rng in enumerate(batches) if i not in done]
        log.info("%s: %d страниц, %d батчей по %d стр. (осталось %d), период: %s",
                 pdf_path.name, len(doc), len(batches), batch_size, len(todo),
                 build_test_period_label(period, version))

        pool_exec = (ThreadPoolExecutor(max_workers=args.concurrency)
                     if args.concurrency > 1 else None)
        try:
            for batch_index, (start, end), pages, raw_questions in run_ordered(
                    run_batch, todo, pool_exec, args.concurrency):
                written, touched = store(raw_questions, pages)
                log.info("  стр. %d-%d: +%d вопросов", start + 1, end, written)
                sink.flush()
                state.mark_batch(source, batch_index, touched)
                if args.delay:
                    time.sleep(args.delay)
        finally:
            if pool_exec:
                pool_exec.shutdown(wait=False, cancel_futures=True)

        # Добор: страницы, с которых не пришло ни одного вопроса. В батче из
        # нескольких страниц модель охотно «забывает» часть — поодиночке
        # такие страницы почти всегда отдаются нормально.
        if args.rescue:
            covered = state.covered_pages(source)
            missing = [i for i in range(len(doc)) if i not in covered]
            if missing:
                log.info("  добор страниц без вопросов: %d шт.", len(missing))
            for index in missing:
                pages = render([index])
                raw = extract_from_pages(pool, pages, args,
                                         f"{source} добор стр. {index + 1}")
                written, touched = store(raw, pages)
                if written:
                    log.info("    стр. %d: +%d вопросов (добор)", index + 1, written)
                sink.flush()
                state.mark_covered(source, touched | {index})
                if args.delay:
                    time.sleep(args.delay)

        # Добор по дыркам в нумерации. Страница могла отдать 2 вопроса из 3 —
        # предыдущий проход этого не заметит, а пропущенный номер заметит.
        if args.fill_gaps:
            budget = args.max_gap_requests
            asked: set[tuple] = set()      # что уже спрашивали — не повторяем
            for round_index in range(max(1, args.gap_rounds)):
                if budget <= 0:
                    break
                # Каждый следующий раунд сужает окно, вплоть до одной страницы
                # за запрос: раз пачкой вопрос не нашёлся, шансы даёт только
                # прицельный взгляд на конкретный лист.
                span = max(1, GAP_PAGE_SPAN - round_index)
                plans = [p for p in find_number_gaps(sightings, len(doc), span)
                         if (tuple(p[0]), tuple(p[1])) not in asked]
                if not plans:
                    break
                if len(plans) > budget:
                    log.warning("  дырок в нумерации много (%d), добираю первые %d",
                                len(plans), budget)
                    plans = plans[:budget]
                total = sum(len(numbers) for numbers, _ in plans)
                log.info("  добор по дыркам, раунд %d: %d номеров за %d запросов",
                         round_index + 1, total, len(plans))

                for numbers, page_indexes in plans:
                    asked.add((tuple(numbers), tuple(page_indexes)))
                    budget -= 1
                    pages = render(page_indexes)
                    label = ", ".join(str(n) for n in numbers)
                    parts: list[Any] = [EXTRACT_PROMPT,
                                        GAP_PROMPT_TEMPLATE.format(numbers=label)]
                    parts += [pool.backend.image_part(p.jpeg) for p in pages]
                    rows, _ = ask_model_json(
                        pool, parts, QUESTION_SCHEMA,
                        f"{source} добор №{label}", args.debug_log)
                    written, touched = store(attach_absolute_pages(rows, pages), pages)
                    log.info("    №%s (стр. %s): %s", label,
                             "-".join(str(i + 1) for i in (page_indexes[0], page_indexes[-1])),
                             f"+{written} вопросов" if written else "не найдены")
                    sink.flush()
                    state.mark_covered(source, touched)
                    if args.delay:
                        time.sleep(args.delay)

            remaining = find_number_gaps(sightings, len(doc))
            stats["gaps"] = len({n for numbers, _ in remaining for n in numbers})
            if remaining:
                report_gaps(args.gaps_report, source, remaining)
                log.warning("  осталось ненайденных номеров: %d (список в %s)",
                            stats["gaps"], args.gaps_report.name)
    finally:
        doc.close()
    return stats


def report_gaps(path: Path | None, source: str,
                remaining: list[tuple[list[int], list[int]]]) -> None:
    """Пишет список так и не найденных номеров — что проверить руками."""
    if not path:
        return
    numbers = sorted({n for group, _ in remaining for n in group})
    try:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(f"{source}: не найдены вопросы № "
                     f"{', '.join(str(n) for n in numbers)}\n")
    except OSError as exc:
        log.debug("отчёт о дырках не записан: %s", exc)


def collect_pdfs(folder: Path, recursive: bool) -> list[Path]:
    pattern = "**/*" if recursive else "*"
    unique: dict[str, Path] = {}
    for path in folder.glob(pattern):
        if path.is_file() and path.suffix.lower() == ".pdf":
            unique.setdefault(str(path).lower(), path)
    return sorted(unique.values(), key=lambda p: p.name.lower())


# ================================== CLI =====================================

def build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="SAT PDF -> CSV (+ Supabase Storage) через Gemini.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
        epilog=(
            "Ключи берутся из окружения или .env: GEMINI_API_KEY (или GOOGLE_API_KEY), "
            "SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET."
        ),
    )
    ap.add_argument("--folder", help="папка с PDF (не нужна только для --list-models)")
    ap.add_argument("--list-models", action="store_true",
                    help="показать ID моделей, доступных твоему ключу, и выйти")
    ap.add_argument("--output", default=None, help="папка для CSV (по умолчанию = --folder)")
    ap.add_argument("--batch", default="auto",
                    help="страниц в одном запросе; auto — подобрать по плотности "
                         "вопросов на странице, отдельно для каждого файла")
    ap.add_argument("--overlap", type=int, default=1, help="перекрытие батчей в страницах")
    ap.add_argument("--concurrency", type=int, default=1, help="батчей одновременно")
    ap.add_argument("--delay", type=float, default=0.5, help="пауза между батчами, сек")
    ap.add_argument("--resume", action="store_true", help="продолжить с места остановки")
    ap.add_argument("--limit", type=int, default=0, help="обработать только N файлов (0 = все)")
    ap.add_argument("--models", default="", help="список моделей через запятую")
    ap.add_argument("--sdk", choices=("auto", "new", "legacy"), default="auto")
    ap.add_argument("--dpi", type=int, default=RENDER_DPI, help="DPI рендера для кропов")
    ap.add_argument("--api-max-side", type=int, default=API_MAX_SIDE,
                    help="длинная сторона картинки для модели, px")
    ap.add_argument("--bbox-pad", type=float, default=0.012, help="поля вокруг кропа, доли")
    ap.add_argument("--images-dir", default=None, help="сохранять кропы ещё и локально")
    ap.add_argument("--bucket", default=None, help="бакет Supabase (перекрывает env)")
    ap.add_argument("--no-upload", action="store_true", help="не заливать в Supabase")
    ap.add_argument("--rescue", dest="rescue", action="store_true", default=True,
                    help="перезапрашивать поодиночке страницы, с которых не пришло "
                         "ни одного вопроса")
    ap.add_argument("--no-rescue", dest="rescue", action="store_false")
    ap.add_argument("--fill-gaps", dest="fill_gaps", action="store_true", default=True,
                    help="дозапрашивать пропущенные номера вопросов")
    ap.add_argument("--no-fill-gaps", dest="fill_gaps", action="store_false")
    ap.add_argument("--max-gap-requests", type=int, default=40,
                    help="потолок запросов на добор дырок в одном файле")
    ap.add_argument("--gap-rounds", type=int, default=3,
                    help="раундов добора: каждый следующий сужает окно страниц")
    ap.add_argument("--answer-keys", dest="answer_keys", action="store_true", default=True,
                    help="подставлять ответы из файлов-ключей")
    ap.add_argument("--no-answer-keys", dest="answer_keys", action="store_false")
    ap.add_argument("--dry-run", action="store_true",
                    help="без загрузок в Supabase (CSV пишутся)")
    ap.add_argument("--verbose", "-v", action="store_true")
    return ap


def main() -> int:
    args = build_arg_parser().parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )
    # PIL с -v заваливает консоль разбором PNG-чанков (STREAM b'IHDR' ...),
    # httpx/urllib3 — каждым запросом. Полезный лог в этом тонет.
    for noisy in ("httpx", "httpcore", "urllib3", "PIL", "google_genai",
                  "google.generativeai", "google.auth"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    script_dir = Path(__file__).resolve().parent
    load_dotenv([Path.cwd() / ".env", script_dir / ".env"])

    api_key = env_any("GEMINI_API_KEY", "GOOGLE_API_KEY")
    if not api_key:
        log.error("нет GEMINI_API_KEY (или GOOGLE_API_KEY) — задай в окружении или .env")
        return 2

    if args.list_models:
        return list_available_models(api_key, args.sdk)

    if not args.folder:
        log.error("нужен --folder (или --list-models)")
        return 2
    folder = Path(args.folder).expanduser()
    if not folder.is_dir():
        log.error("папка не найдена: %s", folder)
        return 2
    out_dir = Path(args.output).expanduser() if args.output else folder
    out_dir.mkdir(parents=True, exist_ok=True)
    args.debug_log = out_dir / "failed_batches_debug.log"
    args.gaps_report = out_dir / "gaps_report.txt"

    # --batch auto: размер подбирается под каждый файл отдельно, уже внутри
    # process_pdf. args.batch остаётся запасным значением — на ключи с
    # ответами (там плотность мерить нечего) и на случай отказа от автоподбора.
    args.auto_batch = str(args.batch).strip().lower() == "auto"
    if args.auto_batch:
        args.batch = AUTO_FALLBACK_BATCH
    else:
        try:
            args.batch = max(1, int(args.batch))
        except (TypeError, ValueError):
            log.error("--batch: нужно число или auto, а не %r", args.batch)
            return 2

    if args.overlap >= args.batch and not args.auto_batch:
        log.warning("overlap >= batch, уменьшаю overlap до %d", args.batch - 1)
        args.overlap = max(0, args.batch - 1)

    pdfs = collect_pdfs(folder, recursive=True)
    question_files = [p for p in pdfs if not is_answer_key_file(p.name)]
    answer_files = [p for p in pdfs if is_answer_key_file(p.name)]
    if args.limit:
        question_files = question_files[:args.limit]

    if answer_files:
        (out_dir / "answer_key_files.txt").write_text(
            "\n".join(str(p) for p in answer_files), encoding="utf-8")
    log.info("вариантов: %d, ключей с ответами: %d", len(question_files), len(answer_files))
    if not question_files:
        log.error("не нашёл ни одного PDF с вопросами в %s", folder)
        return 1

    models = [m.strip() for m in args.models.split(",") if m.strip()] or DEFAULT_MODEL_ROTATION
    backend = build_backend(api_key, args.sdk)
    pool = ModelPool(backend, models)

    uploader = SupabaseUploader(
        env_any("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
        env_any("SUPABASE_SERVICE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_KEY"),
        args.bucket or env_any("SUPABASE_BUCKET", default="sat-images"),
        enabled=not (args.no_upload or args.dry_run),
    )
    if uploader.enabled:
        log.info("картинки -> Supabase bucket '%s'", uploader.bucket)
    else:
        log.info("загрузка в Supabase выключена%s",
                 f", кропы в {args.images_dir}" if args.images_dir else "")

    sink = CsvSink(out_dir, args.resume)
    state = RunState(out_dir / "state.json", args.resume,
                     signature=f"batch={'auto' if args.auto_batch else args.batch};"
                               f"overlap={args.overlap}")
    totals = {"questions": 0, "duplicates": 0, "images": 0, "answers_filled": 0,
              "gaps": 0}
    answer_cache: dict[str, dict[tuple[str, int], str]] = {}

    try:
        for i, pdf_path in enumerate(question_files, 1):
            source = source_id(pdf_path, folder)
            if args.resume and state.is_file_done(source):
                log.info("[%d/%d] %s — уже готов, пропускаю", i, len(question_files), source)
                continue
            log.info("[%d/%d] %s", i, len(question_files), source)

            period, version = extract_period_from_path(pdf_path, folder)
            if not period:
                try:
                    doc = fitz.open(pdf_path)
                    cover = render_page(doc, 0, args.dpi, args.api_max_side)
                    doc.close()
                    guessed_period, guessed_version = detect_period_via_gemini(
                        pool, cover, args.debug_log)
                    period = guessed_period or "Unknown"
                    version = version or guessed_version
                except StopAllModels:
                    raise
                except Exception as exc:
                    log.warning("период не определён: %s", str(exc)[:150])
                    period = "Unknown"

            answers: dict[tuple[str, int], str] = {}
            if args.answer_keys and answer_files:
                key_pdf = find_answer_key(pdf_path, answer_files)
                if key_pdf is not None:
                    if str(key_pdf) not in answer_cache:
                        log.info("  читаю ключ ответов: %s", key_pdf.name)
                        try:
                            answer_cache[str(key_pdf)] = parse_answer_key(
                                pool, key_pdf, args.batch, args.debug_log)
                        except StopAllModels:
                            raise
                        except Exception as exc:
                            log.warning("  ключ не разобран: %s", str(exc)[:150])
                            answer_cache[str(key_pdf)] = {}
                    answers = answer_cache[str(key_pdf)]
                    log.info("  ответов из ключа: %d", len(answers))

            try:
                stats = process_pdf(pdf_path, pool, sink, state, uploader, args,
                                    period, version or "", source, answers)
            except StopAllModels:
                raise
            except Exception as exc:
                log.exception("файл %s пропущен из-за ошибки: %s", pdf_path.name, exc)
                continue

            for key, value in stats.items():
                totals[key] += value
            sink.flush()
            state.mark_file(source)

    except StopAllModels as exc:
        log.error("%s", exc)
        log.error("Прогресс сохранён. Запусти позже с --resume, чтобы продолжить.")
    except KeyboardInterrupt:
        log.warning("остановлено пользователем — прогресс сохранён, используй --resume")
    finally:
        sink.close()

    log.info("Итого: вопросов %d, дубликатов отброшено %d, картинок %d, "
             "ответов подставлено из ключей %d",
             totals["questions"], totals["duplicates"], totals["images"],
             totals["answers_filled"])
    if totals["gaps"]:
        log.warning("Пропущенных номеров осталось: %d — список в %s",
                    totals["gaps"], args.gaps_report)
    for qtype, path in sink.paths.items():
        log.info("  %-9s %5d строк -> %s", qtype, sink.counters[qtype], path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
