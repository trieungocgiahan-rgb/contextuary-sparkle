// Remembers where a signed-out visitor was headed (e.g. /words?add=ubiquitous) so the
// sign-in page can send them there afterwards. sessionStorage survives the OAuth and
// magic-link round trips, which can't carry extra query params through Supabase.
const KEY = "contextuary:post-auth";

export type PostAuthTarget = { to: string; search?: Record<string, unknown> };

export function savePostAuthTarget(target: PostAuthTarget) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(target));
  } catch {
    /* noop */
  }
}

export function consumePostAuthTarget(): PostAuthTarget | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const t = raw ? (JSON.parse(raw) as PostAuthTarget) : null;
    // Only ever redirect inside the app.
    return t && typeof t.to === "string" && t.to.startsWith("/") && !t.to.startsWith("//") ? t : null;
  } catch {
    return null;
  }
}
