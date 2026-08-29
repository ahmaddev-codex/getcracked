import { parse } from 'acorn';
import type { Node } from 'acorn';

/**
 * AST instrumentation for JavaScript tracing.
 *
 * QuickJS exposes exactly one execution hook — `setInterruptHandler(runtime)` —
 * which receives no line number, no frame, and no variable state. It can answer
 * "abort or continue" and nothing else. There is therefore no way to obtain
 * `sys.settrace`-equivalent events from QuickJS without rewriting the learner's
 * source, which is what this module does. See docs/spikes/runtime-python-js.md.
 *
 * Rewriting someone's code to observe it is inherently risky, so the design
 * carries three guarantees rather than hoping for the best:
 *
 *  1. **Coverage.** A generic recursive walk visits every statement-bearing
 *     position, so `try`/`catch`, `switch`, labels, and nested functions are
 *     traced. An earlier version enumerated a handful of node types and
 *     silently skipped the rest.
 *  2. **Scope safety.** Only bindings that are genuinely live at a statement are
 *     reported. Emitting a `let` before its declaration would throw on the
 *     temporal dead zone and break the learner's program rather than observe it.
 *  3. **Line preservation.** Insertions never add newlines, so reported line
 *     numbers still match the source the learner is reading.
 *
 * Correctness is *verified*, not merely intended: the caller runs the traced and
 * untraced code and discards the trace if the results differ
 * (`javascript.ts`). Instrumentation can therefore never hand back a wrong
 * answer — the worst case is a missing trace.
 */

interface Insertion {
  offset: number;
  text: string;
}

type AnyNode = Record<string, unknown>;

/** A lexical scope. `hoisted` bindings are visible throughout it. */
interface Scope {
  /** `var`/params/function declarations — live anywhere in the scope. */
  hoisted: Set<string>;
  /** `let`/`const`/`class` — live only after their declaration offset. */
  lexical: Map<string, number>;
}

function newScope(): Scope {
  return { hoisted: new Set(), lexical: new Map() };
}

function patternNames(pattern: AnyNode | null | undefined, out: string[] = []): string[] {
  if (!pattern) return out;
  switch (pattern.type) {
    case 'Identifier':
      out.push(pattern.name as string);
      break;
    case 'ObjectPattern':
      for (const p of pattern.properties as AnyNode[]) {
        patternNames((p.value ?? p.argument) as AnyNode, out);
      }
      break;
    case 'ArrayPattern':
      for (const el of pattern.elements as (AnyNode | null)[]) patternNames(el, out);
      break;
    case 'AssignmentPattern':
      patternNames(pattern.left as AnyNode, out);
      break;
    case 'RestElement':
      patternNames(pattern.argument as AnyNode, out);
      break;
    default:
      break;
  }
  return out;
}

function declarationNames(node: AnyNode): { names: string[]; kind: string } {
  if (node.type === 'VariableDeclaration') {
    const names: string[] = [];
    for (const d of node.declarations as AnyNode[]) patternNames(d.id as AnyNode, names);
    return { names, kind: node.kind as string };
  }
  if (node.type === 'FunctionDeclaration' && node.id) {
    return { names: [(node.id as AnyNode).name as string], kind: 'var' };
  }
  if (node.type === 'ClassDeclaration' && node.id) {
    return { names: [(node.id as AnyNode).name as string], kind: 'let' };
  }
  return { names: [], kind: 'none' };
}

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** Keys whose values hold statements or expressions worth descending into. */
const SKIP_KEYS = new Set(['loc', 'range', 'start', 'end', 'type']);

export interface InstrumentResult {
  code: string;
  /** False when the entry function could not be found or rewritten. */
  instrumented: boolean;
}

/**
 * Rewrites `source` so the named function reports `__t(line, vars)` before each
 * statement in its body.
 *
 * Returns `instrumented: false` rather than throwing when the entry cannot be
 * located — a function expression assigned to a const, say. The caller then
 * runs the original source and keeps structure-level tracing, which needs no
 * rewriting at all.
 */
export function instrument(source: string, entry: string): InstrumentResult {
  let ast: Node;
  try {
    ast = parse(source, { ecmaVersion: 2022, locations: true, ranges: true });
  } catch {
    return { code: source, instrumented: false };
  }

  const body = (ast as unknown as AnyNode).body as AnyNode[];
  const target = body.find(
    (n) => n.type === 'FunctionDeclaration' && (n.id as AnyNode | undefined)?.name === entry,
  );
  if (!target) return { code: source, instrumented: false };

  const insertions: Insertion[] = [];
  const scopes: Scope[] = [];

  const visible = (offset: number): string[] => {
    const names = new Set<string>();
    for (const scope of scopes) {
      for (const n of scope.hoisted) names.add(n);
      for (const [n, declaredAt] of scope.lexical) {
        // Past the declaration only: reading earlier hits the TDZ and throws.
        if (declaredAt < offset) names.add(n);
      }
    }
    return [...names];
  };

  const traceCall = (node: AnyNode): void => {
    const loc = node.loc as { start: { line: number } } | undefined;
    const range = node.range as [number, number] | undefined;
    if (!loc || !range) return;

    const names = visible(range[0]);
    const vars = names.length
      ? `{${names.map((n) => `${JSON.stringify(n)}:${n}`).join(',')}}`
      : '{}';
    // Single line, no newline: reported line numbers must keep matching source.
    insertions.push({ offset: range[0], text: `__t(${loc.start.line},${vars});` });
  };

  /** Statements that cannot legally be preceded by another statement. */
  const NON_PREFIXABLE = new Set(['FunctionDeclaration', 'ClassDeclaration']);

  const walkStatementList = (statements: AnyNode[]): void => {
    // Hoist first: a `var` or function declaration is live above its position.
    for (const stmt of statements) {
      const { names, kind } = declarationNames(stmt);
      if (kind === 'var') for (const n of names) scopes.at(-1)!.hoisted.add(n);
    }

    for (const stmt of statements) {
      if (!NON_PREFIXABLE.has(stmt.type as string)) traceCall(stmt);
      walkNode(stmt);

      const { names, kind } = declarationNames(stmt);
      if (kind === 'let' || kind === 'const') {
        const end = (stmt.range as [number, number])[1];
        for (const n of names) scopes.at(-1)!.lexical.set(n, end);
      }
    }
  };

  const withScope = (fn: () => void): void => {
    scopes.push(newScope());
    fn();
    scopes.pop();
  };

  const walkNode = (node: AnyNode | null | undefined): void => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;

    if (FUNCTION_TYPES.has(node.type)) {
      withScope(() => {
        for (const p of (node.params as AnyNode[]) ?? []) {
          for (const n of patternNames(p)) scopes.at(-1)!.hoisted.add(n);
        }
        const fnBody = node.body as AnyNode;
        if (fnBody?.type === 'BlockStatement') {
          walkStatementList(fnBody.body as AnyNode[]);
        } else {
          walkNode(fnBody); // concise arrow body
        }
      });
      return;
    }

    if (node.type === 'BlockStatement') {
      withScope(() => walkStatementList(node.body as AnyNode[]));
      return;
    }

    if (node.type === 'SwitchStatement') {
      walkNode(node.discriminant as AnyNode);
      // All cases share one block scope, per the spec.
      withScope(() => {
        for (const c of node.cases as AnyNode[]) {
          walkNode(c.test as AnyNode);
          walkStatementList(c.consequent as AnyNode[]);
        }
      });
      return;
    }

    if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
      // The loop head's bindings scope over the body.
      withScope(() => {
        const head = (node.init ?? node.left) as AnyNode | undefined;
        if (head) {
          const { names, kind } = declarationNames(head);
          const scope = scopes.at(-1)!;
          for (const n of names) {
            if (kind === 'var') scope.hoisted.add(n);
            else scope.lexical.set(n, (head.range as [number, number])[1]);
          }
        }
        for (const key of ['test', 'update', 'right', 'body']) {
          const child = node[key] as AnyNode | undefined;
          if (child?.type === 'BlockStatement') withScope(() => walkStatementList(child.body as AnyNode[]));
          else walkNode(child);
        }
      });
      return;
    }

    if (node.type === 'CatchClause') {
      withScope(() => {
        for (const n of patternNames(node.param as AnyNode)) scopes.at(-1)!.hoisted.add(n);
        const b = node.body as AnyNode;
        if (b?.type === 'BlockStatement') walkStatementList(b.body as AnyNode[]);
      });
      return;
    }

    // Generic descent — this is what gives coverage of every remaining form
    // (labels, if/else, try, expressions containing functions) without having
    // to enumerate node types and inevitably miss one.
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach((v) => walkNode(v as AnyNode));
      else walkNode(value as AnyNode);
    }
  };

  walkNode(target);

  // Apply back-to-front so earlier offsets stay valid.
  let out = source;
  for (const ins of insertions.sort((a, b) => b.offset - a.offset)) {
    out = out.slice(0, ins.offset) + ins.text + out.slice(ins.offset);
  }
  return { code: out, instrumented: true };
}
