#!/usr/bin/env python3
"""Convert HosnainRafi's personal N5 resource-pack JSON into Nihongo Stack packs.

The output is deliberately written below private-assets/ and is not application
source. It is for the user's local study copy; source attribution is retained
in every generated pack.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Any


REPO_URL = "https://github.com/HosnainRafi/jlpt-n5-resource-pack"
REPO_ROOT = Path(__file__).resolve().parents[3]


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    text = re.sub(r"</p>\s*<p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def ruby_reading(value: str | None) -> str:
    if not value:
        return ""
    readings = re.findall(r"<rt>(.*?)</rt>", value, flags=re.I | re.S)
    return " ".join(strip_html(item) for item in readings if strip_html(item))


def clean_prompt(question: dict[str, Any]) -> str:
    prompt = strip_html(question.get("html")) or strip_html(question.get("text"))
    # A few source rows contain a plain-text ruby fallback such as 毎日まいにち.
    # Prefer the HTML representation when present because it keeps only visible
    # Japanese text after ruby tags are removed.
    prompt = re.sub(r"\s+", " ", prompt).strip()
    return prompt or f"第 {question.get('order', '?')} 题"


def option_text(option: dict[str, Any]) -> str:
    return strip_html(str(option.get("text", ""))) or str(option.get("label", ""))


def translate_headings(value: str) -> str:
    replacements = {
        "Correct Answer": "正确答案",
        "Question Translation": "题干译意（来源译文）",
        "Explanation": "解析",
        "Why Other Options Are Incorrect": "其他选项为什么不对",
        "Grammar/Vocabulary Note": "语法/词汇提示",
    }
    for source, target in replacements.items():
        value = value.replace(f"**{source}**", target).replace(source, target)
    return value.strip()


def section_counts(data: dict[str, Any]) -> tuple[int, int, int, int]:
    vocab = sum(
        sub["question_to"] - sub["question_from"] + 1
        for sub in data["sections"][0]["subsections"]
    )
    grammar = sum(
        sub["question_to"] - sub["question_from"] + 1
        for sub in data["sections"][1]["subsections"]
        if sub["category"] == "grammar"
    )
    reading = sum(
        sub["question_to"] - sub["question_from"] + 1
        for sub in data["sections"][1]["subsections"]
        if sub["category"] == "reading"
    )
    listening = sum(
        sub["question_to"] - sub["question_from"] + 1
        for sub in data["sections"][2]["subsections"]
    )
    return vocab, grammar, reading, listening


def session_from_title(title: str) -> tuple[int | None, str | None]:
    year = re.search(r"(20\d{2})", title)
    if not year:
        return None, None
    month = re.search(r"(July|七月)", title, flags=re.I)
    if month:
        return int(year.group(1)), "07"
    month = re.search(r"(December|十二月)", title, flags=re.I)
    if month:
        return int(year.group(1)), "12"
    return int(year.group(1)), None


def listening_audio_for(data: dict[str, Any], local_index: int) -> str | None:
    audio = data.get("listening_audio") or []
    if not audio:
        return None
    offset = 0
    for index, sub in enumerate(data["sections"][2]["subsections"]):
        count = sub["question_to"] - sub["question_from"] + 1
        if offset < local_index <= offset + count:
            return audio[min(index, len(audio) - 1)]
        offset += count
    return audio[-1]


def chinese_guidance(section: str) -> str:
    if section == "文字・語彙":
        return "中文学习法：先看句中汉字或下划线位置，再用选项替换回原句，确认读音和语境是否同时成立。"
    if section == "文法":
        return "中文学习法：先找句子骨架和句尾，再判断助词、活用或连接关系；不要只按汉字直译。"
    if section == "読解":
        return "中文学习法：先定位人物、时间、条件和结论，再用原文证据排除只说了一半的选项。"
    return "中文学习法：第一遍只抓人物、地点、时间和动作；第二遍再核对选项中的细节和顺序。"


def convert(source: Path, output: Path) -> dict[str, Any]:
    data = json.loads(source.read_text(encoding="utf-8"))
    title = data["meta"]["title"]
    year, session = session_from_title(title)
    if year is None:
        raise ValueError(f"无法从标题识别年份：{title}")
    vocab_count, grammar_count, reading_count, listening_count = section_counts(data)
    boundaries = (
        ("文字・語彙", vocab_count),
        ("文法", grammar_count),
        ("読解", reading_count),
        ("聴解", listening_count),
    )
    questions: list[dict[str, Any]] = []
    cursor = 0
    for section, count in boundaries:
        for local_number in range(1, count + 1):
            if cursor >= len(data["questions"]):
                raise ValueError(f"{title} 题目数量不足，期望至少 {sum(c for _, c in boundaries)}")
            source_question = data["questions"][cursor]
            cursor += 1
            prompt = clean_prompt(source_question)
            options = [option_text(option) for option in source_question.get("options", [])]
            answer = int(source_question.get("correct_answer", "1")) - 1
            answer = max(0, min(answer, len(options) - 1))
            reading = ruby_reading(source_question.get("html"))
            if not reading and options:
                reading = str(source_question["options"][answer].get("furigana", ""))
            reading = reading or "请先朗读题干，再用选项确认读音"
            source_explanation = translate_headings(source_question.get("explanation") or "")
            if section == "聴解":
                audio_text = strip_html(source_question.get("listening_script"))
                audio_url = listening_audio_for(data, local_number)
            else:
                audio_text = None
                audio_url = None
            explanation = chinese_guidance(section)
            if source_explanation:
                explanation += "\n\n来源解析：\n" + source_explanation
            elif source_question.get("listening_script_translation"):
                explanation += "\n\n听力场景译文（来源）：" + strip_html(source_question["listening_script_translation"])
            else:
                explanation += "\n\n本题来源未提供逐题解析；请先查看正确选项，再回到原句解释自己的判断。"
            questions.append({
                "id": f"{source_question.get('question_id', cursor)}-{section}-{local_number}",
                "section": section,
                "questionNumber": local_number,
                "prompt": prompt,
                "audioText": audio_text,
                "options": options,
                "answer": answer,
                "reading": reading,
                "gloss": "中文释义：" + ("听力场景与选项判断" if section == "聴解" else "结合原句和正确选项理解本题"),
                "explanation": explanation,
                "studySteps": [
                    "先关闭辅助层，独立读题并选择。",
                    "打开平假名和中文学习提示，说明自己为什么选这个答案。",
                    "把错因记入收藏或笔记，隔天只重做错题。",
                ],
                "itemType": section,
                **({"audioUrl": audio_url} if audio_url else {}),
                "sourceUrl": data["meta"].get("url", REPO_URL),
            })
    if cursor != len(data["questions"]):
        raise ValueError(f"{title} 有 {len(data['questions'])} 题，但分区只覆盖 {cursor} 题")
    complete = year >= 2019 and session in {"07", "12"} and len(questions) >= 67
    pack = {
        "schemaVersion": 1,
        "id": f"private-nihonez-{year}-{session or 'unknown'}-n5-{source.parent.name}",
        "year": year,
        "session": session,
        "level": "N5",
        "title": f"{title} · 本机个人学习整卷",
        "sourceName": "HosnainRafi/jlpt-n5-resource-pack · nihonez.com",
        "license": "来源仓库 README 标注 personal study archive；题目、音频和图片仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；仅用于本机学习，不公开再分发",
        "rightsEvidenceUrl": REPO_URL,
        "sourceUrl": data["meta"].get("url", REPO_URL),
        "complete": complete,
        "questionCount": len(questions),
        "sectionQuestionCounts": {"文字・語彙": vocab_count, "文法": grammar_count, "読解": reading_count, "聴解": listening_count},
        "questions": questions,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    return pack


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=REPO_ROOT / "private-assets/jlpt-n5-resource-pack/jlpt-n5-tests")
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "private-assets/nihongo-stack-imports")
    args = parser.parse_args()
    files = sorted(args.source_root.glob("*/test.json"))
    if not files:
        raise SystemExit(f"没有找到 test.json：{args.source_root}")
    for source in files:
        pack = convert(source, args.out / f"{source.parent.name}.json")
        print(f"{source.parent.name}: {pack['questionCount']} 题 · {pack['title']}")


if __name__ == "__main__":
    main()
