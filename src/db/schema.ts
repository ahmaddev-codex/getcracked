import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Database schema — user-owned state only.
 *
 * Per AD-1, content (lessons, problems, challenges, concepts) lives in the repo
 * as typed modules, not here. Every `exerciseId` below is a content slug, not a
 * foreign key: the database never becomes the source of truth for curriculum.
 */

/** PRD H1 launch set. Java is suspended, not cancelled — hence its absence. */
export const languageEnum = pgEnum('language', ['python', 'javascript']);

/** PRD §7.2.1's three tiers. One runnable unit, tier is metadata (AD-7). */
export const tierEnum = pgEnum('tier', ['lesson', 'problem', 'challenge']);

export const progressStateEnum = pgEnum('progress_state', [
  'not_started',
  'in_progress',
  'complete',
]);

/**
 * Auth tables — reconciled against Better Auth v1.7.2 (T0.4).
 *
 * Field names and constraints verified directly against
 * `@better-auth/core/dist/db/get-tables.mjs` rather than documentation, because
 * the docs page does not render its field tables.
 *
 * The adapter is configured with `usePlural: true`; snake_case columns are its
 * default. So this keeps the plural, snake_case convention the app tables use
 * instead of splitting the database across two naming styles.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  // Better Auth declares `name` required and always supplies it on sign-up.
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      // A deleted account must not leave live sessions behind.
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

/**
 * Per-user progress on one runnable exercise in one language.
 *
 * Named `exercise_progress` rather than the plan's `challenge_progress`: AD-7
 * unified lessons, problems, and challenges onto one runnable unit, so a name
 * mentioning only one of the three tiers would misdescribe two of them.
 *
 * State is derived server-side from real test results (B21) — never written
 * from a client claim. This is a data-integrity requirement, not access
 * control: nothing on the platform is locked (PRD §6.6).
 */
export const exerciseProgress = pgTable(
  'exercise_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Content slug, e.g. `problems/hashing/two-sum`. Not a foreign key (AD-1). */
    exerciseId: text('exercise_id').notNull(),
    tier: tierEnum('tier').notNull(),
    language: languageEnum('language').notNull(),
    state: progressStateEnum('state').notNull().default('not_started'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Progress is per language: solving in Python must not mark JavaScript done.
    unique('exercise_progress_user_exercise_language_key').on(
      t.userId,
      t.exerciseId,
      t.language,
    ),
    index('exercise_progress_user_idx').on(t.userId),
    index('exercise_progress_exercise_idx').on(t.exerciseId),
  ],
);

/**
 * Every submission, kept as history rather than overwritten.
 *
 * A learner returning to an exercise expects their last attempt back (A10), and
 * an append-only history also means a failed run can be compared against the
 * passing one — which the assistant's code review (L6) will want.
 */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    language: languageEnum('language').notNull(),
    code: text('code').notNull(),
    passed: boolean('passed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('submissions_user_exercise_idx').on(t.userId, t.exerciseId, t.language),
  ],
);

/**
 * Append-only analytics log (PRD F6).
 *
 * `userId` is nullable and set null on account deletion so aggregate history
 * survives a single account being removed — anonymising rather than cascading
 * keeps the aggregate honest without retaining the person.
 *
 * It is *also* nullable because signed-out visitors are tracked by `deviceId`
 * instead (F6 tier two). Exactly one of the two is always present; the pair is
 * what lets an anonymous funnel be joined to an account at sign-up (A15).
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    /**
     * Rotating anonymous identifier for a signed-out visitor (A16). Client
     * generated, never derived from anything about the person, and rotated so
     * it cannot accumulate into a long-term profile. Kept on signed-in events
     * too, so a learner's pre-signup funnel can be joined at migration (A15).
     */
    deviceId: text('device_id'),
    name: text('name').notNull(),
    route: text('route'),
    props: jsonb('props').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_name_created_idx').on(t.name, t.createdAt),
    index('events_user_idx').on(t.userId),
    index('events_device_idx').on(t.deviceId),
  ],
);

/**
 * One authentication method linked to a user (password, OAuth provider).
 *
 * `issuer` is Better Auth's namespace for the method — `local:credential` for
 * passwords, `local:oauth:<provider>` otherwise — and it is unique with
 * `accountId` so the same external identity cannot be linked twice.
 */
export const accounts = pgTable(
  'accounts',
  {
    // `text`, not `uuid`: Better Auth mints its own opaque string ids
    // (e.g. "Sm0p34PGMJV90YjX5C6TqCppBOFHhDnC") and a uuid column rejects them
    // at insert. Same reason `users.id` and `sessions.id` are text.
    id: text('id').primaryKey(),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    /** Password hash for credential accounts. Never returned to a client. */
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('accounts_issuer_account_id_key').on(t.issuer, t.accountId),
    index('accounts_user_id_idx').on(t.userId),
  ],
);

/**
 * Short-lived verification tokens (email confirmation, password reset).
 *
 * Deliberately not linked to `users`: a token may be issued for an address that
 * has no account yet, so a foreign key here would reject the signup flow it
 * exists to support.
 */
export const verifications = pgTable(
  'verifications',
  {
    /** Text for the same reason as `accounts.id` — Better Auth supplies it. */
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ExerciseProgress = typeof exerciseProgress.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type AnalyticsEvent = typeof events.$inferSelect;
