import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INPUTS,
  averageQps,
  estimate,
  formatBytes,
  formatCount,
  peakEgress,
  peakQps,
  storageAtRetention,
  storagePerDay,
  writesPerSecond,
} from '@/lib/system-design/capacity';

/**
 * Back-of-the-envelope estimation (C3).
 *
 * The arithmetic has to be right, but it also has to be *reproducible on a
 * whiteboard* — that is the skill being taught. So these check the numbers
 * against hand-computed values rather than against a snapshot, which would pass
 * whether or not the formula meant anything.
 */
describe('capacity arithmetic', () => {
  const input = { ...DEFAULT_INPUTS, dau: 1_000_000, requestsPerUser: 86.4 };

  it('averages requests over the whole day', () => {
    // 1,000,000 × 86.4 ÷ 86,400 = 1,000 exactly.
    expect(averageQps(input)).toBeCloseTo(1_000, 6);
  });

  it('sizes the peak against the average', () => {
    expect(peakQps({ ...input, peakMultiplier: 3 })).toBeCloseTo(3_000, 6);
  });

  it('splits reads and writes by the stated ratio', () => {
    const split = { ...input, writeRatio: 0.25 };
    expect(writesPerSecond(split)).toBeCloseTo(250, 6);
  });

  it('multiplies storage by retention and by replicas', () => {
    // The replica factor is the term people forget, and it is a 3x error.
    const one = storageAtRetention({ ...input, replicationFactor: 1 });
    const three = storageAtRetention({ ...input, replicationFactor: 3 });
    expect(three).toBeCloseTo(one * 3, 6);
  });

  it('derives daily storage from writes, not from all traffic', () => {
    // Sizing storage off total QPS rather than writes is a 10x error at the
    // default 10% write ratio.
    const perDay = storagePerDay({ ...input, writeRatio: 0.1, bytesPerWrite: 1000 });
    expect(perDay).toBeCloseTo(100 * 86_400 * 1000, 6);
  });

  it('applies the peak multiplier to egress as well as to QPS', () => {
    const flat = peakEgress({ ...input, peakMultiplier: 1 });
    const peaky = peakEgress({ ...input, peakMultiplier: 4 });
    expect(peaky).toBeCloseTo(flat * 4, 6);
  });
});

describe('formatting', () => {
  it('speaks in orders of magnitude, not seven significant digits', () => {
    // The inputs are estimates; rendering 1,728,431 implies precision that is
    // not there.
    expect(formatCount(1_728_431)).toBe('1.73 million');
    expect(formatCount(4_200)).toBe('4.2k');
    expect(formatCount(87)).toBe('87');
  });

  it('uses SI powers of 1000 for bytes', () => {
    // Disk vendors, cloud pricing and every capacity conversation use SI.
    // Mixing in 1024 drifts an estimate ~10% with nobody noticing.
    expect(formatBytes(1_000)).toBe('1 KB');
    expect(formatBytes(1_500_000)).toBe('1.5 MB');
    expect(formatBytes(2_000_000_000_000)).toBe('2 TB');
  });

  it('does not crash on nonsense input', () => {
    expect(formatCount(Number.NaN)).toBe('—');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('the working, not just the answer', () => {
  it('shows how every figure was derived', () => {
    // A calculator that returns a number and nothing else teaches the one thing
    // this exercise is not about.
    for (const row of estimate(DEFAULT_INPUTS)) {
      expect(row.working, `${row.label} has no working`).toBeTruthy();
      expect(row.value).toBeTruthy();
    }
  });

  it('derives traffic before cost, which is the order to work in', () => {
    const labels = estimate(DEFAULT_INPUTS).map((r) => r.label);
    expect(labels.indexOf('Average QPS')).toBeLessThan(labels.indexOf('New data per day'));
    expect(labels.indexOf('Peak QPS')).toBeLessThan(labels.indexOf('Peak egress'));
  });

  it('names replication in the storage working', () => {
    const storage = estimate(DEFAULT_INPUTS).find((r) => r.label.startsWith('Stored after'));
    expect(storage?.working).toMatch(/replicas/);
  });
});
