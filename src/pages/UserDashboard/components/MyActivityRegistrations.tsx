import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clubActivityApi } from '../../../services/api';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

type RegistrationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'checked_in';
type ActivityType = 'external' | 'internal';

interface ActivityRegistration {
  id: number;
  activityId: number;
  clubId: number;
  clubName: string;
  clubLogo?: string;
  activityTitle: string;
  activityCover?: string;
  activityType: ActivityType;
  activityStatus?: string;
  activityLocation?: string;
  activityStartTime?: string;
  activityEndTime?: string;
  maxParticipants?: number;
  contactPhone?: string;
  contactWechat?: string;
  name: string;
  phone?: string;
  wechat?: string;
  remark?: string;
  status: RegistrationStatus;
  createdAt?: string;
  created_at?: string;
}

interface RawRegistration {
  id?: number;
  activityId?: number;
  activity_id?: number;
  clubId?: number;
  club_id?: number;
  clubName?: string;
  club_name?: string;
  clubLogo?: string;
  club_logo?: string;
  activityTitle?: string;
  activity_title?: string;
  activityCover?: string;
  activity_cover?: string;
  activityType?: ActivityType;
  activity_type?: ActivityType;
  activityStatus?: string;
  activity_status?: string;
  activityLocation?: string;
  activity_location?: string;
  activityStartTime?: string;
  activity_start_time?: string;
  activityEndTime?: string;
  activity_end_time?: string;
  maxParticipants?: number;
  max_participants?: number;
  contactPhone?: string;
  contact_phone?: string;
  contactWechat?: string;
  contact_wechat?: string;
  name?: string;
  phone?: string;
  wechat?: string;
  remark?: string;
  status?: RegistrationStatus;
  createdAt?: string;
  created_at?: string;
}

const statusMeta: Record<RegistrationStatus, { label: string; className: string; icon: LucideIcon; hint: string }> = {
  pending: {
    label: '待审核',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    icon: Clock,
    hint: '俱乐部正在审核你的报名信息',
  },
  confirmed: {
    label: '已通过',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    icon: CheckCircle,
    hint: '请按活动时间到场参加',
  },
  rejected: {
    label: '未通过',
    className: 'bg-red-500/15 text-red-300 border-red-500/25',
    icon: XCircle,
    hint: '本次报名未通过审核',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    icon: XCircle,
    hint: '报名已取消',
  },
  checked_in: {
    label: '已签到',
    className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    icon: ShieldCheck,
    hint: '已完成活动签到',
  },
};

const typeMeta: Record<ActivityType, { label: string; className: string }> = {
  external: { label: '外部活动', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' },
  internal: { label: '内部活动', className: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
};

const normalizeRegistration = (item: RawRegistration): ActivityRegistration => ({
  id: Number(item.id || 0),
  activityId: Number(item.activityId || item.activity_id || 0),
  clubId: Number(item.clubId || item.club_id || 0),
  clubName: item.clubName || item.club_name || '未知俱乐部',
  clubLogo: item.clubLogo || item.club_logo,
  activityTitle: item.activityTitle || item.activity_title || '未命名活动',
  activityCover: item.activityCover || item.activity_cover,
  activityType: item.activityType || item.activity_type || 'external',
  activityStatus: item.activityStatus || item.activity_status,
  activityLocation: item.activityLocation || item.activity_location,
  activityStartTime: item.activityStartTime || item.activity_start_time,
  activityEndTime: item.activityEndTime || item.activity_end_time,
  maxParticipants: item.maxParticipants || item.max_participants,
  contactPhone: item.contactPhone || item.contact_phone,
  contactWechat: item.contactWechat || item.contact_wechat,
  name: item.name || '',
  phone: item.phone,
  wechat: item.wechat,
  remark: item.remark,
  status: item.status || 'pending',
  createdAt: item.createdAt || item.created_at,
  created_at: item.created_at,
});

const formatDate = (value?: string) => {
  if (!value) return '-';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MyActivityRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | RegistrationStatus>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const res = await clubActivityApi.getMyRegistrations();
      const rawList = res.data?.data || [];
      setRegistrations(Array.isArray(rawList) ? rawList.map(normalizeRegistration) : []);
    } catch (error) {
      console.error('加载我的报名失败:', error);
      toast.error('我的报名加载失败');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const stats = useMemo(() => ({
    all: registrations.length,
    pending: registrations.filter(item => item.status === 'pending').length,
    confirmed: registrations.filter(item => item.status === 'confirmed').length,
    rejected: registrations.filter(item => item.status === 'rejected').length,
    checked_in: registrations.filter(item => item.status === 'checked_in').length,
    cancelled: registrations.filter(item => item.status === 'cancelled').length,
  }), [registrations]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return registrations;
    return registrations.filter(item => item.status === activeTab);
  }, [activeTab, registrations]);

  const cancelRegistration = async (item: ActivityRegistration) => {
    if (!item.clubId || !item.activityId) {
      toast.error('缺少活动信息，无法取消');
      return;
    }
    if (!confirm(`确定取消报名「${item.activityTitle}」吗？`)) return;
    setCancellingId(item.id);
    try {
      await clubActivityApi.cancelRegistration(item.clubId, item.activityId);
      toast.success('报名已取消');
      await loadRegistrations();
    } catch (error) {
      console.error('取消报名失败:', error);
      toast.error('取消失败，请重试');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">我的报名</h2>
          <p className="text-sm text-gray-400 mt-1">查看试训、开放日和俱乐部内部活动的报名审核进度。</p>
        </div>
        <button
          onClick={loadRegistrations}
          className="h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.08] inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {([
          ['all', '全部'],
          ['pending', '待审核'],
          ['confirmed', '已通过'],
          ['checked_in', '已签到'],
          ['rejected', '未通过'],
          ['cancelled', '已取消'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activeTab === key
                ? 'border-[#39ff14]/45 bg-[#39ff14]/10'
                : 'border-gray-800 bg-[#1a1f2e] hover:border-gray-700'
            }`}
          >
            <div className="text-2xl font-bold text-white">{stats[key]}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="min-h-[280px] flex items-center justify-center rounded-2xl border border-gray-800 bg-[#1a1f2e]">
          <Loader2 className="w-8 h-8 animate-spin text-[#39ff14]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="min-h-[280px] flex items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-[#1a1f2e] p-8">
          <div className="text-center">
            <Ticket className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">{activeTab === 'all' ? '暂无活动报名记录' : '当前状态下暂无报名记录'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const meta = statusMeta[item.status] || statusMeta.pending;
            const StatusIcon = meta.icon;
            const canCancel = item.status === 'pending' || item.status === 'confirmed';
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-800 bg-[#1a1f2e]">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-44 h-36 bg-[#0f1419] overflow-hidden">
                    {item.activityCover ? (
                      <img src={item.activityCover} alt={item.activityTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#39ff14]/10 via-cyan-500/5 to-transparent">
                        <Calendar className="w-10 h-10 text-[#39ff14]/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${meta.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {meta.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs ${typeMeta[item.activityType]?.className || typeMeta.external.className}`}>
                        {typeMeta[item.activityType]?.label || '外部活动'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{item.activityTitle}</h3>
                        <p className="text-sm text-gray-400 mt-1">{item.clubName}</p>
                      </div>
                      <div className="text-sm text-gray-400 lg:text-right">{meta.hint}</div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{formatDate(item.activityStartTime)}{item.activityEndTime ? ` - ${formatDate(item.activityEndTime)}` : ''}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{item.activityLocation || '-'}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">报名人：{item.name || '本人'}{item.phone ? ` / ${item.phone}` : ''}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">提交时间：{formatDate(item.createdAt || item.created_at)}</span>
                      </span>
                    </div>
                    {item.remark && <p className="mt-3 text-sm text-gray-500">备注：{item.remark}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {item.clubId > 0 && (
                        <Link to={`/clubs/${item.clubId}?activity=${item.activityId}`} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm inline-flex items-center gap-1.5">
                          <ExternalLink className="w-4 h-4" /> 查看活动
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => cancelRegistration(item)}
                          disabled={cancellingId === item.id}
                          className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                        >
                          {cancellingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          取消报名
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyActivityRegistrations;
