from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')
original = text

# Add reminder health panel immediately below the existing follow-up on/off panel.
needle = '''            <div id="followupActivationNote" class="reminder-note">Follow-ups are off. No institutional reminder emails will be sent.</div>
          </div>

          <div class="card-grid">'''
replacement = '''            <div id="followupActivationNote" class="reminder-note">Follow-ups are off. No institutional reminder emails will be sent.</div>
          </div>

          <div class="panel" id="reminderHealthPanel">
            <div class="panel-title-row">
              <div>
                <h3>Reminder system health</h3>
                <div class="panel-subtitle">Automatic checks for scheduler activity, delivery failures, student-data issues and overdue backlog.</div>
              </div>
              <div id="reminderHealthState" class="reminder-state off"><span class="reminder-state-dot"></span><span>UNKNOWN</span></div>
            </div>
            <div class="card-grid" style="grid-template-columns:repeat(6,minmax(130px,1fr));">
              <div class="summary-card"><div class="summary-label">Last successful run</div><div id="reminderLastSuccessValue" class="panel-subtitle">—</div></div>
              <div class="summary-card"><div class="summary-label">Sent · 24h</div><div id="reminderSent24Value" class="summary-value">—</div></div>
              <div class="summary-card"><div class="summary-label">Failed · 24h</div><div id="reminderFailed24Value" class="summary-value">—</div></div>
              <div class="summary-card"><div class="summary-label">Data issues</div><div id="reminderDataIssuesValue" class="summary-value">—</div></div>
              <div class="summary-card"><div class="summary-label">Overdue pending</div><div id="reminderBacklogValue" class="summary-value">—</div></div>
              <div class="summary-card"><div class="summary-label">Next expected run</div><div id="reminderNextRunValue" class="panel-subtitle">—</div></div>
            </div>
            <div id="reminderHealthNote" class="reminder-note">Health data will appear after the reminder dashboard loads.</div>
          </div>

          <div class="card-grid">'''
if 'id="reminderHealthPanel"' not in text:
    if needle not in text:
        raise SystemExit('Reminder panel insertion point not found')
    text = text.replace(needle, replacement, 1)

# Extend reminder render logic with health data.
needle_js = '''      byId("afterFinalReminderValue").textContent = formatNumber(data.didNotRespondAfterFinalReminder || 0);
      byId("followupDeliveryFailuresValue").textContent = formatNumber(data.deliveryFailures || 0);

      byId("followupActivationNote").textContent = enabled'''
replacement_js = '''      byId("afterFinalReminderValue").textContent = formatNumber(data.didNotRespondAfterFinalReminder || 0);
      byId("followupDeliveryFailuresValue").textContent = formatNumber(data.deliveryFailures || 0);

      const health = data.health || {};
      const healthStatus = String(health.status || "UNKNOWN").toUpperCase();
      const healthState = byId("reminderHealthState");
      if (healthState) {
        healthState.className = "reminder-state " + (healthStatus === "HEALTHY" ? "on" : "off");
        if (healthStatus === "WARNING") healthState.style.cssText = "color:#765000;background:#fff8e8;border:1px solid #eab24d;";
        else if (healthStatus === "ALERT") healthState.style.cssText = "color:#b42318;background:#fff0ee;border:1px solid #efb6b0;";
        else healthState.style.cssText = "";
        healthState.innerHTML = `<span class="reminder-state-dot"></span><span>${escapeHtml(healthStatus)}</span>`;
      }
      if (byId("reminderLastSuccessValue")) byId("reminderLastSuccessValue").textContent = formatDate(health.lastSuccessAt);
      if (byId("reminderSent24Value")) byId("reminderSent24Value").textContent = formatNumber(health.sent24h || 0);
      if (byId("reminderFailed24Value")) byId("reminderFailed24Value").textContent = formatNumber(health.failed24h || 0);
      if (byId("reminderDataIssuesValue")) byId("reminderDataIssuesValue").textContent = formatNumber(health.dataIssueStudents || 0);
      if (byId("reminderBacklogValue")) byId("reminderBacklogValue").textContent = formatNumber(health.overdueUnsubmitted || 0);
      if (byId("reminderNextRunValue")) byId("reminderNextRunValue").textContent = formatDate(health.nextExpectedRun);
      const healthNote = byId("reminderHealthNote");
      if (healthNote) {
        const parts = [];
        if (health.schedulerActive !== true) parts.push("The hourly scheduler is not active.");
        if (Number(health.failed24h || 0) > 0) parts.push(`${health.failed24h} delivery failure(s) were recorded in the last 24 hours.`);
        if (Number(health.exhaustedFailures || 0) > 0) parts.push(`${health.exhaustedFailures} reminder(s) exhausted automatic retries.`);
        if (Number(health.staleSending || 0) > 0) parts.push(`${health.staleSending} reminder(s) are stuck in SENDING.`);
        if (Number(health.dataIssueStudents || 0) > 0) parts.push(`${health.dataIssueStudents} active student record(s) need email/institution verification.`);
        if (Number(health.overdueUnsubmitted || 0) > 100) parts.push(`Backlog is high: ${health.overdueUnsubmitted} overdue unsubmitted assignments.`);
        healthNote.textContent = parts.length ? parts.join(" ") : "No reminder-system problems are currently detected.";
        healthNote.style.background = healthStatus === "ALERT" ? "#fff0ee" : healthStatus === "WARNING" ? "#fff8e8" : "#eaf8f1";
        healthNote.style.borderColor = healthStatus === "ALERT" ? "#efb6b0" : healthStatus === "WARNING" ? "#eab24d" : "#a8dec5";
        healthNote.style.color = healthStatus === "ALERT" ? "#b42318" : healthStatus === "WARNING" ? "#765000" : "#18794e";
      }

      byId("followupActivationNote").textContent = enabled'''
if 'const health = data.health || {};' not in text:
    if needle_js not in text:
        raise SystemExit('Reminder render insertion point not found')
    text = text.replace(needle_js, replacement_js, 1)

text, _ = re.subn(r'data-ascent-build="[^"]+"', 'data-ascent-build="2026-08-24.24"', text, count=1)

checks = {
    'panel': 'id="reminderHealthPanel"' in text,
    'health_render': 'const health = data.health || {};' in text,
    'last_success': 'reminderLastSuccessValue' in text,
    'sent24': 'reminderSent24Value' in text,
    'failed24': 'reminderFailed24Value' in text,
    'data_issues': 'reminderDataIssuesValue' in text,
    'backlog': 'reminderBacklogValue' in text,
    'build': 'data-ascent-build="2026-08-24.24"' in text,
}
failed = [k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('Patch verification failed: ' + ', '.join(failed))

if text != original:
    path.write_text(text, encoding='utf-8')
    print('trainer.html patched: reminder health panel added')
else:
    print('trainer.html already has reminder health panel')
