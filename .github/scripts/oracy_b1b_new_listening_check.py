#!/usr/bin/env python3
"""Block-level checks for the seven B1B New listening passages."""

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ORACY = ROOT / "oracy"
UNIT_RE = re.compile(r"window\.B1B_NEW_UNIT=(\{.*?\});</script>", re.S)


def load_unit(number: int) -> dict:
    text = (ORACY / f"unit-{number}.html").read_text(encoding="utf-8")
    match = UNIT_RE.search(text)
    assert match, f"Unit {number}: B1B New data was not found"
    assert "b1b-new-renderer.js?v=20260918a" in text, f"Unit {number}: stale renderer reference"
    return json.loads(match.group(1))


def main() -> None:
    monologues = []
    dialogues = []
    for number in range(97, 104):
        unit = load_unit(number)
        assert unit["unitNo"] == number
        assert unit["localNo"] == number - 89
        assert len(unit["keyPoints"]) == 3, f"Unit {number}: expected three key points"
        assert len(unit["tasks"]) == 15, f"Unit {number}: expected 15 speaking tasks"
        for index, key_point in enumerate(unit["keyPoints"], start=1):
            passage = key_point.get("passage", [])
            assert passage, f"Unit {number} KP{index}: empty passage"
            assert all(str(line.get("text", "")).strip() for line in passage), (
                f"Unit {number} KP{index}: empty spoken line"
            )
            speakers = {str(line.get("speaker", "")).strip() for line in passage}
            speakers.discard("")
            target = monologues if len(speakers) <= 1 else dialogues
            target.append((number, index, speakers))

    assert monologues == [(97, 2, {"Presenter"})], (
        "The only single-speaker passage must remain Unit 97 KP2"
    )
    assert len(dialogues) == 20, "Expected 20 genuine dialogue passages"
    assert all(len(speakers) == 2 for _, _, speakers in dialogues), (
        "Every dialogue must have exactly two stable speaker identities"
    )

    renderer = (ORACY / "b1b-new-renderer.js").read_text(encoding="utf-8")
    runtime = (ORACY / "b1b-new.js").read_text(encoding="utf-8")
    for required in (
        'data-passage-kind="monologue"',
        'data-passage-kind="dialogue"',
        'class="spoken-text"',
        'aria-hidden="true"',
    ):
        assert required in renderer, f"Renderer rule missing: {required}"
    for required in (
        "voiceMapFor",
        "x.querySelector('.spoken-text')",
        "prepareAudio",
        "playPreparedGapless",
        "MONOLOGUE_STYLE",
        "DIALOGUE_STYLE",
        "-v2",
    ):
        assert required in runtime, f"Runtime rule missing: {required}"
    assert "x.textContent" not in runtime.split("function segmentsFor", 1)[1].split(
        "async function getAudio", 1
    )[0].split("const lines=", 1)[1], "Dialogue audio must not include display labels"

    print("B1B New listening QA passed: 7 units, 1 monologue, 20 dialogues.")


if __name__ == "__main__":
    main()
