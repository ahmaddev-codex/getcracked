import { is } from 'drizzle-orm';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

/**
 * Verifies the database a deployment points at actually has the schema the code
 * assumes.
 *
 * **Why this exists.** Nothing in the pipeline runs migrations. `pnpm db:migrate`
 * is a manual step, so a deployment can point at an empty database, build
 * green, pass every check, and serve pages perfectly — right up until someone
 * signs in, at which point Better Auth tries to write a row and gets:
 *
 *     relation "verifications" does not exist   (42P01)
 *
 * That surfaced as a 500 on `/api/auth/sign-in/social` with no indication that
 * a migration was the missing piece. Typecheck, lint, tests, content gate and
 * chunk parse all passed, because none of them look at a live database — the
 * suite uses an ephemeral PGlite that is migrated from scratch every run, which
 * is exactly why it never caught this.
 *
 * The expected tables are read from the Drizzle schema rather than listed, so
 * this cannot drift: adding a table to `db/schema.ts` adds it here.
 *
 * Not part of `prebuild` — it needs a live connection, and a build should not
 * fail because a database was briefly unreachable. Run it against a deployment's
 * `DATABASE_URL` after deploying, or whenever something is behaving as though a
 * table is missing.
 */

function expectedTables(): string[] {
  // `is` rather than duck-typing: enums and helpers share this module, and
  // Drizzle's own brand check is the only reliable way to tell a table apart.
  return Object.values(schema)
    .filter((value) => is(value, PgTable))
    .map((table) => getTableConfig(table as PgTable).name)
    .sort();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    process.stderr.write(
      '✗ DATABASE_URL is not set.\n' +
        '  Point it at the deployment you want to check, e.g.\n' +
        '  DATABASE_URL="postgres://…" pnpm db:verify\n',
    );
    process.exit(1);
  }

  const expected = expectedTables();
  const sql = postgres(url, { max: 1 });

  try {
    const rows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public'
    `;
    const present = new Set(rows.map((r) => r.table_name));
    const missing = expected.filter((name) => !present.has(name));

    if (missing.length > 0) {
      process.stderr.write(
        `\n✗ ${missing.length} of ${expected.length} expected table(s) are missing:\n\n` +
          missing.map((name) => `    ${name}\n`).join('') +
          '\n  The migrations have not been applied to this database. Run:\n\n' +
          '    DATABASE_URL="<this database>" pnpm db:migrate\n\n' +
          '  Until then anything touching these tables answers 500 — sign-in first.\n',
      );
      process.exit(1);
    }

    process.stdout.write(`✓ All ${expected.length} expected table(s) present\n`);
  } catch (error) {
    // A connection failure is a different problem from a missing table, and
    // saying so saves someone checking their migrations when the host is wrong.
    process.stderr.write(
      `✗ Could not read the schema: ${error instanceof Error ? error.message : String(error)}\n` +
        '  This is a connection or permission problem, not a missing migration.\n',
    );
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
