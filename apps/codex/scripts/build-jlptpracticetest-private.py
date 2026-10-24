#!/usr/bin/env python3
"""Fetch the openly reachable independent JLPT Practice Test pages into local packs.

The site exposes text question sets for vocabulary and grammar/reading. It does
not expose listening in these routes, so generated packs intentionally remain
teaching excerpts (complete=false) and retain the source URL for attribution.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
BASE = "https://www.jlptpracticetest.com"


def fetch(url: str) -> str:
    result = subprocess.run(["curl", "-fsSL", "--retry", "2", url], check=True, capture_output=True, text=True)
    return result.stdout


def extract_test(page: str) -> dict[str, Any]:
    for match in re.finditer(r"self\.__next_f\.push\(\[1,(.*?)\]\)</script>", page, re.S):
        try:
            chunk = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        if "initialTest" not in chunk:
            continue
        data = re.search(r'"initialTest":(\{.*\}),"hasOriginalMocks"', chunk)
        if data:
            return json.loads(data.group(1))
    raise ValueError("页面没有找到 initialTest 数据")


def clean(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"\[\[(?:u|/u|br|b|/b|center|/center|align-right)\]\]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def questions_from(data: dict[str, Any], section: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for group in data.get("sections", [])[0].get("groups", []):
        for question in group.get("questions", []):
            options = [clean(option) for option in question.get("options", [])]
            answer = int(question.get("correctAnswer", 1)) - 1
            if not options:
                continue
            answer = max(0, min(answer, len(options) - 1))
            prompt = clean(question.get("textHtml") or question.get("text"))
            result.append({
                "id": f"{section}-{question.get('id', len(result) + 1)}",
                "section": section,
                "questionNumber": int(question.get("questionNumber", len(result) + 1)),
                "prompt": prompt or f"第 {len(result) + 1} 题",
                "options": options,
                "answer": answer,
                "reading": "请先朗读题干，再用上下文确认读音",
                "gloss": "中文释义：先结合原文语境理解，再核对正确选项。",
                "explanation": (
                    "中文学习法：先独立作答，再把正确选项放回原句；阅读题先找主张、理由、条件和结论，"
                    "避免按汉字表面意思直译。来源页面未提供逐题中文解析，请保留原文上下文复盘。"
                ),
                "studySteps": [
                    "先关闭辅助层，按页面原题独立完成。",
                    "打开平假名和中文学习提示，写出排除其他选项的理由。",
                    "把陌生词句加入收藏或笔记，隔天只重做错题。",
                ],
                "itemType": section,
            })
    return result


def index_dates(level: str, minimum_year: int, maximum_year: int) -> list[str]:
    page = fetch(f"{BASE}/{level}")
    dates = sorted(set(re.findall(rf'href="/{level}/(20\d{{4}})"', page)))
    return [date for date in dates if minimum_year <= int(date[:4]) <= maximum_year]


def convert(level: str, date: str, output: Path) -> dict[str, Any]:
    vocabulary_url = f"{BASE}/{level}/{date}/vocabulary"
    grammar_url = f"{BASE}/{level}/{date}/grammar"
    vocabulary = extract_test(fetch(vocabulary_url))
    grammar = extract_test(fetch(grammar_url))
    questions = questions_from(vocabulary, "文字・語彙") + questions_from(grammar, "読解")
    year, month = int(date[:4]), date[4:]
    pack = {
        "schemaVersion": 1,
        "id": f"private-jlptpracticetest-{year}-{month}-{level}",
        "year": year,
        "session": month,
        "level": level.upper(),
        "title": f"JLPT {level.upper()} {year} 年 {month} 月 · 文字词汇与阅读个人资料",
        "sourceName": "JLPT Practice Test · independent study site",
        "license": "来源页面标注 independently republished for study；题目与页面内容仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；仅用于本机学习，不公开再分发",
        "rightsEvidenceUrl": f"{BASE}/{level}/{date}",
        "sourceUrl": f"{BASE}/{level}/{date}",
        "complete": False,
        "questionCount": len(questions),
        "sectionQuestionCounts": {"文字・語彙": len(questions_from(vocabulary, "文字・語彙")), "読解": len(questions_from(grammar, "読解"))},
        "questions": questions,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    return pack


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--levels", default="n2", help="comma-separated levels, for example n2,n3,n4,n5")
    parser.add_argument("--from-year", type=int, default=2019)
    parser.add_argument("--to-year", type=int, default=2024)
    parser.add_argument("--out", type=Path, default=ROOT / "private-assets" / "nihongo-stack-site-imports")
    args = parser.parse_args()
    for level in [item.strip().lower() for item in args.levels.split(",") if item.strip()]:
        for date in index_dates(level, args.from_year, args.to_year):
            pack = convert(level, date, args.out / f"{level}-{date}.json")
            print(f"{pack['id']}: {pack['questionCount']} 题（文字词汇 + 阅读）")


if __name__ == "__main__":
    main()
