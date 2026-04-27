// 用户Dashboard类型定义

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: 'user' | 'analyst' | 'admin';
}

export interface PlayerInfo {
  // 基本信息
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  age: number;
  startYear: string;
  
  // 身体信息
  height: number;
  weight: number;
  bmi: number;
  foot: 'left' | 'right' | 'both';
  position: string;
  secondPosition?: string;
  
  // 地区信息
  country: string;
  province: string;
  city: string;
  
  // 俱乐部信息
  club?: string;
  jerseyColor?: string;
  jerseyNumber?: string;
  
  // 足协注册
  faRegistered: boolean;
  association?: string;
}

export interface FamilyInfo {
  father: {
    height?: number;
    phone?: string;
    education?: string;
    job?: string;
    isAthlete?: boolean;
  };
  mother: {
    height?: number;
    phone?: string;
    education?: string;
    job?: string;
    isAthlete?: boolean;
  };
}

export interface PhysicalTest {
  run30m: number;
  longJump: number;
  pullUp: number;
  sitReach: number;
  date: string;
}

export interface Order {
  id: string;
  title: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
  price: number;
  createdAt: string;
  analystName?: string;
  videoUrl?: string;
}

export interface Report {
  id: string;
  orderId: string;
  title: string;
  status: 'processing' | 'completed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface DashboardData {
  user: UserProfile;
  playerInfo: PlayerInfo;
  familyInfo: FamilyInfo;
  physicalTests: PhysicalTest[];
  orders: Order[];
  reports: Report[];
}

export type DashboardTab = 'home' | 'orders' | 'reports' | 'upload' | 'profile' | 'growth';

export interface NavItem {
  id: DashboardTab;
  label: string;
  icon: string;
  path?: string;
}
