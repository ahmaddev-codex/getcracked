export type JourneyTier = 'lesson' | 'problem' | 'challenge' | 'system-design' | 'lab';

export interface JourneyNode {
  id: string;
  slug: string;
  tier: JourneyTier;
  label: string;
  href: string;
  summary: string;
}

export interface LearningJourney {
  id: string;
  title: string;
  tagline: string;
  description: string;
  nodes: JourneyNode[];
}

export const LEARNING_JOURNEYS: readonly LearningJourney[] = [
  {
    id: 'cache-and-storage',
    title: 'From Hash Tables to Distributed Caching',
    tagline: 'Arrays → Hashing → Hash Map → LRU Cache → Caching → Distributed Cache',
    description:
      'Trace the engineering evolution of caching: from constant-time array hashing to eviction policies and multi-node consistent hashing clusters.',
    nodes: [
      {
        id: 'arrays',
        slug: 'arrays',
        tier: 'lesson',
        label: 'Arrays & Memory',
        href: '/learn/dsa#arrays',
        summary: 'Contiguous memory allocation and constant-time index math.',
      },
      {
        id: 'hashing',
        slug: 'hashing',
        tier: 'lesson',
        label: 'Hash Functions',
        href: '/learn/dsa#hashing',
        summary: 'Mapping arbitrary keys to bounded bucket indices.',
      },
      {
        id: 'two-sum',
        slug: 'two-sum',
        tier: 'problem',
        label: 'Two Sum Practice',
        href: '/problems/two-sum',
        summary: 'O(n) complement lookup using a hash table.',
      },
      {
        id: 'hash-map',
        slug: 'hash-map',
        tier: 'challenge',
        label: 'Build Hash Map',
        href: '/challenges/hash-map',
        summary: 'Construct bucket storage, separate chaining, and dynamic rehashing.',
      },
      {
        id: 'lru-cache',
        slug: 'lru-cache',
        tier: 'challenge',
        label: 'Build LRU Cache',
        href: '/challenges/lru-cache',
        summary: 'Implement O(1) recency eviction over an insertion-ordered map.',
      },
      {
        id: 'caching-lesson',
        slug: 'caching',
        tier: 'system-design',
        label: 'Caching Architecture',
        href: '/learn/system-design#caching',
        summary: 'Cache-aside, write-through, TTLs, and thundering herd protection.',
      },
      {
        id: 'distributed-cache-lab',
        slug: 'distributed-cache',
        tier: 'lab',
        label: 'Distributed Cache Lab',
        href: '/learn/system-design/labs/distributed-cache',
        summary: 'Multi-node cache cluster with consistent hashing and virtual nodes.',
      },
    ],
  },
  {
    id: 'rate-limiting-and-queues',
    title: 'From Priority Queues to Distributed Rate Limiting',
    tagline: 'Queues → Heaps → Min-Heap → Token Bucket → Rate Limiting → Distributed Rate Limiter',
    description:
      'Discover how queuing and heap primitives power high-throughput ingress defense and token bucket rate limiters.',
    nodes: [
      {
        id: 'stacks-queues',
        slug: 'stacks-queues',
        tier: 'lesson',
        label: 'Queues & Buffers',
        href: '/learn/dsa#stacks-queues',
        summary: 'FIFO ordering, bounded buffers, and enqueue/dequeue operations.',
      },
      {
        id: 'heaps',
        slug: 'heaps',
        tier: 'lesson',
        label: 'Binary Heaps',
        href: '/learn/dsa#heaps',
        summary: 'Complete binary trees and logarithmic priority extraction.',
      },
      {
        id: 'min-heap',
        slug: 'min-heap',
        tier: 'challenge',
        label: 'Build Min-Heap',
        href: '/challenges/min-heap',
        summary: 'Construct array-backed min-heap with siftUp, siftDown, and heapify.',
      },
      {
        id: 'token-bucket',
        slug: 'token-bucket',
        tier: 'challenge',
        label: 'Build Token Bucket',
        href: '/challenges/token-bucket',
        summary: 'Build real-world multi-client token bucket rate limiter.',
      },
      {
        id: 'rate-limiting-lesson',
        slug: 'rate-limiting',
        tier: 'system-design',
        label: 'Rate Limiting Concepts',
        href: '/learn/system-design#rate-limiting',
        summary: 'Token bucket vs leaky bucket vs sliding window counter.',
      },
      {
        id: 'rate-limiter-lab',
        slug: 'rate-limiter',
        tier: 'lab',
        label: 'Distributed Rate Limiter Lab',
        href: '/learn/system-design/labs/rate-limiter',
        summary: 'Redis cluster token bucket with atomic Lua scripts and circuit breakers.',
      },
    ],
  },
  {
    id: 'tree-routing-and-streaming',
    title: 'From Prefix Trees to Video Streaming CDNs',
    tagline: 'Trees → BST → Tries → Trie Build → CDNs → Video Streaming',
    description:
      'Understand how hierarchical search trees evolve into edge routing, content delivery networks, and distributed media streaming.',
    nodes: [
      {
        id: 'trees',
        slug: 'trees',
        tier: 'lesson',
        label: 'Tree Fundamentals',
        href: '/learn/dsa#trees',
        summary: 'Hierarchical node branching and depth-first traversals.',
      },
      {
        id: 'binary-search-tree',
        slug: 'binary-search-tree',
        tier: 'challenge',
        label: 'Build BST',
        href: '/challenges/binary-search-tree',
        summary: 'Construct BST with ordered insertion, search, and 3-case deletion.',
      },
      {
        id: 'tries',
        slug: 'tries',
        tier: 'lesson',
        label: 'Prefix Trees (Tries)',
        href: '/learn/dsa#tries',
        summary: 'Character-level branching for string prefix retrieval.',
      },
      {
        id: 'trie',
        slug: 'trie',
        tier: 'challenge',
        label: 'Build Trie',
        href: '/challenges/trie',
        summary: 'Construct n-ary prefix tree with autocomplete suggestion engine.',
      },
      {
        id: 'cdn-lesson',
        slug: 'cdn',
        tier: 'system-design',
        label: 'CDN Edge Delivery',
        href: '/learn/system-design#cdn',
        summary: 'Edge PoPs, Anycast routing, Origin shielding, and media caching.',
      },
      {
        id: 'video-streaming-lab',
        slug: 'video-streaming',
        tier: 'lab',
        label: 'Global Video Streaming Lab',
        href: '/learn/system-design/labs/video-streaming',
        summary: 'Chunked multi-bitrate HLS streaming with async transcoding pipelines.',
      },
    ],
  },
  {
    id: 'realtime-chat-and-messaging',
    title: 'From Pointers & State to Real-Time Distributed Messaging',
    tagline: 'Linked Lists → Linked List Build → Message Queues → Scaling → Real-Time Chat',
    description:
      'Learn how sequential pointer chains and state transitions scale into persistent WebSocket connections and distributed pub/sub brokers.',
    nodes: [
      {
        id: 'linked-lists',
        slug: 'linked-lists',
        tier: 'lesson',
        label: 'Linked Lists',
        href: '/learn/dsa#linked-lists',
        summary: 'Node pointer manipulation and non-contiguous memory management.',
      },
      {
        id: 'linked-list',
        slug: 'linked-list',
        tier: 'challenge',
        label: 'Build Linked List',
        href: '/challenges/linked-list',
        summary: 'Construct singly linked list with boundary insertions and in-place reversal.',
      },
      {
        id: 'undo-redo',
        slug: 'undo-redo',
        tier: 'challenge',
        label: 'Build Undo / Redo',
        href: '/challenges/undo-redo',
        summary: 'Implement command history with forward/backward cursor stacks.',
      },
      {
        id: 'message-queues-lesson',
        slug: 'message-queues',
        tier: 'system-design',
        label: 'Message Queues & Streams',
        href: '/learn/system-design#message-queues',
        summary: 'Asynchronous decoupling, pub/sub, at-least-once delivery.',
      },
      {
        id: 'real-time-chat-lab',
        slug: 'real-time-chat',
        tier: 'lab',
        label: 'Real-Time Chat Lab',
        href: '/learn/system-design/labs/real-time-chat',
        summary: '10M concurrent WebSockets, Redis Pub/Sub routing, and LSM persistence.',
      },
    ],
  },
];

/**
 * Finds the first matching learning journey for any given content node.
 */
export function findJourneyForContent(
  tier: JourneyTier,
  slug: string,
): { journey: LearningJourney; activeIndex: number } | null {
  for (const journey of LEARNING_JOURNEYS) {
    const idx = journey.nodes.findIndex(
      (n) => n.slug === slug || (n.tier === tier && n.id === slug),
    );
    if (idx !== -1) {
      return { journey, activeIndex: idx };
    }
  }
  return null;
}
