/**
 * 比赛管理 API 服务
 * 对应后端新架构:
 *   - MatchSummary (比赛记录)
 *   - PlayerReview (球员自评，独立表)
 *   - MatchVideo   (视频链接，独立表)
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_BASE });

// 自动注入 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================
// 类型定义
// ============================================================

export type MatchStatus = 'pending' | 'player_submitted' | 'completed';
export type MatchResult = 'win' | 'draw' | 'lose' | 'pending';
export type MatchLocation = 'home' | 'away' | 'neutral';
export type MatchFormat = '5人制' | '8人制' | '11人制';

export interface MatchVideoItem {
  id?: number;
  platform: 'baidu' | 'tencent' | 'bilibili' | 'other';
  url: string;
  code?: string;   // 提取码
  name: string;    // 视频名称
  note?: string;   // 备注
  sortOrder?: number;
}

export interface PlayerReviewResponse {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  teamId: number;
  performance: string;   // 优秀/良好/一般/需改进
  goals: number;
  assists: number;
  saves: number;
  highlights: string;
  improvements: string;
  nextGoals: string;
  coachRating: number;   // 1-5，教练评分
  coachComment: string;  // 教练评语
  coachReply: string;    // 教练回复球员疑问
  status: 'submitted' | 'coach_reviewed';
  submittedAt: string;
  createdAt: string;
}

export interface PlayerInfoResponse {
  id: number;
  name: string;
  avatar: string;
  number: number;
  position: string;
}

export interface MatchSummary {
  id: number;
  teamId: number;
  teamName: string;
  coachId: number;
  coachName: string;
  status: MatchStatus;

  matchName: string;
  matchDate: string;
  opponent: string;
  location: MatchLocation;
  matchFormat: MatchFormat;
  ourScore: number;
  oppScore: number;
  result: MatchResult;
  coverImage: string;

  videos: MatchVideoItem[];

  playerIds: number[];
  playerCount: number;
  players?: PlayerInfoResponse[];

  coachOverall: string;
  coachTactic: string;
  coachKeyMoments: string;

  playerReviews?: PlayerReviewResponse[];
  submittedCount: number;

  createdAt: string;
}

export interface MatchSummaryListItem {
  id: number;
  teamId: number;
  teamName: string;
  coachId: number;
  coachName: string;
  status: MatchStatus;
  matchName: string;
  matchDate: string;
  opponent: string;
  location: MatchLocation;
  matchFormat: MatchFormat;
  ourScore: number;
  oppScore: number;
  result: MatchResult;
  coverImage: string;
  playerCount: number;
  submittedCount: number;
  createdAt: string;
}

export interface MatchStatsResponse {
  totalCount: number;
  pendingCount: number;
  submittedCount: number;
  completedCount: number;
  winCount: number;
  drawCount: number;
  loseCount: number;
}

// ============================================================
// 请求类型
// ============================================================

export interface CreateMatchRequest {
  teamId: number;
  matchName: string;
  matchDate: string;
  opponent: string;
  location?: MatchLocation;
  matchFormat?: MatchFormat;
  ourScore?: number;
  oppScore?: number;
  result?: MatchResult;
  coverImage?: string;
  playerIds?: number[];
}

export interface UpdateMatchRequest {
  matchName?: string;
  matchDate?: string;
  opponent?: string;
  location?: MatchLocation;
  matchFormat?: MatchFormat;
  ourScore?: number;
  oppScore?: number;
  result?: MatchResult;
  coverImage?: string;
  playerIds?: number[];
}

export interface CoachOverallRequest {
  coachOverall: string;
  coachTactic?: string;
  coachKeyMoments?: string;
  playerReviews?: Array<{
    playerId: number;
    rating: number;
    coachComment: string;
    coachReply?: string;
  }>;
}

export interface PlayerReviewSubmitRequest {
  performance: string;
  goals?: number;
  assists?: number;
  saves?: number;
  highlights?: string;
  improvements?: string;
  nextGoals?: string;
}

export interface CoachPlayerReviewRequest {
  playerId: number;
  rating: number;       // 1-5
  coachComment: string;
  coachReply?: string;
}

// ============================================================
// API 函数
// ============================================================

export const matchApi = {
  // ─── 比赛 CRUD ───────────────────────────────────────────

  /** M1: 教练创建比赛 */
  createMatch: (data: CreateMatchRequest) =>
    api.post<{ success: boolean; data: MatchSummary }>('/match-summaries', data),

  /** M2: 按球队获取比赛列表 */
  getTeamMatches: (teamId: number, params?: {
    status?: MatchStatus;
    page?: number;
    pageSize?: number;
  }) =>
    api.get<{ success: boolean; data: { list: MatchSummaryListItem[]; total: number; page: number; pageSize: number } }>(
      `/teams/${teamId}/match-summaries`, { params }
    ),

  /** 教练获取自己的比赛列表 */
  getCoachMatches: (params?: { status?: MatchStatus; page?: number; pageSize?: number }) =>
    api.get<{ success: boolean; data: { list: MatchSummaryListItem[]; total: number } }>(
      '/coach/match-summaries', { params }
    ),

  /** M3: 获取比赛详情（含 playerReviews + videos） */
  getMatchDetail: (id: number) =>
    api.get<{ success: boolean; data: MatchSummary }>(`/match-summaries/${id}`),

  /** M4: 教练更新比赛信息 */
  updateMatch: (id: number, data: UpdateMatchRequest) =>
    api.put<{ success: boolean; data: MatchSummary }>(`/match-summaries/${id}`, data),

  /** M5: 教练删除比赛 */
  deleteMatch: (id: number) =>
    api.delete<{ success: boolean }>(`/match-summaries/${id}`),

  /** M9: 更新封面图 URL */
  updateCoverImage: (id: number, coverImage: string) =>
    api.post<{ success: boolean }>(`/match-summaries/${id}/cover-image`, { coverImage }),

  /** M10: 获取比赛统计 */
  getStats: (teamId?: number) =>
    api.get<{ success: boolean; data: MatchStatsResponse }>('/match-summaries/stats', { params: { teamId } }),

  /** 催办未提交自评的球员 */
  remindMatchSummary: (id: number) =>
    api.post<{ success: boolean; data: { sent: number; failed: number } }>(`/match-summaries/${id}/remind`, {}),

  // ─── 教练整体点评 ─────────────────────────────────────────

  /** M8: 教练提交整体点评（含逐人评分） */
  submitCoachOverall: (id: number, data: CoachOverallRequest) =>
    api.post<{ success: boolean; data: MatchSummary }>(`/match-summaries/${id}/coach-review`, data),

  // ─── 球员自评 ─────────────────────────────────────────────

  /** P3: 球员提交自评 */
  submitPlayerReview: (matchId: number, data: PlayerReviewSubmitRequest) =>
    api.post<{ success: boolean; data: PlayerReviewResponse }>(`/match-summaries/${matchId}/player-review`, data),

  /** P2: 获取当前登录球员的自评（自己查） */
  getMyReview: (matchId: number) =>
    api.get<{ success: boolean; data: PlayerReviewResponse }>(`/match-summaries/${matchId}/player-review`),

  /** P1: 球员获取自己参与的所有比赛列表 */
  getPlayerMatches: (playerId: number, params?: { page?: number; pageSize?: number }) =>
    api.get<{ success: boolean; data: { list: MatchSummaryListItem[]; total: number } }>(
      `/players/${playerId}/match-summaries`, { params }
    ),

  /** C4: 教练对单个球员提交点评 */
  reviewSinglePlayer: (matchId: number, data: CoachPlayerReviewRequest) =>
    api.post<{ success: boolean; data: PlayerReviewResponse }>(`/match-summaries/${matchId}/coach-player-review`, data),

  // ─── 视频管理 ─────────────────────────────────────────────

  /** M6: 添加视频链接 */
  addVideo: (matchId: number, data: Omit<MatchVideoItem, 'id' | 'sortOrder'>) =>
    api.post<{ success: boolean; data: MatchVideoItem }>(`/match-summaries/${matchId}/videos`, data),

  /** M7: 删除视频 */
  deleteVideo: (matchId: number, videoId: number) =>
    api.delete<{ success: boolean }>(`/match-summaries/${matchId}/videos/${videoId}`),

  /** 获取视频列表 */
  getVideos: (matchId: number) =>
    api.get<{ success: boolean; data: MatchVideoItem[] }>(`/match-summaries/${matchId}/videos`),
};

export default matchApi;
