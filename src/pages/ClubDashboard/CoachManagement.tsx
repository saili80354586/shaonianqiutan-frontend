import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Search, Plus, UserCheck, UserX, Award, Shield, Phone, Mail,
  ChevronRight, Filter, Users, Loader2, AlertCircle
} from 'lucide-react';
import { clubApi } from '../../services/api';
import { toast } from 'sonner';
import CoachModal from './components/CoachModal';

interface CoachItem {
  id: number;
  clubId: number;
  userId: number;
  name: string;
  avatar: string;
  phone: string;
  primaryRole: string;
  roleLabel: string;
  status: string;
  joinedAt: string;
  leftAt: string | null;
  notes: string;
  createdAt: string;
}

interface CoachManagementProps {
  onBack: () => void;
  onViewDetail?: (id: number) => void;
  isAdmin?: boolean;
  clubId: number;
}

const roleOptions = [
  { value: 'head_coach', label: '主教练', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  { value: 'assistant', label: '助理教练', color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  { value: 'goalkeeper_coach', label: '守门员教练', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { value: 'fitness_coach', label: '体能教练', color: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  { value: 'team_manager', label: '领队', color: 'bg-slate-500/15 text-slate-300 border-slate-500/25' },
];

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '在职', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  inactive: { label: '离职', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  pending: { label: '待确认', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const CoachManagement: React.FC<CoachManagementProps> = ({ onBack, onViewDetail, isAdmin, clubId }) => {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [showCoachModal, setShowCoachModal] = useState(false);

  const loadCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clubApi.getClubCoaches({
        status: statusFilter,
        keyword: searchKeyword,
        page,
        pageSize,
      });
      if (res.data?.success) {
        setCoaches(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('加载教练列表失败:', err);
    }
    setLoading(false);
  }, [statusFilter, searchKeyword, page]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  const handleSearch = () => {
    setPage(1);
    loadCoaches();
  };



  const handleRemoveCoach = async (coachId: number) => {
    if (!confirm('确定要移除这位教练吗？')) return;
    try {
      const res = await clubApi.removeClubCoach(coachId);
      if (res.data?.success) {
        toast.success('已移除');
        loadCoaches();
      } else {
        toast.error(res.data?.message || '移除失败');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '移除失败');
    }
  };

  const getRoleStyle = (role: string) => {
    return roleOptions.find(r => r.value === role)?.color || 'bg-slate-500/15 text-slate-300 border-slate-500/25';
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">教练管理</h2>
            <p className="text-sm text-slate-500 mt-0.5">管理俱乐部教练团队 · 共 {total} 人</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCoachModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> 添加教练
          </button>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索姓名或手机号"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/30"
          >
            <option value="">全部状态</option>
            <option value="active">在职</option>
            <option value="inactive">离职</option>
            <option value="pending">待确认</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm hover:bg-white/[0.06] transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : coaches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Users className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">暂无教练数据</p>
          {isAdmin && (
            <button
              onClick={() => setShowCoachModal(true)}
              className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
            >
              添加第一位教练
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="group flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all"
            >
              {/* 头像 */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {coach.avatar ? (
                  <img src={coach.avatar} alt={coach.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  coach.name?.[0] || '?'
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{coach.name || '未命名'}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getRoleStyle(coach.primaryRole)}`}>
                    {coach.roleLabel || coach.primaryRole}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusMap[coach.status]?.className || ''}`}>
                    {statusMap[coach.status]?.label || coach.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {coach.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {coach.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> 入职 {coach.joinedAt ? new Date(coach.joinedAt).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onViewDetail?.(coach.id)}
                  className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="查看详情"
                >
                  <Award className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveCoach(coach.id)}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="移除"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-slate-400">
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 邀请教练弹窗 */}
      {showCoachModal && (
        <CoachModal
          clubId={clubId}
          clubName="俱乐部"
          onClose={() => setShowCoachModal(false)}
          onSuccess={() => {
            setShowCoachModal(false);
            loadCoaches();
          }}
        />
      )}
    </div>
  );
};

export default CoachManagement;
