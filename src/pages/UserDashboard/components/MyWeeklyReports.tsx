import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Clock, CheckCircle, XCircle, Star, ChevronRight,
  Calendar, AlertCircle, Edit3, Eye, Award, Activity, Building2, ArrowRight
} from 'lucide-react';
import { ListItemSkeleton } from '../../../components/ui/loading';
import { clubApi } from '../../../services/club';
import { useAuthStore } from '../../../store';
import WeeklyReportForm from './WeeklyReportForm';
import { ClubEmptyState } from './ClubEmptyState';

interface WeeklyReport {
  id: number;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  deadline?: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'rejected';
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  submitStatus?: string;
  submittedAt?: string;
  reviewedAt?: string;

  // 训练出勤情况
  trainingCount?: number;
  trainingDuration?: number;
  absenceCount?: number;
  absenceReason?: string;

  // 训练内容反馈
  knowledgeSummary?: string;
  technicalContent?: string;
  tacticalContent?: string;
  physicalCondition?: string;
  matchPerformance?: string;

  // 球员自评（多维度）
  selfAttitudeRating?: number;
  selfTechniqueRating?: number;
  selfTeamworkRating?: number;
  improvementsDetail?: string;
  weaknesses?: string;

  // 身体状态反馈
  fatigueLevel?: number;
  injuries?: string;
  sleepQuality?: number;
  dietCondition?: string;

  // 其他信息
  messageToCoach?: string;
  attachments?: string[];

  // 教练评价（多维度）
  coachAttitudeRating?: number;
  coachTechniqueRating?: number;
  coachTacticsRating?: number;
  coachKnowledgeRating?: number;

  // 教练评语
  reviewComment?: string;
  strengthsAcknowledgment?: string;
  suggestions?: string;
  knowledgeFeedback?: string;
  nextWeekFocus?: string;
  recommendAward?: boolean;

  // 球队信息
  teamId?: number;
  teamName?: string;
  coachName?: string;
  playerName?: string;
}

interface MyWeeklyReportsProps {
  onBack?: () => void;
}

export const MyWeeklyReports: React.FC<MyWeeklyReportsProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'reviewed' | 'rejected'>('all');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  // 将后端状态映射为前端展示状态
  const mapReportStatus = (report: any): WeeklyReport => {
    let status: 'pending' | 'submitted' | 'reviewed' | 'rejected' = 'pending';
    if (report.submitStatus === 'submitted') {
      if (report.reviewStatus === 'approved') {
        status = 'reviewed';
      } else if (report.reviewStatus === 'rejected') {
        status = 'rejected';
      } else {
        status = 'submitted';
      }
    } else if (report.submitStatus === 'overdue') {
      // 已逾期视为待填写，允许球员继续编辑提交
      status = 'pending';
    }
    return { ...report, status };
  };

  const loadReports = useCallback(async () => {
    console.log('[MyWeeklyReports] 开始加载周报, user.id:', user?.id, '类型:', typeof user?.id);
    if (!user?.id) {
      console.warn('[MyWeeklyReports] user.id 为空，无法加载周报');
      setError('用户信息未加载，请重新登录');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await clubApi.getPlayerWeeklyReports(Number(user.id), { page: 1, pageSize: 50 });
      console.log('[MyWeeklyReports] API 响应:', res.data);
      if (res.data?.success) {
        const list = res.data.data?.list || [];
        console.log('[MyWeeklyReports] 获取到周报列表:', list.length, '条');
        setReports(list.map(mapReportStatus));
        setHasClub(true);
      } else {
        // 判断是否是因为没有俱乐部导致的错误
        const msg = res.data?.message || '';
        if (msg.includes('俱乐部') || msg.includes('球队') || msg.includes('未加入')) {
          setHasClub(false);
        } else {
          setError(msg || '加载失败');
        }
      }
    } catch (error: any) {
      console.error('[MyWeeklyReports] 加载周报失败:', error);
      const msg = error.response?.data?.message || '';
      if (msg.includes('俱乐部') || msg.includes('球队') || msg.includes('未加入') || error.response?.status === 404) {
        setHasClub(false);
      } else {
        setError(msg || '加载周报失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = reports.filter(r => {
    if (activeTab === 'all') return true;
    // 将 tab 的 approved 映射为 reviewed
    const targetStatus = activeTab === 'approved' ? 'reviewed' : activeTab;
    return r.status === targetStatus;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
      pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Edit3, label: '待填写' },
      submitted: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock, label: '待审核' },
      reviewed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: '已通过' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: '已退回' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  // 计算平均分
  const getSelfAvg = (report: WeeklyReport) => {
    if (report.selfAttitudeRating === 0) return '-';
    return ((report.selfAttitudeRating + report.selfTechniqueRating + report.selfTeamworkRating) / 3).toFixed(1);
  };

  const getCoachAvg = (report: WeeklyReport) => {
    if (!report.coachAttitudeRating) return '-';
    return ((report.coachAttitudeRating + report.coachTechniqueRating + report.coachTacticsRating + report.coachKnowledgeRating) / 4).toFixed(1);
  };

  // 处理填写/编辑
  const handleEdit = (report: WeeklyReport) => {
    setEditingReport(report);
  };

  // 处理提交完成
  const handleSubmitComplete = () => {
    setEditingReport(null);
    loadReports();
  };

  // 如果正在编辑，显示表单
  if (editingReport) {
    return (
      <WeeklyReportForm
        reportId={editingReport.id}
        teamId={editingReport.teamId || 0}
        weekLabel={editingReport.weekLabel}
        weekStart={editingReport.weekStart}
        weekEnd={editingReport.weekEnd}
        deadline={editingReport.deadline || ''}
        initialData={editingReport}
        onBack={() => setEditingReport(null)}
        onSubmit={handleSubmitComplete}
      />
    );
  }

  return (
    <div className="p-6">
      {onBack && (
        <button onClick={onBack} className="mb-4 text-gray-400 hover:text-white">
          ← 返回
        </button>
      )}

      <h2 className="text-xl font-bold text-white mb-6">我的周报</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '全部', count: stats.total, color: 'text-white', tab: 'all' },
          { label: '待填写', count: stats.pending, color: 'text-gray-400', tab: 'pending' },
          { label: '待审核', count: stats.submitted, color: 'text-amber-400', tab: 'submitted' },
          { label: '已通过', count: stats.reviewed, color: 'text-green-400', tab: 'approved' },
        ].map(stat => (
          <div
            key={stat.label}
            onClick={() => setActiveTab(stat.tab as typeof activeTab)}
            className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800 cursor-pointer hover:border-emerald-500/30 transition-colors"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待填写' },
          { id: 'submitted', label: '待审核' },
          { id: 'approved', label: '已通过' },
          { id: 'rejected', label: '已退回' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadReports}
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
          >
            点击重试
          </button>
        </div>
      )}

      {/* 无俱乐部引导 */}
      {hasClub === false && <ClubEmptyState feature="weekly" />}

      {/* 列表 */}
      {hasClub !== false && (loading ? (
        <ListItemSkeleton count={4} />
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无周报记录</p>
          {reports.length === 0 && !error && (
            <p className="text-xs text-gray-500 mt-2">如果应该有周报但看不到，请刷新页面或联系管理员</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{report.weekLabel || `${report.weekStart} ~ ${report.weekEnd}`}</span>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.weekStart} ~ {report.weekEnd}
                  </div>
                  {report.deadline && (
                    <div className="text-xs text-amber-400 mt-1">
                      截止: {new Date(report.deadline).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* 填写/编辑按钮 - 仅待填写或已退回状态显示 */}
                  {(report.status === 'pending' || report.status === 'rejected') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(report);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {report.status === 'rejected' ? '重新填写' : '填写'}
                    </button>
                  )}
                  {/* 查看详情按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(report);
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    查看
                  </button>
                </div>
              </div>
              {report.status === 'reviewed' && report.reviewRating && (
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= report.reviewRating! ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-400 ml-2">教练评分</span>
                </div>
              )}
              {/* 教练评语预览 */}
              {report.reviewComment && (
                <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg">
                  <div className="text-xs text-emerald-400 mb-1">教练评语</div>
                  <div className="text-sm text-gray-300 line-clamp-2">{report.reviewComment}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* 详情弹窗 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedReport.weekLabel}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedReport.weekStart} ~ {selectedReport.weekEnd}</p>
                {selectedReport.teamName && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedReport.teamName} · {selectedReport.coachName || '教练'}</p>
                )}
              </div>
              <StatusBadge status={selectedReport.status} />
            </div>

            <div className="space-y-6">
              {/* 训练出勤 */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 训练出勤
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedReport.trainingCount ?? '-'}</div>
                    <div className="text-xs text-gray-500">训练次数</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedReport.trainingDuration ? `${selectedReport.trainingDuration}分钟` : '-'}</div>
                    <div className="text-xs text-gray-500">训练时长</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedReport.absenceCount ?? '-'}</div>
                    <div className="text-xs text-gray-500">请假/缺勤</div>
                  </div>
                </div>
                {selectedReport.absenceReason && (
                  <div className="mt-2 text-sm text-gray-300 bg-[#0f1419] rounded-lg p-3">
                    <span className="text-gray-500">请假原因：</span>{selectedReport.absenceReason}
                  </div>
                )}
              </div>

              {/* 训练内容反馈 */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 训练内容反馈
                </h4>
                <div className="space-y-3">
                  <DetailField label="本周知识总结" value={selectedReport.knowledgeSummary} />
                  <DetailField label="技术训练内容" value={selectedReport.technicalContent} />
                  <DetailField label="战术训练内容" value={selectedReport.tacticalContent} />
                  <DetailField label="体能训练情况" value={selectedReport.physicalCondition} />
                  <DetailField label="比赛/对抗表现" value={selectedReport.matchPerformance} />
                </div>
              </div>

              {/* 自我评价 */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" /> 自我评价
                </h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-amber-400">{selectedReport.selfAttitudeRating || '-'}</div>
                    <div className="text-xs text-gray-500">训练态度</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-amber-400">{selectedReport.selfTechniqueRating || '-'}</div>
                    <div className="text-xs text-gray-500">技术表现</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-amber-400">{selectedReport.selfTeamworkRating || '-'}</div>
                    <div className="text-xs text-gray-500">团队协作</div>
                  </div>
                </div>
                <DetailField label="本周进步点" value={selectedReport.improvementsDetail} />
                <DetailField label="待改进方面" value={selectedReport.weaknesses} />
              </div>

              {/* 身体状态 */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 身体状态
                </h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedReport.fatigueLevel ?? '-'}</div>
                    <div className="text-xs text-gray-500">疲劳程度</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{selectedReport.sleepQuality ?? '-'}</div>
                    <div className="text-xs text-gray-500">睡眠质量</div>
                  </div>
                </div>
                <DetailField label="伤病情况" value={selectedReport.injuries} />
                <DetailField label="饮食情况" value={selectedReport.dietCondition} />
              </div>

              {/* 其他信息 */}
              {selectedReport.messageToCoach && (
                <DetailField label="想对教练说的话" value={selectedReport.messageToCoach} />
              )}

              {/* 教练评语 */}
              {(selectedReport.reviewComment || selectedReport.strengthsAcknowledgment || selectedReport.suggestions) && (
                <div className="bg-emerald-500/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <Award className="w-4 h-4" /> 教练评语
                  </h4>
                  {selectedReport.reviewComment && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">整体评价</div>
                      <div className="text-white text-sm">{selectedReport.reviewComment}</div>
                    </div>
                  )}
                  {selectedReport.strengthsAcknowledgment && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">优点肯定</div>
                      <div className="text-white text-sm">{selectedReport.strengthsAcknowledgment}</div>
                    </div>
                  )}
                  {selectedReport.suggestions && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">改进建议</div>
                      <div className="text-white text-sm">{selectedReport.suggestions}</div>
                    </div>
                  )}
                  {selectedReport.nextWeekFocus && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">下周训练重点</div>
                      <div className="text-white text-sm">{selectedReport.nextWeekFocus}</div>
                    </div>
                  )}
                  {selectedReport.recommendAward && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs">
                      <Star className="w-3 h-3 fill-amber-400" /> 推荐表彰
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReport(null)}
              className="mt-6 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 详情字段展示组件
const DetailField: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="bg-[#0f1419] rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-200 whitespace-pre-wrap">{String(value)}</div>
    </div>
  );
};
