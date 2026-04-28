import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../services/api';
import type { Report } from '../../types';
import { Loading } from '../../components';
import { CheckCircle, XCircle, FileText, User, Calendar, Download, FileDown } from 'lucide-react';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const ReportsReview: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAction, setReviewAction] = useState<{ id: number; action: 'completed' | 'failed' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPendingReports();
      if (response.data?.success && response.data?.data) {
        setReports(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (reportId: number) => {
    setReviewAction({ id: reportId, action: 'completed' });
  };

  const handleReject = (reportId: number) => {
    setRejectReason('');
    setReviewAction({ id: reportId, action: 'failed' });
  };

  const confirmReview = async () => {
    if (!reviewAction) return;
    try {
      const remark = reviewAction.action === 'failed' ? (rejectReason.trim() || '未通过审核') : '';
      await adminApi.reviewReport(reviewAction.id.toString(), reviewAction.action, remark);
      setReports(reports.filter(r => r.id !== reviewAction.id));
      toast.success(reviewAction.action === 'completed' ? '报告已批准' : '报告已退回');
      setReviewAction(null);
      setRejectReason('');
    } catch (error) {
      console.error('审核失败', error);
      toast.error('审核操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" /> 待审核报告
        </h2>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm">
          待处理 {reports.length}
        </span>
      </div>

      {reports.length > 0 ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-slate-400">
                  <th className="pb-3 pt-4 px-6">球员姓名</th>
                  <th className="pb-3 pt-4 px-6">分析师</th>
                  <th className="pb-3 pt-4 px-6">位置</th>
                  <th className="pb-3 pt-4 px-6">创建时间</th>
                  <th className="pb-3 pt-4 px-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{report.player_name}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {report.analyst?.nickname || report.analyst?.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{report.player_position}</td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(report.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> 批准
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" /> 拒绝
                        </button>
                        <div className="relative group">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors text-sm">
                            <Download className="w-3.5 h-3.5" /> 下载
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[180px]">
                            <button
                              onClick={() => adminApi.downloadReportDoc(report.id, 'rating').catch(() => toast.error('下载失败，请稍后重试'))}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 rounded-t-lg flex items-center gap-2 text-slate-200"
                            >
                              <FileText className="w-4 h-4 text-green-400" />
                              评分报告.md
                            </button>
                            <button
                              onClick={() => adminApi.downloadReportDoc(report.id, 'player-info').catch(() => toast.error('下载失败，请稍后重试'))}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 rounded-b-lg flex items-center gap-2 text-slate-200"
                            >
                              <User className="w-4 h-4 text-blue-400" />
                              球员基础信息.md
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl p-12 border border-white/[0.06] text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
          <p className="text-slate-400">暂无待审核报告</p>
        </div>
      )}
      <AdminConfirmDialog
        open={Boolean(reviewAction)}
        title={reviewAction?.action === 'completed' ? '批准报告' : '退回报告'}
        description={reviewAction?.action === 'completed' ? '确认批准这篇报告？批准后报告会进入完成状态。' : '确认退回这篇报告？退回原因会记录在审核结果中。'}
        confirmText={reviewAction?.action === 'completed' ? '批准' : '退回'}
        tone={reviewAction?.action === 'completed' ? 'success' : 'danger'}
        onConfirm={confirmReview}
        onCancel={() => {
          setReviewAction(null);
          setRejectReason('');
        }}
      >
        {reviewAction?.action === 'failed' && (
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none"
            placeholder="请输入退回原因，留空则使用默认原因"
          />
        )}
      </AdminConfirmDialog>
    </div>
  );
};

export default ReportsReview;
