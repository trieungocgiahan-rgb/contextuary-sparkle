// The Lovable app streamed pronunciation audio from Lovable's paid TTS endpoint.
// Here we use the browser's built-in speech synthesis instead: free, no server needed.
import { speakText } from "./speech";

export async function speak(text: string): Promise<void> {
  if (!text) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Speech is not supported in this browser");
  }
  speakText(text, { rate: 0.85 });
}
