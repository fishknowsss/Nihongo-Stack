#!/usr/bin/env python3
"""Build local raw-paper review packs from the public eulerex JLPT corpus.

The corpus contains extracted paper text and uneven answer/listening coverage.
These packs deliberately remain non-complete so the app can expose the source
for reading and selection without pretending that OCR text is a scored paper.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SOURCE_ROOT = ROOT / "private-assets/jlpt-test/normalized"
DEFAULT_OUTPUT_ROOT = ROOT / "private-assets/nihongo-stack-eulerex-imports"
SOURCE_REPO = "https://github.com/eulerex/jlpt-test"


def clean(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return value.replace("\x00", "").strip()


def session_file(path: Path) -> tuple[int, str] | None:
    match = re.fullmatch(r"(\d{4})\.(07|12)\.json", path.name)
    if not match:
        return None
    return int(match.group(1)), match.group(2)


def convert(path: Path, level: str) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    year, session = session_file(path) or (int(data.get("year", 0)), f"{int(data.get('month', 0)):02d}")
    raw_sections: dict[str, str] = {}
    for key, value in (data.get("exam_sections") or {}).items():
        text = clean(value)
        if text:
            normalized = key if key in {"文字・語彙", "文法", "読解", "聴解", "全文"} else "全文"
            if normalized in raw_sections and normalized != "全文":
                normalized = "全文"
            raw_sections[normalized] = (raw_sections.get(normalized, "") + "\n\n" + text).strip()
    listening_script = clean(data.get("listening_script"))
    answers = data.get("answers") if isinstance(data.get("answers"), dict) else {}
    source_path = f"normalized/{level}/{year}/{path.name}"
    return {
        "schemaVersion": 1,
        "id": f"eulerex-raw-{year}-{session}-{level.lower()}",
        "year": year,
        "session": session,
        "level": level,
        "title": f"{year} 年 {session} 月 · {level} 原卷语料复盘",
        "sourceName": "eulerex/jlpt-test 公开结构化语料",
        "license": "公开 GitHub 语料；题目、答案和听力原文仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；只保存在 private-assets，不公开再分发",
        "rightsEvidenceUrl": f"{SOURCE_REPO}/blob/main/{source_path}",
        "sourceUrl": f"{SOURCE_REPO}/tree/main/normalized/{level}/{year}",
        "complete": False,
        "fullPaper": False,
        "contentKind": "text-excerpt",
        "questionCount": 0,
        "sectionQuestionCounts": {},
        "rawSections": raw_sections,
        "answerKey": answers,
        "listeningScript": listening_script or None,
        "questions": [],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--levels", default="N5,N4,N3,N2")
    parser.add_argument("--from-year", type=int, default=2019)
    parser.add_argument("--to-year", type=int, default=2023)
    args = parser.parse_args()
    levels = {value.strip().upper() for value in args.levels.split(",") if value.strip()}
    args.out.mkdir(parents=True, exist_ok=True)
    built = 0
    for level in sorted(levels):
        level_root = args.source_root / level
        if not level_root.exists():
            continue
        for path in sorted(level_root.glob("*/????.??.json")):
            parsed = session_file(path)
            if not parsed or not args.from_year <= parsed[0] <= args.to_year:
                continue
            pack = convert(path, level)
            if not pack["rawSections"]:
                continue
            out_path = args.out / f"{level.lower()}-{pack['year']}-{pack['session']}.json"
            out_path.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
            built += 1
            print(f"{out_path.name}: {len(pack['rawSections'])} 个文本分区 · 答案组 {len(pack['answerKey'])}")
    print(f"built {built} raw-paper review packs")


if __name__ == "__main__":
    main()
