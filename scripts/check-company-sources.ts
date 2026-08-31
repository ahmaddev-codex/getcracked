import { getCompanies, sourcesOf } from '../src/content/companies';

/**
 * Re-checks every source a company guide cites (D7 review trigger).
 *
 * **Why this is a separate script and not part of the content gate.** It makes
 * network requests, so it cannot run in `prebuild` — a flaky connection would
 * fail deploys, and a CI job that hits three companies' servers on every push is
 * rude. This runs on a cadence, or whenever someone reports a mismatch.
 *
 * What it can prove is liveness, not truth: a URL that 404s or redirects
 * elsewhere is definitely stale, but one that still returns 200 may have been
 * rewritten underneath the claim. So a clean run means "nothing is obviously
 * dead", and the `reviewed` date on each guide is still a human reading them.
 *
 * The first attempt at these guides cited a page that did not exist. This is the
 * cheap check that would have caught it.
 */

interface Finding {
  company: string;
  url: string;
  problem: string;
}

async function check(url: string): Promise<string | null> {
  try {
    // GET rather than HEAD: several career sites answer HEAD with 405 while
    // serving the page perfectly well, which would report a false failure.
    const response = await fetch(url, { redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      const to = response.headers.get('location') ?? 'somewhere unstated';
      return `redirects to ${to} — the claim may have moved or been retired`;
    }
    if (!response.ok) return `returns HTTP ${response.status}`;
    return null;
  } catch (error) {
    return `could not be fetched: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function main() {
  const findings: Finding[] = [];
  let checked = 0;

  for (const company of getCompanies()) {
    // Deduplicated: a source cited by three claims is one request, not three.
    const urls = [...new Set(sourcesOf(company).map((s) => s.url))];

    for (const url of urls) {
      checked++;
      const problem = await check(url);
      if (problem) findings.push({ company: company.name, url, problem });
    }
  }

  if (findings.length > 0) {
    process.stderr.write(`\n✗ ${findings.length} of ${checked} source(s) need re-verification:\n\n`);
    for (const f of findings) {
      process.stderr.write(`  ${f.company}\n    ${f.url}\n    ${f.problem}\n\n`);
    }
    process.stderr.write(
      'Pull the affected claims back to commonly-reported, or find a source that still\n' +
        'says what they say. Do not simply bump the reviewed date.\n',
    );
    process.exit(1);
  }

  process.stdout.write(`✓ All ${checked} company source(s) still resolve\n`);
}

void main();
