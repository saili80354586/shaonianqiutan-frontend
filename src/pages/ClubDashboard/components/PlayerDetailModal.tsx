import React from 'react';
import { X as XIcon } from 'lucide-react';
import { getAgeGroup, getAgeGroupInfo } from '../TeamManagement';
import type { Player } from '../types';

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose }) => {
  const ageGroup = getAgeGroup(new Date(player.birthDate).getFullYear());
  const ageGroupInfo = getAgeGroupInfo(ageGroup);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl border border-gray-700">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {player.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{player.name}</h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm">{ageGroup}</span>
              </div>
              <p className="text-gray-400">{player.age}岁 · {player.gender === 'male' ? '男' : '女'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">出生日期</div>
                <div className="text-white">{player.birthDate}</div>
              </div>
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">年龄组</div>
                <div className="text-white">{ageGroupInfo.label} ({ageGroupInfo.ageRange})</div>
              </div>
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">擅长位置</div>
                <div className="text-white">{player.position}</div>
              </div>
              <div className="bg-[#0f1419] rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">球衣号码</div>
                <div className="text-white">#{player.jerseyNumber}</div>
              </div>
            </div>
          </div>

          {player.isRegistered && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">联系信息</h3>
              <div className="grid grid-cols-2 gap-4">
                {player.phone && (
                  <div className="bg-[#0f1419] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">联系电话</div>
                    <div className="text-white">{player.phone}</div>
                  </div>
                )}
                {player.parentName && (
                  <div className="bg-[#0f1419] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">监护人</div>
                    <div className="text-white">{player.parentName}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">训练数据</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{player.reportCount}</div>
                <div className="text-xs text-gray-500">分析报告</div>
              </div>
              <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{player.avgScore || '-'}</div>
                <div className="text-xs text-gray-500">综合评分</div>
              </div>
              <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{player.joinDate}</div>
                <div className="text-xs text-gray-500">入队时间</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex items-center justify-end gap-3">
          <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl">
            编辑资料
          </button>
          <button className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl">
            查看报告
          </button>
        </div>
      </div>
    </div>
  );
};
