import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Zap, Users, TrendingUp } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';
import type { SocialAchievementItem, AchievementCategory } from '../../types';

interface AchievementBadgeProps {
  achievement: SocialAchievementItem;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showName = false,
  showProgress = false,
  onClick,
}: AchievementBadgeProps) {
  const { achieved, achieved_at } = achievement;

  const sizeConfig = {
    sm: { icon: 20, wrapper: 'w-8 h-8', text: 'text-xs' },
    md: { icon: 28, wrapper: 'w-12 h-12', text: 'text-sm' },
    lg: { icon: 40, wrapper: 'w-16 h-16', text: 'text-base' },
  };

  const { icon, wrapper, text } = sizeConfig[size];

  // 获取成就图标
  const getAchievementIcon = () => {
    const iconProps = { size: icon, className: 'text-white' };
    switch (achievement.icon) {
      case 'trophy':
        return <Trophy {...iconProps} />;
      case 'medal':
        return <Medal {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  // 获取成就颜色
  const getAchievementColor = () => {
    if (!achieved) return 'bg-gray-300';
    switch (achievement.category) {
      case 'contribution':
        return 'bg-gradient-to-br from-amber-400 to-orange-500';
      case 'engagement':
        return 'bg-gradient-to-br from-blue-400 to-purple-500';
      case 'social':
        return 'bg-gradient-to-br from-pink-400 to-rose-500';
      case 'milestone':
        return 'bg-gradient-to-br from-emerald-400 to-teal-500';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
  };

  // 格式化获得时间
  const formatAchievedDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`
        flex flex-col items-center gap-1.5 cursor-pointer group
        ${onClick ? 'hover:scale-105 transition-transform' : ''}
      `}
      onClick={onClick}
    >
      {/* 徽章 */}
      <div
        className={`
          ${wrapper} rounded-full flex items-center justify-center
          ${achieved ? getAchievementColor() : 'bg-gray-200 opacity-50'}
          shadow-lg group-hover:shadow-xl transition-shadow
        `}
      >
        {getAchievementIcon()}
      </div>

      {/* 名称 */}
      {showName && (
        <div className="text-center">
          <p className={`${text} font-medium text-gray-700 group-hover:text-gray-900`}>
            {achievement.name}
          </p>
          {achieved && achieved_at && (
            <p className="text-xs text-gray-400">
              {formatAchievedDate(achieved_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface AchievementBadgeListProps {
  achievements: SocialAchievementItem[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadgeList({
  achievements,
  maxDisplay = 5,
  size = 'sm',
}: AchievementBadgeListProps) {
  // 已获得的成就优先显示
  const achievedList = achievements.filter((a) => a.achieved);
  const displayList = achievedList.slice(0, maxDisplay);
  const remaining = achievedList.length - maxDisplay;

  if (displayList.length === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <Trophy size={16} />
        <span>暂无成就</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayList.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size={size}
          />
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-gray-400">+{remaining}</span>
      )}
    </div>
  );
}
