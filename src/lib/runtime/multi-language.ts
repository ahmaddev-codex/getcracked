import type { UnifiedExecutionTrace } from '@/lib/trace/unified-ir';
import { TraceIRBuilder } from '@/lib/trace/unified-ir';

export type SupportedLanguageId =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'cpp'
  | 'go';

export interface LanguageProfile {
  id: SupportedLanguageId;
  name: string;
  version: string;
  tier: 'tier1-native' | 'tier2-isolated' | 'tier3-experimental';
  wasmSupported: boolean;
  fileExtension: string;
  monacoLanguage: string;
  defaultStarterTemplate: string;
}

export const LANGUAGE_PROFILES: Record<SupportedLanguageId, LanguageProfile> = {
  python: {
    id: 'python',
    name: 'Python 3.12',
    version: '3.12.7 (Pyodide WASM)',
    tier: 'tier1-native',
    wasmSupported: true,
    fileExtension: '.py',
    monacoLanguage: 'python',
    defaultStarterTemplate: 'def solve(nums):\n    # Write your solution here\n    pass\n',
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    version: 'ES2024 (QuickJS WASM)',
    tier: 'tier1-native',
    wasmSupported: true,
    fileExtension: '.js',
    monacoLanguage: 'javascript',
    defaultStarterTemplate: 'function solve(nums) {\n  // Write your solution here\n}\n',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    version: '5.6 (Transpiled via QuickJS)',
    tier: 'tier1-native',
    wasmSupported: true,
    fileExtension: '.ts',
    monacoLanguage: 'typescript',
    defaultStarterTemplate: 'function solve(nums: number[]): number {\n  // Write your solution here\n  return 0;\n}\n',
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK)',
    version: '21 LTS (Isolated Worker)',
    tier: 'tier2-isolated',
    wasmSupported: false,
    fileExtension: '.java',
    monacoLanguage: 'java',
    defaultStarterTemplate: 'class Solution {\n    public int solve(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (Clang)',
    version: 'C++20 (Clang WASM)',
    tier: 'tier2-isolated',
    wasmSupported: true,
    fileExtension: '.cpp',
    monacoLanguage: 'cpp',
    defaultStarterTemplate: '#include <vector>\n\nclass Solution {\npublic:\n    int solve(std::vector<int>& nums) {\n        return 0;\n    }\n};\n',
  },
  go: {
    id: 'go',
    name: 'Go',
    version: '1.23 (WASM)',
    tier: 'tier2-isolated',
    wasmSupported: true,
    fileExtension: '.go',
    monacoLanguage: 'go',
    defaultStarterTemplate: 'package main\n\nfunc solve(nums []int) int {\n    return 0\n}\n',
  },
};

export function getLanguageProfile(id: SupportedLanguageId): LanguageProfile {
  return LANGUAGE_PROFILES[id];
}

export function getAllLanguageProfiles(): LanguageProfile[] {
  return Object.values(LANGUAGE_PROFILES);
}

/**
 * Normalizes any language execution output into the standard Unified IR format.
 */
export function createMockExecutionTrace(
  language: SupportedLanguageId,
  steps: number,
  arraySnapshot?: number[],
): UnifiedExecutionTrace {
  const builder = new TraceIRBuilder(language);

  if (arraySnapshot) {
    builder.declareCollection({
      id: 'arr-1',
      name: 'nums',
      kind: 'array',
      initialElements: arraySnapshot,
      indexedBy: ['i', 'j'],
    });
  }

  for (let step = 1; step <= steps; step++) {
    builder.emitLine(step, { i: step - 1 });
    if (arraySnapshot && step - 1 < arraySnapshot.length) {
      builder.emitArrayRead('nums', step - 1, arraySnapshot[step - 1] ?? 0);
      builder.emitPointerMove('i', step - 1, 'nums', 'current index');
    }
  }

  builder.emitReturn(arraySnapshot ? arraySnapshot.length : steps);
  return builder.build();
}
