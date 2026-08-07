import { requireLabAccess } from "../../_lib/access.js";
import { json, errorMessage, parseJsonBody, clean } from "../../_lib/http.js";
import { validateStartPayload, maxLearnerTurns } from "../../_lib/types.js";
import { chooseScenario, scenarioPrompt, openingSchema } from "../../_lib/scenarios.js";
import { geminiJson, textInput } from "../../_lib/gemini.js";
import { speak } from "../../_lib/tts.js";
import { insertRows, selectRows } from "../../_lib/supabase.js";

export async function onRequestPost(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access.response;
  try {
    const raw = await parseJsonBody(context.request);
    const dailyLimit = Math.max(1, Number(context.env.LAB_DAILY_SESSION_LIMIT || 25));
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const todaysSessions = await selectRows(context.env, "ascent_lab_sessions", `select=id&tester_email=eq.${encodeURIComponent(access.email)}&created_at=gte.${encodeURIComponent(dayStart.toISOString())}`);
    if (todaysSessions.length >= dailyLimit) throw new Error(`Your private test limit of ${dailyLimit} conversations for today has been reached.`);
    const config = validateStartPayload(raw);
    const mode = String(raw.mode || "NEW_VERSION").toUpperCase();
    const requestedScenarioId = clean(raw.scenarioId) || null;
    const template = await chooseScenario(context.env, config, requestedScenarioId, mode);
    const model = String(context.env.GEMINI_TURN_MODEL || "gemini-3.5-flash-lite");
    const generated = await geminiJson(context.env, {
      model,
      inputs: [textInput(scenarioPrompt(template, config, mode))],
      schema: openingSchema,
      temperature: mode === "RETRY_SAME" ? 0.08 : 0.35,
      maxOutputTokens: 1200
    });
    const opening = clean(generated.opening);
    if (!opening) throw new Error("The scenario generator returned an empty opening.");
    const maximum = maxLearnerTurns(config.practiceType, config.difficulty);
    const snapshot = {
      templateId: template.id,
      sourceType: template.source_type,
      competency: template.competency,
      aiRole: template.ai_role,
      baseSituation: template.base_situation,
      stakes: template.stakes,
      pressurePoint: template.pressure_point,
      approvedFollowupPaths: template.approved_followup_paths,
      scoringCriteria: template.scoring_criteria,
      toneLimits: template.tone_limits,
      expectedResponseElements: template.expected_response_elements,
      surfaceVariation: generated.surface_variation || {}
    };
    const inserted = await insertRows(context.env, "ascent_lab_sessions", [{
      tester_email: access.email,
      scenario_template_id: template.id,
      practice_type: config.practiceType,
      profile_key: config.profileKey,
      level_key: config.levelKey,
      difficulty: config.difficulty,
      topic_key: config.topicKey,
      status: "ACTIVE",
      max_learner_turns: maximum,
      title: clean(generated.title) || template.title,
      situation_summary: clean(generated.situation_summary) || template.base_situation,
      scenario_snapshot: snapshot,
      model_opening: model
    }]);
    const session = inserted[0];
    await insertRows(context.env, "ascent_lab_turns", [{
      session_id: session.id,
      turn_index: 0,
      speaker: "AI",
      turn_kind: "OPENING",
      text: opening,
      model_name: model
    }]);
    const speech = await speak(context.env, opening);
    return json({
      ok: true,
      session: {
        id: session.id,
        scenarioId: template.id,
        title: session.title,
        meta: `${config.practiceType.replaceAll("_", " ")} · ${config.difficulty} · ${template.competency}`,
        maxLearnerTurns: maximum
      },
      opening: { text: opening, ...speech }
    });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 400);
  }
}
