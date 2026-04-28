// 从 auth.ts 重新导出类型
export type {
  UserRole,
  RoleStatus,
  AuthState,
  RoleInfo,
  PlayerProfile,
  AnalystProfile,
  ClubProfile,
  CoachProfile,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from './auth';

// 保持向后兼容的旧角色类型（逐步废弃）
export type LegacyUserRole = 'user' | 'analyst' | 'admin';

// 用户状态类型
export type UserStatus = 'active' | 'inactive' | 'banned';

// 性别类型
export type Gender = 'male' | 'female' | 'other';

// 惯用脚类型
export type Foot = 'left' | 'right' | 'both';

// 用户类型（更新为多角色支持）
export interface User {
  id: number;
  phone: string;
  username?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  // 单一角色（向后兼容）
  role: LegacyUserRole;
  // 多角色支持（新）
  roles?: {
    type: UserRole;
    status: RoleStatus;
    profile?: any;
  }[];
  currentRole?: UserRole;
  current_role?: UserRole;
  status: UserStatus;
  bio?: string;
  
  // 球员/分析师基本信息
  name?: string;
  birth_date?: string;
  birthDate?: string;
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  foot?: Foot;
  position?: string;
  preferredFoot?: string;
  second_position?: string;
  start_year?: number;
  country?: string;
  province?: string;
  city?: string;
  club?: string;
  school?: string;
  fa_registered?: boolean;
  association?: string;
  jersey_color?: string;
  jersey_number?: number;
  contactWechat?: string;
  contactPhone?: string;
  
  // 家庭信息
  father_height?: number;
  father_phone?: string;
  father_edu?: string;
  father_job?: string;
  father_athlete?: boolean;
  mother_height?: number;
  mother_phone?: string;
  mother_edu?: string;
  mother_job?: string;
  mother_athlete?: boolean;
  
  created_at: string;
  updated_at: string;
}

// 分析师申请状态
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// 分析师申请类型
export interface AnalystApplication {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  experience: string;
  resume?: string;
  status: ApplicationStatus;
  remark?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// 报告状态
export type ReportStatus = 'processing' | 'completed' | 'failed';

// 报告类型
export interface Report {
  id: number;
  order_id: number;
  user_id: number;
  analyst_id: number;
  player_name: string;
  player_birth_date?: string;
  player_position?: string;
  player_province?: string;
  player_city?: string;
  title: string;
  description: string;
  cover_image?: string;
  price: number;
  rating?: number;
  content: string;
  pdf_url?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  user?: User;
  analyst?: User;
  // AI 生成的报告路径
  rating_report_md?: string;   // 评分报告 MD 文件路径
  player_info_md?: string;     // 球员基础信息 MD 文件路径
  ai_report_url?: string;     // AI Word 报告 URL
  ai_video_url?: string;      // AI 视频分析 URL
}

// 订单类型
export type OrderType = 'basic' | 'text' | 'video' | 'pro';

// 订单状态 - 扩展状态机
export type OrderStatus = 
  | 'pending'      // 待支付
  | 'paid'         // 已支付（待上传视频）
  | 'uploaded'     // 已上传视频（待分配分析师）
  | 'assigned'     // 已派发（待接单）
  | 'accepted'     // 已接单（分析中）
  | 'processing'   // 处理中
  | 'submitted'    // 已提交（待审核）
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'refunded';    // 已退款

// 订单派发状态
export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type AssignmentAnalyst = User & {
  name?: string;
  user?: User;
};

// 订单类型
export interface Order {
  id: number;
  user_id: number;
  order_no: string;
  amount: number;
  status: OrderStatus;
  order_type: OrderType;         // 订单类型：文字版/视频版
  paid_at?: string;
  created_at: string;
  updated_at: string;
  report?: Report;
  
  // 派发相关字段
  analyst_id?: number;           // 被指派的分析师ID
  assigned_at?: string;          // 派发时间
  assigned_by?: number;          // 派发人(管理员ID)
  accepted_at?: string;          // 接单时间
  deadline?: string;             // 分析截止时间
  submitted_at?: string;         // 提交时间
  
  // 视频信息
  video_url?: string;            // 原视频URL
  video_duration?: number;       // 视频时长(秒)
  video_size?: number;           // 视频大小(字节)
  
  // 剪辑视频(视频版订单)
  clip_video_url?: string;       // 剪辑视频URL
  clip_duration?: number;        // 剪辑视频时长
  
  // 球员信息
  player_name?: string;
  player_age?: number;
  player_position?: string;
  
  // 比赛信息
  match_name?: string;
  match_date?: string;
  opponent?: string;
  match_result?: string;
  
  // 关联数据
  analyst?: User;
  user?: User;
  report_id?: number; // 报告ID
}

// 订单派发记录
export interface OrderAssignment {
  id: number;
  order_id: number;
  analyst_id: number;
  assigned_by?: number;
  assigned_at: string;
  status: AssignmentStatus;
  rejected_reason?: string;
  responded_at?: string;
  
  // 关联数据
  order?: Order;
  analyst?: AssignmentAnalyst;
  assigned_by_user?: User;
  assignedBy?: User;
}

// 分析师工作量信息
export interface AnalystWorkload {
  analyst_id: number;
  analyst?: User;
  date?: string;                 // 日期（可选）
  max_orders: number;            // 当日最大接单量
  accepted_orders: number;       // 已接单数
  completed_orders: number;      // 已完成数
  working_hours: string;         // 工作时间
  is_available: boolean;         // 是否可接单

  // 统计信息
  total_completed?: number;      // 历史完成订单数
  avg_rating?: number;           // 平均评分
  specialties?: string[];        // 专业领域
}

// 10分制评分数据
export interface PlayerRating {
  // 整体维度
  overall: {
    ballControl: number;         // 控球
    pressing: number;            // 逼抢
    positioning: number;         // 站位
    total: number;               // 综合评分(加权计算)
  };
  
  // 进攻分析(8项)
  offense: {
    widthAndAttack: number;      // 拉开宽度并参与进攻组织
    offTheBallMovement: number;  // 跑位支援灵活且无球突破
    duelVariety: number;         // 对抗中表现多变
    oneOnOne: number;            // 擅长一对一突破
    crossing: number;            // 传中与助攻能力
    speed: number;               // 速度与节奏变化
    passingRisk: number;         // 传球风险判断
    firstTouch: number;          // 身体姿态与一脚传球
  };
  
  // 防守分析(8项)
  defense: {
    defensiveEffort: number;     // 防守阶段投入且拼抢积极
    reactionSpeed: number;       // 失球后反应迅速
    teamCoordination: number;    // 对手出球时与队友配合默契
    secondBall: number;          // 注重第二落点争夺
    aerialDuel: number;          // 空中球争夺与身体对抗
    positioning: number;         // 向中路收缩减少中场空档
    roleAdaptation: number;      // 能快速调整防守角色
    tackling: number;            // 防守节奏把控，抢断成功率
  };
}

// 单项评分详情(包含评语)
export interface RatingItemDetail {
  score: number;                 // 分数
  level: string;                 // 等级(世界级/优秀/良好等)
  comment: string;               // 评分依据/评语
  timestamps?: number[];         // 对应视频时间点(可选)
}

// 完整评分数据(含评语)
export interface RatingWithComments {
  // 整体维度
  overall: {
    ballControl: RatingItemDetail;
    pressing: RatingItemDetail;
    positioning: RatingItemDetail;
  };
  
  // 进攻分析
  offense: {
    widthAndAttack: RatingItemDetail;
    offTheBallMovement: RatingItemDetail;
    duelVariety: RatingItemDetail;
    oneOnOne: RatingItemDetail;
    crossing: RatingItemDetail;
    speed: RatingItemDetail;
    passingRisk: RatingItemDetail;
    firstTouch: RatingItemDetail;
  };
  
  // 防守分析
  defense: {
    defensiveEffort: RatingItemDetail;
    reactionSpeed: RatingItemDetail;
    teamCoordination: RatingItemDetail;
    secondBall: RatingItemDetail;
    aerialDuel: RatingItemDetail;
    positioning: RatingItemDetail;
    roleAdaptation: RatingItemDetail;
    tackling: RatingItemDetail;
  };
  
  // 综合评价
  summary: string;               // 综合评价
  strengths: string[];           // 核心优势
  weaknesses: string[];          // 待提升领域
  suggestions: string;           // 发展建议
  potential: 'top' | 'high' | 'medium' | 'low';  // 潜力评估
}

// 评分草稿
export interface RatingDraft {
  order_id: number;
  analyst_id: number;
  ratings: Partial<RatingWithComments>;
  updated_at: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 登录请求类型
export interface LoginRequest {
  phone: string;
  password: string;
}

// 注册请求类型
// 注册请求（已移动到 auth.ts，此处保留向后兼容）
export interface RegisterRequest {
  phone: string;
  code: string;
  password: string;
  // 新多角色注册参数
  role?: UserRole;
  profile?: any;
  // 旧版注册参数（向后兼容）
  name?: string;
  birth_date?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  foot?: Foot;
  position?: string;
  second_position?: string;
  start_year?: number;
  country?: string;
  province?: string;
  city?: string;
  club?: string;
  jersey_color?: string;
  jersey_number?: number;
  fa_registered?: 'yes' | 'no';
  association?: string;
  father_height?: number;
  father_phone?: string;
  father_edu?: string;
  father_job?: string;
  father_athlete?: 'yes' | 'no';
  mother_height?: number;
  mother_phone?: string;
  mother_edu?: string;
  mother_job?: string;
  mother_athlete?: 'yes' | 'no';
  nickname: string;
}

// 重置密码请求类型
export interface ResetPasswordRequest {
  phone: string;
  code: string;
  password: string;
}

// 发送验证码请求类型
export interface SendCodeRequest {
  phone: string;
  type: 'register' | 'reset';
}

// 分页类型
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

// 潜力等级
export type PlayerLevel = 'top' | 'high' | 'medium' | 'low';

// 球员地理位置（地图）
export interface PlayerLocation {
  id: number;
  name: string;
  age: number;
  position: string;
  height: number;
  weight: number;
  x: number; // 地图坐标百分比
  y: number; // 地图坐标百分比
  province: string;
  city: string;
  club?: string;
  school?: string;
  level: PlayerLevel;
  reportId?: number;
  avatar?: string;
}

// 成长记录
export interface GrowthRecord {
  id: string;
  title: string;
  content: string;
  date: string;
  weight?: number;
  height?: number;
  // 比赛信息
  matchName?: string; // 比赛名称
  opponent?: string; // 对手
  result?: string; // 比赛结果 (胜/负/平)
  // 表现数据
  goals?: number; // 进球数
  assists?: number; // 助攻数
  playTime?: number; // 出场时间(分钟)
  // 多媒体
  photos?: string[]; // 照片URL数组
  videos?: string[]; // 视频URL数组
  // 其他
  feeling?: string; // 个人感受
}

// 球员资料
export interface PlayerProfile {
  id: number;
  userId: number;
  nickname?: string;
  name: string;
  birthDate?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  position?: string;
  preferredFoot?: Foot;
  club?: string;
  school?: string;
  bio?: string;
  contactWechat?: string;
  contactPhone?: string;
  growthRecords?: GrowthRecord[];
  createdAt: string;
  updatedAt: string;
}

// 视频分析结果
export interface VideoAnalysisResult {
  id: string;
  duration: number;
  detectedPlayers: number;
  qualityScore: number;
  stats: {
    [key: string]: number; // speed, dribble, pass, shot, endurance 等
  };
  evaluation: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  reportUrl?: string;
}

// ============ 社交互动相关类型 ============

// 点赞对象类型
export type LikeTargetType = 'player_homepage' | 'scout_report' | 'analyst_report' | 'comment' | 'growth_record' | 'dynamic';

// 收藏对象类型
export type FavoriteTargetType = 'player_homepage' | 'scout_report' | 'analyst_report' | 'video' | 'growth_record';

// 评论对象类型
export type CommentTargetType = 'player_homepage' | 'scout_report' | 'analyst_report' | 'growth_record' | 'video';

// 通知类型
export type NotificationType =
  | 'like'
  | 'favorite'
  | 'comment'
  | 'mention'
  | 'system'
  | 'order'
  | 'report'
  | 'task'
  | 'inquiry'
  | 'follow'
  | 'message'
  | 'weekly_report_created'
  | 'weekly_report_rejected'
  | 'weekly_report_approved'
  | 'weekly_report_reminder'
  | 'match_summary_created'
  | 'match_player_reminder'
  | 'match_coach_reminder'
  | 'match_summary_complete'
  | 'activity_registration'
  | 'activity_approved'
  | 'activity_rejected'
  | 'invitation'
  | 'trial_invite'
  | 'scout_report';

// 通知优先级
export type NotificationPriority = 1 | 2 | 3;

// 成就分类
export type AchievementCategory = 'contribution' | 'engagement' | 'social' | 'milestone';

// 点赞记录
export interface Like {
  id: number;
  user_id: number;
  target_type: LikeTargetType;
  target_id: number;
  created_at: string;
  user?: User;
}

// 收藏记录
export interface Favorite {
  id: number;
  user_id: number;
  target_type: FavoriteTargetType;
  target_id: number;
  created_at: string;
  user?: User;
}

// 评论
export interface Comment {
  id: number;
  user_id: number;
  target_type: CommentTargetType;
  target_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

// 评论项（API 返回格式）
export interface CommentItem {
  id: number;
  user_id: number;
  target_type: CommentTargetType;
  target_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: CommentItem[];
  is_liked: boolean;
}

// 通知数据
export interface NotificationData {
  trigger_user_id?: number;
  trigger_user_name?: string;
  trigger_avatar?: string;
  target_type?: string;
  target_id?: number;
  comment_id?: number;
  comment_content?: string;
  report_id?: number;
  report_title?: string;
  link?: string;
  // 邀请相关
  invite_code?: string;
  team_id?: number;
  team_name?: string;
  club_name?: string;
  club_id?: number;
  target_role?: string;
  role_label?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'declined' | 'completed';
  _handled?: 'accepted' | 'rejected' | 'declined';
}

// 通知
export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: NotificationData;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
}

// 通知项（API 返回格式）
export interface NotificationItem {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: NotificationData;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
}

// 社交成就定义
export interface SocialAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: string;
  threshold: number;
}

// 社交成就项（API 返回格式）
export interface SocialAchievementItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: string;
  threshold: number;
  achieved: boolean;
  achieved_at?: string;
}

// 用户统计
export interface UserStats {
  user_id: number;
  likes_received: number;
  favorites_received: number;
  comments_received: number;
  followers_count: number;
  following_count: number;
  login_streak: number;
  last_login_date?: string;
}

// ============ 视频分析相关类型 ============

// 潜力等级
export type PotentialLevel = 'S' | 'A' | 'B' | 'C' | 'D';

// 高光时刻标签类型
export type HighlightTagType = 'goal' | 'assist' | 'steal' | 'save' | 'dribble' | 'pass' | 'defense';

// 视频分析状态
export type VideoAnalysisStatus = 'scoring' | 'draft' | 'generating' | 'completed' | 'submitted';

// AI报告状态
export type AIReportStatus = 'draft' | 'regenerating' | 'confirmed';

// 单项评分
export interface RatingDimension {
  score: number;
  comment: string;
}

// ============================================================
// 视频分析评分结构（20项 · 三分类 · 十分制）
// ============================================================

// 整体维度评分（4项）— 与落地页第四屏一致
export interface OverallScores {
  ball_control: RatingDimension;       // 控球能力
  off_ball_movement: RatingDimension; // 无球跑动
  pressing_awareness: RatingDimension;// 逼抢意识
  positioning: RatingDimension;       // 站位选择
}

// 进攻分析评分（8项）— 与落地页第四屏一致
export interface OffenseScores {
  width_participation: RatingDimension;   // 拉开宽度
  off_ball_support: RatingDimension;     // 跑位支援
  one_v_one: RatingDimension;            // 一对一突破
  crossing_assist: RatingDimension;      // 传中助攻
  combat_ability: RatingDimension;       // 对抗能力
  pace_rhythm: RatingDimension;         // 速度节奏
  pass_vision: RatingDimension;         // 传球视野
  body_posture: RatingDimension;        // 身体姿态
}

// 防守分析评分（8项）— 与落地页第四屏一致
export interface DefenseScores {
  defensive_commitment: RatingDimension;   // 防守投入
  loss_recovery: RatingDimension;          // 失球反应
  teammate_coordination: RatingDimension;  // 队友配合
  second_ball: RatingDimension;            // 二点争夺
  aerial_duel: RatingDimension;            // 空中对抗
  defensive_shape: RatingDimension;        // 中路收缩
  role_adjustment: RatingDimension;        // 角色调整
  defensive_rhythm: RatingDimension;       // 抢断节奏
}

// 完整评分结构
export interface VideoAnalysisScores {
  overall: OverallScores;
  offense: OffenseScores;
  defense: DefenseScores;
  // 综合评分（系统自动计算）
  overall_score?: number;
}

// 高光时刻
export interface AnalysisHighlight {
  id: number;
  analysis_id: number;
  timestamp: string;
  tag_type: HighlightTagType;
  description: string;
  video_clip_url?: string;
  include_in_report: boolean;
  sort_order: number;
  created_at: string;
}

// 视频分析
export interface VideoAnalysis {
  id: number;
  order_id: number;
  analyst_id: number;
  user_id: number;
  
  // 球员信息
  player_name: string;
  player_age: number;
  player_position: string;
  player_foot?: string;
  player_height?: number;
  player_weight?: number;
  player_team?: string;
  
  // 比赛信息
  match_name?: string;
  match_date?: string;
  match_type?: string;
  opponent_level?: string;
  opponent?: string;
  play_time?: number;
  goals?: number;
  assists?: number;
  
  // 视频
  video_url?: string;
  
  // 评分
  overall_score: number;
  potential_level: PotentialLevel;
  scores?: VideoAnalysisScores;
  
  // 摘要
  summary?: string;
  improvements?: string;
  analyst_notes?: string;
  
  // AI报告
  ai_report?: string;
  ai_report_status?: AIReportStatus;
  ai_report_version?: number;
  
  // 状态
  status: VideoAnalysisStatus;
  created_at: string;
  updated_at: string;
}

// 更新评分请求
export interface UpdateScoresRequest {
  scores: VideoAnalysisScores;
  summary: string;
  improvements: string;
  analyst_notes: string;
}

// 创建高光请求
export interface CreateHighlightRequest {
  analysis_id: number;
  timestamp: string;
  tag_type: HighlightTagType;
  description: string;
  video_clip_url?: string;
  include_in_report?: boolean;
}

// AI报告生成响应
export interface AIReportResponse {
  report: string;
  version: number;
}
