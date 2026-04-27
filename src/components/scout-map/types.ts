// ===== 类型定义 =====

export type ViewLevel = 'national' | 'province' | 'city';
export type DataType = 'all' | 'players' | 'clubs' | 'overseas'; // 侧边栏数据类型

// ===== 地理位置 =====
export type LocationType = 'china' | 'overseas';

export interface ChinaLocation {
  type: 'china';
  province: string;
  city: string;
  lat: number;
  lng: number;
}

export interface OverseasLocation {
  type: 'overseas';
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
}

export type PlayerLocation = ChinaLocation | OverseasLocation;

// ===== 身体测试数据 =====
export interface PhysicalTestData {
  sprint30m?: number;
  longJump?: number;
  flexibility?: number;
  pullUps?: number;
  pushUps?: number;
  sitUps?: number;
  fiveMeterShuttle?: number;
  coordination?: number;
}

// ===== 家庭信息 =====
export interface FamilyInfo {
  fatherHeight?: number;
  motherHeight?: number;
  fatherAthlete?: boolean;
  motherAthlete?: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  // 地理位置（扩展支持海外）
  location: PlayerLocation;
  // 评分和技能（所有用户可见）
  score?: number;
  skillTags?: string[];
  // 仅会员可见
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  foot?: string;
  position?: string;
  secondPosition?: string;
  startYear?: number;
  club?: string;
  faRegistered?: boolean;
  association?: string;
  jerseyNumber?: number;
  // 完善资料数据
  school?: string;
  technicalTags?: string[];
  mentalTags?: string[];
  physicalTests?: PhysicalTestData;
  family?: FamilyInfo;
  // 互动数据
  likeCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  heatScore?: number;
}

// 会员等级
export type MembershipLevel = 'free' | 'member' | 'vip';

// 位置统计
export interface PositionStats {
  forward: number;
  midfielder: number;
  defender: number;
  goalkeeper: number;
}

// ===== 俱乐部 =====
export interface Club {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  province: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  foundedYear?: number;
  playerCount: number;
  teamCount: number;
  coachCount: number;
  isVerified: boolean;
  phone?: string;
  wechat?: string;
  followerCount: number;
  viewCount: number;
  status: 'active' | 'inactive';
}

export interface ClubBasicInfo {
  id: number;
  name: string;
  logo?: string;
  playerCount: number;
  teamCount: number;
  isVerified: boolean;
}

// ===== 海外球员统计 =====
export interface CountryStats {
  country: string;
  countryCode: string;
  flag: string;
  playerCount: number;
}

export interface LeagueStats {
  league: string;
  playerCount: number;
}

export interface OverseasStats {
  totalPlayers: number;
  byCountry: CountryStats[];
  byLeague: LeagueStats[];
}

// ===== 俱乐部统计 =====
export interface ClubStats {
  totalClubs: number;
  byProvince: { province: string; clubCount: number }[];
  topClubs: ClubBasicInfo[];
}

// 会员权限配置
export const MEMBERSHIP_CONFIG: Record<MembershipLevel, { label: string; playerVisiblePercent: number; canFavorite: boolean; canExport: boolean; canViewAIReport: boolean }> = {
  free: { label: '免费用户', playerVisiblePercent: 0.3, canFavorite: false, canExport: false, canViewAIReport: false },
  member: { label: '普通会员', playerVisiblePercent: 0.6, canFavorite: true, canExport: false, canViewAIReport: false },
  vip: { label: 'VIP会员', playerVisiblePercent: 1, canFavorite: true, canExport: true, canViewAIReport: true },
};

export interface CityStats {
  name: string;
  playerCount: number;
  clubCount: number;
  lat: number;
  lng: number;
  clubs: ClubBasicInfo[];
}

export interface ProvinceStats {
  name: string;
  code: string;
  playerCount: number;
  clubCount: number;
  cityCount: number;
  cities: CityStats[];
  clubs: ClubBasicInfo[];
}

export interface NationalStats {
  totalPlayers: number;
  totalOverseasPlayers: number;
  totalClubs: number;
  totalCities: number;
  provinces: ProvinceStats[];
  overseasStats: OverseasStats;
  clubStats: ClubStats;
}

export interface FilterState {
  ageRange: [number, number];
  gender: string;
  foot: string;
  playingYears: [number, number];
  positions: string[];
  heightRange: [number, number];
  weightRange: [number, number];
  faRegistered: boolean | null;
  club: string;
}

// ===== 排行榜 =====
export type RankingType = 'score' | 'heat' | 'potential' | 'region';

export interface RankingItem {
  rank: number;
  player: Player;
  rankingType: RankingType;
  period: 'week' | 'month' | 'all';
}

// ===== 热度计算 =====
export const calculateHeatScore = (player: Player): number => {
  const likes = player.likeCount || 0;
  const views = player.viewCount || 0;
  const favorites = player.favoriteCount || 0;
  return likes * 1 + views * 0.1 + favorites * 5;
};

// ===== 支持的国家列表 =====
export const OVERSEAS_COUNTRIES = [
  { code: 'GB', name: '英格兰', flag: '🇬🇧' },
  { code: 'ES', name: '西班牙', flag: '🇪🇸' },
  { code: 'DE', name: '德国', flag: '🇩🇪' },
  { code: 'FR', name: '法国', flag: '🇫🇷' },
  { code: 'IT', name: '意大利', flag: '🇮🇹' },
  { code: 'NL', name: '荷兰', flag: '🇳🇱' },
  { code: 'PT', name: '葡萄牙', flag: '🇵🇹' },
  { code: 'BE', name: '比利时', flag: '🇧🇪' },
  { code: 'JP', name: '日本', flag: '🇯🇵' },
  { code: 'KR', name: '韩国', flag: '🇰🇷' },
  { code: 'US', name: '美国', flag: '🇺🇸' },
  { code: 'CA', name: '加拿大', flag: '🇨🇦' },
  { code: 'BR', name: '巴西', flag: '🇧🇷' },
  { code: 'AR', name: '阿根廷', flag: '🇦🇷' },
  { code: 'AU', name: '澳大利亚', flag: '🇦🇺' },
] as const;

// 球员位置常量
export const POSITIONS = [
  { value: 'GK', label: '门将', code: '1' },
  { value: 'CB', label: '中后卫', code: '2' },
  { value: 'LB', label: '左后卫', code: '3' },
  { value: 'RB', label: '右后卫', code: '4' },
  { value: 'DM', label: '防守中场', code: '5' },
  { value: 'CM', label: '中场', code: '6' },
  { value: 'AM', label: '攻击中场', code: '7' },
  { value: 'LW', label: '左边锋', code: '8' },
  { value: 'RW', label: '右边锋', code: '9' },
  { value: 'CF', label: '前锋', code: '10' },
  { value: 'ST', label: '射手', code: '11' },
] as const;
