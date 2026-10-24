# Offline Japanese lookup data

openjlpt-jlpt.json is a reduced derivative of the Tomoshi open data layer, release v2026-10-13.

The file keeps only JLPT N5–N2 entries, surface forms, readings, community level tags and short Simplified Chinese glosses. It does not include the source database, example sentences or proprietary Tomoshi application layers.

The derived data is provided under CC BY-SA 4.0. Attribution:

> Contains data from Tomoshi (Y1Z), derived from JMdict and KANJIDIC2 (EDRDG), with JLPT level data from the OpenJLPT/Tanos lineage.

The source data and upstream licences are documented in the Tomoshi repository's NOTICE.md and LICENSE.md. JLPT level tags are community estimates, not an official JLPT vocabulary list.

To rebuild the file, place tomoshi-dict-open.db at /tmp/tomoshi-dict-open.db and run:

    python3 scripts/build-openjlpt-index.py
