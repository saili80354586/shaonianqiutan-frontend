import React, { useState, useEffect, useCallback } from 'react';
import { teamApi } from '../../services/api';
import { ArrowLeft, Users, GraduationCap, Search, Filter, Clock, Check, X, AlertCircle, Loader2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { ListItemSkeleton } from '../../components/ui/loading';

interface Invitation {
  id: number;
  teamId: number;
  teamName?: string;
  type: 'player' | 'coach';
  inviteCode: string;
  targetUserId: number | null;
  targetName: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

interface InvitationManagerProps {
  teamId?: number;
  onBack: () => void;
}

const InvitationManager: React.FC<InvitationManagerProps> = ({ teamId, onBack }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'player' | 'coach'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      if (!teamId) {
        setInvitations([]);
        return;
      }
      const res = await teamApi.getInvitations(teamId);
      if (res.data?.success) {
        setInvitations(res.data?.data || []);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('加载邀请列表失败:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, statusFilter, typeFilter]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // 过滤邀请
  const filteredInvitations = invitations.filter(inv => {
    const matchSearch = !searchQuery || inv.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) || (inv.targetName && inv.targetName.includes(searchQuery));
    const matchType = typeFilter === 'all' || inv.type === typeFilter;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchTab = activeTab === 'all' || inv.status === activeTab;
    return matchSearch && matchType && matchStatus && matchTab;
  });

  // 统计
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired' || i.status === 'rejected').length,
  };

  // 状态样式
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock, label: '待接受' },
      accepted: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: '已接受' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: '已拒绝' },
      expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle, label: '已过期' },
    };
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  // 类型样式
  const getTypeBadge = (type: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
      type === 'player' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
    }`}>
      {type === 'player' ? <Users className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
      {type === 'player' ? '球员' : '教练'}
    </span>
  );

  // 复制邀请码
  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">邀请管理</h1>
            <p className="text-gray-400 mt-1">管理球队的邀请记录</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">总邀请数</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-gray-400">待接受</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-sm text-gray-400">已接受</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-gray-400">{stats.expired}</div>
          <div className="text-sm text-gray-400">已失效</div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-800">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待接受' },
          { id: 'accepted', label: '已接受' },
          { id: 'expired', label: '已失效' },
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
              {tab.id === 'all' ? stats.total : tab.id === 'pending' ? stats.pending : tab.id === 'accepted' ? stats.accepted : stats.expired}
            </span>
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索邀请码或用户名..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">全部类型</option>
          <option value="player">球员邀请</option>
          <option value="coach">教练邀请</option>
        </select>
      </div>

      {/* 邀请列表 */}
      {loading ? (
        <ListItemSkeleton count={4} />
      ) : filteredInvitations.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">暂无邀请记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvitations.map(inv => (
            <div key={inv.id} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    inv.type === 'player' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    {inv.type === 'player' ? <Users className="w-6 h-6 text-blue-400" /> : <GraduationCap className="w-6 h-6 text-purple-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">{inv.teamName || '未知球队'}</span>
                      {getTypeBadge(inv.type)}
                      {getStatusBadge(inv.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>邀请码: <span className="font-mono text-white">{inv.inviteCode}</span></span>
                      {inv.targetName && <span>被邀请人: <span className="text-white">{inv.targetName}</span></span>}
                      <span>由 {inv.createdBy} 创建</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => copyInviteCode(inv.inviteCode)}
                      className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="复制邀请码"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 时间信息 */}
              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-6 text-sm">
                <div className="text-gray-400">
                  创建于: <span className="text-white">{new Date(inv.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                {inv.status === 'pending' && (
                  <div className="text-amber-400">
                    有效期至: {new Date(inv.expiresAt).toLocaleDateString('zh-CN')}
                  </div>
                )}
                {inv.acceptedAt && (
                  <div className="text-green-400">
                    接受于: {new Date(inv.acceptedAt).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationManager;
