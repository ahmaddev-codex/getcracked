import type { LessonInput } from '../schema';

export const bitManipulationLesson: LessonInput = {
  tier: 'lesson',
  slug: 'bit-manipulation',
  title: 'Bit Manipulation',
  summary: 'When the state is small enough to be a number, arithmetic replaces the data structure.',
  order: 11,
  track: 'algorithms',

  difficulty: 'advanced',

  operations: [
    {
      name: 'and / or / xor / shift',
      time: 'O(1)',
      note: 'One machine instruction.',
    },
    {
      name: 'count set bits via x & (x-1)',
      time: 'O(set bits)',
      note: 'Not O(word size).',
    },
    {
      name: 'enumerate all subsets',
      time: 'O(2^n)',
      note: 'Only viable while n stays around 20.',
    },
    {
      name: 'space for a set of 64 items',
      time: 'O(1)',
      note: 'One integer.',
    },
  ],

  variants: [
    {
      name: 'Bitmask as a set',
      what: 'Membership, union, intersection in single operations.',
    },
    {
      name: 'XOR tricks',
      what: 'Find the unpaired value, or the missing number, in O(1) space.',
    },
    {
      name: 'Bitmask DP',
      what: 'State is a subset of visited items — travelling salesman, assignment.',
    },
    {
      name: 'Bit tricks',
      what: 'Powers of two, lowest set bit, swapping without a temporary.',
    },
  ],

  furtherReading: [
    {
      label: 'Bit manipulation',
      url: 'https://en.wikipedia.org/wiki/Bit_manipulation',
      source: 'Wikipedia',
    },
    {
      label: 'Bitwise operators in JavaScript',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators',
      source: 'MDN',
    },
  ],

  explainer: `Bit manipulation is worth learning for one reason: it turns a whole set into a
single integer. Thirty-two booleans become one number you can compare, hash,
store in an array index, and pass around for free.

The operations that carry most of the weight:

    x & 1          is x odd
    x >> 1         halve it
    x & (1 << i)   is bit i set
    x | (1 << i)   set bit i
    x & ~(1 << i)  clear bit i
    x ^ (1 << i)   flip bit i

And three identities that solve entire problems on their own:

**\`x & (x - 1)\` clears the lowest set bit.** Loop on it and you count set bits
in as many steps as there are ones, not as there are bits. It is also the test
for a power of two: exactly one bit set means \`x & (x - 1)\` is zero.

**XOR cancels.** \`a ^ a = 0\` and \`a ^ 0 = a\`, so XOR-ing everything in an
array where each value appears twice except one leaves exactly that one — in
O(n) time and O(1) space, with no hash map.

**A subset is a number.** Iterating \`mask\` from \`0\` to \`2^n - 1\` enumerates
every subset of n items, and \`mask & (1 << i)\` asks whether item i is in this
one. That is the basis of bitmask dynamic programming.

The trap is language semantics. JavaScript's bitwise operators coerce to 32-bit
signed integers, so they silently break above 2³¹. Python's integers are
arbitrary precision and its \`>>\` on negatives is an arithmetic shift with no
32-bit wrap at all. The same expression genuinely differs between the two.`,

  walkthrough: {
    entry: 'totalSetBits',
    entryByLanguage: { python: 'total_set_bits' },
    source: {
      javascript: `function totalSetBits(nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    let n = nums[i];
    let bits = 0;
    while (n > 0) {
      n = n & (n - 1);
      bits = bits + 1;
    }
    nums[i] = bits;
    total = total + bits;
  }
  return total;
}`,
      python: `def total_set_bits(nums):
    total = 0
    for i in range(len(nums)):
        n = nums[i]
        bits = 0
        while n > 0:
            n = n & (n - 1)
            bits = bits + 1
        nums[i] = bits
        total = total + bits
    return total`,
    },
    visual: 'array',
    args: [[7, 8, 5]],
    caption:
      'Each value is replaced by its number of set bits. The inner loop runs once per one-bit, not once per bit — 8 finishes in a single step where a naive shift would take four.',
  },

  complexity: {
    time: 'O(1) per operation; O(set bits) for the clear-lowest-bit loop',
    space: 'O(1) — a set of up to 32 or 64 members costs one integer',
    note: 'Subset enumeration is O(2^n) by definition, and bitmask DP is O(2^n · n). Those are only tractable because n is small — around 20 — which the constraints will tell you.',
  },

  whenToUse: {
    reachFor: [
      'A set of at most ~32 or 64 items, where the whole set needs to be one comparable value.',
      'Bitmask DP over subsets, which the constraints signal by keeping n around 20.',
      'The classic XOR problems: find the single unpaired value, or the missing number.',
      'Flags and permissions, where combining and testing sets should be one instruction.',
    ],
    insteadOf: [
      {
        alternative: 'A hash set',
        why: 'Clearer and unbounded, and the right default. A bitmask wins when the universe is small and fixed and you need the set itself to be a value — a key, an array index, a DP state.',
      },
      {
        alternative: 'An array of booleans',
        why: 'Easier to read and usually fast enough. The bitmask is worth it when you need union, intersection or difference of whole sets in a single operation.',
      },
      {
        alternative: 'Arithmetic',
        why: 'Sum-based tricks for "find the missing number" are simpler to explain but overflow on large inputs. XOR has no such failure mode.',
      },
    ],
  },

  patternCues: [
    'Constraints cap n around 20 — that is an explicit invitation to enumerate subsets.',
    'The problem is about subsets, masks, flags, or "every combination".',
    'Values appear in pairs except one, which is XOR.',
    'The words "without extra space" alongside a counting problem.',
  ],

  pitfalls: [
    {
      title: 'Operator precedence',
      body: '`&` and `|` bind more loosely than `==` in most C-family languages, so `x & 1 == 0` parses as `x & (1 == 0)`. Parenthesise everything.',
    },
    {
      title: 'Assuming 32-bit behaviour in Python',
      body: 'Python integers do not wrap and `>>` on a negative is an arithmetic shift forever. Masking with `& 0xFFFFFFFF` is how you get JavaScript-like behaviour when a problem assumes it.',
    },
    {
      title: 'Shifting past the width',
      body: '`1 << 32` is 1 in JavaScript, not 4294967296 — the shift count wraps at 32. Above that you need BigInt.',
    },
    {
      title: 'Signed right shift on negatives',
      body: '`>>` preserves the sign bit and `>>>` does not. For bit counting on possibly-negative values, the difference is an infinite loop.',
    },
  ],

  exercises: [
    {
      slug: 'count-bits',
      title: 'Count the set bits',
      brief: 'Return how many 1 bits `n` has. Use `n & (n - 1)` rather than checking each bit.',
      hints: [
        '`n & (n - 1)` removes exactly the lowest set bit.',
        'Count how many times you can do that before reaching zero.',
      ],
      starterCode: {
        javascript: `function countBits(n) {
  // TODO: count the 1 bits in n.
  return 0;
}`,
      },
      referenceSolution: {
        javascript: `function countBits(n) {
  let count = 0;
  while (n > 0) {
    n = n & (n - 1);
    count = count + 1;
  }
  return count;
}`,
      },
      testSpec: {
        entry: 'countBits',
        cases: [
          { name: 'seven is three bits', args: [7], expected: 3 },
          { name: 'power of two', args: [8], expected: 1 },
          { name: 'zero', args: [0], expected: 0 },
          { name: 'mixed', args: [5], expected: 2, hidden: true },
        ],
      },
    },
  ],
};
