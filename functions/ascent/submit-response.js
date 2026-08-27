const SUPABASE_SUBMIT_URL = "https://vtqatrhwfvzyodiftvkc.supabase.co/functions/v1/ascent-submit-response-v2";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643";

export async function onRequestPost(context) {
  try {
    const incoming = context.request;
    const formData = await incoming.formData();

    const upstream = await fetch(SUPABASE_SUBMIT_URL, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": "Bearer " + SUPABASE_PUBLISHABLE_KEY
      },
      body: formData
    });

    const body = await upstream.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    headers.set("Cache-Control", "no-store");

    return new Response(body, {
      status: upstream.status,
      headers
    });
  } catch (error) {
    console.error("ASCENT same-origin submit proxy failed:", error);
    return Response.json(
      {
        ok: false,
        error: "submit_proxy_failed",
        message: "ASCENT could not send the recording to the evaluation service. Please tap Submit Response again."
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" }
  });
}
