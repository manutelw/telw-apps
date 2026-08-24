from pathlib import Path
import re

path = Path('ascent/practice-core.html')
text = path.read_text(encoding='utf-8')
original = text

old_css = '''    .selected-question-text {
      color: #405a73;
      font-size: 14px;
      line-height: 1.58;
      white-space: pre-wrap;
    }'''
new_css = '''    .selected-question-text {
      color: var(--text);
      font-size: 18px;
      font-weight: 700;
      line-height: 1.6;
      white-space: pre-wrap;
      padding: 14px 16px;
      border: 1px solid #d7e1eb;
      border-radius: 11px;
      background: #ffffff;
    }'''
if old_css in text:
    text = text.replace(old_css, new_css, 1)

old_title = '''      selectedQuestionTitle.textContent =
        selected.title;

      selectedQuestionText.textContent =
        selected.question;'''
new_title = '''      selectedQuestionTitle.textContent =
        selected.mode === "assigned" &&
        String(selected.title || "").trim().toLowerCase() === "ascent task"
          ? "Your assigned question"
          : selected.title;

      selectedQuestionText.textContent =
        String(selected.question || "")
          .replace(/\\s+Instructions:\\s*/i, "\\n\\nInstructions:\\n");'''
if old_title in text:
    text = text.replace(old_title, new_title, 1)

old_option = '''          option.textContent =
            String(
              item.title ||
              item.question ||
              "Assigned Task"
            );'''
new_option = '''          option.textContent =
            String(
              item.question ||
              item.title ||
              "Assigned Task"
            );'''
if old_option in text:
    text = text.replace(old_option, new_option, 1)

# Add a build marker for easy verification.
if 'data-ascent-practice-build=' in text:
    text = re.sub(r'data-ascent-practice-build="[^"]+"', 'data-ascent-practice-build="2026-08-24.1"', text, count=1)
else:
    text = text.replace('<html lang="en">', '<html lang="en" data-ascent-practice-build="2026-08-24.1">', 1)

if text == original:
    print('No learner bulk-question changes needed.')
else:
    path.write_text(text, encoding='utf-8')
    print('Patched learner bulk-question readability.')
