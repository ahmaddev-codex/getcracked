import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    // A concrete origin, so code reading `location` behaves as it would in a
    // browser rather than against `about:blank`.
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],

    /**
     * Capped concurrency.
     *
     * Test files here are unusually heavy: each content suite instantiates
     * QuickJS and Pyodide (multi-megabyte WASM), and each database suite starts
     * an embedded Postgres. Vitest's default of one worker per core runs a
     * dozen of those at once and they starve each other — database tests that
     * finish in milliseconds alone were timing out at 17 seconds in the full
     * run, with no logic change.
     *
     * Four workers keeps the suite parallel without letting the WASM runtimes
     * contend. Revisit if the suite outgrows it rather than raising timeouts,
     * which would hide the contention instead of fixing it.
     */
    maxWorkers: 4,

    /** Cold WASM instantiation genuinely takes seconds on a loaded machine. */
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
