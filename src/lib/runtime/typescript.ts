/**
 * TypeScript In-Browser Runtime Adapter (Language Expansion).
 *
 * Strips TypeScript types while strictly preserving line numbers so that line-level
 * visualizer tracing and editor stepping map 1:1 with the original TypeScript source.
 * Executes the resulting JavaScript in the sandboxed QuickJS runtime.
 */

import { runJavaScript, type RunOptions, type RunResult } from './javascript';

/**
 * Strips TypeScript-specific syntax (types, interfaces, generics, casts) from code
 * while preserving exact line counts and line positions.
 */
export function stripTypeScriptTypes(code: string): string {
  let result = code;

  // 1. Strip multi-line and single-line interface declarations (preserve line count)
  result = result.replace(/\binterface\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*\{[^}]*\}/g, (match) => {
    const lineCount = (match.match(/\n/g) || []).length;
    return '\n'.repeat(lineCount);
  });

  // 2. Strip type alias declarations (e.g. type Foo = ...;)
  result = result.replace(/\btype\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*=[^;]+;/g, (match) => {
    const lineCount = (match.match(/\n/g) || []).length;
    return '\n'.repeat(lineCount);
  });

  // 3. Strip function return type annotations: e.g. `): number[] {` or `): void =>`
  result = result.replace(/\)\s*:\s*[A-Za-z0-9_$[\]<>, |&]+\s*(\{|=>>?)/g, ') $1');

  // 4. Strip variable type annotations: e.g. `let x: number =` or `let x: number;`
  result = result.replace(
    /\b(let|const|var)\s+([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$[\]<>, |&]+(?=\s*=)/g,
    '$1 $2 ',
  );
  result = result.replace(
    /\b(let|const|var)\s+([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$[\]<>, |&]+(?=\s*[;,])/g,
    '$1 $2',
  );

  // 5. Strip parameter type annotations: e.g. `(nums: number[], target: number)`
  result = result.replace(
    /(\(|,\s*)([A-Za-z0-9_$]+)\s*\??\s*:\s*[A-Za-z0-9_$[\]<>, |&]+(?=\s*[,)=])/g,
    '$1$2',
  );

  // 6. Strip `as Type` casts: e.g. `x as number` or `val as unknown[]`
  result = result.replace(/\s+as\s+[A-Za-z0-9_$[\]<>, |&]+/g, '');

  // 7. Strip non-null assertion operators: e.g. `x!` or `arr[i]!`
  result = result.replace(/([A-Za-z0-9_$[\])])!(?=[.\s,);\]}])/g, '$1');

  // 8. Strip generic function calls/declarations: e.g. `<number>` in `solve<number>(...)`
  result = result.replace(/<[A-Za-z0-9_$[\] ,|&]+>(?=\s*\()/g, '');

  return result;
}

/**
 * Executes TypeScript source code by transpiling/stripping types and running
 * via the QuickJS JavaScript engine.
 */
export async function runTypeScript(opts: RunOptions): Promise<RunResult> {
  const strippedSource = stripTypeScriptTypes(opts.source);

  const strippedModules = opts.modules
    ? opts.modules.map((m) => ({
        name: m.name,
        source: stripTypeScriptTypes(m.source),
      }))
    : undefined;

  return runJavaScript({
    ...opts,
    source: strippedSource,
    modules: strippedModules,
  });
}
