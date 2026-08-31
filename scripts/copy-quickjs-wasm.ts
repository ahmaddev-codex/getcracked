import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Copies QuickJS's WebAssembly into `public/` so we serve it ourselves.
 *
 * **Why the binary is not embedded in the JavaScript any more.** The
 * single-file variant ships the whole module as a ~800KB template literal, and
 * Turbopack's production minifier rewrites `\x00` to `\0` inside it without
 * checking the next character. Where the binary happens to contain a zero byte
 * followed by an ASCII `0`, that produces `\00` — a legacy octal escape, which
 * is illegal in a template literal. The chunk then fails to parse, but only in
 * production and only when something actually loads it, which is the worker:
 *
 *     SyntaxError: Failed to execute 'importScripts' on 'WorkerGlobalScope':
 *     Octal escape sequences are not allowed in template strings.
 *
 * Verified rather than assumed: the upstream file parses, our built chunk does
 * not, and the built chunk contains `\00` in five places where upstream has
 * none.
 *
 * Serving the `.wasm` as a file avoids the whole class of problem — there is no
 * giant string for a minifier to rewrite — and is better anyway: the browser
 * caches a binary instead of re-parsing half a megabyte of JavaScript.
 *
 * Copied at build time rather than committed, so the asset cannot drift from the
 * package version that `pnpm-lock.yaml` pins.
 */
const require = createRequire(import.meta.url);

const PACKAGE = '@jitl/quickjs-wasmfile-release-sync';
const WASM = 'emscripten-module.wasm';

/** Mirrors `wasmUrl` in lib/runtime/quickjs.ts — they must not drift. */
const DESTINATION = join('public', 'quickjs');

function main() {
  // Resolved through the package's own entry rather than by guessing a path
  // into node_modules, which pnpm's layout makes unguessable anyway.
  const from = join(dirname(require.resolve(`${PACKAGE}/package.json`)), 'dist', WASM);

  mkdirSync(DESTINATION, { recursive: true });
  copyFileSync(from, join(DESTINATION, WASM));

  process.stdout.write(`✓ QuickJS WebAssembly copied to ${DESTINATION}/${WASM}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `Could not copy QuickJS WebAssembly: ${String(error)}\n` +
      'Without it the JavaScript runtime cannot start in the browser.\n',
  );
  process.exit(1);
}
