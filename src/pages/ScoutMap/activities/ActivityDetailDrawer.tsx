import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Crown,
  LogIn,
  Share2,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ClubActivity } from './types';
import { ACTIVITY_TYPE_CONFIG } from './types';
import { clubActivityApi, socialApi } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  activity: ClubActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

type RegistrantState = {
  playerName: string;
  playerAge: string;
  playerPosition: string;
  contactPhone: string;
  remark: string;
};

const DEFAULT_POSITIONS = ['前锋', '边锋', '中场', '后腰', '后卫', '门将'];

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const calculateAgeFromBirthDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const birthDate = new Date(dateStr);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age > 0 ? String(age) : '';
};

const ActivityDetailDrawer: React.FC<Props> = ({ activity, isOpen, onClose, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, currentRole } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [registrant, setRegistrant] = useState<RegistrantState>({
    playerName: '',
    playerAge: '',
    playerPosition: '',
    contactPhone: '',
    remark: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const birthAge = calculateAgeFromBirthDate(user?.birthDate || user?.birth_date);
    setResult(null);
    setFavorited(false);
    setRegistrant({
      playerName: user?.name || user?.nickname || '',
      playerAge: user?.age ? String(user.age) : birthAge,
      playerPosition: user?.position || '',
      contactPhone: user?.contactPhone || user?.phone || user?.father_phone || user?.mother_phone || '',
      remark: '',
    });
  }, [isOpen, activity?.id, user]);

  if (!isOpen || !activity) return null;

  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.trial;
  const progress = activity.maxParticipants > 0 ? (activity.currentParticipants / activity.maxParticipants) * 100 : 0;
  const isFull = activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;
  const deadlinePassed = activity.registrationDeadline ? new Date(activity.registrationDeadline).getTime() < Date.now() : false;
  const positionOptions = activity.positions?.length ? activity.positions : DEFAULT_POSITIONS;
  const effectiveRole = currentRole || user?.current_role || user?.currentRole || user?.role;
  const isPlayerRole = effectiveRole === 'player' || effectiveRole === 'user';
  const hasAgeRule = Boolean(activity.ageMin || activity.ageMax);
  const hasPositionRule = Boolean(activity.positions?.length);
  const missingProfileFields = [
    !registrant.playerAge && '年龄',
    !registrant.playerPosition && '场上位置',
    !user?.city && '所在城市',
  ].filter(Boolean) as string[];

  const updateRegistrant = (patch: Partial<RegistrantState>) => {
    setRegistrant((prev) => ({ ...prev, ...patch }));
    if (result?.type === 'error') setResult(null);
  };

  const goLogin = () => {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    navigate('/login');
  };

  const validateRegistration = () => {
    if (!isAuthenticated) return '请先登录后报名';
    if (!isPlayerRole) return '请切换到球员身份后再报名活动';
    if (isFull) return '报名人数已满';
    if (deadlinePassed) return '报名已截止';
    if (!registrant.playerName.trim()) return '请填写球员姓名';
    if (!registrant.contactPhone.trim()) return '请填写联系电话';

    if (hasAgeRule) {
      const age = Number(registrant.playerAge);
      if (!Number.isFinite(age) || age <= 0) return '请填写球员年龄';
      if (activity.ageMin && age < activity.ageMin) return `活动要求 ${activity.ageMin} 岁以上球员参加`;
      if (activity.ageMax && age > activity.ageMax) return `活动要求 ${activity.ageMax} 岁以下球员参加`;
    }

    if (hasPositionRule && !registrant.playerPosition) return '请选择球员位置';
    if (hasPositionRule && !activity.positions?.includes(registrant.playerPosition)) {
      return '该活动暂不开放当前位置报名';
    }

    return '';
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info('请先登录后报名');
      goLogin();
      return;
    }

    const validationMessage = validateRegistration();
    if (validationMessage) {
      setResult({ type: 'error', message: validationMessage });
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const res = await clubActivityApi.registerPublicActivity(activity.id, {
        player_name: registrant.playerName.trim(),
        player_age: Number(registrant.playerAge) || undefined,
        player_position: registrant.playerPosition || undefined,
        contact_phone: registrant.contactPhone.trim(),
        remark: registrant.remark.trim() || undefined,
      });
      if (res.data?.success) {
        const message = res.data?.message || '报名提交成功，请等待俱乐部审核';
        setResult({ type: 'success', message });
        toast.success(message);
        onRegisterSuccess?.();
      } else {
        const message = res.data?.error?.message || '报名失败';
        setResult({ type: 'error', message });
        toast.error(message);
      }
    } catch (e: any) {
      const message = e?.response?.data?.error?.message || '报名失败，请检查网络';
      setResult({ type: 'error', message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: activity.title,
          text: `${activity.clubName || '俱乐部'}发布了活动：${activity.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${activity.title} ${shareUrl}`);
        toast.success('活动链接已复制');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('分享失败，请稍后重试');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('请先登录后收藏活动');
      goLogin();
      return;
    }
    if (favoriting) return;

    setFavoriting(true);
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);
    try {
      const res = await socialApi.toggleFavorite({ target_type: 'club_activity', target_id: activity.id });
      const serverFavorited = res.data?.data?.favorited;
      const finalFavorited = typeof serverFavorited === 'boolean' ? serverFavorited : nextFavorited;
      setFavorited(finalFavorited);
      toast.success(finalFavorited ? '已收藏活动' : '已取消收藏');
    } catch {
      setFavorited(!nextFavorited);
      toast.error('收藏失败，请稍后重试');
    } finally {
      setFavoriting(false);
    }
  };

  const primaryButtonLabel = (() => {
    if (!isAuthenticated) return '登录后报名';
    if (!isPlayerRole) return '切换球员身份后报名';
    if (isFull) return '名额已满';
    if (deadlinePassed) return '报名已截止';
    return '立即报名';
  })();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-[#2d3748] bg-[#111827] shadow-2xl md:left-auto md:right-0 md:top-0 md:max-h-none md:max-w-md md:rounded-none md:border-l md:border-t-0">
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1 w-10 rounded-full bg-[#2d3748]" />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[#2d3748] p-4">
          <h3 className="text-lg font-bold text-[#f8fafc]">活动详情</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriting}
              title={favorited ? '取消收藏' : '收藏活动'}
              className={`p-2 transition-colors ${favorited ? 'text-[#fbbf24]' : 'text-[#94a3b8] hover:text-[#fbbf24]'}`}
            >
              {favoriting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />}
            </button>
            <button
              type="button"
              onClick={handleShare}
              title="分享活动"
              className="p-2 text-[#94a3b8] transition-colors hover:text-[#00d4ff]"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button type="button" onClick={onClose} title="关闭" className="p-2 text-[#94a3b8] transition-colors hover:text-[#f8fafc]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#2d3748]">
          <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl border border-[#2d3748] bg-[#1a2332]">
            {activity.coverImage ? (
              <img src={activity.coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Crown className="h-12 w-12 text-[#2d3748]" />
              </div>
            )}
          </div>

          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight text-[#f8fafc]">{activity.title}</h2>
            <span
              className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2">
            {activity.clubLogo && <img src={activity.clubLogo} alt="" className="h-6 w-6 rounded-full object-cover" />}
            <span className="text-sm text-[#94a3b8]">{activity.clubName || '主办俱乐部'}</span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332]">
                <MapPin className="h-4 w-4 text-[#39ff14]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">活动地点</div>
                <div>{activity.province} {activity.city} {activity.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332]">
                <Calendar className="h-4 w-4 text-[#00d4ff]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">活动时间</div>
                <div>{formatDateTime(activity.startTime)}{activity.endTime ? ` 至 ${formatDateTime(activity.endTime)}` : ''}</div>
              </div>
            </div>
            {activity.registrationDeadline && (
              <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332]">
                  <Clock className="h-4 w-4 text-[#fbbf24]" />
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">报名截止</div>
                  <div>{formatDateTime(activity.registrationDeadline)}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332]">
                <Users className="h-4 w-4 text-[#a855f7]" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#64748b]">报名人数</div>
                <div className="flex items-center gap-2">
                  <span>{activity.currentParticipants} / {activity.maxParticipants}</span>
                  <div className="h-1.5 max-w-[120px] flex-1 overflow-hidden rounded-full bg-[#2d3748]">
                    <div className="h-full rounded-full bg-[#39ff14]" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332]">
                <Phone className="h-4 w-4 text-[#ff6b35]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">联系方式</div>
                <div>{activity.contactName || '联系人'} {activity.contactPhone || '暂无'}</div>
              </div>
            </div>
          </div>

          {activity.description && (
            <div className="mb-5">
              <h4 className="mb-2 text-sm font-semibold text-[#f8fafc]">活动详情</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#94a3b8]">{activity.description}</div>
            </div>
          )}

          {(activity.requirements || hasAgeRule || hasPositionRule) && (
            <div className="mb-5 rounded-xl border border-[#2d3748] bg-[#1a2332] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#f8fafc]">
                <ShieldCheck className="h-4 w-4 text-[#39ff14]" />
                报名条件
              </div>
              <div className="space-y-1 text-sm leading-relaxed text-[#94a3b8]">
                {hasAgeRule && <div>年龄：{activity.ageMin || '不限'} - {activity.ageMax || '不限'} 岁</div>}
                {hasPositionRule && <div>位置：{activity.positions?.join('、')}</div>}
                {activity.requirements && <div className="whitespace-pre-wrap">{activity.requirements}</div>}
              </div>
            </div>
          )}

          <div className="mb-5 rounded-xl border border-[#2d3748] bg-[#1a2332] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94a3b8]">活动费用</span>
              {activity.fee > 0 ? (
                <span className="text-xl font-bold text-[#fbbf24]">¥{activity.fee}</span>
              ) : (
                <span className="text-lg font-bold text-[#39ff14]">免费</span>
              )}
            </div>
          </div>

          {result && (
            <div className={`mb-4 flex items-start gap-3 rounded-xl p-4 ${result.type === 'success' ? 'border border-green-500/30 bg-green-500/10' : 'border border-red-500/30 bg-red-500/10'}`}>
              {result.type === 'success' ? <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" /> : <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />}
              <div>
                <p className={`text-sm font-medium ${result.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{result.type === 'success' ? '报名成功' : '报名失败'}</p>
                <p className="mt-0.5 text-xs text-[#94a3b8]">{result.message}</p>
              </div>
            </div>
          )}

          {result?.type !== 'success' && (
            <div className="mb-4">
              <h4 className="mb-3 text-sm font-semibold text-[#f8fafc]">报名信息</h4>

              {!isAuthenticated ? (
                <div className="rounded-xl border border-[#2d3748] bg-[#1a2332] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#f8fafc]">
                    <LogIn className="h-4 w-4 text-[#39ff14]" />
                    登录后报名
                  </div>
                  <p className="text-sm leading-relaxed text-[#94a3b8]">登录球员账号后可提交报名，系统会把报名记录同步到个人中心。</p>
                </div>
              ) : !isPlayerRole ? (
                <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#fbbf24]">
                    <AlertCircle className="h-4 w-4" />
                    需要球员身份
                  </div>
                  <p className="text-sm leading-relaxed text-[#cbd5e1]">当前账号不是球员身份，请切换或登录球员账号后再提交活动报名。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingProfileFields.length > 0 && (
                    <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-3">
                      <div className="text-sm font-medium text-[#fbbf24]">球员资料待完善</div>
                      <div className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
                        建议补充{missingProfileFields.join('、')}，活动报名和俱乐部审核会更完整。
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/player/profile')}
                        className="mt-2 text-xs font-medium text-[#39ff14] hover:text-[#32e612]"
                      >
                        去完善资料
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs text-[#94a3b8]">球员姓名 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={registrant.playerName}
                      onChange={(e) => updateRegistrant({ playerName: e.target.value })}
                      placeholder="请输入球员姓名"
                      className="w-full rounded-lg border border-[#2d3748] bg-[#0a0e17] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-[#94a3b8]">年龄{hasAgeRule && <span className="text-red-400"> *</span>}</label>
                      <input
                        type="number"
                        min="1"
                        value={registrant.playerAge}
                        onChange={(e) => updateRegistrant({ playerAge: e.target.value })}
                        placeholder="岁"
                        className="w-full rounded-lg border border-[#2d3748] bg-[#0a0e17] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-[#39ff14] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#94a3b8]">位置{hasPositionRule && <span className="text-red-400"> *</span>}</label>
                      <select
                        value={registrant.playerPosition}
                        onChange={(e) => updateRegistrant({ playerPosition: e.target.value })}
                        className="w-full rounded-lg border border-[#2d3748] bg-[#0a0e17] px-3 py-2 text-sm text-[#f8fafc] focus:border-[#39ff14] focus:outline-none"
                      >
                        <option value="">请选择</option>
                        {positionOptions.map((position) => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#94a3b8]">联系电话 <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      value={registrant.contactPhone}
                      onChange={(e) => updateRegistrant({ contactPhone: e.target.value })}
                      placeholder="请输入家长/球员联系电话"
                      className="w-full rounded-lg border border-[#2d3748] bg-[#0a0e17] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#94a3b8]">备注</label>
                    <textarea
                      value={registrant.remark}
                      onChange={(e) => updateRegistrant({ remark: e.target.value })}
                      placeholder="如有特殊情况可在此说明"
                      className="h-20 w-full resize-none rounded-lg border border-[#2d3748] bg-[#0a0e17] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#2d3748] bg-[#111827] p-4">
          {result?.type === 'success' ? (
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-[#2d3748] py-3 font-medium text-[#f8fafc] transition-colors hover:bg-[#3d4758]">
              关闭
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              disabled={submitting || isFull || deadlinePassed || (isAuthenticated && !isPlayerRole)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#39ff14] py-3 font-medium text-[#0a0e17] transition-colors hover:bg-[#32e612] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {primaryButtonLabel}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityDetailDrawer;
