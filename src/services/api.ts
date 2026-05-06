import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// ========== Token Refresh Logic ==========
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshRejectors: Array<(error: unknown) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
  refreshRejectors = [];
}

function onTokenRefreshFailed(error: unknown) {
  refreshRejectors.forEach((cb) => cb(error));
  refreshSubscribers = [];
  refreshRejectors = [];
}

function addRefreshSubscriber(cb: (token: string) => void, reject: (error: unknown) => void) {
  refreshSubscribers.push(cb);
  refreshRejectors.push(reject);
}

// ========== Base HTTP Client ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function unwrapApiResponse<T = any>(response: any): ApiResponse<T> {
  return response?.data?.success !== undefined ? response.data : response;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 且不是刷新 token 的请求本身，尝试自动刷新
    const isRefreshRequest = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        // 正在刷新中，将请求加入队列等待新 token
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(http(originalRequest));
          }, reject);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await authApi.refreshToken();
        const newToken = res.data?.data?.token;
        if (!newToken) {
          throw new Error('刷新 token 失败：响应中无 token');
        }
        localStorage.setItem('token', newToken);
        http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        onTokenRefreshFailed(refreshError);
        // 刷新失败，清除登录状态并跳转
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('currentUser');
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

type DownloadParams = Record<string, string | number | boolean | null | undefined>;
type ReportDocType = 'rating' | 'player-info' | 'report' | 'video';

function getFilenameFromContentDisposition(contentDisposition?: string): string | undefined {
  if (!contentDisposition) return undefined;

  const utf8Filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8Filename) {
    try {
      return decodeURIComponent(utf8Filename);
    } catch {
      return utf8Filename;
    }
  }

  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
}

export async function downloadBlob(
  path: string,
  options: { params?: DownloadParams; filename?: string } = {}
) {
  const response = await http.get(path, {
    params: options.params,
    responseType: 'blob',
  });
  triggerBlobDownload(response, options.filename);
  return response;
}

export async function downloadBlobPost(
  path: string,
  data?: any,
  options: { filename?: string } = {}
) {
  const response = await http.post(path, data || {}, {
    responseType: 'blob',
  });
  triggerBlobDownload(response, options.filename);
  return response;
}

function triggerBlobDownload(response: any, fallbackFilename?: string) {
  const contentType = response.headers?.['content-type'] || 'application/octet-stream';
  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const filename = getFilenameFromContentDisposition(response.headers?.['content-disposition']) || fallbackFilename;
  if (filename) anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

// ========== Auth API ==========
export const authApi = {
  login: (data: { phone: string; password: string }) =>
    http.post('/auth/login', data),
  register: (data: any) => http.post('/auth/register', data),
  sendCode: (phone: string, type: 'register' | 'reset' = 'register') => 
    http.post('/auth/send-code', { phone, type }),
  verifyCode: (data: { phone: string; code: string }) =>
    http.post('/auth/verify-code', data),
  resetPassword: (data: any) => http.post('/auth/reset-password', data),
  getUserInfo: () => http.get('/auth/me'),
  refreshToken: () => http.post('/auth/refresh-token'),
};

// ========== System API ==========
export const systemApi = {
  getPublicSettings: () => http.get('/system/public-settings'),
};

// ========== User API ==========
export const userApi = {
  getProfile: () => http.get('/user/profile'),
  updateProfile: (data: any) => http.put('/user/profile', data),
  getGrowthRecords: () => http.get('/user/growth-records'),
  saveGrowthRecords: (data: any) => http.post('/user/growth-records', Array.isArray(data) ? { records: data } : data),
  createGrowthRecord: (data: any) => http.post('/user/growth-records', data),
  updateGrowthRecord: (id: string | number, data: any) => http.put(`/user/growth-records/${id}`, data),
  deleteGrowthRecord: (id: string | number) => http.delete(`/user/growth-records/${id}`),
  getPublicProfile: (userId: number) => http.get(`/users/${userId}/profile`),
  getPlayerProfile: (userId: number) => http.get(`/users/${userId}/player`),
  getPublicReports: (userId: number) => http.get(`/users/${userId}/reports`),
  getPlayerMapProfile: (userId: number) => http.get(`/scout/players/${userId}/map-profile`),
};

// ========== Settings API ==========
export const settingsApi = {
  changePassword: (data: { old_password: string; new_password: string }) => http.put('/user/password', data),
  changePhone: (data: { new_phone: string; code: string }) => http.put('/user/phone', data),
  getSettings: () => http.get('/user/settings'),
  updateSettings: (data: { notification?: any; privacy?: any }) => http.put('/user/settings', data),
  getLoginDevices: () => http.get('/user/devices'),
  logoutDevice: (deviceId: string) => http.delete(`/user/devices/${deviceId}`),
};

// ========== Order API ==========
export const orderApi = {
  getOrders: (params?: any) => http.get('/orders', { params }),
  getOrderDetail: (id: number) => http.get(`/orders/${id}`),
  cancelOrder: (id: number) => http.delete(`/orders/${id}`),
  createOrder: (data: any) => http.post('/orders', data),
  getStatistics: () => http.get('/orders/statistics'),
  // 俱乐部订单
  getClubOrders: (params?: any) => http.get('/club/orders', { params }),
  getOrderStats: () => http.get('/club/orders/stats'),
  createBatchOrders: (data: any) => http.post('/club/orders/batch', data),
  // 支付后补充资料
  supplementOrder: (id: number, data: any) => http.post(`/orders/${id}/supplement`, data),
  // 下载 AI 报告
  downloadAIReport: (orderId: number, type: 'report' | 'video') =>
    downloadBlob(`/orders/${orderId}/ai-report`, {
      params: { type },
      filename: type === 'report' ? `AI分析报告_${orderId}.docx` : `AI视频分析_${orderId}.mp4`,
    }),
};

// ========== Report API ==========
export const reportApi = {
  getMyReports: (params?: any) => http.get('/reports/my', { params }),
  getPublishedReports: (params?: any) => http.get('/reports/published', { params }),
  getReportDetail: (id: number) => http.get(`/reports/${id}`),
  getById: (id: string | number) => http.get(`/reports/${id}`),
  create: (data: any) => http.post('/reports', data),
  update: (id: string | number, data: any) => http.put(`/reports/${id}`, data),
  downloadReport: (id: number) => http.get(`/reports/${id}/download`, { responseType: 'blob' }),
  downloadReportFile: (id: number, filename?: string) =>
    downloadBlob(`/reports/${id}/download`, { filename }),
  getPlayerReports: (playerId: number) => http.get(`/club/players/${playerId}/physical-reports`),
  getPhysicalReportDetail: (reportId: number | string) => http.get(`/club/physical-reports/${reportId}`),
  downloadPhysicalReport: (reportId: number | string, filename?: string) =>
    downloadBlob(`/club/physical-reports/${reportId}/export`, { filename }),
  exportPDF: (reportId: string) => http.get(`/club/reports/${reportId}/export`, { responseType: 'blob' }),
};

// ========== Payment API ==========
export const paymentApi = {
  createPayment: (data: { order_id: number; amount: number; type: string }) => http.post('/payment/', data),
  simulatePay: (data: { order_id: number; payment_method: string }) => http.post('/payment/simulate', data),
  getPaymentStatus: (id: string) => http.get(`/payment/${id}`),
  getOrderPaymentStatus: (orderId: number) => http.get(`/order-payment/${orderId}/payment-status`),
  refund: (id: string) => http.post(`/payment/${id}/refund`, {}),
};

// ========== Analyst API ==========
export const analystApi = {
  getAnalystList: () => http.get('/analysts'),
  getAnalystByID: (id: number) => http.get(`/analysts/${id}`),
  getPublicProfile: (id: number) => http.get(`/analysts/${id}/public`),
  getPublicProfileByUser: (userId: number) => http.get('/analysts/public', { params: { user_id: userId } }),
  createInquiry: (analystId: number, data: { name: string; contact: string; content: string }) =>
    http.post(`/analysts/${analystId}/inquiries`, data),
  getMyProfile: () => http.get('/analyst/profile'),
  updateMyProfile: (data: any) => http.put('/analyst/profile', data),
  getMyOrders: (params?: any) => http.get('/analyst/orders', { params }),
  getMyRevenue: () => http.get('/analyst/revenue'),

  // ===== 新增 =====
  getDashboardStats: () => http.get('/analyst/dashboard-stats'),
  getPendingOrders: (params?: any) => http.get('/analyst/orders/pending', { params }),
  getActiveOrders: (params?: any) => http.get('/analyst/orders/active', { params }),
  getHistoryOrders: (params?: any) => http.get('/analyst/orders/history', { params }),
  acceptOrder: (orderId: string) => http.post(`/analyst/orders/${orderId}/accept`, {}),
  rejectOrder: (orderId: string, reason: string) => http.post(`/analyst/orders/${orderId}/reject`, { reason }),
  getIncomeDetails: (params?: any) => http.get('/analyst/income-details', { params }),
  getIncomeTrend: (range: string) => http.get('/analyst/income-trend', { params: { range } }),
  submitReport: (orderId: string, data: any) => http.post(`/analyst/orders/${orderId}/submit-report`, data),
  saveRatingDraft: (orderId: string, data: any) => http.post(`/analyst/orders/${orderId}/draft`, data),
  downloadReportDoc: (orderId: number, type: 'rating' | 'player-info') =>
    downloadBlob(`/analyst/orders/${orderId}/download`, {
      params: { type },
      filename: type === 'rating' ? `评分报告_${orderId}.md` : `球员基础信息_${orderId}.md`,
    }),
  downloadAIReport: (orderId: number, type: 'report' | 'video') =>
    downloadBlob(`/analyst/orders/${orderId}/ai-report`, {
      params: { type },
      filename: type === 'report' ? `AI分析报告_${orderId}.docx` : `AI视频分析_${orderId}.mp4`,
    }),
};

// ========== Video Analysis API ==========
export const videoAnalysisApi = {
  // 创建分析
  createFromOrder: (orderId: number) => 
    http.post('/video-analysis/create-from-order', { order_id: orderId }),
  
  // 获取分析详情
  getAnalysis: (id: number) => 
    http.get(`/video-analysis/${id}`),
  
  // 根据订单获取分析
  getByOrder: (orderId: number) => 
    http.get('/video-analysis/by-order', { params: { order_id: orderId } }),
  
  // 更新评分
  updateScores: (id: number, data: any) => 
    http.put(`/video-analysis/${id}/scores`, data),
  
  // 创建高光
  createHighlight: (data: any) => 
    http.post('/video-analysis/highlights', data),
  
  // 更新高光
  updateHighlight: (id: number, data: any) => 
    http.put(`/video-analysis/highlights/${id}`, data),
  
  // 删除高光
  deleteHighlight: (id: number) => 
    http.delete(`/video-analysis/highlights/${id}`),
  
  // 获取高光列表
  getHighlights: (analysisId: number) => 
    http.get(`/video-analysis/${analysisId}/highlights`),

  // 片段剪辑
  retryHighlightClip: (id: number) =>
    http.post(`/video-analysis/markers/${id}/clip`),
  getHighlightClip: (id: number) =>
    http.get(`/video-analysis/markers/${id}/clip`),
  downloadHighlightClip: (id: number) =>
    downloadBlob(`/video-analysis/markers/${id}/clip/download`),
  exportHighlightClips: (analysisId: number, data?: any) =>
    downloadBlobPost(`/video-analysis/${analysisId}/clips/export`, data, {
      filename: `视频片段_${analysisId}.zip`,
    }),
  createHighlightClipExportJob: (analysisId: number, data?: any) =>
    http.post(`/video-analysis/${analysisId}/clips/export/jobs`, data || {}),
  listHighlightClipExportJobs: (analysisId: number) =>
    http.get(`/video-analysis/${analysisId}/clips/export/jobs`),
  getHighlightClipExportJob: (analysisId: number, jobId: string) =>
    http.get(`/video-analysis/${analysisId}/clips/export/jobs/${jobId}`),
  retryHighlightClipExportJob: (analysisId: number, jobId: string) =>
    http.post(`/video-analysis/${analysisId}/clips/export/jobs/${jobId}/retry`),
  downloadHighlightClipExportJob: (analysisId: number, jobId: string, filename?: string) =>
    downloadBlob(`/video-analysis/${analysisId}/clips/export/jobs/${jobId}/download`, {
      filename: filename || `视频片段_${analysisId}.zip`,
    }),
  
  // AI报告生成
  generateAIReport: (analysisId: number) => 
    http.post('/video-analysis/generate-ai-report', { analysis_id: analysisId }),
  
  // 更新AI报告
  updateAIReport: (id: number, report: string) => 
    http.put(`/video-analysis/${id}/ai-report`, { report }),
  
  // 确认AI报告
  confirmAIReport: (id: number) => 
    http.post(`/video-analysis/${id}/confirm-ai-report`),
  
  // 获取AI报告
  getAIReport: (id: number) => 
    http.get(`/video-analysis/${id}/ai-report`),

  // ========== 球员端 Video Analysis API ==========
  // 获取我的视频分析列表
  getMyVideoAnalyses: (params?: any) => 
    http.get('/video-analysis/my', { params }),

  // 获取某条视频分析详情（含评分+AI报告）
  getMyAnalysisDetail: (id: number) =>
    http.get(`/video-analysis/my/${id}`),

  // 确认分析并生成 MD 文档（分析师用）
  confirmAnalysis: (id: number) =>
    http.post(`/video-analysis/${id}/confirm`),

  // 下载 MD 文档（管理员用）
  downloadDoc: (id: number, docType: 'rating' | 'player-info') =>
    downloadBlob(`/admin/video-analysis/${id}/download`, {
      params: { type: docType },
      filename: docType === 'rating' ? `评分报告_${id}.md` : `球员基础信息_${id}.md`,
    }),
};

// ========== Scout API ==========
export const scoutApi = {
  // 工作台
  getDashboard: () => http.get('/scout/dashboard'),

  // 球探资料
  getProfile: () => http.get('/scout/profile'),
  updateProfile: (data: any) => http.put('/scout/profile', data),

  // 球探公开主页
  getPublicProfile: (userId: number) => http.get('/scouts/public', { params: { user_id: userId } }),
  getPublicProfileByID: (id: number) => http.get(`/scouts/${id}/public`),

  // 关注的球员
  getFollowedPlayers: (params?: any) => http.get('/scout/followed-players', { params }),
  followPlayer: (playerId: number) => http.post('/scout/followed-players', { player_id: playerId }),
  unfollowPlayer: (playerId: number) => http.delete(`/scout/followed-players/${playerId}`),

  // 球探报告
  getReports: (params?: any) => http.get('/scout/reports', { params }),
  getReport: (reportId: number) => http.get(`/scout/reports/${reportId}`),
  createReport: (data: any) => http.post('/scout/reports', data),
  updateReport: (reportId: number, data: any) => http.put(`/scout/reports/${reportId}`, data),
  publishReport: (reportId: number) => http.post(`/scout/reports/${reportId}/publish`, {}),
  deleteReport: (reportId: number) => http.delete(`/scout/reports/${reportId}`),

  // 球探任务
  getTasks: (params?: any) => http.get('/scout/tasks', { params }),
  acceptTask: (taskId: number) => http.post(`/scout/tasks/${taskId}/accept`, {}),

  // 球员搜索
  searchPlayers: (params?: any) => http.get('/scout/players/search', { params }),
};

// ========== Club API ==========
export const clubApi = {
  getProfile: () => http.get('/club/profile'),
  updateProfile: (data: any) => http.put('/club/profile', data),
  getDashboard: () => http.get('/club/dashboard'),
  getPlayers: (params?: any) => http.get('/club/players', { params }),
  getPlayerSelection: (params?: any) => http.get('/club/players/selection', { params }),
  getPlayerDetail: (id: number) => http.get(`/club/players/${id}`),
  // 训练计划
  getTrainingPlans: (params?: any) => http.get('/club/training-plans', { params }),
  createTrainingPlan: (data: any) => http.post('/club/training-plans', data),
  getTrainingPlan: (id: number) => http.get(`/club/training-plans/${id}`),
  updateTrainingPlan: (id: number, data: any) => http.put(`/club/training-plans/${id}`, data),
  deleteTrainingPlan: (id: number) => http.delete(`/club/training-plans/${id}`),
  // 赛程日历
  getMatchSchedules: (params?: any) => http.get('/club/match-schedules', { params }),
  createMatchSchedule: (data: any) => http.post('/club/match-schedules', data),
  getMatchSchedule: (id: number) => http.get(`/club/match-schedules/${id}`),
  updateMatchSchedule: (id: number, data: any) => http.put(`/club/match-schedules/${id}`, data),
  deleteMatchSchedule: (id: number) => http.delete(`/club/match-schedules/${id}`),
  createMatchSummaryFromSchedule: (id: number) => http.post(`/club/match-schedules/${id}/summary`, {}),
  invitePlayer: (data: any) => http.post('/club/players/invite', data),
  importPlayers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/club/players/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updatePlayerTags: (id: number, tags: string[]) => http.put(`/club/players/${id}/tags`, { tags }),
  removePlayer: (id: number) => http.delete(`/club/players/${id}`),
  getAnalytics: (params?: any) => http.get('/club/analytics', { params }),
  // 筛选方案
  getPlayerFilterPresets: () => http.get('/club/player-filter-presets'),
  createPlayerFilterPreset: (data: { name: string; filters: string }) => http.post('/club/player-filter-presets', data),
  updatePlayerFilterPreset: (id: number, data: { name?: string; filters?: string }) => http.put(`/club/player-filter-presets/${id}`, data),
  deletePlayerFilterPreset: (id: number) => http.delete(`/club/player-filter-presets/${id}`),
  // 俱乐部动态通知
  getClubNotifications: () => http.get('/club/notifications'),
  // 公告
  getAnnouncements: () => http.get('/club/announcements'),
  createAnnouncement: (data: { title: string; content?: string; isPinned?: boolean }) => http.post('/club/announcements', data),
  updateAnnouncement: (id: number, data: { title?: string; content?: string; isPinned?: boolean }) => http.put(`/club/announcements/${id}`, data),
  deleteAnnouncement: (id: number) => http.delete(`/club/announcements/${id}`),
  // 管理员操作日志
  getAdminOperationLogs: (params?: { page?: number; pageSize?: number }) => http.get('/club/admin-logs', { params }),
  // 候选名单
  getShortlist: () => http.get('/club/shortlist'),
  addToShortlist: (data: { playerIds: number[]; note?: string }) => http.post('/club/shortlist', data),
  updateShortlistNote: (playerId: number, note: string) => http.put(`/club/shortlist/${playerId}`, { note }),
  removeFromShortlist: (playerId: number) => http.delete(`/club/shortlist/${playerId}`),
  // 球队赛季档案
  getTeamSeasonArchives: (teamId: number) => http.get(`/club/teams/${teamId}/season-archives`),
  createTeamSeasonArchive: (teamId: number, data: any) => http.post(`/club/teams/${teamId}/season-archives`, data),
  getTeamSeasonArchiveDetail: (teamId: number, id: number) => http.get(`/club/teams/${teamId}/season-archives/${id}`),
  updateTeamSeasonArchive: (teamId: number, id: number, data: any) => http.put(`/club/teams/${teamId}/season-archives/${id}`, data),
  deleteTeamSeasonArchive: (teamId: number, id: number) => http.delete(`/club/teams/${teamId}/season-archives/${id}`),
  // 公开接口：搜索俱乐部
  searchClubs: (params?: { keyword?: string; province?: string; city?: string; page?: number; pageSize?: number }) =>
    http.get('/clubs/search', { params }),
  getClubDetail: (clubId: number) => http.get(`/clubs/${clubId}`),
  // 教练管理
  getClubCoaches: (params?: { status?: string; keyword?: string; page?: number; pageSize?: number }) =>
    http.get('/club/coaches', { params }),
  addClubCoach: (data: { userId: number; primaryRole?: string; notes?: string }) => http.post('/club/coaches', data),
  getClubCoachDetail: (coachId: number) => http.get(`/club/coaches/${coachId}`),
  updateClubCoach: (coachId: number, data: { primaryRole?: string; status?: string; notes?: string }) =>
    http.put(`/club/coaches/${coachId}`, data),
  removeClubCoach: (coachId: number) => http.delete(`/club/coaches/${coachId}`),
  assignCoachToTeam: (coachId: number, data: { teamId: number; role: string }) =>
    http.post(`/club/coaches/${coachId}/assign`, data),
  removeCoachFromTeam: (teamCoachId: number) => http.delete(`/club/coaches/team/${teamCoachId}`),
  // 俱乐部教练邀请
  createClubInvitation: (data: { type: string; targetUserId?: number; targetPhone?: string; targetRole?: string }) =>
    http.post('/club/invitations', data),
  getClubInvitations: (params?: { status?: string }) => http.get('/club/invitations', { params }),
  // 一键催办
  remindMatchSummary: (matchId: number) => http.post(`/match-summaries/${matchId}/remind`, {}),
};

// ========== Club Invitation API (for coaches to accept/reject) ==========
export const clubInvitationApi = {
  getMyClubInvitations: () => http.get('/club-invitations/my'),
  acceptClubInvitation: (code: string) => http.post(`/club-invitations/${code}/accept`),
  rejectClubInvitation: (code: string) => http.post(`/club-invitations/${code}/reject`),
};

// ========== Physical Test API ==========
export const ptApi = {
  getPhysicalTests: (params?: any) => http.get('/club/physical-tests', { params }),
  createPhysicalTest: (data: any) => http.post('/club/physical-tests', data),
  getPhysicalTestDetail: (id: number) => http.get(`/club/physical-tests/${id}`),
  updatePhysicalTest: (id: number, data: any) => http.put(`/club/physical-tests/${id}`, data),
  deletePhysicalTest: (id: number) => http.delete(`/club/physical-tests/${id}`),
  notifyPhysicalTest: (id: number, data: any) => http.post(`/club/physical-tests/${id}/notify`, data),
  getPhysicalTestRecords: (id: number, params?: any) => http.get(`/club/physical-tests/${id}/records`, { params }),
  createPhysicalTestRecord: (id: number, data: any) => http.post(`/club/physical-tests/${id}/records`, data),
  batchImportRecords: (id: number, file: File, testDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (testDate) formData.append('testDate', testDate);
    return http.post(`/club/physical-tests/${id}/records/batch`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  generateReports: (id: number, playerIds: number[]) => http.post(`/club/physical-tests/${id}/generate-reports`, { playerIds }),

  // 自定义模板
  getCustomTemplates: () => http.get('/club/physical-tests/templates'),
  createCustomTemplate: (data: { name: string; description?: string; items: string[] }) =>
    http.post('/club/physical-tests/templates', data),
  deleteCustomTemplate: (id: number) => http.delete(`/club/physical-tests/templates/${id}`),
};

// ========== Team API ==========
export const teamApi = {
  getTeams: (clubId: number) => http.get(`/clubs/${clubId}/teams`),
  createTeam: (clubId: number, data: any) => http.post(`/clubs/${clubId}/teams`, data),
  getTeam: (id: number) => http.get(`/teams/${id}`),
  updateTeam: (id: number, data: any) => http.put(`/teams/${id}`, data),
  deleteTeam: (id: number) => http.delete(`/teams/${id}`),
  getTeamPlayers: (teamId: number) => http.get(`/teams/${teamId}/players`),
  addPlayer: (teamId: number, data: any) => http.post(`/teams/${teamId}/players`, data),
  updatePlayer: (teamId: number, playerId: number, data: any) => http.put(`/teams/${teamId}/players/${playerId}`, data),
  removePlayer: (teamId: number, playerId: number) => http.delete(`/teams/${teamId}/players/${playerId}`),
  getTeamCoaches: (teamId: number) => http.get(`/teams/${teamId}/coaches`),
  addCoach: (teamId: number, data: any) => http.post(`/teams/${teamId}/coaches`, data),
  updateCoach: (teamId: number, coachId: number, data: any) => http.put(`/teams/${teamId}/coaches/${coachId}`, data),
  removeCoach: (teamId: number, coachId: number) => http.delete(`/teams/${teamId}/coaches/${coachId}`),
  createInvitation: (teamId: number, data: any) => http.post(`/teams/${teamId}/invitations`, data),
  getInvitations: (teamId: number) => http.get(`/teams/${teamId}/invitations`),
  getInvitation: (code: string) => http.get(`/invitations/${code}`),
  acceptInvitation: (code: string) => http.post(`/invitations/${code}/accept`),
  rejectInvitation: (code: string) => http.post(`/invitations/${code}/reject`),
  getMyInvitations: () => http.get('/invitations/my'),
  // 入队申请（球员端）
  createApplication: (teamId: number, data: { type: 'join' | 'trial'; reason?: string }) =>
    http.post(`/teams/${teamId}/applications`, data),
  getMyApplications: () => http.get('/applications/my'),
  // 周报周期
  getTeamWeeklyPeriods: (teamId: number) => http.get(`/teams/${teamId}/weekly-periods`),
};

// ========== User Search API ==========
export const userSearchApi = {
  searchUsers: (params: { keyword: string; type?: string }) => http.get('/users/search', { params }),
  getUsersByPhone: (phone: string) => http.get('/users/search', { params: { phone, role: 'player' } }),
};

// ========== Club Home API ==========
export const clubHomeApi = {
  getClubHome: (clubId: number) => http.get(`/clubs/${clubId}/home`),
  saveClubHome: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home`, data),
  updateHero: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/hero`, data),
  updateAbout: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/about`, data),
  updateContact: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/contact`, data),
  updateFacilities: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/facilities`, data),
  updateRecruitment: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/recruitment`, data),
  updateSocialLinks: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/social-links`, data),
  updateModules: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/modules`, data),
  updateTeams: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/teams`, data),
  updateCoaches: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/coaches`, data),
  updatePlayers: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/players`, data),
  getNews: (clubId: number) => http.get(`/clubs/${clubId}/home/news`),
  updateNews: (clubId: number, data: any) => http.put(`/clubs/${clubId}/home/news`, data),
};

// ========== Club Activity API ==========
export const clubActivityApi = {
  getActivities: (clubId: number, params?: any) => http.get(`/clubs/${clubId}/activities`, { params }),
  createActivity: (clubId: number, data: any) => http.post(`/clubs/${clubId}/activities`, data),
  updateActivity: (clubId: number, id: number, data: any) => http.put(`/clubs/${clubId}/activities/${id}`, data),
  deleteActivity: (clubId: number, id: number) => http.delete(`/clubs/${clubId}/activities/${id}`),
  publishActivity: (clubId: number, id: number) => http.post(`/clubs/${clubId}/activities/${id}/publish`),
  unpublishActivity: (clubId: number, id: number) => http.post(`/clubs/${clubId}/activities/${id}/unpublish`),
  registerActivity: (clubId: number, id: number, data: any) => http.post(`/clubs/${clubId}/activities/${id}/register`, data),
  getRegistrations: (clubId: number, id: number) => http.get(`/clubs/${clubId}/activities/${id}/registrations`),
  updateRegistrationStatus: (clubId: number, id: number, regId: number, data: any) => http.put(`/clubs/${clubId}/activities/${id}/registrations/${regId}`, data),
  batchUpdateRegistrationStatus: (clubId: number, id: number, data: { ids: number[]; status: string }) => http.post(`/clubs/${clubId}/activities/${id}/registrations/batch`, data),
  exportRegistrations: (clubId: number, id: number) =>
    downloadBlob(`/clubs/${clubId}/activities/${id}/registrations/export`, {
      filename: `活动报名_${id}.csv`,
    }),
  // 公开活动
  getPublicActivities: (params?: any) => http.get('/activities', { params }),
  getPublicActivity: (id: number) => http.get(`/activities/${id}`),
  getActivitiesMap: (params?: any) => http.get('/activities/map', { params }),
  registerPublicActivity: (id: number, data: any) => http.post(`/activities/${id}/register`, data),
  cancelPublicRegistration: (id: number) => http.post(`/activities/${id}/cancel`),
  // 公开俱乐部列表
  getPublicClubs: (params?: any) => http.get('/clubs', { params }),
  // 球员端
  getMyRegistrations: (params?: any) => http.get('/user/registrations', { params }),
  cancelRegistration: (clubId: number, activityId: number) => http.post(`/clubs/${clubId}/activities/${activityId}/cancel`),
};

// ========== Weekly Report API ==========
export const weeklyReportApi = {
  getReports: (params?: any) => http.get('/weekly-reports', { params }),
  getReport: (id: number) => http.get(`/weekly-reports/${id}`),
  createReport: (data: { teamId: number; playerId?: number; [key: string]: any }) => http.post('/weekly-reports', data),
  getMyReports: (params?: any) => http.get('/coach/weekly-reports', { params }),
  reviewReport: (id: number, data: any) => http.post(`/weekly-reports/${id}/review`, data),
  submitReport: (id: number, data: any) => http.put(`/weekly-reports/${id}`, data),
  getTeamReports: (teamId: number, params?: any) => http.get(`/teams/${teamId}/weekly-reports`, { params }),
  getPendingCount: (teamId: number) => http.get(`/teams/${teamId}/weekly-reports/pending-count`),
  // 球员端：获取自己的周报列表
  getPlayerReports: (playerId: number, params?: any) => http.get(`/players/${playerId}/weekly-reports`, { params }),
};

// ========== Match Summary API ==========
export const matchSummaryApi = {
  // ===== 基础 CRUD =====
  getSummaries: (params?: any) => http.get('/match-summaries', { params }),
  getSummary: (id: number) => http.get(`/match-summaries/${id}`),
  createSummary: (data: any) => http.post('/match-summaries', data),
  updateMatchSummary: (id: number, data: any) => http.put(`/match-summaries/${id}`, data),
  deleteMatchSummary: (id: number) => http.delete(`/match-summaries/${id}`),

  // ===== 列表查询 =====
  getCoachSummaries: (params?: any) => http.get('/coach/match-summaries', { params }),
  getTeamMatchSummaries: (teamId: number, params?: any) => http.get(`/teams/${teamId}/match-summaries`, { params }),
  getPendingCount: (teamId: number) => http.get(`/teams/${teamId}/match-summaries/pending-count`),
  getPlayerMatchSummaries: (playerId: number, params?: any) => http.get(`/players/${playerId}/match-summaries`, { params }),
  getStats: () => http.get('/match-summaries/stats'),

  // ===== 教练操作 =====
  submitCoachReview: (id: number, data: { coachOverall: string; coachTactic?: string; coachKeyMoments?: string }) =>
    http.post(`/match-summaries/${id}/coach-review`, data),
  submitCoachPlayerReview: (id: number, data: { playerId: number; rating: number; coachComment?: string; coachReply?: string }) =>
    http.post(`/match-summaries/${id}/coach-player-review`, data),
  updateCoverImage: (id: number, data: { coverImage: string }) =>
    http.post(`/match-summaries/${id}/cover-image`, data),

  // ===== 球员自评 =====
  submitPlayerReview: (id: number, data: any) => http.post(`/match-summaries/${id}/player-review`, data),
  getPlayerReview: (id: number) => http.get(`/match-summaries/${id}/player-review`),

  // ===== 视频管理 =====
  addVideo: (id: number, data: { platform: string; url: string; code?: string; name: string; note?: string; sortOrder?: number }) =>
    http.post(`/match-summaries/${id}/videos`, data),
  deleteVideo: (id: number, videoId: number) => http.delete(`/match-summaries/${id}/videos/${videoId}`),
  listVideos: (id: number) => http.get(`/match-summaries/${id}/videos`),

  // 兼容旧接口（保留别名）
  submitPlayerSummary: (id: number, data: any) => http.post(`/match-summaries/${id}/player-review`, data),
  submitCoachSummary: (id: number, data: any) => http.post(`/match-summaries/${id}/coach-review`, data),
};

// ========== Notification API ==========
export const notificationApi = {
  getNotifications: (params?: any) => http.get('/notifications', { params }),
  getUnreadNotifications: (params?: any) => http.get('/notifications/unread', { params }),
  getUnreadCount: () => http.get('/notifications/unread-count'),
  markAsRead: (id: number) => http.put(`/notifications/${id}/read`),
  markAllAsRead: () => http.put('/notifications/read-all'),
  deleteNotification: (id: number) => http.delete(`/notifications/${id}`),
};

// ========== Social API ==========
export const socialApi = {
  toggleLike: (data: { target_type: string; target_id: number }) => http.post('/social/likes', data),
  toggleFavorite: (data: { target_type: string; target_id: number }) => http.post('/social/favorites', data),
  getComments: (params: { target_type: string; target_id: number; page?: number; pageSize?: number }) => http.get('/social/comments', { params }),
  createComment: (data: { target_type: string; target_id: number; content: string; parent_id?: number }) => http.post('/social/comments', data),
  deleteComment: (commentId: number) => http.delete(`/social/comments/${commentId}`),
  getAchievements: () => http.get('/social/achievements'),
  getMyAchievements: () => http.get('/social/my-achievements'),
  // 动态流
  getFeed: (params?: { role_tag?: string; page?: number; page_size?: number; user_id?: number }) => http.get('/social/feed', { params }),
  createPost: (data: { content: string; images?: string[]; role_tag?: string; target_type?: string; target_id?: number }) => http.post('/social/posts', data),
  togglePostLike: (postId: number) => http.post(`/social/posts/${postId}/like`),
  deletePost: (postId: number) => http.delete(`/social/posts/${postId}`),
  // 关注
  toggleFollow: (followingId: number) => http.post('/social/follow', { following_id: followingId }),
  getFollowers: (userId: number, params?: { page?: number; page_size?: number }) => http.get(`/social/followers/${userId}`, { params }),
  getFollowing: (userId: number, params?: { page?: number; page_size?: number }) => http.get(`/social/following/${userId}`, { params }),
  getFollowStatus: (userId: number) => http.get(`/social/follow/status/${userId}`),
  // 收藏
  getMyFavorites: (params?: { type?: string; page?: number; page_size?: number }) => http.get('/social/favorites/my', { params }),
};

// ========== Message API ==========
export const messageApi = {
  sendMessage: (data: { receiver_id: number; content: string }) => http.post('/messages', data),
  getMessages: (userId: number, params?: { page?: number; page_size?: number }) =>
    http.get(`/messages/user/${userId}`, { params }),
  getConversations: () => http.get('/messages/conversations'),
  markAsRead: (id: number) => http.put(`/messages/${id}/read`),
  markConversationAsRead: (userId: number) => http.put(`/messages/user/${userId}/read`),
  getUnreadCount: () => http.get('/messages/unread-count'),
  deleteMessage: (id: number) => http.delete(`/messages/${id}`),
};

// ========== Admin API ==========
export const adminApi = {
  login: (data: any) => http.post('/admin/login', data),
  getStatistics: () => http.get('/admin/statistics'),
  getDashboardStats: () => http.get('/admin/dashboard/stats'),
  getGrowthData: (days?: number) => http.get('/admin/dashboard/growth', { params: { days } }),
  getFunnelData: () => http.get('/admin/dashboard/funnel'),
  getRetentionData: (days?: number) => http.get('/admin/dashboard/retention', { params: { days } }),
  getTopData: () => http.get('/admin/dashboard/top'),
  getRevenueTrend: (days?: number) => http.get('/admin/dashboard/revenue', { params: { days } }),
  getUsers: (params?: any) => http.get('/admin/users', { params }),
  listUsers: (params?: any) => http.get('/admin/users', { params }),
  updateUserStatus: (id: number, status: string) => http.put(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: number) => http.delete(`/admin/users/${id}`),
  getOrders: (params?: any) => http.get('/admin/orders', { params }),
  listOrders: (params?: any) => http.get('/admin/orders', { params }),
  cancelOrder: (id: number) => http.delete(`/admin/orders/${id}`),
  getOrderStats: () => http.get('/admin/orders/stats'),
  getAnalysts: (params?: any) => http.get('/admin/analysts', { params }),
  listAnalysts: (page?: number, pageSize?: number, status?: string) =>
    http.get('/admin/analysts', { params: { page, pageSize, status } }),
  auditAnalyst: (id: number, data: any) => http.put(`/admin/analysts/${id}/audit`, data),
  updateAnalystStatus: (id: number, status: string) => http.put(`/admin/analysts/${id}/status`, { status }),
  getAnalystIncomeStats: (id: number) => http.get(`/admin/analysts/${id}/income`),
  getPendingReports: () => http.get('/admin/reports/pending'),
  reviewReport: (id: string, status: string, remark: string) =>
    http.post(`/admin/reports/${id}/review`, { status, remark }),
  downloadReportDoc: (reportId: number, type: ReportDocType) =>
    downloadBlob(`/admin/reports/${reportId}/download`, {
      params: { type },
      filename: type === 'player-info'
        ? `球员基础信息_${reportId}.md`
        : type === 'video'
          ? `AI视频分析_${reportId}.mp4`
          : type === 'report'
            ? `AI分析报告_${reportId}.docx`
            : `评分报告_${reportId}.md`,
    }),
  uploadAIReport: (reportId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/admin/reports/${reportId}/upload-report`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAIVideo: (reportId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/admin/reports/${reportId}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // 通用文件上传
  uploadFile: (file: File, type: string = 'files') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return http.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // 结算管理
  getSettlementList: (params?: any) => http.get('/admin/settlements', { params }),
  processSettlement: (data: { order_ids: number[] }) => http.post('/admin/settlements/process', data),
  // 订单派发
  getPendingDispatchOrders: () => http.get('/admin/orders', { params: { status: 'uploaded' } }),
  getAssignmentRecords: (params?: any) => http.get('/admin/orders/assignments', { params }),
  getOrderStatusHistory: (orderId: number) => http.get(`/admin/orders/${orderId}/status-history`),
  getAvailableAnalysts: (params?: any) => http.get('/admin/analysts/available', { params }),
  assignOrder: (orderId: string, data: any) => http.post(`/admin/orders/${orderId}/assign`, data),
  // 举报处理
  getContentReports: (params?: any) => http.get('/admin/content-reports', { params }),
  getContentReportDetail: (id: number) => http.get(`/admin/content-reports/${id}`),
  handleContentReport: (id: number, data: { status: string; result?: string }) => http.post(`/admin/content-reports/${id}/handle`, data),
  // 敏感词
  getSensitiveWords: (params?: any) => http.get('/admin/sensitive-words', { params }),
  createSensitiveWord: (data: any) => http.post('/admin/sensitive-words', data),
  updateSensitiveWord: (id: number, data: any) => http.put(`/admin/sensitive-words/${id}`, data),
  deleteSensitiveWord: (id: number) => http.delete(`/admin/sensitive-words/${id}`),
  // 平台公告
  getPlatformAnnouncements: (params?: any) => http.get('/admin/announcements', { params }),
  createPlatformAnnouncement: (data: any) => http.post('/admin/announcements', data),
  updatePlatformAnnouncement: (id: number, data: any) => http.put(`/admin/announcements/${id}`, data),
  deletePlatformAnnouncement: (id: number) => http.delete(`/admin/announcements/${id}`),
  // 轮播图
  getBanners: (params?: any) => http.get('/admin/banners', { params }),
  createBanner: (data: any) => http.post('/admin/banners', data),
  updateBanner: (id: number, data: any) => http.put(`/admin/banners/${id}`, data),
  deleteBanner: (id: number) => http.delete(`/admin/banners/${id}`),
  // FAQ
  getFAQs: (params?: any) => http.get('/admin/faqs', { params }),
  createFAQ: (data: any) => http.post('/admin/faqs', data),
  updateFAQ: (id: number, data: any) => http.put(`/admin/faqs/${id}`, data),
  deleteFAQ: (id: number) => http.delete(`/admin/faqs/${id}`),
  // 登录日志
  getLoginLogs: (params?: any) => http.get('/admin/login-logs', { params }),
  getLoginLogStats: (days?: number) => http.get('/admin/login-logs/stats', { params: { days } }),
  getSettings: () => http.get('/admin/settings'),
  updateSettings: (data: any) => http.put('/admin/settings', data),
};

// ========== Analyst Application API ==========
export const analystApplicationApi = {
  apply: (data: any) => http.post('/analyst-application', data),
  getApplicationStatus: () => http.get('/analyst-application/status'),
  listApplications: (page?: number, pageSize?: number, status?: string) =>
    http.get('/admin/applications', { params: { page, pageSize, status } }),
  reviewApplication: (id: string, status: string, remark: string) =>
    http.post(`/admin/applications/${id}/review`, { status, remark }),
};

// ========== Player API ==========
export const playerApi = {
  // 获取球员资料
  getProfile: () => http.get('/player/profile'),
  
  // 更新球员资料
  updateProfile: (data: any) => http.put('/player/profile', data),

  // 部分更新球员资料（单一字段快速更新）
  patchProfile: (data: Record<string, any>) => http.patch('/player/profile/partial', data),
  
  // 获取体测记录列表（球员端，独立表）
  getPhysicalTests: (params?: { page?: number; pageSize?: number }) =>
    http.get('/player/physical-tests', { params }),

  // 获取公开体测记录（无需登录，供主页展示，含来源区分字段）
  getPublicPhysicalTests: (playerId: string) =>
    http.get(`/players/${playerId}/physical-tests`),
  
  // 创建体测记录
  createPhysicalTest: (data: any) => http.post('/player/physical-tests', data),

  // 编辑体测记录
  updatePhysicalTest: (id: number, data: any) => http.put(`/player/physical-tests/${id}`, data),

  // 删除体测记录
  deletePhysicalTest: (id: number) => http.delete(`/player/physical-tests/${id}`),

  // 获取球员公开资料（无需登录）
  getPublicProfile: (userId: number) => http.get(`/players/${userId}/public`),

  // 获取球员个人主页聚合数据（公开页）
  getHomepage: (userId: string | number) => http.get(`/players/${userId}/homepage`),
};

// ========== Upload API ==========
export const uploadApi = {
  uploadFile: (file: File, type: 'avatars' | 'videos' | 'images' | 'files' = 'files') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return http.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ========== Trial Invite API ==========
export const trialApi = {
  sendInvite: (data: {
    player_id: number;
    trial_date: string;
    trial_time?: string;
    location: string;
    contact_name: string;
    contact_phone: string;
    note?: string;
  }) => http.post('/trial-invites', data),
  getMyInvites: () => http.get('/trial-invites/my'),
  respondInvite: (
    id: string | number,
    data: { status: 'accepted' | 'declined'; response_note?: string }
  ) => http.put(`/trial-invites/${id}/respond`, data),
};

// ========== Scout Map API ==========
export const scoutMapApi = {
  getMapData: (params?: any) => http.get('/scout/map', { params }),
  getPlayersByProvince: (params?: any) => http.get('/scout/by-province', { params }),
  getNationalMapData: (params?: { layer?: string }) => http.get('/scout/map/national', { params }),
  getProvincialMapData: (params: { province: string; layer?: string }) => http.get('/scout/map/provincial', { params }),
  getCityMapData: (params: { province: string; city: string; layer?: string }) => http.get('/scout/map/city', { params }),
  getDashboardStats: () => http.get('/scout/map/dashboard'),
  getOverseasPlayers: () => http.get('/scout/map/overseas'),
  getMyRank: () => http.get('/map/my-rank'),
  getRecommendations: () => http.get('/map/recommendations'),
  getRisingStars: () => http.get('/scout/map/rising-stars'),
  exportCompare: (playerIds: (string | number)[]) => http.post('/map/export-compare', { player_ids: playerIds }),
};

export default http;
