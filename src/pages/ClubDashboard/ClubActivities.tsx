import React, { useEffect, useMemo, useState } from 'react';
import { clubActivityApi } from '../../services/api';
import { toast } from 'sonner';
import {
  Archive,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Copy,
  Download,
  Edit2,
  Eye,
  Filter,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

type ActivityType = 'external' | 'internal';
type ActivityStatus = 'upcoming' | 'ongoing' | 'ended';
type PublishStatus = 'draft' | 'published' | 'unpublished';
type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'checked_in';

interface ClubActivitiesProps {
  clubId: number;
  onBack: () => void;
}

interface ClubActivity {
  id: number;
  title: string;
  type: ActivityType;
  status: ActivityStatus;
  publishStatus?: PublishStatus;
  description?: string;
  coverImage?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  contactPhone?: string;
  contactWechat?: string;
  isReview?: boolean;
  reviewContent?: string;
  reviewImages?: string[];
  regCount?: number;
}

interface ActivityRegistration {
  id: number;
  activity_id?: number;
  user_id?: number;
  name: string;
  phone?: string;
  wechat?: string;
  remark?: string;
  status: RegistrationStatus;
  created_at?: string;
  createdAt?: string;
}

interface ActivityForm {
  title: string;
  type: ActivityType;
  description: string;
  coverImage: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  contactPhone: string;
  contactWechat: string;
  publishStatus: PublishStatus;
  isReview: boolean;
  reviewContent: string;
  reviewImages: string;
}

const emptyForm: ActivityForm = {
  title: '',
  type: 'external',
  description: '',
  coverImage: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: 0,
  contactPhone: '',
  contactWechat: '',
  publishStatus: 'published',
  isReview: false,
  reviewContent: '',
  reviewImages: '',
};

const typeMeta: Record<ActivityType, { label: string; description: string; className: string; icon: LucideIcon }> = {
  external: {
    label: '外部活动',
    description: '试训、开放日、友谊赛邀约',
    className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
    icon: Globe,
  },
  internal: {
    label: '内部活动',
    description: '队内安排、家长会、内部选拔',
    className: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
    icon: Lock,
  },
};

const activityStatusMeta: Record<ActivityStatus, { label: string; className: string; icon: LucideIcon }> = {
  upcoming: { label: '即将开始', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', icon: Clock },
  ongoing: { label: '进行中', className: 'bg-amber-500/15 text-amber-300 border-amber-500/20', icon: Calendar },
  ended: { label: '已结束', className: 'bg-slate-500/15 text-slate-300 border-slate-500/20', icon: Archive },
};

const publishStatusMeta: Record<PublishStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-500/15 text-slate-300 border-slate-500/20' },
  published: { label: '已发布', className: 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/20' },
  unpublished: { label: '已下架', className: 'bg-red-500/15 text-red-300 border-red-500/20' },
};

const registrationStatusMeta: Record<RegistrationStatus, { label: string; className: string; icon: LucideIcon }> = {
  pending: { label: '待审核', className: 'bg-amber-500/15 text-amber-300 border-amber-500/20', icon: Clock },
  confirmed: { label: '已通过', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', icon: CheckCircle },
  cancelled: { label: '已取消', className: 'bg-red-500/15 text-red-300 border-red-500/20', icon: XCircle },
  rejected: { label: '已拒绝', className: 'bg-red-500/15 text-red-300 border-red-500/20', icon: XCircle },
  checked_in: { label: '已签到', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20', icon: CheckCircle },
};

const toDateTimeInput = (value?: string) => {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
};

const normalizeImages = (images?: string[] | string) => {
  if (Array.isArray(images)) return images.join('\n');
  if (typeof images === 'string') return images;
  return '';
};

const toPayload = (form: ActivityForm) => ({
  title: form.title.trim(),
  type: form.type,
  description: form.description.trim(),
  coverImage: form.coverImage.trim(),
  startTime: form.startTime,
  endTime: form.endTime,
  location: form.location.trim(),
  maxParticipants: Number(form.maxParticipants) || 0,
  contactPhone: form.contactPhone.trim(),
  contactWechat: form.contactWechat.trim(),
  publishStatus: form.publishStatus,
  isReview: form.isReview,
  reviewContent: form.reviewContent.trim(),
  reviewImages: form.reviewImages.split('\n').map(item => item.trim()).filter(Boolean),
});

const getShareUrl = (clubId: number, activityId: number) =>
  `${window.location.origin}/clubs/${clubId}?activity=${activityId}`;

const ClubActivities: React.FC<ClubActivitiesProps> = ({ clubId, onBack }) => {
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus | PublishStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClubActivity | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [registrationActivity, setRegistrationActivity] = useState<ClubActivity | null>(null);
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationFilter, setRegistrationFilter] = useState<'all' | RegistrationStatus>('all');
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadActivities();
  }, [clubId]);

  const loadActivities = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await clubActivityApi.getActivities(clubId, { publishStatus: 'all' });
      const data = res.data?.data;
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载活动失败:', err);
      toast.error('活动列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const published = activities.filter(item => (item.publishStatus || 'published') === 'published').length;
    const pending = activities.reduce((sum, item) => sum + (item.regCount || 0), 0);
    return {
      total: activities.length,
      published,
      external: activities.filter(item => item.type === 'external').length,
      internal: activities.filter(item => item.type === 'internal').length,
      registrations: pending,
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return activities.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        const publishStatus = item.publishStatus || 'published';
        if (['draft', 'published', 'unpublished'].includes(statusFilter)) {
          if (publishStatus !== statusFilter) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }
      if (!kw) return true;
      return [item.title, item.location, item.description].some(value => value?.toLowerCase().includes(kw));
    });
  }, [activities, keyword, statusFilter, typeFilter]);

  const filteredRegistrations = useMemo(() => {
    if (registrationFilter === 'all') return registrations;
    return registrations.filter(item => item.status === registrationFilter);
  }, [registrationFilter, registrations]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (activity: ClubActivity) => {
    setEditing(activity);
    setForm({
      title: activity.title || '',
      type: activity.type || 'external',
      description: activity.description || '',
      coverImage: activity.coverImage || '',
      startTime: toDateTimeInput(activity.startTime),
      endTime: toDateTimeInput(activity.endTime),
      location: activity.location || '',
      maxParticipants: activity.maxParticipants || 0,
      contactPhone: activity.contactPhone || '',
      contactWechat: activity.contactWechat || '',
      publishStatus: activity.publishStatus || 'published',
      isReview: !!activity.isReview,
      reviewContent: activity.reviewContent || '',
      reviewImages: normalizeImages(activity.reviewImages),
    });
    setModalOpen(true);
  };

  const openClone = (activity: ClubActivity) => {
    setEditing(null);
    setForm({
      title: `${activity.title || ''} 复制`,
      type: activity.type || 'external',
      description: activity.description || '',
      coverImage: activity.coverImage || '',
      startTime: '',
      endTime: '',
      location: activity.location || '',
      maxParticipants: activity.maxParticipants || 0,
      contactPhone: activity.contactPhone || '',
      contactWechat: activity.contactWechat || '',
      publishStatus: 'draft',
      isReview: false,
      reviewContent: '',
      reviewImages: '',
    });
    setModalOpen(true);
  };

  const saveActivity = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('请填写活动标题');
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error('请填写活动开始和结束时间');
      return;
    }
    if (!form.location.trim()) {
      toast.error('请填写活动地点');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await clubActivityApi.updateActivity(clubId, editing.id, toPayload(form));
        toast.success('活动已更新');
      } else {
        await clubActivityApi.createActivity(clubId, toPayload(form));
        toast.success(form.publishStatus === 'draft' ? '草稿已保存' : '活动已创建');
      }
      setModalOpen(false);
      await loadActivities();
    } catch (err) {
      console.error('保存活动失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (activity: ClubActivity) => {
    const publishStatus = activity.publishStatus || 'published';
    try {
      if (publishStatus === 'published') {
        await clubActivityApi.unpublishActivity(clubId, activity.id);
        toast.success('活动已下架');
      } else {
        await clubActivityApi.publishActivity(clubId, activity.id);
        toast.success('活动已发布');
      }
      await loadActivities();
    } catch (err) {
      console.error('切换发布状态失败:', err);
      toast.error('操作失败，请重试');
    }
  };

  const deleteActivity = async (activity: ClubActivity) => {
    if (!confirm(`确定删除活动「${activity.title}」吗？`)) return;
    try {
      await clubActivityApi.deleteActivity(clubId, activity.id);
      toast.success('活动已删除');
      await loadActivities();
    } catch (err) {
      console.error('删除活动失败:', err);
      toast.error('删除失败，请重试');
    }
  };

  const copyShareLink = async (activity: ClubActivity) => {
    const url = getShareUrl(clubId, activity.id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('分享链接已复制');
    } catch {
      toast.message(url);
    }
  };

  const openRegistrations = async (activity: ClubActivity) => {
    setRegistrationActivity(activity);
    setSelectedRegistrationIds(new Set());
    setRegistrationFilter('all');
    setRegistrations([]);
    setRegistrationLoading(true);
    try {
      const res = await clubActivityApi.getRegistrations(clubId, activity.id);
      const data = res.data?.data;
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载报名失败:', err);
      toast.error('报名名单加载失败');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const updateRegistrationStatus = async (registrationId: number, status: RegistrationStatus) => {
    if (!registrationActivity) return;
    try {
      await clubActivityApi.updateRegistrationStatus(clubId, registrationActivity.id, registrationId, { status });
      toast.success('报名状态已更新');
      await openRegistrations(registrationActivity);
      await loadActivities();
    } catch (err) {
      console.error('更新报名状态失败:', err);
      toast.error('更新失败，请重试');
    }
  };

  const batchUpdateRegistrationStatus = async (status: RegistrationStatus) => {
    if (!registrationActivity || selectedRegistrationIds.size === 0) return;
    try {
      await clubActivityApi.batchUpdateRegistrationStatus(clubId, registrationActivity.id, {
        ids: Array.from(selectedRegistrationIds),
        status,
      });
      toast.success('批量处理完成');
      await openRegistrations(registrationActivity);
      await loadActivities();
    } catch (err) {
      console.error('批量更新报名状态失败:', err);
      toast.error('批量处理失败');
    }
  };

  const exportRegistrations = async () => {
    if (!registrationActivity) return;
    try {
      await clubActivityApi.exportRegistrations(clubId, registrationActivity.id);
    } catch (err) {
      console.error('导出报名失败:', err);
      toast.error('导出失败，请重试');
    }
  };

  const toggleRegistrationSelection = (id: number) => {
    setSelectedRegistrationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!clubId) {
    return (
      <div className="min-h-[420px] flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400">正在加载俱乐部信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> 返回概览
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.08)]">
              <Calendar className="w-6 h-6 text-[#39ff14]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">活动管理</h1>
              <p className="text-sm text-slate-400 mt-1">发布俱乐部内部活动和外部招募活动，统一管理报名与主页展示。</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadActivities} className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="h-10 px-4 rounded-xl bg-[#39ff14] text-[#0a0e17] font-semibold inline-flex items-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.25)] transition-all">
            <Plus className="w-4 h-4" /> 新建活动
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: '活动总数', value: stats.total, icon: Calendar },
          { label: '已发布', value: stats.published, icon: Globe },
          { label: '外部活动', value: stats.external, icon: Share2 },
          { label: '内部活动', value: stats.internal, icon: Lock },
          { label: '累计报名', value: stats.registrations, icon: Users },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{item.label}</span>
              <item.icon className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索标题、地点或简介"
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#0f1419] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#39ff14]/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Filter className="w-4 h-10 text-slate-500" />
            {(['all', 'external', 'internal'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`h-10 px-3 rounded-xl text-sm border transition-colors ${
                  typeFilter === type ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                {type === 'all' ? '全部类型' : typeMeta[type].label}
              </button>
            ))}
            {(['all', 'published', 'unpublished', 'upcoming', 'ongoing', 'ended'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`h-10 px-3 rounded-xl text-sm border transition-colors ${
                  statusFilter === status ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                {status === 'all'
                  ? '全部状态'
                  : status in publishStatusMeta
                    ? publishStatusMeta[status as PublishStatus].label
                    : activityStatusMeta[status as ActivityStatus].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[320px] rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="min-h-[320px] rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">暂无匹配活动</h3>
            <p className="text-sm text-slate-400 mb-4">可以先创建一个内部活动或外部招募活动，再同步到俱乐部主页展示。</p>
            <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-[#39ff14] text-[#0a0e17] font-semibold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新建活动
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredActivities.map(activity => {
            const TypeIcon = typeMeta[activity.type]?.icon || Globe;
            const StatusIcon = activityStatusMeta[activity.status]?.icon || Clock;
            const publishStatus = activity.publishStatus || 'published';
            return (
              <article key={activity.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] overflow-hidden hover:border-emerald-500/20 transition-colors">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-36 sm:h-auto bg-[#0f1419] overflow-hidden">
                    {activity.coverImage ? (
                      <img src={activity.coverImage} alt={activity.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent">
                        <Calendar className="w-10 h-10 text-emerald-300/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${typeMeta[activity.type]?.className || typeMeta.external.className}`}>
                        <TypeIcon className="w-3.5 h-3.5" /> {typeMeta[activity.type]?.label || '外部活动'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${activityStatusMeta[activity.status]?.className || activityStatusMeta.upcoming.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {activityStatusMeta[activity.status]?.label || '即将开始'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs ${publishStatusMeta[publishStatus]?.className || publishStatusMeta.published.className}`}>
                        {publishStatusMeta[publishStatus]?.label || '已发布'}
                      </span>
                      {activity.isReview && <span className="inline-flex items-center px-2 py-1 rounded-lg border text-xs bg-pink-500/15 text-pink-300 border-pink-500/20">回顾</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate">{activity.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2 min-h-[40px]">{activity.description || typeMeta[activity.type]?.description}</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{activity.startTime || '-'}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{activity.location || '-'}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        已报名 {activity.regCount || 0}{activity.maxParticipants ? ` / ${activity.maxParticipants}` : ''}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button onClick={() => openEdit(activity)} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm inline-flex items-center gap-1.5">
                        <Edit2 className="w-4 h-4" /> 编辑
                      </button>
                      <button onClick={() => openRegistrations(activity)} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm inline-flex items-center gap-1.5">
                        <Eye className="w-4 h-4" /> 报名
                      </button>
                      <button onClick={() => togglePublish(activity)} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm">
                        {publishStatus === 'published' ? '下架' : '发布'}
                      </button>
                      <button onClick={() => copyShareLink(activity)} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm inline-flex items-center gap-1.5">
                        <Share2 className="w-4 h-4" /> 转发
                      </button>
                      <button onClick={() => openClone(activity)} className="p-2 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteActivity(activity)} className="p-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={saveActivity} className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#101723] shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#101723]/95 backdrop-blur border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{editing ? '编辑活动' : '新建活动'}</h2>
                <p className="text-xs text-slate-500 mt-1">内部活动默认用于俱乐部成员，外部活动可用于主页展示和转发报名。</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">活动标题</span>
                  <input value={form.title} maxLength={30} onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">活动范围</span>
                  <select value={form.type} onChange={(event) => setForm(prev => ({ ...prev, type: event.target.value as ActivityType }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50">
                    <option value="external">外部活动</option>
                    <option value="internal">内部活动</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">开始时间</span>
                  <input type="datetime-local" value={form.startTime} onChange={(event) => setForm(prev => ({ ...prev, startTime: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">结束时间</span>
                  <input type="datetime-local" value={form.endTime} onChange={(event) => setForm(prev => ({ ...prev, endTime: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-slate-300">活动地点</span>
                  <input value={form.location} onChange={(event) => setForm(prev => ({ ...prev, location: event.target.value }))} placeholder="如：上海市浦东新区少年球探训练基地" className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white placeholder:text-slate-600 outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">人数上限</span>
                  <input type="number" min={0} value={form.maxParticipants} onChange={(event) => setForm(prev => ({ ...prev, maxParticipants: Number(event.target.value) || 0 }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">发布状态</span>
                  <select value={form.publishStatus} onChange={(event) => setForm(prev => ({ ...prev, publishStatus: event.target.value as PublishStatus }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50">
                    <option value="published">直接发布</option>
                    <option value="draft">保存草稿</option>
                    <option value="unpublished">暂不展示</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">联系电话</span>
                  <input value={form.contactPhone} onChange={(event) => setForm(prev => ({ ...prev, contactPhone: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">联系微信</span>
                  <input value={form.contactWechat} onChange={(event) => setForm(prev => ({ ...prev, contactWechat: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-slate-300">封面图 URL</span>
                  <input value={form.coverImage} onChange={(event) => setForm(prev => ({ ...prev, coverImage: event.target.value }))} className="w-full h-11 rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 text-white outline-none focus:border-[#39ff14]/50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-slate-300">活动简介</span>
                  <textarea value={form.description} maxLength={1000} rows={4} onChange={(event) => setForm(prev => ({ ...prev, description: event.target.value }))} className="w-full rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 py-3 text-white outline-none focus:border-[#39ff14]/50 resize-none" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isReview} onChange={(event) => setForm(prev => ({ ...prev, isReview: event.target.checked }))} className="w-4 h-4 rounded border-slate-600 bg-[#0a0e17]" />
                作为活动回顾展示
              </label>
              {form.isReview && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">回顾内容</span>
                    <textarea value={form.reviewContent} rows={4} onChange={(event) => setForm(prev => ({ ...prev, reviewContent: event.target.value }))} className="w-full rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 py-3 text-white outline-none focus:border-[#39ff14]/50 resize-none" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">回顾图片，每行一个 URL</span>
                    <textarea value={form.reviewImages} rows={4} onChange={(event) => setForm(prev => ({ ...prev, reviewImages: event.target.value }))} className="w-full rounded-xl bg-[#0a0e17] border border-white/[0.08] px-3 py-3 text-white outline-none focus:border-[#39ff14]/50 resize-none" />
                  </label>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-[#101723]/95 backdrop-blur border-t border-white/[0.06] px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]">取消</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-[#39ff14] text-[#0a0e17] font-semibold disabled:opacity-60 inline-flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} 保存活动
              </button>
            </div>
          </form>
        </div>
      )}

      {registrationActivity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#101723] shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#101723]/95 backdrop-blur border-b border-white/[0.06] px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">报名管理</h2>
                <p className="text-xs text-slate-500 mt-1">{registrationActivity.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportRegistrations} className="px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-sm inline-flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> 导出
                </button>
                <button onClick={() => setRegistrationActivity(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              {selectedRegistrationIds.size > 0 && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-emerald-300">已选择 {selectedRegistrationIds.size} 个报名</span>
                  <div className="flex gap-2">
                    <button onClick={() => batchUpdateRegistrationStatus('confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm">批量通过</button>
                    <button onClick={() => batchUpdateRegistrationStatus('rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-sm">批量拒绝</button>
                  </div>
                </div>
              )}
              <div className="mb-4 flex flex-wrap gap-2">
                {(['all', 'pending', 'confirmed', 'rejected', 'checked_in', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setRegistrationFilter(status)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      registrationFilter === status
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {status === 'all' ? '全部' : registrationStatusMeta[status].label}
                  </button>
                ))}
              </div>
              {registrationLoading ? (
                <div className="min-h-[240px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="min-h-[240px] flex items-center justify-center rounded-xl border border-dashed border-white/[0.12]">
                  <p className="text-slate-400">暂无报名记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRegistrations.map(registration => {
                    const status = registrationStatusMeta[registration.status] || registrationStatusMeta.pending;
                    const StatusIcon = status.icon;
                    return (
                      <div key={registration.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedRegistrationIds.has(registration.id)}
                            onChange={() => toggleRegistrationSelection(registration.id)}
                            className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#0a0e17]"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-white font-medium">{registration.name}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs ${status.className}`}>
                                <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                              </span>
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              {registration.phone || '未留电话'}{registration.wechat ? ` / ${registration.wechat}` : ''}
                            </div>
                            {registration.remark && <div className="text-xs text-slate-500 mt-1">备注：{registration.remark}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:flex-shrink-0">
                          <button onClick={() => updateRegistrationStatus(registration.id, 'confirmed')} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-sm">通过</button>
                          <button onClick={() => updateRegistrationStatus(registration.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 text-sm">拒绝</button>
                          <button onClick={() => updateRegistrationStatus(registration.id, 'checked_in')} className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-sm">签到</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubActivities;
