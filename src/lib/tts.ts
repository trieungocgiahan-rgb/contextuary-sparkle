// Streams TTS audio via the /api/tts server route and plays PCM chunks.
export async function speak(text: string): Promise<void> {
  if (!text) return;
  const AudioCtx =
    (window.AudioContext as typeof AudioContext) ||
    // @ts-expect-error webkit prefix
    (window.webkitAudioContext as typeof AudioContext);
  const ctx = new AudioCtx({ sampleRate: 24000 });
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  let playhead = 0;
  let pending = new Uint8Array(0);

  const play = (incoming: Uint8Array) => {
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (!usable) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buf = ctx.createBuffer(1, floats.length, 24000);
    buf.copyToChannel(floats, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    if (playhead === 0) playhead = ctx.currentTime + 0.05;
    else playhead = Math.max(playhead, ctx.currentTime);
    src.start(playhead);
    playhead += buf.duration;
  };

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok || !res.body) throw new Error("TTS failed");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data);
        // OpenAI format
        if (payload.type === "speech.audio.delta" && payload.audio) {
          const bin = atob(payload.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          play(bytes);
          continue;
        }
        // Google format
        const b64 =
          payload?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          play(bytes);
        }
      } catch {
        /* ignore malformed */
      }
    }
  }
}
