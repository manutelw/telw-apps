import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const ALLOWED_ORIGINS = new Set([
  "https://manutelw.github.io",
  "https://clarionprep.com",
  "https://www.clarionprep.com"
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://manutelw.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" }
  });
}

async function tts(req: Request, payload: any) {
  const text = String(payload?.text || "").trim();
  const voice = payload?.voice === "cedar" ? "cedar" : "marin";
  if (!text || text.length > 1800) return json(req, { error: "Invalid text" }, 400);

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      response_format: "mp3"
    })
  });
  if (!r.ok) return json(req, { error: "TTS failed", detail: await r.text() }, 502);
  return new Response(await r.arrayBuffer(), {
    status: 200,
    headers: {
      ...cors(req),
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store"
    }
  });
}

async function transcribe(audio: File) {
  const fd = new FormData();
  fd.append("model", "whisper-1");
  fd.append("file", audio, audio.name || "answer.webm");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: fd
  });
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return String(d.text || "").trim();
}

async function evaluate(req: Request, form: FormData) {
  const audio = form.get("audio");
  const prompt = String(form.get("prompt") || "");
  const unit = String(form.get("unit") || "1");
  if (!(audio instanceof File) || audio.size < 500) return json(req, { error: "No usable audio" }, 400);
  if (audio.size > 8_000_000) return json(req, { error: "Audio too large" }, 413);

  const transcript = await transcribe(audio);
  if (!transcript) return json(req, { error: "No speech detected" }, 422);

  const instruction = `You are a warm spoken-English coach. This is Unit ${unit}. The learner is practising English through use, not grammar lectures.\n\nTask: ${prompt}\nLearner said: ${transcript}\n\nGive very short feedback for an A2+/B1 learner. First say one thing that worked. Then give only one useful correction or improvement. If the learner used one of these naturally, notice it: at least, almost, nearly, majority, I use ... for -ing, I need ... to, so that I can, a thing which, a place where, a person who. Do not give a grammar lecture. Do not invent errors. Then give one improved version that keeps the learner's meaning. Return strict JSON with keys feedback and improved.`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: instruction }]
    })
  });
  if (!r.ok) return json(req, { error: "Evaluation failed", detail: await r.text() }, 502);
  const d = await r.json();
  let parsed: any = {};
  try { parsed = JSON.parse(d?.choices?.[0]?.message?.content || "{}"); } catch {}
  return json(req, {
    transcript,
    feedback: String(parsed.feedback || "Good attempt. Make the answer a little clearer and try once more."),
    improved: String(parsed.improved || transcript)
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  if (!OPENAI_API_KEY) return json(req, { error: "Server is not configured" }, 503);

  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      if (String(form.get("action") || "") !== "evaluate") return json(req, { error: "Unknown action" }, 400);
      return await evaluate(req, form);
    }
    const payload = await req.json();
    if (payload?.action === "tts") return await tts(req, payload);
    return json(req, { error: "Unknown action" }, 400);
  } catch (e) {
    return json(req, { error: "Request failed", detail: String(e?.message || e) }, 500);
  }
});
