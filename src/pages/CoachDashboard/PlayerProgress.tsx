import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Search, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { coachApi, teamApi } from '../../services/club';

interface ProgressActivity {
  id: string;
  type: string;
  date: string;
  title: string;
  content?: string;
  category?: string;
  rating?: number;
  status?: string;
}

interface PlayerProgressData {
  id: string;
  name: string;
  position: string;
  clubName: string;
  avatar?: string;
  currentRating: number;
  previousRating: number;
  progressHistory: { date: string; rating: number }[];
  skillRadar: { subject: string; current: number; previous: number; fullMark: number }[];
  activities: ProgressActivity[];
}

interface PlayerProgressProps {
  onBack: () => void;
}

const normalizeList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  return [];
};

const normalizeDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const formatChartDate = (value?: string) => {
  const normalized = normalizeDate(value);
  if (!normalized) return '';
  const [, month, day] = normalized.split('-');
  return month && day ? `${Number(month)}/${Number(day)}` : normalized;
};

const toScore = (rating?: number) => {
  const value = Number(rating || 0);
  if (!value) return 0;
  return Math.max(0, Math.min(100, value * 20));
};

const categoryLabel: Record<string, string> = {
  technical: '技术',
  tactical: '战术',
  physical: '体能',
  mental: '心理',
};

const PlayerProgress: React.FC<PlayerProgressProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<PlayerProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProgressData | null>(null);

  const buildPlayerProgress = useCallback(async (player: any, teamName: string): Promise<PlayerProgressData> => {
    const playerId = String(player.userId || player.user_id || player.id);
    const response = await coachApi.getPlayerProgress(Number(playerId));
    const rawActivities = normalizeList(response.data?.data?.progress);
    const activities: ProgressActivity[] = rawActivities
      .map((item: any) => ({
        id: String(item.id),
        type: item.type || 'record',
        date: normalizeDate(item.date),
        title: item.title || (item.type === 'report' ? '分析报告' : '进度记录'),
        content: item.content,
        category: item.category,
        rating: Number(item.rating || 0),
        status: item.status,
      }))
      .sort((a: ProgressActivity, b: ProgressActivity) => a.date.localeCompare(b.date));

    const ratingActivities = activities.filter(activity => activity.rating && activity.rating > 0);
    const progressHistory = ratingActivities.map(activity => ({
      date: formatChartDate(activity.date),
      rating: toScore(activity.rating),
    }));
    const currentRating = progressHistory.at(-1)?.rating || 0;
    const previousRating = progressHistory.at(-2)?.rating || currentRating;

    const radarGroups = new Map<string, number[]>();
    ratingActivities.forEach(activity => {
      const key = activity.category || 'technical';
      const values = radarGroups.get(key) || [];
      values.push(toScore(activity.rating));
      radarGroups.set(key, values);
    });
    const skillRadar = Array.from(radarGroups.entries()).map(([category, values]) => {
      const current = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      const previousValues = values.slice(0, -1);
      const previous = previousValues.length
        ? Math.round(previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length)
        : current;
      return {
        subject: categoryLabel[category] || category,
        current,
        previous,
        fullMark: 100,
      };
    });

    return {
      id: playerId,
      name: player.name || player.user?.name || '未命名球员',
      position: player.position || player.user?.position || '未设置位置',
      clubName: teamName,
      avatar: player.avatar || player.user?.avatar,
      currentRating,
      previousRating,
      progressHistory,
      skillRadar,
      activities: activities.slice().reverse(),
    };
  }, []);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const teamsRes = await teamApi.getMyTeams();
      const teams = normalizeList(teamsRes.data?.data);
      const teamPlayers = await Promise.all(
        teams.map(async (team: any) => {
          const playersRes = await teamApi.getTeamPlayers(Number(team.id));
          return normalizeList(playersRes.data?.data).map((player: any) => ({
            player,
            teamName: team.name || '未命名球队',
          }));
        })
      );

      const uniquePlayers = new Map<string, { player: any; teamName: string }>();
      teamPlayers.flat().forEach((item) => {
        const playerId = String(item.player.userId || item.player.user_id || item.player.id);
        uniquePlayers.set(playerId, item);
      });

      const progressList = await Promise.all(
        Array.from(uniquePlayers.values()).map(item => buildPlayerProgress(item.player, item.teamName))
      );
      setPlayers(progressList);
    } catch (err) {
      setError('球员进度加载失败，请稍后重试');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [buildPlayerProgress]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProgressIndicator = (current: number, previous: number) => {
    if (!current && !previous) return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/20', text: '暂无评分' };
    const diff = current - previous;
    if (diff > 0) return { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', text: `${diff}` };
    return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/20', text: '持平' };
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">进度跟踪</h1>
              <p className="text-gray-400 mt-1">追踪执教球队球员的成长记录</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {selectedPlayer ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedPlayer(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回列表
              </button>
            </div>

            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedPlayer.avatar ? <img src={selectedPlayer.avatar} alt={selectedPlayer.name} className="w-full h-full rounded-full object-cover" /> : selectedPlayer.name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                  <p className="text-gray-400">{selectedPlayer.position} · {selectedPlayer.clubName}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getRatingColor(selectedPlayer.currentRating)}`}>{selectedPlayer.currentRating || '--'}</div>
                  <div className="text-sm text-gray-500">最近训练评分</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">评分趋势</h3>
                {selectedPlayer.progressHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={selectedPlayer.progressHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="rating" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">暂无评分记录</div>
                )}
              </div>

              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">分类评分</h3>
                {selectedPlayer.skillRadar.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={selectedPlayer.skillRadar}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" />
                      <Radar name="当前" dataKey="current" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                      <Radar name="之前" dataKey="previous" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">暂无分类评分</div>
                )}
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">进度记录</h3>
              {selectedPlayer.activities.length > 0 ? (
                <div className="space-y-4">
                  {selectedPlayer.activities.map(activity => (
                    <div key={`${activity.type}-${activity.id}`} className="rounded-xl bg-gray-800/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{activity.title}</span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" /> {activity.date}
                        </span>
                      </div>
                      {activity.content && <p className="text-sm text-gray-400">{activity.content}</p>}
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                        <span>{activity.type === 'note' ? '训练笔记' : '报告记录'}</span>
                        {activity.rating ? <span>评分 {activity.rating}/5</span> : null}
                        {activity.status ? <span>状态 {activity.status}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">暂无进度记录</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜索球员姓名..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无球员进度数据</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredPlayers.map(player => {
                  const progress = getProgressIndicator(player.currentRating, player.previousRating);
                  const ProgressIcon = progress.icon;
                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 cursor-pointer hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                            {player.avatar ? <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" /> : player.name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{player.name}</h3>
                            <p className="text-gray-400 text-sm">{player.position} · {player.clubName}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${progress.bg}`}>
                          <ProgressIcon className={`w-4 h-4 ${progress.color}`} />
                          <span className={`text-sm font-medium ${progress.color}`}>{progress.text}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <div className={`text-3xl font-bold ${getRatingColor(player.currentRating)}`}>{player.currentRating || '--'}</div>
                          <div className="text-sm text-gray-500">最近训练评分</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">上次评分</div>
                          <div className="text-white font-medium">{player.previousRating || '--'}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-sm">
                        <span className="text-gray-500">{player.activities.length} 条进度记录</span>
                        <span className="text-orange-400 flex items-center gap-1">
                          查看详情 <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerProgress;
