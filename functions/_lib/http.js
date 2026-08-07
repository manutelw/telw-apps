export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

export function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function parseJsonBody(request) {
  return request.json().catch(() => ({}));
}

export function corslessNoStore(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
