import type { ScenarioLabInput } from '../schema';

/**
 * Scenario lab for a large-scale video streaming platform (like YouTube or Netflix).
 */
export const videoStreamingLab: ScenarioLabInput = {
  slug: 'video-streaming',
  title: 'Design a Video Streaming Platform',
  summary: 'Architecting video ingestion, adaptive bitrate transcoding, blob storage, and CDN edge delivery.',
  difficulty: 'hard',
  topics: ['caching', 'cdn', 'scaling'],
  timeBudgetMinutes: 35,

  brief: `> "Design a global video streaming platform capable of handling 50,000 video uploads daily
> and serving over 100 million video hours streamed daily with minimal buffering and adaptive bitrate quality."

Video architectures present unique distributed challenges: massive payload sizes (gigabytes per file),
CPU-intensive asynchronous transcoding pipelines, huge global bandwidth egress, and split data models
(lightweight relational metadata vs multi-terabyte immutable blob chunks).

Walk through the requirements, storage sizing, transcoding queues, and global CDN delivery network.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which requirements define the core video streaming architecture?',
      options: [
        {
          label: 'Adaptive bitrate streaming (e.g. HLS, MPEG-DASH) across variable bandwidths and devices',
          correct: true,
          reason:
            'Clients on 3G mobile networks versus fiber broadband require dynamically adjusting stream resolutions (360p to 4K) without pausing video playback.',
        },
        {
          label: 'Asynchronous, fault-tolerant video processing pipeline with chunked transcoding',
          correct: true,
          reason:
            'Video encoding is CPU-intensive and takes minutes. Processing must be broken into independent chunks across a worker fleet to enable parallel encoding and retry isolation.',
        },
        {
          label: 'Global CDN caching for popular video segment chunks near end users',
          correct: true,
          reason:
            'Serving petabytes of video directly from origin blob stores is prohibitively slow and expensive. CDN edge nodes absorb >95% of playback egress traffic.',
        },
        {
          label: 'Sub-100ms real-time audio/video bidirectional live conferencing (WebRTC)',
          reason:
            'On-demand video streaming (VOD) relies on buffered HTTP segment playback (HLS/DASH), not sub-100ms peer-to-peer WebRTC conferencing protocols.',
        },
        {
          label: 'Synchronous video encoding directly on the user-facing web servers before returning HTTP 200',
          reason:
            'Holding open HTTP upload connections for 15-minute video encodings ties up server worker threads and leads to frequent client upload timeouts.',
        },
      ],
    },

    {
      slug: 'storage-estimation',
      kind: 'estimate',
      dimension: 'estimation',
      concepts: ['latency-vs-throughput'],
      prompt: 'If 50,000 videos are uploaded daily and average 500 MB after multi-resolution transcoding, how many Terabytes (TB) of new storage are needed daily?',
      unit: 'TB per day',
      answer: 25,
      tolerance: 3,
      working:
        '50,000 videos × 0.5 GB (500 MB) = 25,000 GB = 25 Terabytes (TB) of raw video blob storage required every 24 hours (or ~9 Petabytes/year).',
    },

    {
      slug: 'ingestion-architecture',
      kind: 'select',
      dimension: 'api',
      concepts: ['api-gateway', 'claim-check'],
      prompt: 'How should large multi-gigabyte video uploads be handled efficiently without proxying heavy bytes through application servers?',
      options: [
        {
          label: 'Generate pre-signed S3 upload URLs with direct client-to-blob multipart chunking',
          correct: true,
          reason:
            'Pre-signed URLs allow client browsers and mobile apps to upload raw video segments directly to cloud object storage (S3), freeing app servers to handle lightweight auth and metadata.',
        },
        {
          label: 'Stream the entire raw video payload through the application API gateway into server RAM',
          reason:
            'Proxying gigabytes of binary data through application web servers consumes network I/O, exhausts RAM, and starves lightweight metadata requests.',
        },
        {
          label: 'Base64-encode the raw video and store it as a BLOB column inside PostgreSQL',
          reason:
            'Relational databases suffer extreme performance degradation when storing multi-gigabyte binary files, ballooning write-ahead logs and backup sizes.',
        },
      ],
    },

    {
      slug: 'transcoding-pipeline',
      kind: 'select',
      dimension: 'scaling',
      concepts: ['competing-consumers', 'dead-letter'],
      prompt: 'How should the video processing worker fleet be orchestrated for high throughput and fault tolerance?',
      options: [
        {
          label: 'Decouple ingestion from encoding with a distributed message queue (SQS) feeding a pool of spot worker instances',
          correct: true,
          reason:
            'A message queue allows workers to process tasks at their own pace with automatic retries and dead-letter handling, easily autoscaling based on queue depth.',
        },
        {
          label: 'Synchronous gRPC calls from the upload service directly to specific worker IP addresses',
          reason:
            'Direct point-to-point worker invocation creates tight coupling and fails if a worker crashes or reboots mid-transcode.',
        },
        {
          label: 'A cron job that queries the relational database every hour for unprocessed video rows',
          reason:
            'Periodic polling introduces latency delays and causes database table locking when thousands of worker nodes poll simultaneously.',
        },
      ],
    },

    {
      slug: 'playback-optimization',
      kind: 'select',
      dimension: 'bottleneck',
      concepts: ['cdn'],
      prompt: 'What strategy minimizes video start latency (time-to-first-frame) for viewers worldwide?',
      options: [
        {
          label: 'Serve master playlist manifests (.m3u8) with low TTLs and aggressively edge-cache the first 2 video chunks on CDN',
          correct: true,
          reason:
            'Pre-fetching and caching the initial video segments at the CDN edge allows playback to start instantly while subsequent chunks are buffered in the background.',
        },
        {
          label: 'Download the entire 2-hour MP4 video file to client local storage before starting playback',
          reason:
            'Downloading the full video before playing introduces minutes of waiting time and wastes massive bandwidth if the user abandons the video early.',
        },
        {
          label: 'Route all global playback traffic directly to the single origin S3 bucket without a CDN',
          reason:
            'Origin-only delivery introduces high cross-continental network latency, packet loss, and huge egress bandwidth costs.',
        },
      ],
    },
  ],

  takeaway: `Video streaming architecture decouples heavy binary payloads from metadata.
Direct client uploads via pre-signed S3 URLs prevent application server saturation.
Asynchronous transcoding fleets orchestrated via message queues produce segmented adaptive bitrate streams (HLS),
and CDN edge networks absorb virtually all playback bandwidth to deliver instantaneous playback globally.`,
};
