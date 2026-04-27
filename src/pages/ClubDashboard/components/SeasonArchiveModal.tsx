import React, { useState } from 'react';
import { X as XIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi } from '../../../services/api';

interface SeasonArchive {
  id?: number;
  seasonName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface SeasonArchiveModalProps {
  teamId: number;
  editingArchive: SeasonArchive | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SeasonArchiveModal: React.FC<SeasonArchiveModalProps> = ({ teamId, editingArchive, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    seasonName: editingArchive?.seasonName || '',
    startDate: editingArchive?.startDate || '',
    endDate: editingArchive?.endDate || '',
    description: editingArchive?.description || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.seasonName.trim()) {
      toast.error('请输入赛季名称');
      return;
    }
    setSubmitting(true);
    try {
      if (editingArchive?.id) {
        await clubApi.updateTeamSeasonArchive(teamId, editingArchive.id, {
          seasonName: form.seasonName.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description,
        });
        toast.success('更新成功');
      } else {
        await clubApi.createTeamSeasonArchive(teamId, {
          seasonName: form.seasonName.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description,
        });
        toast.success('创建成功');
      }
      onClose();
      onSuccess();
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {editingArchive ? '编辑赛季档案' : '新建赛季档案'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">赛季名称</label>
            <input
              type="text"
              value={form.seasonName}
              onChange={(e) => setForm({ ...form, seasonName: e.target.value })}
              placeholder="如 2025秋季赛季"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">开始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">结束日期</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">赛季描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="赛季目标、主要成绩、难忘时刻等..."
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
            onClick={handleSubmit}
            disabled={submitting || !form.seasonName.trim()}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingArchive ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
};
