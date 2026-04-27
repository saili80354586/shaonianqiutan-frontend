import React, { useState } from 'react';
import { X as XIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi } from '../../../services/club';
import { AGE_GROUPS } from '../TeamManagement';

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  description?: string;
}

interface TeamSettingModalProps {
  teamId: number;
  team: Team | null;
  onClose: () => void;
  onSaved: (updated: Team) => void;
}

export const TeamSettingModal: React.FC<TeamSettingModalProps> = ({ teamId, team, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: team?.name || '',
    ageGroup: team?.ageGroup || '',
    description: team?.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await teamApi.updateTeam(teamId, {
        name: form.name,
        ageGroup: form.ageGroup,
        description: form.description,
      });
      if (res.data?.success) {
        onSaved({
          ...team!,
          name: form.name,
          ageGroup: form.ageGroup,
          description: form.description,
        });
        onClose();
      } else {
        toast.error(res.data?.error?.message || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">编辑球队信息</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">球队名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如 U12一队"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">年龄组</label>
            <select
              value={form.ageGroup}
              onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">请选择年龄组</option>
              {AGE_GROUPS.map(g => (
                <option key={g.code} value={g.code}>{g.label} ({g.ageRange})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">球队描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="球队介绍、历史、训练理念等..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
