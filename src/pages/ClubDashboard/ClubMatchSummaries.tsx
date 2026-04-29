import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, ChevronRight, Loader2, Shield, Clock, CheckCircle } from 'lucide-react';
import { clubApi } from '../../services/club';
import { CardGridSkeleton } from '../../components/ui/loading';

interface TeamStat {
  teamId: number;
  teamName: string;
  total: number;
  pending: number;
  playerSubmitted: number;
  completed: number;
}

interface ClubMatchSummariesProps {
  onBack: () => void;
  onViewTeam?: (teamId: number) => void;
}

const ClubMatchSummaries: React.FC<ClubMatchSummariesProps> = ({ onBack, onViewTeam }) => {
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [clubTotal, setClubTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clubApi.getMatchSummaryStats();
      if (res.data?.success) {
        setStats(res.data.data?.teams || []);
        setClubTotal(res.data.data?.clubTotal || 0);
      } else {
        setError(res.data?.message || '加载失败');
      }
    } catch (err) {
      console.error('加载比赛汇总统计失败:', err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = stats.reduce((sum, s) => sum + s.pending, 0);
  const totalPlayerSubmitted = stats.reduce((sum, s) => sum + s.playerSubmitted, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completed, 0);

  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">比赛汇总</h1>
          <p className="text-gray-400 mt-1">一览所有球队的比赛总结情况</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-gray-400">总比赛数</span>
          </div>
          <div className="text-3xl font-bold text-white">{clubTotal}</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-gray-400">待自评</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalPending}</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400">待点评</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalPlayerSubmitted}</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400">已完成</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalCompleted}</div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadStats} className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline">
            点击重试
          </button>
        </div>
      )}

      {/* 球队列表 */}
      {loading ? (
        <CardGridSkeleton count={3} columns={1} />
      ) : stats.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">暂无任何比赛记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map(team => (
            <div
              key={team.teamId}
              onClick={() => onViewTeam?.(team.teamId)}
              className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{team.teamName}</h3>
                    <p className="text-sm text-gray-400">共 {team.total} 场比赛</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="text-sm">管理比赛</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{team.total}</div>
                  <div className="text-xs text-gray-500 mt-1">总比赛</div>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{team.pending}</div>
                  <div className="text-xs text-gray-500 mt-1">待自评</div>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{team.playerSubmitted}</div>
                  <div className="text-xs text-gray-500 mt-1">待点评</div>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{team.completed}</div>
                  <div className="text-xs text-gray-500 mt-1">已完成</div>
                </div>
              </div>

              {/* 进度条 */}
              {team.total > 0 && (
                <div className="mt-4">
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                    <div
                      className="bg-amber-500"
                      style={{ width: `${(team.pending / team.total) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(team.playerSubmitted / team.total) * 100}%` }}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${(team.completed / team.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 待自评</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 待点评</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 已完成</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubMatchSummaries;
