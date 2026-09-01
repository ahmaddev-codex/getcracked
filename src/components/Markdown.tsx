import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './ui/CodeBlock';

/**
 * Renders authored markdown (briefs now, lesson bodies, assistant responses).
 *
 * Element renderers are overridden rather than styled with an untyped prose plugin
 * so every element resolves to GetCracked design tokens.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-2.5 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-node text-lg font-bold text-foreground mt-3 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-node text-base font-bold text-foreground mt-2.5 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-node text-sm font-bold text-foreground mt-2 mb-0.5">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-node text-xs font-bold text-foreground uppercase tracking-wide mt-1.5 mb-0.5">{children}</h4>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-strong pl-3 py-1 my-1 text-foreground-muted italic bg-surface-muted/30 rounded-r-xs">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-node border border-border-strong bg-surface shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface-muted border-b border-border-strong font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border-subtle">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-surface-muted/40 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="p-2.5 font-bold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 text-foreground-muted align-top">{children}</td>
          ),
          hr: () => <hr className="my-3 border-border-subtle" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="text-link underline underline-offset-2 font-medium"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const text = String(children).replace(/\n$/, '');
            // react-markdown routes both inline and fenced code here; a fenced
            // block is the one carrying a language class.
            const language = /language-(\w+)/.exec(className ?? '')?.[1];
            if (!language && !text.includes('\n')) {
              return (
                <code className="rounded-xs bg-surface-muted px-1.5 py-0.5 font-mono text-2xs text-foreground border border-border-subtle">
                  {text}
                </code>
              );
            }
            return <CodeBlock code={text} language={language} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
