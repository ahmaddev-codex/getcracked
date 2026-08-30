import { LessonSection } from './LessonSection';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import type { Challenge, Lesson } from '@/content/schema';

/**
 * The "build it" bridge (C6).
 *
 * The PRD calls this the key differentiator, and on the System Design track it
 * is the whole argument for the platform: everywhere else teaches system design
 * as prose, and the claim here is that you can go and *write* the thing. A
 * lesson on rate limiting that ends by handing you a rate limiter to build is
 * that claim made good; a lesson that ends with a summary is the same article
 * everyone else has.
 *
 * It reads differently from the "practise it" handoff above it, and should. A
 * problem is ten minutes on one function; a build is an evening across several
 * files, so the copy names the commitment rather than pretending they are the
 * same size of ask.
 *
 * **Nothing is locked** (§6.6). This is a recommendation like every other
 * relation on the platform — the builds are reachable from the catalog whether
 * or not the lesson was read, and reading it grants nothing.
 */
export function BuildItBridge({
  lesson,
  challenges,
}: {
  lesson: Lesson;
  challenges: readonly Challenge[];
}) {
  if (challenges.length === 0) return null;

  return (
    <LessonSection title="Build it">
      <p className="mb-3 text-sm text-foreground-muted">
        {lesson.track === 'system-design'
          ? // The differentiator, stated plainly where it is being delivered.
            'You have read how it works. This is where you write one — across several files, one rule at a time, run against tests in your browser.'
          : 'The problems above are one function each. These assemble the same ideas into a working thing across several files.'}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {challenges.map((challenge) => (
          <li key={challenge.slug}>
            {/* Emphasised: this is one suggested next step, not a listing. */}
            <ChallengeCard challenge={challenge} tone="strong" />
          </li>
        ))}
      </ul>
    </LessonSection>
  );
}
