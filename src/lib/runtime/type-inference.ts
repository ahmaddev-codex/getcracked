import type { TestSpec } from '@/content/schema';

/**
 * Infer TypeScript type notation from runtime values.
 */
export function inferTypeFromValue(val: unknown): string {
  if (val === null || val === undefined) return 'any';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'number[]';
    const inner = inferTypeFromValue(val[0]);
    return `${inner}[]`;
  }
  if (typeof val === 'object') {
    return 'Record<string, unknown>';
  }
  return 'any';
}

/**
 * Converts untyped JavaScript starter code into statically-typed TypeScript.
 *
 * Example:
 *   Input:  function twoSum(nums, target) { return []; }
 *   Args:   [[2, 7, 11, 15], 9] -> Expected: [0, 1]
 *   Output: function twoSum(nums: number[], target: number): number[] { return []; }
 */
export function convertJsToTypeScript(jsCode: string, spec?: TestSpec): string {
  if (!jsCode) return '';

  const sampleCase = spec?.cases?.find((c) => c.args && c.expected !== undefined) ?? spec?.cases?.[0];
  const sampleArgs = sampleCase?.args ?? [];
  const sampleExpected = sampleCase?.expected;

  // Match: function name(param1, param2) {
  const fnMatch = jsCode.match(/function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{/);
  if (fnMatch) {
    const fnName = fnMatch[1];
    const rawParams = fnMatch[2].split(',').map((p) => p.trim()).filter(Boolean);

    const typedParams = rawParams.map((paramName, idx) => {
      const inferred = sampleArgs[idx] !== undefined ? inferTypeFromValue(sampleArgs[idx]) : 'any';
      return `${paramName}: ${inferred}`;
    });

    const returnType = sampleExpected !== undefined ? inferTypeFromValue(sampleExpected) : 'any';
    const signature = `function ${fnName}(${typedParams.join(', ')}): ${returnType} {`;

    return jsCode.replace(fnMatch[0], signature);
  }

  // Match arrow function: const name = (param1, param2) => {
  const arrowMatch = jsCode.match(/const\s+([a-zA-Z0-9_$]+)\s*=\s*\(([^)]*)\)\s*=>/);
  if (arrowMatch) {
    const fnName = arrowMatch[1];
    const rawParams = arrowMatch[2].split(',').map((p) => p.trim()).filter(Boolean);

    const typedParams = rawParams.map((paramName, idx) => {
      const inferred = sampleArgs[idx] !== undefined ? inferTypeFromValue(sampleArgs[idx]) : 'any';
      return `${paramName}: ${inferred}`;
    });

    const returnType = sampleExpected !== undefined ? inferTypeFromValue(sampleExpected) : 'any';
    const signature = `const ${fnName} = (${typedParams.join(', ')}): ${returnType} =>`;

    return jsCode.replace(arrowMatch[0], signature);
  }

  return jsCode;
}
