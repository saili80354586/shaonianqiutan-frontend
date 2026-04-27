// 球员资料相关类型定义

// ========== 球员资料请求/响应 ==========

// 球员资料更新请求
export interface PlayerProfileUpdateRequest {
  nickname?: string;
  avatar?: string;
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  position?: string;
  secondPosition?: string;
  foot?: 'left' | 'right' | 'both';
  province?: string;
  city?: string;
  currentTeam?: string;
  playingStyle?: string[];  // ['tech', 'speed', 'break']
  wechat?: string;
  school?: string;
  technicalTags?: string[];  // ['盘带', '射门']
  mentalTags?: string[];     // ['领导力', '抗压']
  experiences?: ExperienceItem[];
  startYear?: number;
  faRegistered?: boolean;
  association?: string;
  jerseyNumber?: number;
  jerseyColor?: string;
  fatherHeight?: number;
  fatherPhone?: string;
  fatherJob?: string;
  fatherAthlete?: boolean;
  motherHeight?: number;
  motherPhone?: string;
  motherJob?: string;
  motherAthlete?: boolean;
}

// 足球经历项
export interface ExperienceItem {
  id?: string;
  period: string;      // "2022-2024"
  team: string;        // "北京国安青训"
  position: string;    // "球员/队长"
  achievement?: string; // "市级冠军"
}

// 球员完整资料响应
export interface PlayerProfileResponse {
  id: number;
  nickname: string;
  realName: string;
  birthDate: string;
  gender: 'male' | 'female';
  age: number;
  avatar: string;
  position: string;
  secondPosition?: string;
  dominantFoot: 'left' | 'right' | 'both';
  height?: number;
  weight?: number;
  playingStyle: string[];
  jerseyNumber?: number;
  jerseyColor?: string;
  currentTeam?: string;
  startYear?: number;
  faRegistered: boolean;
  association?: string;
  province: string;
  city: string;
  wechat?: string;
  school?: string;
  fatherHeight?: number;
  fatherPhone?: string;
  fatherJob?: string;
  fatherAthlete: boolean;
  motherHeight?: number;
  motherPhone?: string;
  motherJob?: string;
  motherAthlete: boolean;
  technicalTags: string[];
  mentalTags: string[];
  experiences: ExperienceItem[];
  latestPhysicalTest?: PhysicalTestInfo;
  profileCompleteness: number;  // 0-100
}

// 最新体测信息
export interface PhysicalTestInfo {
  testDate: string;
  sprint30m?: number;
  standingLongJump?: number;
  pushUp?: number;
  sitAndReach?: number;
}

// 体测记录
export interface PhysicalTestRecord {
  id: number;
  testDate: string;
  height?: number;
  weight?: number;
  bmi?: number;
  sprint30m?: number;
  sprint50m?: number;
  sprint100m?: number;
  standingLongJump?: number;
  verticalJump?: number;
  agilityLadder?: number;
  tTest?: number;
  shuttleRun?: number;
  sitAndReach?: number;
  pushUp?: number;
  sitUp?: number;
  pullUp?: number;
  plank?: number;
}

// ========== 踢球风格选项 ==========
export const PLAYING_STYLES = [
  { value: 'speed', label: '速度型', desc: '爆发力强，冲刺快' },
  { value: 'power', label: '力量型', desc: '身体强壮，对抗好' },
  { value: 'tech', label: '技术型', desc: '脚下细腻，控球好' },
  { value: 'organize', label: '组织型', desc: '视野开阔，传球准' },
  { value: 'break', label: '突破型', desc: '盘带出色，突破强' },
  { value: 'defense', label: '防守型', desc: '拦截精准，位置好' },
  { value: 'all', label: '全能型', desc: '技术全面，适应强' },
] as const;

// 技术特点标签选项
export const TECHNICAL_TAGS = [
  '盘带', '射门', '传球', '速度', '过人', '防守', '头球',
  '拦截', '远射', '定位球', '无球跑动', '传中', '补位', '铲球'
] as const;

// 心智性格标签选项
export const MENTAL_TAGS = [
  '领导力', '抗压', '沟通', '决策', '团队协作', '自信',
  '自律', '学习能力', '心理素质', '比赛阅读'
] as const;

// 位置选项
export const POSITIONS = [
  { value: 'GK', label: '门将 (GK)', category: '门将' },
  { value: 'CB', label: '中后卫 (CB)', category: '后卫' },
  { value: 'LB', label: '左后卫 (LB)', category: '后卫' },
  { value: 'RB', label: '右后卫 (RB)', category: '后卫' },
  { value: 'DM', label: '防守型中场 (DM)', category: '中场' },
  { value: 'CM', label: '中场 (CM)', category: '中场' },
  { value: 'AM', label: '进攻型中场 (AM)', category: '中场' },
  { value: 'LW', label: '左边锋 (LW)', category: '前锋' },
  { value: 'RW', label: '右边锋 (RW)', category: '前锋' },
  { value: 'ST', label: '前锋 (ST)', category: '前锋' },
] as const;

// 惯用脚选项
export const FOOT_OPTIONS = [
  { value: 'left', label: '左脚' },
  { value: 'right', label: '右脚' },
  { value: 'both', label: '双脚' },
] as const;

// 球衣颜色选项
export const JERSEY_COLORS = [
  { value: 'red', label: '红色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
  { value: 'yellow', label: '黄色' },
  { value: 'white', label: '白色' },
  { value: 'black', label: '黑色' },
  { value: 'orange', label: '橙色' },
  { value: 'purple', label: '紫色' },
] as const;

// 职业选项
export const OCCUPATION_OPTIONS = [
  '教师', '医生', '工程师', '律师', '会计', '公务员',
  '企业管理者', '自由职业', '运动员', '教练', '其他'
] as const;

// 足球经历预设
export const EXPERIENCES: ExperienceItem[] = [];