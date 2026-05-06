import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Star, Heart, Eye, FileText, ChevronRight, MoreVertical, X } from 'lucide-react';
import { coachApi } from '../../services/club';

interface Player {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  position: string;
  clubName: string;
  reportCount: number;
  lastReportDate?: string;
  overallRating: number;
  isStarred: boolean;
  technicalScore: number;
  physicalScore: number;
  tacticalScore: number;
  notes?: string;
}

interface FollowedPlayersProps {
  onBack: () => void;
}

const normalizeList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  return [];
};

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeGender = (gender: unknown): 'male' | 'female' => {
  return gender === 'female' || gender === '女' ? 'female' : 'male';
};

const FollowedPlayers: React.FC<FollowedPlayersProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await coachApi.getFollowedPlayers({ page: 1, pageSize: 100 });
      const list = normalizeList(response.data?.data);
      const mapped = list.map((p: any) => ({
        id: String(p.userId ?? p.user_id ?? p.id),
        name: p.name || p.playerName || '未命名球员',
        age: toNumber(p.age),
        gender: normalizeGender(p.gender),
        position: p.positionName || p.position || '未设置',
        clubName: p.clubName || p.club_name || p.club || '未知俱乐部',
        reportCount: toNumber(p.reportCount ?? p.report_count),
        lastReportDate: p.lastReportDate ?? p.last_report_date ?? undefined,
        overallRating: toNumber(p.overallRating ?? p.overall_rating),
        isStarred: Boolean(p.isStarred ?? p.is_starred),
        technicalScore: toNumber(p.technicalScore ?? p.technical_score),
        physicalScore: toNumber(p.physicalScore ?? p.physical_score),
        tacticalScore: toNumber(p.tacticalScore ?? p.tactical_score),
        notes: p.notes || '',
      }));
      setPlayers(mapped.filter(p => p.id && p.id !== 'undefined' && p.id !== 'null'));
    } catch (err) {
      console.error('加载关注球员失败:', err);
      setError('关注球员加载失败，请稍后重试');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const nextStarred = !player.isStarred;
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isStarred: nextStarred } : p));
    setError('');

    try {
      await coachApi.updateFollowNotes(Number(playerId), {
        notes: player.notes || '',
        isStarred: nextStarred,
      });
    } catch (err) {
      console.error('更新关注星标失败:', err);
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isStarred: player.isStarred } : p));
      setError('星标更新失败，请稍后重试');
    }
  };

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.clubName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPosition = positionFilter === 'all' || p.position === positionFilter;
    const matchStarred = !showOnlyStarred || p.isStarred;
    return matchSearch && matchPosition && matchStarred;
  });

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = {
      '前锋': 'bg-red-500/20 text-red-300',
      '中场': 'bg-blue-500/20 text-blue-300',
      '后卫': 'bg-green-500/20 text-green-300',
      '门将': 'bg-yellow-500/20 text-yellow-300',
    };
    return map[pos] || 'bg-gray-500/20 text-gray-300';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'text-emerald-400';
    if (rating >= 75) return 'text-blue-400';
    if (rating >= 65) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">关注球员</h1>
              <p className="text-gray-400 mt-1">共关注 {players.length} 名球员</p>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球员姓名或俱乐部..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
            <option value="all">所有位置</option>
            <option value="前锋">前锋</option>
            <option value="中场">中场</option>
            <option value="后卫">后卫</option>
            <option value="门将">门将</option>
          </select>
          <button 
            onClick={() => setShowOnlyStarred(!showOnlyStarred)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${showOnlyStarred ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-[#1a1f2e] border border-gray-700 text-gray-400'}`}
          >
            <Star className={`w-4 h-4 ${showOnlyStarred ? 'fill-amber-400' : ''}`} /> 只看星标
          </button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">{error}</div>}

        {/* 球员网格 */}
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">暂无符合条件的球员</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filteredPlayers.map(player => (
              <div key={player.id} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                        {player.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-lg">{player.name}</span>
                          <button onClick={() => toggleStar(player.id)} className="text-gray-600 hover:text-amber-400 transition-colors">
                            <Star className={`w-5 h-5 ${player.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getPositionColor(player.position)}`}>{player.position}</span>
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${getRatingColor(player.overallRating)}`}>{player.overallRating}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-emerald-400 font-semibold">{player.technicalScore}</div>
                      <div className="text-xs text-gray-500">技术</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-blue-400 font-semibold">{player.physicalScore}</div>
                      <div className="text-xs text-gray-500">身体</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-purple-400 font-semibold">{player.tacticalScore}</div>
                      <div className="text-xs text-gray-500">战术</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>所属俱乐部</span>
                      <span className="text-white">{player.clubName}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>年龄/性别</span>
                      <span className="text-white">{player.age}岁 · {player.gender === 'male' ? '男' : '女'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>分析报告</span>
                      <span className="text-white">{player.reportCount} 份</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>最近报告</span>
                      <span className="text-white">{player.lastReportDate || '无'}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-800 flex gap-2">
                  <button onClick={() => setSelectedPlayer(player)} className="flex-1 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors">
                    查看详情
                  </button>
                  <button className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                    查看报告
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowedPlayers;
