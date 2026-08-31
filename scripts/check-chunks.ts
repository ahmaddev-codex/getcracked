import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'acorn';

/**
 * Parses every emitted client chunk (H2).
 *
 * **Why a build artifact needs checking at all.** A bundler is assumed to emit
 * valid JavaScript, and normally that assumption holds. It did not here:
 * Turbopack's production minifier rewrote `\x00` to `\0` inside a template
 * literal without checking the next character, so where QuickJS's embedded
 * WebAssembly contained a zero byte followed by an ASCII `0` it produced `\00` —
 * a legacy octal escape, which a template literal forbids.
 *
 * Every existing gate passed. It typechecks, it lints, 1024 tests go green, and
 * `next build` reports success, because nothing in that list parses the *output*.
 * The failure surfaced only in production, only in the browser, and only once
 * something loaded that particular chunk — which was the sandbox worker, so what
 * a learner saw was "run" doing nothing:
 *
 *     SyntaxError: Failed to execute 'importScripts' on 'WorkerGlobalScope':
 *     Octal escape sequences are not allowed in template strings.
 *
 * Parsing the chunks is cheap and catches the whole class, whatever a future
 * minifier decides to shorten.
 */

/** Failing as a *script* is what matters: classic workers have no module goal. */
const GOALS = ['module', 'script'] as const;

function chunkFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((entry) => join(dir, entry.replace(/\\/g, '/')))
    .filter((path) => path.endsWith('.js'));
}

function main() {
  const dir = join('.next', 'static');

  let files: string[];
  try {
    files = chunkFiles(dir);
  } catch {
    process.stderr.write(
      `✗ No build output at ${dir}. Run \`pnpm build\` before this check.\n`,
    );
    process.exit(1);
  }

  const broken: Array<{ file: string; message: string }> = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    // A chunk is fine if it parses under *either* goal — module syntax in a
    // module chunk is not a defect. It is broken only when neither works.
    const errors = GOALS.map((sourceType) => {
      try {
        parse(source, { ecmaVersion: 'latest', sourceType });
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    if (errors.every((e) => e !== null)) {
      broken.push({ file, message: errors[1]! });
    }
  }

  if (broken.length > 0) {
    process.stderr.write(`\n✗ ${broken.length} emitted chunk(s) do not parse:\n\n`);
    for (const { file, message } of broken) {
      process.stderr.write(`  ${file}\n    ${message}\n\n`);
    }
    process.stderr.write(
      'This is the bundler emitting invalid JavaScript, not a source error — ' +
        'typecheck, lint and the test suite all pass on code that cannot load.\n',
    );
    process.exit(1);
  }

  process.stdout.write(`✓ All ${files.length} emitted chunk(s) parse\n`);
}

main();
