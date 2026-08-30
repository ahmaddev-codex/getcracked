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

  it('never points at a neighbour that is not there', () => {
    // Written against the set's own shape rather than a fixed catalog size, so
    // it keeps guarding the nav as content is added.
    for (const topic of getTopics()) {
      const set = getProblemSet(topic);
      const first = getSetPosition(set[0]);
      const last = getSetPosition(set[set.length - 1]);

      expect(first.previous, `${topic}: first has a previous`).toBeUndefined();
      expect(last.next, `${topic}: last has a next`).toBeUndefined();
      if (set.length === 1) expect(first.next).toBeUndefined();
    }
  });

  it('links neighbours symmetrically', () => {
    for (const topic of getTopics()) {
      const set = getProblemSet(topic);
      for (let i = 0; i < set.length - 1; i++) {
        // A next that does not point back is how a nav loop appears.
        expect(getSetPosition(set[i]).next?.slug).toBe(set[i + 1].slug);
        expect(getSetPosition(set[i + 1]).previous?.slug).toBe(set[i].slug);
      }
    }
  });

  it('orders a set easiest first, so the problem after a lesson is gentle', () => {
    const order = ['easy', 'medium', 'hard'];
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

describe('hiding hints', () => {
  const HINTS = ['first nudge', 'second nudge'];

  it('offers no hide control before anything is revealed', () => {
    render(<Hints exerciseId="hide-1" hints={HINTS} />);
    expect(screen.queryByRole('button', { name: /hide hints/i })).not.toBeInTheDocument();
  });

  it('hides revealed hints without forgetting them', async () => {
    const user = userEvent.setup();
    render(<Hints exerciseId="hide-2" hints={HINTS} />);

    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    expect(screen.getByText('first nudge')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /hide hints/i }));
    expect(screen.queryByText('first nudge')).not.toBeInTheDocument();

    // Collapsing is presentational: the reveal is still recorded.
    await user.click(screen.getByRole('button', { name: /show 1 opened/i }));
    expect(screen.getByText('first nudge')).toBeInTheDocument();
  });

  it('does not offer another hint while collapsed', async () => {
    const user = userEvent.setup();
    render(<Hints exerciseId="hide-3" hints={HINTS} />);

    await user.click(screen.getByRole('button', { name: /show a hint/i }));
    await user.click(screen.getByRole('button', { name: /hide hints/i }));

    // Revealing into a hidden panel would be a confusing no-op.
    expect(screen.queryByRole('button', { name: /show hint 2/i })).not.toBeInTheDocument();
  });
});
