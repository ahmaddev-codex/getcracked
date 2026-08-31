import {
  newQuickJSWASMModuleFromVariant,
  type QuickJSWASMModule,
} from 'quickjs-emscripten-core';

/**
 * QuickJS module loader.
 *
 * **Self-hosted WebAssembly, served as a file.** The `.wasm` is copied into
 * `public/quickjs/` at build time (`scripts/copy-quickjs-wasm.ts`) and located
 * by absolute path below.
 *
 * The two alternatives were both tried and both fail in production:
 *
 * - **The single-file variant**, which embeds the binary in a template literal,
 *   is corrupted by Turbopack's minifier. It rewrites `\x00` to `\0` without
 *   checking the following character, so a zero byte followed by an ASCII `0`
 *   becomes `\00` — a legacy octal escape, illegal in a template literal. The
 *   chunk stops parsing, and only the worker notices, because only the worker
 *   loads it. See the note in the copy script for how that was confirmed.
 * - **Letting the wasmfile variant find its own binary**, which it does with
 *   `new URL('emscripten-module.wasm', import.meta.url)`. `import.meta` is a
 *   syntax error in a classic worker, and a classic worker is exactly what the
 *   bundler emits — the failure above arrived through `importScripts`, which
 *   only classic workers use.
 *
 * An absolute path avoids both: nothing is embedded, and nothing is resolved
 * relative to a module identity the worker does not have.
 */
let modulePromise: Promise<QuickJSWASMModule> | null = null;

/**
 * Node resolves the binary from `node_modules`; the browser fetches ours.
 *
 * Detects Node rather than the absence of `window`, for the same reason
 * `python.ts` does: jsdom defines `window`, so a `typeof window` check sends the
 * test suite down the browser path and it tries to fetch a URL off a server that
 * is not running.
 */
function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

/** Kept in step with `DESTINATION` in scripts/copy-quickjs-wasm.ts. */
const WASM_PATH = '/quickjs/emscripten-module.wasm';

export function getQuickJS(): Promise<QuickJSWASMModule> {
  modulePromise ??= (async () => {
    const [{ QuickJSFFI }, loader] = await Promise.all([
      import('@jitl/quickjs-wasmfile-release-sync/ffi'),
      import('@jitl/quickjs-wasmfile-release-sync/emscripten-module'),
    ]);

    const factory = loader.default;

    return newQuickJSWASMModuleFromVariant({
      type: 'sync',
      importFFI: async () => QuickJSFFI,
      importModuleLoader: async () =>
        /**
         * The factory, pre-bound with where the binary actually is.
         *
         * `locateFile` is emscripten's own hook and takes precedence over its
         * `import.meta.url` resolution, so supplying it is what keeps the
         * classic-worker path off that branch entirely. In Node the default
         * (`prefix + path`) is correct and resolves inside `node_modules`.
         */
        ((options: Record<string, unknown> = {}) =>
          factory({
            ...options,
            locateFile: (path: string, prefix: string) =>
              isNodeRuntime() ? prefix + path : WASM_PATH,
          })) as typeof factory,
    });
  })().catch((error: unknown) => {
    // A failed load is not cached. One dropped request for half a megabyte
    // would otherwise disable the JavaScript runtime for the rest of the
    // session — the same reasoning as `getPyodide`.
    modulePromise = null;
    throw error;
  });

  return modulePromise;
}
