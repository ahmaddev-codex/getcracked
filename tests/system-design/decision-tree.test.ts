import { describe, expect, it } from 'vitest';
import { getLessons } from '@/content/registry';
import { decisionTreeSchema, type DecisionQuestion, type DecisionTree } from '@/content/schema';

/**
 * Trade-off decision trees (C4).
 *
 * The trees are content, and their failure mode is silent: one that dead-ends,
 * repeats itself, or arrives at an answer with no argument behind it renders
 * perfectly and teaches nothing. So the shape is checked here as well as in the
 * build gate — a contributor running the suite should learn their tree is broken
 * without waiting for a build.
 */

const authored = getLessons().filter((l) => l.decisionTree);

/** Every path from the root to an outcome, as the labels chosen along it. */
function paths(node: DecisionQuestion, trail: string[] = []): string[][] {
  return node.options.flatMap((option) =>
    option.next.kind === 'outcome'
      ? [[...trail, option.label]]
      : paths(option.next, [...trail, option.label]),
  );
}

function outcomes(node: DecisionQuestion): Array<{ recommend: string; because: string }> {
  return node.options.flatMap((option) =>
    option.next.kind === 'outcome' ? [option.next] : outcomes(option.next),
  );
}

describe('the trees that exist', () => {
  it('are attached to lessons that teach the trade-off', () => {
    // If this ever reads zero, C4 is a component that renders nowhere.
    expect(authored.length).toBeGreaterThan(0);
    expect(authored.map((l) => l.slug)).toEqual(
      expect.arrayContaining(['databases', 'caching']),
    );
  });
});

describe.each(authored.map((l) => [l.slug, l.decisionTree!] as const))(
  '%s',
  (_slug, tree: DecisionTree) => {
    it('parses against the schema', () => {
      expect(decisionTreeSchema.safeParse(tree).success).toBe(true);
    });

    it('offers a real decision at every question', () => {
      // One option is not a decision; two identical ones is a coin flip wearing
      // a question, and it is invisible once rendered.
      const check = (node: DecisionQuestion) => {
        expect(node.options.length).toBeGreaterThanOrEqual(2);
        const labels = node.options.map((o) => o.label.trim().toLowerCase());
        expect(new Set(labels).size).toBe(labels.length);
        for (const option of node.options) {
          if (option.next.kind === 'question') check(option.next);
        }
      };
      check(tree.root);
    });

    it('ends every path in an outcome that argues for itself', () => {
      const ends = outcomes(tree.root);
      expect(ends.length).toBeGreaterThanOrEqual(3);
      for (const end of ends) {
        expect(end.recommend.length).toBeGreaterThan(0);
        // A recommendation with no reasoning is a flowchart, and the follow-up
        // in an interview is always "why?".
        expect(end.because.length, end.recommend).toBeGreaterThan(40);
      }
    });

    it('can be walked to the end without an unreasonable number of clicks', () => {
      const lengths = paths(tree.root).map((p) => p.length);
      expect(Math.min(...lengths)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...lengths)).toBeLessThanOrEqual(6);
    });

    it('gives the branches not taken something to say', () => {
      // The whole design: an option's consequence is readable *before* it is
      // chosen, so the tree teaches "why not the other one" rather than
      // recitation. Not every option needs a note, but a tree where none do has
      // quietly become a quiz.
      const noted = (node: DecisionQuestion): number =>
        node.options.filter((o) => o.note).length +
        node.options.reduce(
          (n, o) => n + (o.next.kind === 'question' ? noted(o.next) : 0),
          0,
        );
      expect(noted(tree.root)).toBeGreaterThan(0);
    });
  },
);
