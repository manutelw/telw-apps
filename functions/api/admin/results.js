import { requireLabAdmin } from "../../_lib/access.js";
import { json, errorMessage } from "../../_lib/http.js";
import { selectRows } from "../../_lib/supabase.js";

export async function onRequestGet(context) {
  const access = await requireLabAdmin(context);
  if (access.response) return access.response;
  try {
    const url = new URL(context.request.url);
    const practiceType = String(url.searchParams.get("practiceType") || "").toUpperCase();
    const difficulty = String(url.searchParams.get("difficulty") || "").toUpperCase();
    const tester = String(url.searchParams.get("tester") || "").trim().toLowerCase();
    const filters = [
      "select=session_id,tester_email,overall_score,criterion_scores,strengths,weaknesses,concern_answer,professional_impression,missed_evidence,practice_instruction,created_at,ascent_lab_sessions!inner(title,practice_type,profile_key,level_key,difficulty,topic_key,situation_summary)",
      "order=created_at.desc",
      "limit=100"
    ];
    if (practiceType) filters.push(`ascent_lab_sessions.practice_type=eq.${encodeURIComponent(practiceType)}`);
    if (difficulty) filters.push(`ascent_lab_sessions.difficulty=eq.${encodeURIComponent(difficulty)}`);
    if (tester) filters.push(`tester_email=eq.${encodeURIComponent(tester)}`);
    const rows = await selectRows(context.env, "ascent_lab_results", filters.join("&"));
    return json({ ok: true, items: rows.map((row) => ({
      sessionId: row.session_id,
      testerEmail: row.tester_email,
      score: row.overall_score,
      completedAt: row.created_at,
      title: row.ascent_lab_sessions?.title || "ASCENT Dialogue",
      practiceType: row.ascent_lab_sessions?.practice_type,
      difficulty: row.ascent_lab_sessions?.difficulty,
      profileOrLevel: row.ascent_lab_sessions?.level_key || row.ascent_lab_sessions?.profile_key || "—",
      topic: row.ascent_lab_sessions?.topic_key,
      situation: row.ascent_lab_sessions?.situation_summary,
      professionalImpression: row.professional_impression,
      concernAnswer: row.concern_answer,
      practiceInstruction: row.practice_instruction,
      criterionScores: row.criterion_scores || []
    })) });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 500);
  }
}
