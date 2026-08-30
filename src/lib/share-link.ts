import { LANGUAGES, type Language } from '@/content/schema';

/**
 * Encoding a sandbox run into a link (B6).
 *
 * **The link half of B6, not the GIF half.** A GIF means shipping an encoder to
 * every visitor for a feature nobody has asked for, and it produces a file that
 * cannot be paused, scrubbed, or edited — which is most of what the animation is
 * for. A link reproduces the *live* thing: the recipient gets the code in an
 * editor, can change the input, and can step through it. It is also two orders
 * of magnitude smaller.
 *
 * **In the fragment, never the query.** A fragment is not sent to the server, so
 * a shared snippet never reaches our logs and never becomes a cache key. It also
 * keeps the page statically rendered, which a query parameter would not.
 *
 * **On running code from a link.** The recipient's browser executes whatever was
 * shared, but only when they press Run, and only inside QuickJS or Pyodide —
 * which have no DOM, no network, and no ambient authority (ADR 0001 §5). A
 * hostile snippet can waste the interpreter's own time until the deadline kills
 * it, and nothing else. The code is rendered as editor *text*, never as markup.
 */

export interface SharedRun {
  language: Language;
  /** The function to call. */
  entry: string;
  source: string;
  /** Arguments, exactly as the input field holds them. */
  args: unknown[];
}

/**
 * Practical ceiling on a URL.
 *
 * Browsers and servers differ, and the smallest limit that matters in practice
 * is around 2000 characters — beyond it a link starts getting truncated by
 * whatever it is pasted into, which produces a broken sandbox rather than an
 * error. Refusing to make the link is the honest outcome.
 */
export const MAX_LINK_LENGTH = 2000;

/** URL-safe base64, so the fragment survives being pasted anywhere. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** The fragment for a run — `#c=…`. Callers prepend their own origin and path. */
export function encodeRun(run: SharedRun): string {
  // Short keys because every byte is a byte of URL, and the payload is code.
  return `#c=${toBase64Url(
    JSON.stringify({ l: run.language, e: run.entry, s: run.source, a: run.args }),
  )}`;
}

/**
 * A run from a fragment, or null.
 *
 * Null for anything malformed rather than a thrown error or a partial object: a
 * mangled link is a normal thing to receive — it has been through a chat client
 * that decided the trailing bracket was punctuation — and the page's answer
 * should be to open normally, not to break.
 */
export function decodeRun(fragment: string): SharedRun | null {
  const match = /[#&]c=([A-Za-z0-9\-_]+)/.exec(fragment);
  if (!match) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(match[1]));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const raw = parsed as Record<string, unknown>;

  // Validated field by field. This is attacker-controlled input in the ordinary
  // sense — anyone can craft a link — so nothing is trusted to be the shape it
  // claims, and a bad `language` would otherwise reach the runtime registry.
  if (!LANGUAGES.includes(raw.l as Language)) return null;
  if (typeof raw.e !== 'string' || !raw.e) return null;
  if (typeof raw.s !== 'string' || !raw.s) return null;
  if (!Array.isArray(raw.a)) return null;

  return { language: raw.l as Language, entry: raw.e, source: raw.s, args: raw.a };
}
