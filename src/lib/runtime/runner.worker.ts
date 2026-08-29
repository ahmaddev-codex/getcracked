/// <reference lib="webworker" />
import { runTestSpec } from '@/content/test-runner';
import { pythonRuntimeAvailable } from './python';
import type { RunRequest, RunResponse } from './protocol';

/**
 * Executes learner code off the main thread (T0.2 recommendation 6).
 *
 * QuickJS aborts fast enough that main-thread execution is survivable, but a
 * worker gives two things that matter: the tab keeps painting while a
 * submission runs, and a run that somehow escapes the interrupt handler can be
 * killed with `terminate()` — which is not possible for code blocking the main
 * thread.
 */
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { id, spec, source, language, trace, timeoutMs, measure } = event.data;

  try {
    // Pyodide will not load in a classic worker, which is what Turbopack emits
    // in development. Saying so immediately lets the client re-run on the main
    // thread; attempting it here would fail after a multi-megabyte download.
    if (language === 'python' && !pythonRuntimeAvailable()) {
      const response: RunResponse = {
        id,
        ok: false,
        unsupported: true,
        error: 'Python cannot run in this worker.',
      };
      self.postMessage(response);
      return;
    }

    const result = await runTestSpec({ spec, source, language, trace, timeoutMs, measure });
    const response: RunResponse = { id, ok: true, result };
    self.postMessage(response);
  } catch (e) {
    const response: RunResponse = {
      id,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
    self.postMessage(response);
  }
};
