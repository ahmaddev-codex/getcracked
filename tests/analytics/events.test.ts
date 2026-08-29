import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from '../db/helpers';
import { recordEvent, MAX_PROPS_BYTES } from '@/lib/analytics/record';
import { isKnownEvent } from '@/lib/analytics/events';
import * as s from '@/db/schema';

let db: TestDb;
beforeEach(async () => {
  db = await createTestDb();
});

async function makeUser(id = 'u1') {
  await db.insert(s.users).values({ id, email: `${id}@e.com`, name: 'U' });
  return id;
}

describe('event name allowlist', () => {
  it('accepts a declared event', () => {
    expect(isKnownEvent('page_view')).toBe(true);
    expect(isKnownEvent('exercise_solved')).toBe(true);
  });

  it('rejects anything undeclared, because the endpoint is public', () => {
    expect(isKnownEvent('arbitrary_junk')).toBe(false);
    expect(isKnownEvent('')).toBe(false);
  });
});

describe('recordEvent', () => {
  it('records a signed-in event against the user', async () => {
    const userId = await makeUser();

    await recordEvent(db, { name: 'page_view', userId, deviceId: 'dev-1', route: '/' });

    const [row] = await db.select().from(s.events);
    expect(row.userId).toBe(userId);
    expect(row.deviceId).toBe('dev-1');
  });

  it('records a signed-out event against the device alone', async () => {
    await recordEvent(db, { name: 'page_view', deviceId: 'dev-2', route: '/learn' });

    const [row] = await db.select().from(s.events);
    expect(row.userId).toBeNull();
    expect(row.deviceId).toBe('dev-2');
  });

  it('refuses an event with neither a user nor a device', async () => {
    // An event attributable to nothing is noise that cannot be funnelled.
    await expect(recordEvent(db, { name: 'page_view' })).rejects.toThrow();
    expect(await db.select().from(s.events)).toHaveLength(0);
  });

  it('refuses an undeclared event name', async () => {
    await expect(
      recordEvent(db, { name: 'not_a_real_event', deviceId: 'dev-3' }),
    ).rejects.toThrow();
  });

  it('refuses oversized props rather than storing unbounded client input', async () => {
    const huge = { blob: 'x'.repeat(MAX_PROPS_BYTES + 1) };

    await expect(
      recordEvent(db, { name: 'page_view', deviceId: 'dev-4', props: huge }),
    ).rejects.toThrow();
  });

  it('stores structured props for later aggregation', async () => {
    await recordEvent(db, {
      name: 'test_run',
      deviceId: 'dev-5',
      props: { outcome: 'pass', language: 'javascript' },
    });

    const [row] = await db.select().from(s.events);
    expect(row.props).toEqual({ outcome: 'pass', language: 'javascript' });
  });
});

describe('linking an anonymous funnel to an account (A15)', () => {
  it('claims prior device events for the user who signs up', async () => {
    await recordEvent(db, { name: 'page_view', deviceId: 'dev-9', route: '/learn' });
    await recordEvent(db, { name: 'exercise_solved', deviceId: 'dev-9' });

    const userId = await makeUser('u2');
    const { claimDeviceEvents } = await import('@/lib/analytics/record');
    await claimDeviceEvents(db, 'dev-9', userId);

    const rows = await db.select().from(s.events).where(eq(s.events.userId, userId));
    expect(rows).toHaveLength(2);
    // Device id survives the claim so the pre-signup funnel stays reconstructable.
    expect(rows.every((r) => r.deviceId === 'dev-9')).toBe(true);
  });

  it('does not touch another device’s events', async () => {
    await recordEvent(db, { name: 'page_view', deviceId: 'dev-a' });
    await recordEvent(db, { name: 'page_view', deviceId: 'dev-b' });
    const userId = await makeUser('u3');

    const { claimDeviceEvents } = await import('@/lib/analytics/record');
    await claimDeviceEvents(db, 'dev-a', userId);

    const claimed = await db.select().from(s.events).where(eq(s.events.userId, userId));
    expect(claimed).toHaveLength(1);
    expect(claimed[0].deviceId).toBe('dev-a');
  });
});
