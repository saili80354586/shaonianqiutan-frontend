import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { analystApplicationApi } from '../../services/api';
import type { AnalystApplication } from '../../types';
import { Loading } from '../../components';
import { FileText, CheckCircle, XCircle, Clock, User, Phone, Mail } from 'lucide-react';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<AnalystApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAction, setReviewAction] = useState<{ id: number; action: 'approved' | 'rejected' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await analystApplicationApi.listApplications(1, 100, 'pending');
      if (response.data?.success && response.data?.data) {
        setApplications(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载申请失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    setReviewAction({ id, action: 'approved' });
  };

  const handleReject = (id: number) => {
    setRejectReason('');
    setReviewAction({ id, action: 'rejected' });
  };

  const confirmReview = async () => {
    if (!reviewAction) return;
    try {
      const remark = reviewAction.action === 'rejected' ? (rejectReason.trim() || '未通过审核') : '';
      await analystApplicationApi.reviewApplication(reviewAction.id.toString(), reviewAction.action, remark);
      setApplications(applications.filter(a => a.id !== reviewAction.id));
      toast.success(reviewAction.action === 'approved' ? '申请已批准' : '申请已拒绝');
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
          <FileText className="w-5 h-5 text-blue-400" /> 待审核分析师申请
        </h2>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm">
          待处理 {applications.length}
        </span>
      </div>

      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] hover:border-white/10 transition-all">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{app.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(app.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(app.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> 批准
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" /> 拒绝
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> 联系方式
                  </p>
                  <p className="text-slate-400 text-sm">{app.phone} {app.email && `/ ${app.email}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> 经验说明
                  </p>
                  <p className="text-slate-400 text-sm whitespace-pre-line">{app.experience || '无'}</p>
                </div>
                {app.resume && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-300 mb-1">简历</p>
                    <p className="text-slate-400 text-sm">{app.resume}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl p-12 border border-white/[0.06] text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
          <p className="text-slate-400">暂无待审核申请</p>
        </div>
      )}
      <AdminConfirmDialog
        open={Boolean(reviewAction)}
        title={reviewAction?.action === 'approved' ? '批准分析师申请' : '拒绝分析师申请'}
        description={reviewAction?.action === 'approved' ? '确认批准该分析师申请？批准后该用户将获得分析师权限。' : '确认拒绝该分析师申请？拒绝原因会记录在审核结果中。'}
        confirmText={reviewAction?.action === 'approved' ? '批准' : '拒绝'}
        tone={reviewAction?.action === 'approved' ? 'success' : 'danger'}
        onConfirm={confirmReview}
        onCancel={() => {
          setReviewAction(null);
          setRejectReason('');
        }}
      >
        {reviewAction?.action === 'rejected' && (
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none"
            placeholder="请输入拒绝原因，留空则使用默认原因"
          />
        )}
      </AdminConfirmDialog>
    </div>
  );
};

export default Applications;
