from pathlib import Path
import re

h = Path('oracy/unit-3.html').read_text()
c = Path('oracy/unit-3-content.js').read_text()
shared = Path('oracy/unit-shared.js').read_text()
conversation = Path('oracy/conversation-shared.js').read_text()
voice = Path('supabase/functions/oracy-voice/index.ts').read_text()

assert h.count('class="kp"') == 3, 'Unit 3 must have three Key Points'
assert len(re.findall(r'class="activity"', h)) == 15, 'Unit 3 must have 15 questions'
assert len(re.findall(r'class="speak"', h)) == 5, 'Unit 3 must have five speaking tasks'
for x in ['Key Point 1 · Vocabulary', 'Key Point 2 · Grammar', 'Key Point 3 · Pronunciation and voice']:
    assert x in h, x
for q in range(11, 16):
    assert f'data-pron="q{q}"' in h, f'Pronunciation question q{q} must use audio'
for x in [
    'unitNo:3', "level:'B1A'", "title:'Will It Rain on Our Picnic?'",
    'forecast', 'clear up', 'likely', 'perhaps', 'definitely',
    "I hope so", "I hope not", 'kp1:[', 'kp2:[', 'kp3:[',
    'speaking:{', 'oral:{', 'pron:{', 'feedbackGuidance'
]:
    assert x in c, x
for x in ['If it rains', 'might rain', 'will probably', "I’ll", "we’ll", "won’t"]:
    assert x in h or x in c, x
assert 'data-speak="s4" data-ai-conversation' in h, 'Speaking 4 must be the AI weather decision'
assert './conversation-shared.js' in h, 'Unit 3 must reuse the shared Realtime engine'
assert 'RTCPeerConnection' in conversation and '/v1/realtime/calls' in conversation
assert 'feedbackGuidance' in shared, 'Shared evaluator must accept unit-specific guidance'
for x in ['3:{', 'Will It Rain on Our Picnic?', 'realtimeToken', 'conversationFeedback', 'unitNo===3?unit3Instruction']:
    assert x in voice, f'Unit 3 voice configuration missing {x}'

kp1 = c.split('kp1:[', 1)[1].split('],\n    kp2:', 1)[0]
kp2 = c.split('kp2:[', 1)[1].split('],\n    kp3:', 1)[0]
assert len(re.findall(r"\['", kp1)) >= 1, 'KP1 forecast missing'
assert len(re.findall(r"\['", kp2)) == 15, 'KP2 conversation must have 15 turns'

print('ORACY Unit 3 review checks OK')
