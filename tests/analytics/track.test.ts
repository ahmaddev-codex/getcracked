import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTrackingForTests, track } from '@/lib/analytics/track';

/**
 * The event transport (F6).
 *
 * **The bug this exists for.** Analytics used `navigator.sendBeacon`, which
 * returns `true` the moment a request is *queued* — a content blocker kills it
 * afterwards, at the network layer, where nothing observable happens. So the
 * "stop sending after the first failure" rule silently never fired, and a
 * blocked browser logged `ERR_BLOCKED_BY_CLIENT` to the console for every event
 * for the whole session.
 *
 * `fetch` with `keepalive` survives a page unload just as well — that is what
 * `keepalive` is for — and its failure is observable, which is the entire point.
 */

beforeEach(() => {
  resetTrackingForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A blocker rejects before any response exists. */
function blockedFetch() {
  const fetchMock = vi.fn(async () => {
    throw new TypeError('Failed to fetch');
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function respondingFetch(status: number) {
  const fetchMock = vi.fn(async () => new Response(null, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The transport is fire-and-forget, so its promise settles a tick later. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('sending', () => {
  it('posts to the events endpoint with keepalive', async () => {
    const fetchMock = respondingFetch(202);

    track('page_view');
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/events');
    expect(init.method).toBe('POST');
    // Without this the request dies when the page navigates away, which is the
    // whole reason a beacon was used here originally.
    expect(init.keepalive).toBe(true);
  });

  it('carries the event name and the current route', async () => {
    const fetchMock = respondingFetch(202);

    track('exercise_solved', { exerciseId: 'problems/two-sum' });
    await settle();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.name).toBe('exercise_solved');
    expect(body.props).toEqual({ exerciseId: 'problems/two-sum' });
    expect(typeof body.route).toBe('string');
  });
});

describe('when a content blocker is in the way', () => {
  it('stops sending for the rest of the session after one failure', async () => {
    const fetchMock = blockedFetch();

    track('page_view');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The property that was broken: every later event used to be attempted too,
    // logging a console error each time.
    track('page_view');
    track('exercise_started');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never throws into the caller', async () => {
    blockedFetch();
    // Analytics failing is not a reason for a learner's page to break, and
    // `track` is called from render paths and event handlers alike.
    expect(() => track('page_view')).not.toThrow();
    await settle();
  });
});

describe('when the server answers', () => {
  it.each([
    ['a rate limit', 429],
    ['a refused event name', 400],
    ['a server error', 500],
  ])('keeps sending after %s', async (_case, status) => {
    // The request arrived, so the transport works. Killing analytics for the
    // session over one refused event would lose far more than the event.
    const fetchMock = respondingFetch(status);

    track('page_view');
    await settle();
    track('page_view');
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
