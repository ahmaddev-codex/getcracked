import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepList } from '@/components/challenge/StepList';
import { Hints } from '@/components/problem/Hints';
import { findChallenge, getChallenges } from '@/content/registry';
import { resolveStepFiles, stepId, stepIds } from '@/content/challenge';
import { recordLocalAttempt } from '@/lib/progress-local';

/**
 * The build-challenge surfaces.
 *
 * The routes themselves are server components that await `params`, which jsdom
 * cannot render; their lookup and 404 behaviour is covered through the registry
 * functions they delegate to, and the interactive parts are rendered directly.
 * `ChallengeWorkspace` is not rendered here — it mounts CodeMirror and a WASM
 * runtime, and what it does with a workspace is covered by the runner tests.
 */

// `useSolved` merges local progress with the account's. Nothing is signed in
// here, so the endpoint answers empty and the local tier is what is asserted.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ solved: [] }), { status: 200 })),
  );
});

describe('challenge lookup drives the routes', () => {
  it('finds a build by slug', () => {
    expect(findChallenge('lru-cache')?.title).toBe('LRU Cache');
  });

  it('returns undefined for an unknown slug, so the route can 404', () => {
    expect(findChallenge('no-such-build')).toBeUndefined();
  });

  it('finds a step by slug within a build', () => {
    const challenge = findChallenge('lru-cache')!;
    expect(challenge.steps.findIndex((s) => s.slug === 'evict-the-oldest')).toBeGreaterThan(-1);
    // The route calls notFound() on -1 rather than indexing past the end.
    expect(challenge.steps.findIndex((s) => s.slug === 'nope')).toBe(-1);
  });

  it('enumerates every step for static rendering', () => {
    const params = getChallenges().flatMap((c) =>
      c.steps.map((s) => ({ slug: c.slug, step: s.slug })),
    );
    expect(params.length).toBe(
      getChallenges().reduce((n, c) => n + c.steps.length, 0),
    );
    for (const { slug, step } of params) {
      expect(findChallenge(slug)!.steps.some((s) => s.slug === step)).toBe(true);
    }
  });
});

describe('StepList', () => {
  const challenge = findChallenge('lru-cache')!;
  const steps = challenge.steps.map((s) => ({
    slug: s.slug,
    title: s.title,
    id: stepId(challenge, s),
  }));

  it('links every step, including ones after an unfinished step', () => {
    // Nothing is locked (§6.6). Steps are independently solvable by
    // construction, so ordering must never become authorization.
    render(<StepList challengeSlug={challenge.slug} steps={steps} />);

    for (const step of steps) {
      expect(screen.getByRole('link', { name: new RegExp(step.title) })).toHaveAttribute(
        'href',
        `/challenges/${challenge.slug}/${step.slug}`,
      );
    }
  });

  it('counts finished steps rather than assuming a prefix', () => {
    // A learner who did steps 2 and 4 has done two steps, not zero.
    recordLocalAttempt({
      exerciseId: steps[1].id,
      tier: 'challenge',
      language: 'javascript',
      state: 'complete',
    });
    recordLocalAttempt({
      exerciseId: steps[3].id,
      tier: 'challenge',
      language: 'javascript',
      state: 'complete',
    });

    render(<StepList challengeSlug={challenge.slug} steps={steps} />);
    expect(screen.getByText(`· 2 of ${steps.length} done`)).toBeInTheDocument();
  });

  it('marks the step being worked on', () => {
    render(
      <StepList challengeSlug={challenge.slug} steps={steps} currentSlug={steps[2].slug} />,
    );
    expect(
      screen.getByRole('link', { name: new RegExp(steps[2].title) }),
    ).toHaveAttribute('aria-current', 'step');
  });

  it('drops the heading and the sign-in nudge in the sidebar', () => {
    render(<StepList compact challengeSlug={challenge.slug} steps={steps} />);
    expect(screen.queryByText(/of 4 done/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(steps.length);
  });
});

describe('hints on a step', () => {
  it('address the step, so two steps do not share reveals', () => {
    const challenge = findChallenge('lru-cache')!;
    const [first, second] = stepIds(challenge);
    expect(first).not.toBe(second);

    render(<Hints exerciseId={first} hints={challenge.steps[0].hints} />);
    expect(screen.getByRole('button', { name: 'Show a hint' })).toBeInTheDocument();
  });
});

describe('what the step page hands the workspace', () => {
  it('resolves a file set per language, all with content', () => {
    const challenge = findChallenge('lru-cache')!;

    for (const [index] of challenge.steps.entries()) {
      for (const language of ['javascript', 'python'] as const) {
        const files = resolveStepFiles(challenge, index, language);
        expect(files.length).toBeGreaterThan(0);
        for (const file of files) {
          expect(file.starter, `${file.name} starter`).toBeTruthy();
          // The tab label, which is what a learner clicks.
          expect(file.fileName).toMatch(language === 'python' ? /\.py$/ : /\.js$/);
        }
      }
    }
  });
});
