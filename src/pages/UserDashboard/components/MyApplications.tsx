import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi } from '../../../services/club';
import { ListItemSkeleton } from '../../../components/ui/loading';

interface ApplicationItem {
  id: number;
  teamId: number;
  teamName: string;
  clubName: string;
  type: 'join' | 'trial';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  responseNote?: string;
  createdAt: string;
}

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teamApi.getMyApplications();
      if (res.data?.success) {
        const rawList = res.data.data?.list || res.data.data || [];
        const list = (Array.isArray(rawList) ? rawList : []).map((item: any) => ({
          id: item.id,
          teamId: item.teamId || item.team_id || item.team?.id,
          teamName: item.teamName || item.team?.name || item.team_name || '未知球队',
          clubName: item.clubName || item.team?.club?.name || item.club?.name || '未知俱乐部',
          type: item.type,
          status: item.status,
          reason: item.reason,
          responseNote: item.responseNote || item.response_note,
          createdAt: item.createdAt || item.created_at,
        }));
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('加载申请列表失败:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filtered = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const stats = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
            <Clock className="w-3 h-3" /> 审核中
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" /> 已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
            <XCircle className="w-3 h-3" /> 已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">我的申请</h2>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`p-3 rounded-xl border text-center transition-colors ${
              activeTab === tab
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-gray-800 bg-[#1a1f2e] hover:border-gray-700'
            }`}
          >
            <div className={`text-xl font-bold ${
              tab === 'pending' ? 'text-amber-400' :
              tab === 'approved' ? 'text-green-400' :
              tab === 'rejected' ? 'text-red-400' :
              'text-white'
            }`}>
              {stats[tab]}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {tab === 'all' ? '全部' :
               tab === 'pending' ? '审核中' :
               tab === 'approved' ? '已通过' : '已拒绝'}
            </div>
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <ListItemSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {activeTab === 'all' ? '暂无申请记录' :
             activeTab === 'pending' ? '暂无审核中的申请' :
             activeTab === 'approved' ? '暂无已通过的申请' : '暂无已拒绝的申请'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    app.type === 'trial' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  }`}>
                    <Building2 className={`w-5 h-5 ${
                      app.type === 'trial' ? 'text-purple-400' : 'text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{app.teamName}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-gray-400">{app.clubName}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  app.type === 'trial'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {app.type === 'trial' ? '试训申请' : '入队申请'}
                </span>
              </div>

              {app.reason && (
                <p className="text-sm text-gray-500 mb-2">申请理由：{app.reason}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>申请时间：{new Date(app.createdAt).toLocaleDateString('zh-CN')}</span>
                {app.responseNote && (
                  <span className="text-gray-400">审核备注：{app.responseNote}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};