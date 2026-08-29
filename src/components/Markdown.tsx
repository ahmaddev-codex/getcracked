import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './ui/CodeBlock';

/**
 * Renders authored markdown (briefs now, lesson bodies later).
 *
 * A server component, so the markdown parser never reaches the client bundle.
 * Element renderers are overridden rather than styled with a prose plugin so
 * every element resolves to design tokens — a typography plugin would ship its
 * own colour and spacing scale and quietly become a second source of truth.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
          a: ({ href, children }) => (
            <a href={href} className="text-link underline underline-offset-2">
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
                <code className="bg-surface-muted px-1 py-0.5 font-mono text-xs">{text}</code>
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
