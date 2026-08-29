import { Badge, type ProgressState } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { Node, type NodeTone } from '@/components/ui/Node';

/**
 * Component gallery (K8).
 *
 * Renders every component in one place so the system can be reviewed as a
 * system. Follows the OS theme — switch appearance to check both, since a token
 * that only works in one is the usual way dark mode rots.
 */

const TONES: NodeTone[] = ['surface', 'accent', 'strong', 'alt', 'muted'];
const STATES: ProgressState[] = ['not-started', 'in-progress', 'done'];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {note && <p className="text-sm text-foreground-muted">{note}</p>}
      </div>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

export default function ComponentGallery() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">Design system</h1>
        <p className="text-sm text-foreground-muted">
          Every component composes one shape primitive. Colours are sampled from the
          reference; contrast is verified in CI.
        </p>
      </header>

      <Section title="Node" note="The shape primitive. Everything else is this with different padding.">
        {TONES.map((tone) => (
          <Node key={tone} tone={tone} className="px-3 py-2 text-sm">
            {tone}
          </Node>
        ))}
      </Section>

      <Section title="Button" note="The node treatment plus press motion.">
        {TONES.map((tone) => (
          <Button key={tone} tone={tone}>
            {tone}
          </Button>
        ))}
        <Button disabled>disabled</Button>
      </Section>

      <Section title="Badge" note="Shared progress vocabulary (K7) — identical wherever it appears.">
        {STATES.map((state) => (
          <Badge key={state} state={state} />
        ))}
      </Section>

      <Section title="Card">
        <Card title="Sliding Window" className="w-64">
          Recognise the pattern, then practise it on twelve problems.
        </Card>
        <Card tone="accent" title="Hashing" className="w-64">
          The accent tone marks the recommended next step.
        </Card>
      </Section>

      <Section title="Code block">
        <div className="w-full max-w-md">
          <CodeBlock
            language="javascript"
            code={`function twoSum(nums, target) {\n  const seen = new Map();\n  // ...\n}`}
          />
        </div>
      </Section>

      <Section title="Empty state">
        <div className="w-full">
          <EmptyState title="No problems match those filters" action={<Button tone="surface">Clear filters</Button>}>
            Try widening the difficulty range, or clearing the topic filter.
          </EmptyState>
        </div>
      </Section>
    </main>
  );
}
