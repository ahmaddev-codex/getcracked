'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

/**
 * Code editor (A6).
 *
 * CodeMirror 6 rather than Monaco (ADR 0001 §6): Monaco is ~2MB, hostile to
 * SSR, and poor on mobile. CM6's decoration API is also the exact primitive the
 * visualizer will need to highlight the line a trace is currently executing, so
 * the choice is load-bearing beyond bundle size.
 *
 * Deliberately uncontrolled. Mirroring CodeMirror's document into React state on
 * every keystroke would re-render the tree on each character and fight the
 * editor's own transaction model; changes are pushed out through `onChange`
 * instead.
 */
export function Editor({
  value,
  onChange,
  onRun,
  docRef,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Cmd/Ctrl+Enter, matching the platform's existing run shortcut. */
  onRun?: () => void;
  /**
   * Mirror of the current document.
   *
   * The editor owns its text, so the caller reads it from here rather than
   * holding a copy in React state — which would re-render the tree on every
   * keystroke — or mutating a ref during render, which React forbids.
   */
  docRef?: React.MutableRefObject<string>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  // Kept in refs so the editor is created once; rebuilding it on every render
  // would drop the cursor and undo history mid-keystroke.
  //
  // Updated in an effect rather than during render: React forbids writing a ref
  // while rendering, and these are only ever read from callbacks that fire after
  // effects have run.
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const docRefHolder = useRef(docRef);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
    docRefHolder.current = docRef;
  });

  useEffect(() => {
    if (!host.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        javascript(),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
          // Tab indents rather than leaving the editor. Placed after the run
          // binding so it cannot shadow it.
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const next = update.state.doc.toString();
          if (docRefHolder.current) docRefHolder.current.current = next;
          onChangeRef.current(next);
        }),
        EditorView.theme({
          '&': { fontSize: '13px', backgroundColor: 'transparent' },
          '.cm-content': { fontFamily: 'var(--font-mono)', padding: '12px 0' },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--foreground-muted)',
          },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    });

    const instance = new EditorView({ state, parent: host.current });
    view.current = instance;
    // Seed the mirror, so a caller reading it before any edit sees the real
    // document rather than a stale initial value.
    if (docRefHolder.current) docRefHolder.current.current = value;

    return () => {
      instance.destroy();
      view.current = null;
    };
    // `value` is the initial document only; later prop changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accepts an external reset (Reset to starter code) without recreating the
  // editor, and without clobbering what the learner is typing.
  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const current = instance.state.doc.toString();
    if (current === value) return;

    instance.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={host} className="node-surface overflow-hidden bg-surface" />;
}
