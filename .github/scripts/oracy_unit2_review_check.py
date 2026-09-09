from pathlib import Path
import re

h = Path('oracy/unit-2.html').read_text()
c = Path('oracy/unit-2-content.js').read_text()
e = Path('oracy/unit-shared.js').read_text()
r = Path('oracy/conversation-shared.js').read_text()
i = Path('oracy/index.html').read_text()
w = Path('worker.js').read_text()

assert h.count('class="kp"') == 3, 'Unit 2 must have three Key Points'
assert len(re.findall(r'class="activity"', h)) == 15, 'Unit 2 must have 15 questions'
assert len(re.findall(r'class="speak"', h)) == 5, 'Unit 2 must have five speaking tasks'
for x in ['Key Point 1 · Vocabulary', 'Key Point 2 · Grammar', 'Key Point 3 · Pronunciation']:
    assert x in h, x
for q in range(11, 16):
    assert f'data-pron="q{q}"' in h, f'Pronunciation question q{q} must use audio'
for x in ['unitNo:2', "level:'B1A'", 'kp1:[', 'kp2:[', 'kp3:[', 'speaking:{', 'oral:{', 'pron:{']:
    assert x in c, x
for x in ['Task achievement', 'Range', 'Accuracy', 'Fluency', 'Coherence', 'Phonological control', 'MediaRecorder', "voice='marin'", "v||'marin'"]:
    assert x in e, x
assert 'href="./unit-${n}.html"' in i, 'Existing index route generator missing'
assert r'^\/oracy\/unit-(\d+)' in w, 'Server-side unit gate missing'
print('ORACY Unit 2 review checks OK')

assert './conversation-shared.js' in h, 'Unit 2 must use the shared live-conversation engine'
for x in ['RTCPeerConnection', '/v1/realtime/calls', 'input_audio_buffer.speech_started', 'conversation-feedback']:
    assert x in r, f'Shared Realtime conversation engine missing {x}'
assert './unit-2-conversation.js' not in h, 'Unit 2 must not use the retired serial conversation runtime'
