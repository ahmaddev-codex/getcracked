import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hints } from '@/components/problem/Hints';
import { findProblem, getSetPosition, getProblemSet, getTopics } from '@/content/registry';

/**
 * T1.2 — the problem page's read-only surface.
 *
 * The route itself is a server component that awaits `params`, which jsdom
 * cannot render; its lookup and 404 behaviour are covered through the registry
 * functions it delegates to, and the interactive part (hints) is tested
 * directly.
 */

describe('problem lookup drives the route', () => {
  it('finds a problem by topic and slug', () => {
    expect(findProblem('hashing', 'two-sum')?.title).toBe('Two Sum');
  });

  it('returns undefined for an unknown slug, so the route can 404', () => {
    // The page calls notFound() on undefined rather than throwing.
    expect(findProblem('hashing', 'no-such-problem')).toBeUndefined();
    expect(findProblem('no-such-topic', 'two-sum')).toBeUndefined();
  });
});

describe('position within the set', () => {
  it('reports a 1-based position a learner can read', () => {
    const problem = findProblem('hashing', 'two-sum')!;
    const { index, total } = getSetPosition(problem);

    expect(index).toBe(0);
    expect(total).toBe(getProblemSet('hashing').length);
  });

  it('has no previous or next when the set holds one problem', () => {
    const problem = findProblem('hashing', 'two-sum')!;
    const { previous, next } = getSetPosition(problem);

    // Guards the nav from rendering a link to nowhere.
    expect(previous).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it('orders a set warm-up first, so the problem after a lesson is gentle', () => {
    const order = ['warm-up', 'core', 'stretch'];
    for (const topic of getTopics()) {
      const difficulties = getProblemSet(topic).map((p) => order.indexOf(p.difficulty));
      const sorted = [...difficulties].sort((a, b) => a - b);
      expect(difficulties).toEqual(sorted);
    }
  });
});

describe('progressive hints', () => {
  const HINTS = ['first nudge', 'second nudge', 'third nudge'];

  function renderHints(id = `t-${Math.random()}`) {
    return render(<Hints exerciseId={id} hints={HINTS} />);
  }

  it('reveals nothing until asked', () => {
    renderHints();

    expect(screen.queryByText('first nudge')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show a hint/i })).toBeInTheDocument();
  });

  it('reveals one hint at a time, in order', async () => {
    const user = userEvent.setup();
    renderHints();

    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    expect(screen.getByText('first nudge')).toBeInTheDocument();
    // The whole point of progressive disclosure: hint two is not yet visible.
    expect(screen.queryByText('second nudge')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show hint 2/i }));
    expect(screen.getByText('second nudge')).toBeInTheDocument();
    expect(screen.queryByText('third nudge')).not.toBeInTheDocument();
  });

  it('tells the learner how many hints remain', async () => {
    const user = userEvent.setup();
    renderHints();

    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    expect(screen.getByText(/2 hints left/i)).toBeInTheDocument();
  });

  it('stops offering more once every hint is open', async () => {
    const user = userEvent.setup();
    renderHints();

    for (const label of [/show a hint/i, /show hint 2/i, /show hint 3/i]) {
      await user.click(screen.getByRole('button', { name: label }));
    }

    expect(screen.getByText(/that's every hint/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument();
  });

  it('keeps reveals across a remount, so a reload does not re-hide them', async () => {
    const user = userEvent.setup();
    const id = 'persist-me';

    const first = renderHints(id);
    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    expect(screen.getByText('first nudge')).toBeInTheDocument();
    first.unmount();

    renderHints(id);
    expect(screen.getByText('first nudge')).toBeInTheDocument();
  });

  it('keeps each exercise’s reveals separate', async () => {
    const user = userEvent.setup();

    const a = renderHints('exercise-a');
    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    a.unmount();

    renderHints('exercise-b');
    // Opening a hint on one problem must not spoil another.
    expect(screen.queryByText('first nudge')).not.toBeInTheDocument();
  });
});
