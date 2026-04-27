import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, Video, Image as ImageIcon,
  Edit, CheckCircle, Clock, AlertCircle, Star, FileText, MoreVertical
} from 'lucide-react';
import type { MatchSummary, MatchStatus, MatchResult } from '@/services/matchApi';
import { matchApi } from '@/services/matchApi';
import { CoverImageUploader } from './CoverImageUploader';
import { VideoLinkManager } from './VideoLinkManager';

interface MatchDetailViewProps {
  matchId?: number;
  readonly?: boolean;
  onBack?: () => void;
}

export const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  matchId: propMatchId,
  readonly = false,
  onBack,
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const matchId = propMatchId || Number(paramId);
  const navigate = useNavigate();

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatchDetail = async () => {
    if (!matchId) return;

    setLoading(true);
    try {
      const response = await matchApi.getMatchDetail(matchId);
      if (response.data.success) {
        setMatch(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetail();
  }, [matchId]);

  const handleCoverImageChange = async (url: string) => {
    if (!match) return;
    setMatch({ ...match, coverImage: url });
  };

  const handleVideosChange = (videos: any[]) => {
    if (!match) return;
    setMatch({ ...match, videos });
  };

  const getStatusBadge = (status: MatchStatus) => {
    const config = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400', label: '待自评' },
      player_submitted: { color: 'bg-blue-500/20 text-blue-400', label: '待点评' },
      completed: { color: 'bg-green-500/20 text-green-400', label: '已完成' },
    };
    const { color, label } = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getResultBadge = (result: MatchResult, ourScore: number, oppScore: number) => {
    if (result === 'pending') {
      return <span className="text-gray-500">-</span>;
    }

    const config = {
      win: { color: 'text-green-400', label: '胜' },
      draw: { color: 'text-yellow-400', label: '平' },
      lose: { color: 'text-red-400', label: '负' },
    };
    const { color, label } = config[result] || config.draw;
    return (
      <span className={`text-2xl font-bold ${color}`}>
        {label} {ourScore}:{oppScore}
      </span>
    );
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      home: '主场',
      away: '客场',
      neutral: '中立',
    };
    return labels[location] || location;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="text-red-400" size={48} />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => onBack?.() || navigate(-1)}
          className="px-4 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBack?.() || navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="text-gray-400" size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{match.matchName}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <span>{match.teamName}</span>
              <span>vs</span>
              <span>{match.opponent}</span>
              {getStatusBadge(match.status)}
            </div>
          </div>
        </div>
      </div>

      {/* 比赛信息卡片 */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 日期 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#39ff14]/10 rounded-lg flex items-center justify-center">
              <Calendar className="text-[#39ff14]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">比赛日期</p>
              <p className="text-white font-medium">
                {new Date(match.matchDate).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* 地点 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#39ff14]/10 rounded-lg flex items-center justify-center">
              <MapPin className="text-[#39ff14]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">比赛地点</p>
              <p className="text-white font-medium">{getLocationLabel(match.location)}</p>
            </div>
          </div>

          {/* 赛制 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#39ff14]/10 rounded-lg flex items-center justify-center">
              <Trophy className="text-[#39ff14]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">比赛赛制</p>
              <p className="text-white font-medium">{match.matchFormat}</p>
            </div>
          </div>

          {/* 比分 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#39ff14]/10 rounded-lg flex items-center justify-center">
              <Star className="text-[#39ff14]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">比赛结果</p>
              {getResultBadge(match.result, match.ourScore, match.oppScore)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：封面 + 视频 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 封面图 */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="text-[#39ff14]" size={20} />
              <h3 className="text-white font-medium">封面图</h3>
            </div>
            <CoverImageUploader
              matchId={match.id}
              coverImage={match.coverImage}
              onCoverImageChange={handleCoverImageChange}
              readonly={readonly}
            />
          </div>

          {/* 视频链接 */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="text-[#39ff14]" size={20} />
              <h3 className="text-white font-medium">视频链接</h3>
            </div>
            <VideoLinkManager
              matchId={match.id}
              videos={match.videos || []}
              onVideosChange={handleVideosChange}
              readonly={readonly}
            />
          </div>
        </div>

        {/* 右侧：球员列表 + 教练点评 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 参赛球员 */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="text-[#39ff14]" size={20} />
                <h3 className="text-white font-medium">参赛球员</h3>
                <span className="text-gray-500 text-sm">({match.playerCount}人)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.players?.map((player) => {
                const playerReview = match.playerReviews?.find(r => r.playerId === player.id);
                const isSubmitted = playerReview?.status === 'submitted' || playerReview?.status === 'coach_reviewed';

                return (
                  <div
                    key={player.id}
                    className="bg-[#0f1419] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39ff14]/20 to-[#22c55e]/20 flex items-center justify-center">
                          <span className="text-[#39ff14] font-bold">{player.number}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{player.name}</p>
                          <p className="text-gray-500 text-xs">{player.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubmitted ? (
                          <CheckCircle className="text-green-400" size={18} title="已提交" />
                        ) : (
                          <Clock className="text-yellow-400" size={18} title="待提交" />
                        )}
                        {playerReview?.coachRating && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-medium">{playerReview.coachRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 教练整体点评 */}
          {match.coachOverall || match.coachTactic || match.coachKeyMoments ? (
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-[#39ff14]" size={20} />
                <h3 className="text-white font-medium">教练整体点评</h3>
              </div>

              <div className="space-y-4">
                {match.coachOverall && (
                  <div>
                    <h4 className="text-gray-400 text-sm mb-2">整体评价</h4>
                    <p className="text-white">{match.coachOverall}</p>
                  </div>
                )}
                {match.coachTactic && (
                  <div>
                    <h4 className="text-gray-400 text-sm mb-2">战术分析</h4>
                    <p className="text-white">{match.coachTactic}</p>
                  </div>
                )}
                {match.coachKeyMoments && (
                  <div>
                    <h4 className="text-gray-400 text-sm mb-2">关键时刻</h4>
                    <p className="text-white">{match.coachKeyMoments}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MatchDetailView;
