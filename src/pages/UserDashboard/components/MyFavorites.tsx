import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { socialApi } from '../../../services/api';
import { Loading } from '../../../components/ui/loading';
import {
  Star,
  Trash2,
  ExternalLink,
  User,
  FileText,
  Shield,
  Search,
  Calendar,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface FavoriteItem {
  id: number;
  user_id: number;
  target_type: string;
  target_id: number;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; route: (id: number) => string }> = {
  player_homepage: {
    label: '球员主页',
    icon: <User size={16} />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    route: (id) => `/personal-homepage/${id}`,
  },
  analyst_homepage: {
    label: '分析师主页',
    icon: <FileText size={16} />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    route: (id) => `/analyst/${id}`,
  },
  coach_homepage: {
    label: '教练主页',
    icon: <Shield size={16} />,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    route: (id) => `/coach/${id}`,
  },
  scout_homepage: {
    label: '球探主页',
    icon: <Search size={16} />,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    route: (id) => `/scout/${id}`,
  },
  analyst_report: {
    label: '分析报告',
    icon: <FileText size={16} />,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    route: (id) => `/analyst/reports/${id}`,
  },
  scout_report: {
    label: '球探报告',
    icon: <Search size={16} />,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    route: (id) => `/scout/reports/${id}`,
  },
  player: {
    label: '球员',
    icon: <User size={16} />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    route: (id) => `/personal-homepage/${id}`,
  },
};

const getTypeConfig = (type: string) => {
  return typeConfig[type] || {
    label: type,
    icon: <Star size={16} />,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
    route: () => '#',
  };
};

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'player_homepage', label: '球员主页' },
  { key: 'analyst_homepage', label: '分析师主页' },
  { key: 'coach_homepage', label: '教练主页' },
  { key: 'scout_homepage', label: '球探主页' },
  { key: 'analyst_report', label: '报告' },
];

export const MyFavorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const params: { type?: string; page?: number; page_size?: number } = {
        page: 1,
        page_size: 100,
      };
      if (activeFilter !== 'all') {
        params.type = activeFilter;
      }
      const res = await socialApi.getMyFavorites(params);
      if (res.data?.success) {
        setFavorites(res.data.data?.list || []);
      } else {
        toast.error('获取收藏列表失败');
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
      toast.error('获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (item: FavoriteItem) => {
    try {
      setRemovingId(item.id);
      await socialApi.toggleFavorite({
        target_type: item.target_type,
        target_id: item.target_id,
      });
      setFavorites((prev) => prev.filter((f) => f.id !== item.id));
      toast.success('已取消收藏');
    } catch (error) {
      console.error('取消收藏失败:', error);
      toast.error('操作失败');
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading size="lg" text="加载收藏中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选标签 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 mr-1" />
        {typeFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeFilter === filter.key
                ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/30'
                : 'bg-[#1a2332] text-gray-400 border border-[#2d3748] hover:text-white hover:border-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 收藏列表 */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Star className="w-12 h-12 mb-4 text-gray-600" />
          <p className="text-lg font-medium">暂无收藏</p>
          <p className="text-sm mt-1">浏览球员、分析师、教练或球探主页时点击收藏即可添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((item) => {
            const config = getTypeConfig(item.target_type);
            return (
              <div
                key={item.id}
                className="group relative bg-[#1a2332] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14]/30 transition-all"
              >
                {/* 类型标签 */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removingId === item.id}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="取消收藏"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 内容 */}
                <div className="mb-3">
                  <p className="text-white font-medium text-sm">
                    {config.label} #{item.target_id}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                    <Calendar size={12} />
                    <span>收藏于 {formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* 操作 */}
                <Link
                  to={config.route(item.target_id)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#39ff14] hover:text-[#39ff14]/80 font-medium transition-colors"
                >
                  <ExternalLink size={12} />
                  查看详情
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
