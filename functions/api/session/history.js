import { requireLabAccess } from "../../_lib/access.js";
import { json, errorMessage } from "../../_lib/http.js";
import { selectRows } from "../../_lib/supabase.js";

export async function onRequestGet(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access.response;
  try {
    const rows = await selectRows(context.env, "ascent_lab_results", `select=session_id,overall_score,created_at,ascent_lab_sessions!inner(title,practice_type,difficulty,topic_key)&tester_email=eq.${encodeURIComponent(access.email)}&order=created_at.desc&limit=25`);
    const items = rows.map((row) => ({
      sessionId: row.session_id,
      score: row.overall_score,
      completedAt: row.created_at,
      title: row.ascent_lab_sessions?.title || "ASCENT Dialogue",
      meta: [row.ascent_lab_sessions?.practice_type, row.ascent_lab_sessions?.difficulty, row.ascent_lab_sessions?.topic_key].filter(Boolean).join(" · ").replaceAll("_", " ")
    }));
    return json({ ok: true, items });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 500);
  }
}
