import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing key", { status: 500 });
        const body = (await request.json()) as { text?: string };
        const text = String(body?.text ?? "").slice(0, 400);
        if (!text) return new Response("Missing text", { status: 400 });

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/speech",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-tts",
              stream_format: "sse",
              contents: [
                {
                  role: "user",
                  parts: [{ text: `Say clearly and slowly: ${text}` }],
                },
              ],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
                },
              },
            }),
          },
        );
        if (!upstream.ok) {
          const err = await upstream.text().catch(() => "");
          return new Response(`TTS failed: ${upstream.status} ${err}`, {
            status: upstream.status,
          });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
