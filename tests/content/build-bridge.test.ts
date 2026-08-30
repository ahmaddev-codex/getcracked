import { describe, expect, it } from 'vitest';
import { getChallenges, getChallengesForTopic, getLessons } from '@/content/registry';

/**
 * The "build it" bridge (C6).
 *
 * The PRD calls this the key differentiator, and on the System Design track it
 * is the whole argument for the platform: everywhere else teaches system design
 * as prose, and the claim here is that you can go and write the thing. So the
 * property under test is that the claim is actually delivered somewhere on that
 * track, rather than being a component nothing ever renders.
 *
 * The relation itself is authored on the challenge, never matched on slugs —
 * `token-bucket` applies hashing and says so nowhere in its title, and
 * `lru-cache` is the build the caching lesson is *about* while sharing not one
 * word with it.
 */

describe('the relation', () => {
  it('names only lessons that exist', () => {
    // Already enforced by the content gate; asserted here so a contributor
    // running the suite finds a dead bridge without waiting for a build.
    const slugs = new Set(getLessons().map((l) => l.slug));
    for (const challenge of getChallenges()) {
      for (const topic of challenge.topics) {
        expect(slugs, `${challenge.slug} → ${topic}`).toContain(topic);
      }
    }
  });

  it('is symmetric: a topic finds every build that claims it', () => {
    for (const challenge of getChallenges()) {
      for (const topic of challenge.topics) {
        expect(getChallengesForTopic(topic).map((c) => c.slug)).toContain(challenge.slug);
      }
    }
  });

  it('reports nothing for a topic no build claims, rather than guessing', () => {
    // The bridge renders nothing at all in that case. A near-miss suggestion
    // would be worse than silence: it would send a learner to build something
    // the lesson did not teach.
    expect(getChallengesForTopic('bit-manipulation')).toEqual([]);
    expect(getChallengesForTopic('not-a-topic')).toEqual([]);
  });
});

describe('the System Design track', () => {
  const systemDesign = getLessons().filter((l) => l.track === 'system-design');

  it('actually delivers the differentiator somewhere', () => {
    // If this ever reads zero, C6 is a component that renders nowhere and the
    // "you can build it" claim is not being made on the track it was made for.
    const bridged = systemDesign.filter((l) => getChallengesForTopic(l.slug).length > 0);
    expect(bridged.length).toBeGreaterThan(0);
  });

  it('bridges caching and rate limiting, the two builds that exist for it', () => {
    // Named rather than counted, because these are the specific claims: an LRU
    // cache is the eviction policy the caching lesson describes, and a token
    // bucket is the limiter the rate-limiting lesson describes.
    expect(getChallengesForTopic('caching').map((c) => c.slug)).toContain('lru-cache');
    expect(getChallengesForTopic('rate-limiting').map((c) => c.slug)).toContain(
      'token-bucket',
    );
  });
});

describe('the DSA track', () => {
  it('bridges from the topics its builds apply', () => {
    expect(getChallengesForTopic('hashing').map((c) => c.slug)).toEqual(
      expect.arrayContaining(['lru-cache', 'token-bucket']),
    );
    expect(getChallengesForTopic('stacks-queues').map((c) => c.slug)).toContain('undo-redo');
  });
});
