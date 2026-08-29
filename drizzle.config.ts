import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Only needed for push/studio; `generate` works without a live connection.
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/getcracked',
  },
  strict: true,
  verbose: true,
});
