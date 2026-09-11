from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORACY = ROOT / "oracy"

STYLE = ".model{margin:10px 0;padding:10px 12px;border-left:3px solid var(--gold);background:#fffaf0;border-radius:8px;line-height:1.5}.unit-nav{display:flex;justify-content:space-between;gap:12px;margin-top:18px}.unit-nav a{color:var(--ink);font-weight:700;text-decoration:none}.marker-guide{margin:10px 0;padding:10px 12px;border:1px solid #efd7a0;border-radius:10px;background:#fff8e8;line-height:1.45}.conversation-panel{margin-top:14px;padding:14px;border:1px solid #cfe0ec;border-radius:12px;background:#fff}.conversation-log{display:flex;flex-direction:column;gap:9px;max-height:340px;overflow:auto}.conversation-bubble{max-width:86%;padding:9px 12px;border-radius:13px;line-height:1.45}.conversation-bubble.coach{align-self:flex-start;background:#eef5fa}.conversation-bubble.learner{align-self:flex-end;background:#fff3d5}.conversation-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.mic-light{width:11px;height:11px;border-radius:50%;background:#8996a0}.mic-light.on{background:#18a05e;box-shadow:0 0 0 5px rgba(24,160,94,.14)}.conversation-state{font-weight:700}.conversation-panel button.secondary{background:#fff;color:var(--ink);border:1px solid #9fb4c3}.hidden{display:none!important}"

for local in range(2, 31):
    global_no = local + 60
    (ORACY / f"unit-{global_no}-content.js").write_text(
        f"window.ORACY_D_LOCAL_UNIT={local};\n", encoding="utf-8"
    )
    (ORACY / f"unit-{global_no}.js").write_text(
        "window.initLevelDVocabulary();\n", encoding="utf-8"
    )
    html = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        f'<title>ORACY · Level D · Unit {local}</title>'
        '<link rel="stylesheet" href="./oracy.css"><style>' + STYLE + '</style></head><body>'
        f'<script src="./unit-{global_no}-content.js?v=20260911a"></script>'
        '<script src="./level-d-units-2-30.js?v=20260911a"></script>'
        '<script>window.ORACY_UNIT_ANSWER_NOTES=window.ORACY_UNIT.notes;window.ORACY_UNIT.notes={};</script>'
        '<script src="./unit-renderer-c.js?v=20260911a"></script>'
        '<script>window.ORACY_UNIT.notes=window.ORACY_UNIT_ANSWER_NOTES;</script>'
        '<script src="./level-d-vocabulary-runtime.js?v=20260911a"></script>'
        f'<script src="./unit-{global_no}.js?v=20260911a"></script>'
        '<script src="./unit-shared.js?v=20260911a"></script>'
        '<script src="./conversation-shared.js?v=20260911a"></script>'
        '<script src="./level-system-d-2-30.js?v=20260911a"></script>'
        '</body></html>\n'
    )
    (ORACY / f"unit-{global_no}.html").write_text(html, encoding="utf-8")

print("Built Level D Units 2-30 without touching frozen Unit 1")
