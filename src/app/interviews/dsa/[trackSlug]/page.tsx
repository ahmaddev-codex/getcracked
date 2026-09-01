import { notFound } from 'next/navigation';
import { getMockTrack, getMockTracks } from '@/lib/interviews/mock-tracks';
import { getProblems } from '@/content/registry';
import { DsaMockWorkspace } from '@/components/interview/DsaMockWorkspace';

interface DsaInterviewRouteProps {
  params: Promise<{ trackSlug: string }>;
}

export function generateStaticParams() {
  return getMockTracks()
    .filter((t) => t.kind === 'dsa')
    .map((t) => ({ trackSlug: t.slug }));
}

export async function generateMetadata({ params }: DsaInterviewRouteProps) {
  const { trackSlug } = await params;
  const track = getMockTrack(trackSlug);
  if (!track) return { title: 'Interview Track Not Found' };
  return {
    title: `${track.title} — Mock Interview`,
    description: track.description,
  };
}

export default async function DsaInterviewPage({ params }: DsaInterviewRouteProps) {
  const { trackSlug } = await params;
  const track = getMockTrack(trackSlug);
  if (!track || track.kind !== 'dsa') {
    notFound();
  }

  const allProblems = getProblems();
  const problems = (track.problemSlugs ?? [])
    .map((slug) => allProblems.find((p) => p.slug === slug))
    .filter((p) => p !== undefined);

  if (problems.length === 0) {
    notFound();
  }

  return <DsaMockWorkspace track={track} problems={problems} />;
}
