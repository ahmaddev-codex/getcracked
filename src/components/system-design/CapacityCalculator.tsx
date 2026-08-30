'use client';

import { useState } from 'react';
import { Node } from '@/components/ui/Node';
import { Button } from '@/components/ui/Button';
import {
  DEFAULT_INPUTS,
  estimate,
  formatBytes,
  type CapacityInputs,
} from '@/lib/system-design/capacity';

/**
 * The capacity calculator (C3).
 *
 * Every result shows the arithmetic beside it, because the number is not the
 * point — an interviewer asking "how many servers?" is testing whether you can
 * reach an order of magnitude out loud. A calculator that returns "14k QPS" and
 * nothing else automates away the exact skill it is meant to teach.
 *
 * Presets exist for the same reason a worked example does: a learner who has
 * never sized a system does not know what a plausible write ratio is, and
 * guessing produces an estimate they cannot sanity-check.
 */

interface Field {
  key: keyof CapacityInputs;
  label: string;
  hint: string;
  step?: number;
  min?: number;
  max?: number;
}

const FIELDS: Field[] = [
  { key: 'dau', label: 'Daily active users', hint: 'The number the question usually gives you.', step: 100_000, min: 0 },
  { key: 'requestsPerUser', label: 'Requests per user per day', hint: 'Sessions × actions per session.', step: 1, min: 0 },
  { key: 'peakMultiplier', label: 'Peak multiplier', hint: '2–5× the average is typical. Traffic is never flat.', step: 0.5, min: 1 },
  { key: 'writeRatio', label: 'Write ratio', hint: 'Most systems are read-heavy — 1:10 or lower.', step: 0.05, min: 0, max: 1 },
  { key: 'bytesPerWrite', label: 'Bytes per write', hint: 'A row, a message, an event.', step: 100, min: 0 },
  { key: 'bytesPerRead', label: 'Bytes per read', hint: 'What a response actually returns.', step: 100, min: 0 },
  { key: 'retentionYears', label: 'Retention (years)', hint: 'How long writes are kept.', step: 1, min: 0 },
  { key: 'replicationFactor', label: 'Replicas', hint: 'Including the primary. Three is the usual default.', step: 1, min: 1 },
];

const PRESETS: Array<{ name: string; hint: string; values: CapacityInputs }> = [
  {
    name: 'Social feed',
    hint: 'Read-heavy, small writes, kept forever',
    values: { ...DEFAULT_INPUTS, dau: 10_000_000, requestsPerUser: 50, writeRatio: 0.02, retentionYears: 5 },
  },
  {
    name: 'Chat',
    hint: 'Write-heavy, tiny payloads',
    values: { ...DEFAULT_INPUTS, dau: 5_000_000, requestsPerUser: 100, writeRatio: 0.5, bytesPerWrite: 200, bytesPerRead: 400 },
  },
  {
    name: 'Video streaming',
    hint: 'Few requests, enormous egress',
    values: { ...DEFAULT_INPUTS, dau: 2_000_000, requestsPerUser: 5, writeRatio: 0.001, bytesPerRead: 50_000_000, retentionYears: 10 },
  },
];

export function CapacityCalculator() {
  const [inputs, setInputs] = useState<CapacityInputs>(DEFAULT_INPUTS);
  const rows = estimate(inputs);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Start from
        </span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.name}
            tone="surface"
            title={preset.hint}
            onClick={() => setInputs(preset.values)}
            className="px-2 py-1 text-xs"
          >
            {preset.name}
          </Button>
        ))}
        <Button
          tone="surface"
          onClick={() => setInputs(DEFAULT_INPUTS)}
          className="px-2 py-1 text-xs"
        >
          Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Node tone="surface" className="flex flex-col gap-3 p-4">
          <h3 className="text-sm font-semibold">Assumptions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-xs">
                <span className="font-semibold">{field.label}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={inputs[field.key]}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    // A blank or nonsense field would make every figure NaN, so
                    // it holds the last usable value instead.
                    if (!Number.isFinite(next)) return;
                    setInputs((prev) => ({ ...prev, [field.key]: next }));
                  }}
                  className="node-surface bg-surface px-2 py-1 font-mono text-sm text-foreground"
                />
                <span className="text-foreground-muted">{field.hint}</span>
              </label>
            ))}
          </div>
        </Node>

        <Node tone="surface" className="flex flex-col gap-3 p-4">
          <h3 className="text-sm font-semibold">Estimate</h3>
          <dl className="flex flex-col divide-y divide-border-subtle">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 py-2 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-sm font-semibold">{row.label}</dt>
                  <dd className="font-mono text-base font-bold">{row.value}</dd>
                </div>
                {/* The working, which is the part worth learning. */}
                <p className="font-mono text-xs text-foreground-muted">= {row.working}</p>
                {row.note && <p className="text-xs text-foreground-muted">{row.note}</p>}
              </div>
            ))}
          </dl>
        </Node>
      </div>

      <Node tone="muted" className="p-3 text-xs text-foreground-muted">
        Bytes are SI — 1 KB is 1,000 bytes, as disk vendors and cloud bills count them. Storage
        of {formatBytes(1_000_000_000_000)} is a terabyte, not a tebibyte. Mixing the two drifts
        an estimate about 10% with nobody noticing.
      </Node>
    </div>
  );
}
