import { describe, expect, it } from 'vitest';
import { getMockTrack, getMockTracks } from '@/lib/interviews/mock-tracks';
import {
  generateCandidateScorecard,
  getInitialGreeting,
  getInterviewerResponse,
  getStageTransitionMessage,
} from '@/lib/interviews/interviewer-agent';
import { findConcept } from '@/content/concepts';

describe('Phase 8: Mock Interviews Engine (Module E)', () => {
  it('registers all canonical mock interview tracks with valid stages', () => {
    const tracks = getMockTracks();
    expect(tracks.length).toBeGreaterThanOrEqual(4);

    for (const track of tracks) {
      expect(track.id).toBeDefined();
      expect(track.title.length).toBeGreaterThan(5);
      expect(track.durationMinutes).toBeGreaterThanOrEqual(30);
      expect(track.stages.length).toBeGreaterThanOrEqual(3);

      let totalBudget = 0;
      for (const stage of track.stages) {
        expect(stage.name.length).toBeGreaterThan(5);
        expect(stage.objective.length).toBeGreaterThan(15);
        expect(stage.budgetMinutes).toBeGreaterThan(0);
        totalBudget += stage.budgetMinutes;
      }
      expect(totalBudget).toBe(track.durationMinutes);

      if (track.kind === 'dsa') {
        expect(track.problemSlugs?.length).toBeGreaterThanOrEqual(2);
      } else {
        expect(track.labSlug).toBeDefined();
      }
    }
  });

  it('generates contextual Socratic greetings, stage transitions, and responses', () => {
    const track = getMockTrack('faang-dsa-standard')!;
    expect(track).toBeDefined();

    // Initial greeting
    const greeting = getInitialGreeting(track);
    expect(greeting.sender).toBe('interviewer');
    expect(greeting.text).toContain('technical coding round');
    expect(greeting.quickReplies?.length).toBeGreaterThan(0);

    // Stage transition
    const transition = getStageTransitionMessage(track.stages[1]!);
    expect(transition.text).toContain(track.stages[1]!.name);

    // Socratic response to hint request
    const hintResponse = getInterviewerResponse('Can I have a hint on the approach?', track, 1);
    expect(hintResponse.text.toLowerCase()).toContain('hint');

    // Socratic response to complexity question
    const complexityResponse = getInterviewerResponse('What complexity should I target?', track, 0);
    expect(complexityResponse.text.length).toBeGreaterThan(20);
  });

  it('evaluates candidate performance and produces scorecards with 10D recommendations', () => {
    const track = getMockTrack('sysdesign-core-45')!;
    const scorecard = generateCandidateScorecard(track, 2400, true, 0);

    expect(scorecard.ratings.problemSolving).toBeGreaterThanOrEqual(4);
    expect(scorecard.ratings.communication).toBeGreaterThanOrEqual(4);
    expect(scorecard.strengths.length).toBeGreaterThanOrEqual(2);
    expect(scorecard.recommended10DSpecs.length).toBeGreaterThanOrEqual(2);

    for (const specSlug of scorecard.recommended10DSpecs) {
      const concept = findConcept(specSlug);
      expect(concept).toBeDefined();
      expect(concept?.dimensions).toBeDefined();
    }
  });
});
