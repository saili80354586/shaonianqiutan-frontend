import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, Star, Send, CheckCircle, FileText, Target, Award } from 'lucide-react';
import type { MatchSummary, PlayerReviewResponse, CoachOverallRequest } from '@/services/matchApi';
import { matchApi } from '@/services/matchApi';
import { TacticScenarioView } from '@/components/tactics/TacticScenarioView';

interface CoachReviewPanelProps {
  match: MatchSummary;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const CoachReviewPanel: React.FC<CoachReviewPanelProps> = ({
  match,
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 教练整体点评
  const [coachOverall, setCoachOverall] = useState(match.coachOverall || '');
  const [coachTactic, setCoachTactic] = useState(match.coachTactic || '');
  const [coachKeyMoments, setCoachKeyMoments] = useState(match.coachKeyMoments || '');

  // 球员点评
  const [playerReviews, setPlayerReviews] = useState<Array<{
    playerId: number;
    rating: number;
    coachComment: string;
    coachReply?: string;
  }>>([]);

  useEffect(() => {
    // 初始化球员点评数据
    if (match.playerReviews) {
      setPlayerReviews(
        match.playerReviews
          .filter(r => r.status === 'submitted' || r.status === 'coach_reviewed')
          .map(r => ({
            playerId: r.playerId,
            rating: r.coachRating || 0,
            coachComment: r.coachComment || '',
            coachReply: r.coachReply || '',
          }))
      );
    }
  }, [match.playerReviews]);

  const handleSubmitOverall = async () => {
    if (!coachOverall.trim()) {
      alert('请填写整体评价');
      return;
    }

    setLoading(true);
    try {
      const data: CoachOverallRequest = {
        coachOverall,
        coachTactic: coachTactic || undefined,
        coachKeyMoments: coachKeyMoments || undefined,
      };

      const response = await matchApi.submitCoachOverall(match.id, data);
      if (response.data.success) {
        setSuccess(true);
        onSubmit?.();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('提交点评失败:', error);
      alert('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerReview = async (playerId: number) => {
    const review = playerReviews.find(r => r.playerId === playerId);
    if (!review) return;

    if (!review.rating) {
      alert('请为球员评分');
      return;
    }

    setLoading(true);
    try {
      const response = await matchApi.reviewSinglePlayer(match.id, {
        playerId: review.playerId,
        rating: review.rating,
        coachComment: review.coachComment,
        coachReply: review.coachReply,
      });

      if (response.data.success) {
        setSuccess(true);
        onSubmit?.();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('更新球员点评失败:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerReview = (playerId: number, field: keyof typeof playerReviews[0], value: any) => {
    setPlayerReviews(
      playerReviews.map(r =>
        r.playerId === playerId ? { ...r, [field]: value } : r
      )
    );
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle className="text-green-400" size={64} />
        <h3 className="text-xl font-bold text-white">提交成功</h3>
        <p className="text-gray-400">您的点评已保存</p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 教练整体点评 */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="text-[#39ff14]" size={20} />
            <h3 className="text-white font-medium">教练整体点评</h3>
          </div>
        </div>

        <div className="space-y-4">
          {/* 整体评价 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
              <Award className="text-[#39ff14]" size={16} />
              整体评价 *
            </label>
            <textarea
              value={coachOverall}
              onChange={(e) => setCoachOverall(e.target.value)}
              placeholder="总结整体表现..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
            />
          </div>

          {/* 战术分析 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
              <Target className="text-[#39ff14]" size={16} />
              战术分析
            </label>
            <textarea
              value={coachTactic}
              onChange={(e) => setCoachTactic(e.target.value)}
              placeholder="分析战术执行情况..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
            />
          </div>

          {/* 关键时刻 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
              <Star className="text-[#39ff14]" size={16} />
              关键时刻
            </label>
            <textarea
              value={coachKeyMoments}
              onChange={(e) => setCoachKeyMoments(e.target.value)}
              placeholder="描述比赛中的关键时刻..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmitOverall}
            disabled={loading}
            className="w-full py-3 bg-[#39ff14] hover:bg-[#22c55e] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交整体点评'}
          </button>
        </div>
      </div>

      {/* 球员逐人点评 */}
      {playerReviews.length > 0 && (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="text-[#39ff14]" size={20} />
            <h3 className="text-white font-medium">球员点评</h3>
            <span className="text-gray-500 text-sm">({playerReviews.length}人)</span>
          </div>

          <div className="space-y-4">
            {playerReviews.map((review) => {
              const player = match.players?.find(p => p.id === review.playerId);
              const playerReviewData = match.playerReviews?.find(r => r.playerId === review.playerId);

              if (!player) return null;

              return (
                <div key={review.playerId} className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
                  {/* 球员信息 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39ff14]/20 to-[#22c55e]/20 flex items-center justify-center">
                        <span className="text-[#39ff14] font-bold">{player.number}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-gray-500 text-xs">{player.position}</p>
                      </div>
                    </div>
                  </div>

                  {/* 评分 */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-2">评分 (1-5)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updatePlayerReview(review.playerId, 'rating', rating)}
                          className={`p-1 transition-colors ${
                            review.rating >= rating ? 'text-yellow-400' : 'text-gray-600'
                          }`}
                        >
                          <Star
                            size={24}
                            fill={review.rating >= rating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                      <span className="text-gray-500 text-sm ml-2">{review.rating || '未评分'}</span>
                    </div>
                  </div>

                  {/* 教练点评 */}
                  <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-2">教练点评</label>
                    <textarea
                      value={review.coachComment}
                      onChange={(e) => updatePlayerReview(review.playerId, 'coachComment', e.target.value)}
                      placeholder="点评球员表现..."
                      rows={2}
                      className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none text-sm"
                    />
                  </div>

                  {/* 球员战术图展示 */}
                  {(playerReviewData as any)?.tactics && (playerReviewData as any).tactics.length > 0 && (
                    <div className="mb-3">
                      {(playerReviewData as any).tactics.map((tactic: any, idx: number) => (
                        <TacticScenarioView
                          key={idx}
                          scenario={{
                            title: tactic.title,
                            description: tactic.description,
                            playerQuestion: tactic.playerQuestion,
                            players: tactic.players,
                            matchFormat: tactic.matchFormat,
                          }}
                          playerName={player.name}
                          coachReply={review.coachReply}
                          coachReplyReadOnly={!review.coachReply && !onSubmit}
                          onCoachReply={(reply) =>
                            updatePlayerReview(review.playerId, 'coachReply', reply)
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* 球员疑问 + 教练回复 */}
                  {playerReviewData?.highlights || playerReviewData?.improvements ? (
                    <div className="mb-3 space-y-2">
                      {playerReviewData?.highlights && (
                        <div className="bg-[#1a1f2e] rounded p-2">
                          <p className="text-gray-500 text-xs mb-1">球员高光</p>
                          <p className="text-white text-sm">{playerReviewData.highlights}</p>
                        </div>
                      )}
                      {playerReviewData?.improvements && (
                        <div className="bg-[#1a1f2e] rounded p-2">
                          <p className="text-gray-500 text-xs mb-1">需改进</p>
                          <p className="text-white text-sm">{playerReviewData.improvements}</p>
                        </div>
                      )}

                      {/* 回复 */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">回复球员</label>
                        <textarea
                          value={review.coachReply}
                          onChange={(e) => updatePlayerReview(review.playerId, 'coachReply', e.target.value)}
                          placeholder="回复球员的问题..."
                          rows={2}
                          className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none text-sm"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* 更新按钮 */}
                  <button
                    onClick={() => handleUpdatePlayerReview(review.playerId)}
                    disabled={loading}
                    className="w-full py-2 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/30 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    更新点评
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 取消按钮 */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-3 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
        >
          取消
        </button>
      )}
    </div>
  );
};

export default CoachReviewPanel;
