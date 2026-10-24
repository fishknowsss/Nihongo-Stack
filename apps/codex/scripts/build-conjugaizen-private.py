#!/usr/bin/env python3
"""Convert Conjugaizen's original N4 mock tests into local study packs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
SOURCE_URL = "https://conjugaizen.com/jlpt-n4-practice-test/"

VOCAB = {"kanjiReading", "orthography", "context", "paraphrase", "usage"}
GRAMMAR = {"grammarForm", "sentenceComposition", "textGrammar"}
READING = {"shortPassage", "midPassage", "longPassage", "infoRetrieval"}


def section_for(mondai: str) -> str:
    if mondai in VOCAB:
        return "文字・語彙"
    if mondai in GRAMMAR:
        return "文法"
    if mondai in READING:
        return "読解"
    return "聴解"


def audio_text(value: Any) -> str | None:
    if not isinstance(value, list):
        return None
    lines = []
    for item in value:
        if not isinstance(item, dict):
            continue
        speaker = {"male": "男", "female": "女", "narrator": "ナレーション"}.get(str(item.get("speaker")), str(item.get("speaker", "")))
        text = str(item.get("text", "")).strip()
        if text:
            lines.append(f"{speaker}：{text}" if speaker else text)
    return "\n".join(lines) or None


def convert(test: dict[str, Any], output: Path) -> dict[str, Any]:
    level = "N4"
    counters = {section: 0 for section in ["文字・語彙", "文法", "読解", "聴解"]}
    questions = []
    for source_question in test.get("questions", []):
        section = section_for(str(source_question.get("mondai", "")))
        counters[section] += 1
        options = [str(option).strip() for option in source_question.get("choices", [])]
        if not options:
            continue
        answer = int(source_question.get("correctIndex", 0))
        answer = max(0, min(answer, len(options) - 1))
        prompt = str(source_question.get("prompt", "")).strip() or f"第 {len(questions) + 1} 题"
        explanation = str(source_question.get("explanation", "")).strip()
        chinese_guide = {
            "文字・語彙": "中文学习法：先看题干中的词形和语境，再用正确选项替换回原句，区分读音、写法和搭配。",
            "文法": "中文学习法：先找句子骨架和句尾，再确认助词、活用和前后逻辑，不按汉字直译。",
            "読解": "中文学习法：先定位人物、条件、转折和结论，再用原文证据排除只复述局部的选项。",
            "聴解": "中文学习法：先听人物、地点、时间和动作，再核对选项细节；听力脚本只在答题后打开。",
        }[section]
        if explanation:
            explanation = chinese_guide + "\n\n来源解析：\n" + explanation
        else:
            explanation = chinese_guide
        questions.append({
            "id": f"{test.get('id', 'n4')}-{source_question.get('id', len(questions) + 1)}",
            "section": section,
            "questionNumber": counters[section],
            "prompt": prompt,
            "audioText": audio_text(source_question.get("audioScript")),
            "options": options,
            "answer": answer,
            "reading": options[answer] if section == "文字・語彙" else "请先朗读题干，再结合上下文确认读音",
            "gloss": "中文释义：先结合日语场景和正确选项理解本题。",
            "explanation": explanation,
            "studySteps": [
                "先关闭辅助层，按 N4 题型独立完成。",
                "提交后打开平假名和中文学习提示，说明排除其他选项的理由。",
                "把陌生词句加入收藏或笔记，隔天只重做错题。",
            ],
            "itemType": str(source_question.get("mondai", section)),
        })
    pack = {
        "schemaVersion": 1,
        "id": f"private-conjugaizen-{test.get('id', 'n4')}",
        "year": 2025,
        "level": level,
        "title": f"Conjugaizen · {test.get('title', 'N4 Practice Test')} · 本机个人学习",
        "sourceName": "Conjugaizen",
        "license": "来源页面明确为 original questions modeled on the official exam format；保留来源归属",
        "rightsBasis": "用户授权的本机个人学习副本；仅用于本机学习，不公开再分发",
        "rightsEvidenceUrl": SOURCE_URL,
        "sourceUrl": SOURCE_URL,
        "complete": False,
        "contentKind": "original-practice",
        "questionCount": len(questions),
        "sectionQuestionCounts": counters,
        "questions": questions,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    return pack


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=ROOT / "private-assets" / "conjugaizen-v.json")
    parser.add_argument("--out", type=Path, default=ROOT / "private-assets" / "nihongo-stack-conjugaizen-imports")
    args = parser.parse_args()
    data = json.loads(args.source.read_text(encoding="utf-8"))
    for test in data.get("N4", []):
        pack = convert(test, args.out / f"{test['id']}.json")
        print(f"{pack['id']}: {pack['questionCount']} 题 · {pack['sectionQuestionCounts']}")


if __name__ == "__main__":
    main()
