import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Heart,
  Filter,
  Grid,
  List,
  MapPin,
  Eye,
  X,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { CardGridSkeleton } from '../../components/ui/loading';
import { scoutApi, unwrapApiResponse } from '../../services/api';

interface Player {
  id: string;
  userId: number;
  name: string;
  nickname?: string;
  age: number;
  position: string;
  avatar?: string;
  team?: string;
  region: string;
  province?: string;
  city?: string;
  isFollowed: boolean;
  followDate?: string;
  notes?: string;
}

interface ScoutPlayersProps {
  onPlayerClick?: (player: Player) => void;
  onWriteReport?: (player: Player) => void;
}

const positionOptions = ['全部', '前锋', '中场', '后卫', '门将', '边锋', '前腰', '后腰', '边后卫'];
const regionOptions = ['全部', '华东', '华北', '华中', '华南', '西南', '西北', '东北'];

const ScoutPlayers: React.FC<ScoutPlayersProps> = ({ onPlayerClick, onWriteReport }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [followedPlayerIds, setFollowedPlayerIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    position: '全部',
    region: '全部',
    followedOnly: false,
  });

  // 将后端球员数据转换为组件使用的格式
  const transformPlayer = useCallback((p: any, isFollowed: boolean, followedDate?: string): Player => {
    const province = p.province || '';
    // 根据省份判断大区
    const regionMap: Record<string, string> = {
      '上海': '华东', '江苏': '华东', '浙江': '华东', '安徽': '华东', '福建': '华东', '江西': '华东', '山东': '华东',
      '北京': '华北', '天津': '华北', '河北': '华北', '山西': '华北', '内蒙古': '华北',
      '河南': '华中', '湖北': '华中', '湖南': '华中',
      '广东': '华南', '广西': '华南', '海南': '华南', '福建': '华南',
      '四川': '西南', '重庆': '西南', '贵州': '西南', '云南': '西南', '西藏': '西南',
      '陕西': '西北', '甘肃': '西北', '青海': '西北', '宁夏': '西北', '新疆': '西北',
      '辽宁': '东北', '吉林': '东北', '黑龙江': '东北',
    };
    const region = regionMap[province] || province || '其他';

    return {
      id: String(p.id),
      userId: p.user_id || p.id,
      name: p.nickname || p.name || '未知球员',
      nickname: p.nickname,
      age: p.age || 0,
      position: p.position || '未知',
      avatar: p.avatar,
      team: p.club || p.school,
      region,
      province: p.province,
      city: p.city,
      isFollowed,
      followDate: followedDate,
    };
  }, []);

  // 获取关注的球员ID列表
  const fetchFollowedPlayers = useCallback(async () => {
    try {
      const res = await scoutApi.getFollowedPlayers({ page_size: 100 });
      const body = unwrapApiResponse(res);
      if (body.success && body.data) {
        const followedIds = new Set<number>();
        (body.data.list || []).forEach((f: any) => {
          followedIds.add(f.user_id);
        });
        setFollowedPlayerIds(followedIds);
        return followedIds;
      }
    } catch (err) {
      console.error('获取关注列表失败:', err);
    }
    return new Set<number>();
  }, []);

  // 获取球员列表（搜索）
  const fetchPlayers = useCallback(async (followedIds: Set<number>) => {
    try {
      setLoading(true);
      const params: any = { page_size: 50 };
      if (searchQuery) {
        params.keyword = searchQuery;
      }
      if (filters.position !== '全部') {
        params.position = filters.position;
      }
      if (filters.region !== '全部') {
        // region 是大区，需要映射回省份搜索比较复杂，先用 keyword
      }

      const res = await scoutApi.searchPlayers(params);
      const body = unwrapApiResponse(res);
      if (body.success && body.data) {
        const transformed = (body.data.list || []).map((p: any) =>
          transformPlayer(p, followedIds.has(p.user_id || p.id))
        );
        setPlayers(transformed);
      }
    } catch (err) {
      console.error('获取球员列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.position, filters.region, transformPlayer]);

  // 初始加载
  useEffect(() => {
    const init = async () => {
      const followedIds = await fetchFollowedPlayers();
      await fetchPlayers(followedIds);
    };
    init();
  }, []);

  // 搜索时重新加载
  useEffect(() => {
    if (!loading) {
      fetchPlayers(followedPlayerIds);
    }
  }, [searchQuery]);

  // 筛选变化时重新加载
  useEffect(() => {
    if (!loading) {
      fetchPlayers(followedPlayerIds);
    }
  }, [filters.position, filters.region, filters.followedOnly]);

  // 关注/取消关注
  const toggleFollow = async (player: Player) => {
    try {
      if (player.isFollowed) {
        const res = await scoutApi.unfollowPlayer(player.userId);
        const body = unwrapApiResponse(res);
        if (!body.success) {
          toast.error(body.error?.message || '取消关注失败');
          return;
        }
        setFollowedPlayerIds(prev => {
          const next = new Set(prev);
          next.delete(player.userId);
          return next;
        });
        toast.success('已取消关注');
      } else {
        const res = await scoutApi.followPlayer(player.userId);
        const body = unwrapApiResponse(res);
        if (!body.success) {
          toast.error(body.error?.message || '关注失败');
          return;
        }
        setFollowedPlayerIds(prev => new Set(prev).add(player.userId));
        toast.success('关注成功');
      }
      // 更新本地球员状态
      setPlayers(prev => prev.map(p =>
        p.id === player.id
          ? { ...p, isFollowed: !p.isFollowed, followDate: !p.isFollowed ? new Date().toISOString().split('T')[0] : undefined }
          : p
      ));
    } catch (err: any) {
      console.error('操作失败:', err);
      toast.error(err.message || '操作失败，请重试');
    }
  };

  // 根据筛选过滤显示的球员
  const filteredPlayers = players.filter(player => {
    if (filters.followedOnly && !player.isFollowed) return false;
    if (filters.region !== '全部' && player.region !== filters.region) return false;
    return true;
  });

  const followedCount = players.filter(p => p.isFollowed).length;

  const getPotentialColor = (potential?: string) => {
    switch (potential) {
      case 'S': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'A': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'C': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-600/20 text-gray-500 border-gray-600/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">人才库</h1>
          <p className="text-slate-400 text-sm mt-1">
            已关注 {followedCount} 名球员
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              showFilters 
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <div className="flex items-center bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索球员姓名..."
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-medium">筛选条件</h3>
            <button 
              onClick={() => setFilters({ position: '全部', region: '全部', followedOnly: false })}
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              重置
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-2">位置</label>
              <select
                value={filters.position}
                onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                {positionOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-2">地区</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                {regionOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.followedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, followedOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-slate-300 text-sm">仅显示已关注</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 球员列表 */}
      {loading ? (
        <CardGridSkeleton count={6} columns={3} />
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">暂无符合条件的球员</h3>
          <p className="text-slate-400 text-sm">
            尝试调整筛选条件或前往球探地图发掘新球员
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-lg font-bold text-violet-300">
                    {player.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{player.name}</h3>
                    <p className="text-slate-400 text-xs">{player.age}岁 · {player.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(player)}
                  className={`p-2 rounded-lg transition-colors ${
                    player.isFollowed
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${player.isFollowed ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {player.region}
                </span>
                {player.team && <span className="truncate">{player.team}</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {player.age > 0 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                      {player.age}岁
                    </span>
                  )}
                  {player.position && player.position !== '未知' && (
                    <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium">
                      {player.position}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                {player.isFollowed && player.followDate && (
                  <span className="text-xs text-slate-500">
                    关注于 {player.followDate}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => onPlayerClick?.(player)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                >
                  查看
                </button>
                <button
                  onClick={() => onWriteReport?.(player)}
                  className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs rounded-lg transition-colors"
                >
                  写报告
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">球员</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">位置</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">地区</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">球队</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                        {player.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-slate-500 text-xs">{player.age}岁</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-300 text-sm">{player.position}</td>
                  <td className="px-4 py-4 text-slate-300 text-sm">{player.region}</td>
                  <td className="px-4 py-4 text-slate-300 text-sm truncate max-w-[150px]">{player.team || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleFollow(player)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          player.isFollowed
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${player.isFollowed ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onPlayerClick?.(player)}
                        className="p-1.5 text-slate-400 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onWriteReport?.(player)}
                        className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs rounded-lg transition-colors"
                      >
                        写报告
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScoutPlayers;
