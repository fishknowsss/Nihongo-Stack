#!/usr/bin/env python3
"""Convert an OK JLPT public paper response plus its public solutions."""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
SOURCE_URL = "https://okjlpt.com/en/n4/papers/2021-12"


def clean(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"\{u\|([^}]*)\}", r"\1", text)
    text = text.replace("{blank}", "（　）").replace("{star}", "★")
    text = re.sub(r"\{slot\}", "＿＿", text)
    return re.sub(r"\s+", " ", text).strip()


def section_for(module: str, section: str) -> str:
    if section == "vocabulary":
        return "文字・語彙"
    if section == "listening":
        return "聴解"
    return "読解" if module == "reading" else "文法"


def material_map(paper: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        material["id"]: material
        for mondai in paper.get("mondai", [])
        for material in mondai.get("materials", [])
        if isinstance(material, dict) and material.get("id")
    }


def convert(paper: dict[str, Any], solutions: dict[str, Any]) -> dict[str, Any]:
    answers = {item["questionId"]: item for item in solutions.get("items", [])}
    materials = material_map(paper)
    counters = {section: 0 for section in ["文字・語彙", "文法", "読解", "聴解"]}
    questions = []
    for mondai in paper.get("mondai", []):
        for source_question in mondai.get("questions", []):
            section = section_for(str(mondai.get("module", "")), str(mondai.get("section", "")))
            counters[section] += 1
            solution = answers.get(source_question["id"], {})
            options = source_question.get("options")
            if not isinstance(options, list) or len(options) < 2:
                options = [f"图片选项 {index}" for index in range(1, int(source_question.get("optionCount", 4)) + 1)]
            options = [clean(option) for option in options]
            answer = int(solution.get("answer", 1)) - 1
            answer = max(0, min(answer, len(options) - 1))
            material = materials.get(source_question.get("materialId"), {})
            stem = clean(source_question.get("stem"))
            body = clean(material.get("body"))
            prompt = " · ".join(value for value in [body, stem] if value) or f"第 {source_question.get('number', counters[section])} 题"
            explanation = str((solution.get("explanation") or {}).get("body", "")).strip()
            words = solution.get("words") if isinstance(solution.get("words"), list) else []
            readings = [str(word.get("reading", "")).strip() for word in words if isinstance(word, dict) and word.get("reading")]
            meanings = [f"{word.get('word')}：{word.get('meaning')}" for word in words if isinstance(word, dict) and word.get("word") and word.get("meaning")]
            image = source_question.get("image") or material.get("image")
            audio = material.get("audio")
            question = {
                "id": f"okjlpt-{source_question['id']}",
                "section": section,
                "questionNumber": counters[section],
                "prompt": prompt,
                "audioText": None,
                "options": options,
                "answer": answer,
                "reading": "；".join(dict.fromkeys(readings)) or "请先朗读题干，再结合上下文确认读音",
                "gloss": "中文词义提示：" + ("；".join(dict.fromkeys(meanings)) if meanings else "结合题干和正确选项理解。"),
                "explanation": explanation or "请结合原题、答案和中文词义提示复盘。",
                "studySteps": [
                    "先关闭辅助层，按真实 N4 分区独立作答。",
                    "提交后查看中文逐题解析、词义和正确读音。",
                    "把错因写入收藏或笔记，隔天只重做错题。",
                ],
                "itemType": str(mondai.get("type", section)),
                "sourceUrl": SOURCE_URL,
            }
            if isinstance(image, dict) and isinstance(image.get("url"), str):
                question["imageUrl"] = image["url"]
            if isinstance(audio, dict) and isinstance(audio.get("url"), str):
                question["audioUrl"] = audio["url"]
            questions.append(question)
    return {
        "schemaVersion": 1,
        "id": "private-okjlpt-2021-12-n4",
        "year": 2021,
        "session": "12",
        "level": "N4",
        "title": "OK JLPT · N4 2021 年 12 月整卷 · 本机个人学习",
        "sourceName": "OK JLPT",
        "license": "来源页面提供个人学习入口；题目、音频和图片仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；仅用于本机学习，不公开再分发",
        "rightsEvidenceUrl": SOURCE_URL,
        "sourceUrl": SOURCE_URL,
        "complete": True,
        "questionCount": len(questions),
        "sectionQuestionCounts": counters,
        "questions": questions,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper", type=Path, default=ROOT / "private-assets/okjlpt-n4-2021-12-paper.json")
    parser.add_argument("--solutions", type=Path, default=ROOT / "private-assets/okjlpt-n4-2021-12-solutions.json")
    parser.add_argument("--out", type=Path, default=ROOT / "private-assets/nihongo-stack-okjlpt-imports/n4-2021-12.json")
    args = parser.parse_args()
    pack = convert(json.loads(args.paper.read_text(encoding="utf-8")), json.loads(args.solutions.read_text(encoding="utf-8")))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{pack['title']}: {pack['questionCount']} 题 · {pack['sectionQuestionCounts']}")


if __name__ == "__main__":
    main()
