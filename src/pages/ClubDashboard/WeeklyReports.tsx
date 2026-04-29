import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, Star, Search,
  Plus, ChevronRight, Calendar, User, Edit2, Check, X, Loader2,
  ThumbsUp, AlertCircle, Bell, Shield, Download, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import ReactECharts from '../../components/charts/ReactECharts';
import { teamApi } from '../../services/club';
import { weeklyReportApi } from '../../services/api';
import WeeklyReportDetail from './components/WeeklyReportDetail';
import ExportComplianceModal from './components/ExportComplianceModal';
import type { ExportPurpose } from './components/ExportComplianceModal';
import { ListItemSkeleton } from '../../components/ui/loading';
import type { Player } from './types';

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as { response?: { data?: { message?: string } } } | undefined;
  return axiosError?.response?.data?.message || fallback;
};

interface WeeklyReportResponse {
  id: number;
  teamId: number;
  playerId: number;
  playerName: string;
  coachId: number;
  weekStart: string;
  weekEnd: string;
  knowledgeSummary: string;
  tacticalContent: string;
  physicalCondition: string;
  matchPerformance: string;
  selfAttitudeRating: number;
  selfTechniqueRating: number;
  selfTeamworkRating: number;
  improvements: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewComment: string;
  coachAttitudeRating?: number;
  createdAt: string;
}

// 根据周起始日期生成周标签
const getWeekLabel = (weekStart: string) => {
  const date = new Date(weekStart);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 6);
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();
  return `${year}年${month}月${day}日 - ${endMonth}月${endDay}日`;
};

interface Team {
  id: number;
  name: string;
  logo?: string;
  category?: string;
}

interface WeeklyReportsProps {
  onBack: () => void;
  teamId?: number;
  teamName?: string;
  userId?: number;
  userRole?: 'player' | 'coach';
  isAdmin?: boolean;
  clubName?: string;
  clubId?: number;
}

const WeeklyReports: React.FC<WeeklyReportsProps> = ({ onBack, teamId: initialTeamId, teamName: initialTeamName, userId = 1, userRole = 'coach', isAdmin = true, clubName, clubId }) => {
  const [reports, setReports] = useState<WeeklyReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'thisWeek' | 'lastWeek' | string>('all');
  const [error, setError] = useState<string | null>(null);

  // 球队选择相关
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(initialTeamId);
  const [selectedTeamName, setSelectedTeamName] = useState<string | undefined>(initialTeamName);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<{ userId: number; name: string }[]>([]);

  // 加载球队列表
  const loadTeams = useCallback(async () => {
    if (initialTeamId) return; // 如果传入了 teamId，不需要加载球队列表
    setLoadingTeams(true);
    try {
      // 管理员获取俱乐部下所有球队，教练获取自己负责的球队
      const response = isAdmin && clubId
        ? await teamApi.getTeams(clubId)
        : await teamApi.getMyTeams();
      if (response.data?.success) {
        const teamList = response.data.data?.list || response.data.data || [];
        setTeams(teamList);
        // 如果有球队，默认选择第一个
        if (teamList.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamList[0].id);
          setSelectedTeamName(teamList[0].name);
        }
      }
    } catch (error) {
      console.error('加载球队列表失败:', error);
    } finally {
      setLoadingTeams(false);
    }
  }, [initialTeamId, selectedTeamId, isAdmin, clubId]);

  const loadReports = useCallback(async () => {
    const currentTeamId = selectedTeamId || initialTeamId;
    if (!currentTeamId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await teamApi.getWeeklyReports(currentTeamId, {
        status: activeTab === 'all' ? undefined : activeTab,
        page: 1,
        pageSize: 50
      });
      if (response.data?.success) {
        setReports(response.data.data?.list || response.data.data || []);
      } else {
        setError(response.data?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载周报失败:', error);
      setError(getAxiosErrorMessage(error, '加载周报失败，请重试'));
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, initialTeamId, activeTab]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (selectedTeamId || initialTeamId) {
      loadReports();
      loadTeamPlayers();
    }
  }, [loadReports, selectedTeamId, initialTeamId]);

  const loadTeamPlayers = useCallback(async () => {
    const currentTeamId = selectedTeamId || initialTeamId;
    if (!currentTeamId) return;
    try {
      const res = await teamApi.getTeamPlayers(currentTeamId);
      const list = res.data?.data?.list || res.data?.data || [];
      setTeamPlayers(list.map((p: Player) => ({ userId: p.userId || p.id, name: p.name })));
    } catch (error) {
      console.error('加载球队球员失败:', error);
    }
  }, [selectedTeamId, initialTeamId]);

  // 一键提醒
  const handleRemind = async (periodId?: number) => {
    const currentTeamId = selectedTeamId || initialTeamId;
    if (!currentTeamId) return;
    try {
      const response = await teamApi.remindWeeklyReport(currentTeamId, periodId || 0);
      if (response.data?.success) {
        toast.success('提醒已发送');
      } else {
        toast.error(response.data?.message || '发送失败');
      }
    } catch (error) {
      toast.error(getAxiosErrorMessage(error, '发送提醒失败'));
    }
  };

  // 导出周报
  const [exporting, setExporting] = useState(false);
  const handleExport = async (purpose: ExportPurpose, note: string) => {
    const currentTeamId = selectedTeamId || initialTeamId;
    if (!currentTeamId) return;
    setExporting(true);
    try {
      const response = await teamApi.exportWeeklyReports(currentTeamId, {
        status: activeTab === 'all' ? undefined : activeTab,
      });

      const purposeMap: Record<ExportPurpose, string> = {
        internal_training: '内部训练分析',
        parent_communication: '家长沟通',
        other: '其他',
      };
      const watermark = `本文件由「${clubName || '本俱乐部'}」于 ${new Date().toLocaleString('zh-CN')} 导出，用途：${purposeMap[purpose]}${note ? `（${note}）` : ''}。包含未成年人个人信息，仅限内部使用，禁止向第三方泄露。`;

      let csvText = '';
      if (response.data instanceof Blob) {
        csvText = await response.data.text();
      } else {
        csvText = String(response.data);
      }
      const watermarkedCsv = watermark + '\n' + csvText;

      const blob = new Blob(['\ufeff' + watermarkedCsv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `周报数据_${selectedTeamName || '球队'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error(getAxiosErrorMessage(error, '导出失败，请重试'));
    } finally {
      setExporting(false);
    }
  };

  // 周期判断
  const getWeekPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(startOfWeek.getDate() - 1);
    endOfLastWeek.setHours(23, 59, 59, 999);
    if (date >= startOfWeek) return 'thisWeek';
    if (date >= startOfLastWeek && date <= endOfLastWeek) return 'lastWeek';
    return 'other';
  };

  // 动态提取周期选项
  const periodOptions = useMemo(() => {
    const labels = Array.from(new Set(reports.map(r => getWeekLabel(r.weekStart)).filter(Boolean)));
    return labels.sort();
  }, [reports]);

  // 过滤
  const filteredReports = reports.filter(r => {
    const matchSearch = !searchQuery || r.playerName.includes(searchQuery);
    const matchTab = activeTab === 'all' || r.reviewStatus === activeTab;
    let matchPeriod = true;
    if (periodFilter === 'thisWeek') {
      matchPeriod = getWeekPeriod(r.createdAt) === 'thisWeek';
    } else if (periodFilter === 'lastWeek') {
      matchPeriod = getWeekPeriod(r.createdAt) === 'lastWeek';
    } else if (periodFilter !== 'all') {
      matchPeriod = getWeekLabel(r.weekStart) === periodFilter;
    }
    return matchSearch && matchTab && matchPeriod;
  });

  // 统计
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.reviewStatus === 'pending').length,
    approved: reports.filter(r => r.reviewStatus === 'approved').length,
    rejected: reports.filter(r => r.reviewStatus === 'rejected').length,
  };

  // 周报提交率（基于 knowledgeSummary 判断已提交）
  const submittedPlayerIds = new Set(
    reports
      .filter(r => r.knowledgeSummary && r.knowledgeSummary.trim() !== '')
      .map(r => r.playerId)
  );
  const submittedCount = submittedPlayerIds.size;
  const totalPlayers = teamPlayers.length;
  const submitRate = totalPlayers > 0 ? Math.round((submittedCount / totalPlayers) * 100) : 0;

  // 状态徽章
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock, label: '待审核' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: '已通过' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: '已退回' },
    };
    const s = config[status] || config.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  // 星级评分
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">周报管理</h1>
              <p className="text-gray-400 mt-1">
                {selectedTeamName || initialTeamName ? `${selectedTeamName || initialTeamName} · ` : ''}
                {isAdmin ? '查看球队周报（评价审核请交由教练完成）' : userRole === 'coach' ? '审核球员周报' : '填写/查看周报'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 球队选择器 - 仅在未传入 teamId 时显示 */}
            {!initialTeamId && teams.length > 0 && (
              <select
                value={selectedTeamId || ''}
                onChange={(e) => {
                  const teamId = Number(e.target.value);
                  setSelectedTeamId(teamId);
                  const team = teams.find(t => t.id === teamId);
                  setSelectedTeamName(team?.name);
                }}
                className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <button
                onClick={() => handleRemind()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl transition-colors"
              >
                <Bell className="w-4 h-4" /> 一键提醒
              </button>
            )}
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={exporting || reports.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-gray-800 disabled:text-gray-500 text-emerald-400 rounded-xl transition-colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              导出CSV
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={loadReports} className="ml-auto text-sm underline">重试</button>
          </div>
        )}

        {/* 加载球队列表 */}
        {loadingTeams && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="ml-3 text-gray-400">加载球队列表...</span>
          </div>
        )}

        {/* 无球队提示 */}
        {!loadingTeams && !initialTeamId && teams.length === 0 && (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无球队，请先创建球队</p>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* 周报提交率 */}
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm text-gray-400">本周周报提交率</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${submitRate >= 80 ? 'bg-emerald-500/10 text-emerald-400' : submitRate >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                {submitRate >= 80 ? '达标' : submitRate >= 50 ? '需跟进' : '严重滞后'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1" style={{ height: 80 }}>
                <ReactECharts
                  option={{
                    series: [{
                      type: 'gauge',
                      startAngle: 180,
                      endAngle: 0,
                      min: 0,
                      max: 100,
                      radius: '110%',
                      center: ['50%', '70%'],
                      itemStyle: { color: submitRate >= 80 ? '#10b981' : submitRate >= 50 ? '#f59e0b' : '#ef4444' },
                      progress: { show: true, width: 10, roundCap: true },
                      pointer: { show: false },
                      axisLine: { lineStyle: { width: 10, color: [[1, '#1f2937']] } },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      detail: {
                        valueAnimation: true,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#fff',
                        offsetCenter: [0, '-10%'],
                        formatter: '{value}%',
                      },
                      data: [{ value: submitRate }],
                    }],
                  }}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{submittedCount}</div>
                <div className="text-xs text-gray-500">/ {totalPlayers} 已提交</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
              <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
              <div className="text-sm text-gray-400">待审核</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <div className="text-sm text-gray-400">已通过</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-sm text-gray-400">已退回</div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-800">
          {[
            { id: 'all', label: '全部', count: stats.total },
            { id: 'pending', label: '待审核', count: stats.pending },
            { id: 'approved', label: '已通过', count: stats.approved },
            { id: 'rejected', label: '已退回', count: stats.rejected },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-800">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球员姓名..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">全部周期</option>
              <option value="thisWeek">本周</option>
              <option value="lastWeek">上周</option>
              {periodOptions.length > 0 && <option disabled>── 指定周期 ──</option>}
              {periodOptions.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
            {(searchQuery || periodFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setPeriodFilter('all'); }}
                className="px-3 py-2.5 text-sm text-gray-400 hover:text-white bg-[#1a1f2e] border border-gray-700 rounded-xl transition-colors"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {/* 周报列表 */}
        {loading ? (
          <ListItemSkeleton count={4} />
        ) : filteredReports.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无周报</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => setSelectedReportId(report.id)}
                className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-white">{report.playerName}</span>
                          <span className="text-gray-500 text-sm">{selectedTeamName || initialTeamName || ''}</span>
                          <StatusBadge status={report.reviewStatus} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {getWeekLabel(report.weekStart)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {report.knowledgeSummary ? '已提交' : '未填写'}
                          </span>
                          <span>态度: {report.selfAttitudeRating || '-'}星 / 技术: {report.selfTechniqueRating || '-'}星</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>

                  {/* 预览内容 */}
                  {report.reviewStatus !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">知识点总结</div>
                          <div className="text-sm text-white line-clamp-2">{report.knowledgeSummary || '未填写'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">改进计划</div>
                          <div className="text-sm text-white line-clamp-2">{report.improvements || '未填写'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">教练评语</div>
                          <div className="text-sm text-white line-clamp-2">{report.reviewComment || '暂无'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 周报详情页 */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 bg-[#0f1419] overflow-y-auto p-4 sm:p-6 lg:p-8">
          <WeeklyReportDetail
            reportId={selectedReportId}
            teamId={selectedTeamId || initialTeamId || 0}
            onBack={() => setSelectedReportId(null)}
            onReviewed={loadReports}
          />
        </div>
      )}

      <ExportComplianceModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onConfirm={(purpose, note) => {
          setExportModalOpen(false);
          handleExport(purpose, note);
        }}
        clubName={clubName}
        title="周报数据导出确认"
      />
    </div>
  );
};

export default WeeklyReports;
