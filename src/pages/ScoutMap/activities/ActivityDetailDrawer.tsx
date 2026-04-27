import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Clock, Users, Phone, User, CheckCircle, AlertCircle, Loader2, Crown } from 'lucide-react';
import type { ClubActivity } from './types';
import { ACTIVITY_TYPE_CONFIG } from './types';
import { clubActivityApi } from '../../../services/api';

interface Props {
  activity: ClubActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const ActivityDetailDrawer: React.FC<Props> = ({ activity, isOpen, onClose, onRegisterSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [registrant, setRegistrant] = useState({ playerName: '', playerAge: '', playerPosition: '', contactPhone: '', remark: '' });

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setRegistrant({ playerName: '', playerAge: '', playerPosition: '', contactPhone: '', remark: '' });
    }
  }, [isOpen, activity?.id]);

  if (!isOpen || !activity) return null;

  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type];
  const progress = activity.maxParticipants > 0 ? (activity.currentParticipants / activity.maxParticipants) * 100 : 0;
  const isFull = activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants;

  const handleRegister = async () => {
    if (!registrant.playerName.trim() || !registrant.contactPhone.trim()) {
      setResult({ type: 'error', message: '请填写球员姓名和联系电话' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await clubActivityApi.registerActivity(activity.clubId, activity.id, {
        player_name: registrant.playerName.trim(),
        player_age: Number(registrant.playerAge) || undefined,
        player_position: registrant.playerPosition || undefined,
        contact_phone: registrant.contactPhone.trim(),
        remark: registrant.remark.trim() || undefined,
      });
      if (res.data?.success) {
        setResult({ type: 'success', message: '报名提交成功，请等待俱乐部审核' });
        onRegisterSuccess?.();
      } else {
        setResult({ type: 'error', message: res.data?.error?.message || '报名失败' });
      }
    } catch (e: any) {
      setResult({ type: 'error', message: e?.response?.data?.error?.message || '报名失败，请检查网络' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#111827] border-l border-[#2d3748] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d3748]">
          <h3 className="text-lg font-bold text-[#f8fafc]">活动详情</h3>
          <button onClick={onClose} className="p-2 text-[#94a3b8] hover:text-[#f8fafc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#2d3748]">
          {/* Cover */}
          <div className="w-full aspect-video rounded-xl bg-[#1a2332] overflow-hidden mb-4 border border-[#2d3748]">
            {activity.coverImage ? (
              <img src={activity.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Crown className="w-12 h-12 text-[#2d3748]" />
              </div>
            )}
          </div>

          {/* Title & Type */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-[#f8fafc] leading-tight">{activity.title}</h2>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
          </div>

          {/* Club */}
          <div className="flex items-center gap-2 mb-4">
            {activity.clubLogo && <img src={activity.clubLogo} alt="" className="w-6 h-6 rounded-full object-cover" />}
            <span className="text-sm text-[#94a3b8]">{activity.clubName || '主办俱乐部'}</span>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-1 gap-3 mb-5">
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="w-8 h-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#39ff14]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">活动地点</div>
                <div>{activity.province} {activity.city} {activity.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="w-8 h-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">活动时间</div>
                <div>{formatDateTime(activity.startTime)}{activity.endTime ? ` 至 ${formatDateTime(activity.endTime)}` : ''}</div>
              </div>
            </div>
            {activity.registrationDeadline && (
              <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
                <div className="w-8 h-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#fbbf24]" />
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">报名截止</div>
                  <div>{formatDateTime(activity.registrationDeadline)}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="w-8 h-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                <Users className="w-4 h-4 text-[#a855f7]" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#64748b]">报名人数</div>
                <div className="flex items-center gap-2">
                  <span>{activity.currentParticipants} / {activity.maxParticipants}</span>
                  <div className="flex-1 h-1.5 bg-[#2d3748] rounded-full overflow-hidden max-w-[120px]">
                    <div className="h-full bg-[#39ff14] rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#cbd5e1]">
              <div className="w-8 h-8 rounded-lg bg-[#1a2332] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#ff6b35]" />
              </div>
              <div>
                <div className="text-xs text-[#64748b]">联系方式</div>
                <div>{activity.contactName || '联系人'} {activity.contactPhone || '暂无'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-[#f8fafc] mb-2">活动详情</h4>
              <div className="text-sm text-[#94a3b8] whitespace-pre-wrap leading-relaxed">{activity.description}</div>
            </div>
          )}

          {/* Requirements */}
          {activity.requirements && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-[#f8fafc] mb-2">报名条件</h4>
              <div className="text-sm text-[#94a3b8] whitespace-pre-wrap leading-relaxed">{activity.requirements}</div>
            </div>
          )}

          {/* Fee */}
          <div className="mb-5 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94a3b8]">活动费用</span>
              {activity.fee > 0 ? (
                <span className="text-xl font-bold text-[#fbbf24]">¥{activity.fee}</span>
              ) : (
                <span className="text-lg font-bold text-[#39ff14]">免费</span>
              )}
            </div>
          </div>

          {/* Registration Form */}
          {!result && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[#f8fafc] mb-3">报名信息</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">球员姓名 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={registrant.playerName}
                    onChange={(e) => setRegistrant({ ...registrant, playerName: e.target.value })}
                    placeholder="请输入球员姓名"
                    className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94a3b8] mb-1 block">年龄</label>
                    <input
                      type="number"
                      value={registrant.playerAge}
                      onChange={(e) => setRegistrant({ ...registrant, playerAge: e.target.value })}
                      placeholder="岁"
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] mb-1 block">位置</label>
                    <select
                      value={registrant.playerPosition}
                      onChange={(e) => setRegistrant({ ...registrant, playerPosition: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] focus:outline-none focus:border-[#39ff14]"
                    >
                      <option value="">请选择</option>
                      <option value="前锋">前锋</option>
                      <option value="中场">中场</option>
                      <option value="后卫">后卫</option>
                      <option value="门将">门将</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">联系电话 <span className="text-red-400">*</span></label>
                  <input
                    type="tel"
                    value={registrant.contactPhone}
                    onChange={(e) => setRegistrant({ ...registrant, contactPhone: e.target.value })}
                    placeholder="请输入家长/球员联系电话"
                    className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">备注</label>
                  <textarea
                    value={registrant.remark}
                    onChange={(e) => setRegistrant({ ...registrant, remark: e.target.value })}
                    placeholder="如有特殊情况可在此说明"
                    className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14] resize-none h-20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result message */}
          {result && (
            <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${result.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              {result.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`text-sm font-medium ${result.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{result.type === 'success' ? '报名成功' : '报名失败'}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{result.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d3748] bg-[#111827]">
          {result?.type === 'success' ? (
            <button onClick={onClose} className="w-full py-3 bg-[#2d3748] hover:bg-[#3d4758] text-[#f8fafc] rounded-xl font-medium transition-colors">
              关闭
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={submitting || isFull}
              className="w-full py-3 bg-[#39ff14] hover:bg-[#32e612] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e17] rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isFull ? '名额已满' : '立即报名'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityDetailDrawer;
