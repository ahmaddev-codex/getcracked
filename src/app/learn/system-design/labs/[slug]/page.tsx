import Link from 'next/link';
import { Page } from '@/components/ui/Page';
import { notFound } from 'next/navigation';
import { Node } from '@/components/ui/Node';
import { Markdown } from '@/components/Markdown';
import { ScenarioLab } from '@/components/system-design/ScenarioLab';
import { findLab, findLesson, getLabs } from '@/content/registry';
import { EngineeringStackBreadcrumb } from '@/components/content/EngineeringStackBreadcrumb';

/**
 * One guided scenario (C2), scored against the rubric (C5).
 *
 * **Public** (§2.6). The lab runs entirely in the browser and records nothing:
 * a scorecard is a reading of one attempt, not a completion.
 */

export function generateStaticParams() {
  return getLabs().map((lab) => ({ slug: lab.slug }));
}

interface LabRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: LabRouteProps) {
  const { slug } = await props.params;
  const lab = findLab(slug);
  if (!lab) return { title: 'Lab not found' };

  return {
    title: `${lab.title} — GetCracked`,
    description: `${lab.summary} A guided System Design scenario scored across six dimensions.`,
  };
}

export default async function LabPage(props: LabRouteProps) {
  const { slug } = await props.params;
  const lab = findLab(slug);
  if (!lab) notFound();

  const lessons = lab.topics.map((topic) => findLesson(topic)).filter((l) => l !== undefined);

  return (
    <Page width="reading">
      <EngineeringStackBreadcrumb tier="lab" slug={lab.slug} />

      <header className="flex flex-col gap-3">
        <p className="text-xs text-foreground-muted">
          <Link
            href="/learn/system-design/labs"
            className="text-link underline underline-offset-2"
          >
            Design labs
          </Link>
          {' · '}
          {lab.steps.length} questions
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">{lab.title}</h1>
      </header>

      <Markdown>{lab.brief}</Markdown>

      <ScenarioLab lab={lab} />

      {lessons.length > 0 && (
        <Node tone="muted" className="p-4 text-sm text-foreground-muted">
          This scenario leans on{' '}
          {lessons.map((lesson, i) => (
            <span key={lesson.slug}>
              {i > 0 && (i === lessons.length - 1 ? ' and ' : ', ')}
              <Link
                href={`/learn/system-design/${lesson.slug}`}
                className="text-link underline underline-offset-2"
              >
                {lesson.title}
              </Link>
            </span>
          ))}
          . Reading one first is a recommendation, never a requirement — and doing the lab
          cold then reading is a perfectly good order.
        </Node>
      )}
    </Page>
  );
}
