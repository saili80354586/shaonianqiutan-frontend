import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, MapPin, Heart, Star, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Player } from './types';
import { POSITIONS } from './types';

interface PlayerCardProps {
  player: Player;
  index: number;
  isMember: boolean;
  isFavorite: boolean;
  onFavoriteToggle: (playerId: string) => void;
  onClick: (player: Player) => void;
}

// 根据评分获取颜色
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-red-400';
  if (score >= 80) return 'text-orange-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-slate-400';
};

// 根据评分获取背景色
const getScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-red-500/10 border-red-500/30';
  if (score >= 80) return 'bg-orange-500/10 border-orange-500/30';
  if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-slate-500/10 border-slate-500/30';
};

export function PlayerCard({
  player,
  index,
  isMember,
  isFavorite,
  onFavoriteToggle,
  onClick,
}: PlayerCardProps) {
  const score = player.score || 0;
  const scoreColor = getScoreColor(score);
  const scoreBgColor = getScoreBgColor(score);

  // 获取位置信息（支持中国和海外）
  const getLocationText = () => {
    if (player.location.type === 'china') {
      return `${(player.location as any).province} · ${(player.location as any).city}`;
    }
    return `${(player.location as any).country} · ${(player.location as any).city}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className="overflow-hidden transition-all duration-300 cursor-pointer border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 group"
        onClick={() => onClick(player)}
      >
        <div className="relative">
          {/* 收藏按钮 */}
          {isMember && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(player.id);
              }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 hover:border-red-500/50 transition-all"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
              />
            </motion.button>
          )}

          <div className="flex items-center p-4 gap-4">
            {/* 头像 */}
            <div className="relative">
              <img
                src={player.avatar}
                alt={player.nickname}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-600 group-hover:border-emerald-500/50 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {index + 1}
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">{player.nickname}</h4>
                {isMember && (
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                )}
              </div>

              {/* 评分显示（所有用户可见） */}
              {score > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${scoreBgColor}`}>
                    <Star className={`w-3 h-3 ${scoreColor} fill-current`} />
                    <span className={`text-sm font-bold ${scoreColor}`}>{score}</span>
                  </div>
                  <span className="text-xs text-slate-500">分</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{getLocationText()}</span>
              </div>

              {/* 会员可见信息 */}
              {isMember && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {player.position && (
                    <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                      {POSITIONS.find(p => p.value === player.position)?.label || player.position}
                    </Badge>
                  )}
                  {player.age && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      {player.age}岁
                    </Badge>
                  )}
                </div>
              )}

              {/* 技能标签（所有用户可见） */}
              {player.skillTags && player.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {player.skillTags.slice(0, 3).map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {player.skillTags.length > 3 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-500">
                      +{player.skillTags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* 热度指数（所有用户可见） */}
              {player.heatScore !== undefined && player.heatScore > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      {player.heatScore.toFixed(0)}
                    </span>
                  </div>
                  {player.likeCount !== undefined && player.likeCount > 0 && (
                    <span className="text-xs text-slate-500">
                      {player.likeCount} 赞
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 非会员遮罩提示 */}
          {!isMember && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700/50 shadow-lg">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>开通会员查看更多信息</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
