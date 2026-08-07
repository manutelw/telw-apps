function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunk, bytes.length)));
  }
  return btoa(binary);
}

export async function speak(env, text) {
  const apiKey = String(env.OPENAI_API_KEY || "");
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing.");
  const model = String(env.OPENAI_TTS_MODEL || "tts-1");
  const voice = String(env.OPENAI_TTS_VOICE || "alloy");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, voice, input: text, response_format: "mp3", speed: 1 })
  });
  if (!response.ok) {
    throw new Error(`TTS failed (${response.status}): ${(await response.text()).slice(0, 700)}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { audioBase64: bytesToBase64(bytes), mimeType: "audio/mpeg", model, voice };
}
