import { requireLabAccess } from "../../_lib/access.js";
import { json, errorMessage, clean } from "../../_lib/http.js";
import { firstRow, selectRows, insertRows, updateRows } from "../../_lib/supabase.js";
import { geminiJson, audioInput, textInput } from "../../_lib/gemini.js";
import { speak } from "../../_lib/tts.js";

const ALLOWED_AUDIO = new Set(["audio/webm", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/mpeg", "audio/wav", "audio/aac", "audio/flac"]);

const turnSchema = {
  type: "object",
  properties: {
    transcript: { type: "string" },
    transcription_confidence: { type: "number", minimum: 0, maximum: 1 },
    response_summary: { type: "string" },
    real_concern_addressed: { type: "boolean" },
    evidence_detected: { type: "array", items: { type: "string" }, maxItems: 5 },
    missing_elements: { type: "array", items: { type: "string" }, maxItems: 5 },
    professional_impression: { type: "string", enum: ["PROFESSIONAL", "VAGUE", "DEFENSIVE", "PASSIVE", "MIXED"] },
    follow_up: { type: "string" },
    follow_up_reason: { type: "string" }
  },
  required: ["transcript", "transcription_confidence", "response_summary", "real_concern_addressed", "evidence_detected", "missing_elements", "professional_impression", "follow_up", "follow_up_reason"]
};

function prompt(session, turns, learnerTurnNumber, mustComplete) {
  return `You are the first party in a controlled ASCENT spoken conversation. Transcribe the attached learner audio faithfully and decide the next move.\n\nSESSION\n${JSON.stringify({
    practice_type: session.practice_type,
    profile_key: session.profile_key,
    level_key: session.level_key,
    difficulty: session.difficulty,
    learner_turn_number: learnerTurnNumber,
    maximum_learner_turns: session.max_learner_turns,
    must_complete_after_this_answer: mustComplete,
    scenario: session.scenario_snapshot
  }, null, 2)}\n\nTRANSCRIPT SO FAR\n${JSON.stringify(turns.map((turn) => ({ speaker: turn.speaker, text: turn.text })), null, 2)}\n\nRULES\n1. Do not invent words or evidence not heard in the audio.\n2. Identify whether the learner answered the real concern.\n3. If another learner turn remains, write one relevant spoken follow-up under 35 words. It must arise from the actual answer and follow an approved path.\n4. If this is the last learner answer, set follow_up to an empty string.\n5. A pressure follow-up may be sceptical or firm, but never abusive, insulting, theatrical or unrealistic.\n6. Keep the follow-up professional and do not give feedback yet.\n7. The learner must have a fair chance to clarify, provide evidence, own the issue, recommend an option or state the next step.`;
}

export async function onRequestPost(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access.response;
  try {
    const form = await context.request.formData();
    const sessionId = clean(form.get("sessionId"));
    const audio = form.get("audio");
    if (!sessionId) throw new Error("Session ID is missing.");
    if (!(audio instanceof File) || !audio.size) throw new Error("No audio recording was received.");
    const maxBytes = Number(context.env.LAB_MAX_AUDIO_BYTES || 8 * 1024 * 1024);
    if (audio.size > maxBytes) throw new Error("The recording is too large. Keep each answer under 90 seconds.");
    const mimeType = String(audio.type || "audio/webm").split(";")[0].toLowerCase();
    if (!ALLOWED_AUDIO.has(mimeType)) throw new Error("This audio format is not supported.");

    const session = await firstRow(context.env, "ascent_lab_sessions", `select=*&id=eq.${encodeURIComponent(sessionId)}&tester_email=eq.${encodeURIComponent(access.email)}`);
    if (!session) throw new Error("This test session was not found for the signed-in user.");
    if (session.status !== "ACTIVE") throw new Error("This conversation is no longer active.");

    const turns = await selectRows(context.env, "ascent_lab_turns", `select=*&session_id=eq.${encodeURIComponent(sessionId)}&order=turn_index.asc`);
    const learnerCount = turns.filter((turn) => turn.speaker === "LEARNER").length;
    const learnerTurnNumber = learnerCount + 1;
    if (learnerTurnNumber > session.max_learner_turns) throw new Error("The maximum number of answers has already been reached.");
    const mustComplete = learnerTurnNumber >= session.max_learner_turns;
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const model = String(context.env.GEMINI_TURN_MODEL || "gemini-3.5-flash-lite");
    const analysed = await geminiJson(context.env, {
      model,
      inputs: [audioInput(bytes, mimeType), textInput(prompt(session, turns, learnerTurnNumber, mustComplete))],
      schema: turnSchema,
      temperature: 0.12,
      maxOutputTokens: 1800
    });
    const transcript = clean(analysed.transcript) || "[No intelligible speech detected.]";
    const nextIndex = Math.max(...turns.map((turn) => Number(turn.turn_index)), 0) + 1;
    await insertRows(context.env, "ascent_lab_turns", [{
      session_id: sessionId,
      turn_index: nextIndex,
      speaker: "LEARNER",
      turn_kind: "ANSWER",
      text: transcript,
      analysis: {
        transcriptionConfidence: analysed.transcription_confidence,
        responseSummary: analysed.response_summary,
        realConcernAddressed: analysed.real_concern_addressed,
        evidenceDetected: analysed.evidence_detected || [],
        missingElements: analysed.missing_elements || [],
        professionalImpression: analysed.professional_impression,
        followUpReason: analysed.follow_up_reason
      },
      model_name: model
    }]);

    if (mustComplete) {
      await updateRows(context.env, "ascent_lab_sessions", `id=eq.${encodeURIComponent(sessionId)}&tester_email=eq.${encodeURIComponent(access.email)}`, { status: "READY_FOR_EVALUATION", updated_at: new Date().toISOString() });
      return json({ ok: true, transcript, complete: true, maxLearnerTurns: session.max_learner_turns });
    }

    const followUp = clean(analysed.follow_up);
    if (!followUp) throw new Error("The adaptive follow-up was empty.");
    await insertRows(context.env, "ascent_lab_turns", [{
      session_id: sessionId,
      turn_index: nextIndex + 1,
      speaker: "AI",
      turn_kind: learnerTurnNumber + 1 === session.max_learner_turns ? "FINAL_CHALLENGE" : "FOLLOW_UP",
      text: followUp,
      analysis: { reason: analysed.follow_up_reason },
      model_name: model
    }]);
    const speech = await speak(context.env, followUp);
    return json({
      ok: true,
      transcript,
      complete: false,
      nextLearnerTurn: learnerTurnNumber + 1,
      maxLearnerTurns: session.max_learner_turns,
      followUp: { text: followUp, ...speech }
    });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 400);
  }
}
