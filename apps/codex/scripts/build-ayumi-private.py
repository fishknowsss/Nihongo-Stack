#!/usr/bin/env python3
"""Convert a locally downloaded Ayumi paper into a raw review pack.

The paper and answer files remain under private-assets. The generated pack is
for reading, listening and selection-based explanation; it is intentionally
not marked as a complete scored paper until every item is independently
segmented and checked.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]


def extract_text(path: Path) -> str:
    result = subprocess.run(["pdftotext", "-layout", str(path), "-"], check=True, capture_output=True, text=True)
    return re.sub(r"\n{3,}", "\n\n", result.stdout.replace("\x00", "")).strip()


def split_sections(text: str) -> dict[str, str]:
    headings = [
        ("文字・語彙", r"文字・語彙"),
        ("文法", r"文法"),
        ("読解", r"読解"),
        ("聴解", r"聴解"),
    ]
    matches: list[tuple[int, str]] = []
    for name, pattern in headings:
        for match in re.finditer(pattern, text):
            if not any(abs(match.start() - position) < 20 for position, _ in matches):
                matches.append((match.start(), name))
                break
    matches.sort()
    if not matches:
        return {"全文": text}
    sections: dict[str, str] = {}
    for index, (start, name) in enumerate(matches):
        end = matches[index + 1][0] if index + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if body:
            sections[name] = body
    return sections or {"全文": text}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper", type=Path, required=True)
    parser.add_argument("--level", choices=["N5", "N4", "N3", "N2"], required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--session", choices=["07", "12"], required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--rights-evidence-url", required=True)
    parser.add_argument("--listening-audio-url")
    parser.add_argument("--listening-script", type=Path)
    parser.add_argument("--answer-key", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    paper_text = extract_text(args.paper)
    answer_key: dict[str, Any] = {}
    if args.answer_key:
        answer_key = json.loads(args.answer_key.read_text(encoding="utf-8"))
    listening_script = ""
    if args.listening_script:
        listening_script = args.listening_script.read_text(encoding="utf-8").strip()
    pack: dict[str, Any] = {
        "schemaVersion": 1,
        "id": f"ayumi-raw-{args.year}-{args.session}-{args.level.lower()}",
        "year": args.year,
        "session": args.session,
        "level": args.level,
        "title": f"{args.year} 年 {args.session} 月 · {args.level} 原卷复盘（Ayumi）",
        "sourceName": "Ayumi Language Institute 公开页面",
        "license": "来源页面提供学习资料；题目、答案和音频仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；只保存在 private-assets，不公开再分发",
        "rightsEvidenceUrl": args.rights_evidence_url,
        "sourceUrl": args.source_url,
        "complete": False,
        "fullPaper": False,
        "contentKind": "text-excerpt",
        "questionCount": 0,
        "sectionQuestionCounts": {},
        "rawSections": split_sections(paper_text),
        "answerKey": answer_key,
        "listeningScript": listening_script or None,
        "listeningAudioUrl": args.listening_audio_url,
        "questions": [],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{args.out}: {len(pack['rawSections'])} 个文本分区 · {len(paper_text)} 字")


if __name__ == "__main__":
    main()
