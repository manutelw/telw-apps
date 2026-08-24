from pathlib import Path

path = Path('ascent/trainer-login.html')
text = path.read_text(encoding='utf-8')
original = text
text = text.replace('                  : "./trainer.html";', '                  : "./trainer.html?v=20260824.8";', 1)
if text == original:
    print('Trainer login cache-bust already present or redirect pattern changed.')
else:
    path.write_text(text, encoding='utf-8')
    print('Patched trainer login redirect with cache-busting version.')
