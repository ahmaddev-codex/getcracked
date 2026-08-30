'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { Avatar } from '@/components/account/Avatar';
import { StreakBadge } from '@/components/account/StreakBadge';

/**
 * The signed-in account menu (A2).
 *
 * Sign-out had no entry point anywhere in the product — a learner could create
 * an account and then had no way out of it short of clearing cookies. That is
 * the kind of gap that reads as the product being unfinished, and on a shared
 * machine it is a real problem rather than an inconvenience.
 *
 * A menu rather than a bare "Sign out" link, because the header also needs to
 * say *who* is signed in. Two accounts on one machine is common enough that
 * showing the email is what makes the state legible.
 */
export function AccountMenu({
  email,
  name,
  image,
}: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as globalThis.Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = name?.trim() || email;

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-node px-2 py-1 text-sm transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        <Avatar src={image} name={name} email={email} size={24} className="h-6 w-6 text-xs" />
        <span className="max-w-32 truncate">{label}</span>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="node-surface absolute right-0 z-50 mt-2 w-60 bg-surface p-1 text-foreground"
        >
          <p className="truncate px-3 py-2 text-xs text-foreground-muted">{email}</p>

          <Link
            role="menuitem"
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xs px-3 py-2 text-sm hover:bg-surface-muted"
          >
            <LayoutDashboard size={14} aria-hidden />
            Dashboard
          </Link>
          <Link
            role="menuitem"
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xs px-3 py-2 text-sm hover:bg-surface-muted"
          >
            <User size={14} aria-hidden />
            Account
          </Link>

          <button
            role="menuitem"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await signOut();
              setOpen(false);
              // Refresh rather than push: server components hold the session,
              // so navigating alone would render the signed-in shell from cache.
              router.refresh();
              router.push('/');
            }}
            className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-left text-sm text-danger hover:bg-surface-muted disabled:opacity-60"
          >
            <LogOut size={14} aria-hidden />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Header slot: the menu when signed in, the two calls to action when not. */
export function AccountSlot() {
  const { data: session, isPending } = useSession();

  // Nothing until the session is known: flashing "Sign in" at someone who is
  // signed in reads as having been logged out.
  if (isPending) return null;

  if (session) {
    return (
      <>
        <StreakBadge />
        <AccountMenu
          email={session.user.email}
          name={session.user.name}
          image={session.user.image}
        />
      </>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        className="text-sm hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="rounded-node border-2 border-accent-strong bg-accent-strong px-3 py-1 text-sm font-semibold text-accent-foreground node-interactive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        Sign up
      </Link>
    </>
  );
}
