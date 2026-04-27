// 认证相关类型定义

// 用户角色类型 (与后端 models/user.go 保持一致)
export type UserRole = 'user' | 'analyst' | 'admin' | 'club' | 'coach' | 'scout';

// 角色状态
export type RoleStatus = 'active' | 'pending' | 'rejected' | 'suspended' | 'none';

// 用户基础信息
export interface User {
  id: string;
  phone: string;
  email?: string;
  password: string;
  avatar?: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
  
  // 多角色支持
  roles: {
    type: UserRole;
    status: RoleStatus;
    profile?: PlayerProfile | AnalystProfile | ClubProfile | CoachProfile | ScoutProfile;
  }[];
  
  // 当前活跃角色
  currentRole?: UserRole;
}

// 球员资料
export interface PlayerProfile {
  // 基础信息
  nickname: string;
  realName: string;
  birthDate: string;
  gender: 'male' | 'female';
  province: string;
  city: string;
  position: string;
  dominantFoot: 'left' | 'right' | 'both';
  avatar?: string;
  height?: number;
  weight?: number;
  team?: string;
  
  // 补充资料（参考中国足协自荐系统）
  // 联系信息
  school?: string;
  wechat?: string;
  contactPhone?: string;
  
  // 家庭信息
  fatherHeight?: number;
  motherHeight?: number;
  fatherOccupation?: string;
  motherOccupation?: string;
  fatherAthlete?: boolean;
  motherAthlete?: boolean;
  
  // 技术特点标签
  technicalTags?: string[];
  
  // 心智性格标签
  mentalTags?: string[];
  
  // 体测数据（与后端 PhysicalTestRecord 映射）
  physicalTests?: {
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
    testDate?: string;
  };
}

// 分析师资料
export interface AnalystProfile {
  realName: string;
  age: number;
  country: string;
  province: string;
  city: string;
  isProPlayer: 'yes' | 'no';
  hasCase: 'yes' | 'no';
  caseDetail: string;
  contact: string;
  experience: string;
  certificates: string[];
  bio?: string;
  specialties?: string[];
}

// 俱乐部资料
export interface ClubProfile {
  name: string;
  shortName: string;
  logo?: string;
  province: string;
  city: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  businessLicense?: string;
  foundedYear?: number;
  description?: string;
  website?: string;
}

// 教练员资料
export interface CoachProfile {
  realName: string;
  age: number;
  gender: 'male' | 'female';
  province: string;
  city: string;
  contact: string;
  coachingExperience: number;
  licenses: string[];
  specialties: string[];
  currentClub?: string;
  bio?: string;
  avatar?: string;
}

// 球探资料
export interface ScoutProfile {
  realName: string;
  age: number;
  gender: 'male' | 'female';
  province: string;
  city: string;
  contact: string;
  scoutingExperience: number;
  specialties: string[];  // 擅长发掘的位置：前锋、前腰、后腰等
  preferredAgeGroups: string[];  // 偏好年龄段：U8/U10/U12/U14/U16/U18/成年
  currentOrganization?: string;
  bio?: string;
  avatar?: string;
  scoutingRegions?: string[];  // 球探区域
}

// 注册请求
export interface RegisterRequest {
  phone: string;
  code: string;
  password: string;
  role: UserRole;
  profile: PlayerProfile | AnalystProfile | ClubProfile | CoachProfile | ScoutProfile;
}

// 注册响应
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  requireAudit?: boolean;
}

// 登录请求
export interface LoginRequest {
  phone: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  
  // 登录后建议跳转的页面
  redirectTo?: string;
  
  // 如果有多个角色，提示选择
  requireRoleSelect?: boolean;
}

// 角色信息（用于UI展示）
export interface RoleInfo {
  type: UserRole;
  label: string;
  icon: string;
  description: string;
  color: string;
  requiresAudit: boolean;
}

// 角色配置
export const ROLE_CONFIG: Record<UserRole, RoleInfo> = {
  player: {
    type: 'player',
    label: '球员',
    icon: 'Users',
    description: '上传视频，获取专业分析报告',
    color: 'from-emerald-500 to-teal-500',
    requiresAudit: false,
  },
  analyst: {
    type: 'analyst',
    label: '分析师',
    icon: 'BarChart3',
    description: '成为签约分析师，赚取收益',
    color: 'from-blue-500 to-purple-500',
    requiresAudit: true,
  },
  club: {
    type: 'club',
    label: '俱乐部',
    icon: 'Building2',
    description: '管理球队，追踪球员成长',
    color: 'from-amber-500 to-orange-500',
    requiresAudit: true,
  },
  coach: {
    type: 'coach',
    label: '教练',
    icon: 'GraduationCap',
    description: '关注球员，提供训练建议',
    color: 'from-rose-500 to-pink-500',
    requiresAudit: true,
  },
  scout: {
    type: 'scout',
    label: '球探',
    icon: 'Search',
    description: '发掘潜力球员，撰写球探报告',
    color: 'from-violet-500 to-purple-500',
    requiresAudit: true,
  },
};

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  currentRole: UserRole | null;
  loading: boolean;
  error: string | null;
}
