import Link from 'next/link';
import { Page } from '@/components/ui/Page';
import { ArchitectureCanvas } from '@/components/system-design/ArchitectureCanvas';

export const metadata = {
  title: 'Architecture Whiteboard — GetCracked',
  description: 'Interactive System Design diagramming canvas with real-time topology health checks and component presets.',
};

export default function ArchitectureCanvasPage() {
  return (
    <Page width="canvas" className="gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-foreground-muted">
          <Link href="/learn/system-design" className="text-link underline underline-offset-2">
            System Design
          </Link>
          {' · '}
          Interactive Studio (C1)
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight">
              Architecture Whiteboard & Topology Studio
            </h1>
            <p className="text-sm text-foreground-muted">
              Design distributed systems visually. Drag components, draw protocol connectors, and inspect topology resilience in real time.
            </p>
          </div>
        </div>
      </header>

      <main className="w-full">
        <ArchitectureCanvas />
      </main>
    </Page>
  );
}
