import csv
import re
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


ROOT_DIR = Path(r"C:/Users/PC/Desktop/SAT Qs")
EXISTING_MCQ = Path(r"C:/Users/PC/Downloads/SAT_MCQ_rows.csv")
EXISTING_OPEN = Path(r"C:/Users/PC/Downloads/SAT_Open_rows.csv")

OUT_MCQ = Path(r"C:/Users/PC/Downloads/SAT_MCQ_import_full_safe.csv")
OUT_OPEN = Path(r"C:/Users/PC/Downloads/SAT_Open_import_full_safe.csv")
OUT_REPORT = Path(r"C:/Users/PC/Downloads/SAT_parse_report.csv")


def clean_line(line: str) -> str:
    line = line.replace("\u00a0", " ")
    line = line.replace("—", "-").replace("–", "-")
    line = line.replace("\x00", "")
    return re.sub(r"\s+", " ", line).strip()


def safe_text(value: str) -> str:
    return (value or "").replace("\\", "\\\\").replace("\x00", "")


def parse_start_id(path: Path) -> int:
    if not path.exists():
        return 0
    max_id = 0
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                max_id = max(max_id, int(row["id"]))
            except Exception:
                pass
    return max_id


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def is_question_start(line: str) -> bool:
    patterns = [
        r"^Question\s+\d+\.?$",
        r"^Question\s+\d+\.",
        r"^Problem\s+\d+\.?$",
        r"^\d+\)\s+",
        r"^\d+\.\s+",
    ]
    return any(re.match(p, line, flags=re.I) for p in patterns)


def split_blocks(text: str) -> list[str]:
    lines = [clean_line(l) for l in text.splitlines()]
    lines = [l for l in lines if l]
    blocks = []
    cur = []
    for ln in lines:
        if re.match(r"^--\s*\d+\s*of\s*\d+\s*--$", ln, flags=re.I):
            continue
        if "telegram" in ln.lower() or "t.me/" in ln.lower() or ln.startswith("@"):
            continue
        if is_question_start(ln):
            if cur:
                blocks.append(cur)
            cur = [ln]
        elif cur:
            cur.append(ln)
    if cur:
        blocks.append(cur)
    return ["\n".join(b) for b in blocks]


def infer_section(text: str, name: str) -> str:
    t = f"{name}\n{text}".lower()
    if "reading and writing" in t or "verbal" in t or "grammar" in t:
        return "Reading & Writing"
    return "Math"


def infer_category(section: str) -> str:
    return "Reading Comprehension" if section == "Reading & Writing" else "General Math"


MATH_HINTS = [
    "x^",
    "equation",
    "function",
    "quadratic",
    "linear",
    "circle",
    "triangle",
    "radius",
    "slope",
    "in the xy-plane",
    "value of x",
    "what is the value",
    "percent",
    "meters",
    "inches",
    "centimeters",
    "probability",
]

RW_HINTS = [
    "which choice",
    "completes the text",
    "as used in the text",
    "main purpose",
    "best supports",
    "word or phrase",
    "passage",
    "novel",
    "poem",
    "grammar",
    "sentence",
    "reading and writing",
]


def infer_section_from_question(question: str, fallback: str) -> str:
    q = question.lower()
    math_score = sum(1 for h in MATH_HINTS if h in q)
    rw_score = sum(1 for h in RW_HINTS if h in q)
    if math_score > rw_score:
        return "Math"
    if rw_score > math_score:
        return "Reading & Writing"
    return fallback


def parse_block(block: str, section: str, category: str):
    lines = [clean_line(l) for l in block.splitlines() if clean_line(l)]
    if not lines:
        return None

    first = re.sub(r"^(Question\s+\d+\.?\s*|Problem\s+\d+\.?\s*|\d+[\.\)]\s*)", "", lines[0], flags=re.I)
    q_parts = [first]
    options = {"A": "", "B": "", "C": "", "D": ""}
    cur_opt = None
    answer = ""
    explanation = ""
    student_response = False

    for ln in lines[1:]:
        if "student" in ln.lower() and "response" in ln.lower():
            student_response = True
            continue

        m_opt = re.match(r"^([A-D])[\)\.\:]?\s*(.*)$", ln)
        if m_opt:
            cur_opt = m_opt.group(1)
            options[cur_opt] = m_opt.group(2).strip()
            continue

        m_ans_letter = re.match(r"^Answer\s*[:\-]?\s*([A-D])\b", ln, flags=re.I)
        if m_ans_letter:
            answer = m_ans_letter.group(1).upper()
            cur_opt = None
            continue

        m_ans_num = re.match(r"^Answer\s*[:\-]?\s*([0-9\.\-\/]+)\s*$", ln, flags=re.I)
        if m_ans_num:
            answer = m_ans_num.group(1)
            cur_opt = None
            continue

        if ln.lower().startswith("explanation:"):
            explanation = ln.split(":", 1)[1].strip()
            cur_opt = None
            continue

        if cur_opt:
            options[cur_opt] = (options[cur_opt] + " " + ln).strip()
        else:
            q_parts.append(ln)

    question = " ".join(q_parts).strip()
    if not question or len(question) < 8:
        return None

    section = infer_section_from_question(question, section)
    category = infer_category(section)

    options_filled = sum(1 for v in options.values() if v)
    if options_filled >= 3 and not student_response:
        return {
            "kind": "mcq",
            "question": question,
            "option_a": options["A"],
            "option_b": options["B"],
            "option_c": options["C"],
            "option_d": options["D"],
            "correct_answer": answer,
            "explanation": explanation,
            "difficulty": "Medium",
            "category": category,
            "section": section,
        }

    return {
        "kind": "open",
        "question": question,
        "correct_answer": answer,
        "explanation": explanation,
        "difficulty": "Medium",
        "category": category,
        "section": section,
    }


def write_csv(path: Path, header: list[str], rows: list[dict]):
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: safe_text(str(r.get(k, ""))) for k in header})


def main():
    pdf_files = sorted(ROOT_DIR.rglob("*.pdf"))
    mcq_start = parse_start_id(EXISTING_MCQ)
    open_start = parse_start_id(EXISTING_OPEN)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S+00")

    mcq_rows = []
    open_rows = []
    report_rows = []

    for pdf in pdf_files:
        try:
            text = extract_text(pdf)
            section = infer_section(text, pdf.name)
            category = infer_category(section)
            blocks = split_blocks(text)
            file_mcq = 0
            file_open = 0
            for b in blocks:
                row = parse_block(b, section, category)
                if not row:
                    continue
                if row["kind"] == "mcq":
                    file_mcq += 1
                    mcq_rows.append(row)
                else:
                    file_open += 1
                    open_rows.append(row)
            report_rows.append(
                {"file": str(pdf), "blocks_detected": len(blocks), "mcq_rows": file_mcq, "open_rows": file_open, "error": ""}
            )
            print(f"[ok] {pdf.name}: blocks={len(blocks)} mcq={file_mcq} open={file_open}")
        except Exception as e:
            report_rows.append(
                {"file": str(pdf), "blocks_detected": 0, "mcq_rows": 0, "open_rows": 0, "error": str(e)}
            )
            print(f"[err] {pdf.name}: {e}")

    mcq_out_rows = []
    next_id = mcq_start + 1
    for r in mcq_rows:
        mcq_out_rows.append(
            {
                "id": next_id,
                "question": r["question"],
                "option_a": r["option_a"],
                "option_b": r["option_b"],
                "option_c": r["option_c"],
                "option_d": r["option_d"],
                "correct_answer": r["correct_answer"],
                "explanation": r["explanation"],
                "difficulty": r["difficulty"],
                "category": r["category"],
                "section": r["section"],
                "created_at": ts,
            }
        )
        next_id += 1

    open_out_rows = []
    next_id = open_start + 1
    for r in open_rows:
        open_out_rows.append(
            {
                "id": next_id,
                "question": r["question"],
                "correct_answer": r["correct_answer"],
                "explanation": r["explanation"],
                "difficulty": r["difficulty"],
                "category": r["category"],
                "section": r["section"],
                "created_at": ts,
            }
        )
        next_id += 1

    write_csv(
        OUT_MCQ,
        ["id", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation", "difficulty", "category", "section", "created_at"],
        mcq_out_rows,
    )
    write_csv(
        OUT_OPEN,
        ["id", "question", "correct_answer", "explanation", "difficulty", "category", "section", "created_at"],
        open_out_rows,
    )
    write_csv(OUT_REPORT, ["file", "blocks_detected", "mcq_rows", "open_rows", "error"], report_rows)

    print(f"PDF files: {len(pdf_files)}")
    print(f"MCQ rows total: {len(mcq_out_rows)} -> {OUT_MCQ}")
    print(f"OPEN rows total: {len(open_out_rows)} -> {OUT_OPEN}")
    print(f"Report -> {OUT_REPORT}")


if __name__ == "__main__":
    main()
