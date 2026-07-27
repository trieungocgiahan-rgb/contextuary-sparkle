// Browser SpeechSynthesis wrapper. No network, no cost.
let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang === "en-US" && /google|natural|samantha|female/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  return cachedVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
  pickVoice();
}

export function speakText(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts?.rate ?? 0.95;
  u.pitch = opts?.pitch ?? 1;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
