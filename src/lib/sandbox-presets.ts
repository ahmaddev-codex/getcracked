import type { Language } from '@/content/schema';

/**
 * Starting points for the free-play sandbox (B7).
 *
 * An empty editor is the worst possible first screen for a tool whose value is
 * hard to describe and obvious to see. Each preset is chosen to make the
 * animation show something different the moment it runs — a swap, a window, a
 * table filling in — rather than to teach the algorithm, which is what the
 * lessons are for.
 *
 * Deliberately not the lesson walkthroughs. Those are verified content with
 * captions and a curriculum position; these are scratch code to be pulled apart,
 * and framing them as authoritative would invite a learner to read them as the
 * canonical implementation.
 */

export interface SandboxPreset {
  id: string;
  label: string;
  /** What the animation will show, so the choice is informed. */
  note: string;
  entry: string;
  args: unknown[];
  source: Record<Language, string>;
}

export const SANDBOX_PRESETS: readonly SandboxPreset[] = [
  {
    id: 'bubble-sort',
    label: 'Bubble sort',
    note: 'Every comparison and every swap, on a small array.',
    entry: 'sort',
    args: [[5, 2, 9, 1, 6]],
    source: {
      javascript: `function sort(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length - 1 - i; j++) {
      if (nums[j] > nums[j + 1]) {
        const tmp = nums[j];
        nums[j] = nums[j + 1];
        nums[j + 1] = tmp;
      }
    }
  }
  return nums;
}`,
      python: `def sort(nums):
    for i in range(len(nums)):
        for j in range(len(nums) - 1 - i):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums`,
    },
  },
  {
    id: 'binary-search',
    label: 'Binary search',
    note: 'Two pointers closing on a target — the halving is the whole picture.',
    entry: 'search',
    args: [[1, 3, 5, 7, 9, 11, 13, 15], 13],
    source: {
      javascript: `function search(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      python: `def search(nums, target):
    lo = 0
    hi = len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    },
  },
  {
    id: 'counting',
    label: 'Counting with a map',
    note: 'A hash map filling up — a first sighting reads differently from an increment.',
    entry: 'counts',
    args: [['a', 'b', 'a', 'c', 'b', 'a']],
    source: {
      javascript: `function counts(items) {
  const seen = new Map();
  for (let i = 0; i < items.length; i++) {
    const key = items[i];
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(seen);
}`,
      python: `def counts(items):
    seen = {}
    for i in range(len(items)):
        key = items[i]
        seen[key] = seen.get(key, 0) + 1
    return seen`,
    },
  },
  {
    id: 'dp-grid',
    label: 'A DP table',
    note: 'A 2-D table filling in — each cell taking the one above plus the one to its left.',
    entry: 'paths',
    args: [3, 4],
    source: {
      javascript: `function paths(rows, cols) {
  const dp = [];
  for (let r = 0; r < rows; r++) {
    dp.push(new Array(cols).fill(0));
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 || c === 0) dp[r][c] = 1;
      else dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    }
  }
  return dp[rows - 1][cols - 1];
}`,
      python: `def paths(rows, cols):
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if r == 0 or c == 0:
                dp[r][c] = 1
            else:
                dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
    return dp[rows - 1][cols - 1]`,
    },
  },
];

export const DEFAULT_PRESET = SANDBOX_PRESETS[0];
