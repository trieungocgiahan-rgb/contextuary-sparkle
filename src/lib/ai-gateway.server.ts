// Server-only AI gateway provider helper for Lovable AI.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const CHAT_MODEL = "google/gemini-2.5-flash";
export const TTS_MODEL = "google/gemini-2.5-flash-tts";
