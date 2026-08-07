function credentials(env) {
  const url = String(env.SUPABASE_LAB_URL || "").replace(/\/$/, "");
  const key = String(env.SUPABASE_LAB_SERVICE_ROLE_KEY || "");
  if (!url || !key) throw new Error("Staging Supabase credentials are missing.");
  return { url, key };
}

function headers(env, prefer = "") {
  const { key } = credentials(env);
  const result = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
  if (prefer) result.Prefer = prefer;
  return result;
}

async function decode(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    throw new Error(`Staging database request failed (${response.status}): ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }
  return payload;
}

export async function selectRows(env, table, query = "") {
  const { url } = credentials(env);
  const response = await fetch(`${url}/rest/v1/${table}${query ? `?${query}` : ""}`, { headers: headers(env) });
  return decode(response);
}

export async function insertRows(env, table, rows) {
  const { url } = credentials(env);
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(env, "return=representation"),
    body: JSON.stringify(rows)
  });
  return decode(response);
}

export async function updateRows(env, table, query, changes) {
  const { url } = credentials(env);
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: headers(env, "return=representation"),
    body: JSON.stringify(changes)
  });
  return decode(response);
}

export async function firstRow(env, table, query) {
  const rows = await selectRows(env, table, `${query}&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
