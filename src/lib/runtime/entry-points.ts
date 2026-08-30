import { parse } from 'acorn';
import type { Language } from '@/content/schema';

/**
 * The functions a piece of source declares, for the free-play sandbox (B7).
 *
 * Everywhere else on the platform the entry point is known: a problem's test
 * spec names it, and a challenge step's does too. The sandbox has no spec — the
 * learner brings their own code — so something has to work out what there is to
 * call.
 *
 * **Offered as a choice rather than guessed.** A heuristic ("the last function
 * declared") is right most of the time and silently wrong the rest, and being
 * silently wrong here means running the learner's helper instead of their
 * algorithm and animating the wrong thing. Listing what was found and letting
 * them pick costs one select and cannot be wrong.
 *
 * Order is source order, so the default — the last entry — is the function most
 * people write last, which is usually the one they mean.
 */

/** Top-level function names in source order. Never throws. */
export function entryPoints(source: string, language: Language): string[] {
  return language === 'python' ? pythonEntries(source) : javaScriptEntries(source);
}

interface NamedNode {
  type: string;
  id?: { name?: string } | null;
  declarations?: Array<{
    id?: { type?: string; name?: string };
    init?: { type?: string } | null;
  }>;
}

function javaScriptEntries(source: string): string[] {
  let program: { body: unknown[] };
  try {
    program = parse(source, { ecmaVersion: 2022 }) as unknown as { body: unknown[] };
  } catch {
    /**
     * Half-written code is the normal state of a sandbox, and a parse error
     * must not empty the picker mid-keystroke. The regex finds function
     * declarations in source that does not parse yet, which is enough to keep
     * the selection stable while someone is typing.
     */
    return regexEntries(source, /(?:^|\n)\s*function\s+([A-Za-z_$][\w$]*)\s*\(/g);
  }

  const names: string[] = [];
  for (const raw of program.body) {
    const node = raw as NamedNode;

    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      names.push(node.id.name);
      continue;
    }

    // `const solve = (n) => …` is as much an entry point as a declaration, and
    // it is how a good half of JavaScript is written.
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations ?? []) {
        const initType = declarator.init?.type;
        if (
          declarator.id?.type === 'Identifier' &&
          declarator.id.name &&
          (initType === 'FunctionExpression' || initType === 'ArrowFunctionExpression')
        ) {
          names.push(declarator.id.name);
        }
      }
    }
  }
  return dedupe(names);
}

/**
 * Python has no parser on this side, so this is a regex — and it is anchored to
 * column zero on purpose. An indented `def` is a method or a closure, which is
 * not callable by name from the runner.
 */
function pythonEntries(source: string): string[] {
  return regexEntries(source, /(?:^|\n)def\s+([A-Za-z_][\w]*)\s*\(/g);
}

function regexEntries(source: string, pattern: RegExp): string[] {
  return dedupe([...source.matchAll(pattern)].map((m) => m[1]));
}

/** A redefined name is one entry, listed where it first appeared. */
function dedupe(names: string[]): string[] {
  return [...new Set(names)];
}

/**
 * The entry to run, given what was found and what the learner last chose.
 *
 * Keeping their choice while it still exists is what stops the selection
 * jumping around as they type; falling back to the last declared function is
 * the better default, since a scratchpad is usually written helpers-first.
 */
export function resolveEntry(available: string[], chosen: string | null): string | null {
  if (chosen && available.includes(chosen)) return chosen;
  return available.at(-1) ?? null;
}
