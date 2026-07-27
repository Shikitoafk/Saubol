"""Заливает картинки к вопросам в Supabase Storage.

Раскладывать скрины по локальным папкам и держать их имена в синхроне с
базой — морока, которая ломается то на пути, то на дефисе, то на имени.
Этот скрипт кладёт файлы в Supabase Storage один раз, а сайт берёт их
оттуда по прямой ссылке. Никаких локальных папок и git для картинок.

    python upload_images.py ./public/sat_images

Что делает:
  * читает .env (рядом со скриптом или в текущей папке);
  * создаёт публичный бакет, если его ещё нет;
  * заливает каждый файл, СОХРАНЯЯ путь внутри папки (ebrw/…, math_mcq/…),
    чтобы он совпал с тем, что записано в колонке image_url базы;
  * в конце печатает строку для .env сайта — VITE_SAT_IMAGE_BASE.

Нужен .env со значениями:
    SUPABASE_URL           адрес проекта, https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY   service_role ключ (НЕ anon — заливка без него 401)
    SUPABASE_BUCKET        имя бакета, по умолчанию sat-images

Где взять service_role: Supabase → Project Settings → API → service_role.
Это секретный ключ, в браузер он не попадает и в репозиторий его класть
не нужно — только в локальный .env рядом со скриптом.
"""
import sys
from pathlib import Path
from urllib.parse import quote

import requests

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
CONTENT_TYPE = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def load_env() -> dict[str, str]:
    """Читает .env рядом со скриптом и в текущей папке. Второй перекрывает."""
    env: dict[str, str] = {}
    here = Path(__file__).resolve().parent
    for path in (here / ".env", Path.cwd() / ".env"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def ensure_bucket(session: requests.Session, base: str, headers: dict, bucket: str) -> None:
    """Создаёт публичный бакет, если его нет. Иначе загрузка молча 404-ит."""
    r = session.get(f"{base}/storage/v1/bucket/{bucket}", headers=headers, timeout=20)
    if r.status_code == 200:
        return
    if r.status_code != 404:
        print(f"проверка бакета вернула {r.status_code}: {r.text[:160]}")
        return
    created = session.post(
        f"{base}/storage/v1/bucket", headers=headers,
        json={"name": bucket, "id": bucket, "public": True}, timeout=20,
    )
    if created.status_code in (200, 201):
        print(f"создан публичный бакет {bucket}")
    else:
        raise SystemExit(f"не смог создать бакет {bucket}: "
                         f"{created.status_code} {created.text[:200]}")


def upload_one(session: requests.Session, base: str, headers: dict, bucket: str,
               rel_path: str, data: bytes, content_type: str) -> bool:
    endpoint = f"{base}/storage/v1/object/{bucket}/{quote(rel_path)}"
    h = {**headers, "Content-Type": content_type, "x-upsert": "true"}
    for attempt in range(1, 4):
        try:
            r = session.post(endpoint, headers=h, data=data, timeout=60)
            if r.status_code in (200, 201):
                return True
            if r.status_code in (400, 409):  # уже лежит — дожимаем через PUT
                r = session.put(endpoint, headers=h, data=data, timeout=60)
                if r.status_code in (200, 201):
                    return True
            print(f"  {rel_path}: {r.status_code} {r.text[:120]}")
        except requests.RequestException as exc:
            print(f"  {rel_path}: попытка {attempt} не удалась: {exc}")
    return False


def main() -> int:
    if len(sys.argv) < 2:
        print("укажи папку с картинками, например:\n"
              "  python upload_images.py ./public/sat_images")
        return 2

    root = Path(sys.argv[1]).expanduser()
    if not root.is_dir():
        print(f"нет такой папки: {root}")
        return 2

    env = load_env()
    base = (env.get("SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_KEY") or ""
    bucket = env.get("SUPABASE_BUCKET") or "sat-images"

    if not base or not key:
        print("в .env нужны SUPABASE_URL и SUPABASE_SERVICE_KEY (service_role).\n"
              "anon-ключ не подойдёт — заливка требует service_role.")
        return 2

    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in IMAGE_EXTS)
    if not files:
        print(f"в {root} не нашлось картинок ({', '.join(sorted(IMAGE_EXTS))})")
        return 1

    session = requests.Session()
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    ensure_bucket(session, base, headers, bucket)

    ok = 0
    for path in files:
        rel = path.relative_to(root).as_posix()   # ebrw/December_..._q11.png
        data = path.read_bytes()
        ctype = CONTENT_TYPE.get(path.suffix.lower(), "application/octet-stream")
        if upload_one(session, base, headers, bucket, rel, data, ctype):
            ok += 1
            print(f"  ↑ {rel}")

    print(f"\nзалито {ok} из {len(files)} картинок в бакет {bucket}")
    if ok:
        image_base = f"{base}/storage/v1/object/public/{bucket}/"
        print("\nВставь эту строку в .env сайта (рядом с VITE_SUPABASE_URL):\n")
        print(f"  VITE_SAT_IMAGE_BASE={image_base}\n")
        print("После этого перезапусти сайт — картинки пойдут из Storage.")
    return 0 if ok == len(files) else 1


if __name__ == "__main__":
    sys.exit(main())
