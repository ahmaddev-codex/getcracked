/**
 * Lists Groq's live model catalog (L1).
 *
 * The PRD requires the model to be chosen against the catalog *at
 * implementation time* rather than from memory, because provider line-ups turn
 * over fast enough that a name written into a plan is usually wrong by the time
 * it ships. This is that check, kept as a script so it can be re-run whenever
 * the choice is revisited.
 *
 * Reads the key from the environment and never prints it.
 *
 *   pnpm groq:models
 */
interface GroqModel {
  id: string;
  owned_by?: string;
  active?: boolean;
  context_window?: number;
  max_completion_tokens?: number;
}

async function main(): Promise<void> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error('GROQ_API_KEY is not set. Add it to .env and re-run.');
    process.exit(1);
  }

  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.error(`Groq returned ${res.status}. The key may be invalid or rate limited.`);
    process.exit(1);
  }

  const body = (await res.json()) as { data?: GroqModel[] };
  const models = (body.data ?? []).filter((m) => m.active !== false);

  models.sort((a, b) => (b.context_window ?? 0) - (a.context_window ?? 0));

  console.log(`${models.length} active models\n`);
  console.log('id'.padEnd(46), 'context'.padStart(9), 'max out'.padStart(9), ' owner');
  for (const model of models) {
    console.log(
      model.id.padEnd(46),
      String(model.context_window ?? '—').padStart(9),
      String(model.max_completion_tokens ?? '—').padStart(9),
      ' ' + (model.owned_by ?? '—'),
    );
  }
}

void main();
