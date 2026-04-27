import React, { useState } from 'react';
import { X, Send, MapPin, Calendar, Clock, User, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { trialApi } from '../../services/api';

interface TrialInviteModalProps {
  playerId: number;
  playerName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TrialInviteModal: React.FC<TrialInviteModalProps> = ({ playerId, playerName, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    trialDate: '',
    trialTime: '',
    location: '',
    contactName: '',
    contactPhone: '',
    note: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trialDate || !form.location || !form.contactName || !form.contactPhone) {
      toast.error('请填写必填项');
      return;
    }
    setSending(true);
    try {
      const res = await trialApi.sendInvite({
        player_id: playerId,
        trial_date: form.trialDate,
        trial_time: form.trialTime || undefined,
        location: form.location,
        contact_name: form.contactName,
        contact_phone: form.contactPhone,
        note: form.note || undefined,
      });
      if (res.data?.success) {
        toast.success('试训邀请已发送');
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.message || '发送失败');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-[#2d3748] rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3748]">
          <h3 className="text-lg font-semibold text-[#f8fafc]">发送试训邀请</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1a2332] transition-colors"><X className="w-5 h-5 text-[#94a3b8]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-sm text-[#94a3b8] mb-2">向 <span className="text-[#39ff14] font-medium">{playerName}</span> 发送试训邀请</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><Calendar className="w-3.5 h-3.5" />试训日期 <span className="text-red-400">*</span></label>
              <input type="date" required value={form.trialDate} onChange={(e) => setForm({ ...form, trialDate: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] focus:outline-none focus:border-[#39ff14]" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><Clock className="w-3.5 h-3.5" />试训时间</label>
              <input type="time" value={form.trialTime} onChange={(e) => setForm({ ...form, trialTime: e.target.value })} className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] focus:outline-none focus:border-[#39ff14]" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><MapPin className="w-3.5 h-3.5" />试训地点 <span className="text-red-400">*</span></label>
            <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="请输入试训地点" className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><User className="w-3.5 h-3.5" />联系人 <span className="text-red-400">*</span></label>
              <input type="text" required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="联系人姓名" className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><Phone className="w-3.5 h-3.5" />联系电话 <span className="text-red-400">*</span></label>
              <input type="tel" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="联系电话" className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm text-[#94a3b8] mb-1.5"><FileText className="w-3.5 h-3.5" />备注</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="补充说明（如携带物品、着装要求等）" rows={3} className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2d3748] rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14] resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1a2332] transition-colors">取消</button>
            <button type="submit" disabled={sending} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-[#39ff14] text-[#0a0e17] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              <Send className="w-4 h-4" />{sending ? '发送中...' : '发送邀请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
