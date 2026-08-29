import { newQuickJSWASMModuleFromVariant, type QuickJSWASMModule } from 'quickjs-emscripten-core';

/**
 * QuickJS module loader.
 *
 * Uses the **single-file** browser variant, which embeds the WebAssembly rather
 * than fetching a sibling `.wasm`. The default `wasmfile` variant has to locate
 * that file at runtime, and its environment detection throws
 * "Classic web workers are not supported" when the bundler emits a classic
 * worker — which Turbopack does in development regardless of `{ type: 'module' }`.
 *
 * Embedding the binary sidesteps the problem rather than fighting the bundler:
 * there is no sibling file to locate, so there is no environment to detect. The
 * cost is a larger module, paid once and cached.
 */
let modulePromise: Promise<QuickJSWASMModule> | null = null;

export function getQuickJS(): Promise<QuickJSWASMModule> {
  modulePromise ??= (async () => {
    const variant = (await import('@jitl/quickjs-singlefile-browser-release-sync')).default;
    return newQuickJSWASMModuleFromVariant(variant);
  })();
  return modulePromise;
}
