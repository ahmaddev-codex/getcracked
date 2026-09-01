import { describe, it, expect } from 'vitest';
import {
  simulateArray,
  simulateLinkedList,
  simulateStack,
  simulateQueue,
  simulateBST,
  simulateHeap,
  simulateHashMap,
  DATA_STRUCTURE_REGISTRY,
} from '@/lib/visualizer/data-structures';

describe('Data Structure Simulation Engine', () => {
  it('registers all 8 core data structures', () => {
    expect(DATA_STRUCTURE_REGISTRY.length).toBe(8);
    const ids = DATA_STRUCTURE_REGISTRY.map((d) => d.id);
    expect(ids).toContain('array');
    expect(ids).toContain('linked-list');
    expect(ids).toContain('stack');
    expect(ids).toContain('queue');
    expect(ids).toContain('binary-search-tree');
    expect(ids).toContain('min-heap');
    expect(ids).toContain('hash-map');
    expect(ids).toContain('graph');
  });

  describe('Array simulation', () => {
    it('simulates push with proper steps', () => {
      const steps = simulateArray([1, 2, 3], 'Push', { value: 99 });
      expect(steps.length).toBeGreaterThan(1);
      const last = steps[steps.length - 1];
      expect(last.state.array).toEqual([1, 2, 3, 99]);
      expect(last.complexity).toContain('O(1)');
    });

    it('simulates reverse with two pointers', () => {
      const steps = simulateArray([1, 2, 3], 'Reverse');
      expect(steps.length).toBeGreaterThan(2);
      const last = steps[steps.length - 1];
      expect(last.state.array).toEqual([3, 2, 1]);
    });
  });

  describe('Linked List simulation', () => {
    it('simulates insert head', () => {
      const steps = simulateLinkedList([10, 20], 'Insert Head', { value: 5 });
      const last = steps[steps.length - 1];
      const nodes = last.state.nodes as Array<{ value: number }>;
      expect(nodes[0].value).toBe(5);
    });

    it('simulates reverse', () => {
      const steps = simulateLinkedList([1, 2, 3], 'Reverse');
      const last = steps[steps.length - 1];
      const nodes = last.state.nodes as Array<{ value: number }>;
      expect(nodes.map((n) => n.value)).toEqual([3, 2, 1]);
    });
  });

  describe('Stack and Queue simulation', () => {
    it('simulates stack push and pop', () => {
      const pushSteps = simulateStack([10], 'Push', { value: 20 });
      expect(pushSteps[pushSteps.length - 1].state.items).toEqual([10, 20]);

      const popSteps = simulateStack([10, 20], 'Pop');
      expect(popSteps[popSteps.length - 1].state.items).toEqual([10]);
    });

    it('simulates queue enqueue and dequeue', () => {
      const enqSteps = simulateQueue([10], 'Enqueue', { value: 20 });
      expect(enqSteps[enqSteps.length - 1].state.items).toEqual([10, 20]);

      const deqSteps = simulateQueue([10, 20], 'Dequeue');
      expect(deqSteps[deqSteps.length - 1].state.items).toEqual([20]);
    });
  });

  describe('BST & Heap simulation', () => {
    it('simulates BST insert and search', () => {
      const insertSteps = simulateBST([20, 10, 30], 'Insert', { value: 25 });
      expect(insertSteps.length).toBeGreaterThan(1);
      const searchSteps = simulateBST([20, 10, 30], 'Search', { value: 10 });
      expect(searchSteps.some((s) => s.actionType === 'done' && s.title.includes('Match'))).toBe(true);
    });

    it('simulates Heap insert and bubble-up', () => {
      const steps = simulateHeap([10, 20, 30], 'Insert', { value: 5 });
      const last = steps[steps.length - 1];
      // Min element 5 should bubble up to root (index 0)
      const heap = last.state.heap as number[];
      expect(heap[0]).toBe(5);
    });
  });

  describe('Hash Map simulation', () => {
    it('simulates put and get with chaining', () => {
      const emptyBuckets = Array.from({ length: 8 }, () => []);
      const putSteps = simulateHashMap(emptyBuckets, 'Put', { key: 'hello', value: 'world' });
      expect(putSteps.length).toBeGreaterThan(0);
      const last = putSteps[putSteps.length - 1];
      const buckets = last.state.buckets as Array<Array<{ key: string }>>;
      const hasKey = buckets.some((b) => b.some((e) => e.key === 'hello'));
      expect(hasKey).toBe(true);
    });
  });
});
