function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunk, bytes.length)));
  }
  return btoa(binary);
}

function collectText(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectText);
  const direct = typeof value.text === "string" ? [value.text] : [];
  return [...direct, ...["content", "contents", "output", "outputs", "parts", "steps"].flatMap((key) => collectText(value[key]))];
}

function extractText(payload) {
  if (payload && typeof payload === "object") {
    if (typeof payload.output_text === "string") return payload.output_text;
    if (typeof payload.outputText === "string") return payload.outputText;
  }
  const candidates = collectText(payload).map((value) => value.trim()).filter(Boolean);
  return candidates.length ? candidates[candidates.length - 1] : "";
}

function parseJsonText(text) {
  return JSON.parse(String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim());
}

export async function geminiJson(env, { model, inputs, schema, temperature = 0.15, maxOutputTokens = 4096 }) {
  const apiKey = String(env.GEMINI_API_KEY || "");
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model,
      input: inputs,
      generation_config: { temperature, max_output_tokens: maxOutputTokens },
      response_format: { type: "text", mime_type: "application/json", schema }
    })
  });
  const responseText = await response.text();
  let payload;
  try { payload = responseText ? JSON.parse(responseText) : {}; } catch { payload = { raw_response: responseText }; }
  if (!response.ok) throw new Error(`Gemini ${model} failed (${response.status}): ${responseText.slice(0, 900)}`);
  const outputText = extractText(payload);
  if (!outputText) throw new Error(`Gemini ${model} returned no usable text.`);
  return parseJsonText(outputText);
}

export function audioInput(bytes, mimeType) {
  return { type: "audio", data: bytesToBase64(bytes), mime_type: mimeType };
}

export function textInput(text) {
  return { type: "text", text };
}
