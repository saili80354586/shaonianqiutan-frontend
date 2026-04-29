export type ActivityType = 'trial' | 'camp' | 'match' | 'exchange';

export interface ClubActivity {
  id: number;
  clubId: number;
  clubName?: string;
  clubLogo?: string;
  title: string;
  description?: string;
  coverImage?: string;
  type: ActivityType;
  province: string;
  city: string;
  address?: string;
  startTime: string;
  endTime?: string;
  registrationDeadline?: string;
  maxParticipants: number;
  currentParticipants: number;
  fee: number;
  feeType: 'free' | 'paid';
  ageMin?: number;
  ageMax?: number;
  positions?: string[];
  requirements?: string;
  contactName?: string;
  contactPhone?: string;
  publishStatus: 'draft' | 'published' | 'unpublished';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRegistration {
  id: number;
  activityId: number;
  userId: number;
  playerName?: string;
  playerAge?: number;
  playerPosition?: string;
  contactPhone?: string;
  remark?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityMapPoint {
  province: string;
  city: string;
  type: ActivityType;
  lng: number;
  lat: number;
  count: number;
  activities: {
    id: number;
    title: string;
    type: ActivityType;
    startTime: string;
  }[];
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; color: string; icon: string }> = {
  trial: { label: '试训', color: '#39ff14', icon: 'target' },
  camp: { label: '集训营', color: '#00d4ff', icon: 'users' },
  match: { label: '邀请赛', color: '#fbbf24', icon: 'trophy' },
  exchange: { label: '交流赛', color: '#a855f7', icon: 'refresh' },
};
