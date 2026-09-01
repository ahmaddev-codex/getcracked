'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import {
  DATA_STRUCTURE_REGISTRY,
  type DataStructureType,
  type ListNodeState,
  type TreeNode,
  type HashBucketEntry,
  simulateArray,
  simulateLinkedList,
  simulateStack,
  simulateQueue,
  simulateBST,
  simulateHeap,
  simulateHashMap,
} from '@/lib/visualizer/data-structures';

export function DataStructureWorkbench() {
  const [selectedType, setSelectedType] = useState<DataStructureType>('array');
  const currentMeta = useMemo(
    () => DATA_STRUCTURE_REGISTRY.find((d) => d.id === selectedType)!,
    [selectedType],
  );

  const [selectedOp, setSelectedOp] = useState<string>(() => currentMeta.operations[0]);
  const [prevType, setPrevType] = useState<DataStructureType>(selectedType);

  // Synchronize operation on data structure switch during render
  if (selectedType !== prevType) {
    setPrevType(selectedType);
    setSelectedOp(currentMeta.operations[0]);
  }

  const [inputValue, setInputValue] = useState<number>(42);
  const [inputIndex, setInputIndex] = useState<number>(2);
  const [inputKey, setInputKey] = useState<string>('userId');
  const [inputValStr, setInputValStr] = useState<string>('alice');

  // Base data states
  const [arrayState] = useState<number[]>([10, 20, 30, 40, 50]);
  const [llState] = useState<number[]>([10, 20, 30, 40]);
  const [stackState] = useState<number[]>([10, 20, 30]);
  const [queueState] = useState<number[]>([10, 20, 30]);
  const [bstState] = useState<number[]>([30, 15, 45, 10, 20, 40, 50]);
  const [heapState] = useState<number[]>([10, 25, 15, 40, 35, 20]);
  const [mapState] = useState<Array<HashBucketEntry[]>>(() =>
    Array.from({ length: 8 }, (_, i) =>
      i === 2
        ? [{ key: 'userId', value: '1001' }]
        : i === 5
          ? [{ key: 'role', value: 'admin' }]
          : [],
    ),
  );

  // Stepper state
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute steps reactively with useMemo
  const steps = useMemo(() => {
    if (selectedType === 'array') {
      return simulateArray(arrayState, selectedOp, {
        value: inputValue,
        index: inputIndex,
      });
    }
    if (selectedType === 'linked-list') {
      return simulateLinkedList(llState, selectedOp, {
        value: inputValue,
      });
    }
    if (selectedType === 'stack') {
      return simulateStack(stackState, selectedOp, {
        value: inputValue,
      });
    }
    if (selectedType === 'queue') {
      return simulateQueue(queueState, selectedOp, {
        value: inputValue,
      });
    }
    if (selectedType === 'binary-search-tree') {
      return simulateBST(bstState, selectedOp, {
        value: inputValue,
      });
    }
    if (selectedType === 'min-heap') {
      return simulateHeap(heapState, selectedOp, {
        value: inputValue,
      });
    }
    if (selectedType === 'hash-map') {
      return simulateHashMap(mapState, selectedOp, {
        key: inputKey,
        value: inputValStr,
      });
    }
    return [];
  }, [
    selectedType,
    selectedOp,
    inputValue,
    inputIndex,
    inputKey,
    inputValStr,
    arrayState,
    llState,
    stackState,
    queueState,
    bstState,
    heapState,
    mapState,
  ]);

  // Safe bounded step index
  const safeStepIdx = Math.min(currentStepIdx, Math.max(0, steps.length - 1));

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          setIsPlaying(false);
          return prev;
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length, speed]);

  const currentStep = steps[safeStepIdx] || steps[0];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Structure Selector */}
      <section aria-label="Data Structure selector" className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Select Data Structure
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {DATA_STRUCTURE_REGISTRY.map((ds) => {
            const isSelected = ds.id === selectedType;
            return (
              <Button
                key={ds.id}
                tone={isSelected ? 'strong' : 'surface'}
                onClick={() => {
                  setSelectedType(ds.id);
                  setCurrentStepIdx(0);
                  setIsPlaying(false);
                }}
                className="flex h-full flex-col items-center justify-center p-2.5 text-center text-xs font-semibold"
              >
                <span>{ds.name}</span>
              </Button>
            );
          })}
        </div>
      </section>

      {/* 2. Operations & Parameter Inputs */}
      <Node tone="surface" className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold sm:text-lg">{currentMeta.name}</h2>
            <p className="text-xs text-foreground-muted">{currentMeta.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              tone="strong"
              onClick={() => {
                setCurrentStepIdx(0);
                setIsPlaying(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            >
              <Play size={13} fill="currentColor" aria-hidden />
              <span>Animate Steps</span>
            </Button>
          </div>
        </div>

        {/* Operation Pills & Param Inputs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-foreground-muted">Operation:</span>
            {currentMeta.operations.map((op) => (
              <Button
                key={op}
                tone={selectedOp === op ? 'strong' : 'surface'}
                onClick={() => {
                  setSelectedOp(op);
                  setCurrentStepIdx(0);
                  setIsPlaying(false);
                }}
                className="px-2.5 py-1 text-xs"
              >
                {op}
              </Button>
            ))}
          </div>

          {/* Dynamic parameter inputs */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedType !== 'hash-map' &&
              (selectedOp.includes('Push') ||
                selectedOp.includes('Insert') ||
                selectedOp.includes('Enqueue') ||
                selectedOp.includes('Search')) && (
                <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <span>Value:</span>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(Number(e.target.value));
                      setCurrentStepIdx(0);
                    }}
                    className="w-16 rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
                  />
                </label>
              )}

            {selectedType === 'array' &&
              (selectedOp === 'Insert at Index' || selectedOp === 'Delete at Index') && (
                <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <span>Index:</span>
                  <input
                    type="number"
                    min={0}
                    max={arrayState.length}
                    value={inputIndex}
                    onChange={(e) => {
                      setInputIndex(Number(e.target.value));
                      setCurrentStepIdx(0);
                    }}
                    className="w-14 rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
                  />
                </label>
              )}

            {selectedType === 'hash-map' && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <span>Key:</span>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setCurrentStepIdx(0);
                    }}
                    className="w-20 rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
                  />
                </label>
                {selectedOp === 'Put' && (
                  <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span>Val:</span>
                    <input
                      type="text"
                      value={inputValStr}
                      onChange={(e) => {
                        setInputValStr(e.target.value);
                        setCurrentStepIdx(0);
                      }}
                      className="w-20 rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
                    />
                  </label>
                )}
              </>
            )}
          </div>
        </div>
      </Node>

      {/* 3. Animation Canvas */}
      <Node tone="surface" className="flex flex-col gap-4 p-5 min-h-72 justify-between">
        {/* Canvas Header & Big-O Badge */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Live State Visualization
            </span>
            {currentStep?.complexity && (
              <span className="rounded bg-accent px-2 py-0.5 text-3xs font-bold text-accent-foreground">
                Time: {currentStep.complexity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">
              Step {currentStep ? currentStep.stepIndex : 0} of {steps.length}
            </span>
          </div>
        </div>

        {/* Visual Rendering by Structure Type */}
        <div className="flex flex-1 items-center justify-center py-6 overflow-x-auto">
          {/* ARRAY */}
          {selectedType === 'array' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {((currentStep?.state?.array as number[] | undefined) ?? arrayState).map(
                  (val: number, idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span className="text-3xs text-foreground-muted">[{idx}]</span>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded border-2 font-mono text-sm font-bold transition-all duration-300 ${
                            isHighlighted
                              ? 'border-link bg-accent-strong text-accent-foreground scale-105 shadow-md'
                              : 'border-border-strong bg-surface text-foreground'
                          }`}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Pointers Legend */}
              {currentStep?.pointers && Object.keys(currentStep.pointers).length > 0 && (
                <div className="flex items-center gap-3 text-xs text-foreground-muted">
                  {Object.entries(currentStep.pointers).map(([name, pos]) => (
                    <span key={name} className="flex items-center gap-1 font-mono">
                      <span className="text-link font-bold">{name}</span>: index {pos}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LINKED LIST */}
          {selectedType === 'linked-list' && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {(
                (currentStep?.state?.nodes as ListNodeState[] | undefined) ?? []
              ).map((node: ListNodeState, i: number, allNodes: ListNodeState[]) => {
                const isHighlighted = currentStep?.highlightNodeIds?.includes(node.id);
                return (
                  <div key={node.id} className="flex items-center gap-2">
                    <div
                      className={`flex flex-col items-center rounded border-2 px-3 py-2 font-mono transition-all duration-300 ${
                        isHighlighted
                          ? 'border-link bg-accent-strong text-accent-foreground scale-105 shadow-md'
                          : 'border-border-strong bg-surface text-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold">{node.value}</span>
                      <span className="text-3xs opacity-60">next &rarr;</span>
                    </div>
                    {i < allNodes.length - 1 ? (
                      <ArrowRight size={16} className="text-foreground-muted" />
                    ) : (
                      <span className="font-mono text-xs text-foreground-muted">null</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STACK */}
          {selectedType === 'stack' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xs text-foreground-muted">&darr; Top of Stack &darr;</span>
              <div className="flex flex-col-reverse items-center gap-1.5 w-32 border-b-4 border-l-2 border-r-2 border-border-strong p-2 min-h-36 justify-start bg-surface-muted/30 rounded-b">
                {((currentStep?.state?.items as number[] | undefined) ?? stackState).map(
                  (item: number, idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex w-full items-center justify-center rounded border-2 py-2 font-mono text-xs font-bold transition-all ${
                          isHighlighted
                            ? 'border-link bg-accent-strong text-accent-foreground scale-105'
                            : 'border-border-strong bg-surface text-foreground'
                        }`}
                      >
                        {item}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* QUEUE */}
          {selectedType === 'queue' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 border-t-2 border-b-2 border-border-strong px-4 py-3 bg-surface-muted/30">
                <span className="text-3xs font-semibold text-link mr-2">&larr; Front (Dequeue)</span>
                {((currentStep?.state?.items as number[] | undefined) ?? queueState).map(
                  (item: number, idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex h-11 w-11 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all ${
                          isHighlighted
                            ? 'border-link bg-accent-strong text-accent-foreground scale-105'
                            : 'border-border-strong bg-surface text-foreground'
                        }`}
                      >
                        {item}
                      </div>
                    );
                  },
                )}
                <span className="text-3xs font-semibold text-warning ml-2">&larr; Rear (Enqueue)</span>
              </div>
            </div>
          )}

          {/* BST */}
          {selectedType === 'binary-search-tree' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg">
                {Object.values(
                  (currentStep?.state?.nodes as Record<string, TreeNode> | undefined) ?? {},
                ).map((node: TreeNode) => {
                  const isHighlighted = currentStep?.highlightNodeIds?.includes(node.id);
                  return (
                    <div
                      key={node.id}
                      className={`flex flex-col items-center rounded-full border-2 h-12 w-12 justify-center font-mono text-xs font-bold transition-all ${
                        isHighlighted
                          ? 'border-link bg-accent-strong text-accent-foreground scale-110 shadow-lg'
                          : 'border-border-strong bg-surface text-foreground'
                      }`}
                    >
                      <span>{node.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MIN HEAP */}
          {selectedType === 'min-heap' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {((currentStep?.state?.heap as number[] | undefined) ?? heapState).map(
                  (val: number, idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span className="text-3xs text-foreground-muted">[{idx}]</span>
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all ${
                            isHighlighted
                              ? 'border-link bg-accent-strong text-accent-foreground scale-105'
                              : 'border-border-strong bg-surface text-foreground'
                          }`}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* HASH MAP */}
          {selectedType === 'hash-map' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 w-full max-w-2xl">
              {(
                (currentStep?.state?.buckets as Array<HashBucketEntry[]> | undefined) ?? mapState
              ).map((bucket: HashBucketEntry[], idx: number) => {
                const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col rounded border p-2 text-xs transition-all ${
                      isHighlighted
                        ? 'border-link bg-accent-strong/30'
                        : 'border-border-subtle bg-surface'
                    }`}
                  >
                    <span className="text-3xs font-mono text-foreground-muted">Bucket [{idx}]</span>
                    {bucket.length === 0 ? (
                      <span className="text-3xs text-foreground-muted italic pt-1">empty</span>
                    ) : (
                      <div className="flex flex-col gap-1 pt-1">
                        {bucket.map((entry: HashBucketEntry, eIdx: number) => (
                          <div
                            key={eIdx}
                            className="rounded bg-accent/40 px-1.5 py-0.5 font-mono text-3xs font-medium"
                          >
                            {entry.key}: {entry.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Explanations & Code Box */}
        {currentStep && (
          <div className="flex flex-col gap-2 rounded bg-surface-muted/50 p-3 border border-border-subtle">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">{currentStep.title}</span>
              <span className="font-mono text-3xs text-foreground-muted">
                Action: {currentStep.actionType}
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {currentStep.description}
            </p>
            {currentStep.codeSnippet && (
              <div className="flex items-center gap-2 rounded bg-background px-2.5 py-1.5 font-mono text-3xs text-foreground border border-border-subtle">
                <Code2 size={13} className="text-link shrink-0" />
                <code className="truncate">{currentStep.codeSnippet}</code>
              </div>
            )}
          </div>
        )}

        {/* 4. Playback Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <div className="flex items-center gap-1.5">
            <Button
              tone="surface"
              onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
              disabled={safeStepIdx === 0}
              aria-label="Previous step"
              className="p-1.5"
            >
              <SkipBack size={14} aria-hidden />
            </Button>

            <Button
              tone="strong"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="px-3 py-1.5 text-xs font-bold"
            >
              {isPlaying ? (
                <Pause size={13} fill="currentColor" aria-hidden />
              ) : (
                <Play size={13} fill="currentColor" aria-hidden />
              )}
              <span className="ml-1">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            <Button
              tone="surface"
              onClick={() => setCurrentStepIdx((p) => Math.min(steps.length - 1, p + 1))}
              disabled={safeStepIdx >= steps.length - 1}
              aria-label="Next step"
              className="p-1.5"
            >
              <SkipForward size={14} aria-hidden />
            </Button>

            <Button
              tone="surface"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIdx(0);
              }}
              aria-label="Reset simulation"
              className="p-1.5"
            >
              <RotateCcw size={14} aria-hidden />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">Speed:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              aria-label="Animation speed"
              className="rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value={1500}>0.5x (Slow)</option>
              <option value={1000}>1.0x (Normal)</option>
              <option value={500}>2.0x (Fast)</option>
            </select>
          </div>
        </div>
      </Node>
    </div>
  );
}
