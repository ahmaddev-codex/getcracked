import type { MockTrack } from './types';

export const MOCK_TRACKS: MockTrack[] = [
  {
    id: 'track-faang-standard',
    slug: 'faang-dsa-standard',
    title: 'FAANG DSA 45-Min Screening',
    kind: 'dsa',
    targetLevel: 'L5',
    durationMinutes: 45,
    description:
      'The industry standard 45-minute technical coding interview. Two structured problems starting with linear hashing warmup leading into graph/interval traversal, with strict time budgets for problem clarification, optimal complexity analysis, and edge case validation.',
    stages: [
      {
        id: 'clarify',
        name: 'Stage 1: Clarification & Constraints',
        budgetMinutes: 5,
        objective: 'Confirm input bounds, data types, duplicate handling, and establish baseline brute-force vs optimal target complexities.',
      },
      {
        id: 'implement',
        name: 'Stage 2: Core Algorithm Implementation',
        budgetMinutes: 25,
        objective: 'Write clean, idiomatic code with optimal time and space complexity without premature over-engineering.',
      },
      {
        id: 'test-optimize',
        name: 'Stage 3: Dry Run & Edge Case Testing',
        budgetMinutes: 10,
        objective: 'Manually trace execution on empty, single-element, and maximum bounds inputs before automated runs.',
      },
      {
        id: 'follow-up',
        name: 'Stage 4: Socratic Follow-Up & Scrutiny',
        budgetMinutes: 5,
        objective: 'Answer follow-up questions from the interviewer on scale, concurrency, and memory trade-offs.',
      },
    ],
    problemSlugs: ['two-sum', 'number-of-islands'],
  },
  {
    id: 'track-dsa-speed',
    slug: 'dsa-speed-screen',
    title: 'Fast-Track Technical Screen (30m)',
    kind: 'dsa',
    targetLevel: 'L4',
    durationMinutes: 30,
    description:
      'High-velocity 30-minute first-round screening test. Focuses on rapid pattern recognition, clean variable naming, and quick algorithmic iteration.',
    stages: [
      {
        id: 'clarify',
        name: 'Stage 1: Approach Alignment',
        budgetMinutes: 4,
        objective: 'State chosen data structure and time complexity before writing code.',
      },
      {
        id: 'implement',
        name: 'Stage 2: Implementation',
        budgetMinutes: 18,
        objective: 'Implement solutions for two problems cleanly.',
      },
      {
        id: 'verify',
        name: 'Stage 3: Verification',
        budgetMinutes: 8,
        objective: 'Run test cases and verify boundary correctness.',
      },
    ],
    problemSlugs: ['valid-anagram', 'reverse-linked-list'],
  },
  {
    id: 'track-sysdesign-core',
    slug: 'sysdesign-core-45',
    title: 'System Design Standard (45m)',
    kind: 'system-design',
    targetLevel: 'L5',
    durationMinutes: 45,
    description:
      'Standard 45-minute distributed systems architectural interview. Progresses from functional requirements and back-of-the-envelope capacity estimation to high-level whiteboard architecture, bottleneck identification, and live failure simulations.',
    stages: [
      {
        id: 'requirements',
        name: 'Stage 1: Requirements & Capacity Sizing',
        budgetMinutes: 8,
        objective: 'Scope functional vs non-functional requirements, calculate QPS, storage growth, and network bandwidth.',
      },
      {
        id: 'high-level',
        name: 'Stage 2: High-Level Architecture',
        budgetMinutes: 15,
        objective: 'Draft core components on the canvas: ingress load balancing, API servers, caching, and persistence.',
      },
      {
        id: 'deep-dive',
        name: 'Stage 3: Deep Dive & Bottleneck Resolution',
        budgetMinutes: 15,
        objective: 'Identify single points of failure, partition database storage, and address cache stampedes.',
      },
      {
        id: 'wrap-up',
        name: 'Stage 4: Failure Scenarios & Trade-Offs',
        budgetMinutes: 7,
        objective: 'Simulate high QPS traffic surges and justify architectural trade-offs.',
      },
    ],
    labSlug: 'url-shortener',
  },
  {
    id: 'track-sysdesign-staff',
    slug: 'sysdesign-staff-60',
    title: 'Staff+ High-Throughput Streaming (60m)',
    kind: 'system-design',
    targetLevel: 'L6+',
    durationMinutes: 60,
    description:
      'Advanced 60-minute Staff/Principal interview. Covers global video streaming and transcode pipeline architecture, async event queues, chaos engineering resilience, and multi-region failover.',
    stages: [
      {
        id: 'scope',
        name: 'Stage 1: Problem Definition & Constraints',
        budgetMinutes: 10,
        objective: 'Clarify chunked video ingestion, multi-bitrate encoding SLAs, and global viewer distribution.',
      },
      {
        id: 'design',
        name: 'Stage 2: End-to-End Pipeline Architecture',
        budgetMinutes: 20,
        objective: 'Architect upload ingress, queue decouplers, worker transcode pools, S3 chunk storage, and CDN edge delivery.',
      },
      {
        id: 'chaos',
        name: 'Stage 3: Chaos Simulation & Outage Recovery',
        budgetMinutes: 20,
        objective: 'Inject worker consumer lag and primary database failure; demonstrate graceful degradation.',
      },
      {
        id: 'debrief',
        name: 'Stage 4: Executive Architectural Review',
        budgetMinutes: 10,
        objective: 'Evaluate operational cost, cross-region replication lag, and Staff+ architectural trade-offs.',
      },
    ],
    labSlug: 'video-streaming',
  },
];

export function getMockTracks(): MockTrack[] {
  return MOCK_TRACKS;
}

export function getMockTrack(slug: string): MockTrack | undefined {
  return MOCK_TRACKS.find((t) => t.slug === slug);
}
