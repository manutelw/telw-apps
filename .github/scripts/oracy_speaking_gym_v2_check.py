from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
js=(ROOT/'oracy/unit-speaking-gym-v2.js').read_text()
natural=(ROOT/'oracy/unit-speaking-model-natural.js').read_text()
coherent=(ROOT/'oracy/unit-speaking-model-coherent.js').read_text()
target_cued=(ROOT/'oracy/unit-speaking-model-target-cued.js').read_text()
quality=(ROOT/'oracy/unit-speaking-model-quality.js').read_text()
worker=(ROOT/'worker-oracy.js').read_text()

required_js=[
    "Number(U.unitNo)<2||Number(U.unitNo)>30",
    "Vocabulary speaking drill",
    "Question 1 of 3",
    "Respond to statement",
    "Pronunciation & stress",
    "Key Point structure",
    "Conversation markers",
    "Free answer",
    "Compress",
    "Target language",
    "React",
    "Pressure finish",
    "warmModel",
    "passage_id:key",
    "oracy-v2-speaking-gym",
    "oracy-v2-vocab-drill",
]
for token in required_js:
    assert token in js, f'ORACY speaking-gym contract missing: {token}'

required_natural=[
    'natural, non-repeating human model conversations',
    'dialogueWindow',
    'splitSentences',
    'structuralSignature',
    'variedModel',
    'const PATTERNS=[',
    'const FIXED={',
    'Sound like two real adults having a natural, friendly conversation',
    'Never sound like a language drill or textbook recital',
    'unit_no:UNIT',
    'passage_id:k',
]
for token in required_natural:
    assert token in natural, f'ORACY natural-model contract missing: {token}'
assert 'What about you?' not in natural, 'Mechanical reciprocal question reintroduced into natural-model layer'

required_coherent=[
    'coherence layer for vocabulary model conversations',
    "30:'reflection'",
    "14:'process'",
    "if(n==='perspective')",
    'Each turn must sound like a direct response to the previous turn',
    'unit_no:UNIT',
    'passage_id:k',
]
for token in required_coherent:
    assert token in coherent, f'ORACY coherent-model contract missing: {token}'

required_target_cued=[
    'final target-cue layer for vocabulary model conversations',
    "'perspective':s=>",
    'Every turn must directly respond to the previous turn',
    'unit_no:UNIT',
    'passage_id:k',
]
for token in required_target_cued:
    assert token in target_cued, f'ORACY target-cue contract missing: {token}'

required_quality=[
    'final vocabulary model quality layer',
    'One vocabulary target per dialogue',
    'stripOtherTargets',
    'statementCue',
    'statementFollow',
    'targetQuestionModel',
    'imperativeModel',
    'declarativeModel',
    'singleTarget',
    'Use a natural mix of questions, answers, statements and responses',
    'single-target-mixed',
]
for token in required_quality:
    assert token in quality, f'ORACY vocabulary model quality contract missing: {token}'

assert "path==='/oracy/unit-speaking-gym-v2.js'" in worker
assert 'patchSpeakingGymVocabularySource' in worker
assert 'function approvedTargets()' in worker
assert '.slice(0,6)' in worker
assert 'const shift=kp%base.length' in worker
assert 'unit-speaking-gym-v2.js?v=20260910c' in worker
assert "unitNo>=2 && !html.includes('unit-speaking-model-natural.js')" in worker
assert 'unit-speaking-model-natural.js?v=20260910b' in worker
assert "unitNo>=2 && !html.includes('unit-speaking-model-coherent.js')" in worker
assert 'unit-speaking-model-coherent.js?v=20260910' in worker
assert "unitNo>=2 && !html.includes('unit-speaking-model-target-cued.js')" in worker
assert 'unit-speaking-model-target-cued.js?v=20260910' in worker
assert "unitNo>=2 && !html.includes('unit-speaking-model-quality.js')" in worker
assert 'unit-speaking-model-quality.js?v=20260910' in worker

for n in range(2,31):
    html=ROOT/f'oracy/unit-{n}.html'
    content=ROOT/f'oracy/unit-{n}-content.js'
    assert html.exists(), f'Unit {n} HTML missing'
    assert content.exists(), f'Unit {n} content missing'

# Unit 1 remains on its independent military-grade implementation.
unit1=(ROOT/'oracy/unit-1.html').read_text()
for shared in ['unit-speaking-gym-v2.js','unit-speaking-model-natural.js','unit-speaking-model-coherent.js','unit-speaking-model-target-cued.js','unit-speaking-model-quality.js']:
    assert shared not in unit1

print('ORACY Units 2-30 approved-vocab + single-target mixed-turn dialogue contract intact')
