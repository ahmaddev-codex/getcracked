import { getDb } from '../src/db/client';
import { seed, SEED_USER_EMAIL } from '../src/db/seed';

/** CLI wrapper: `pnpm db:seed`. The logic lives in src/db/seed.ts so it is testable. */
async function main() {
  await seed(getDb());
  process.stdout.write(`Seeded ${SEED_USER_EMAIL}\n`);
  process.exit(0);
}

main().catch((e: unknown) => {
  process.stderr.write(`Seed failed: ${String(e)}\n`);
  process.exit(1);
});
