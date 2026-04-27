import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Users, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Calendar, Bell, Download, Loader2, BarChart3,
  Search, Filter, Eye, MessageSquare, Award,
  type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { coachApi } from '../../../services/club';
import WeeklyReportDetail from './WeeklyReportDetail';
import { CardGridSkeleton } from '../../../components/ui/loading';

// 周期状态类型
interface WeeklyPeriod {
  id: number;
  teamId: number;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  deadline: string;
  status: 'active' | 'closed' | 'archived';
  totalPlayers: number;
  submittedCount: number;
  reviewedCount: number;
  rejectedCount: number;
  createdAt: string;
}

// 球员提交状态
interface PlayerReportStatus {
  id?: number; // 后端WeeklyReportResponse.ID
  reportId?: number; // 后端WeeklyReportResponse.ReportID (兼容)
  playerId: number;
  playerName: string;
  jerseyNumber?: string;
  position?: string;
  avatar?: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  selfRatings?: {
    attitude: number;
    technique: number;
    teamwork: number;
  };
  coachRatings?: {
    attitude: number;
    technique: number;
    tactics: number;
    knowledge: number;
  };
}

interface WeeklyReportResponse {
  id?: number;
  reportId?: number;
  playerId: number;
  playerName?: string;
  jerseyNumber?: string;
  position?: string;
  avatar?: string;
  submitStatus?: string;
  reviewStatus?: string;
  submittedAt?: string;
  reviewedAt?: string;
  selfAttitudeRating?: number;
  selfTechniqueRating?: number;
  selfTeamworkRating?: number;
  coachAttitudeRating?: number;
  coachTechniqueRating?: number;
  coachTacticsRating?: number;
  coachKnowledgeRating?: number;
}

const mapReportStatus = (report: WeeklyReportResponse): PlayerReportStatus['status'] => {
  if (report.reviewStatus === 'approved') return 'reviewed';
  if (report.reviewStatus === 'rejected') return 'rejected';
  if (report.submitStatus === 'submitted') return 'submitted';
  return 'pending';
};

const hasRatings = (...ratings: Array<number | undefined>) => ratings.some(rating => Number(rating) > 0);

const mapPlayerReport = (report: WeeklyReportResponse, players: WeeklyPeriodListProps['players']): PlayerReportStatus => {
  const player = players.find(item => item.id === report.playerId);
  const selfRatings = hasRatings(report.selfAttitudeRating, report.selfTechniqueRating, report.selfTeamworkRating)
    ? {
        attitude: report.selfAttitudeRating || 0,
        technique: report.selfTechniqueRating || 0,
        teamwork: report.selfTeamworkRating || 0,
      }
    : undefined;
  const coachRatings = hasRatings(
    report.coachAttitudeRating,
    report.coachTechniqueRating,
    report.coachTacticsRating,
    report.coachKnowledgeRating,
  )
    ? {
        attitude: report.coachAttitudeRating || 0,
        technique: report.coachTechniqueRating || 0,
        tactics: report.coachTacticsRating || 0,
        knowledge: report.coachKnowledgeRating || 0,
      }
    : undefined;

  return {
    id: report.id,
    reportId: report.reportId || report.id,
    playerId: report.playerId,
    playerName: report.playerName || player?.name || '未知球员',
    jerseyNumber: report.jerseyNumber || player?.jerseyNumber,
    position: report.position || player?.position,
    avatar: report.avatar || player?.avatar,
    status: mapReportStatus(report),
    submittedAt: report.submittedAt,
    reviewedAt: report.reviewedAt,
    selfRatings,
    coachRatings,
  };
};

interface WeeklyPeriodListProps {
  teamId: number;
  players: Array<{
    id: number;
    name: string;
    jerseyNumber?: string;
    position?: string;
    avatar?: string;
  }>;
  onViewPeriodDetail?: (period: WeeklyPeriod) => void;
}

const WeeklyPeriodList: React.FC<WeeklyPeriodListProps> = ({ teamId, players, onViewPeriodDetail }) => {
  const [periods, setPeriods] = useState<WeeklyPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<WeeklyPeriod | null>(null);
  const [playerReports, setPlayerReports] = useState<PlayerReportStatus[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [remindingPeriodId, setRemindingPeriodId] = useState<number | null>(null);
  const [viewingReportId, setViewingReportId] = useState<number | null>(null);

  // 加载周期列表
  const loadPeriods = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const res = await coachApi.getWeeklyPeriods(teamId, { page: 1, pageSize: 20 });
      if (res.data?.success) {
        setPeriods(res.data.data?.list || []);
      } else {
        setPeriods([]);
      }
    } catch (error) {
      console.error('加载周报周期失败:', error);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // 加载周期内的球员提交情况
  const loadPeriodPlayers = useCallback(async (periodId: number, weekStart: string) => {
    try {
      const res = await coachApi.getWeeklyPeriodPlayers(teamId, periodId, { weekStart });
      if (res.data?.success) {
        const reports = res.data.data?.list || [];
        setPlayerReports(reports.map((report: WeeklyReportResponse) => mapPlayerReport(report, players)));
      } else {
        setPlayerReports([]);
      }
    } catch (error) {
      console.error('加载球员提交情况失败:', error);
      setPlayerReports([]);
    }
  }, [teamId, players]);

  // 处理查看周期详情
  const handleViewPeriod = (period: WeeklyPeriod) => {
    setSelectedPeriod(period);
    loadPeriodPlayers(period.id, period.weekStart);
    setViewMode('detail');
  };

  // 返回列表视图
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPeriod(null);
    setPlayerReports([]);
  };

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  // 一键提醒
  const handleRemind = async (periodId: number) => {
    setRemindingPeriodId(periodId);
    try {
      await coachApi.remindWeeklyReport(teamId, periodId);
      toast.success('提醒已发送！');
    } catch (error) {
      console.error('发送提醒失败:', error);
      toast.error('发送提醒失败');
    } finally {
      setRemindingPeriodId(null);
    }
  };

  // 查看周期详情
  const handleViewDetail = (period: WeeklyPeriod) => {
    setSelectedPeriod(period);
    loadPeriodPlayers(period.id, period.weekStart);
    setViewMode('detail');
    onViewPeriodDetail?.(period);
  };

  // 查看周报详情
  const handleViewReport = (reportId: number) => {
    // 使用真实的周报ID
    setViewingReportId(reportId);
  };

  // 返回球员列表
  const handleBackFromReport = () => {
    setViewingReportId(null);
  };

  // 返回列表
  const handleBack = () => {
    setViewMode('list');
    setSelectedPeriod(null);
    setPlayerReports([]);
  };

  // 获取状态颜色和标签
  const getStatusColor = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: LucideIcon }> = {
      active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '进行中', icon: Clock },
      closed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '已截止', icon: CheckCircle },
      archived: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '已归档', icon: FileText },
    };
    return map[status] || map.active;
  };

  const getPlayerStatusColor = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '待填写' },
      submitted: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '待审核' },
      reviewed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '已通过' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '已退回' },
    };
    return map[status] || map.pending;
  };

  // 计算剩余时间
  const getTimeRemaining = (deadline: string) => {
    const end = new Date(deadline).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return '已截止';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `剩余 ${days} 天`;
    return `剩余 ${hours} 小时`;
  };

  // 过滤后的球员列表
  const filteredPlayers = playerReports.filter(p => {
    const matchSearch = p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jerseyNumber?.includes(searchQuery);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ========== 周期列表视图 ==========
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="全部周期"
            value={periods.length}
            icon={Calendar}
            color="white"
          />
          <StatCard
            label="进行中"
            value={periods.filter(p => p.status === 'active').length}
            icon={Clock}
            color="emerald"
          />
          <StatCard
            label="本周提交率"
            value={(() => {
              const active = periods.find(p => p.status === 'active');
              if (!active || active.totalPlayers === 0) return '0%';
              return `${Math.round((active.submittedCount / active.totalPlayers) * 100)}%`;
            })()}
            icon={CheckCircle}
            color="blue"
          />
          <StatCard
            label="待审核"
            value={periods.reduce((sum, p) => sum + (p.submittedCount - p.reviewedCount - p.rejectedCount), 0)}
            icon={AlertCircle}
            color="amber"
          />
        </div>

        {/* 周期列表 */}
        {loading ? (
          <CardGridSkeleton count={3} columns={1} />
        ) : periods.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无周报周期</p>
            <p className="text-sm text-gray-500 mt-2">点击"发起周报"创建第一个周期</p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map(period => {
              const statusStyle = getStatusColor(period.status);
              const StatusIcon = statusStyle.icon;
              const submitRate = period.totalPlayers > 0
                ? Math.round((period.submittedCount / period.totalPlayers) * 100)
                : 0;
              const reviewRate = period.submittedCount > 0
                ? Math.round((period.reviewedCount / period.submittedCount) * 100)
                : 0;

              return (
                <div
                  key={period.id}
                  className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 hover:border-emerald-500/30 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(period)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${statusStyle.bg} rounded-xl flex items-center justify-center`}>
                        <StatusIcon className={`w-7 h-7 ${statusStyle.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-white">{period.weekLabel}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            截止: {new Date(period.deadline).toLocaleDateString('zh-CN')}
                          </span>
                          {period.status === 'active' && (
                            <span className="text-amber-400">
                              {getTimeRemaining(period.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* 提交进度 */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{submitRate}%</div>
                        <div className="text-xs text-gray-400">提交率</div>
                        <div className="text-xs text-gray-500">
                          {period.submittedCount}/{period.totalPlayers}人
                        </div>
                      </div>

                      {/* 审核进度 */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{reviewRate}%</div>
                        <div className="text-xs text-gray-400">审核率</div>
                        <div className="text-xs text-gray-500">
                          {period.reviewedCount}/{period.submittedCount}人
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        {period.status === 'active' && period.submittedCount < period.totalPlayers && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemind(period.id);
                            }}
                            disabled={remindingPeriodId === period.id}
                            className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors"
                            title="一键提醒"
                          >
                            {remindingPeriodId === period.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Bell className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${submitRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========== 周报详情视图 ==========
  if (viewingReportId) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f1419] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <WeeklyReportDetail
          reportId={viewingReportId}
          teamId={teamId}
          onBack={handleBackFromReport}
          onReviewed={() => {
            handleBackFromReport();
            if (selectedPeriod) {
              loadPeriodPlayers(selectedPeriod.id, selectedPeriod.weekStart);
            }
          }}
        />
      </div>
    );
  }

  // ========== 周期详情视图 ==========
  if (!selectedPeriod) return null;

  const pendingCount = playerReports.filter(p => p.status === 'pending').length;
  const submittedCount = playerReports.filter(p => p.status === 'submitted').length;
  const reviewedCount = playerReports.filter(p => p.status === 'reviewed').length;
  const rejectedCount = playerReports.filter(p => p.status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          ← 返回
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{selectedPeriod.weekLabel}</h2>
          <p className="text-sm text-gray-400">
            周报详情 · 截止 {new Date(selectedPeriod.deadline).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="全部球员" value={playerReports.length} icon={Users} color="white" />
        <StatCard label="待填写" value={pendingCount} icon={Clock} color="gray" />
        <StatCard label="待审核" value={submittedCount} icon={AlertCircle} color="amber" />
        <StatCard label="已通过" value={reviewedCount} icon={CheckCircle} color="green" />
        <StatCard label="已退回" value={rejectedCount} icon={XCircle} color="red" />
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索球员姓名或号码..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">全部状态</option>
          <option value="pending">待填写</option>
          <option value="submitted">待审核</option>
          <option value="reviewed">已通过</option>
          <option value="rejected">已退回</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white hover:border-emerald-500 transition-colors">
          <Download className="w-4 h-4" /> 导出
        </button>
      </div>

      {/* 球员列表 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">球员信息</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">提交状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">自评均分</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">教练评分</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">时间</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无符合条件的球员
                </td>
              </tr>
            ) : (
              filteredPlayers.map(player => {
                const statusStyle = getPlayerStatusColor(player.status);
                const selfAvg = player.selfRatings
                  ? ((player.selfRatings.attitude + player.selfRatings.technique + player.selfRatings.teamwork) / 3).toFixed(1)
                  : '-';
                const coachAvg = player.coachRatings
                  ? ((player.coachRatings.attitude + player.coachRatings.technique + player.coachRatings.tactics + player.coachRatings.knowledge) / 4).toFixed(1)
                  : '-';

                return (
                  <tr key={player.playerId} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center text-white font-semibold">
                          {player.playerName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.playerName}</div>
                          <div className="text-sm text-gray-500">
                            {player.position} · #{player.jerseyNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {player.selfRatings ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{selfAvg}</span>
                          <span className="text-xs text-gray-500">
                            态度{player.selfRatings.attitude.toFixed(1)} · 技术{player.selfRatings.technique.toFixed(1)} · 协作{player.selfRatings.teamwork.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {player.coachRatings ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{coachAvg}</span>
                          <Award className="w-4 h-4 text-amber-400" />
                        </div>
                      ) : (
                        <span className="text-gray-500">待审核</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {player.submittedAt ? (
                        <span>提交: {new Date(player.submittedAt).toLocaleDateString('zh-CN')}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {player.reportId ? (
                          <>
                            <button
                              onClick={() => handleViewReport(player.reportId!)}
                              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {player.status === 'submitted' && (
                              <button
                                onClick={() => handleViewReport(player.reportId!)}
                                className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors"
                                title="审核评价"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">待填写</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    white: { bg: 'bg-gray-800', icon: 'text-gray-400', text: 'text-white' },
    emerald: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400', text: 'text-blue-400' },
    amber: { bg: 'bg-amber-500/20', icon: 'text-amber-400', text: 'text-amber-400' },
    green: { bg: 'bg-green-500/20', icon: 'text-green-400', text: 'text-green-400' },
    red: { bg: 'bg-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
    gray: { bg: 'bg-gray-500/20', icon: 'text-gray-400', text: 'text-gray-400' },
  };
  const style = colorMap[color] || colorMap.white;

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${style.icon}`} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${style.text}`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};

export default WeeklyPeriodList;
