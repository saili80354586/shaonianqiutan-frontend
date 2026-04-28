export type HomepageSource = 'player' | 'club' | 'coach' | 'analyst' | 'scout' | 'system';

export interface PlayerHomepageProfile {
  id: number;
  nickname: string;
  displayName: string;
  realName?: string;
  avatar?: string;
  age?: number;
  ageGroup?: string;
  gender?: string;
  position?: string;
  secondPosition?: string;
  height?: number;
  weight?: number;
  dominantFoot?: string;
  province?: string;
  city?: string;
  school?: string;
  currentTeam?: string;
  startYear?: number;
  jerseyNumber?: number;
  jerseyColor?: string;
  faRegistered?: boolean;
  association?: string;
  playingStyle: string[];
  technicalTags: string[];
  mentalTags: string[];
  experiences: PlayerHomepageExperience[];
  profileCompleteness: number;
  updatedAt?: string;
}

export interface PlayerHomepageExperience {
  id?: string;
  period: string;
  team: string;
  position: string;
  achievement?: string;
}

export interface PlayerHomepageAffiliation {
  clubId?: number;
  clubName?: string;
  clubLogo?: string;
  clubMemberLevel?: string;
  teamId?: number;
  teamName?: string;
  ageGroup?: string;
  jerseyNumber?: string;
  position?: string;
  joinedAt?: string;
  status?: string;
}

export interface PlayerHomepageVisibility {
  profileVisible: boolean;
  showRealName: boolean;
  showSchool: boolean;
  showFamily: boolean;
  showReportDetails: boolean;
  canMessage: boolean;
  canInvite: boolean;
  canEdit: boolean;
}

export interface PlayerHomepageStats {
  followersCount: number;
  followingCount: number;
  reportsCount: number;
  completedReportsCount: number;
  averageReportRating: number;
  physicalTestCount: number;
  weeklyReportCount: number;
  matchCount: number;
  scoutReportsCount: number;
  postCount: number;
}

export interface PlayerHomepagePhysicalRecord {
  id: number;
  testDate: string;
  source: 'personal' | 'club';
  sourceLabel: string;
  clubName?: string;
  activityName?: string;
  recorderRole: 'player' | 'coach';
  height?: number;
  weight?: number;
  bmi?: number;
  sprint30m?: number;
  sprint50m?: number;
  sprint100m?: number;
  agilityLadder?: number;
  tTest?: number;
  shuttleRun?: number;
  standingLongJump?: number;
  verticalJump?: number;
  sitAndReach?: number;
  pushUp?: number;
  sitUp?: number;
  plank?: number;
}

export interface PlayerHomepageWeeklyReport {
  id: number;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  submitStatus: string;
  reviewStatus: string;
  selfAverage: number;
  coachAverage: number;
  reviewComment?: string;
  suggestions?: string;
  nextWeekFocus?: string;
}

export interface PlayerHomepageMatch {
  id: number;
  matchName: string;
  matchDate: string;
  opponent?: string;
  score?: string;
  result?: string;
  status?: string;
  teamName?: string;
  performance?: string;
  goals?: number;
  assists?: number;
  saves?: number;
  coachRating?: number;
  coachComment?: string;
}

export interface PlayerHomepageReport {
  id: number;
  createdAt: string;
  status: string;
  playerName?: string;
  playerPosition?: string;
  overallRating?: number;
  offenseRating?: number;
  defenseRating?: number;
  summary?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions?: string;
  potential?: string;
  analystName?: string;
}

export interface PlayerHomepageScoutReport {
  id: number;
  createdAt: string;
  status: string;
  scoutId: number;
  scoutUserId?: number;
  scoutName?: string;
  organization?: string;
  overallRating?: number;
  potentialRating?: string;
  strengths: string[];
  weaknesses: string[];
  technicalSkills?: Record<string, number | string>;
  summary?: string;
  recommendation?: string;
  targetClub?: string;
  views?: number;
  likes?: number;
  publishedAt?: string;
}

export interface PlayerHomepagePost {
  id: number;
  content: string;
  images: string[];
  roleTag?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface PlayerHomepageTimelineItem {
  id: string;
  type: 'physical_test' | 'weekly_report' | 'match' | 'report' | 'scout_report' | 'post';
  date: string;
  title: string;
  summary?: string;
  source: HomepageSource;
  sourceLabel: string;
}

export interface PlayerHomepageActions {
  canEdit: boolean;
  canFollow: boolean;
  canMessage: boolean;
  canInviteTrial: boolean;
  canCreateScoutReport: boolean;
}

export interface PlayerHomepageData {
  profile: PlayerHomepageProfile;
  affiliation: PlayerHomepageAffiliation;
  visibility: PlayerHomepageVisibility;
  stats: PlayerHomepageStats;
  physicalTests: {
    records: PlayerHomepagePhysicalRecord[];
    latest?: PlayerHomepagePhysicalRecord;
  };
  weeklyReports: {
    total: number;
    list: PlayerHomepageWeeklyReport[];
  };
  matches: {
    total: number;
    list: PlayerHomepageMatch[];
  };
  reports: {
    total: number;
    list: PlayerHomepageReport[];
  };
  scoutReports: {
    total: number;
    list: PlayerHomepageScoutReport[];
  };
  posts: {
    total: number;
    list: PlayerHomepagePost[];
  };
  timeline: PlayerHomepageTimelineItem[];
  social: {
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isMutual: boolean;
  };
  actions: PlayerHomepageActions;
}
