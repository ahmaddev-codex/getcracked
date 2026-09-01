import type { CandidateScorecard } from '@/lib/interviews/types';

export interface SpacedReviewRecord {
  problemSlug: string;
  box: number; // Leitner box 1-5
  lastReviewedAt: number;
  nextReviewAt: number;
  reviewCount: number;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface UserPersonalizationData {
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string; // YYYY-MM-DD
  };
  reviews: Record<string, SpacedReviewRecord>;
  mockScorecards: CandidateScorecard[];
  activeStudyPlanId?: string;
  activityHistory: Record<string, number>; // date -> count
}

const STORAGE_KEY = 'getcracked_personalization_v1';

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]!;
}

function getDefaultData(): UserPersonalizationData {
  return {
    streak: {
      current: 1,
      longest: 1,
      lastActiveDate: getTodayDateString(),
    },
    reviews: {},
    mockScorecards: [],
    activeStudyPlanId: 'fast-sprint-14',
    activityHistory: {
      [getTodayDateString()]: 1,
    },
  };
}

export function loadPersonalizationData(): UserPersonalizationData {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData = getDefaultData();
      savePersonalizationData(defaultData);
      return defaultData;
    }
    return JSON.parse(raw) as UserPersonalizationData;
  } catch {
    return getDefaultData();
  }
}

export function savePersonalizationData(data: UserPersonalizationData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Graceful ignore on quota or permission errors
  }
}

export function recordActivity(count = 1): UserPersonalizationData {
  const data = loadPersonalizationData();
  const today = getTodayDateString();

  const currentCount = data.activityHistory[today] ?? 0;
  data.activityHistory[today] = currentCount + count;

  // Calculate streak
  if (data.streak.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.streak.lastActiveDate === yesterdayStr) {
      data.streak.current += 1;
    } else {
      data.streak.current = 1;
    }

    if (data.streak.current > data.streak.longest) {
      data.streak.longest = data.streak.current;
    }
    data.streak.lastActiveDate = today;
  }

  savePersonalizationData(data);
  return data;
}

export function saveMockScorecard(scorecard: CandidateScorecard): void {
  const data = loadPersonalizationData();
  data.mockScorecards.unshift(scorecard);
  recordActivity(2);
  savePersonalizationData(data);
}
