import api from './api';

// ========== 类型定义 ==========

// 球队主页类型
export interface TeamHomeHero {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  logo?: string;
  ageGroup?: string;
  foundedYear?: string;
  showStats?: boolean;
}

export interface TeamHomeAbout {
  enabled?: boolean;
  title?: string;
  content?: string;
  images?: string[];
}

export interface TeamHonor {
  id?: number;
  title: string;
  description?: string;
  icon?: string;
  year?: string;
  count?: string;
  sort?: number;
}

export interface TeamHomeContact {
  enabled?: boolean;
  phone?: string;
  wechat?: string;
  address?: string;
}

export interface CoachTeamHomeResponse {
  teamId: number;
  teamName: string;
  ageGroup: string;
  hero: TeamHomeHero;
  about: TeamHomeAbout;
  honors: TeamHonor[];
  contact: TeamHomeContact;
  playerCount: number;
  coachCount: number;
}

// 俱乐部API
export const clubApi = {
  // 获取俱乐部资料
  getProfile: () => api.get('/club/profile'),

  // 更新俱乐部资料
  updateProfile: (data: any) => api.put('/club/profile', data),

  // 获取工作台
  getDashboard: () => api.get('/club/dashboard'),

  // 获取比赛汇总统计
  getMatchSummaryStats: () => api.get('/club/match-summaries/summary'),

  // 获取球员列表
  getPlayers: (params?: { page?: number; pageSize?: number; keyword?: string; ageGroup?: string; position?: string; status?: string; sortBy?: string; sortOrder?: string; tag?: string }) =>
    api.get('/club/players', { params }),

  // 获取球员详情
  getPlayerDetail: (id: number) => api.get(`/club/players/${id}`),

  // 邀请球员
  invitePlayer: (data: { phone: string; name: string; ageGroup?: string; position?: string; message?: string }) =>
    api.post('/club/players/invite', data),

  // 批量导入球员
  importPlayers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/club/players/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 更新标签
  updatePlayerTags: (id: number, tags: string[]) =>
    api.put(`/club/players/${id}/tags`, { tags }),

  // 移除球员
  removePlayer: (id: number) => api.delete(`/club/players/${id}`),

  // 获取数据分析
  getAnalytics: (params?: { ageGroup?: string }) => api.get('/club/analytics', { params }),

  // 获取订单统计
  getOrderStats: () => api.get('/club/orders/stats'),

  // 获取球员自己的周报列表
  getPlayerWeeklyReports: (playerId: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/players/${playerId}/weekly-reports`, { params }),

  // ========== 球队赛季档案 ==========
  getTeamSeasonArchives: (teamId: number) =>
    api.get(`/club/teams/${teamId}/season-archives`),

  createTeamSeasonArchive: (teamId: number, data: {
    seasonName: string;
    startDate: string;
    endDate: string;
    description?: string;
  }) => api.post(`/club/teams/${teamId}/season-archives`, data),

  updateTeamSeasonArchive: (teamId: number, id: number, data: {
    seasonName?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => api.put(`/club/teams/${teamId}/season-archives/${id}`, data),

  deleteTeamSeasonArchive: (teamId: number, id: number) =>
    api.delete(`/club/teams/${teamId}/season-archives/${id}`),

  // ========== 公告管理 ==========
  getAnnouncements: (params?: { page?: number; pageSize?: number }) =>
    api.get('/club/announcements', { params }),

  createAnnouncement: (data: { title: string; content: string; priority?: string; targetType?: string; targetIds?: number[] }) =>
    api.post('/club/announcements', data),

  updateAnnouncement: (id: number, data: { title?: string; content?: string; priority?: string; targetType?: string; targetIds?: number[] }) =>
    api.put(`/club/announcements/${id}`, data),

  deleteAnnouncement: (id: number) =>
    api.delete(`/club/announcements/${id}`),

  // ========== 管理员操作日志 ==========
  getAdminLogs: (params?: { page?: number; pageSize?: number; action?: string; startTime?: string; endTime?: string }) =>
    api.get('/club/admin-logs', { params }),

  // ========== 候选名单 ==========
  getShortlist: (params?: { page?: number; pageSize?: number }) =>
    api.get('/club/shortlist', { params }),

  addToShortlist: (data: { playerId: number; note?: string }) =>
    api.post('/club/shortlist', data),

  updateShortlistNote: (playerId: number, data: { note?: string }) =>
    api.put(`/club/shortlist/${playerId}`, data),

  removeFromShortlist: (playerId: number) =>
    api.delete(`/club/shortlist/${playerId}`),
};

// 体测API
export const physicalTestApi = {
  // 获取体测活动列表
  getPhysicalTests: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get('/club/physical-tests', { params }),

  // 创建体测活动
  createPhysicalTest: (data: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    template: string;
    playerScope?: string;
    playerIds?: number[];
    notifyParents?: boolean;
    autoSendReport?: boolean;
  }) => api.post('/club/physical-tests', data),

  // 获取体测活动详情
  getPhysicalTestDetail: (id: number) =>
    api.get(`/club/physical-tests/${id}`),

  // 更新体测活动
  updatePhysicalTest: (id: number, data: any) =>
    api.put(`/club/physical-tests/${id}`, data),

  // 删除体测活动
  deletePhysicalTest: (id: number) =>
    api.delete(`/club/physical-tests/${id}`),

  // 发送通知
  notifyPhysicalTest: (id: number, data: { type: string; playerIds?: number[] }) =>
    api.post(`/club/physical-tests/${id}/notify`, data),

  // 获取体测数据列表
  getPhysicalTestRecords: (id: number, params?: { playerId?: number }) =>
    api.get(`/club/physical-tests/${id}/records`, { params }),

  // 录入体测数据
  createPhysicalTestRecord: (id: number, data: { playerId: number; testDate?: string; data: Record<string, number> }) =>
    api.post(`/club/physical-tests/${id}/records`, data),

  // 批量导入数据
  batchImportRecords: (id: number, file: File, testDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (testDate) formData.append('testDate', testDate);
    return api.post(`/club/physical-tests/${id}/records/batch`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 生成报告
  generateReports: (id: number, playerIds: number[]) =>
    api.post(`/club/physical-tests/${id}/generate-reports`, { playerIds }),

  // 自定义模板
  getCustomTemplates: () => api.get('/club/physical-tests/templates'),
  createCustomTemplate: (data: { name: string; description?: string; items: string[] }) =>
    api.post('/club/physical-tests/templates', data),
  deleteCustomTemplate: (id: number) => api.delete(`/club/physical-tests/templates/${id}`),
};

// 订单API
export const orderApi = {
  // 获取订单列表
  getOrders: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get('/club/orders', { params }),

  // 获取订单统计
  getOrderStats: () => api.get('/club/orders/stats'),

  // 批量下单
  createBatchOrders: (data: {
    playerIds: number[];
    serviceType: string;
    analystId?: number;
    remark?: string;
  }) => api.post('/club/orders/batch', data),
};

// 报告API
export const reportApi = {
  // 获取球员报告列表
  getPlayerReports: (playerId: number) =>
    api.get(`/club/players/${playerId}/physical-reports`),

  // 获取报告详情
  getReportDetail: (reportId: string | number) =>
    api.get(`/club/physical-reports/${reportId}`),

  // 导出体测报告
  downloadPhysicalReport: (reportId: string | number) =>
    api.get(`/club/physical-reports/${reportId}/export`, { responseType: 'blob' }),

  // 导出PDF
  exportPDF: (reportId: string) =>
    api.get(`/club/reports/${reportId}/export`, { responseType: 'blob' }),
};

// 比赛总结API
export const matchSummaryApi = {
  // 创建比赛总结(教练/俱乐部)
  createMatchSummary: (data: {
    teamId: number;
    matchName: string;
    matchDate: string;
    opponent: string;
    ourScore: number;
    opponentScore: number;
  }) => api.post('/match-summaries', data),

  // 更新比赛总结
  updateMatchSummary: (id: number, data: {
    matchName?: string;
    matchDate?: string;
    opponent?: string;
    ourScore?: number;
    opponentScore?: number;
  }) => api.put(`/match-summaries/${id}`, data),

  // 获取比赛总结详情
  getMatchSummary: (id: number) =>
    api.get(`/match-summaries/${id}`),

  // 列出球队比赛总结(支持状态筛选)
  getTeamMatchSummaries: (teamId: number, params?: {
    status?: 'pending' | 'player_submitted' | 'completed';
    page?: number;
    pageSize?: number;
  }) => api.get(`/teams/${teamId}/match-summaries`, { params }),

  // 列出球员参与的比赛总结
  getPlayerMatchSummaries: (playerId: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/players/${playerId}/match-summaries`, { params }),

  // 列出教练发起的比赛总结
  getCoachMatchSummaries: (params?: {
    status?: 'pending' | 'player_submitted' | 'completed';
    page?: number;
    pageSize?: number;
  }) => api.get('/coach/match-summaries', { params }),

  // 球员提交自评
  submitPlayerSummary: (id: number, data: {
    performance: string;
    goals: number;
    assists: number;
    highlights: string;
    improvements: string;
    nextMatchGoals: string;
  }) => api.post(`/match-summaries/${id}/player-summary`, data),

  // 教练提交点评
  submitCoachSummary: (id: number, data: {
    overallReview: string;
    tacticalAnalysis: string;
    keyMoments: string;
    playerReviews: Array<{ playerId: number; playerName: string; rating: number; comment: string }>;
  }) => api.post(`/match-summaries/${id}/coach-summary`, data),

  // 获取待处理数量
  getPendingCount: (teamId: number) =>
    api.get(`/teams/${teamId}/match-summaries/pending-count`),

  // 删除比赛总结
  deleteMatchSummary: (id: number) =>
    api.delete(`/match-summaries/${id}`),
};

// 通知API
export const notificationApi = {
  // 获取通知列表
  getNotifications: (params?: { page?: number; pageSize?: number }) =>
    api.get('/notifications', { params }),

  // 获取未读通知列表
  getUnreadNotifications: (params?: { page?: number; pageSize?: number }) =>
    api.get('/notifications/unread', { params }),

  // 获取未读数量
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  // 标记单条为已读
  markAsRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  // 标记全部为已读
  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  // 删除通知
  deleteNotification: (id: number) =>
    api.delete(`/notifications/${id}`),
};

// 教练API
export const coachApi = {
  // 获取教练资料
  getProfile: () => api.get('/coach/profile'),

  // 更新教练资料
  updateProfile: (data: {
    licenseType?: string;
    licenseNumber?: string;
    specialties?: string[];
    style?: string[];
    ageGroups?: string[];
    bio?: string;
    city?: string;
    coachingYears?: number;
    currentClub?: string;
    position?: string;  // 执教位置（同步到 users.position，球探地图筛选）
  }) => api.put('/coach/profile', data),

  // 获取教练公开主页（通过 coach id）
  getPublicProfile: (id: number) => api.get(`/coaches/${id}/public`),

  // 获取教练公开主页（通过 user id）
  getPublicProfileByUser: (userId: number) => api.get('/coaches/public', { params: { user_id: userId } }),

  // 获取教练工作台
  getDashboard: () => api.get('/coach/dashboard'),

  // 获取关注的球员列表
  getFollowedPlayers: (params?: { page?: number; pageSize?: number }) =>
    api.get('/coach/followed-players', { params }),

  // 获取我的球队列表
  getMyTeams: () =>
    api.get('/coach/teams'),

  // 获取球队球员
  getTeamPlayers: (teamId: number) =>
    api.get(`/teams/${teamId}/players`),

  // 获取球队教练
  getTeamCoaches: (teamId: number) =>
    api.get(`/teams/${teamId}/coaches`),

  // ========== 球员管理 ==========

  // 添加球员到球队
  addPlayer: (teamId: number, data: {
    phone: string;
    name?: string;
    position?: string;
    jerseyNumber?: string;
    age?: number;
    birthDate?: string;
    gender?: string;
  }) => api.post(`/teams/${teamId}/players`, data),

  // 更新球员信息
  updatePlayer: (teamId: number, playerId: number, data: {
    name?: string;
    position?: string;
    jerseyNumber?: string;
    status?: string;
  }) => api.put(`/teams/${teamId}/players/${playerId}`, data),

  // 移除球员
  removePlayer: (teamId: number, playerId: number) =>
    api.delete(`/teams/${teamId}/players/${playerId}`),

  // 更新球队信息
  updateTeam: (teamId: number, data: {
    name?: string;
    ageGroup?: string;
    description?: string;
  }) => api.put(`/teams/${teamId}`, data),

  // ========== 周报周期管理 ==========

  // 获取周报周期列表
  getWeeklyPeriods: (teamId: number, params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api.get(`/teams/${teamId}/weekly-periods`, { params }),

  // 获取周期统计
  getWeeklyPeriodStats: (teamId: number, periodId: number) =>
    api.get(`/teams/${teamId}/weekly-periods/${periodId}/stats`),

  // 获取周期内球员提交情况
  getWeeklyPeriodPlayers: (teamId: number, periodId: number, params?: {
    weekStart: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api.get(`/teams/${teamId}/weekly-periods/${periodId}/players`, { params }),

  // ========== 周报 ==========

  // 创建周报（主教练/俱乐部管理员）- 统一使用 /teams/:teamId/weekly-reports
  createWeeklyReport: (teamId: number, data: {
    playerIds: number[];
    weekStart: string;
    weekEnd?: string;
  }) =>
    api.post(`/teams/${teamId}/weekly-reports`, data),

  // 获取我发起的周报列表（教练/管理员用）
  getMyWeeklyReports: (params?: { page?: number; pageSize?: number }) =>
    api.get('/coach/weekly-reports', { params }),

  // 获取球员自己的周报列表
  getPlayerWeeklyReports: (playerId: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/players/${playerId}/weekly-reports`, { params }),

  // 获取周报详情
  getWeeklyReport: (reportId: number) =>
    api.get(`/coach/weekly-reports/${reportId}`),

  // 教练审核周报（多维度评分）
  reviewWeeklyReport: (reportId: number, data: {
    comment: string;
    coachAttitudeRating: number;
    coachTechniqueRating: number;
    coachTacticsRating: number;
    coachKnowledgeRating: number;
    strengthsAcknowledgment?: string;
    suggestions?: string;
    knowledgeFeedback?: string;
    nextWeekFocus?: string;
    recommendAward?: boolean;
    status: 'approved' | 'rejected';
  }) =>
    api.post(`/coach/weekly-reports/${reportId}/review`, data),

  // 一键提醒未提交球员 - 统一使用 /teams/:teamId/weekly-reports/remind
  remindWeeklyReport: (teamId: number, periodId: number) =>
    api.post(`/teams/${teamId}/weekly-reports/remind`, { periodId }),

  // 创建比赛总结
  createMatchSummary: (teamId: number, data: {
    matchName: string;
    matchDate: string;
    opponent: string;
    ourScore: number;
    opponentScore: number;
  }) =>
    api.post(`/teams/${teamId}/match-summaries`, data),

  // 更新比赛总结
  updateMatchSummary: (id: number, data: {
    matchName?: string;
    matchDate?: string;
    opponent?: string;
    ourScore?: number;
    opponentScore?: number;
  }) =>
    api.put(`/match-summaries/${id}`, data),

  // 获取我发起的比赛总结
  getMyMatchSummaries: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get('/coach/match-summaries', { params }),

  // ========== 球队主页 ==========

  // 获取球队主页配置（教练视角）
  getTeamHome: (teamId: number) =>
    api.get(`/teams/${teamId}/homepage`),

  // 保存球队主页配置
  saveTeamHome: (teamId: number, data: {
    hero?: TeamHomeHero;
    about?: TeamHomeAbout;
    honors?: TeamHonor[];
    contact?: TeamHomeContact;
  }) =>
    api.put(`/teams/${teamId}/homepage`, data),

  // 更新 Hero
  updateTeamHomeHero: (teamId: number, hero: TeamHomeHero) =>
    api.put(`/teams/${teamId}/homepage/hero`, hero),

  // 更新 About
  updateTeamHomeAbout: (teamId: number, about: TeamHomeAbout) =>
    api.put(`/teams/${teamId}/homepage/about`, about),

  // 更新联系方式
  updateTeamHomeContact: (teamId: number, contact: TeamHomeContact) =>
    api.put(`/teams/${teamId}/homepage/contact`, contact),

  // 添加荣誉
  addTeamHonor: (teamId: number, honor: TeamHonor) =>
    api.post(`/teams/${teamId}/homepage/honors`, honor),

  // 删除荣誉
  deleteTeamHonor: (teamId: number, honorId: number) =>
    api.delete(`/teams/${teamId}/homepage/honors/${honorId}`),

  // ========== 动态管理 ==========

  // 获取动态列表
  getTeamDynamics: (teamId: number) =>
    api.get(`/teams/${teamId}/homepage/dynamics`),

  // 添加动态
  addTeamDynamic: (teamId: number, dynamic: {
    title: string;
    content: string;
    type: string;
    images?: string[];
  }) =>
    api.post(`/teams/${teamId}/homepage/dynamics`, dynamic),

  // 删除动态
  deleteTeamDynamic: (teamId: number, dynamicId: number) =>
    api.delete(`/teams/${teamId}/homepage/dynamics/${dynamicId}`),

  // ========== 体测管理 ==========

  // 获取球队体测活动列表
  getTeamPhysicalTests: (teamId: number, params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get(`/teams/${teamId}/physical-tests`, { params }),

  // 创建体测活动
  createTeamPhysicalTest: (teamId: number, data: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    template: string;
    customTemplateId?: number;
    customItems?: string[];
    playerScope?: string;
    playerIds?: number[];
  }) =>
    api.post(`/teams/${teamId}/physical-tests`, data),

  // 获取体测活动详情
  getTeamPhysicalTestDetail: (teamId: number, testId: number) =>
    api.get(`/teams/${teamId}/physical-tests/${testId}`),

  // 更新体测活动
  updateTeamPhysicalTest: (teamId: number, testId: number, data: any) =>
    api.put(`/teams/${teamId}/physical-tests/${testId}`, data),

  // 删除体测活动
  deleteTeamPhysicalTest: (teamId: number, testId: number) =>
    api.delete(`/teams/${teamId}/physical-tests/${testId}`),

  // 获取体测数据
  getTeamPhysicalTestRecords: (teamId: number, testId: number, params?: { playerId?: number }) =>
    api.get(`/teams/${teamId}/physical-tests/${testId}/records`, { params }),

  // 录入体测数据
  createTeamPhysicalTestRecord: (teamId: number, testId: number, data: { playerId: number; testDate?: string; data: Record<string, number> }) =>
    api.post(`/teams/${teamId}/physical-tests/${testId}/records`, data),

  // ========== 足球经历 ==========

  // 获取足球经历列表
  getFootballExperiences: () => api.get('/coach/football-experiences'),

  // 创建足球经历
  createFootballExperience: (data: {
    stage: string;
    teamName: string;
    position?: string;
    startYear: number;
    endYear?: number;
    level?: string;
    honors?: string;
  }) => api.post('/coach/football-experiences', data),

  // 更新足球经历
  updateFootballExperience: (id: number, data: {
    stage?: string;
    teamName?: string;
    position?: string;
    startYear?: number;
    endYear?: number;
    level?: string;
    honors?: string;
  }) => api.put(`/coach/football-experiences/${id}`, data),

  // 删除足球经历
  deleteFootballExperience: (id: number) =>
    api.delete(`/coach/football-experiences/${id}`),
};

// 统一球队管理 API（同时支持俱乐部管理员和教练）
export const teamApi = {
  // ========== 球队列表（俱乐部维度）==========

  // 获取俱乐部的球队列表
  getTeams: (clubId: number, params?: { ageGroup?: string; status?: string; includeDeleted?: boolean }) =>
    api.get(`/clubs/${clubId}/teams`, { params }),

  // 创建球队（仅俱乐部管理员）
  createTeam: (clubId: number, data: {
    name: string;
    ageGroup: string;
    description?: string;
    birthYearStart?: number;
    birthYearEnd?: number;
  }) => api.post(`/clubs/${clubId}/teams`, data),

  // ========== 我的球队（教练维度）==========

  // 获取我（教练）的球队列表
  getMyTeams: () => api.get('/coach/teams'),

  // ========== 球队基本信息 ==========

  // 获取球队详情
  getTeamDetail: (teamId: number) =>
    api.get(`/teams/${teamId}`),

  // 更新球队信息
  updateTeam: (teamId: number, data: {
    name?: string;
    ageGroup?: string;
    description?: string;
  }) => api.put(`/teams/${teamId}`, data),

  // 删除球队（仅俱乐部管理员）
  deleteTeam: (teamId: number) =>
    api.delete(`/teams/${teamId}`),

  // 恢复球队（仅俱乐部管理员）
  restoreTeam: (teamId: number) =>
    api.put(`/teams/${teamId}/restore`),

  // ========== 球员管理 ==========

  // 获取球队球员列表
  getTeamPlayers: (teamId: number) =>
    api.get(`/teams/${teamId}/players`),

  // 添加球员到球队
  addPlayer: (teamId: number, data: {
    phone: string;
    name?: string;
    position?: string;
    jerseyNumber?: string;
    age?: number;
    birthDate?: string;
    gender?: string;
  }) => api.post(`/teams/${teamId}/players`, data),

  // 更新球员信息
  updatePlayer: (teamId: number, playerId: number, data: {
    name?: string;
    position?: string;
    jerseyNumber?: string;
    status?: string;
  }) => api.put(`/teams/${teamId}/players/${playerId}`, data),

  // 移除球员
  removePlayer: (teamId: number, playerId: number) =>
    api.delete(`/teams/${teamId}/players/${playerId}`),

  // ========== 教练管理 ==========

  // 获取球队教练列表
  getTeamCoaches: (teamId: number) =>
    api.get(`/teams/${teamId}/coaches`),

  // 添加教练到球队（仅俱乐部管理员）
  addCoach: (teamId: number, data: {
    userId: number;
    role: string;
  }) => api.post(`/teams/${teamId}/coaches`, data),

  // 更新教练信息（仅俱乐部管理员）
  updateCoach: (teamId: number, coachId: number, data: {
    role?: string;
    status?: string;
  }) => api.put(`/teams/${teamId}/coaches/${coachId}`, data),

  // 移除教练（仅俱乐部管理员）
  removeCoach: (teamId: number, coachId: number) =>
    api.delete(`/teams/${teamId}/coaches/${coachId}`),

  // ========== 邀请管理 ==========

  // 创建邀请
  createInvitation: (teamId: number, data: {
    type: 'player' | 'coach';
    targetUserId?: number;
    targetPhone?: string;
  }) => api.post(`/teams/${teamId}/invitations`, data),

  // 获取邀请列表
  getInvitations: (teamId: number, params?: { status?: string }) =>
    api.get(`/teams/${teamId}/invitations`, { params }),

  // ========== 入队申请管理 ==========

  // 获取球队申请列表
  getTeamApplications: (teamId: number, params?: { status?: string }) =>
    api.get(`/teams/${teamId}/applications`, { params }),

  // 提交申请
  createApplication: (teamId: number, data: {
    type: 'join' | 'trial';
    reason?: string;
  }) => api.post(`/teams/${teamId}/applications`, data),

  // 审核申请
  reviewApplication: (teamId: number, applicationId: number, data: {
    status: 'approved' | 'rejected';
    responseNote?: string;
  }) => api.put(`/teams/${teamId}/applications/${applicationId}`, data),

  // 获取我的申请列表
  getMyApplications: () => api.get('/applications/my'),

  // ========== 周报管理 ==========

  // 创建周报（主教练/俱乐部管理员）- 统一使用 /teams/:teamId/weekly-reports
  createWeeklyReport: (teamId: number, data: {
    playerIds: number[];
    weekStart: string;
    weekEnd?: string;
  }) => api.post(`/teams/${teamId}/weekly-reports`, data),

  // 获取球队周报列表 - 统一使用 /teams/:teamId/weekly-reports
  getWeeklyReports: (teamId: number, params?: {
    status?: string;
    playerId?: number;
    page?: number;
    pageSize?: number;
  }) => api.get(`/teams/${teamId}/weekly-reports`, { params }),

  // 导出周报（CSV格式）- 统一使用 /teams/:teamId/weekly-reports/export
  exportWeeklyReports: (teamId: number, params?: {
    weekStart?: string;
    status?: string;
  }) => api.get(`/teams/${teamId}/weekly-reports/export`, {
    params,
    responseType: 'blob',
  }),

  // 一键提醒未提交球员 - 统一使用 /teams/:teamId/weekly-reports/remind
  remindWeeklyReport: (teamId: number, periodId: number) =>
    api.post(`/teams/${teamId}/weekly-reports/remind`, { periodId }),

  // ========== 比赛总结管理 ==========

  // 创建比赛总结（主教练/俱乐部管理员）
  createMatchSummary: (teamId: number, data: {
    matchName: string;
    matchDate: string;
    opponent: string;
    ourScore: number;
    opponentScore: number;
    playerIds: number[];
  }) => api.post(`/teams/${teamId}/match-summaries`, data),

  // 获取比赛总结列表
  getMatchSummaries: (teamId: number, params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) => api.get(`/teams/${teamId}/match-summaries`, { params }),

  // ========== 体测管理 ==========

  // 获取体测列表
  getPhysicalTests: (params?: {
    teamId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => api.get('/physical-tests', { params }),

  // 创建体测活动
  createPhysicalTest: (data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    testItems: string[];
    teamIds?: number[];
  }) => api.post('/physical-tests', data),

  // 获取体测详情
  getPhysicalTestDetail: (id: number) => api.get(`/physical-tests/${id}`),

  // 获取体测记录
  getPhysicalTestRecords: (id: number, params?: {
    playerId?: number;
    page?: number;
    pageSize?: number;
  }) => api.get(`/physical-tests/${id}/records`, { params }),

  // 录入体测数据
  createPhysicalTestRecord: (id: number, data: { playerId: number; testDate?: string; data: Record<string, number> }) =>
    api.post(`/physical-tests/${id}/records`, data),
};

export default api;
