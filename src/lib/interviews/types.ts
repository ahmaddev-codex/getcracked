export type InterviewKind = 'dsa' | 'system-design';
export type CandidateLevel = 'L4' | 'L5' | 'L6+';

export interface InterviewStage {
  id: string;
  name: string;
  budgetMinutes: number;
  objective: string;
}

export interface MockTrack {
  id: string;
  slug: string;
  title: string;
  kind: InterviewKind;
  targetLevel: CandidateLevel;
  durationMinutes: number;
  description: string;
  stages: InterviewStage[];
  problemSlugs?: string[]; // for DSA
  labSlug?: string; // for System Design
}

export interface InterviewerMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
  quickReplies?: string[];
}

export interface MockScorecardRatings {
  problemSolving: number; // 1 to 5
  architectureOrCode: number; // 1 to 5
  communication: number; // 1 to 5
  verification: number; // 1 to 5
}

export interface CandidateScorecard {
  trackId: string;
  trackTitle: string;
  kind: InterviewKind;
  durationSeconds: number;
  targetMinutes: number;
  ratings: MockScorecardRatings;
  overallFeedback: string;
  strengths: string[];
  growthAreas: string[];
  recommended10DSpecs: string[];
}
