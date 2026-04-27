import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, MapPin, TrendingUp } from 'lucide-react';
import type { Player, RankingType } from './types';
import { POSITIONS } from './types';
import { HeatScoreBadge, HeatRankBadge } from './HeatScoreBadge';

interface RankingListProps {
  players: Player[];
  rankingType: RankingType;
  period?: 'week' | 'month' | 'all';
  maxDisplay?: number;
  onPlayerClick?: (player: Player) => void;
}

export function RankingList({
  players,
  rankingType,
  period = 'all',
  maxDisplay = 10,
  onPlayerClick,
}: RankingListProps) {
  const [showAll, setShowAll] = useState(false);

  // 根据排名类型排序
  const sortedPlayers = useMemo(() => {
    const sorted = [...players];
    switch (rankingType) {
      case 'score':
        return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
      case 'heat':
        return sorted.sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
      case 'potential':
        // 潜力榜：按年龄降权，年龄小优先
        return sorted.sort((a, b) => {
          const scoreA = (a.score || 0) + (a.age ? (18 - a.age) * 2 : 0);
          const scoreB = (b.score || 0) + (b.age ? (18 - b.age) * 2 : 0);
          return scoreB - scoreA;
        });
      case 'region':
      default:
        return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }, [players, rankingType]);

  const displayPlayers = showAll ? sortedPlayers : sortedPlayers.slice(0, maxDisplay);

  // 排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  // 排名类型配置
  const rankingConfig: Record<RankingType, { icon: React.ReactNode; label: string; color: string }> = {
    score: { icon: <Star className="w-4 h-4" />, label: '评分', color: 'text-amber-400' },
    heat: { icon: <Flame className="w-4 h-4" />, label: '热度', color: 'text-orange-400' },
    potential: { icon: <TrendingUp className="w-4 h-4" />, label: '潜力', color: 'text-emerald-400' },
    region: { icon: <MapPin className="w-4 h-4" />, label: '地区', color: 'text-blue-400' },
  };

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${rankingConfig[rankingType].color}`}>
          {rankingConfig[rankingType].icon}
          <span className="font-semibold text-sm">{rankingConfig[rankingType].label}榜</span>
        </div>
        {period !== 'all' && (
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
            {period === 'week' ? '本周' : '本月'}
          </Badge>
        )}
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {displayPlayers.map((player, index) => {
            const rank = index + 1;
            const location = player.location;
            const isOverseas = location.type === 'overseas';
            const locationText = isOverseas
              ? `${(location as any).country} · ${(location as any).city}`
              : `${(location as any).province} · ${(location as any).city}`;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onPlayerClick?.(player)}
                className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                {/* 排名 */}
                <div className="w-8 flex-shrink-0">
                  {getRankIcon(rank) ? (
                    <span className="text-xl">{getRankIcon(rank)}</span>
                  ) : (
                    <span className="text-sm font-medium text-slate-500">{rank}</span>
                  )}
                </div>

                {/* 头像 */}
                <img
                  src={player.avatar}
                  alt={player.nickname}
                  className="w-10 h-10 rounded-lg object-cover border-2 border-slate-700 group-hover:border-slate-500 transition-colors"
                />

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 group-hover:text-white truncate">
                      {player.nickname}
                    </span>
                    {player.score && rankingType === 'score' && (
                      <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 shrink-0">
                        <Star className="w-3 h-3 mr-0.5 fill-amber-400" />
                        {player.score}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>{locationText}</span>
                    {player.position && (
                      <>
                        <span>·</span>
                        <span>{POSITIONS.find(p => p.value === player.position)?.label}</span>
                      </>
                    )}
                    {player.age && (
                      <>
                        <span>·</span>
                        <span>U{18 - player.age}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 热度/评分 */}
                <div className="flex-shrink-0">
                  {rankingType === 'heat' ? (
                    <HeatScoreBadge heatScore={player.heatScore || 0} size="sm" />
                  ) : rankingType === 'potential' ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        {Math.round((player.score || 0) + ((player.age ? 18 - player.age : 0) * 2))}
                      </span>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 查看更多 */}
      {sortedPlayers.length > maxDisplay && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          {showAll ? '收起' : `查看更多 (${sortedPlayers.length - maxDisplay})`}
        </button>
      )}
    </div>
  );
}

// 排行榜 Tab 切换组件
interface RankingTabsProps {
  activeTab: RankingType;
  onTabChange: (tab: RankingType) => void;
}

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  const tabs: { key: RankingType; label: string; icon: React.ReactNode }[] = [
    { key: 'score', label: '评分', icon: <Star className="w-4 h-4" /> },
    { key: 'heat', label: '热度', icon: <Flame className="w-4 h-4" /> },
    { key: 'potential', label: '潜力', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.key
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
