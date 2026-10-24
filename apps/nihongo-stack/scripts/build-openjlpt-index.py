"""Build a small offline JLPT lookup index from Tomoshi's open SQLite data.

The source database stays outside the repository. The output is a reduced
derived CC BY-SA 4.0 dataset; see public/data/README.md.
"""

import json
import sqlite3
from pathlib import Path

SOURCE = Path("/tmp/tomoshi-dict-open.db")
OUTPUT = Path(__file__).parents[1] / "public/data/openjlpt-jlpt.json"
LEVELS = ("N5", "N4", "N3", "N2")


def build() -> dict:
    if not SOURCE.exists():
        raise SystemExit(f"missing source database: {SOURCE}")
    connection = sqlite3.connect(SOURCE)
    connection.row_factory = sqlite3.Row
    entries = {}
    for row in connection.execute(
        """
        SELECT v.entry_id, v.level, e.data
        FROM vocab_jlpt v
        JOIN entries e ON e.id = v.entry_id
        WHERE v.level IN ('N5', 'N4', 'N3', 'N2')
        """
    ):
        source = json.loads(row["data"])
        kanji = [item["text"] for item in source.get("kanji", []) if item.get("text")]
        kana = [item["text"] for item in source.get("kana", []) if item.get("text")]
        chinese = []
        english = []
        for sense in source.get("senses", []):
            for gloss in sense.get("glosses", []):
                text = str(gloss.get("text", "")).strip()
                if not text:
                    continue
                (chinese if gloss.get("lang") == "zho" else english).append(text)
        gloss = "；".join(dict.fromkeys(chinese[:6])) or "；".join(dict.fromkeys(english[:3]))
        if not gloss or not kana:
            continue
        entries[row["entry_id"]] = {
            "id": row["entry_id"],
            "surface": kanji[0] if kanji else kana[0],
            "forms": list(dict.fromkeys(kanji + kana)),
            "reading": kana[0],
            "gloss": gloss,
            "level": row["level"],
        }
    connection.close()

    index = {}
    for entry in entries.values():
        for surface in entry["forms"]:
            candidate = {**entry, "surface": surface}
            current = index.get(surface)
            if current is None or candidate["level"] < current["level"]:
                index[surface] = candidate
    return {
        "schemaVersion": 1,
        "source": "Tomoshi open data layer derived from JMdict/KANJIDIC2 and JLPT community lists",
        "license": "CC BY-SA 4.0",
        "attribution": "Tomoshi (Y1Z), EDRDG JMdict/KANJIDIC2, and JLPT level data from the OpenJLPT/Tanos lineage",
        "levels": {level: sum(item["level"] == level for item in entries.values()) for level in LEVELS},
        "entries": index,
    }


if __name__ == "__main__":
    result = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({
        "entryCount": sum(result["levels"].values()),
        "surfaceCount": len(result["entries"]),
        "levels": result["levels"],
        "bytes": OUTPUT.stat().st_size,
        "output": str(OUTPUT),
    }, ensure_ascii=False))
