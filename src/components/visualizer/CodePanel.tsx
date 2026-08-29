'use client';

import { useEffect, useRef } from 'react';
import { EditorView, lineNumbers, Decoration, type DecorationSet } from '@codemirror/view';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { editorTheme, syntaxExtension } from '@/components/problem/editor-theme';
import { languageExtension } from '@/components/problem/language-support';
import type { Language } from '@/content/schema';

/**
 * The learner's own code, with the executing line highlighted (B1).
 *
 * This is the half of the visualizer that makes it *their* code rather than a
 * canned demo. Existing DSA visualizers animate a fixed reference
 * implementation; the trace here came from what the learner actually wrote, so
 * the highlighted line is a line they typed.
 *
 * Uses CodeMirror's decoration API, which is the specific reason ADR 0001 §6
 * chose CM6 over Monaco. Decorations are applied through a transaction rather
 * than by re-creating the editor, so highlighting a new line costs one small
 * update instead of a full remount on every animation frame.
 */

const setHighlight = StateEffect.define<number | null>();

const highlightLine = Decoration.line({ class: 'gc-active-line' });

const highlightField = StateField.define<DecorationSet>({
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
      return Decoration.set([highlightLine.range(doc.line(clamped).from)]);
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function CodePanel({
  source,
  line,
  language = 'javascript',
}: {
  source: string;
  line: number | null;
  language?: Language;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!host.current) return;

    const instance = new EditorView({
      state: EditorState.create({
        doc: source,
        extensions: [
          lineNumbers(),
          languageExtension(language),
          syntaxExtension,
          highlightField,
          editorTheme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      }),
      parent: host.current,
    });
    view.current = instance;

    return () => {
      instance.destroy();
      view.current = null;
    };
  }, [source, language]);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;

    instance.dispatch({ effects: setHighlight.of(line) });

    // Keep the executing line on screen during playback, without yanking the
    // view on every step.
    if (line !== null) {
      const clamped = Math.max(1, Math.min(line, instance.state.doc.lines));
      const pos = instance.state.doc.line(clamped).from;
      instance.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'nearest' }) });
    }
  }, [line]);

  return <div ref={host} className="node-surface overflow-hidden bg-surface" />;
}
