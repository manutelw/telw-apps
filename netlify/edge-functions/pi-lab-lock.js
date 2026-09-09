const SUPABASE_URL = "https://vtqatrhwfvzyodiftvkc.supabase.co";
const SUPABASE_KEY = "sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643";
const VALIDATE = `${SUPABASE_URL}/rest/v1/rpc/ascent_admin_trainer_entry_list`;

export default async function piLabLock(request, context) {
  const url = new URL(request.url);
  const isHandoff = url.pathname === "/pi-lab/admin-handoff";

  if (isHandoff && request.method === "POST") {
    let token = "";
    try {
      const form = await request.formData();
      token = String(form.get("ascent_session_token") || "").trim();
    } catch (_) {
      return notFound();
    }

    if (!token || !(await validAdmin(token))) return notFound();

    return new Response(null, {
      status: 303,
      headers: {
        location: "/pi-lab/admin-builder.html",
        "cache-control": "no-store, max-age=0",
        "x-robots-tag": "noindex, nofollow, noarchive",
        "set-cookie": `clarion_admin_session=${encodeURIComponent(token)}; Path=/pi-lab; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
      },
    });
  }

  if (isHandoff) return notFound();

  const token = readCookie(request.headers.get("cookie") || "", "clarion_admin_session");
  if (!token || !(await validAdmin(token))) return notFound();

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const config = {
  path: ["/pi-lab", "/pi-lab/*"],
};

function readCookie(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

async function validAdmin(token) {
  try {
    const response = await fetch(VALIDATE, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_session_token: token }),
    });
    if (!response.ok) return false;
    const payload = await response.json();
    const result = Array.isArray(payload) ? payload[0] : payload;
    return Boolean(result && result.ok === true);
  } catch (_) {
    return false;
  }
}

function notFound() {
  return new Response("Not found.", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}
