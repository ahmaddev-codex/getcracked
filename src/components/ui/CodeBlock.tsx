/**
 * Read-only code display. The editor (A6) is a separate concern — this is for
 * lesson snippets and reference solutions.
 *
 * Scrolls inside its own box so a long line cannot make the page scroll
 * sideways.
 */
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="node-surface overflow-hidden bg-surface-muted">
      {language && (
        <div className="border-b border-border-subtle px-3 py-1 font-mono text-xs text-foreground-muted">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-3">
        <code className="font-mono text-xs text-foreground">{code}</code>
      </pre>
    </div>
  );
}
