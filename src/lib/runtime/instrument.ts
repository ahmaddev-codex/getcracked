import { parse } from 'acorn';
import type { Node } from 'acorn';

/**
 * AST instrumentation for JavaScript tracing.
 *
 * QuickJS exposes exactly one execution hook — `setInterruptHandler(runtime)` —
 * which receives no line number, no variable state, and no opcode context. It
 * can answer "abort or continue" and nothing else. There is therefore no way to
 * obtain `sys.settrace`-equivalent events from QuickJS without rewriting the
 * learner's source, which is what this module does.
 *
 * See docs/spikes/runtime-python-js.md for the full finding.
 */

interface Insertion {
  offset: number;
  text: string;
}

/** Identifiers declared by a statement, for scope tracking. */
function declaredNames(node: Node): string[] {
  const n = node as unknown as Record<string, unknown>;
  if (n.type === 'VariableDeclaration') {
    const decls = n.declarations as Array<Record<string, unknown>>;
    return decls
      .map((d) => d.id as Record<string, unknown>)
      .filter((id) => id.type === 'Identifier')
      .map((id) => id.name as string);
  }
  return [];
}

function paramNames(fn: Record<string, unknown>): string[] {
  const params = fn.params as Array<Record<string, unknown>>;
  return params
    .filter((p) => p.type === 'Identifier')
    .map((p) => p.name as string);
}

/**
 * Rewrites `source` so the named function reports a `__t(line, vars)` call
 * before each statement in its body.
 *
 * Scope is tracked with a stack so a trace call only references bindings that
 * are actually live at that point — referencing a `let` from a sibling block, or
 * before its declaration, would throw a ReferenceError or hit the TDZ and break
 * the learner's program rather than observe it.
 */
export function instrument(source: string, entry: string): string {
  const ast = parse(source, {
    ecmaVersion: 2022,
    locations: true,
    ranges: true,
  });

  const body = ast.body as unknown as Array<Record<string, unknown>>;
  const target = body.find(
    (n) => n.type === 'FunctionDeclaration' && (n.id as Record<string, unknown>)?.name === entry,
  );
  if (!target) return source;

  const insertions: Insertion[] = [];
  const scopes: string[][] = [paramNames(target)];

  const visible = (): string[] => Array.from(new Set(scopes.flat()));

  const walkBlock = (block: Record<string, unknown>): void => {
    scopes.push([]);
    for (const stmt of block.body as Array<Record<string, unknown>>) {
      const loc = stmt.loc as { start: { line: number } };
      const range = stmt.range as [number, number];
      const names = visible();
      const varsObj = names.length
        ? `{${names.map((n) => `${JSON.stringify(n)}:${n}`).join(',')}}`
        : '{}';
      insertions.push({
        offset: range[0],
        text: `__t(${loc.start.line},${varsObj});`,
      });

      // Declarations take effect for *subsequent* statements only.
      scopes[scopes.length - 1].push(...declaredNames(stmt as unknown as Node));
      walkInner(stmt);
    }
    scopes.pop();
  };

  const walkInner = (node: Record<string, unknown>): void => {
    switch (node.type) {
      case 'ForStatement': {
        // The for-init binding is scoped to the loop, including its body.
        scopes.push(declaredNames(node.init as unknown as Node));
        const body = node.body as Record<string, unknown>;
        if (body?.type === 'BlockStatement') walkBlock(body);
        scopes.pop();
        break;
      }
      case 'ForOfStatement':
      case 'ForInStatement': {
        scopes.push(declaredNames(node.left as unknown as Node));
        const body = node.body as Record<string, unknown>;
        if (body?.type === 'BlockStatement') walkBlock(body);
        scopes.pop();
        break;
      }
      case 'WhileStatement':
      case 'DoWhileStatement': {
        const body = node.body as Record<string, unknown>;
        if (body?.type === 'BlockStatement') walkBlock(body);
        break;
      }
      case 'IfStatement': {
        for (const branch of ['consequent', 'alternate'] as const) {
          const b = node[branch] as Record<string, unknown> | null;
          if (b?.type === 'BlockStatement') walkBlock(b);
        }
        break;
      }
      case 'BlockStatement':
        walkBlock(node);
        break;
      default:
        break;
    }
  };

  walkBlock(target.body as Record<string, unknown>);

  // Apply back-to-front so earlier offsets stay valid.
  let out = source;
  for (const ins of insertions.sort((a, b) => b.offset - a.offset)) {
    out = out.slice(0, ins.offset) + ins.text + out.slice(ins.offset);
  }
  return out;
}
