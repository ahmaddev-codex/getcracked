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
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import {
  DATA_STRUCTURE_REGISTRY,
  type DataStructureType,
  type ListNodeState,
  type TreeNode,
  type HashBucketEntry,
  type GraphVertex,
  type GraphEdge,
  simulateArray,
  simulateLinkedList,
  simulateStack,
  simulateQueue,
  simulateBST,
  simulateHeap,
  simulateHashMap,
  simulateGraph,
} from '@/lib/visualizer/data-structures';
import {
  getCodeSnippet,
  SUPPORTED_CODE_LANGUAGES,
  type AlgorithmicLanguage,
} from '@/lib/visualizer/code-snippets';
import { LanguageIcon } from '@/components/ui/LanguageIcon';

export function DataStructureWorkbench() {
  const [selectedType, setSelectedType] = useState<DataStructureType>('array');
  const [codeLang, setCodeLang] = useState<AlgorithmicLanguage>('typescript');
  const currentMeta = useMemo(
    () => DATA_STRUCTURE_REGISTRY.find((d) => d.id === selectedType)!,
    [selectedType],
  );

  const [selectedSubType, setSelectedSubType] = useState<string>(() => currentMeta.subTypes[0].id);
  const [selectedOp, setSelectedOp] = useState<string>(() => currentMeta.operations[0]);
  const [prevType, setPrevType] = useState<DataStructureType>(selectedType);

  // Synchronize operation & subtype on data structure switch during render
  if (selectedType !== prevType) {
    setPrevType(selectedType);
    setSelectedSubType(currentMeta.subTypes[0].id);
    setSelectedOp(currentMeta.operations[0]);
  }

  const [inputValue, setInputValue] = useState<number>(42);
  const [inputIndex, setInputIndex] = useState<number>(2);
  const [inputKey, setInputKey] = useState<string>('userId');
  const [inputValStr, setInputValStr] = useState<string>('alice');
  const [graphStart, setGraphStart] = useState<string>('A');

  // Base state models
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
  const [speed, setSpeed] = useState<number>(900);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute simulation steps reactively with useMemo
  const steps = useMemo(() => {
    if (selectedType === 'array') {
      return simulateArray(arrayState, selectedOp, {
        value: inputValue,
        index: inputIndex,
      });
    }
    if (selectedType === 'linked-list') {
      const isDoubly = selectedSubType === 'doubly';
      const isCircular = selectedSubType === 'circular';
      return simulateLinkedList(
        llState,
        selectedOp,
        { value: inputValue, index: inputIndex },
        isDoubly,
        isCircular,
      );
    }
    if (selectedType === 'stack') {
      return simulateStack(stackState, selectedOp, { value: inputValue });
    }
    if (selectedType === 'queue') {
      return simulateQueue(queueState, selectedOp, { value: inputValue });
    }
    if (selectedType === 'binary-search-tree') {
      return simulateBST(bstState, selectedOp, { value: inputValue });
    }
    if (selectedType === 'min-heap') {
      return simulateHeap(heapState, selectedOp, { value: inputValue });
    }
    if (selectedType === 'hash-map') {
      return simulateHashMap(mapState, selectedOp, { key: inputKey, value: inputValStr });
    }
    if (selectedType === 'graph') {
      return simulateGraph(selectedOp, { startVertex: graphStart });
    }
    return [];
  }, [
    selectedType,
    selectedSubType,
    selectedOp,
    inputValue,
    inputIndex,
    inputKey,
    inputValStr,
    graphStart,
    arrayState,
    llState,
    stackState,
    queueState,
    bstState,
    heapState,
    mapState,
  ]);

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
  const currentArray = (currentStep?.state?.array as number[] | undefined) ?? arrayState;
  const currentHeap = (currentStep?.state?.heap as number[] | undefined) ?? heapState;

  const activeCodeSnippet =
    getCodeSnippet(selectedType, selectedOp, codeLang) ||
    currentMeta.codeSnippets[selectedOp] ||
    currentStep?.codeSnippet ||
    '';

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

      {/* 2. Operations, Subtype & Parameter Bar */}
      <Node tone="surface" className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold sm:text-lg">{currentMeta.name}</h2>
              <span className="rounded bg-accent/60 px-2 py-0.5 text-3xs font-semibold text-accent-foreground">
                {currentMeta.category}
              </span>
            </div>
            <p className="text-xs text-foreground-muted">{currentMeta.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              tone="strong"
              onClick={() => {
                setCurrentStepIdx(0);
                setIsPlaying(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-xs"
            >
              <Play size={13} fill="currentColor" aria-hidden />
              <span>Animate Simulation</span>
            </Button>
          </div>
        </div>

        {/* Subtype Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-3">
          <span className="text-xs font-medium text-foreground-muted">Variant / Subtype:</span>
          {currentMeta.subTypes.map((sub) => (
            <Button
              key={sub.id}
              tone={selectedSubType === sub.id ? 'strong' : 'surface'}
              onClick={() => {
                setSelectedSubType(sub.id);
                setCurrentStepIdx(0);
                setIsPlaying(false);
              }}
              className="px-2.5 py-1 text-xs"
            >
              <span>{sub.name}</span>
            </Button>
          ))}
        </div>

        {/* Operation Pills & Param Inputs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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
              selectedType !== 'graph' &&
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

            {selectedType === 'array' && selectedOp.includes('Index') && (
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
                {selectedOp.includes('Put') && (
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

            {selectedType === 'graph' && (
              <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span>Start Vertex:</span>
                <select
                  value={graphStart}
                  onChange={(e) => {
                    setGraphStart(e.target.value);
                    setCurrentStepIdx(0);
                  }}
                  className="rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="A">Vertex A</option>
                  <option value="B">Vertex B</option>
                  <option value="C">Vertex C</option>
                  <option value="D">Vertex D</option>
                  <option value="E">Vertex E</option>
                </select>
              </label>
            )}
          </div>
        </div>
      </Node>

      {/* 3. Side-by-Side Main Canvas & Code Execution Stage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visualizer Canvas (6 cols on lg) */}
        <Node
          tone="surface"
          className="flex flex-col gap-4 p-5 min-h-80 justify-between lg:col-span-6 xl:col-span-6"
        >
          {/* Visual Canvas by Structure */}
          <div className="flex flex-1 items-center justify-center py-6 overflow-x-auto min-h-64">
            {/* ARRAY */}
            {selectedType === 'array' && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-end gap-2.5 flex-wrap justify-center min-h-24">
                  {currentArray.map((val: number, idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    const isSwapping =
                      currentStep?.motion?.type === 'swap' &&
                      (currentStep.motion.fromIndex === idx || currentStep.motion.toIndex === idx);

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2.5">
                        <span className="font-mono text-4xs text-foreground-muted/70">{idx}</span>
                        <div
                          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-all duration-300 ease-out ${
                            isSwapping
                              ? 'border-link bg-accent-strong text-accent-foreground shadow-xl -translate-y-2 scale-105'
                              : isHighlighted
                                ? 'border-link bg-accent-strong text-accent-foreground shadow-md -translate-y-1.5 scale-105'
                                : 'border-border-strong bg-surface text-foreground'
                          }`}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pointers Legend */}
                {currentStep?.pointers && Object.keys(currentStep.pointers).length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    {Object.entries(currentStep.pointers).map(([name, pos]) => (
                      <span
                        key={name}
                        className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-3xs border border-border-subtle"
                      >
                        <span className="font-bold text-link">{name}</span> &rarr; index {pos}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LINKED LIST (SINGLY, DOUBLY, CIRCULAR) */}
            {selectedType === 'linked-list' && (() => {
              const nodes = (currentStep?.state?.nodes as ListNodeState[] | undefined) ?? [];
              const isDoubly = Boolean(currentStep?.state?.isDoubly ?? (selectedSubType === 'doubly'));
              const isCircular = Boolean(currentStep?.state?.isCircular ?? (selectedSubType === 'circular'));

              return (
                <div className="flex flex-col items-center gap-6 w-full py-4">
                  <div className="relative flex items-center gap-2 flex-wrap justify-center max-w-full px-4">
                    {/* Doubly Linked List Head NULL */}
                    {isDoubly && !isCircular && (
                      <div className="flex items-center gap-1 text-xs font-mono text-foreground-muted">
                        <span>null</span>
                        <ArrowRight size={16} className="rotate-180 text-foreground-muted" />
                      </div>
                    )}

                    {nodes.map((node: ListNodeState, i: number) => {
                      const isHighlighted = currentStep?.highlightNodeIds?.includes(node.id);
                      const isHead = i === 0;
                      const isTail = i === nodes.length - 1;

                      return (
                        <div key={node.id} className="flex items-center gap-2">
                          <div className="flex flex-col items-center gap-2.5">
                            <span className="text-4xs font-mono text-foreground-muted/70 h-3">
                              {isHead ? 'head' : isTail ? 'tail' : i}
                            </span>
                            <div
                              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-all duration-300 ease-out ${
                                isHighlighted
                                  ? 'border-link bg-accent-strong text-accent-foreground shadow-lg scale-105 -translate-y-1'
                                  : 'border-border-strong bg-surface text-foreground shadow-xs'
                              }`}
                            >
                              {node.value}
                            </div>
                          </div>

                          {/* Inter-Node Connectors */}
                          {i < nodes.length - 1 && (
                            <div className="flex items-center justify-center pt-4">
                              {isDoubly ? (
                                <ArrowLeftRight size={18} className="text-link shrink-0" />
                              ) : (
                                <ArrowRight size={18} className="text-foreground-muted shrink-0" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Singly & Doubly Tail NULL */}
                    {!isCircular && (
                      <div className="flex items-center gap-1 text-xs font-mono text-foreground-muted pt-4 pl-1">
                        <ArrowRight size={16} className="text-foreground-muted" />
                        <span>null</span>
                      </div>
                    )}
                  </div>

                  {/* Circular Linked List Return Track */}
                  {isCircular && nodes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono text-link bg-link/10 border border-link/25 px-3 py-1 rounded-full">
                      <span>↺</span>
                      <span>tail loops back to head [node 0]</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* STACK */}
            {selectedType === 'stack' && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xs font-mono uppercase tracking-wider text-foreground-muted">
                  &darr; Top Entry (LIFO) &darr;
                </span>
                <div className="flex flex-col-reverse items-center gap-2 w-36 border-b-4 border-l-2 border-r-2 border-border-strong p-3 min-h-48 justify-start bg-surface-muted/20 rounded-b-lg">
                  {((currentStep?.state?.items as number[] | undefined) ?? stackState).map(
                    (item: number, idx: number, allItems: number[]) => {
                      const isTop = idx === allItems.length - 1;
                      const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                      const isLifted = isHighlighted && currentStep?.motion?.type === 'lift';

                      return (
                        <div
                          key={idx}
                          className={`flex w-full items-center justify-between px-3 py-2 rounded border-2 font-mono text-xs font-bold transition-all duration-300 ease-out ${
                            isLifted
                              ? '-translate-y-8 opacity-75 border-link bg-accent-strong text-accent-foreground'
                              : isHighlighted
                                ? 'border-link bg-accent-strong text-accent-foreground scale-105 shadow-md'
                                : 'border-border-strong bg-surface text-foreground'
                          }`}
                        >
                          <span>{item}</span>
                          {isTop && (
                            <span className="text-3xs font-normal opacity-75">&larr; top</span>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* QUEUE */}
            {selectedType === 'queue' && (() => {
              const isDeque = selectedSubType === 'deque';
              return (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 border-t-2 border-b-2 border-border-strong px-5 py-4 bg-surface-muted/25 rounded">
                    <span className="text-3xs font-bold text-link mr-2">
                      {isDeque ? '&harr; Front' : '&larr; Front (Dequeue)'}
                    </span>
                    {((currentStep?.state?.items as number[] | undefined) ?? queueState).map(
                      (item: number, idx: number) => {
                        const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                        return (
                          <div
                            key={idx}
                            className={`flex h-12 w-12 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all duration-300 ${
                              isHighlighted
                                ? 'border-link bg-accent-strong text-accent-foreground scale-105 shadow-md'
                                : 'border-border-strong bg-surface text-foreground'
                            }`}
                          >
                            {item}
                          </div>
                        );
                      },
                    )}
                    <span className="text-3xs font-bold text-warning ml-2">
                      {isDeque ? '&harr; Rear' : '&larr; Rear (Enqueue)'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* BINARY SEARCH TREE */}
            {selectedType === 'binary-search-tree' && (
              <div className="w-full max-w-lg h-72 flex items-center justify-center">
                <svg viewBox="0 0 400 240" className="w-full h-full">
                  {/* Tree Branches */}
                  {Object.values(
                    (currentStep?.state?.nodes as Record<string, TreeNode> | undefined) ?? {},
                  ).map((node: TreeNode) => {
                    const nodes = currentStep?.state?.nodes as Record<string, TreeNode>;
                    const leftChild = node.leftId ? nodes[node.leftId] : null;
                    const rightChild = node.rightId ? nodes[node.rightId] : null;

                    return (
                      <g key={`branch-${node.id}`}>
                        {leftChild && (
                          <line
                            x1={node.x}
                            y1={node.y}
                            x2={leftChild.x}
                            y2={leftChild.y}
                            stroke="currentColor"
                            strokeWidth="1.2"
                            className="text-border-strong"
                          />
                        )}
                        {rightChild && (
                          <line
                            x1={node.x}
                            y1={node.y}
                            x2={rightChild.x}
                            y2={rightChild.y}
                            stroke="currentColor"
                            strokeWidth="1.2"
                            className="text-border-strong"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Tree Nodes */}
                  {Object.values(
                    (currentStep?.state?.nodes as Record<string, TreeNode> | undefined) ?? {},
                  ).map((node: TreeNode) => {
                    const isHighlighted = currentStep?.highlightNodeIds?.includes(node.id);
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        className="transition-transform duration-300"
                      >
                        <circle
                          r="14"
                          className={`transition-colors duration-300 ${
                            isHighlighted
                              ? 'fill-accent-strong stroke-link stroke-2'
                              : 'fill-surface stroke-border-strong stroke-1'
                          }`}
                        />
                        <text
                          textAnchor="middle"
                          dy="4"
                          className={`font-mono text-xs font-bold ${
                            isHighlighted ? 'fill-accent-foreground' : 'fill-foreground'
                          }`}
                        >
                          {node.value}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* BINARY HEAP */}
            {selectedType === 'min-heap' && (() => {
              const getHeapCoords = (i: number) => {
                if (i === 0) return { x: 200, y: 32 };
                if (i === 1) return { x: 110, y: 88 };
                if (i === 2) return { x: 290, y: 88 };
                if (i === 3) return { x: 65, y: 144 };
                if (i === 4) return { x: 155, y: 144 };
                if (i === 5) return { x: 245, y: 144 };
                if (i === 6) return { x: 335, y: 144 };
                const col = i - 7;
                return { x: 35 + col * 48, y: 196 };
              };

              return (
                <div className="flex flex-col items-center gap-6 w-full max-w-md">
                  {/* Complete Binary Tree SVG */}
                  <div className="w-full h-52 flex items-center justify-center">
                    <svg viewBox="0 0 400 220" className="w-full h-full">
                      {/* Branch lines */}
                      {currentHeap.map((_, i) => {
                        if (i === 0) return null;
                        const parentIdx = Math.floor((i - 1) / 2);
                        const p = getHeapCoords(parentIdx);
                        const c = getHeapCoords(i);
                        const isEdgeActive =
                          currentStep?.highlightIndices?.includes(i) &&
                          currentStep?.highlightIndices?.includes(parentIdx);
                        return (
                          <line
                            key={`heap-edge-${i}`}
                            x1={p.x}
                            y1={p.y}
                            x2={c.x}
                            y2={c.y}
                            stroke="currentColor"
                            strokeWidth={isEdgeActive ? '2' : '1.2'}
                            className={isEdgeActive ? 'text-link' : 'text-border-strong'}
                          />
                        );
                      })}

                      {/* Nodes */}
                      {currentHeap.map((val, i) => {
                        const c = getHeapCoords(i);
                        const isHighlighted = currentStep?.highlightIndices?.includes(i);
                        const isSwapping =
                          currentStep?.motion?.type === 'swap' &&
                          (currentStep.motion.fromIndex === i || currentStep.motion.toIndex === i);
                        return (
                          <g key={`heap-node-${i}`} transform={`translate(${c.x}, ${c.y})`}>
                            <circle
                              r="13"
                              className={`transition-all duration-300 ${
                                isSwapping || isHighlighted
                                  ? 'fill-accent-strong stroke-link stroke-2'
                                  : 'fill-surface stroke-border-strong stroke-1'
                              }`}
                            />
                            <text
                              textAnchor="middle"
                              dy="4"
                              className={`font-mono text-xs font-bold ${
                                isSwapping || isHighlighted ? 'fill-accent-foreground' : 'fill-foreground'
                              }`}
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Array representation */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {currentHeap.map((val: number, idx: number) => {
                      const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <span className="text-4xs font-mono text-foreground-muted/70">{idx}</span>
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded border-2 font-mono text-xs font-bold transition-all duration-300 ${
                              isHighlighted
                                ? 'border-link bg-accent-strong text-accent-foreground scale-105 shadow-sm'
                                : 'border-border-strong bg-surface text-foreground'
                            }`}
                          >
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* HASH TABLE */}
            {selectedType === 'hash-map' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-xl">
                {currentStep?.state?.lastHash !== undefined && (
                  <div className="flex items-center gap-2 rounded bg-surface-muted px-3 py-1.5 text-xs font-mono border border-border-subtle">
                    <Sparkles size={14} className="text-link" />
                    <span>
                      hash(&quot;{inputKey}&quot;) % 8 ={' '}
                      <span className="font-bold text-link">
                        Bucket [{String(currentStep.state.lastHash)}]
                      </span>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 w-full">
                  {(
                    (currentStep?.state?.buckets as Array<HashBucketEntry[]> | undefined) ??
                    mapState
                  ).map((bucket: HashBucketEntry[], idx: number) => {
                    const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col rounded border p-2 transition-all duration-300 ${
                          isHighlighted
                            ? 'border-link bg-accent-strong/10 ring-2 ring-link/40 shadow-sm'
                            : 'border-border bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-border-subtle pb-1">
                          <span className="text-3xs font-mono font-bold text-foreground-muted">
                            Slot [{idx}]
                          </span>
                          <span className="text-3xs font-mono text-foreground-muted">
                            {bucket.length} items
                          </span>
                        </div>

                        {bucket.length === 0 ? (
                          <span className="text-3xs text-foreground-muted italic pt-2">empty</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 pt-2">
                            {bucket.map((entry: HashBucketEntry, eIdx: number) => (
                              <div
                                key={eIdx}
                                className="flex items-center justify-between rounded bg-surface-muted px-2 py-1 font-mono text-3xs border border-border-subtle"
                              >
                                <span className="font-semibold text-link">{entry.key}</span>
                                <span>{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GRAPH NETWORK */}
            {selectedType === 'graph' && (
              <div className="w-full max-w-md h-72 flex items-center justify-center">
                <svg viewBox="0 0 400 260" className="w-full h-full overflow-visible">
                  <defs>
                    <marker
                      id="graph-arrowhead"
                      markerWidth="8"
                      markerHeight="8"
                      refX="22"
                      refY="4"
                      orient="auto"
                    >
                      <polygon points="0 1, 7 4, 0 7" fill="currentColor" className="text-link" />
                    </marker>
                  </defs>

                  {/* Graph Edges */}
                  {(
                    (currentStep?.state?.edges as GraphEdge[] | undefined) ?? []
                  ).map((edge: GraphEdge, idx: number) => {
                    const verts = currentStep?.state?.vertices as GraphVertex[];
                    const fromV = verts?.find((v) => v.id === edge.from);
                    const toV = verts?.find((v) => v.id === edge.to);
                    if (!fromV || !toV) return null;

                    const isActive =
                      currentStep?.highlightNodeIds?.includes(edge.from) &&
                      currentStep?.highlightNodeIds?.includes(edge.to);

                    const isDirected = selectedSubType === 'directed';

                    return (
                      <g key={`edge-${idx}`}>
                        <line
                          x1={fromV.x}
                          y1={fromV.y}
                          x2={toV.x}
                          y2={toV.y}
                          stroke="currentColor"
                          strokeWidth={isActive ? '2' : '1.2'}
                          markerEnd={isDirected ? 'url(#graph-arrowhead)' : undefined}
                          className={`transition-colors duration-300 ${
                            isActive ? 'text-link' : 'text-border-strong'
                          }`}
                        />
                        {edge.weight !== undefined && (
                          <g transform={`translate(${(fromV.x + toV.x) / 2}, ${(fromV.y + toV.y) / 2})`}>
                            <rect
                              x="-11"
                              y="-8"
                              width="22"
                              height="16"
                              rx="4"
                              className="fill-surface stroke-border-strong stroke-1"
                            />
                            <text
                              textAnchor="middle"
                              dy="4"
                              className="font-mono text-3xs font-bold fill-foreground"
                            >
                              {edge.weight}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Graph Vertices */}
                  {(
                    (currentStep?.state?.vertices as GraphVertex[] | undefined) ?? []
                  ).map((v: GraphVertex) => {
                    const isHighlighted = currentStep?.highlightNodeIds?.includes(v.id);
                    return (
                      <g
                        key={v.id}
                        transform={`translate(${v.x}, ${v.y})`}
                        className="transition-transform duration-300"
                      >
                        <circle
                          r="16"
                          className={`transition-colors duration-300 ${
                            isHighlighted
                              ? 'fill-accent-strong stroke-link stroke-2 shadow-md'
                              : 'fill-surface stroke-border-strong stroke-1'
                          }`}
                        />
                        <text
                          textAnchor="middle"
                          dy="4.5"
                          className={`font-mono text-xs font-bold ${
                            isHighlighted ? 'fill-accent-foreground' : 'fill-foreground'
                          }`}
                        >
                          {v.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Micro-Step Explanation Box */}
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
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
            <div className="flex items-center gap-1.5">
              <Button
                tone="surface"
                onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
                disabled={safeStepIdx === 0}
                aria-label="Previous step"
                className="inline-flex items-center justify-center p-1.5"
              >
                <SkipBack size={14} aria-hidden />
              </Button>

              <Button
                tone="strong"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold"
              >
                {isPlaying ? (
                  <Pause size={13} fill="currentColor" aria-hidden />
                ) : (
                  <Play size={13} fill="currentColor" aria-hidden />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>

              <Button
                tone="surface"
                onClick={() => setCurrentStepIdx((p) => Math.min(steps.length - 1, p + 1))}
                disabled={safeStepIdx >= steps.length - 1}
                aria-label="Next step"
                className="inline-flex items-center justify-center p-1.5"
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
                className="inline-flex items-center justify-center p-1.5"
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
                className="rounded border border-border-strong bg-background px-2 py-1 text-xs text-foreground font-medium"
              >
                <option value={4500}>0.1x (Ultra Slow · 4.5s)</option>
                <option value={3000}>0.25x (Very Slow · 3.0s)</option>
                <option value={1800}>0.5x (Slow · 1.8s)</option>
                <option value={1000}>1.0x (Normal · 1.0s)</option>
                <option value={500}>2.0x (Fast · 0.5s)</option>
              </select>
            </div>
          </div>
        </Node>

        {/* Synchronized Side-by-Side Code Panel (6 cols on lg) */}
        <Node
          tone="surface"
          className="flex flex-col gap-3 p-4 min-h-80 justify-between lg:col-span-6 xl:col-span-6"
        >
          <div className="flex flex-col gap-2 border-b border-border-subtle pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-link" />
                <span className="text-xs font-bold">Algorithmic Code</span>
              </div>
              <span className="text-3xs font-mono font-semibold text-link uppercase">
                {codeLang}
              </span>
            </div>

            {/* Language Selector Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {SUPPORTED_CODE_LANGUAGES.map((l) => (
                <Button
                  key={l.id}
                  tone={codeLang === l.id ? 'strong' : 'surface'}
                  onClick={() => setCodeLang(l.id)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-3xs font-mono"
                >
                  <LanguageIcon language={l.id} size={12} />
                  <span>{l.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Code Lines with Active Line Highlight */}
          <div className="flex-1 font-mono text-xs overflow-x-auto rounded bg-background p-3 border border-border-subtle">
            {activeCodeSnippet.split('\n').map((line, lIdx) => {
              const lineNum = lIdx + 1;
              const isCurrent = currentStep?.codeLine === lineNum;
              return (
                <div
                  key={lIdx}
                  className={`flex items-start gap-3 px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    isCurrent ? 'bg-accent font-bold text-accent-foreground' : 'text-foreground/90'
                  }`}
                >
                  <span className="w-4 select-none text-right text-3xs opacity-40">{lineNum}</span>
                  <pre className="font-mono text-xs whitespace-pre">{line || ' '}</pre>
                </div>
              );
            })}
          </div>

          {/* Pointer State Memory Inspector */}
          {currentStep?.pointers && Object.keys(currentStep.pointers).length > 0 && (
            <div className="flex flex-col gap-1.5 rounded bg-surface-muted p-2.5 text-xs font-mono border border-border-subtle">
              <span className="text-3xs font-bold uppercase tracking-wider text-foreground-muted">
                Variable State
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentStep.pointers).map(([k, v]) => (
                  <span key={k} className="rounded bg-background px-2 py-0.5 text-3xs border">
                    <span className="text-link font-bold">{k}</span>: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Node>
      </div>
    </div>
  );
}
