import React, { useState } from 'react';
import { X as XIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi } from '../../../services/club';
import type { Player } from '../types';

interface CreateWeeklyModalProps {
  teamId: number;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateWeeklyModal: React.FC<CreateWeeklyModalProps> = ({ teamId, players, onClose, onSuccess }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  });
  const [weekEnd, setWeekEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 7);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);

  const togglePlayer = (id: number) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const ids = players.map(p => p.userId || p.id).filter((id): id is number => id !== undefined && id > 0);
    if (selectedPlayers.length === ids.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(ids);
    }
  };

  const handleCreate = async () => {
    if (selectedPlayers.length === 0) {
      toast.warning('请选择至少一名球员');
      return;
    }
    setSubmitting(true);
    try {
      const res = await teamApi.createWeeklyReport(teamId, {
        playerIds: selectedPlayers,
        weekStart,
        weekEnd,
      });
      if (res.data?.success) {
        toast.success(`成功发起 ${res.data.data?.created || selectedPlayers.length} 份周报！`);
        onSuccess();
      } else {
        toast.error(res.data?.error?.message || '创建失败');
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">发起周报</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">选择球员（可多选）</label>
              <button onClick={selectAll} className="text-sm text-emerald-400 hover:text-emerald-300">
                {selectedPlayers.length === players.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {players.map(p => {
                const pid = p.userId || p.id;
                return (
                  <label key={pid} className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-xl cursor-pointer hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(pid!)}
                      onChange={() => togglePlayer(pid!)}
                      className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-white">{p.name}</span>
                    <span className="text-gray-400 text-sm">· {p.position}</span>
                  </label>
                );
              })}
            </div>
            {selectedPlayers.length > 0 && (
              <p className="text-sm text-emerald-400 mt-2">已选择 {selectedPlayers.length} 名球员</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">周开始日期</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">周结束日期</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white"
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
          <button
            onClick={handleCreate}
            disabled={submitting || selectedPlayers.length === 0}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            发起周报 {selectedPlayers.length > 0 && `(${selectedPlayers.length}人)`}
          </button>
        </div>
      </div>
    </div>
  );
};
