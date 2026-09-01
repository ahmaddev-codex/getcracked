import type { ScenarioLabInput } from '../schema';

/**
 * Scenario lab for a scalable real-time messaging / chat system (like WhatsApp or Slack).
 */
export const realTimeChatLab: ScenarioLabInput = {
  slug: 'real-time-chat',
  title: 'Design a Real-time Chat System',
  summary: 'Architecting 1-on-1 and group messaging with persistent WebSockets, Redis Pub/Sub, and sequence ordering.',
  difficulty: 'hard',
  topics: ['message-queues', 'scaling', 'consistency'],
  timeBudgetMinutes: 35,

  brief: `> "Design a real-time messaging system like WhatsApp or Slack supporting 50 million daily active users,
> 1-on-1 and group chats, online presence status, and sub-100ms message delivery with offline sync."

Real-time chat systems differ fundamentally from typical request-response web apps. They require persistent
bidirectional stateful connections (WebSockets), efficient user-to-connection routing across distributed servers,
strict message ordering, and high-throughput append-only message persistence.

Work through the connection management, cross-server message fanout, message ordering, and offline delivery.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which requirements define the core real-time chat architecture?',
      options: [
        {
          label: 'Sub-100ms message delivery latency for online recipients',
          correct: true,
          reason:
            'Real-time chat requires instantaneous communication over persistent bidirectional connections without polling delays.',
        },
        {
          label: 'Guaranteed message ordering per conversation with monotonic sequence IDs',
          correct: true,
          reason:
            'Messages arriving out of order (e.g. answer arriving before the question) destroys chat readability and creates severe confusion.',
        },
        {
          label: 'Offline message queuing and synchronization when a recipient reconnects',
          correct: true,
          reason:
            'Mobile devices frequently lose signal or sleep. The system must buffer unread messages and deliver them seamlessly upon reconnection.',
        },
        {
          label: 'Presence tracking (Online / Away / Last Seen) with heartbeat mechanism',
          correct: true,
          reason:
            'Users expect to see who is active in real time; heartbeats ensure disconnected clients are marked offline without waiting for TCP socket timeouts.',
        },
        {
          label: 'HTTP Short Polling every 500ms from every mobile device',
          reason:
            'Short polling creates billions of empty HTTP requests per minute, overwhelming server connection pools and draining mobile battery life.',
        },
        {
          label: 'Synchronous cross-region two-phase commit (2PC) for every message sent across international users',
          reason:
            'Two-phase commit requires synchronous cross-continental locking and rounds of consensus, adding hundreds of milliseconds of latency that destroys real-time messaging throughput.',
        },
      ],
    },

    {
      slug: 'connection-estimation',
      kind: 'estimate',
      dimension: 'estimation',
      concepts: ['latency-vs-throughput'],
      prompt: 'If 10 million concurrent users maintain persistent WebSocket connections, how many connection servers (assuming 50k connections per server) are needed?',
      unit: 'WebSocket connection servers',
      answer: 200,
      tolerance: 3,
      working:
        '10,000,000 active concurrent WebSocket connections ÷ 50,000 connections per modern Linux gateway node = 200 connection servers.',
    },

    {
      slug: 'connection-protocol',
      kind: 'select',
      dimension: 'api',
      concepts: ['load-balancer'],
      prompt: 'Which protocol and network architecture best maintains persistent bidirectional communication for chat?',
      options: [
        {
          label: 'WebSocket protocol over TLS (wss://) with a stateful connection gateway cluster',
          correct: true,
          reason:
            'WebSockets provide full-duplex communication over a single long-lived TCP connection with minimal 2-byte framing overhead per message.',
        },
        {
          label: 'Standard HTTP/1.1 POST requests for sending paired with HTTP long-polling for receiving',
          reason:
            'Long-polling incurs full HTTP header overhead (500–1000 bytes) on every single message and requires constant connection re-establishment.',
        },
        {
          label: 'Raw UDP datagrams directly from client to client',
          reason:
            'UDP does not guarantee packet delivery, ordering, or handshake encryption, resulting in dropped messages and blocked cellular NATs.',
        },
      ],
    },

    {
      slug: 'message-routing',
      kind: 'select',
      dimension: 'scaling',
      concepts: ['consumer-group', 'consistent-hashing'],
      prompt: 'How does Server A route an incoming message to User B connected to Server B?',
      options: [
        {
          label: 'A distributed session store (e.g. Redis) maps UserID -> ServerID; messages are routed via Redis Pub/Sub or Kafka topic',
          correct: true,
          reason:
            'A central key-value store tracks which gateway server holds each user connection. The message is published to the target server channel for immediate delivery.',
        },
        {
          label: 'Broadcast every incoming message to all 200 WebSocket gateway servers simultaneously',
          reason:
            'Broadcasting every message across the entire server cluster wastes massive network bandwidth and scales as O(N × M).',
        },
        {
          label: 'Require both users in a conversation to disconnect and reconnect to the exact same physical server',
          reason:
            'Forcing co-location breaks horizontal load balancing and makes group chats with users across different regions impossible.',
        },
      ],
    },

    {
      slug: 'storage-model',
      kind: 'select',
      dimension: 'data-model',
      concepts: ['b-tree-vs-lsm', 'sql-vs-nosql'],
      prompt: 'Which database architecture best handles high-volume append-only chat history with fast per-channel chronological reads?',
      options: [
        {
          label: 'Wide-column NoSQL (e.g. Apache Cassandra or ScyllaDB) partitioned by channel_id, sorted by message_id',
          correct: true,
          reason:
            'Wide-column stores (LSM-tree based) handle massive write throughput effortlessly and store sequential message rows contiguous on disk for fast range queries.',
        },
        {
          label: 'A single centralized MySQL table with an auto-increment integer ID and no partitions',
          reason:
            'A single unpartitioned SQL table hits disk I/O and lock contention limits at millions of writes per day, causing query timeouts.',
        },
        {
          label: 'Append messages directly to a static text file on the local web server disk',
          reason:
            'Local file storage loses data on server crash, has no query capability, and cannot be shared across multiple backend instances.',
        },
      ],
    },
  ],

  takeaway: `Real-time chat architectures are built on persistent bidirectional socket gateways.
Decoupling connection state from routing via distributed session mappings (Redis Pub/Sub) enables horizontal scaling.
Monotonic per-channel sequence numbers ensure strict message order, and wide-column LSM data stores (Cassandra)
provide unbounded append-only write throughput and fast chronological history fetching.`,
};
