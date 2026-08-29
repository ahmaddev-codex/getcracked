import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/**
 * Editor appearance, built entirely from design tokens (Module K, AD-8).
 *
 * CodeMirror ships `defaultHighlightStyle`, but it carries its own palette and
 * would become a second source of visual truth sitting inside the surface a
 * learner looks at longest. Every colour here resolves to a token, and each one
 * is contrast-checked against `--surface` in CI like any other text.
 *
 * Both themes come free: the tokens already switch on `prefers-color-scheme`,
 * so there is no second CodeMirror theme to keep in step.
 */

export const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.moduleKeyword, tags.controlKeyword], color: 'var(--syntax-keyword)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--syntax-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--syntax-number)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))], color: 'var(--syntax-function)' },
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: 'var(--syntax-function)' },
  { tag: [tags.operator, tags.punctuation, tags.separator], color: 'var(--foreground-muted)' },
  { tag: [tags.variableName, tags.typeName, tags.className], color: 'var(--foreground)' },
]);

export const editorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
    // Tall enough to work in, capped so the page stays navigable on a laptop.
    minHeight: '16rem',
    maxHeight: '28rem',
    overflow: 'auto',
  },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--foreground)' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--foreground-muted)',
    paddingRight: '8px',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--foreground)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--foreground)' },
  // Selection needs an explicit colour: the browser default is invisible
  // against a themed background in dark mode.
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--link) 25%, transparent)',
  },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
    outline: 'none',
  },
  '.cm-nonmatchingBracket': { backgroundColor: 'color-mix(in srgb, var(--danger) 25%, transparent)' },
  '.cm-selectionMatch': { backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-node)',
    color: 'var(--foreground)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--surface-muted)',
    color: 'var(--foreground)',
  },
  '&.cm-focused': { outline: 'none' },
});

export const syntaxExtension = syntaxHighlighting(highlightStyle);
