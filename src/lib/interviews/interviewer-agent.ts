import type {
  CandidateScorecard,
  InterviewStage,
  InterviewerMessage,
  MockTrack,
} from './types';

export function getInitialGreeting(track: MockTrack): InterviewerMessage {
  const firstStage = track.stages[0];
  const isDsa = track.kind === 'dsa';

  const text = isDsa
    ? `Hello, and welcome to your technical coding round. I'll be your interviewer today. We have ${track.durationMinutes} minutes scheduled. Our first step is "${firstStage?.name ?? 'Clarification'}" (${firstStage?.budgetMinutes ?? 5} min). Take a moment to review the problem prompt, check the constraints, and let me know how you plan to approach it before coding.`
    : `Welcome to your System Design architectural review. I'll be conducting this round. We have ${track.durationMinutes} minutes. Let's start with "${firstStage?.name ?? 'Requirements'}" (${firstStage?.budgetMinutes ?? 8} min). Let's establish our core functional and non-functional requirements, and estimate our QPS and storage scale.`;

  return {
    id: 'msg-greeting',
    sender: 'interviewer',
    text,
    timestamp: Date.now(),
    quickReplies: isDsa
      ? [
          'Understood, checking input constraints.',
          'Can I assume the input array is sorted?',
          'What are the memory limits?',
        ]
      : [
          'Understood, defining functional requirements.',
          'Let\'s calculate QPS and peak traffic multiplier.',
          'What is the read-to-write ratio?',
        ],
  };
}

export function getStageTransitionMessage(stage: InterviewStage): InterviewerMessage {
  return {
    id: `msg-stage-${stage.id}`,
    sender: 'interviewer',
    text: `Moving into **${stage.name}** (Target budget: ${stage.budgetMinutes} minutes).\n\n**Objective**: ${stage.objective}`,
    timestamp: Date.now(),
    quickReplies: [
      'On it, proceeding with this stage.',
      'Could you give a hint on optimal direction?',
      'Let me summarize my current progress.',
    ],
  };
}

export function getInterviewerResponse(
  candidateText: string,
  track: MockTrack,
  currentStageIndex: number,
): InterviewerMessage {
  const lower = candidateText.toLowerCase();
  let replyText = '';
  let quickReplies: string[] = [];

  if (lower.includes('hint')) {
    if (track.kind === 'dsa') {
      replyText =
        'Hint: Consider how an in-memory lookup table (like a Hash Map) allows you to check whether the required complement has already been seen in a single O(1) operation, turning a nested O(n²) search into a single O(n) pass.';
      quickReplies = ['Makes sense, implementing the Hash Map.', 'What about space complexity?'];
    } else {
      replyText =
        'Hint: Start by decoupling the synchronous web tier from slow background operations using an asynchronous message buffer (e.g. Queue or Pub/Sub), and add an in-memory caching layer (Redis) to intercept repetitive read traffic.';
      quickReplies = ['Adding Cache-Aside and Message Queue.', 'How should we handle database writes?'];
    }
  } else if (lower.includes('sorted') || lower.includes('sort')) {
    replyText =
      'Good question. You cannot assume the input is pre-sorted unless specified. If you choose to sort it yourself, remember that will add an O(n log n) time cost to your solution.';
    quickReplies = ['Got it, aiming for O(n) without sorting.', 'Understood.'];
  } else if (lower.includes('complexity') || lower.includes('o(n)')) {
    replyText =
      'Excellent focus. Walk me through the mathematical space complexity as well: does your auxiliary structure scale linearly with the unique elements in the input?';
    quickReplies = ['Yes, auxiliary space is O(n) worst-case.', 'Space is bounded O(1).'];
  } else if (lower.includes('qps') || lower.includes('scale')) {
    replyText =
      'Right on target. If peak traffic is 5x the daily average, your ingress tier and database connection pools must handle the burst without thread exhaustion. How will you shed or queue excess load?';
    quickReplies = ['Deploy Token Bucket rate limiting.', 'Buffer bursts into a durable queue.'];
  } else {
    // Stage-specific contextual follow up
    if (currentStageIndex === 0) {
      replyText =
        'Your clarification points are sound. When you feel ready, outline your high-level approach and complexity targets so we can transition into implementation.';
      quickReplies = ['Ready to begin implementation.', 'Let me double-check one edge case.'];
    } else if (currentStageIndex === 1) {
      replyText =
        'Your architecture and implementation are shaping up. Keep an eye on modularity and boundary conditions. Be prepared to dry-run edge cases.';
      quickReplies = ['Running tests now.', 'Checking empty and single-element bounds.'];
    } else {
      replyText =
        'Good progress. Let\'s evaluate failure modes: what component in your design would fail first if traffic suddenly jumped by 10x?';
      quickReplies = ['The primary database disk IOPS.', 'The cache layer during eviction.', 'The ingress gateway connection pool.'];
    }
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'interviewer',
    text: replyText,
    timestamp: Date.now(),
    quickReplies: quickReplies.length > 0 ? quickReplies : ['Understood, continuing.', 'Next step.'],
  };
}

export function generateCandidateScorecard(
  track: MockTrack,
  elapsedSeconds: number,
  allTestsPassed: boolean,
  hintsUsed: number,
): CandidateScorecard {
  const targetSeconds = track.durationMinutes * 60;
  const onTime = elapsedSeconds <= targetSeconds;

  // Base ratings calculation
  let problemSolving = allTestsPassed ? 5 : 3;
  const architectureOrCode = allTestsPassed ? 5 : 3;
  let communication = 4;
  const verification = allTestsPassed ? 5 : 2;

  if (hintsUsed > 2) {
    problemSolving = Math.max(2, problemSolving - 1);
  }
  if (!onTime) {
    communication = Math.max(2, communication - 1);
  }

  const strengths: string[] = [];
  const growthAreas: string[] = [];
  const recommended10DSpecs: string[] = [];

  if (allTestsPassed) {
    strengths.push('Clean algorithmic correctness passing all edge cases.');
    strengths.push('Accurate complexity awareness with optimal runtime execution.');
  } else {
    growthAreas.push('Boundary testing: Ensure empty and extreme value inputs are validated early.');
  }

  if (onTime) {
    strengths.push(`Excellent pacing: Finished inside the ${track.durationMinutes}-minute time budget.`);
  } else {
    growthAreas.push(`Time management: Spent ${(elapsedSeconds / 60).toFixed(1)} mins vs ${track.durationMinutes} min budget.`);
  }

  if (track.kind === 'dsa') {
    recommended10DSpecs.push('cache-aside', 'rate-limiting');
  } else {
    recommended10DSpecs.push('load-balancer', 'cache-aside', 'message-queue', 'circuit-breaker');
  }

  const overallFeedback = allTestsPassed && onTime
    ? 'Strong Hire: Candidate demonstrated Staff-level clarity, structured stage management, and clean implementation with proactive edge case verification.'
    : 'Lean Hire: Candidate showed solid foundational understanding and technical grasp, but should focus on tighter time budgeting and proactive self-directed testing.';

  return {
    trackId: track.id,
    trackTitle: track.title,
    kind: track.kind,
    durationSeconds: elapsedSeconds,
    targetMinutes: track.durationMinutes,
    ratings: {
      problemSolving,
      architectureOrCode,
      communication,
      verification,
    },
    overallFeedback,
    strengths,
    growthAreas,
    recommended10DSpecs,
  };
}
