'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { LanguageIcon } from '@/components/ui/LanguageIcon';


type Lang = 'TS' | 'Python' | 'Java' | 'C++' | 'Go';

interface StepData {
  array: number[];
  left: number;
  right: number;
  swappingIndices?: [number, number];
  activeLine: number;
  description: string;
}

const STEPS: StepData[] = [
  {
    array: [12, 24, 36, 48, 60],
    left: 0,
    right: 4,
    activeLine: 2,
    description: 'Initialize left pointer at index 0 and right pointer at index 4.',
  },
  {
    array: [12, 24, 36, 48, 60],
    left: 0,
    right: 4,
    activeLine: 3,
    description: 'Evaluate condition: left (0) < right (4) is true. Enter swap loop.',
  },
  {
    array: [60, 24, 36, 48, 12],
    left: 0,
    right: 4,
    swappingIndices: [0, 4],
    activeLine: 4,
    description: 'Physical Swap: 12 and 60 lift from their slots, translate along spatial arcs, and settle into new positions.',
  },
  {
    array: [60, 24, 36, 48, 12],
    left: 1,
    right: 3,
    activeLine: 5,
    description: 'Pointers converge: increment left to index 1, decrement right to index 3.',
  },
  {
    array: [60, 24, 36, 48, 12],
    left: 1,
    right: 3,
    activeLine: 3,
    description: 'Evaluate condition: left (1) < right (3) is true. Continue swap loop.',
  },
  {
    array: [60, 48, 36, 24, 12],
    left: 1,
    right: 3,
    swappingIndices: [1, 3],
    activeLine: 4,
    description: 'Physical Swap: 24 and 48 trade slots in-place without allocating auxiliary memory.',
  },
  {
    array: [60, 48, 36, 24, 12],
    left: 2,
    right: 2,
    activeLine: 5,
    description: 'Pointers converge: increment left to index 2, decrement right to index 2.',
  },
  {
    array: [60, 48, 36, 24, 12],
    left: 2,
    right: 2,
    activeLine: 3,
    description: 'Evaluate condition: left (2) < right (2) is false. Loop terminates.',
  },
  {
    array: [60, 48, 36, 24, 12],
    left: 2,
    right: 2,
    activeLine: 7,
    description: 'In-place array reversal complete. Time: O(N) · Auxiliary Space: O(1).',
  },
];

const CODE_TEMPLATES: Record<
  Lang,
  { line: number; text: { t: 'kw' | 'fn' | 'pl' | 'num' | 'type' | 'cm'; s: string }[] }[]
> = {
  TS: [
    { line: 1, text: [{ t: 'kw', s: 'function ' }, { t: 'fn', s: 'reverseArray' }, { t: 'pl', s: '(arr: ' }, { t: 'type', s: 'number[]' }, { t: 'pl', s: '): ' }, { t: 'type', s: 'void' }, { t: 'pl', s: ' {' }] },
    { line: 2, text: [{ t: 'kw', s: '  let ' }, { t: 'pl', s: 'left = ' }, { t: 'num', s: '0' }, { t: 'pl', s: ', right = arr.length - ' }, { t: 'num', s: '1' }, { t: 'pl', s: ';' }] },
    { line: 3, text: [{ t: 'kw', s: '  while ' }, { t: 'pl', s: '(left < right) {' }] },
    { line: 4, text: [{ t: 'pl', s: '    [arr[left], arr[right]] = [arr[right], arr[left]];' }] },
    { line: 5, text: [{ t: 'pl', s: '    left++; right--;' }] },
    { line: 6, text: [{ t: 'pl', s: '  }' }] },
    { line: 7, text: [{ t: 'pl', s: '}' }] },
  ],
  Python: [
    { line: 1, text: [{ t: 'kw', s: 'def ' }, { t: 'fn', s: 'reverse_array' }, { t: 'pl', s: '(arr: ' }, { t: 'type', s: 'list[int]' }, { t: 'pl', s: ') -> ' }, { t: 'type', s: 'None' }, { t: 'pl', s: ':' }] },
    { line: 2, text: [{ t: 'pl', s: '    left, right = ' }, { t: 'num', s: '0' }, { t: 'pl', s: ', len(arr) - ' }, { t: 'num', s: '1' }] },
    { line: 3, text: [{ t: 'kw', s: '    while ' }, { t: 'pl', s: 'left < right:' }] },
    { line: 4, text: [{ t: 'pl', s: '        arr[left], arr[right] = arr[right], arr[left]' }] },
    { line: 5, text: [{ t: 'pl', s: '        left += ' }, { t: 'num', s: '1' }, { t: 'pl', s: '; right -= ' }, { t: 'num', s: '1' }] },
    { line: 6, text: [{ t: 'pl', s: '    ' }, { t: 'kw', s: 'return ' }, { t: 'pl', s: 'arr' }] },
    { line: 7, text: [{ t: 'cm', s: '    # In-place reversal completed' }] },
  ],
  Java: [
    { line: 1, text: [{ t: 'kw', s: 'public static void ' }, { t: 'fn', s: 'reverse' }, { t: 'pl', s: '(' }, { t: 'type', s: 'int[]' }, { t: 'pl', s: ' arr) {' }] },
    { line: 2, text: [{ t: 'type', s: '    int ' }, { t: 'pl', s: 'left = ' }, { t: 'num', s: '0' }, { t: 'pl', s: ', right = arr.length - ' }, { t: 'num', s: '1' }, { t: 'pl', s: ';' }] },
    { line: 3, text: [{ t: 'kw', s: '    while ' }, { t: 'pl', s: '(left < right) {' }] },
    { line: 4, text: [{ t: 'type', s: '        int ' }, { t: 'pl', s: 'temp = arr[left]; arr[left] = arr[right]; arr[right] = temp;' }] },
    { line: 5, text: [{ t: 'pl', s: '        left++; right--;' }] },
    { line: 6, text: [{ t: 'pl', s: '    }' }] },
    { line: 7, text: [{ t: 'pl', s: '}' }] },
  ],
  'C++': [
    { line: 1, text: [{ t: 'kw', s: 'void ' }, { t: 'fn', s: 'reverseArray' }, { t: 'pl', s: '(vector<' }, { t: 'type', s: 'int' }, { t: 'pl', s: '>& arr) {' }] },
    { line: 2, text: [{ t: 'type', s: '    int ' }, { t: 'pl', s: 'left = ' }, { t: 'num', s: '0' }, { t: 'pl', s: ', right = arr.size() - ' }, { t: 'num', s: '1' }, { t: 'pl', s: ';' }] },
    { line: 3, text: [{ t: 'kw', s: '    while ' }, { t: 'pl', s: '(left < right) {' }] },
    { line: 4, text: [{ t: 'pl', s: '        std::swap(arr[left], arr[right]);' }] },
    { line: 5, text: [{ t: 'pl', s: '        left++; right--;' }] },
    { line: 6, text: [{ t: 'pl', s: '    }' }] },
    { line: 7, text: [{ t: 'pl', s: '}' }] },
  ],
  Go: [
    { line: 1, text: [{ t: 'kw', s: 'func ' }, { t: 'fn', s: 'reverseArray' }, { t: 'pl', s: '(arr []' }, { t: 'type', s: 'int' }, { t: 'pl', s: ') {' }] },
    { line: 2, text: [{ t: 'pl', s: '    left, right := ' }, { t: 'num', s: '0' }, { t: 'pl', s: ', len(arr)-' }, { t: 'num', s: '1' }] },
    { line: 3, text: [{ t: 'kw', s: '    for ' }, { t: 'pl', s: 'left < right {' }] },
    { line: 4, text: [{ t: 'pl', s: '        arr[left], arr[right] = arr[right], arr[left]' }] },
    { line: 5, text: [{ t: 'pl', s: '        left++; right--' }] },
    { line: 6, text: [{ t: 'pl', s: '    }' }] },
    { line: 7, text: [{ t: 'pl', s: '}' }] },
  ],
};

export function LandingDsaVisualizer() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState<Lang>('TS');
  const [, startTransition] = useTransition();

  const currentStep = STEPS[currentStepIndex];



  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      startTransition(() => {
        setCurrentStepIndex((prev) => (prev >= STEPS.length - 1 ? 0 : prev + 1));
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-4">
      {/* Visualizer Shell Container: Clean Crisp White in Light Mode */}
      <div className="overflow-hidden rounded-xl border border-border-strong bg-surface text-foreground shadow-node">
        {/* Window Chrome Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/50 px-4 py-3">
          {/* Left: macOS Dots + Active Algorithm Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-danger/80" />
              <span className="h-3 w-3 rounded-full bg-warning/80" />
              <span className="h-3 w-3 rounded-full bg-success/80" />
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-3">
              <span className="font-mono text-xs font-bold text-foreground">
                Two-Pointer In-Place Reversal
              </span>
              <span className="rounded bg-accent-strong/25 px-2 py-0.5 font-mono text-3xs font-bold text-foreground">
                Array Operation
              </span>
            </div>
          </div>

          {/* Right: Stepper Controls HUD */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
              aria-label="Previous Step"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-all hover:bg-surface-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-bold transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-warning text-black shadow-xs'
                  : 'bg-accent-strong text-accent-foreground shadow-xs'
              }`}
            >
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              type="button"
              disabled={currentStepIndex === STEPS.length - 1}
              onClick={() => setCurrentStepIndex((p) => Math.min(STEPS.length - 1, p + 1))}
              aria-label="Next Step"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-all hover:bg-surface-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              title="Reset Simulation"
              aria-label="Reset Simulation"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-all hover:bg-surface-muted active:scale-95"
            >
              <RotateCcw size={12} />
            </button>

            <span className="ml-1 rounded bg-surface-muted border border-border px-2 py-0.5 font-mono text-3xs text-foreground-muted">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
          </div>
        </div>

        {/* Workbench Body: Synchronized Code (Left) & Physical Spatial Memory (Right) */}
        <div className="grid gap-0 lg:grid-cols-12">
          {/* Synchronized Algorithmic Code Editor Panel */}
          <div className="flex flex-col justify-between border-b border-border p-5 font-mono text-xs lg:col-span-6 lg:border-b-0 lg:border-r bg-surface">
            <div>
              {/* Language Switcher Pills Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider text-foreground-muted">
                  <Terminal size={13} className="text-link" />
                  <span>reverse_array.ts</span>
                </div>

                <div className="flex items-center gap-1">
                  {(['TS', 'Python', 'Java', 'C++', 'Go'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-3xs font-bold transition-colors ${
                        language === lang
                          ? 'bg-accent-strong text-accent-foreground shadow-xs'
                          : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
                      }`}
                    >
                      <LanguageIcon language={lang} size={11} />
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet with Step Indicator */}
              <div className="space-y-1.5 py-4 font-mono text-2xs leading-relaxed sm:text-xs">
                {CODE_TEMPLATES[language].map((lineObj) => {
                  const isCurrent = lineObj.line === currentStep.activeLine;
                  return (
                    <div
                      key={lineObj.line}
                      className={`flex items-center gap-3 rounded px-2 py-0.5 transition-colors ${
                        isCurrent
                          ? 'border-l-2 border-accent-strong bg-accent-strong/15 font-bold text-foreground shadow-xs'
                          : 'text-foreground/80'
                      }`}
                    >
                      <span className="w-4 select-none text-right font-mono text-3xs text-foreground-muted/50">
                        {isCurrent ? '▶' : lineObj.line}
                      </span>
                      <span className="font-mono">
                        {lineObj.text.map((segment, i) => {
                          let colorClass = 'text-foreground';
                          if (segment.t === 'kw') colorClass = 'text-syntax-keyword font-semibold';
                          else if (segment.t === 'type') colorClass = 'text-syntax-function font-semibold';
                          else if (segment.t === 'fn') colorClass = 'text-syntax-function font-bold';
                          else if (segment.t === 'num') colorClass = 'text-syntax-number';
                          else if (segment.t === 'cm') colorClass = 'text-syntax-comment italic';
                          return (
                            <span key={i} className={colorClass}>
                              {segment.s}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Explanation Banner */}
            <div className="rounded-md border border-border bg-surface-muted/50 p-3 text-2xs text-foreground">
              <span className="font-bold text-link">Execution Trace: </span>
              <span className="text-foreground-muted">{currentStep.description}</span>
            </div>
          </div>

          {/* Physical Spatial Memory Canvas */}
          <div className="flex flex-col justify-between p-5 lg:col-span-6 bg-surface-muted/20">
            {/* Canvas Header info */}
            <div className="flex items-center justify-between border-b border-border pb-3 text-3xs text-foreground-muted font-mono">
              <span>Array Memory Buffer · 5 contiguous slots</span>
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 size={11} />
                <span>Zero Latency WASM</span>
              </span>
            </div>

            {/* Elements Display in Physical Space */}
            <div className="flex flex-col items-center justify-center py-10">
              <div className="flex items-end gap-3 sm:gap-4 flex-wrap justify-center min-h-28">
                {currentStep.array.map((val, idx) => {
                  const isLeft = idx === currentStep.left;
                  const isRight = idx === currentStep.right;
                  const isSwapping =
                    currentStep.swappingIndices &&
                    (currentStep.swappingIndices[0] === idx || currentStep.swappingIndices[1] === idx);

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2.5">
                        <span className="font-mono text-4xs text-foreground-muted/70">{idx}</span>
                        <div
                        key={val}
                        className={`flex h-13 w-13 sm:h-15 sm:w-15 items-center justify-center rounded-lg border-2 font-mono text-base font-bold shadow-sm transition-all duration-300 ease-out ${
                          isSwapping
                            ? 'border-accent-strong bg-accent-strong text-accent-foreground ring-4 ring-accent-strong/30 scale-105'
                            : isLeft || isRight
                              ? 'border-link bg-surface text-foreground ring-2 ring-link/30'
                              : 'border-border-strong bg-surface text-foreground'
                        }`}
                      >
                        {val}
                      </div>

                      {/* Pointer Badges */}
                      <div className="flex flex-col items-center min-h-5">
                        {isLeft && isRight ? (
                          <span className="rounded bg-accent-strong px-1.5 py-0.5 font-mono text-3xs font-bold text-accent-foreground">
                            ▲ left &amp; right
                          </span>
                        ) : isLeft ? (
                          <span className="rounded bg-link px-1.5 py-0.5 font-mono text-3xs font-bold text-alt-foreground">
                            ▲ left
                          </span>
                        ) : isRight ? (
                          <span className="rounded bg-warning px-1.5 py-0.5 font-mono text-3xs font-bold text-alt-foreground">
                            ▲ right
                          </span>
                        ) : (
                          <span className="h-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Complexity HUD */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-3xs text-foreground-muted font-mono">
              <div className="flex items-center gap-4">
                <span>
                  Time: <strong className="text-foreground">O(N)</strong>
                </span>
                <span>
                  Auxiliary Space: <strong className="text-foreground">O(1) In-Place</strong>
                </span>
              </div>
              <span className="rounded bg-surface px-2 py-0.5 text-link font-semibold border border-border">
                Pointer Convergence: left &lt; right
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enticing Link to Explore Full Data Structure Workbench */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-muted/40 p-3 px-4 text-xs">
        <span className="text-foreground-muted">
          Visualize 8 core data structures (Arrays, Linked Lists, Stacks, Queues, Binary Trees, BSTs, Heaps, and Hash Maps) with full step-by-step controls.
        </span>
        <Link
          href="/learn/visualizer"
          className="node-surface node-interactive node-pressable inline-flex items-center gap-1.5 bg-accent-strong px-3 py-1.5 text-xs font-bold text-accent-foreground"
        >
          <span>Open Full Visualizer</span>
          <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
