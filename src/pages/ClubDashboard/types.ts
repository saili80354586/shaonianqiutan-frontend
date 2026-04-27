export type CoachRole = 'head_coach' | 'assistant' | 'goalkeeper_coach' | 'fitness_coach' | 'team_manager';

export const COACH_ROLE_LABELS: Record<CoachRole, string> = {
  head_coach: '主教练',
  assistant: '助理教练',
  goalkeeper_coach: '守门员教练',
  fitness_coach: '体能教练',
  team_manager: '领队',
};

export interface Coach {
  id: number;
  userId: number;
  name: string;
  avatar?: string;
  phone?: string;
  role: CoachRole;
  roleLabel: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface Player {
  id: number;
  userId?: number;
  name: string;
  avatar?: string;
  age: number;
  birthDate: string;
  gender: 'male' | 'female';
  position: string;
  jerseyNumber: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  parentName?: string;
  reportCount: number;
  avgScore?: number;
  isRegistered: boolean;
}

export interface SeasonArchive {
  id: number;
  seasonName: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  matchCount?: number;
  weeklyCount?: number;
  testCount?: number;
}
