import React, { useState, useEffect, useCallback } from 'react';
import { teamApi, trialApi } from '../../services/api';
import { ArrowLeft, Users, GraduationCap, Clock, Check, X, Loader2, CheckCircle, XCircle, AlertCircle, Building2, ExternalLink } from 'lucide-react';
import { ListItemSkeleton } from "../../components/ui/loading";

type InvitationKind = 'team' | 'trial';
type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'declined' | 'completed';

interface Invitation {
  id: number;
  kind: InvitationKind;
  teamId?: number;
  teamName: string;
  clubName: string;
  type: 'player' | 'coach' | 'trial';
  inviteCode?: string;
  status: InvitationStatus;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  trialDate?: string;
  trialTime?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  note?: string;
  responseNote?: string;
}

interface MyInvitationsProps {
  onBack: () => void;
  onViewTeam?: (teamId: number) => void;
}

type ApiRecord = Record<string, unknown>;

const getRecord = (value: unknown): ApiRecord | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ApiRecord;
  }
  return undefined;
};

const getString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const getNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const getInvitationStatus = (value: unknown): InvitationStatus => {
  const status = getString(value);
  return ['pending', 'accepted', 'rejected', 'expired', 'declined', 'completed'].includes(status)
    ? status as InvitationStatus
    : 'pending';
};

const getInvitationType = (value: unknown): Invitation['type'] => {
  const type = getString(value);
  return type === 'coach' ? 'coach' : type === 'trial' ? 'trial' : 'player';
};

const MyInvitations: React.FC<MyInvitationsProps> = ({ onBack, onViewTeam }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'expired'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<Invitation | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getActionKey = (invitation: Invitation) => `${invitation.kind}-${invitation.id}`;

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const [teamResult, trialResult] = await Promise.allSettled([
        teamApi.getMyInvitations(),
        trialApi.getMyInvites(),
      ]);

      const list: Invitation[] = [];

      if (teamResult.status === 'fulfilled' && teamResult.value.data?.success) {
        const teamList = Array.isArray(teamResult.value.data.data) ? teamResult.value.data.data as ApiRecord[] : [];
        list.push(...teamList.map((item) => {
          const team = getRecord(item.team);
          const club = getRecord(item.club);
          const createdBy = getRecord(item.created_by);
          return {
            id: getNumber(item.id) || 0,
            kind: 'team' as const,
            teamId: getNumber(item.teamId, item.team_id, team?.id),
            teamName: getString(item.teamName, item.team_name, team?.name) || '未知球队',
            clubName: getString(item.clubName, item.club_name, club?.name) || '未知俱乐部',
            type: getInvitationType(item.type),
            inviteCode: getString(item.inviteCode, item.invite_code, item.code),
            status: getInvitationStatus(item.status),
            createdBy: getString(item.creatorName, item.created_by_name, createdBy?.name) || '未知',
            createdAt: getString(item.createdAt, item.created_at),
            expiresAt: getString(item.expiresAt, item.expires_at),
          };
        }));
      }

      if (trialResult.status === 'fulfilled' && trialResult.value.data?.success) {
        const payload = trialResult.value.data.data;
        const payloadRecord = getRecord(payload);
        const trialList = (Array.isArray(payload) ? payload : Array.isArray(payloadRecord?.list) ? payloadRecord.list : []) as ApiRecord[];
        list.push(...trialList.map((item) => ({
          id: getNumber(item.id) || 0,
          kind: 'trial' as const,
          teamName: '试训邀请',
          clubName: getString(item.senderName, item.sender_name) || '邀请方',
          type: 'trial' as const,
          status: getInvitationStatus(item.status),
          createdBy: getString(item.senderName, item.sender_name) || '邀请方',
          createdAt: getString(item.createdAt, item.created_at),
          expiresAt: getString(item.trialDate, item.trial_date),
          trialDate: getString(item.trialDate, item.trial_date),
          trialTime: getString(item.trialTime, item.trial_time),
          location: getString(item.location),
          contactName: getString(item.contactName, item.contact_name),
          contactPhone: getString(item.contactPhone, item.contact_phone),
          note: getString(item.note),
          responseNote: getString(item.responseNote, item.response_note),
        })));
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setInvitations(list);
    } catch (error) {
      console.error('加载邀请失败:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // 过滤
  const filteredInvitations = invitations.filter(inv => {
    if (activeTab === 'pending') return inv.status === 'pending';
    if (activeTab === 'accepted') return inv.status === 'accepted' || inv.status === 'completed';
    if (activeTab === 'expired') return inv.status === 'expired' || inv.status === 'rejected' || inv.status === 'declined';
    return true;
  });

  // 统计
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted' || i.status === 'completed').length,
    expired: invitations.filter(i => i.status === 'expired' || i.status === 'rejected' || i.status === 'declined').length,
  };

  // 接受邀请
  const handleAccept = async (invitation: Invitation) => {
    setActionLoading(getActionKey(invitation));
    try {
      if (invitation.kind === 'trial') {
        await trialApi.respondInvite(invitation.id, { status: 'accepted' });
      } else if (invitation.inviteCode) {
        await teamApi.acceptInvitation(invitation.inviteCode);
      }
      await loadInvitations();
    } catch (error) {
      console.error('接受邀请失败:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 拒绝邀请
  const handleReject = async (invitation: Invitation) => {
    setActionLoading(getActionKey(invitation));
    try {
      if (invitation.kind === 'trial') {
        await trialApi.respondInvite(invitation.id, { status: 'declined', response_note: rejectReason });
      } else if (invitation.inviteCode) {
        await teamApi.rejectInvitation(invitation.inviteCode, rejectReason);
      }
      setShowRejectModal(null);
      setRejectReason('');
      await loadInvitations();
    } catch (error) {
      console.error('拒绝邀请失败:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 状态样式
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock, label: '待接受' },
      accepted: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: '已接受' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: '已拒绝' },
      declined: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: '已拒绝' },
      completed: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: CheckCircle, label: '已完成' },
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

  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">我的邀请</h1>
            <p className="text-gray-400 mt-1">管理您收到的球队邀请与试训邀请</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`bg-[#1a1f2e] rounded-xl p-4 border cursor-pointer transition-colors ${activeTab === 'pending' ? 'border-amber-500/50' : 'border-gray-800 hover:border-gray-700'}`}
          onClick={() => setActiveTab('pending')}>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-gray-400">待处理</div>
        </div>
        <div className={`bg-[#1a1f2e] rounded-xl p-4 border cursor-pointer transition-colors ${activeTab === 'accepted' ? 'border-green-500/50' : 'border-gray-800 hover:border-gray-700'}`}
          onClick={() => setActiveTab('accepted')}>
          <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-sm text-gray-400">已接受</div>
        </div>
        <div className={`bg-[#1a1f2e] rounded-xl p-4 border cursor-pointer transition-colors ${activeTab === 'expired' ? 'border-gray-500/50' : 'border-gray-800 hover:border-gray-700'}`}
          onClick={() => setActiveTab('expired')}>
          <div className="text-2xl font-bold text-gray-400">{stats.expired}</div>
          <div className="text-sm text-gray-400">已失效</div>
        </div>
      </div>

      {/* 邀请列表 */}
      {loading ? (
        <ListItemSkeleton count={4} />
      ) : filteredInvitations.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">
            {activeTab === 'pending' ? '暂无待处理的邀请' : activeTab === 'accepted' ? '暂无已接受的邀请' : '暂无已失效的邀请'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvitations.map(inv => (
            <div key={inv.id} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    inv.kind === 'trial' ? 'bg-emerald-500/20' : inv.type === 'player' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    {inv.kind === 'trial' ? (
                      <Clock className="w-7 h-7 text-emerald-400" />
                    ) : inv.type === 'player' ? (
                      <Users className="w-7 h-7 text-blue-400" />
                    ) : (
                      <GraduationCap className="w-7 h-7 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{inv.teamName}</h3>
                      {getStatusBadge(inv.status)}
                    </div>
                    <p className="text-gray-400 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {inv.clubName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {inv.kind === 'trial' ? '试训邀请' : inv.type === 'player' ? '球员邀请' : '教练邀请'} · 由 {inv.createdBy} 发送
                    </p>
                  </div>
                </div>
              </div>

              {/* 邀请信息 */}
              <div className="bg-[#0f1419] rounded-xl p-4 mb-4">
                {inv.kind === 'trial' ? (
                  <div className="grid gap-3 text-sm text-gray-400 sm:grid-cols-2">
                    <div>
                      试训时间: <span className="text-white">{inv.trialDate || '待确认'} {inv.trialTime || ''}</span>
                    </div>
                    <div>
                      地点: <span className="text-white">{inv.location || '待确认'}</span>
                    </div>
                    <div>
                      联系人: <span className="text-white">{inv.contactName || '-'}</span>
                    </div>
                    <div>
                      联系电话: <span className="text-white">{inv.contactPhone || '-'}</span>
                    </div>
                    {inv.note && (
                      <div className="sm:col-span-2">
                        备注: <span className="text-white">{inv.note}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      邀请码: <span className="font-mono text-white">{inv.inviteCode}</span>
                    </div>
                    {inv.status === 'pending' && inv.expiresAt && (
                      <div className="text-amber-400">
                        有效期至: {new Date(inv.expiresAt).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                )}
                {inv.responseNote && (
                  <div className="mt-3 border-t border-gray-800 pt-3 text-sm text-gray-400">
                    处理备注: <span className="text-white">{inv.responseNote}</span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {inv.status === 'pending' && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowRejectModal(inv)}
                    disabled={actionLoading === getActionKey(inv)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> 拒绝
                  </button>
                  <button
                    onClick={() => handleAccept(inv)}
                    disabled={actionLoading === getActionKey(inv)}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    {actionLoading === getActionKey(inv) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {inv.kind === 'trial' ? '接受试训' : '接受邀请'}
                  </button>
                </div>
              )}

              {inv.kind === 'team' && inv.status === 'accepted' && inv.teamId && (
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onViewTeam?.(inv.teamId)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors flex items-center gap-2"
                  >
                    查看球队 <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 拒绝原因弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">拒绝邀请</h2>
              <p className="text-gray-400 text-sm mt-1">
                确定要拒绝{showRejectModal.kind === 'trial' ? '这次试训邀请' : `加入 ${showRejectModal.teamName}`}吗？
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">拒绝原因（可选）</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === getActionKey(showRejectModal)}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
              >
                {actionLoading === getActionKey(showRejectModal) && <Loader2 className="w-4 h-4 animate-spin" />}
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvitations;
