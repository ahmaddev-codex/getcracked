import Image from 'next/image';

/**
 * A learner's profile picture, with the initial as a fallback.
 *
 * Signing in with Google or GitHub gives us an avatar URL, which Better Auth
 * stores on the user. Rendering it is what makes an account feel like *theirs*
 * rather than a row in a table — and it is the first thing a learner checks
 * after linking a provider.
 *
 * The fallback is not decorative: an email-and-password account has no image at
 * all, and a provider can return a URL that later 404s. A coloured initial is a
 * defined state rather than a broken-image icon.
 *
 * Hosts are allowlisted in `next.config.ts` to the two providers we support.
 * `next/image` will fetch and re-serve whatever URL it is given, so an
 * unrestricted allowlist would turn the image optimiser into an open proxy for
 * any URL that could be written into a user row.
 */
export function Avatar({
  src,
  name,
  email,
  size,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email: string;
  /** Intrinsic pixel size handed to the optimiser. */
  size: number;
  /** Rendered size, as token-backed utilities — the project bans inline styles. */
  className: string;
}) {
  const label = name?.trim() || email;
  const initial = label.charAt(0).toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        // Decorative: the name is always rendered beside it, so announcing the
        // image as well would just repeat it.
        aria-hidden
        className={`shrink-0 rounded-full border-2 border-border-strong object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border-2 border-border-strong bg-accent-strong font-bold text-accent-foreground ${className}`}
    >
      {initial}
    </span>
  );
}
