# GetCracked

Interactive DSA, System Design labs, and company-wise interview prep.
Build real systems. Step by step. In your browser.

- **Product spec:** [docs/getcracked-prd.md](docs/getcracked-prd.md)
- **Stack decisions:** [docs/adr/0001-stack.md](docs/adr/0001-stack.md)
- **Plan and tasks:** [tasks/plan.md](tasks/plan.md) · [tasks/todo.md](tasks/todo.md)

---

## Getting started

Requires Node 22+, [pnpm](https://pnpm.io), and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:setup      # starts services, migrates, seeds
pnpm dev
```

Open <http://localhost:3000>.

---

## Local services

`docker-compose.yml` runs the local equivalents of the managed services used in
production. **Ports are deliberately offset from the defaults** so this stack
coexists with other projects rather than fighting them for a port.

| Service | Local port | Production | Used by |
|---|---|---|---|
| Postgres 17 | `5433` | [Neon](https://neon.tech) | Everything (schema in `src/db/schema.ts`) |
| Redis | `6380` | [Upstash](https://upstash.com) | Nothing yet — arrives with L9 assistant rate limits |
| Redis HTTP proxy | `8080` | Upstash REST API | Speaks Upstash's protocol so `@upstash/redis` works locally |

Postgres is pinned to 17 to match Neon's major version: a local/production major
mismatch is how a migration passes locally and fails on deploy.

```bash
pnpm services:up      # start (waits for healthchecks)
pnpm services:down    # stop
pnpm services:reset   # destroy volumes and start clean
```

---

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | Full test suite |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm lint` · `pnpm typecheck` | Lint and typecheck |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed the dev user (idempotent) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:setup` | Services + migrate + seed, from nothing |

---

## Testing

Database tests run against **embedded Postgres (PGlite)**, not the Docker
container and not mocks. They exercise the same migrations, constraints, and
cascades that run against Neon, but need no running service — so they cannot
silently stop running in CI, which is exactly when constraint regressions slip
through.

The Docker Postgres is for running the app, not the test suite.

---

## Layout

```
src/app/          routes (App Router)
src/db/           schema, client, seed
src/lib/runtime/  code execution + trace capture (T0.2 spike quality)
db/migrations/    generated SQL migrations
docs/             PRD, ADRs, spike writeups
tasks/            implementation plan and checklist
tests/            vitest suites
```
