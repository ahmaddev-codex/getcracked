import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Applies migrations as part of a deployment's build.
 *
 * **Why here and not in GitHub Actions.** The workflow does not deploy — it
 * lints, typechecks, tests and builds, and Vercel deploys from its own Git
 * integration. A migration run from Actions would race the deployment it is
 * meant to precede, so the only place with a guaranteed ordering is the build
 * command Vercel itself runs.
 *
 * **The risk this is shaped around: a preview deployment migrating production.**
 * Vercel environment variables are commonly set for every environment at once,
 * so unless something stops it, every pull-request build would run migrations
 * against whatever `DATABASE_URL` resolves to — usually the live database. That
 * turns an unreviewed branch into a schema change on production.
 *
 * So the decision is made explicitly rather than by whether a URL happens to be
 * present:
 *
 * | Where | Runs? | Why |
 * |---|---|---|
 * | Vercel, production | yes | The deployment that is about to serve traffic |
 * | Vercel, preview | only with `MIGRATE_PREVIEW=1` | Safe when the preview has its *own* database, dangerous when it shares production's |
 * | Not Vercel (local, CI) | yes | Disposable databases, and it proves the migrations still apply |
 * | No `DATABASE_URL` | no, and succeeds | A build without a database is a normal thing to do |
 *
 * **Ordering caveat, stated because it is not solved here.** Migrations run
 * before the new code serves traffic, so the currently-live version briefly runs
 * against the new schema. That is fine for additive changes and breaks for
 * destructive ones — dropping a column the old code still selects takes the site
 * down until the deployment finishes. Removing something safely means two
 * deploys: stop using it, then drop it.
 */

type Decision = { run: true; because: string } | { run: false; because: string };

export function decide(env: NodeJS.ProcessEnv): Decision {
  if (!env.DATABASE_URL) {
    return { run: false, because: 'DATABASE_URL is not set — nothing to migrate' };
  }

  // Vercel sets this to production | preview | development.
  const vercelEnv = env.VERCEL_ENV;

  if (!vercelEnv) {
    return { run: true, because: 'not a Vercel build — local or CI database' };
  }
  if (vercelEnv === 'production') {
    return { run: true, because: 'production deployment' };
  }
  if (env.MIGRATE_PREVIEW === '1') {
    return { run: true, because: `${vercelEnv} deployment with MIGRATE_PREVIEW=1` };
  }

  return {
    run: false,
    because:
      `${vercelEnv} deployment — skipped so a branch build cannot migrate the ` +
      'database production is using. Set MIGRATE_PREVIEW=1 on this deployment ' +
      'if it has a database of its own',
  };
}

function main() {
  const decision = decide(process.env);

  if (!decision.run) {
    process.stdout.write(`· Migrations skipped: ${decision.because}\n`);
    return;
  }

  process.stdout.write(`· Migrating: ${decision.because}\n`);

  try {
    // Inherited stdio so drizzle-kit's own output lands in the build log, which
    // is the only place anyone will look when a deployment fails here.
    execFileSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit' });
  } catch {
    process.stderr.write(
      '\n✗ Migrations failed, so the build is stopped.\n' +
        '  Deploying anyway would ship code against a schema it does not have —\n' +
        '  which is the failure this step exists to prevent, arriving later and\n' +
        '  as a 500 on whichever route writes a row first.\n',
    );
    process.exit(1);
  }

  process.stdout.write('✓ Migrations applied\n');
}

/**
 * Only when run directly.
 *
 * An `NODE_ENV !== 'test'` guard was the first attempt and does not hold: a test
 * runner that has not set it — or any other importer — executes the migration
 * as an import side effect. Comparing the module URL to the entry path is the
 * thing that is actually true.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
