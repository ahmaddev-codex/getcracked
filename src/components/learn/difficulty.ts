import type { Lesson } from '@/content/schema';

/**
 * Difficulty ranking, shared by the roadmap node, the panel, and the legend.
 *
 * Lives in its own module rather than on either component: the panel needs it
 * and the roadmap renders the panel, so exporting it from the roadmap would
 * make the two import each other. Circular imports resolve in ESM and then fail
 * in whichever order a bundler happens to pick.
 *
 * The ranking is guidance, never a gate (§6.6, B14). Every topic is one click
 * away regardless of where a learner is — what this answers is "where do I
 * begin?", which curriculum order alone does not.
 */
export const DIFFICULTY_BADGE: Record<Lesson['difficulty'], string> = {
  foundational: 'rounded px-1.5 py-0.5 text-xs font-semibold bg-success-soft text-success',
  core: 'rounded px-1.5 py-0.5 text-xs font-semibold bg-accent text-accent-foreground',
  advanced: 'rounded px-1.5 py-0.5 text-xs font-semibold bg-danger-soft text-danger',
};

/**
 * Where a track's lessons live.
 *
 * System Design has its own index rather than sharing the DSA one: three tracks
 * on a single page is a scroll, not a path, and the two code tracks share a
 * vocabulary that System Design does not.
 *
 * Here rather than on either component for the same reason as the badge above —
 * the roadmap renders the panel, so exporting it from the roadmap would make the
 * two import each other.
 */
export function lessonBase(track: Lesson['track']): string {
  return trackIndex(track).href;
}

/**
 * The index a track's lessons belong to — href and label together.
 *
 * Deliberately one function returning both. When they were separate, the
 * breadcrumb on a System Design lesson routed correctly and read "Learn DSA",
 * because only the href was made track-aware and the label stayed hardcoded.
 * Returning the pair makes that particular drift impossible.
 */
export function trackIndex(track: Lesson['track']): { href: string; label: string } {
  return track === 'system-design'
    ? { href: '/learn/system-design', label: 'System Design' }
    : { href: '/learn/dsa', label: 'Learn DSA' };
}

export const DIFFICULTY_NOTE: Record<Lesson['difficulty'], string> = {
  foundational: 'Start here — assumes nothing',
  core: 'The interview bread and butter',
  advanced: 'Reach for these once the core is comfortable',
};
