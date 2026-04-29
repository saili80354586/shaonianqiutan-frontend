import React, { useState, useEffect } from 'react';
import { X as XIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi } from '../../../services/club';
import type { Player } from '../types';

interface CreateMatchModalProps {
  teamId: number;
  teamName: string;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ teamId, teamName, players, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    matchName: '',
    matchDate: new Date().toISOString().split('T')[0],
    opponent: '',
    ourScore: 0,
    oppScore: 0,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const activePlayers = players.filter(p => p.status === 'active');

  useEffect(() => {
    const ids = activePlayers.map(p => p.userId || p.id).filter((id): id is number => id !== undefined && id > 0);
    setSelectedPlayers(ids);
  }, []);

  const togglePlayer = (id: number) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const ids = activePlayers.map(p => p.userId || p.id).filter((id): id is number => id !== undefined && id > 0);
    if (selectedPlayers.length === ids.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(ids);
    }
  };

  const handleCreate = async () => {
    if (!form.matchName || !form.opponent) return;
    if (selectedPlayers.length === 0) {
      toast.warning('请选择至少一名参赛球员');
      return;
    }
    setSubmitting(true);
    try {
      await teamApi.createMatchSummary(teamId, {
        matchName: form.matchName,
        matchDate: form.matchDate,
        opponent: form.opponent,
        ourScore: form.ourScore,
        opponentScore: form.oppScore,
        playerIds: selectedPlayers,
      });
      toast.success('创建比赛成功');
      onSuccess();
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || '创建比赛失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">创建比赛</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">赛事名称</label>
            <input
              value={form.matchName}
              onChange={(e) => setForm({ ...form, matchName: e.target.value })}
              placeholder="如：2026年市青少杯小组赛"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">比赛日期</label>
            <input
              type="date"
              value={form.matchDate}
              onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">对手球队</label>
            <input
              value={form.opponent}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              placeholder="如：实验小学"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">我方进球</label>
              <input
                type="number"
                min="0"
                value={form.ourScore}
                onChange={(e) => setForm({ ...form, ourScore: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">对方进球</label>
              <input
                type="number"
                min="0"
                value={form.oppScore}
                onChange={(e) => setForm({ ...form, oppScore: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white"
              />
            </div>
          </div>
          {form.ourScore > 0 || form.oppScore > 0 ? (
            <div className="text-center p-4 bg-[#0f1419] rounded-xl">
              <span className="text-2xl font-bold text-white">
                {teamName} <span className="text-gray-500 mx-2">{form.ourScore} : {form.oppScore}</span> {form.opponent}
              </span>
              <p className="text-sm text-gray-400 mt-1">
                {form.ourScore > form.oppScore ? '胜' : form.ourScore < form.oppScore ? '负' : '平'}
              </p>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">选择参赛球员（可多选）</label>
              {activePlayers.length > 0 && (
                <button onClick={selectAll} className="text-sm text-emerald-400 hover:text-emerald-300">
                  {selectedPlayers.length === activePlayers.length ? '取消全选' : '全选'}
                </button>
              )}
            </div>
            {activePlayers.length === 0 ? (
              <div className="p-4 bg-[#0f1419] rounded-xl text-gray-500 text-sm text-center">
                该球队暂无在队球员，请先添加球员
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {activePlayers.map(p => {
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
            )}
            {selectedPlayers.length > 0 && (
              <p className="text-sm text-emerald-400 mt-2">已选择 {selectedPlayers.length} 名球员</p>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
          <button
            onClick={handleCreate}
            disabled={submitting || !form.matchName || !form.opponent || activePlayers.length === 0 || selectedPlayers.length === 0}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            创建比赛
          </button>
        </div>
      </div>
    </div>
  );
};
