import fs from 'node:fs';
import path from 'node:path';

/**
 * Interactive & CLI scaffolding tool for authoring new GetCracked content.
 * Usage:
 *   npx tsx scripts/create-content.ts problem <topic> <slug> [title] [difficulty]
 *   npx tsx scripts/create-content.ts lab <slug> [title]
 *
 * Example:
 *   npx tsx scripts/create-content.ts problem hashing valid-sudoku "Valid Sudoku" medium
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function camelCase(text: string): string {
  return text
    .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

function createProblem(topic: string, slug: string, title?: string, difficulty = 'medium') {
  const problemTitle = title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const entryName = camelCase(slug);
  const pythonEntry = slug.replace(/-/g, '_');
  const targetDir = path.join(process.cwd(), 'src', 'content', 'problems', topic);
  const targetFile = path.join(targetDir, `${slug}.ts`);

  if (fs.existsSync(targetFile)) {
    console.error(`Error: File already exists at ${targetFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const template = `import type { ProblemInput } from '../../schema';

export const ${entryName}: ProblemInput = {
  tier: 'problem',
  slug: '${slug}',
  topic: '${topic}',
  difficulty: '${difficulty}' as const,
  title: '${problemTitle}',
  companies: ['Amazon', 'Meta'],
  recommendedAfter: ['${topic}'],

  brief:
    'Given an input, return the expected result according to the pattern rules.\\n\\n\`\`\`\\n${entryName}([1, 2, 3])  ->  true\\n\`\`\`',

  hints: [
    'Consider how the ${topic.replace(/-/g, ' ')} pattern simplifies this search.',
    'Trace edge cases: empty input, single element, negative values, duplicates.',
  ],

  starterCode: {
    javascript: 'function ${entryName}(input) {\\n  // TODO: implement optimal solution\\n  return null;\\n}',
    python: 'def ${pythonEntry}(input):\\n    # TODO: implement optimal solution\\n    return None',
  },

  referenceSolution: {
    javascript: \`function \${'${entryName}'}(input) {
  // TODO: reference solution implementation
  return true;
}\`,
    python: \`def \${'${pythonEntry}'}(input):
    # TODO: reference solution implementation
    return True\`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    note: 'Linear scan over input elements.',
  },

  testSpec: {
    entry: '${entryName}',
    entryByLanguage: { python: '${pythonEntry}' },
    cases: [
      {
        name: 'standard input',
        args: [[1, 2, 3]],
        expected: true,
      },
      {
        name: 'empty input',
        args: [[]],
        expected: true,
        hidden: true,
      },
    ],
  },
};
`;

  fs.writeFileSync(targetFile, template, 'utf-8');
  console.log(`\n✓ Created new practice problem at:`);
  console.log(`  ${targetFile}\n`);
  console.log(`Next steps:`);
  console.log(`1. Add to src/content/registry.ts:`);
  console.log(`   import { ${entryName} } from './problems/${topic}/${slug}';`);
  console.log(`   Add '${entryName}' to RAW_PROBLEMS`);
  console.log(`2. Run 'pnpm content:check' to verify test cases and schema!\n`);
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'problem';

  if (type === 'problem') {
    const topic = args[1];
    const rawSlug = args[2];
    const title = args[3];
    const difficulty = args[4] || 'medium';

    if (!topic || !rawSlug) {
      console.log('Usage: npx tsx scripts/create-content.ts problem <topic> <slug> [title] [difficulty]');
      console.log('Example: npx tsx scripts/create-content.ts problem hashing group-shift "Group Shifted Strings" medium');
      process.exit(1);
    }

    createProblem(topic, slugify(rawSlug), title, difficulty);
  } else {
    console.log(`Unsupported content type: ${type}. Use 'problem'.`);
  }
}

main();
