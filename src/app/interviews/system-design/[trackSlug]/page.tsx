import { notFound } from 'next/navigation';
import { getMockTrack, getMockTracks } from '@/lib/interviews/mock-tracks';
import { findLab } from '@/content/registry';
import { SystemDesignMockWorkspace } from '@/components/interview/SystemDesignMockWorkspace';

interface SysDesignInterviewRouteProps {
  params: Promise<{ trackSlug: string }>;
}

export function generateStaticParams() {
  return getMockTracks()
    .filter((t) => t.kind === 'system-design')
    .map((t) => ({ trackSlug: t.slug }));
}

export async function generateMetadata({ params }: SysDesignInterviewRouteProps) {
  const { trackSlug } = await params;
  const track = getMockTrack(trackSlug);
  if (!track) return { title: 'Interview Track Not Found' };
  return {
    title: `${track.title} — System Design Mock`,
    description: track.description,
  };
}

export default async function SysDesignInterviewPage({ params }: SysDesignInterviewRouteProps) {
  const { trackSlug } = await params;
  const track = getMockTrack(trackSlug);
  if (!track || track.kind !== 'system-design' || !track.labSlug) {
    notFound();
  }

  const lab = findLab(track.labSlug);
  if (!lab) {
    notFound();
  }

  return <SystemDesignMockWorkspace track={track} lab={lab} />;
}
