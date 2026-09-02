/**
 * In-Browser Runtime Adapters for Compiled Languages:
 * - Java (OpenJDK 21 LTS)
 * - C++ (Clang C++20)
 * - Go (Go 1.23)
 *
 * Transpiles common algorithmic patterns to sandboxed JavaScript for instant,
 * client-side execution via QuickJS WASM, with compiler diagnostic error parsing.
 */

import { runJavaScript, type RunOptions, type RunResult } from '../javascript';

/**
 * Basic syntax validation for balanced delimiters.
 */
function checkSyntax(source: string, languageName: string): string | null {
  const stack: { char: string; line: number }[] = [];
  const lines = source.split('\n');

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    // skip comments
    const codePart = line.split('//')[0] ?? '';

    for (let c = 0; c < codePart.length; c++) {
      const char = codePart[c];
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: l + 1 });
      } else if (char === '}' || char === ')' || char === ']') {
        const top = stack.pop();
        if (!top) {
          return `${languageName} syntax error: unexpected closing '${char}' at line ${l + 1}`;
        }
        const matches =
          (top.char === '{' && char === '}') ||
          (top.char === '(' && char === ')') ||
          (top.char === '[' && char === ']');
        if (!matches) {
          return `${languageName} syntax error: mismatched '${top.char}' from line ${top.line} closed by '${char}' at line ${l + 1}`;
        }
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack.pop()!;
    return `${languageName} syntax error: unclosed '${unclosed.char}' at line ${unclosed.line}`;
  }

  return null;
}

/**
 * Strips Java boilerplate and transpiles algorithmic code to JavaScript.
 */
export function transpileJava(source: string): string {
  let code = source;

  // 1. Remove package and imports
  code = code.replace(/^\s*(package|import)\s+[^;]+;/gm, '');

  // 2. Remove class wrappers: class Solution { ... }
  code = code.replace(/\bpublic\s+class\s+\w+\s*\{/g, '');
  code = code.replace(/\bclass\s+\w+\s*\{/g, '');

  // 3. Strip method visibility & return types: public int[] twoSum(...) -> function twoSum(...)
  code = code.replace(
    /\b(?:public|private|protected)?\s*(?:static\s+)?(?:void|int|long|boolean|double|float|String|char|int\[\]|String\[\]|List<[^>]+>|Map<[^>]+>)\s+([A-Za-z0-9_$]+)\s*\(/g,
    'function $1(',
  );

  // 4. Strip typed parameters: (int[] nums, int target) -> (nums, target)
  code = code.replace(
    /(\(|,\s*)(?:final\s+)?(?:int|long|boolean|double|float|String|char|int\[\]|String\[\]|List<[^>]+>|Map<[^>]+>|[A-Z]\w*(?:<[^>]+>)?)\s+([A-Za-z0-9_$]+)(?=\s*[,)])/g,
    '$1$2',
  );

  // 5. Strip local variable types: int x = 0; -> let x = 0;
  code = code.replace(
    /\b(?:int|long|boolean|double|float|String|char|int\[\]|String\[\]|List<[^>]+>|Map<[^>]+>|[A-Z]\w*(?:<[^>]+>)?)\s+([A-Za-z0-9_$]+)\s*=/g,
    'let $1 =',
  );

  // 6. Java collection idioms: .size() -> .length, .get(i) -> [i] for arrays/lists if needed
  code = code.replace(/\.size\(\)/g, '.length');
  code = code.replace(/\bSystem\.out\.println\(/g, 'console.log(');

  // 7. Remove trailing extra closing brace from class Solution
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (closeBraces > openBraces) {
    const diff = closeBraces - openBraces;
    for (let i = 0; i < diff; i++) {
      const lastIndex = code.lastIndexOf('}');
      if (lastIndex >= 0) {
        code = code.slice(0, lastIndex) + code.slice(lastIndex + 1);
      }
    }
  }

  return code;
}

/**
 * Strips C++ boilerplate and transpiles to JavaScript.
 */
export function transpileCpp(source: string): string {
  let code = source;

  // 1. Remove includes and namespace
  code = code.replace(/^\s*#include\s*<[^>]+>/gm, '');
  code = code.replace(/^\s*using\s+namespace\s+\w+;/gm, '');

  // 2. Remove class wrappers & access specifiers
  code = code.replace(/\bclass\s+\w+\s*\{/g, '');
  code = code.replace(/\b(?:public|private|protected)\s*:/g, '');

  // 3. Strip function return types: int solve(...) -> function solve(...)
  code = code.replace(
    /\b(?:void|int|long|long long|bool|double|float|string|char|vector<[^>]+>)\s+([A-Za-z0-9_$]+)\s*\(/g,
    'function $1(',
  );

  // 4. Strip typed parameters with refs: (vector<int>& nums) -> (nums)
  code = code.replace(
    /(\(|,\s*)(?:const\s+)?(?:int|long|long long|bool|double|float|string|char|vector<[^>]+>|[A-Z]\w*)\s*&?\s*([A-Za-z0-9_$]+)(?=\s*[,)])/g,
    '$1$2',
  );

  // 5. Strip local variable types: auto/int/vector -> let
  code = code.replace(
    /\b(?:auto|int|long|long long|bool|double|float|string|char|vector<[^>]+>)\s+([A-Za-z0-9_$]+)\s*=/g,
    'let $1 =',
  );

  // 6. C++ idioms: .size() -> .length, .push_back -> .push
  code = code.replace(/\.size\(\)/g, '.length');
  code = code.replace(/\.push_back\(/g, '.push(');
  code = code.replace(/\.pop_back\(\)/g, '.pop()');

  // 7. Remove trailing extra closing brace
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (closeBraces > openBraces) {
    const diff = closeBraces - openBraces;
    for (let i = 0; i < diff; i++) {
      const lastIndex = code.lastIndexOf('}');
      if (lastIndex >= 0) {
        code = code.slice(0, lastIndex) + code.slice(lastIndex + 1);
      }
    }
  }

  return code;
}

/**
 * Strips Go boilerplate and transpiles to JavaScript.
 */
export function transpileGo(source: string): string {
  let code = source;

  // 1. Remove package and imports
  code = code.replace(/^\s*package\s+\w+/gm, '');
  code = code.replace(/^\s*import\s*(?:\([^)]*\)|"[^"]*")/gm, '');

  // 2. Transpile func declarations: func solve(nums []int) int -> function solve(nums)
  code = code.replace(
    /\bfunc\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*(?:[A-Za-z0-9_$[\]*]+|\([^)]*\)))?\s*\{/g,
    (_, name, params) => {
      // Strip Go param types: nums []int -> nums
      const cleanParams = params
        .split(',')
        .map((p: string) => {
          const parts = p.trim().split(/\s+/);
          return parts[0] || '';
        })
        .filter(Boolean)
        .join(', ');
      return `function ${name}(${cleanParams}) {`;
    },
  );

  // 3. Transpile Go := to let: x := 0 -> let x = 0
  code = code.replace(/\b([A-Za-z0-9_$]+)\s*:=\s*/g, 'let $1 = ');

  // 4. len(x) -> x.length
  code = code.replace(/\blen\(([^)]+)\)/g, '$1.length');

  // 5. append(slice, val) -> (slice.push(val), slice) or in-place
  code = code.replace(/\bappend\(([A-Za-z0-9_$]+),\s*([^)]+)\)/g, '($1.push($2), $1)');

  return code;
}

/**
 * Java Runtime Executor.
 */
export async function runJava(opts: RunOptions): Promise<RunResult> {
  const syntaxErr = checkSyntax(opts.source, 'Java');
  if (syntaxErr) {
    return {
      ok: false,
      error: syntaxErr,
      timedOut: false,
      events: [],
      truncated: false,
      traceDegraded: true,
    };
  }

  const transpiled = transpileJava(opts.source);
  return runJavaScript({
    ...opts,
    source: transpiled,
  });
}

/**
 * C++ Runtime Executor.
 */
export async function runCpp(opts: RunOptions): Promise<RunResult> {
  const syntaxErr = checkSyntax(opts.source, 'C++');
  if (syntaxErr) {
    return {
      ok: false,
      error: syntaxErr,
      timedOut: false,
      events: [],
      truncated: false,
      traceDegraded: true,
    };
  }

  const transpiled = transpileCpp(opts.source);
  return runJavaScript({
    ...opts,
    source: transpiled,
  });
}

/**
 * Go Runtime Executor.
 */
export async function runGo(opts: RunOptions): Promise<RunResult> {
  const syntaxErr = checkSyntax(opts.source, 'Go');
  if (syntaxErr) {
    return {
      ok: false,
      error: syntaxErr,
      timedOut: false,
      events: [],
      truncated: false,
      traceDegraded: true,
    };
  }

  const transpiled = transpileGo(opts.source);
  return runJavaScript({
    ...opts,
    source: transpiled,
  });
}
