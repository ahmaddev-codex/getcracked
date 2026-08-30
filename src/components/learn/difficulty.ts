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
  foundational: 'rounded px-1.5 py-0.5 text-[11px] font-semibold bg-success-soft text-success',
  core: 'rounded px-1.5 py-0.5 text-[11px] font-semibold bg-accent text-accent-foreground',
  advanced: 'rounded px-1.5 py-0.5 text-[11px] font-semibold bg-danger-soft text-danger',
};

export const DIFFICULTY_NOTE: Record<Lesson['difficulty'], string> = {
  foundational: 'Start here — assumes nothing',
  core: 'The interview bread and butter',
  advanced: 'Reach for these once the core is comfortable',
};
