import { requireLabAccess } from "../../_lib/access.js";
import { json, errorMessage, parseJsonBody, clean } from "../../_lib/http.js";
import { firstRow, selectRows, insertRows, updateRows } from "../../_lib/supabase.js";
import { geminiJson, textInput } from "../../_lib/gemini.js";
import { SCORE_CRITERIA } from "../../_lib/types.js";

const evaluationSchema = {
  type: "object",
  properties: {
    overall_score: { type: "number", minimum: 0, maximum: 10 },
    criterion_scores: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, score: { type: "number", minimum: 0, maximum: 10 }, evidence: { type: "string" } },
        required: ["label", "score", "evidence"]
      },
      minItems: 5,
      maxItems: 8
    },
    strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 1 },
    weaknesses: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 1 },
    concern_answer: { type: "string" },
    professional_impression: { type: "string" },
    missed_evidence: { type: "string" },
    improved_response: { type: "string" },
    practice_instruction: { type: "string" }
  },
  required: ["overall_score", "criterion_scores", "strengths", "weaknesses", "concern_answer", "professional_impression", "missed_evidence", "improved_response", "practice_instruction"]
};

function evaluationPrompt(session, turns) {
  const criteria = SCORE_CRITERIA[session.practice_type];

  return `Evaluate the COMPLETE ASCENT spoken exchange, not each answer in isolation.

SCENARIO
${JSON.stringify(session.scenario_snapshot, null, 2)}

SELECTION
${JSON.stringify({
  practice_type: session.practice_type,
  profile_key: session.profile_key,
  level_key: session.level_key,
  difficulty: session.difficulty
}, null, 2)}

TRANSCRIPT AND TURN ANALYSIS
${JSON.stringify(
  turns.map((turn) => ({
    speaker: turn.speaker,
    kind: turn.turn_kind,
    text: turn.text,
    analysis: turn.analysis
  })),
  null,
  2
)}

MANDATORY SCORING CRITERIA
${JSON.stringify(criteria)}

SCORING RULES
- Score only what the learner clearly demonstrated.
- Do not infer what the learner may have intended.
- When a higher score requires inference, award the lower score.
- Consider listening, responsiveness and recovery across turns.
- Do not reward invented evidence.
- Use all and only the mandatory criterion labels, in the same order.
- The improved response may use only facts already provided by the learner.
- Never invent achievements, numbers, actions or results.
- Use short, clear, student-facing language.

MANDATORY COACHING FORMAT

1. strengths
Return exactly one specific success.
Use this pattern:
"You [state exactly what the learner did]. This helped because [state its positive effect]."

Do not give vague praise such as:
"Good answer", "Well done", "You were confident" or "Nice attempt".

2. weaknesses
Return exactly one specific action that weakened the response.
Use this pattern:
"You [state exactly what the learner did]. This weakened your response because [effect]. Instead, [give an exact replacement action, structure or speaking chunk]."

3. missed_evidence
Identify the most important element the learner did not include.
Use this pattern:
"You did not [state the missing element]. Do it this way: [give the exact step, structure or speaking chunk to use]."

4. practice_instruction
Give one compulsory and immediately usable retry instruction.
It must begin:
"Retry now:"

Tell the learner exactly what to change in the next attempt.
Do not give a long improvement plan.

5. improved_response
Show how the learner could organise the same facts more effectively.
Use only information already present in the transcript.
If an essential fact is missing, use a bracketed prompt such as:
"[state the result]" or "[give one example]".
Do not invent the missing information.

FEEDBACK QUALITY RULES
- Refer to observable evidence from the learner's response.
- Explain why the successful or weak action mattered.
- Give replacement language wherever useful.
- Focus on one correction and one missing element.
- Make the next attempt easier to perform.
- Keep the language suitable for a B1 learner.
- The feedback must help the learner retry immediately.`;
}
export async function onRequestPost(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access.response;
  try {
    const body = await parseJsonBody(context.request);
    const sessionId = clean(body.sessionId);
    if (!sessionId) throw new Error("Session ID is missing.");
    const session = await firstRow(context.env, "ascent_lab_sessions", `select=*&id=eq.${encodeURIComponent(sessionId)}&tester_email=eq.${encodeURIComponent(access.email)}`);
    if (!session) throw new Error("This test session was not found for the signed-in user.");
    const existing = await firstRow(context.env, "ascent_lab_results", `select=*&session_id=eq.${encodeURIComponent(sessionId)}`);
    if (existing) return json({ ok: true, result: formatResult(existing) });
    if (!['READY_FOR_EVALUATION', 'ACTIVE'].includes(session.status)) throw new Error("This session cannot be evaluated.");
    const turns = await selectRows(context.env, "ascent_lab_turns", `select=*&session_id=eq.${encodeURIComponent(sessionId)}&order=turn_index.asc`);
    const learnerCount = turns.filter((turn) => turn.speaker === "LEARNER").length;
    if (learnerCount < session.max_learner_turns) throw new Error("Complete all required learner turns before evaluation.");
    const model = String(context.env.GEMINI_EVALUATION_MODEL || "gemini-3.6-flash");
    const evaluated = await geminiJson(context.env, {
      model,
      inputs: [textInput(evaluationPrompt(session, turns))],
      schema: evaluationSchema,
      temperature: 0.08,
      maxOutputTokens: 3600
    });
    const inserted = await insertRows(context.env, "ascent_lab_results", [{
      session_id: sessionId,
      tester_email: access.email,
      overall_score: Number(evaluated.overall_score),
      criterion_scores: evaluated.criterion_scores,
      strengths: evaluated.strengths,
      weaknesses: evaluated.weaknesses,
      concern_answer: clean(evaluated.concern_answer),
      professional_impression: clean(evaluated.professional_impression),
      missed_evidence: clean(evaluated.missed_evidence),
      improved_response: clean(evaluated.improved_response),
      practice_instruction: clean(evaluated.practice_instruction),
      transcript: turns.map((turn) => ({ speaker: turn.speaker, text: turn.text })),
      model_name: model
    }]);
    await updateRows(context.env, "ascent_lab_sessions", `id=eq.${encodeURIComponent(sessionId)}&tester_email=eq.${encodeURIComponent(access.email)}`, { status: "COMPLETED", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return json({ ok: true, result: formatResult(inserted[0]) });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 400);
  }
}

function formatResult(row) {
  return {
    overallScore: row.overall_score,
    criterionScores: row.criterion_scores || [],
    strengths: row.strengths || [],
    weaknesses: row.weaknesses || [],
    concernAnswer: row.concern_answer,
    professionalImpression: row.professional_impression,
    missedEvidence: row.missed_evidence,
    improvedResponse: row.improved_response,
    practiceInstruction: row.practice_instruction,
    transcript: row.transcript || []
  };
}
