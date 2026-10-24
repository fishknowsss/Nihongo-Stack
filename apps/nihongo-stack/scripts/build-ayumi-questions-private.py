#!/usr/bin/env python3
"""Convert the readable parts of an Ayumi JLPT paper into local quiz rows.

The source PDF is OCR/text mixed and its listening pages do not print every
question or option. This converter therefore emits only rows with recoverable
question text and choices, while retaining the complete raw sections beside
them. The pack remains non-complete until every item and audio mapping is
checked independently.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from typing import Any


WATERMARKS = re.compile(r"^(?:p|Ng|oại|Yu|uki Ngữ|Bù Gro|i\s+u|êu|iY|Tô|\d+)$")
SECTION_NAMES = {"文字・語彙", "文法", "読解", "聴解"}


def extract_text(path: Path) -> str:
    result = subprocess.run(["pdftotext", "-layout", str(path), "-"], check=True, capture_output=True, text=True)
    return unicodedata.normalize("NFKC", result.stdout.replace("\x00", ""))


def clean_lines(value: str) -> list[str]:
    lines: list[str] = []
    for raw in value.replace("\f", "\n").splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line or WATERMARKS.fullmatch(line):
            continue
        lines.append(line)
    return lines


def clean_text(value: str) -> str:
    return "\n".join(clean_lines(value)).strip()


def split_raw_sections(text: str) -> dict[str, str]:
    positions = []
    aliases = {
        "文字・語彙": ["文字・語彙", "文字語彙", "もじ・ごい"],
        "文法": ["文法"],
        "読解": ["読解"],
        "聴解": ["聴解"],
    }
    for name, candidates in aliases.items():
        found = [text.find(candidate) for candidate in candidates if text.find(candidate) >= 0]
        if found:
            positions.append((min(found), name))
    positions.sort()
    sections: dict[str, str] = {}
    for index, (start, name) in enumerate(positions):
        end = positions[index + 1][0] if index + 1 < len(positions) else len(text)
        body = clean_text(text[start:end])
        if body:
            sections[name] = body
    return sections or {"全文": clean_text(text)}


def marker_position(section: str, number: int, style: str, start: int) -> tuple[int, int] | None:
    if style == "paren":
        pattern = rf"(?m)^\s*{number}\)"
    else:
        pattern = rf"(?m)^\s*{number}(?:[.)．]|\s+)"
    match = re.search(pattern, section[start:])
    return None if not match else (start + match.start(), start + match.end())


def split_option_line(line: str) -> list[tuple[int, str]]:
    if re.match(r"^[1-4]\)", line):
        return []
    match = re.match(r"^([1-4])(?:\s+|[.．、]?)(.*)$", line)
    if not match:
        return []
    first = int(match.group(1))
    content = match.group(2).strip()
    parts = re.split(r"\s+([2-4])(?=(?:\s|[^\d]))", content)
    values: list[tuple[int, str]] = [(first, parts[0].strip())]
    for index in range(1, len(parts), 2):
        if index + 1 < len(parts):
            values.append((int(parts[index]), parts[index + 1].strip()))
    return [(number, value) for number, value in values if value]


def parse_block(block: str) -> tuple[str, list[str]]:
    lines = clean_lines(block)
    prompt: list[str] = []
    options: list[str] = []
    started = False
    current = ""
    for line in lines:
        pieces = split_option_line(line)
        if not started:
            if pieces and pieces[0][0] == 1:
                started = True
            else:
                prompt.append(line)
                continue
        if pieces:
            if current:
                options.append(current.strip())
            current = pieces[0][1]
            for _, value in pieces[1:]:
                options.append(current.strip())
                current = value
        elif started:
            current = f"{current} {line}".strip()
    if current:
        options.append(current.strip())
    prompt_text = "\n".join(prompt).strip()
    prompt_text = re.sub(r"^\d+\s*[)．.]?\s*", "", prompt_text)
    options = [re.split(r"\s+(?:問題|間題)\s*\d+", value, maxsplit=1)[0].strip() for value in options]
    return prompt_text, [value for value in options if value]


def blocks(section: str, first: int, last: int, style: str) -> list[tuple[int, str]]:
    starts: list[tuple[int, int]] = []
    cursor = 0
    for number in range(first, last + 1):
        found = marker_position(section, number, style, cursor)
        if not found:
            continue
        position, end = found
        starts.append((number, position))
        cursor = end
    output: list[tuple[int, str]] = []
    for index, (number, position) in enumerate(starts):
        end = starts[index + 1][1] if index + 1 < len(starts) else len(section)
        output.append((number, section[position:end]))
    return output


def make_question(level: str, section: str, number: int, prompt: str, options: list[str], answer: int, source_url: str, item_type: str) -> dict[str, Any]:
    if not options:
        return {}
    answer = max(0, min(answer, len(options) - 1))
    correct = options[answer]
    reading = correct if re.fullmatch(r"[ぁ-ゖァ-ヺー\s・]+", correct) else None
    return {
        "id": f"ayumi-{level.lower()}-{section}-{number}",
        "section": section,
        "questionNumber": number,
        "prompt": prompt or f"原卷第 {number} 题",
        "options": options,
        "answer": answer,
        "reading": reading,
        "gloss": f"答案线索：第 {answer + 1} 项「{correct}」。先根据句意复述，再回看词语或句型。",
        "explanation": f"本题公开答案线索为第 {answer + 1} 项「{correct}」。这是本机个人学习复盘资料，不换算为官方成绩。",
        "studySteps": [
            "先关闭辅助层，独立判断题干中的关键信息。",
            "再核对正确选项，选中不熟的日语词句查看平假名、罗马音和中文说明。",
        ],
        "itemType": item_type,
        "sourceUrl": source_url,
    }


def flatten_answers(answer_key: dict[str, Any], group: str, groups: list[str]) -> list[int]:
    values: list[int] = []
    source = answer_key.get(group, {})
    for key in groups:
        values.extend(int(value) - 1 for value in source.get(key, []))
    return values


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paper", type=Path, required=True)
    parser.add_argument("--answer-key", type=Path, required=True)
    parser.add_argument("--level", choices=["N5", "N4", "N3", "N2"], required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--session", choices=["07", "12"], required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--rights-evidence-url", required=True)
    parser.add_argument("--listening-audio-url")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    text = extract_text(args.paper)
    answers = json.loads(args.answer_key.read_text(encoding="utf-8"))
    def first_position(*patterns: str, start: int = 0) -> int:
        found: list[int] = []
        for pattern in patterns:
            match = re.search(pattern, text[start:], flags=re.MULTILINE)
            if match:
                found.append(start + match.start())
        return min(found) if found else -1

    vocab_start = first_position(r"文字・語彙", r"文字語彙", r"もじ・ごい")
    grammar_start = first_position(r"文法[・、\s]*読解", r"(?m)^\s*文法\s*$", start=max(0, vocab_start))
    listening_start = first_position(r"聴解", start=max(0, grammar_start))
    reading_start = first_position(r"(?m)^\s*読解\s*$", start=max(0, grammar_start))
    if reading_start < 0:
        problem_four = re.search(r"(?m)^\s*問題\s*4\s", text[max(0, grammar_start):])
        reading_start = max(0, grammar_start) + problem_four.start() if problem_four else listening_start
    positions = {"文字・語彙": vocab_start, "文法": grammar_start, "読解": reading_start, "聴解": listening_start}
    vocab = text[positions["文字・語彙"] : positions["文法"]]
    grammar = text[positions["文法"] : positions["読解"]]
    reading = text[positions["読解"] : positions["聴解"]]
    questions: list[dict[str, Any]] = []

    vocab_answers = flatten_answers(answers, "文字・語彙", ["1", "2", "3", "4", "5"])
    vocab_types = {1: "漢字読み", 2: "漢字表記", 3: "語彙", 4: "類義語", 5: "用法"}
    for number, block in blocks(vocab, 1, 34, "paren"):
        prompt, options = parse_block(block)
        if number <= len(vocab_answers) and len(options) == 4:
            item_type = vocab_types[1 if number <= 7 else 2 if number <= 13 else 3 if number <= 24 else 4 if number <= 29 else 5]
            questions.append(make_question(args.level, "文字・語彙", number, prompt, options, vocab_answers[number - 1], args.source_url, item_type))

    grammar_answers = flatten_answers(answers, "文法・読解", ["1", "2"])
    for number, block in blocks(grammar, 1, 18, "paren"):
        prompt, options = parse_block(block)
        if number <= len(grammar_answers) and len(options) == 4:
            questions.append(make_question(args.level, "文法", number, prompt, options, grammar_answers[number - 1], args.source_url, "文法"))

    # 文法・読解的第 3 题材料在题号 19–22 之前，四题共用同一篇短文。
    first_fill = grammar.find("19)")
    if first_fill >= 0:
        material_start = grammar.find("いかは、留学生の作文である。")
        material = clean_text(grammar[material_start:first_fill]) if material_start >= 0 else ""
        fill_answers = flatten_answers(answers, "文法・読解", ["3"])
        for index, (number, block) in enumerate(blocks(grammar[first_fill:], 19, 22, "paren")):
            prompt, options = parse_block(block)
            prompt = f"{material}\n（第 {number} 个空格）\n{prompt}".strip()
            if index < len(fill_answers) and len(options) == 4:
                questions.append(make_question(args.level, "文法", number, prompt, options, fill_answers[index], args.source_url, "文章文法"))

    reading_answers = flatten_answers(answers, "文法・読解", ["4", "5", "6", "7"])
    for index, (number, block) in enumerate(blocks(reading, 23, 38, "space")):
        prompt, options = parse_block(block)
        if index < len(reading_answers) and len(options) == 4:
            questions.append(make_question(args.level, "読解", number, prompt, options, reading_answers[index], args.source_url, "読解"))

    raw_sections = split_raw_sections(text)
    pack: dict[str, Any] = {
        "schemaVersion": 1,
        "id": f"ayumi-quiz-{args.year}-{args.session}-{args.level.lower()}",
        "year": args.year,
        "session": args.session,
        "level": args.level,
        "title": f"{args.year} 年 {args.session} 月 · {args.level} 原卷题目复盘（Ayumi）",
        "sourceName": "Ayumi Language Institute 公开页面",
        "license": "来源页面提供学习资料；题目、答案和音频仍归原权利人",
        "rightsBasis": "用户授权的本机个人学习副本；只保存在 private-assets，不公开再分发",
        "rightsEvidenceUrl": args.rights_evidence_url,
        "sourceUrl": args.source_url,
        "complete": False,
        "fullPaper": False,
        "contentKind": "text-excerpt",
        "questionCount": len(questions),
        "sectionQuestionCounts": {section: sum(1 for question in questions if question["section"] == section) for section in ["文字・語彙", "文法", "読解"]},
        "rawSections": raw_sections,
        "answerKey": answers,
        "listeningAudioUrl": args.listening_audio_url,
        "questions": questions,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{args.out}: {len(questions)} 道可作答题目 · 分区 {pack['sectionQuestionCounts']}")


if __name__ == "__main__":
    main()
