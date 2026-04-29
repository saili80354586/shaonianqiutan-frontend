import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Phone, Award, Calendar, Edit2, Shield,
  Users, Loader2, AlertCircle, CheckCircle, XCircle, Clock,
  Building2, Trash2, Plus
} from 'lucide-react';
import { clubApi, teamApi } from '../../services/api';
import { toast } from 'sonner';

interface TeamAssignment {
  teamCoachId: number;
  teamId: number;
  teamName: string;
  role: string;
  roleLabel: string;
  status: string;
  joinedAt: string;
}

interface CoachProfile {
  id: number;
  clubId: number;
  userId: number;
  name: string;
  avatar: string;
  phone: string;
  primaryRole: string;
  roleLabel: string;
  status: string;
  notes: string;
  joinedAt: string;
  leftAt: string | null;
  teams: TeamAssignment[];
  createdAt: string;
}

interface CoachDetailProps {
  coachId: number;
  onBack: () => void;
  isAdmin?: boolean;
}

const roleOptions = [
  { value: 'head_coach', label: '主教练', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  { value: 'assistant', label: '助理教练', color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  { value: 'goalkeeper_coach', label: '守门员教练', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { value: 'fitness_coach', label: '体能教练', color: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  { value: 'team_manager', label: '领队', color: 'bg-slate-500/15 text-slate-300 border-slate-500/25' },
];

const statusMap: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: '在职', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  inactive: { label: '离职', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: XCircle },
  pending: { label: '待确认', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
};

const CoachDetail: React.FC<CoachDetailProps> = ({ coachId, onBack, isAdmin }) => {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // 编辑表单状态
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 分配球队弹窗
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignRole, setAssignRole] = useState('head_coach');
  const [todayTimestamp] = useState(() => Date.now());

  useEffect(() => {
    loadCoach();
  }, [coachId]);

  const loadCoach = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getClubCoachDetail(coachId);
      if (res.data?.success && res.data?.data) {
        const data = res.data.data as CoachProfile;
        setCoach(data);
        setEditRole(data.primaryRole);
        setEditStatus(data.status);
        setEditNotes(data.notes || '');
      }
    } catch (err) {
      console.error('加载教练详情失败:', err);
      toast.error('加载教练详情失败');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    setEditLoading(true);
    try {
      const res = await clubApi.updateClubCoach(coachId, {
        primaryRole: editRole,
        status: editStatus,
        notes: editNotes,
      });
      if (res.data?.success) {
        toast.success('更新成功');
        setShowEditModal(false);
        loadCoach();
      } else {
        toast.error(res.data?.message || '更新失败');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '更新失败');
    }
    setEditLoading(false);
  };

  const handleRemoveFromTeam = async (teamCoachId: number) => {
    if (!confirm('确定要将该教练从球队移除？')) return;
    try {
      const res = await clubApi.removeCoachFromTeam(teamCoachId);
      if (res.data?.success) {
        toast.success('已从球队移除');
        loadCoach();
      } else {
        toast.error(res.data?.message || '移除失败');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '移除失败');
    }
  };

  const loadTeams = async () => {
    if (!coach) return;
    try {
      const res = await teamApi.getTeams(coach.clubId);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        // 过滤掉已分配的球队
        const assignedTeamIds = new Set(coach.teams?.map(t => t.teamId) || []);
        setTeams(res.data.data
          .filter((t: any) => !assignedTeamIds.has(t.id))
          .map((t: any) => ({ id: t.id, name: t.name }))
        );
      }
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const handleAssignToTeam = async () => {
    const teamId = parseInt(selectedTeamId, 10);
    if (!teamId || isNaN(teamId)) {
      toast.error('请选择球队');
      return;
    }
    setAssignLoading(true);
    try {
      const res = await clubApi.assignCoachToTeam(coachId, { teamId, role: assignRole });
      if (res.data?.success) {
        toast.success('分配成功');
        setShowAssignModal(false);
        setSelectedTeamId('');
        setAssignRole('head_coach');
        loadCoach();
      } else {
        toast.error(res.data?.message || '分配失败');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '分配失败');
    }
    setAssignLoading(false);
  };

  const openAssignModal = () => {
    loadTeams();
    setSelectedTeamId('');
    setAssignRole(coach?.primaryRole || 'head_coach');
    setShowAssignModal(true);
  };

  const getRoleStyle = (role: string) => {
    return roleOptions.find(r => r.value === role)?.color || 'bg-slate-500/15 text-slate-300 border-slate-500/25';
  };

  const getRoleLabel = (role: string) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 返回教练管理
        </button>
        <div className="text-center text-slate-500 mt-8 flex flex-col items-center gap-3">
          <AlertCircle className="w-12 h-12 opacity-30" />
          <p>教练不存在或暂无数据</p>
        </div>
      </div>
    );
  }

  const statusConfig = statusMap[coach.status] || statusMap.active;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 返回教练管理
        </button>

        {/* 教练资料卡 */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* 头像 */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
              {coach.avatar ? (
                <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover" />
              ) : (
                coach.name?.[0] || '?'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{coach.name || '未命名'}</h1>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRoleStyle(coach.primaryRole)}`}>
                  {coach.roleLabel || getRoleLabel(coach.primaryRole)}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                  <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                {coach.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {coach.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 入职 {coach.joinedAt ? new Date(coach.joinedAt).toLocaleDateString('zh-CN') : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> 用户ID: {coach.userId}
                </span>
              </div>

              {coach.notes && (
                <p className="mt-3 text-sm text-slate-500 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                  {coach.notes}
                </p>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" /> 编辑
              </button>
            )}
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Building2}
            label="所属球队"
            value={coach.teams?.length || 0}
            color="blue"
          />
          <StatCard
            icon={Award}
            label="主角色"
            value={coach.roleLabel || getRoleLabel(coach.primaryRole)}
            color="emerald"
          />
          <StatCard
            icon={CheckCircle}
            label="状态"
            value={statusConfig.label}
            color={coach.status === 'active' ? 'emerald' : coach.status === 'pending' ? 'amber' : 'slate'}
          />
          <StatCard
            icon={Calendar}
            label="入职天数"
            value={coach.joinedAt ? Math.max(1, Math.floor((todayTimestamp - new Date(coach.joinedAt).getTime()) / (1000 * 60 * 60 * 24))) : '-'}
            color="violet"
          />
        </div>

        {/* 球队分配 */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white tracking-tight">球队分配</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">共 {coach.teams?.length || 0} 支球队</span>
              {isAdmin && (
                <button
                  onClick={openAssignModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> 分配到球队
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {!coach.teams || coach.teams.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                <Building2 className="w-10 h-10 opacity-20" />
                <p className="text-sm">该教练尚未分配到任何球队</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coach.teams.map((team) => (
                  <div
                    key={team.teamCoachId}
                    className="group flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {team.teamName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{team.teamName || '未命名球队'}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getRoleStyle(team.role)}`}>
                          {team.roleLabel || getRoleLabel(team.role)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        加入时间: {team.joinedAt ? new Date(team.joinedAt).toLocaleDateString('zh-CN') : '-'}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveFromTeam(team.teamCoachId)}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="从球队移除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a2332] rounded-2xl border border-white/[0.06] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">编辑教练信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">主角色</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/30"
                >
                  {roleOptions.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">状态</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/30"
                >
                  <option value="active">在职</option>
                  <option value="inactive">离职</option>
                  <option value="pending">待确认</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">备注</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="可选：添加备注信息"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm hover:bg-white/[0.06] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分配球队弹窗 */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a2332] rounded-2xl border border-white/[0.06] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">分配到球队</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">选择球队</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/30"
                >
                  <option value="">请选择球队</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teams.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 暂无可分配的球队（该教练已在所有球队中）
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">担任角色</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/30"
                >
                  {roleOptions.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm hover:bg-white/[0.06] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAssignToTeam}
                disabled={assignLoading || !selectedTeamId}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 统计卡片
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    blue: { iconBg: 'bg-blue-500/15', iconText: 'text-blue-400' },
    emerald: { iconBg: 'bg-emerald-500/15', iconText: 'text-emerald-400' },
    amber: { iconBg: 'bg-amber-500/15', iconText: 'text-amber-400' },
    violet: { iconBg: 'bg-violet-500/15', iconText: 'text-violet-400' },
    slate: { iconBg: 'bg-slate-500/15', iconText: 'text-slate-400' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.06]">
      <div className={`p-2.5 ${c.iconBg} rounded-xl border border-white/[0.06] w-fit mb-4`}>
        <Icon className={`w-5 h-5 ${c.iconText}`} />
      </div>
      <div className="text-2xl font-bold text-white tracking-tight mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
};

export default CoachDetail;
