import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, BarChart3, TrendingUp, Star, Trophy } from 'lucide-react';
import type { Player } from './types';
import { POSITIONS } from './types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PlayerCompareProps {
  players: Player[];
  onRemovePlayer: (playerId: string) => void;
  onClearAll: () => void;
}

export function PlayerCompare({
  players,
  onRemovePlayer,
  onClearAll,
}: PlayerCompareProps) {
  const maxPlayers = 4;

  // 计算对比数据
  const compareData = useMemo(() => {
    if (players.length < 2) return null;

    // 计算各维度最大值用于归一化
    const maxScore = Math.max(...players.map((p) => p.score || 0));
    const maxHeight = Math.max(...players.map((p) => p.height || 0));
    const maxWeight = Math.max(...players.map((p) => p.weight || 0));
    const maxHeat = Math.max(...players.map((p) => p.heatScore || 0));

    // 雷达图数据
    const radarData = [
      {
        subject: '评分',
        ...Object.fromEntries(players.map((p, i) => [`p${i + 1}`, Math.round(((p.score || 0) / maxScore) * 100)])),
      },
      {
        subject: '身高',
        ...Object.fromEntries(players.map((p, i) => [`p${i + 1}`, Math.round(((p.height || 0) / maxHeight) * 100)])),
      },
      {
        subject: '体重',
        ...Object.fromEntries(players.map((p, i) => [`p${i + 1}`, Math.round(((p.weight || 0) / maxWeight) * 100)])),
      },
      {
        subject: '热度',
        ...Object.fromEntries(players.map((p, i) => [`p${i + 1}`, Math.round(((p.heatScore || 0) / maxHeat) * 100)])),
      },
    ];

    return {
      radarData,
      maxScore,
      players: players.map((p, i) => ({
        ...p,
        index: i + 1,
        normalizedScore: Math.round(((p.score || 0) / maxScore) * 100),
        normalizedHeight: Math.round(((p.height || 0) / maxHeight) * 100),
        normalizedWeight: Math.round(((p.weight || 0) / maxWeight) * 100),
        normalizedHeat: Math.round(((p.heatScore || 0) / maxHeat) * 100),
      })),
    };
  }, [players]);

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100">球员对比</h3>
          <Badge variant="outline" className="border-slate-600 text-slate-400">
            {players.length}/{maxPlayers}
          </Badge>
        </div>
        {players.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-red-400"
            onClick={onClearAll}
          >
            <X className="w-4 h-4 mr-1" />
            清除全部
          </Button>
        )}
      </div>

      {/* 对比卡片 */}
      {players.length >= 2 && compareData ? (
        <div className="space-y-4">
          {/* 球员头像行 */}
          <div className="flex gap-4 justify-center">
            {compareData.players.map((p, i) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.avatar}
                  alt={p.nickname}
                  className={`w-16 h-16 rounded-xl border-2 object-cover transition-colors`}
                  style={{ borderColor: colors[i] }}
                />
                <button
                  onClick={() => onRemovePlayer(p.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-0.5 rounded text-xs font-medium text-slate-200 whitespace-nowrap">
                  {p.nickname}
                </div>
              </div>
            ))}
          </div>

          {/* 雷达图 */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              能力对比
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={compareData.radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                {players.map((_, i) => (
                  <Radar
                    key={i}
                    name={`球员${i + 1}`}
                    dataKey={`p${i + 1}`}
                    stroke={colors[i]}
                    fill={colors[i]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 详细对比表 */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              详细数据
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 px-3 font-medium">维度</th>
                    {compareData.players.map((p, i) => (
                      <th key={p.id} className="text-center py-2 px-3 font-medium" style={{ color: colors[i] }}>
                        {p.nickname}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">综合评分</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3 font-semibold">
                        {p.score}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">年龄</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3">
                        {p.age || '-'}岁
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">身高</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3">
                        {p.height || '-'}cm
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">体重</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3">
                        {p.weight || '-'}kg
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">惯用脚</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3">
                        {p.foot || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300 border-b border-slate-700/30">
                    <td className="py-2 px-3">位置</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3">
                        {p.position ? POSITIONS.find((pos) => pos.value === p.position)?.label : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2 px-3">热度</td>
                    {compareData.players.map((p) => (
                      <td key={p.id} className="text-center py-2 px-3 text-amber-400">
                        {p.heatScore?.toFixed(0) || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Trophy className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">
            {players.length === 0
              ? '选择球员开始对比'
              : players.length === 1
              ? '请再选择至少一名球员'
              : '选择球员开始对比'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            最多支持 {maxPlayers} 名球员同时对比
          </p>
        </div>
      )}
    </div>
  );
}

// 球员对比选择器
interface CompareSelectorProps {
  players: Player[];
  selectedPlayers: Player[];
  onTogglePlayer: (player: Player) => void;
  maxSelect?: number;
}

export function CompareSelector({
  players,
  selectedPlayers,
  onTogglePlayer,
  maxSelect = 4,
}: CompareSelectorProps) {
  const selectedIds = new Set(selectedPlayers.map((p) => p.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          已选择 {selectedPlayers.length}/{maxSelect}
        </span>
        {selectedPlayers.length >= 2 && (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            可对比
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {players.map((player) => {
          const isSelected = selectedIds.has(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onTogglePlayer(player)}
              disabled={!isSelected && selectedPlayers.length >= maxSelect}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <img
                src={player.avatar}
                alt={player.nickname}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-sm text-slate-200 truncate flex-1 text-left">
                {player.nickname}
              </span>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
