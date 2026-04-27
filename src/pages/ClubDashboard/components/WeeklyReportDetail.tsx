import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, Clock, User, FileText, Award,
  CheckCircle, XCircle, MessageSquare, Loader2, Star,
  TrendingUp, AlertCircle, Lightbulb, Target, ThumbsUp,
  Eye,
  type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import MultiDimensionalRating, { COACH_RATING_DIMENSIONS } from './MultiDimensionalRating';
import { weeklyReportApi } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { CardSkeleton, Skeleton } from '../../../components/ui/loading';

// 周报数据类型
interface WeeklyReport {
  id: number;
  playerId: number;
  playerName: string;
  playerAvatar?: string;
  jerseyNumber?: string;
  position?: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;

  // 训练出勤
  trainingCount: number;
  trainingDuration: number;
  absenceCount: number;
  absenceReason?: string;

  // 训练内容
  knowledgeSummary: string;
  technicalContent?: string;
  tacticalContent?: string;
  physicalCondition?: string;
  matchPerformance?: string;

  // 自我评价
  selfAttitudeRating: number;
  selfTechniqueRating: number;
  selfTeamworkRating: number;
  improvementsDetail?: string;
  weaknesses?: string;

  // 身体状态
  fatigueLevel: number;
  injuries?: string;
  sleepQuality: number;
  dietCondition?: string;
  messageToCoach?: string;

  // 教练评价
  coachAttitudeRating?: number;
  coachTechniqueRating?: number;
  coachTacticsRating?: number;
  coachKnowledgeRating?: number;
  strengthsAcknowledgment?: string;
  suggestions?: string;
  knowledgeFeedback?: string;
  nextWeekFocus?: string;
  recommendAward?: boolean;
  coachComment?: string;
}

interface WeeklyReportDetailProps {
  reportId: number;
  teamId: number;
  onBack: () => void;
  onReviewed?: () => void;
}

const WeeklyReportDetail: React.FC<WeeklyReportDetailProps> = ({
  reportId,
  teamId,
  onBack,
  onReviewed,
}) => {
  const { currentRole } = useAuthStore();
  const isReadOnly = currentRole === 'club';

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    coachAttitudeRating: 0,
    coachTechniqueRating: 0,
    coachTacticsRating: 0,
    coachKnowledgeRating: 0,
    strengthsAcknowledgment: '',
    suggestions: '',
    knowledgeFeedback: '',
    nextWeekFocus: '',
    recommendAward: false,
    comment: '',
    status: 'approved' as 'approved' | 'rejected',
  });

  // 加载周报详情
  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await weeklyReportApi.getReport(reportId);
      if (res.data?.success) {
        const data = res.data.data;
        setReport(data);
        // 如果已有教练评价，填充表单
        if (data.coachAttitudeRating) {
          setReviewForm({
            coachAttitudeRating: data.coachAttitudeRating || 0,
            coachTechniqueRating: data.coachTechniqueRating || 0,
            coachTacticsRating: data.coachTacticsRating || 0,
            coachKnowledgeRating: data.coachKnowledgeRating || 0,
            strengthsAcknowledgment: data.strengthsAcknowledgment || '',
            suggestions: data.suggestions || '',
            knowledgeFeedback: data.knowledgeFeedback || '',
            nextWeekFocus: data.nextWeekFocus || '',
            recommendAward: data.recommendAward || false,
            comment: data.coachComment || '',
            status: data.status === 'rejected' ? 'rejected' : 'approved',
          });
        }
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('加载周报详情失败:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // 提交评价
  const handleSubmitReview = async () => {
    // 验证评分
    if (reviewForm.status === 'approved') {
      if (
        reviewForm.coachAttitudeRating === 0 ||
        reviewForm.coachTechniqueRating === 0 ||
        reviewForm.coachTacticsRating === 0 ||
        reviewForm.coachKnowledgeRating === 0
      ) {
        toast.warning('请完成所有维度的评分');
        return;
      }
      if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
        toast.warning('整体表现评价至少 10 个字');
        return;
      }
      if (!reviewForm.strengthsAcknowledgment || reviewForm.strengthsAcknowledgment.trim().length < 5) {
        toast.warning('优点肯定至少 5 个字');
        return;
      }
    }
    if (reviewForm.status === 'rejected') {
      if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
        toast.warning('退回原因至少 10 个字');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await weeklyReportApi.reviewReport(reportId, {
        reviewComment: reviewForm.comment,
        coachAttitudeRating: reviewForm.coachAttitudeRating,
        coachTechniqueRating: reviewForm.coachTechniqueRating,
        coachTacticsRating: reviewForm.coachTacticsRating,
        coachKnowledgeRating: reviewForm.coachKnowledgeRating,
        strengthsAcknowledgment: reviewForm.strengthsAcknowledgment,
        suggestions: reviewForm.suggestions,
        knowledgeFeedback: reviewForm.knowledgeFeedback,
        nextWeekFocus: reviewForm.nextWeekFocus,
        recommendAward: reviewForm.recommendAward,
        status: reviewForm.status,
      });
      if (res.data?.success) {
        toast.success('评价提交成功！');
        onReviewed?.();
      } else {
        toast.error(res.data?.message || '提交失败，请重试');
      }
    } catch (error: any) {
      console.error('提交评价失败:', error);
      toast.error(error?.response?.data?.error || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '待填写' },
      submitted: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '待审核' },
      reviewed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '已通过' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '已退回' },
    };
    const style = map[status] || map.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-tertiary animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-tertiary rounded w-32 animate-pulse" />
            <div className="h-3 bg-tertiary rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="space-y-4">
            <CardSkeleton />
            <Skeleton rows={6} />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>周报不存在或已被删除</p>
      </div>
    );
  }

  const isReviewed = report.status === 'reviewed' || report.status === 'rejected';
  const isPending = report.status === 'pending';
  const canReview = !isReadOnly && (report.status === 'submitted' || report.status === 'rejected');

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">周报详情</h2>
            {getStatusBadge(report.status)}
          </div>
          <p className="text-sm text-gray-400">
            {report.weekLabel} · 提交于 {new Date(report.submittedAt || '').toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：球员填写内容 */}
        <div className="space-y-4">
          {/* 球员信息卡片 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {report.playerName[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{report.playerName}</h3>
                <p className="text-gray-400">{report.position} · #{report.jerseyNumber}</p>
              </div>
            </div>
          </div>

          {/* 训练出勤 */}
          <SectionCard title="训练出勤" icon={Calendar}>
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="训练次数" value={`${report.trainingCount} 次`} />
              <InfoItem label="训练时长" value={`${Math.floor(report.trainingDuration / 60)} 小时`} />
              <InfoItem
                label="请假/缺勤"
                value={report.absenceCount > 0 ? `${report.absenceCount} 次` : '无'}
                highlight={report.absenceCount > 0}
              />
            </div>
            {report.absenceReason && (
              <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">请假原因：</span>
                <span className="text-white">{report.absenceReason}</span>
              </div>
            )}
          </SectionCard>

          {/* 训练内容反馈 */}
          <SectionCard title="训练内容反馈" icon={FileText}>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-emerald-400 mb-1">知识点总结</h4>
                <p className="text-white text-sm leading-relaxed">{report.knowledgeSummary}</p>
              </div>
              {report.technicalContent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">技术训练</h4>
                  <p className="text-gray-300 text-sm">{report.technicalContent}</p>
                </div>
              )}
              {report.tacticalContent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">战术训练</h4>
                  <p className="text-gray-300 text-sm">{report.tacticalContent}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* 自我评价 */}
          <SectionCard title="自我评价" icon={TrendingUp}>
            <div className="space-y-4">
              <MultiDimensionalRating
                dimensions={[
                  { key: 'attitude', label: '训练态度', description: '积极性和投入度' },
                  { key: 'technique', label: '技术表现', description: '动作规范程度' },
                  { key: 'teamwork', label: '团队协作', description: '与队友配合' },
                ]}
                values={{
                  attitude: report.selfAttitudeRating,
                  technique: report.selfTechniqueRating,
                  teamwork: report.selfTeamworkRating,
                }}
                onChange={() => {}}
                readOnly
                size="sm"
              />
              {report.improvementsDetail && (
                <div className="pt-3 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-green-400 mb-1">本周进步</h4>
                  <p className="text-gray-300 text-sm">{report.improvementsDetail}</p>
                </div>
              )}
              {report.weaknesses && (
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-1">待改进</h4>
                  <p className="text-gray-300 text-sm">{report.weaknesses}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* 身体状态 */}
          <SectionCard title="身体状态" icon={Clock}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="疲劳程度" value={`${report.fatigueLevel}/5`} />
              <InfoItem label="睡眠质量" value={`${report.sleepQuality}/5`} />
            </div>
            {report.injuries && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-red-400">伤病情况：</span>
                <span className="text-white">{report.injuries}</span>
              </div>
            )}
            {report.messageToCoach && (
              <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">想对教练说：</span>
                <span className="text-white ml-1">{report.messageToCoach}</span>
              </div>
            )}
          </SectionCard>
        </div>

        {/* 右侧：教练评价表单 */}
        <div className="space-y-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">教练评价</h3>
            </div>

            {isPending ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>球员尚未提交周报</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 管理员只读提示 */}
                {isReadOnly && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <p className="text-blue-400 text-sm">
                      您当前以俱乐部管理员身份查看，评价工作请交由球队教练完成
                    </p>
                  </div>
                )}

                {/* 审核状态选择 */}
                {!isReviewed && !isReadOnly && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setReviewForm(f => ({ ...f, status: 'approved' }))}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                        reviewForm.status === 'approved'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                      通过
                    </button>
                    <button
                      onClick={() => setReviewForm(f => ({ ...f, status: 'rejected' }))}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                        reviewForm.status === 'rejected'
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <XCircle className="w-5 h-5 mx-auto mb-1" />
                      退回
                    </button>
                  </div>
                )}

                {/* 多维度评分 */}
                {reviewForm.status === 'approved' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-400">多维度评分</h4>
                    <MultiDimensionalRating
                      dimensions={COACH_RATING_DIMENSIONS}
                      values={{
                        coachAttitudeRating: reviewForm.coachAttitudeRating,
                        coachTechniqueRating: reviewForm.coachTechniqueRating,
                        coachTacticsRating: reviewForm.coachTacticsRating,
                        coachKnowledgeRating: reviewForm.coachKnowledgeRating,
                      }}
                      onChange={(key, value) =>
                        setReviewForm(f => ({ ...f, [key]: value }))
                      }
                      readOnly={isReviewed || isReadOnly}
                    />
                  </div>
                )}

                {/* 评语表单 */}
                {reviewForm.status === 'approved' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        整体表现评价 <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="对球员本周整体表现进行综合评价（至少10个字）..."
                        rows={3}
                        disabled={isReviewed || isReadOnly}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        优点肯定 <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={reviewForm.strengthsAcknowledgment}
                        onChange={e => setReviewForm(f => ({ ...f, strengthsAcknowledgment: e.target.value }))}
                        placeholder="肯定球员本周的表现和进步..."
                        rows={2}
                        disabled={isReviewed || isReadOnly}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        改进建议
                      </label>
                      <textarea
                        value={reviewForm.suggestions}
                        onChange={e => setReviewForm(f => ({ ...f, suggestions: e.target.value }))}
                        placeholder="指出需要改进的方面..."
                        rows={2}
                        disabled={isReviewed || isReadOnly}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        知识点理解反馈
                      </label>
                      <textarea
                        value={reviewForm.knowledgeFeedback}
                        onChange={e => setReviewForm(f => ({ ...f, knowledgeFeedback: e.target.value }))}
                        placeholder="针对知识点的掌握情况进行反馈..."
                        rows={2}
                        disabled={isReviewed || isReadOnly}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        下周训练重点
                      </label>
                      <textarea
                        value={reviewForm.nextWeekFocus}
                        onChange={e => setReviewForm(f => ({ ...f, nextWeekFocus: e.target.value }))}
                        placeholder="明确下周的训练重点..."
                        rows={2}
                        disabled={isReviewed || isReadOnly}
                        className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    {/* 推荐表彰 */}
                    <label className={`flex items-center gap-3 p-4 bg-[#0f1419] rounded-xl ${isReadOnly ? '' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={reviewForm.recommendAward}
                        onChange={e => setReviewForm(f => ({ ...f, recommendAward: e.target.checked }))}
                        disabled={isReviewed || isReadOnly}
                        className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-5 h-5 text-amber-400" />
                        <span className="text-white">推荐表彰本周优秀表现</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* 退回原因 */}
                {reviewForm.status === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">
                      退回原因
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="说明退回的原因，帮助球员改进..."
                      rows={4}
                      disabled={isReviewed || isReadOnly}
                      className="w-full px-4 py-3 bg-[#0f1419] border border-red-500/30 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500 disabled:opacity-50"
                    />
                  </div>
                )}

                {/* 提交按钮 */}
                {!isReviewed && !isReadOnly && (
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {reviewForm.status === 'approved' ? '提交评价' : '确认退回'}
                  </button>
                )}

                {/* 已评价标识 */}
                {isReviewed && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400">已于 {new Date(report.reviewedAt || '').toLocaleString('zh-CN')} 完成评价</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 区块卡片组件
const SectionCard: React.FC<{ title: string; icon: LucideIcon; children: React.ReactNode }> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-5 h-5 text-emerald-400" />
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

// 信息项组件
const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="bg-[#0f1419] rounded-xl p-3">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-sm font-medium ${highlight ? 'text-red-400' : 'text-white'}`}>
      {value}
    </div>
  </div>
);

export default WeeklyReportDetail;
