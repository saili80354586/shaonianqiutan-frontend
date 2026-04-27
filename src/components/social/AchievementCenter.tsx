import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Zap, Users, TrendingUp, Lock, X, Check } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';
import type { SocialAchievementItem, AchievementCategory } from '../../types';

interface AchievementCenterProps {
  onClose?: () => void;
}

export function AchievementCenter({ onClose }: AchievementCenterProps) {
  const [achievements, setAchievements] = useState<SocialAchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<SocialAchievementItem | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadAchievements();
    }
  }, [isAuthenticated]);

  const loadAchievements = async () => {
    try {
      const res = await socialApi.getAchievements();
      setAchievements(res.data || []);
    } catch (error) {
      console.error('加载成就失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤成就
  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'all') return true;
    return a.category === filter;
  });

  // 统计
  const achievedCount = achievements.filter((a) => a.achieved).length;
  const totalCount = achievements.length;

  // 分类标签
  const categories: { key: AchievementCategory | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'contribution', label: '贡献类' },
    { key: 'engagement', label: '活跃类' },
    { key: 'social', label: '社交类' },
    { key: 'milestone', label: '里程碑' },
  ];

  // 获取成就图标
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy size={32} className="text-white" />;
      case 'medal':
        return <Medal size={32} className="text-white" />;
      case 'award':
        return <Award size={32} className="text-white" />;
      case 'star':
        return <Star size={32} className="text-white" />;
      case 'zap':
        return <Zap size={32} className="text-white" />;
      case 'users':
        return <Users size={32} className="text-white" />;
      case 'trending-up':
        return <TrendingUp size={32} className="text-white" />;
      default:
        return <Trophy size={32} className="text-white" />;
    }
  };

  // 获取成就颜色
  const getAchievementColor = (achievement: SocialAchievementItem) => {
    if (!achievement.achieved) return 'bg-gray-200';
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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">成就中心</h2>
              <p className="text-sm text-white/80">
                已获得 {achievedCount} / {totalCount} 个成就
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* 进度条 */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${(achievedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors
                ${filter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 成就列表 */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                className={`
                  flex flex-col items-center p-4 rounded-xl cursor-pointer
                  transition-all hover:scale-105 hover:shadow-md
                  ${achievement.achieved ? 'bg-gray-50' : 'bg-gray-100 opacity-70'}
                `}
              >
                {/* 徽章 */}
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${achievement.achieved ? getAchievementColor(achievement) : 'bg-gray-300'}
                    shadow-lg
                  `}
                >
                  {achievement.achieved ? (
                    getAchievementIcon(achievement.icon)
                  ) : (
                    <Lock size={24} className="text-gray-500" />
                  )}
                </div>

                {/* 名称 */}
                <p className="mt-2 text-sm font-medium text-gray-700 text-center">
                  {achievement.name}
                </p>

                {/* 状态 */}
                {achievement.achieved ? (
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500">
                    <Check size={12} />
                    <span>已获得</span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    {achievement.condition}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            {/* 徽章 */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-24 h-24 rounded-full flex items-center justify-center
                  ${selectedAchievement.achieved
                    ? getAchievementColor(selectedAchievement)
                    : 'bg-gray-300'}
                  shadow-xl
                `}
              >
                {selectedAchievement.achieved ? (
                  getAchievementIcon(selectedAchievement.icon)
                ) : (
                  <Lock size={36} className="text-gray-500" />
                )}
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {selectedAchievement.name}
              </h3>

              <p className="mt-2 text-sm text-gray-500 text-center">
                {selectedAchievement.description}
              </p>

              {/* 获得条件 */}
              <div className="w-full mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">获得条件</p>
                <p className="text-sm text-gray-700">{selectedAchievement.condition}</p>
              </div>

              {/* 获得时间 */}
              {selectedAchievement.achieved && selectedAchievement.achieved_at && (
                <div className="mt-3 text-sm text-emerald-500">
                  获得于 {formatAchievedDate(selectedAchievement.achieved_at)}
                </div>
              )}

              {/* 分类标签 */}
              <div className="mt-4">
                <span
                  className={`
                    px-3 py-1 text-xs font-medium rounded-full
                    ${selectedAchievement.category === 'contribution' ? 'bg-amber-100 text-amber-700' : ''}
                    ${selectedAchievement.category === 'engagement' ? 'bg-blue-100 text-blue-700' : ''}
                    ${selectedAchievement.category === 'social' ? 'bg-pink-100 text-pink-700' : ''}
                    ${selectedAchievement.category === 'milestone' ? 'bg-emerald-100 text-emerald-700' : ''}
                  `}
                >
                  {selectedAchievement.category === 'contribution' && '贡献类'}
                  {selectedAchievement.category === 'engagement' && '活跃类'}
                  {selectedAchievement.category === 'social' && '社交类'}
                  {selectedAchievement.category === 'milestone' && '里程碑'}
                </span>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
