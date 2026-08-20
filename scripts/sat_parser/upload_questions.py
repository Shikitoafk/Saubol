#!/usr/bin/env python3
"""Upload validated SAT parser CSV files to the site's Supabase tables."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

TABLES = {
    "ebrw_mcq.csv": "sat_ebrw_mcq",
    "math_mcq.csv": "sat_math_mcq",
    "math_open.csv": "sat_math_open",
}
INTEGER_FIELDS = {"id", "question_number", "page"}
BOOLEAN_FIELDS = {"has_image"}


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    here = Path(__file__).resolve().parent
    for path in (here / ".env", Path.cwd() / ".env"):
        if not path.is_file():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_dir", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sql-output", type=Path)
    return parser.parse_args()


def typed_row(row: dict[str, str]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in row.items():
        value = value.strip()
        if key in INTEGER_FIELDS:
            result[key] = int(value)
        elif key in BOOLEAN_FIELDS:
            result[key] = value.lower() in {"1", "true", "yes"}
        else:
            result[key] = value or None
    return result


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def build_sql(payloads: dict[str, list[dict[str, object]]], period: str) -> str:
    statements = [
        "BEGIN;",
        "DO $guard$",
        "BEGIN",
        "  IF EXISTS (",
        "    SELECT 1 FROM public.sat_ebrw_mcq",
        f"    WHERE test_period = {sql_literal(period)}",
        "  ) THEN",
        "    RAISE EXCEPTION " + sql_literal(f"Test already exists: {period}") + ";",
        "  END IF;",
        "END",
        "$guard$;",
    ]
    for table, rows in payloads.items():
        if not rows:
            continue
        columns = list(rows[0])
        statements.append(
            f"INSERT INTO public.{table} ({', '.join(columns)}) VALUES"
        )
        values = [
            "  (" + ", ".join(sql_literal(row[column]) for column in columns) + ")"
            for row in rows
        ]
        statements.append(",\n".join(values) + ";")
    statements.extend(
        [
            "COMMIT;",
            "SELECT 'sat_ebrw_mcq' AS table_name, count(*) AS rows",
            "FROM public.sat_ebrw_mcq WHERE test_period = " + sql_literal(period),
            "UNION ALL",
            "SELECT 'sat_math_mcq', count(*) FROM public.sat_math_mcq",
            "WHERE test_period = " + sql_literal(period),
            "UNION ALL",
            "SELECT 'sat_math_open', count(*) FROM public.sat_math_open",
            "WHERE test_period = " + sql_literal(period) + ";",
        ]
    )
    return "\n".join(statements) + "\n"


def main() -> int:
    args = parse_args()
    csv_dir = args.csv_dir.resolve()
    env = load_env()
    base = (env.get("SUPABASE_URL") or env.get("VITE_SUPABASE_URL") or "").rstrip("/")
    key = (
        env.get("SUPABASE_SERVICE_KEY")
        or env.get("SUPABASE_SERVICE_ROLE_KEY")
        or env.get("SUPABASE_ANON_KEY")
        or env.get("VITE_SUPABASE_ANON_KEY")
        or ""
    )
    if not base or not key:
        print("SUPABASE_URL and a Supabase API key are required", file=sys.stderr)
        return 2

    payloads: dict[str, list[dict[str, object]]] = {}
    periods: set[str] = set()
    for filename, table in TABLES.items():
        path = csv_dir / filename
        if not path.is_file():
            print(f"Missing {path}", file=sys.stderr)
            return 2
        with path.open(encoding="utf-8-sig", newline="") as handle:
            rows = [typed_row(row) for row in csv.DictReader(handle)]
        payloads[table] = rows
        periods.update(str(row["test_period"]) for row in rows)

    if len(periods) != 1:
        print(f"Expected one test_period, found {sorted(periods)}", file=sys.stderr)
        return 2
    period = next(iter(periods))
    if args.sql_output:
        sql = build_sql(payloads, period)
        args.sql_output.parent.mkdir(parents=True, exist_ok=True)
        args.sql_output.write_text(sql, encoding="utf-8")
        print(f"Wrote {args.sql_output} ({len(sql)} characters)")
        return 0
    if args.dry_run:
        print(json.dumps({table: len(rows) for table, rows in payloads.items()}, indent=2))
        return 0

    try:
        import requests
    except ImportError:
        print("The requests package is required for direct REST uploads", file=sys.stderr)
        return 2

    session = requests.Session()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    for table in TABLES.values():
        response = session.get(
            f"{base}/rest/v1/{table}",
            headers=headers,
            params={"select": "uid", "test_period": f"eq.{period}", "limit": "1"},
            timeout=30,
        )
        response.raise_for_status()
        if response.json():
            print(f"Refusing duplicate upload: {period!r} already exists in {table}")
            return 3

    uploaded: list[str] = []
    try:
        for table, rows in payloads.items():
            response = session.post(
                f"{base}/rest/v1/{table}", headers=headers, json=rows, timeout=60
            )
            response.raise_for_status()
            uploaded.append(table)
            print(f"Uploaded {len(rows)} rows to {table}")
    except requests.RequestException as exc:
        print(f"Upload failed: {exc}", file=sys.stderr)
        for table in uploaded:
            rollback = session.delete(
                f"{base}/rest/v1/{table}",
                headers=headers,
                params={"test_period": f"eq.{period}"},
                timeout=30,
            )
            print(f"Rollback {table}: HTTP {rollback.status_code}", file=sys.stderr)
        return 1

    print(f"Uploaded {sum(map(len, payloads.values()))} questions for {period}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
