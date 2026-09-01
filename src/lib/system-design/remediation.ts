import type { LabDimension, ScenarioLab } from '@/content/schema';
import type { Scorecard as ScorecardData } from '@/lib/system-design/rubric';
import type { SimulationConfig } from '@/lib/system-design/simulation';

export interface RemediationRecommendation {
  id: string;
  dimension: LabDimension;
  title: string;
  diagnostic: string;
  rootCause: string;
  actionAdvice: string;
  conceptSlugs: string[];
  suggestedSimConfig: SimulationConfig;
}

/**
 * Maps weak dimensions and lab context into concrete, targeted architectural remediation paths (Track 5).
 */
export function generateScorecardRemediations(
  lab: ScenarioLab,
  score: ScorecardData,
): RemediationRecommendation[] {
  const recommendations: RemediationRecommendation[] = [];

  // Determine targeted dimensions: weakest first, or all if none failed
  const targetDimensions: LabDimension[] =
    score.weakest.length > 0
      ? score.weakest
      : (['scaling', 'bottleneck'] as LabDimension[]);

  for (const dim of targetDimensions) {
    switch (dim) {
      case 'scaling':
        recommendations.push({
          id: `${lab.slug}-scaling-remediation`,
          dimension: 'scaling',
          title: 'Scale Read Throughput with Cache-Aside & Read Replicas',
          diagnostic:
            'Direct database reads saturate CPU and disk I/O when user traffic spikes, causing catastrophic latency degradation.',
          rootCause:
            'A single primary database cannot sustain thousands of concurrent queries without an in-memory caching buffer.',
          actionAdvice:
            'Introduce an in-memory cache (Redis) with the Cache-Aside pattern to intercept 90%+ of read requests, and distribute residual queries across asynchronous read replicas.',
          conceptSlugs: ['cache-aside', 'read-replicas'],
          suggestedSimConfig: {
            globalQps: 75000,
            profile: 'read-heavy',
            activeChaos: ['cache-stampede'],
          },
        });
        break;

      case 'bottleneck':
        recommendations.push({
          id: `${lab.slug}-bottleneck-remediation`,
          dimension: 'bottleneck',
          title: 'Eliminate Cascading Bottlenecks with Queues & Rate Limiting',
          diagnostic:
            'Synchronous worker threads are exhausted by sudden traffic surges or slow downstream dependencies.',
          rootCause:
            'Tight request-response coupling prevents traffic smoothing and graceful load shedding under peak load.',
          actionAdvice:
            'Buffer bursts using an asynchronous Message Queue to decouple producers from workers, and deploy Token Bucket Rate Limiting at edge ingress to reject abusive traffic.',
          conceptSlugs: ['message-queue', 'rate-limiting'],
          suggestedSimConfig: {
            globalQps: 45000,
            profile: 'spiky',
            activeChaos: ['slow-consumer-lag'],
          },
        });
        break;

      case 'data-model':
        recommendations.push({
          id: `${lab.slug}-datamodel-remediation`,
          dimension: 'data-model',
          title: 'Partition Storage with Polyglot Persistence & Sharding',
          diagnostic:
            'Monolithic transactional database exceeds single-node disk capacity, memory buffer pool, and IOPS limits.',
          rootCause:
            'Relational constraints and cross-table joins do not partition horizontally across nodes without explicit shard keys.',
          actionAdvice:
            'Partition high-velocity telemetry into distributed NoSQL stores or shard relational tables horizontally by a high-cardinality partition key.',
          conceptSlugs: ['sql-vs-nosql', 'sharding'],
          suggestedSimConfig: {
            globalQps: 60000,
            profile: 'write-heavy',
            activeChaos: ['primary-db-crash'],
          },
        });
        break;

      case 'estimation':
        recommendations.push({
          id: `${lab.slug}-estimation-remediation`,
          dimension: 'estimation',
          title: 'Absorb Surge Volume with Edge Caching & Load Balancing',
          diagnostic:
            'Capacity estimation failed to account for peak-to-average traffic multipliers and global network egress bandwidth.',
          rootCause:
            'Uncached origin servers drown in concurrent bandwidth consumption when flash spikes hit the primary datacenter.',
          actionAdvice:
            'Size compute pools for 3-5x peak spikes, terminate TLS at Layer 7 Load Balancers, and offload static assets to geo-distributed CDN PoPs.',
          conceptSlugs: ['load-balancer', 'cdn'],
          suggestedSimConfig: {
            globalQps: 80000,
            profile: 'spiky',
            activeChaos: ['ddos-flood'],
          },
        });
        break;

      case 'requirements':
      default:
        recommendations.push({
          id: `${lab.slug}-resilience-remediation`,
          dimension: 'requirements',
          title: 'Fortify System Boundaries with Circuit Breakers & DLQs',
          diagnostic:
            'Unbounded failure blast radius: an unhandled exception or hanging dependency took down the whole service.',
          rootCause:
            'Missing failure boundaries and absence of fallback mechanisms allow poison pills to crash consumer fleets.',
          actionAdvice:
            'Deploy Circuit Breakers to fail fast within 1ms when dependencies degrade, and route poisoned payloads to Dead Letter Queues for isolated debugging.',
          conceptSlugs: ['circuit-breaker', 'dead-letter'],
          suggestedSimConfig: {
            globalQps: 30000,
            profile: 'steady',
            activeChaos: ['network-partition'],
          },
        });
        break;
    }
  }

  return recommendations;
}
