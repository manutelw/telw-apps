from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
js=(ROOT/'oracy/unit-speaking-gym-v2.js').read_text()
natural=(ROOT/'oracy/unit-speaking-model-natural.js').read_text()
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
    'natural human model conversations',
    'dialogueWindow',
    'splitSentences',
    'Sound like two real adults having a natural, friendly conversation',
    'Never sound like a language drill or textbook recital',
    'unit_no:UNIT',
    'passage_id:k',
]
for token in required_natural:
    assert token in natural, f'ORACY natural-model contract missing: {token}'
assert 'What about you?' not in natural, 'Mechanical reciprocal question reintroduced into natural-model layer'

assert "unitNo>=2 && !html.includes('unit-speaking-gym-v2.js')" in worker
assert 'unit-speaking-gym-v2.js?v=20260910' in worker
assert "unitNo>=2 && !html.includes('unit-speaking-model-natural.js')" in worker
assert 'unit-speaking-model-natural.js?v=20260910' in worker

for n in range(2,31):
    html=ROOT/f'oracy/unit-{n}.html'
    content=ROOT/f'oracy/unit-{n}-content.js'
    assert html.exists(), f'Unit {n} HTML missing'
    assert content.exists(), f'Unit {n} content missing'

# Unit 1 remains on its independent military-grade implementation.
assert 'unit-speaking-gym-v2.js' not in (ROOT/'oracy/unit-1.html').read_text()
assert 'unit-speaking-model-natural.js' not in (ROOT/'oracy/unit-1.html').read_text()

print('ORACY Units 2-30 speaking-gym + natural-model contract intact')
