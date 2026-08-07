import { requireLabAccess } from "../_lib/access.js";
import { json, errorMessage } from "../_lib/http.js";
import { selectRows } from "../_lib/supabase.js";

export async function onRequestGet(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access.response;
  try {
    await selectRows(context.env, "ascent_lab_feature_flags", "select=flag_key,enabled&flag_key=eq.DIALOGUE_LAB&limit=1");
    return json({ ok: true, label: "Private lab ready", email: access.email });
  } catch (error) {
    return json({ ok: false, message: errorMessage(error) }, 500);
  }
}
