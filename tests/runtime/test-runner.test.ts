import { describe, it, expect } from 'vitest';
import { runTestSpec } from '@/content/test-runner';

describe('Test Runner Hardening', () => {
  it('handles floating point calculations within epsilon tolerance', async () => {
    const code = `
    function calc() {
      return 0.1 + 0.2;
    }
    `;

    const result = await runTestSpec({
      spec: {
        entry: 'calc',
        cases: [{ args: [], expected: 0.3, hidden: false }],
      },
      source: code,
      language: 'javascript',
    });

    expect(result.passed).toBe(true);
    expect(result.cases[0].passed).toBe(true);
  });

  it('handles NaN equality properly', async () => {
    const code = `
    function getNaN() {
      return NaN;
    }
    `;

    const result = await runTestSpec({
      spec: {
        entry: 'getNaN',
        cases: [{ args: [], expected: NaN, hidden: false }],
      },
      source: code,
      language: 'javascript',
    });

    expect(result.passed).toBe(true);
  });

  it('enforces aggregate timeout to protect browser from long suites', async () => {
    // A slow function that takes 100ms per case
    const code = `
    function slow() {
      var start = Date.now();
      while (Date.now() - start < 100) {}
      return 1;
    }
    `;

    // 10 cases with very low single timeout (50ms) and low aggregate ceiling
    const cases = Array.from({ length: 5 }, () => ({
      args: [],
      expected: 1,
      hidden: false,
    }));

    const result = await runTestSpec({
      spec: { entry: 'slow', cases },
      source: code,
      language: 'javascript',
      timeoutMs: 50,
    });

    expect(result.timedOut).toBe(true);
    expect(result.passed).toBe(false);
  });
});
