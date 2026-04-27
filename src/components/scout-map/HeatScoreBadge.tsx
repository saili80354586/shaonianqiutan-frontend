import { motion } from 'framer-motion';
import { Flame, TrendingUp, Eye, Heart } from 'lucide-react';

interface HeatScoreBadgeProps {
  heatScore: number;
  likeCount?: number;
  viewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function HeatScoreBadge({
  heatScore,
  likeCount = 0,
  viewCount = 0,
  size = 'md',
  showDetails = false,
  className = '',
}: HeatScoreBadgeProps) {
  // 热度等级
  const getHeatLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 1000) return { label: '爆火', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    if (score >= 500) return { label: '热门', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    if (score >= 200) return { label: '升温', color: 'text-amber-500', bgColor: 'bg-amber-500/20' };
    if (score >= 50) return { label: '预热', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    return { label: '冷门', color: 'text-slate-500', bgColor: 'bg-slate-500/20' };
  };

  const level = getHeatLevel(heatScore);

  // 格式化热度数值
  const formatScore = (score: number): string => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}w`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toFixed(0);
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${level.bgColor} ${level.color}`}
      >
        <Flame className={`${iconSizes[size]} ${heatScore >= 200 ? 'animate-pulse' : ''}`} />
        <span className="font-bold">{formatScore(heatScore)}</span>
        {size !== 'sm' && <span className="opacity-75">{level.label}</span>}
      </motion.div>

      {showDetails && (
        <div className="flex items-center gap-2 text-xs text-slate-500 ml-1">
          <span className="flex items-center gap-0.5">
            <Heart className="w-3 h-3" />
            {likeCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {viewCount}
          </span>
        </div>
      )}
    </div>
  );
}

// 热度条形图组件
interface HeatBarProps {
  value: number;
  maxValue: number;
  label?: string;
  showValue?: boolean;
}

export function HeatBar({ value, maxValue, label, showValue = true }: HeatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          {showValue && <span className="text-slate-300 font-medium">{value}</span>}
        </div>
      )}
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
}

// 热度排名标签
interface HeatRankBadgeProps {
  rank: number;
  heatScore: number;
}

export function HeatRankBadge({ rank, heatScore }: HeatRankBadgeProps) {
  const getRankStyle = (rank: number): string => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-700/30';
    return 'bg-slate-700';
  };

  const formatScore = (score: number): string => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}w`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toFixed(0);
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${getRankStyle(rank)}`}>
        {rank <= 3 ? (
          <span>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
        ) : (
          rank
        )}
      </div>
      <div className="flex items-center gap-1 text-amber-400">
        <Flame className="w-4 h-4" />
        <span className="font-bold">{formatScore(heatScore)}</span>
      </div>
    </div>
  );
}
