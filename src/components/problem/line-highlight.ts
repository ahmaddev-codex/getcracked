import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';

/**
 * The executing-line decoration, shared by the read-only code panel and the
 * editor a learner is actually typing in.
 *
 * It lives here rather than in either component because both need it: the
 * walkthrough on a lesson page highlights its own panel, while the problem
 * workspace highlights the editor itself — there is no second copy of the code
 * to point at, and a duplicate editor below the real one is just the same text
 * twice.
 *
 * Applied through a transaction rather than by re-creating the editor, which is
 * the specific reason ADR 0001 §6 chose CodeMirror over Monaco: highlighting a
 * new line costs one small update instead of a remount on every frame.
 */

export const setHighlight = StateEffect.define<number | null>();

const activeLine = Decoration.line({ class: 'gc-active-line' });

export const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    for (const effect of transaction.effects) {
      if (!effect.is(setHighlight)) continue;
      const line = effect.value;
      if (line === null) return Decoration.none;

      // Trace lines are 1-based and may exceed the document if the learner
      // edited after running; clamping beats throwing mid-animation.
      const doc = transaction.state.doc;
      const clamped = Math.max(1, Math.min(line, doc.lines));
      return Decoration.set([activeLine.range(doc.line(clamped).from)]);
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** Moves the highlight, and keeps the line on screen without yanking the view. */
export function applyHighlight(view: EditorView, line: number | null): void {
  view.dispatch({ effects: setHighlight.of(line) });
  if (line === null) return;

  const clamped = Math.max(1, Math.min(line, view.state.doc.lines));
  view.dispatch({
    effects: EditorView.scrollIntoView(view.state.doc.line(clamped).from, { y: 'nearest' }),
  });
}
