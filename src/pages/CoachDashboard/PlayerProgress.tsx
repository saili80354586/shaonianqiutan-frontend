import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, Target, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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
}

interface PlayerProgressProps {
  onBack: () => void;
}

const PlayerProgress: React.FC<PlayerProgressProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<PlayerProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProgressData | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setPlayers([
      {
        id: '1',
        name: '李明',
        position: '前锋',
        clubName: '星耀FC',
        currentRating: 85,
        previousRating: 80,
        progressHistory: [
          { date: '2024-09', rating: 72 },
          { date: '2024-10', rating: 75 },
          { date: '2024-11', rating: 78 },
          { date: '2024-12', rating: 80 },
          { date: '2025-01', rating: 82 },
          { date: '2025-02', rating: 83 },
          { date: '2025-03', rating: 85 },
        ],
        skillRadar: [
          { subject: '射门', current: 88, previous: 82, fullMark: 100 },
          { subject: '传球', current: 78, previous: 75, fullMark: 100 },
          { subject: '盘带', current: 85, previous: 80, fullMark: 100 },
          { subject: '速度', current: 90, previous: 88, fullMark: 100 },
          { subject: '力量', current: 75, previous: 72, fullMark: 100 },
          { subject: '意识', current: 80, previous: 76, fullMark: 100 },
        ],
      },
      {
        id: '2',
        name: '王强',
        position: '中场',
        clubName: '星耀FC',
        currentRating: 78,
        previousRating: 76,
        progressHistory: [
          { date: '2024-09', rating: 70 },
          { date: '2024-10', rating: 72 },
          { date: '2024-11', rating: 73 },
          { date: '2024-12', rating: 75 },
          { date: '2025-01', rating: 76 },
          { date: '2025-02', rating: 77 },
          { date: '2025-03', rating: 78 },
        ],
        skillRadar: [
          { subject: '传球', current: 85, previous: 82, fullMark: 100 },
          { subject: '控球', current: 80, previous: 78, fullMark: 100 },
          { subject: '视野', current: 82, previous: 78, fullMark: 100 },
          { subject: '跑动', current: 78, previous: 76, fullMark: 100 },
          { subject: '防守', current: 70, previous: 68, fullMark: 100 },
          { subject: '体能', current: 75, previous: 72, fullMark: 100 },
        ],
      },
      {
        id: '3',
        name: '张浩',
        position: '后卫',
        clubName: '明日之星',
        currentRating: 82,
        previousRating: 82,
        progressHistory: [
          { date: '2024-09', rating: 78 },
          { date: '2024-10', rating: 79 },
          { date: '2024-11', rating: 80 },
          { date: '2024-12', rating: 81 },
          { date: '2025-01', rating: 82 },
          { date: '2025-02', rating: 82 },
          { date: '2025-03', rating: 82 },
        ],
        skillRadar: [
          { subject: '防守', current: 88, previous: 86, fullMark: 100 },
          { subject: '头球', current: 85, previous: 84, fullMark: 100 },
          { subject: '铲球', current: 82, previous: 80, fullMark: 100 },
          { subject: '速度', current: 75, previous: 75, fullMark: 100 },
          { subject: '力量', current: 86, previous: 85, fullMark: 100 },
          { subject: '位置感', current: 84, previous: 82, fullMark: 100 },
        ],
      },
    ]);
    setLoading(false);
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProgressIndicator = (current: number, previous: number) => {
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
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">进度跟踪</h1>
              <p className="text-gray-400 mt-1">追踪关注球员的成长曲线</p>
            </div>
          </div>
        </div>

        {selectedPlayer ? (
          /* 球员详情视图 */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedPlayer(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回列表
              </button>
            </div>

            {/* 球员基本信息 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedPlayer.name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                  <p className="text-gray-400">{selectedPlayer.position} · {selectedPlayer.clubName}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getRatingColor(selectedPlayer.currentRating)}`}>{selectedPlayer.currentRating}</div>
                  <div className="text-sm text-gray-500">当前综合评分</div>
                </div>
              </div>
            </div>

            {/* 进步趋势 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">成长趋势</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={selectedPlayer.progressHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[60, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="rating" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">技能雷达</h3>
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
              </div>
            </div>

            {/* 技能详情 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">技能详情对比</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedPlayer.skillRadar.map((skill, i) => {
                  const diff = skill.current - skill.previous;
                  return (
                    <div key={i} className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">{skill.subject}</span>
                        {diff !== 0 && (
                          <span className={`text-sm ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{skill.current}</span>
                        <span className="text-sm text-gray-500 mb-1">/ 100</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${skill.current}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* 球员列表 */
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
              <div className="grid grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无关注球员</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
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
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                            {player.name[0]}
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
                          <div className={`text-3xl font-bold ${getRatingColor(player.currentRating)}`}>{player.currentRating}</div>
                          <div className="text-sm text-gray-500">综合评分</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">上次评分</div>
                          <div className="text-white font-medium">{player.previousRating}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-sm">
                        <span className="text-gray-500">{player.progressHistory.length} 次评估记录</span>
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
