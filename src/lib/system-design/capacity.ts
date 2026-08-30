/**
 * Back-of-the-envelope capacity estimation (C3).
 *
 * The point is not the number — it is the arithmetic. An interviewer asking
 * "how many servers?" is testing whether you can get to an order of magnitude
 * out loud, so every result here carries the working that produced it. A
 * calculator that returns "14,000 QPS" and nothing else teaches the one thing
 * the exercise is not about.
 *
 * Deliberately simple arithmetic with stated assumptions rather than a model
 * with hidden constants. Every figure below is reproducible on a whiteboard,
 * which is where a learner will have to reproduce it.
 */

export interface CapacityInputs {
  /** Daily active users. */
  dau: number;
  /** Requests each active user makes per day. */
  requestsPerUser: number;
  /** How much busier the peak hour is than the average. */
  peakMultiplier: number;
  /** Share of requests that write, 0–1. */
  writeRatio: number;
  /** Bytes stored per write. */
  bytesPerWrite: number;
  /** Bytes returned per read. */
  bytesPerRead: number;
  /** How long writes are kept, in years. */
  retentionYears: number;
  /** Copies of the data kept, including the primary. */
  replicationFactor: number;
}

export const DEFAULT_INPUTS: CapacityInputs = {
  dau: 1_000_000,
  requestsPerUser: 20,
  peakMultiplier: 3,
  writeRatio: 0.1,
  bytesPerWrite: 1_000,
  bytesPerRead: 2_000,
  retentionYears: 3,
  replicationFactor: 3,
};

/** A result, with the arithmetic that produced it. */
export interface Estimate {
  label: string;
  value: string;
  working: string;
  /** Why this figure matters in a design conversation. */
  note?: string;
}

const SECONDS_PER_DAY = 86_400;
const DAYS_PER_YEAR = 365;

/**
 * Formats a count the way it would be said aloud.
 *
 * "1.7 million" rather than "1,728,000": the exercise is orders of magnitude,
 * and a number with seven significant digits implies a precision the inputs do
 * not have.
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${round(n / 1e9)} billion`;
  if (n >= 1e6) return `${round(n / 1e6)} million`;
  if (n >= 1e3) return `${round(n / 1e3)}k`;
  return String(Math.round(n));
}

/**
 * Formats bytes in SI units.
 *
 * Powers of 1000, not 1024 — disk vendors, cloud pricing and every capacity
 * conversation use SI, and mixing the two is how an estimate drifts 10% without
 * anyone noticing.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${round(value)} ${units[unit]}`;
}

function round(n: number): string {
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/\.?0+$/, '');
}

/** Requests per second, averaged over the whole day. */
export function averageQps(input: CapacityInputs): number {
  return (input.dau * input.requestsPerUser) / SECONDS_PER_DAY;
}

/**
 * Requests per second at peak.
 *
 * The figure that actually sizes the fleet: capacity planned against the daily
 * average falls over every evening, and traffic is never flat.
 */
export function peakQps(input: CapacityInputs): number {
  return averageQps(input) * input.peakMultiplier;
}

export function writesPerSecond(input: CapacityInputs): number {
  return averageQps(input) * input.writeRatio;
}

export function readsPerSecond(input: CapacityInputs): number {
  return averageQps(input) * (1 - input.writeRatio);
}

export function storagePerDay(input: CapacityInputs): number {
  return writesPerSecond(input) * SECONDS_PER_DAY * input.bytesPerWrite;
}

/** Total stored, over the retention window, across every replica. */
export function storageAtRetention(input: CapacityInputs): number {
  return storagePerDay(input) * DAYS_PER_YEAR * input.retentionYears * input.replicationFactor;
}

/** Bytes per second leaving the service at peak. */
export function peakEgress(input: CapacityInputs): number {
  const peakReads = readsPerSecond(input) * input.peakMultiplier;
  return peakReads * input.bytesPerRead;
}

/**
 * Every figure, with its working.
 *
 * Returned as a list rather than an object so the order is the order a learner
 * should derive them in: traffic, then the split, then what it costs to store
 * and to serve. That sequence is the actual technique.
 */
export function estimate(input: CapacityInputs): Estimate[] {
  const avg = averageQps(input);
  const peak = peakQps(input);
  const writes = writesPerSecond(input);
  const reads = readsPerSecond(input);

  return [
    {
      label: 'Average QPS',
      value: formatCount(avg),
      working: `${formatCount(input.dau)} users × ${input.requestsPerUser} requests ÷ 86,400 seconds`,
      note: 'The daily average, which nothing is actually sized against.',
    },
    {
      label: 'Peak QPS',
      value: formatCount(peak),
      working: `${formatCount(avg)} × ${input.peakMultiplier} peak multiplier`,
      note: 'The number that sizes the fleet. Capacity planned against the average falls over every evening.',
    },
    {
      label: 'Writes per second',
      value: formatCount(writes),
      working: `${formatCount(avg)} × ${Math.round(input.writeRatio * 100)}% writes`,
      note: 'Usually the bottleneck: a single primary absorbs writes, while reads spread across replicas.',
    },
    {
      label: 'Reads per second',
      value: formatCount(reads),
      working: `${formatCount(avg)} × ${Math.round((1 - input.writeRatio) * 100)}% reads`,
      note: 'What caching and replicas are for.',
    },
    {
      label: 'New data per day',
      value: formatBytes(storagePerDay(input)),
      working: `${formatCount(writes)} writes/s × 86,400 × ${formatBytes(input.bytesPerWrite)}`,
    },
    {
      label: `Stored after ${input.retentionYears} years`,
      value: formatBytes(storageAtRetention(input)),
      working: `${formatBytes(storagePerDay(input))}/day × 365 × ${input.retentionYears} years × ${input.replicationFactor} replicas`,
      note: 'Replication multiplies the bill. Forgetting it is the most common way an estimate comes out three times too small.',
    },
    {
      label: 'Peak egress',
      value: `${formatBytes(peakEgress(input))}/s`,
      working: `${formatCount(reads * input.peakMultiplier)} peak reads/s × ${formatBytes(input.bytesPerRead)}`,
      note: 'Bandwidth is often the real cost, and the one people forget to estimate at all.',
    },
  ];
}
