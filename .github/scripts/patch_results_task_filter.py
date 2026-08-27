from pathlib import Path

p = Path('ascent/trainer.html')
s = p.read_text(encoding='utf-8')

old_controls = '["assignmentTaskFilter","resultTaskFilter"].forEach(id => fillSelect(id,reportData.tasks,"taskUuid",task => task.title || task.question,"All tasks"));'
new_controls = '''fillSelect("assignmentTaskFilter",reportData.tasks,"taskUuid",task => task.title || task.question,"All tasks");
      fillSelect("resultTaskFilter",[
        {value:"PI",label:"PI"},
        {value:"GD",label:"GD"},
        {value:"LUM",label:"LUM"},
        {value:"JD",label:"JD"},
        {value:"ASCENT_TASK",label:"Ascent Task"}
      ],"value",item => item.label,"All tasks");'''
if old_controls in s:
    s = s.replace(old_controls, new_controls, 1)
elif 'fillSelect("resultTaskFilter",[' not in s:
    raise SystemExit('populateControls pattern not found')

marker = '    function resultFilter(rows,prefix) {'
helper = '''    function resultTaskCategory(row) {
      const questionType = String(row && row.questionType || "").trim().toUpperCase();
      const rubricType = String(row && row.rubricType || "").trim().toUpperCase();
      const taskTitle = String(row && row.taskTitle || "").trim().toUpperCase();
      if (taskTitle.includes("JD INTERVIEW MAPPER") || taskTitle.startsWith("JD ") || taskTitle.includes("· JD")) return "JD";
      if (questionType === "PI" || rubricType === "PI") return "PI";
      if (questionType === "GD" || rubricType === "GD") return "GD";
      if (questionType === "LUM") return "LUM";
      if (rubricType === "MANAGERIAL_COMMUNICATION" && taskTitle.startsWith("LUM ")) return "LUM";
      return "ASCENT_TASK";
    }

'''
if 'function resultTaskCategory(row)' not in s:
    if marker not in s:
        raise SystemExit('resultFilter marker not found')
    s = s.replace(marker, helper + marker, 1)

old_task_check = '        if (task && row.taskUuid !== task) return false;'
new_task_check = '''        if (task) {
          if (prefix === "result") {
            if (resultTaskCategory(row) !== task) return false;
          } else if (row.taskUuid !== task) return false;
        }'''
if old_task_check in s:
    s = s.replace(old_task_check, new_task_check, 1)
elif 'resultTaskCategory(row) !== task' not in s:
    raise SystemExit('task filter check not found')

s = s.replace('CUSTOM:"Custom"', 'CUSTOM:"Ascent Task"')
s = s.replace('Custom Questions (ASCENT Task)', 'Ascent Task')
s = s.replace('data-ascent-build="2026-08-24.24"', 'data-ascent-build="2026-08-27.results-filter-1"', 1)

required = [
    'fillSelect("resultTaskFilter",[',
    '{value:"PI",label:"PI"}',
    '{value:"GD",label:"GD"}',
    '{value:"LUM",label:"LUM"}',
    '{value:"JD",label:"JD"}',
    '{value:"ASCENT_TASK",label:"Ascent Task"}',
    'function resultTaskCategory(row)',
    'resultTaskCategory(row) !== task'
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('Verification failed: ' + repr(missing))
if '["assignmentTaskFilter","resultTaskFilter"].forEach' in s:
    raise SystemExit('Old combined task population remains')

p.write_text(s, encoding='utf-8')
print('Trainer Results task filter patched and verified')
