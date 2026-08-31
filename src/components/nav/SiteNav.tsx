'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * The main navigation (K1).
 *
 * **Grouped, because the destinations were never peers.** The bar had grown to
 * seven flat links one at a time, and they are three different kinds of thing:
 * surfaces you *read* (three tracks), surfaces you *do* (problems, builds, labs,
 * sandbox), and one reference page. Flattening them made the header long and,
 * worse, hid the structure the whole product is built on — the three tiers of
 * AD-7 were spread across the bar in no particular order.
 *
 * So: two groups and one link, which is three things to scan instead of seven.
 *
 * **A disclosure that expands the header, not a floating dropdown.** A hover
 * menu has to be defended against touch (no hover), against the pointer leaving
 * diagonally, and against a panel that overlays content the reader wanted. An
 * expanding panel has none of that: it is a button, a region, and `aria-expanded`
 * — the same primitive as every other disclosure here.
 *
 * The panel shows each destination's one-line description rather than a bare
 * list of names, because the names alone do not distinguish "Problems" from
 * "Build" for anyone who has not already used both.
 */

interface NavItem {
  href: string;
  label: string;
  /** What is actually behind it — the reason the panel exists. */
  detail: string;
}

interface NavGroup {
  label: string;
  /** Marks the group active when the current path is under any of these. */
  prefixes: string[];
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Learn',
    prefixes: ['/learn'],
    items: [
      {
        href: '/learn/dsa',
        label: 'Data structures & algorithms',
        detail: 'The path, topic by topic, with a walkthrough you can run',
      },
      {
        href: '/learn/system-design',
        label: 'System design',
        detail: 'Scaling, caching, consistency — plus the concept reference',
      },
      {
        href: '/learn/design-patterns',
        label: 'Design patterns',
        detail: 'Named solutions to problems that keep recurring',
      },
    ],
  },
  {
    label: 'Practice',
    prefixes: ['/problems', '/challenges', '/sandbox', '/learn/system-design/labs'],
    items: [
      {
        href: '/problems',
        label: 'Problems',
        detail: 'Single functions, interview-style, grouped by topic',
      },
      {
        href: '/challenges',
        label: 'Build challenges',
        detail: 'Multi-step builds across several files — an evening each',
      },
      {
        href: '/learn/system-design/labs',
        label: 'Design labs',
        detail: 'Work a scenario and get scored on the six things a round weighs',
      },
      {
        href: '/sandbox',
        label: 'Sandbox',
        detail: 'Run anything, watch it execute, share the link',
      },
    ],
  },
];

const FLAT: NavItem[] = [
  {
    href: '/companies',
    label: 'Companies',
    detail: 'What each loop assesses, with a source on every claim',
  },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(null), []);

  /**
   * Escape closes, and a click anywhere else does too.
   *
   * Both are on the document rather than the panel, because the whole point of
   * an open menu is that the next thing you do is usually somewhere else.
   */
  useEffect(() => {
    if (open === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, close]);

  const groupActive = (group: NavGroup) =>
    group.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const openGroup = GROUPS.find((g) => g.label === open);

  return (
    <div ref={navRef} className="contents">
      <ul className="order-last flex w-full min-w-0 flex-nowrap items-center gap-x-5 overflow-x-auto whitespace-nowrap sm:order-none sm:mx-auto sm:w-auto sm:flex-wrap sm:overflow-x-visible">
        {GROUPS.map((group) => {
          const expanded = open === group.label;
          return (
            <li key={group.label}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : group.label)}
                className={`flex items-center gap-1 text-base transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
                  groupActive(group) || expanded ? 'font-semibold text-accent-strong' : ''
                }`}
              >
                {group.label}
                <ChevronDown
                  size={14}
                  aria-hidden
                  className={`transition-transform duration-(--duration-fast) ease-(--ease-out) ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </li>
          );
        })}

        {FLAT.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={close}
                className={`text-base transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
                  active ? 'font-semibold text-accent-strong' : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/*
        The panel is a sibling of the bar and spans the header's full width, so
        the header grows rather than something floating over the page. It is
        last in the flex line with `w-full`, which puts it on its own row.
      */}
      {openGroup && (
        <div
          id={panelId}
          className="order-last w-full border-t border-header-foreground/15 pt-3"
        >
          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
            {openGroup.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className="flex flex-col gap-0.5 rounded-xs px-2 py-1.5 transition-colors hover:bg-header-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                  >
                    <span
                      className={`text-sm ${active ? 'font-semibold text-accent-strong' : 'font-medium'}`}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-header-foreground/70">{item.detail}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
