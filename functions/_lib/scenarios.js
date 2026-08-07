import { selectRows, firstRow } from "./supabase.js";

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function relevant(template, config) {
  const profileOkay = !template.profile_key || template.profile_key === config.profileKey;
  const levelOkay = !template.level_key || template.level_key === config.levelKey;
  const topicOkay = config.topicKey === "SURPRISE" || template.topic_key === config.topicKey;
  return profileOkay && levelOkay && topicOkay;
}

export async function chooseScenario(env, config, requestedScenarioId, mode) {
  if (requestedScenarioId && mode === "RETRY_SAME") {
    const exact = await firstRow(env, "ascent_lab_scenario_templates", `select=*&id=eq.${encodeURIComponent(requestedScenarioId)}&active=eq.true`);
    if (exact) return exact;
  }

  const rows = await selectRows(env, "ascent_lab_scenario_templates", `select=*&practice_type=eq.${config.practiceType}&active=eq.true&order=created_at.asc`);
  let candidates = rows.filter((row) => relevant(row, config));
  if (!candidates.length && config.topicKey !== "SURPRISE") {
    candidates = rows.filter((row) => relevant(row, { ...config, topicKey: "SURPRISE" }));
  }
  if (!candidates.length) throw new Error("No approved scenario template matches this selection.");

  if (config.practiceType !== "WORKPLACE_DIALOGUE") {
    const existing = candidates.filter((row) => row.source_type === "EXISTING_ASCENT");
    const newOnes = candidates.filter((row) => row.source_type === "NEW_WORKPLACE");
    const desired = Math.random() < 0.7 ? existing : newOnes;
    if (desired.length) candidates = desired;
  }
  return randomItem(candidates);
}

export function scenarioPrompt(template, config, mode) {
  return `You are creating one controlled ASCENT spoken-practice scenario.\n\nFIXED TEMPLATE\n${JSON.stringify({
    title: template.title,
    practice_type: template.practice_type,
    competency: template.competency,
    ai_role: template.ai_role,
    base_situation: template.base_situation,
    base_opening: template.base_opening,
    stakes: template.stakes,
    pressure_point: template.pressure_point,
    expected_response_elements: template.expected_response_elements,
    approved_followup_paths: template.approved_followup_paths,
    tone_limits: template.tone_limits
  }, null, 2)}\n\nLEARNER SELECTION\n${JSON.stringify(config, null, 2)}\n\nMODE: ${mode}\n\nCreate a realistic surface version. Keep the competency and scoring standard fixed. Vary only industry, organisation type, role, project, urgency, names, reason for the problem and other surface details. The AI is the first party. The opening must be one or two spoken sentences, professional, natural and under 55 words. Do not explain the exercise. Do not invent facts about the learner. Pressure may be firm or sceptical but never abusive, insulting, theatrical or unrealistic.`;
}

export const openingSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    situation_summary: { type: "string" },
    opening: { type: "string" },
    surface_variation: { type: "object", additionalProperties: { type: "string" } }
  },
  required: ["title", "situation_summary", "opening", "surface_variation"]
};
