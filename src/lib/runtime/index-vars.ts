import { parse } from 'acorn';

/**
 * Which variables the source uses as array subscripts (B2).
 *
 * The visualizer marks index variables on the structure they point into, and it
 * used to decide that by value alone: any integer in range was drawn as a
 * pointer. That labelled `swaps` — a counter that happens to equal 0 — as
 * pointing at `heap[0]`, which is not a rendering nit but a false statement
 * about what the code is doing.
 *
 * Nothing in a runtime trace distinguishes an index from a number that happens
 * to be in range: by the time the Proxy trap fires, `a[i]` and `a[0]` are the
 * same call. The distinction only exists in the source, so it is read from
 * there — statically, once, before the run.
 *
 * The result is a claim about the *program*, not about a moment in it: "`i`
 * indexes `heap` somewhere in this function". A variable that indexes an array
 * on some other line is still a pointer into it, so the visualizer can label it
 * whenever it holds a valid position. What this rules out is the variable that
 * never indexes anything.
 */

type AnyNode = Record<string, unknown>;

/** Array name to the variables used to subscript it. */
export type IndexVariables = Record<string, string[]>;

function add(map: Map<string, Set<string>>, array: string, variable: string): void {
  const existing = map.get(array);
  if (existing) existing.add(variable);
  else map.set(array, new Set([variable]));
}

function toRecord(map: Map<string, Set<string>>): IndexVariables {
  return Object.fromEntries([...map].map(([array, vars]) => [array, [...vars].sort()]));
}

/**
 * Finds `array[variable]` accesses in JavaScript source.
 *
 * Only a bare identifier subscript counts. `a[i + 1]` names no single position
 * and `a[f(x)]` names none at all, so neither produces a label — a pointer mark
 * has to correspond to a variable a learner can watch change.
 */
export function javaScriptIndexVariables(source: string): IndexVariables {
  let ast: unknown;
  try {
    ast = parse(source, { ecmaVersion: 2022 });
  } catch {
    // Unparseable source still runs untraced; returning nothing means no
    // pointer labels rather than wrong ones.
    return {};
  }

  const found = new Map<string, Set<string>>();

  const walk = (node: AnyNode | null | undefined): void => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;

    if (node.type === 'MemberExpression' && node.computed === true) {
      const object = node.object as AnyNode | undefined;
      const property = node.property as AnyNode | undefined;
      if (
        object?.type === 'Identifier' &&
        property?.type === 'Identifier' &&
        typeof object.name === 'string' &&
        typeof property.name === 'string'
      ) {
        add(found, object.name, property.name);
      }
    }

    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) value.forEach((v) => walk(v as AnyNode));
      else if (value && typeof value === 'object') walk(value as AnyNode);
    }
  };

  walk(ast as AnyNode);
  return toRecord(found);
}
