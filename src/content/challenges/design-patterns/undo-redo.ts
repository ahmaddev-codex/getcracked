import type { ChallengeInput } from '../../schema';

/**
 * The Command pattern, built as the undo/redo every editor has.
 *
 * Two editable files rather than one: the commands know how to do and undo
 * themselves, and the history knows nothing about text at all. That separation
 * *is* the pattern, and splitting it across files makes it visible — a learner
 * who can see that `history.js` never mentions a string has understood why the
 * pattern exists.
 */

const JS_HARNESS = `const { Insert, Remove } = require('./commands');
const { History } = require('./history');

/**
 * Replays a sequence of operations against your editor. Read-only.
 *
 * Every operation reports the document as it stands afterwards, so the expected
 * values below read like a recording of the editor.
 *
 *   ["insert", text]  ->  the document after inserting
 *   ["remove", n]     ->  the document after removing n characters from the end
 *   ["undo"]          ->  the document after undoing
 *   ["redo"]          ->  the document after redoing
 *   ["text"]          ->  the document, unchanged
 *   ["depth"]         ->  [commands that can be undone, commands that can be redone]
 */
function runOps(ops) {
  const history = new History();
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'insert') {
      history.run(new Insert(op[1]));
      out.push(history.text());
    } else if (op[0] === 'remove') {
      history.run(new Remove(op[1]));
      out.push(history.text());
    } else if (op[0] === 'undo') {
      history.undo();
      out.push(history.text());
    } else if (op[0] === 'redo') {
      history.redo();
      out.push(history.text());
    } else if (op[0] === 'text') {
      out.push(history.text());
    } else if (op[0] === 'depth') {
      out.push(history.depth());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from commands import Insert, Remove
from history import History


def run_ops(ops):
    """Replay a sequence of operations against your editor. Read-only.

    Every operation reports the document as it stands afterwards, so the
    expected values below read like a recording of the editor.

        ["insert", text]  ->  the document after inserting
        ["remove", n]     ->  the document after removing n characters
        ["undo"]          ->  the document after undoing
        ["redo"]          ->  the document after redoing
        ["text"]          ->  the document, unchanged
        ["depth"]         ->  [commands that can be undone, that can be redone]
    """
    history = History()
    out = []

    for op in ops:
        if op[0] == "insert":
            history.run(Insert(op[1]))
            out.append(history.text())
        elif op[0] == "remove":
            history.run(Remove(op[1]))
            out.append(history.text())
        elif op[0] == "undo":
            history.undo()
            out.append(history.text())
        elif op[0] == "redo":
            history.redo()
            out.append(history.text())
        elif op[0] == "text":
            out.append(history.text())
        elif op[0] == "depth":
            out.append(history.depth())
        else:
            raise ValueError("Unknown operation: " + str(op[0]))

    return out
`;

function jsCommands(insertBody: string, removeBody: string): string {
  return `/**
 * A command is a change that knows how to undo itself.
 *
 * Both are pure with respect to the document: \`apply\` takes the document and
 * returns the new one. Nothing here holds the document, and nothing here knows
 * a history exists.
 */
class Insert {
  constructor(text) {
    this.text = text;
  }

${insertBody}
}

class Remove {
  constructor(count) {
    this.count = count;
    // What this command actually took out, remembered so it can be put back.
    // A command that only knows *how much* it removed cannot undo itself.
    this.removed = '';
  }

${removeBody}
}

module.exports = { Insert, Remove };
`;
}

function pyCommands(insertBody: string, removeBody: string): string {
  return `class Insert:
    """A command is a change that knows how to undo itself.

    Both commands are pure with respect to the document: \`apply\` takes the
    document and returns the new one. Nothing here holds the document, and
    nothing here knows a history exists.
    """

    def __init__(self, text):
        self.text = text

${insertBody}


class Remove:
    def __init__(self, count):
        self.count = count
        # What this command actually took out, remembered so it can be put
        # back. A command that only knows *how much* it removed cannot undo
        # itself.
        self.removed = ""

${removeBody}
`;
}

const JS_INSERT_TODO = `  apply(doc) {
    // TODO: return the document with this command's text added to the end.
    return doc;
  }

  revert(doc) {
    // Step 2. Leave it for now.
    return doc;
  }`;

const JS_INSERT_APPLY = `  apply(doc) {
    return doc + this.text;
  }

  revert(doc) {
    // Step 2. Leave it for now.
    return doc;
  }`;

const JS_INSERT_FULL = `  apply(doc) {
    return doc + this.text;
  }

  revert(doc) {
    return doc.slice(0, Math.max(0, doc.length - this.text.length));
  }`;

const JS_REMOVE_TODO = `  apply(doc) {
    // TODO: drop \`this.count\` characters from the end, and remember them.
    return doc;
  }

  revert(doc) {
    // Step 2. Leave it for now.
    return doc;
  }`;

const JS_REMOVE_APPLY = `  apply(doc) {
    const keep = Math.max(0, doc.length - this.count);
    this.removed = doc.slice(keep);
    return doc.slice(0, keep);
  }

  revert(doc) {
    // Step 2. Leave it for now.
    return doc;
  }`;

const JS_REMOVE_FULL = `  apply(doc) {
    const keep = Math.max(0, doc.length - this.count);
    this.removed = doc.slice(keep);
    return doc.slice(0, keep);
  }

  revert(doc) {
    return doc + this.removed;
  }`;

const PY_INSERT_TODO = `    def apply(self, doc):
        # TODO: return the document with this command's text added to the end.
        return doc

    def revert(self, doc):
        # Step 2. Leave it for now.
        return doc`;

const PY_INSERT_APPLY = `    def apply(self, doc):
        return doc + self.text

    def revert(self, doc):
        # Step 2. Leave it for now.
        return doc`;

const PY_INSERT_FULL = `    def apply(self, doc):
        return doc + self.text

    def revert(self, doc):
        return doc[: max(0, len(doc) - len(self.text))]`;

const PY_REMOVE_TODO = `    def apply(self, doc):
        # TODO: drop \`self.count\` characters from the end, and remember them.
        return doc

    def revert(self, doc):
        # Step 2. Leave it for now.
        return doc`;

const PY_REMOVE_APPLY = `    def apply(self, doc):
        keep = max(0, len(doc) - self.count)
        self.removed = doc[keep:]
        return doc[:keep]

    def revert(self, doc):
        # Step 2. Leave it for now.
        return doc`;

const PY_REMOVE_FULL = `    def apply(self, doc):
        keep = max(0, len(doc) - self.count)
        self.removed = doc[keep:]
        return doc[:keep]

    def revert(self, doc):
        return doc + self.removed`;

function jsHistory(run: string, undo: string, redo: string): string {
  return `/**
 * The invoker. It holds two stacks of commands and a document, and knows
 * nothing whatsoever about text — every change goes through a command.
 *
 * That is what makes the pattern worth the indirection: adding a "replace"
 * command later requires no change to this file at all.
 */
class History {
  constructor() {
    this.doc = '';
    // Commands already applied, newest last.
    this.done = [];
    // Commands taken back and available to reapply, newest last.
    this.undone = [];
  }

${run}

${undo}

${redo}

  text() {
    return this.doc;
  }

  depth() {
    return [this.done.length, this.undone.length];
  }
}

module.exports = { History };
`;
}

function pyHistory(run: string, undo: string, redo: string): string {
  return `class History:
    """The invoker. It holds two stacks of commands and a document, and knows
    nothing whatsoever about text - every change goes through a command.

    That is what makes the pattern worth the indirection: adding a "replace"
    command later requires no change to this file at all.
    """

    def __init__(self):
        self.doc = ""
        # Commands already applied, newest last.
        self.done = []
        # Commands taken back and available to reapply, newest last.
        self.undone = []

${run}

${undo}

${redo}

    def text(self):
        return self.doc

    def depth(self):
        return [len(self.done), len(self.undone)]
`;
}

const JS_RUN_TODO = `  run(command) {
    // TODO: apply the command to the document, and remember it so it can be
    // undone later.
  }`;

const JS_RUN_PLAIN = `  run(command) {
    this.doc = command.apply(this.doc);
    this.done.push(command);
  }`;

const JS_RUN_CLEARING = `  run(command) {
    this.doc = command.apply(this.doc);
    this.done.push(command);
    // A new command makes the undone branch unreachable: it was recorded
    // against a document that no longer exists. Keeping it would let a redo
    // replay a change on top of unrelated text.
    this.undone = [];
  }`;

const JS_UNDO_TODO = `  undo() {
    // Step 2. Leave it for now.
  }`;

const JS_UNDO = `  undo() {
    const command = this.done.pop();
    // Undoing with nothing to undo is a no-op, not an error. A user pressing
    // ctrl-Z one more time than there were changes has done nothing wrong.
    if (!command) return;
    this.doc = command.revert(this.doc);
    this.undone.push(command);
  }`;

const JS_REDO_TODO = `  redo() {
    // Step 3. Leave it for now.
  }`;

const JS_REDO = `  redo() {
    const command = this.undone.pop();
    if (!command) return;
    this.doc = command.apply(this.doc);
    this.done.push(command);
  }`;

const PY_RUN_TODO = `    def run(self, command):
        # TODO: apply the command to the document, and remember it so it can be
        # undone later.
        pass`;

const PY_RUN_PLAIN = `    def run(self, command):
        self.doc = command.apply(self.doc)
        self.done.append(command)`;

const PY_RUN_CLEARING = `    def run(self, command):
        self.doc = command.apply(self.doc)
        self.done.append(command)
        # A new command makes the undone branch unreachable: it was recorded
        # against a document that no longer exists. Keeping it would let a redo
        # replay a change on top of unrelated text.
        self.undone = []`;

const PY_UNDO_TODO = `    def undo(self):
        # Step 2. Leave it for now.
        pass`;

const PY_UNDO = `    def undo(self):
        # Undoing with nothing to undo is a no-op, not an error. A user pressing
        # ctrl-Z one more time than there were changes has done nothing wrong.
        if not self.done:
            return
        command = self.done.pop()
        self.doc = command.revert(self.doc)
        self.undone.append(command)`;

const PY_REDO_TODO = `    def redo(self):
        # Step 3. Leave it for now.
        pass`;

const PY_REDO = `    def redo(self):
        if not self.undone:
            return
        command = self.undone.pop()
        self.doc = command.apply(self.doc)
        self.done.append(command)`;

export const undoRedoChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'undo-redo',
  title: 'Command — Undo & Redo',
  category: 'design-patterns',
  difficulty: 'easy',
  summary: 'Make every change an object that knows how to take itself back.',
  topics: ['stacks-queues'],
  recommendedAfter: ['stacks-queues'],

  brief: `Undo is the feature that looks trivial and is not. The obvious approach —
snapshot the whole document after every keystroke — works until the document is
large, and then it is a memory leak with a keyboard shortcut.

The **Command pattern** inverts it. Instead of remembering *states*, you
remember *changes*, and you make each change an object that knows two things:
how to do itself, and how to take itself back. The history then needs to know
nothing about documents at all — it is two stacks and a loop.

You will build it across four steps:

1. commands that apply themselves
2. commands that revert themselves, and an undo stack
3. redo — the undo stack read backwards
4. the bug every first implementation has: what happens to redo when you undo,
   then type something new

Two editable files, and the split is the point. When you are done, open
\`history.js\` and notice it never mentions a string.`,

  steps: [
    {
      slug: 'commands-that-apply',
      title: 'Make every change a command',
      brief: `Start with the doing half.

Two commands, both operating on the document as a value: \`apply(doc)\` takes the
document and returns the new one.

- \`Insert(text)\` adds \`text\` to the end.
- \`Remove(n)\` drops \`n\` characters from the end — and **remembers what it
  removed**, in \`this.removed\`. It does not need that yet. It will in step 2,
  and capturing it at the moment of removal is the only time it is available.

Then \`History.run(command)\` applies a command and pushes it onto the \`done\`
stack.

\`\`\`
insert("he")     ->  "he"
insert("llo")    ->  "hello"
remove(3)        ->  "he"
\`\`\`

Removing more characters than there are should empty the document rather than
fail.`,
      hints: [
        '`apply` returns the new document rather than mutating one — that is why the commands can be tiny and why the history is the only thing holding state.',
        'For `Remove`, work out where the surviving text ends *first*, then use that one number twice: once to slice what stays, once to capture what goes.',
        '`const keep = Math.max(0, doc.length - this.count);` then `this.removed = doc.slice(keep)` and return `doc.slice(0, keep)`. The `Math.max` is what handles removing more than there is.',
      ],
      entryFile: 'harness',
      focus: 'commands',
      files: [
        {
          name: 'commands',
          starterCode: {
            javascript: jsCommands(JS_INSERT_TODO, JS_REMOVE_TODO),
            python: pyCommands(PY_INSERT_TODO, PY_REMOVE_TODO),
          },
          solution: {
            javascript: jsCommands(JS_INSERT_APPLY, JS_REMOVE_APPLY),
            python: pyCommands(PY_INSERT_APPLY, PY_REMOVE_APPLY),
          },
        },
        {
          name: 'history',
          starterCode: {
            javascript: jsHistory(JS_RUN_TODO, JS_UNDO_TODO, JS_REDO_TODO),
            python: pyHistory(PY_RUN_TODO, PY_UNDO_TODO, PY_REDO_TODO),
          },
          solution: {
            javascript: jsHistory(JS_RUN_PLAIN, JS_UNDO_TODO, JS_REDO_TODO),
            python: pyHistory(PY_RUN_PLAIN, PY_UNDO_TODO, PY_REDO_TODO),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS, python: PY_HARNESS },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'inserting appends to the end',
            args: [
              [
                ['insert', 'he'],
                ['insert', 'llo'],
              ],
            ],
            expected: ['he', 'hello'],
          },
          {
            name: 'removing drops from the end',
            args: [
              [
                ['insert', 'hello'],
                ['remove', 3],
              ],
            ],
            expected: ['hello', 'he'],
          },
          {
            name: 'removing more than there is empties the document',
            args: [
              [
                ['insert', 'ab'],
                ['remove', 5],
              ],
            ],
            expected: ['ab', ''],
          },
          {
            name: 'the document starts empty',
            args: [[['text']]],
            expected: [''],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'undo',
      title: 'Take it back',
      brief: `Now the undoing half.

Give each command a \`revert(doc)\` that returns the document to what it was
before that command applied — \`Insert\` drops what it added, \`Remove\` puts back
what it saved.

Then \`History.undo()\` pops the newest command off \`done\`, reverts the document
with it, and pushes it onto \`undone\` so step 3 can find it.

\`\`\`
insert("hello")   ->  "hello"
remove(3)         ->  "he"
undo()            ->  "hello"
\`\`\`

Undoing when there is nothing to undo must do nothing at all — not throw, not
empty the document. Someone holding ctrl-Z has not made a mistake.`,
      hints: [
        '`Remove.revert` is the reason step 1 asked you to save `this.removed`. Without it the command knows how many characters vanished but not which ones.',
        '`undo` is three lines and a guard: take the newest command off `done`, use it to revert the document, and keep it on `undone`.',
        'Check for an empty stack before you pop. In JavaScript an empty `pop()` gives `undefined` and calling `.revert` on it throws; in Python it raises outright.',
      ],
      entryFile: 'harness',
      focus: 'commands',
      files: [
        {
          name: 'commands',
          solution: {
            javascript: jsCommands(JS_INSERT_FULL, JS_REMOVE_FULL),
            python: pyCommands(PY_INSERT_FULL, PY_REMOVE_FULL),
          },
        },
        {
          name: 'history',
          solution: {
            javascript: jsHistory(JS_RUN_PLAIN, JS_UNDO, JS_REDO_TODO),
            python: pyHistory(PY_RUN_PLAIN, PY_UNDO, PY_REDO_TODO),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'undo takes back the last command',
            args: [
              [
                ['insert', 'ab'],
                ['insert', 'cd'],
                ['undo'],
              ],
            ],
            expected: ['ab', 'abcd', 'ab'],
          },
          {
            name: 'undoing a removal puts the text back',
            args: [
              [
                ['insert', 'hello'],
                ['remove', 3],
                ['undo'],
              ],
            ],
            expected: ['hello', 'he', 'hello'],
          },
          {
            name: 'undo with nothing to undo does nothing',
            args: [
              [
                ['undo'],
                ['text'],
              ],
            ],
            expected: ['', ''],
          },
          {
            name: 'undo all the way back, then once more',
            args: [
              [
                ['insert', 'a'],
                ['insert', 'b'],
                ['undo'],
                ['undo'],
                ['undo'],
              ],
            ],
            expected: ['a', 'ab', 'a', '', ''],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'redo',
      title: 'Put it back',
      brief: `Redo is undo read backwards, and it is why \`undo\` kept the command
rather than throwing it away.

\`History.redo()\` pops the newest command off \`undone\`, applies it again, and
pushes it back onto \`done\`.

\`\`\`
insert("hello")   ->  "hello"
remove(3)         ->  "he"
undo()            ->  "hello"
redo()            ->  "he"
\`\`\`

Redoing with nothing undone does nothing, for the same reason undo does.

Notice that \`Remove\` being reapplied captures what it removes all over again.
That is not an accident of this implementation — a command that recorded its
effect only once could not be replayed against a document that had changed.`,
      hints: [
        'It is `undo` with the two stacks swapped and `apply` instead of `revert`. If your version does not look like a mirror of it, it is probably doing too much.',
        'The command has to move back to `done`, or a second redo would replay the same change twice.',
        'Same empty-stack guard as `undo`. `redo` immediately after startup is a perfectly normal thing for a keyboard shortcut to trigger.',
      ],
      entryFile: 'harness',
      focus: 'history',
      files: [
        { name: 'commands' },
        {
          name: 'history',
          solution: {
            javascript: jsHistory(JS_RUN_PLAIN, JS_UNDO, JS_REDO),
            python: pyHistory(PY_RUN_PLAIN, PY_UNDO, PY_REDO),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'redo re-applies what was undone',
            args: [
              [
                ['insert', 'ab'],
                ['undo'],
                ['redo'],
              ],
            ],
            expected: ['ab', '', 'ab'],
          },
          {
            name: 'redoing a removal removes again',
            args: [
              [
                ['insert', 'hello'],
                ['remove', 3],
                ['undo'],
                ['redo'],
              ],
            ],
            expected: ['hello', 'he', 'hello', 'he'],
          },
          {
            name: 'redo with nothing undone does nothing',
            args: [
              [
                ['insert', 'a'],
                ['redo'],
              ],
            ],
            expected: ['a', 'a'],
          },
          {
            name: 'undo twice, redo twice',
            args: [
              [
                ['insert', 'a'],
                ['insert', 'b'],
                ['undo'],
                ['undo'],
                ['redo'],
                ['redo'],
              ],
            ],
            expected: ['a', 'ab', 'a', '', 'a', 'ab'],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'a-new-command-cuts-the-branch',
      title: 'A new command cuts the branch',
      brief: `One case is still wrong, and every first implementation gets it wrong.

Undo something, then type something new. What should redo do?

\`\`\`
insert("a")   ->  "a"
insert("b")   ->  "ab"
undo()        ->  "a"
insert("c")   ->  "ac"
redo()        ->  ???
\`\`\`

Your version will happily replay \`Insert("b")\` and produce \`"acb"\` — a
document that never existed, assembled from two branches of history at once. The
undone command was recorded against a document that has since been replaced, so
it is no longer meaningful.

Editors resolve this by **cutting the branch**: running a new command discards
everything that was undone. Redo goes dead until the next undo.

\`depth()\` reports \`[undoable, redoable]\` and is already written. Use it to see
the redo stack disappear.`,
      hints: [
        'The fix is one line, and it is in `run` — not in `redo`. Guarding inside `redo` would leave the stale commands sitting there, and `depth` would keep reporting them.',
        'Think about when an undone command stops being valid: the moment the document it was recorded against is no longer the document you have.',
        '`this.undone = []` at the end of `run`. Python: `self.undone = []`.',
      ],
      entryFile: 'harness',
      focus: 'history',
      complexity: {
        time: 'O(1) per command',
        space: 'O(commands) — but proportional to the size of each change, not the document',
        note: 'This is the whole argument for the pattern over snapshotting. Snapshots cost the size of the document per change; commands cost the size of the change. For a large document edited one keystroke at a time, that is the difference between a few bytes per undo and a few megabytes.',
      },
      files: [
        { name: 'commands' },
        {
          name: 'history',
          solution: {
            javascript: jsHistory(JS_RUN_CLEARING, JS_UNDO, JS_REDO),
            python: pyHistory(PY_RUN_CLEARING, PY_UNDO, PY_REDO),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'a new command discards the redo stack',
            args: [
              [
                ['insert', 'a'],
                ['insert', 'b'],
                ['undo'],
                ['insert', 'c'],
                ['redo'],
                ['text'],
              ],
            ],
            expected: ['a', 'ab', 'a', 'ac', 'ac', 'ac'],
          },
          {
            name: 'depth reports an empty redo stack after a new command',
            args: [
              [
                ['insert', 'a'],
                ['undo'],
                ['insert', 'b'],
                ['depth'],
              ],
            ],
            expected: ['a', '', 'b', [1, 0]],
          },
          {
            name: 'depth still reports what can be redone',
            args: [
              [
                ['insert', 'a'],
                ['insert', 'b'],
                ['undo'],
                ['depth'],
              ],
            ],
            expected: ['a', 'ab', 'a', [1, 1]],
          },
          {
            name: 'undo still works after the branch was cut',
            args: [
              [
                ['insert', 'a'],
                ['undo'],
                ['insert', 'b'],
                ['redo'],
                ['undo'],
                ['text'],
              ],
            ],
            expected: ['a', '', 'b', 'b', '', ''],
            hidden: true,
          },
        ],
      },
    },
  ],
};
