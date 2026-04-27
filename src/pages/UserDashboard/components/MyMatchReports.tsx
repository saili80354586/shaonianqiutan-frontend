import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, CheckCircle, ChevronRight, User, Users, Edit3, Eye, Star } from 'lucide-react';
import { ListItemSkeleton } from '../../../components/ui/loading';
import { useNavigate } from 'react-router-dom';
import { matchSummaryApi } from '../../../services/api';
import { useAuthStore } from '../../../store';
import { ClubEmptyState } from './ClubEmptyState';

interface MatchReport {
  id: number;
  matchName: string;
  matchDate: string;
  opponent: string;
  ourScore: number;
  oppScore: number;
  result: 'win' | 'draw' | 'lose' | 'pending';
  status: 'pending' | 'player_submitted' | 'completed';
  matchFormat?: string;
  location?: string;
  teamName?: string;
  coachName?: string;
  coachOverall?: string;
  coachTactic?: string;
  coachKeyMoments?: string;
  playerReviews?: Array<{
    id: number;
    playerId: number;
    playerName: string;
    performance: string;
    goals: number;
    assists: number;
    saves?: number;
    highlights?: string;
    improvements?: string;
    nextGoals?: string;
    coachRating?: number;
    coachComment?: string;
    coachReply?: string;
    status: string;
  }>;
}

interface MyMatchReportsProps {
  onBack?: () => void;
}

export const MyMatchReports: React.FC<MyMatchReportsProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'player_submitted' | 'completed'>('all');
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MatchReport | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  const loadReports = useCallback(async () => {
    if (!user?.id) {
      setError('用户信息未加载，请重新登录');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await matchSummaryApi.getPlayerMatchSummaries(Number(user.id), { page: pagination.page, pageSize: pagination.pageSize });
      if (res.data?.success) {
        const list = res.data.data?.list || [];
        setReports(list);
        setPagination(prev => ({ ...prev, total: res.data.data.total || 0 }));
        setHasClub(true);
      } else {
        const msg = res.data?.message || '';
        if (msg.includes('俱乐部') || msg.includes('球队') || msg.includes('未加入')) {
          setHasClub(false);
        } else {
          setError(msg || '加载失败');
        }
      }
    } catch (err: any) {
      console.error('加载比赛总结失败:', err);
      const msg = err.response?.data?.message || '';
      if (msg.includes('俱乐部') || msg.includes('球队') || msg.includes('未加入') || err.response?.status === 404) {
        setHasClub(false);
      } else {
        setError(msg || '加载比赛总结失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [activeTab]);

  const filteredReports = reports.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    playerSubmitted: reports.filter(r => r.status === 'player_submitted').length,
    completed: reports.filter(r => r.status === 'completed').length,
    wins: reports.filter(r => r.result === 'win').length,
  };

  // 获取当前球员的自评
  const getMyReview = (r: MatchReport) => {
    if (r.playerReviews && user?.id) {
      return r.playerReviews.find(p => p.playerId === Number(user.id));
    }
    return undefined;
  };

  // 获取教练评分
  const getMyRating = (r: MatchReport) => {
    const review = getMyReview(r);
    return review?.coachRating ? { rating: review.coachRating } : undefined;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '待自评' },
      player_submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '待点评' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '已完成' },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const ResultBadge = ({ result }: { result: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      win: { bg: 'bg-green-500/20', text: 'text-green-400', label: '胜' },
      draw: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '平' },
      lose: { bg: 'bg-red-500/20', text: 'text-red-400', label: '负' },
    };
    const c = config[result] || config.draw;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const handleEdit = (report: MatchReport) => {
    // 跳转到独立自评页面
    sessionStorage.setItem('match_self_review_data', JSON.stringify({
      matchSummaryId: report.id,
      matchName: report.matchName,
    }));
    navigate('/match-self-review');
  };

  // 监听自评页面返回结果
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const result = sessionStorage.getItem('match_self_review_result');
        if (result) {
          try {
            const data = JSON.parse(result);
            if (data.success) loadReports();
          } catch {}
          sessionStorage.removeItem('match_self_review_result');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadReports]);

  return (
    <div className="p-6">
      {onBack && (
        <button onClick={onBack} className="mb-4 text-gray-400 hover:text-white">
          ← 返回
        </button>
      )}

      <h2 className="text-xl font-bold text-white mb-6">我的比赛</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">总比赛</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className="text-sm text-gray-400">胜场</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-gray-400">待自评</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-blue-400">{stats.playerSubmitted}</div>
          <div className="text-sm text-gray-400">待点评</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
          <div className="text-sm text-gray-400">已完成</div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待自评' },
          { id: 'player_submitted', label: '待点评' },
          { id: 'completed', label: '已完成' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadReports}
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
          >
            点击重试
          </button>
        </div>
      )}

      {/* 无俱乐部引导 */}
      {hasClub === false && <ClubEmptyState feature="match" />}

      {/* 列表 */}
      {hasClub !== false && (loading ? (
        <ListItemSkeleton count={4} />
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无比赛记录</p>
          {reports.length === 0 && !error && (
            <p className="text-xs text-gray-500 mt-2">如果应该有比赛记录但看不到，请刷新页面或联系管理员</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    report.result === 'win' ? 'bg-green-500/20' :
                    report.result === 'draw' ? 'bg-gray-500/20' : 'bg-red-500/20'
                  }`}>
                    <Trophy className={`w-6 h-6 ${
                      report.result === 'win' ? 'text-green-400' :
                      report.result === 'draw' ? 'text-gray-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{report.matchName}</span>
                      <ResultBadge result={report.result} />
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="text-sm text-gray-400">
                      {report.matchDate} · {report.teamName || '我的球队'} vs {report.opponent}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      <span className={report.ourScore > report.oppScore ? 'text-green-400' : report.ourScore < report.oppScore ? 'text-red-400' : 'text-white'}>{report.ourScore}</span>
                      <span className="text-gray-500 mx-1">:</span>
                      <span className={report.oppScore > report.ourScore ? 'text-green-400' : report.oppScore < report.ourScore ? 'text-red-400' : 'text-white'}>{report.oppScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(report);
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        填写自评
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      查看
                    </button>
                  </div>
                </div>
              </div>

              {/* 已完成时显示教练评分 */}
              {report.status === 'completed' && (
                <div className="mt-3 flex items-center gap-4">
                  {getMyRating(report) ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= (getMyRating(report)?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-400 ml-2">教练评分</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">暂无个人评分</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* 分页 */}
      {Math.ceil(pagination.total / pagination.pageSize) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            上一页
          </button>
          <span className="text-gray-400">
            第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页 (共 {pagination.total} 条)
          </span>
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{selectedReport.matchName}</h3>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold">
                <span className={selectedReport.ourScore > selectedReport.oppScore ? 'text-green-400' : selectedReport.ourScore < selectedReport.oppScore ? 'text-red-400' : 'text-white'}>{selectedReport.ourScore}</span>
                <span className="text-gray-500 mx-3">-</span>
                <span className={selectedReport.oppScore > selectedReport.ourScore ? 'text-green-400' : selectedReport.oppScore < selectedReport.ourScore ? 'text-red-400' : 'text-white'}>{selectedReport.oppScore}</span>
              </div>
              <div className="text-gray-400 mt-1">{selectedReport.matchDate} vs {selectedReport.opponent}</div>
              <div className="text-sm text-gray-500 mt-1">{selectedReport.teamName || '我的球队'}</div>
            </div>

            {(() => {
              const myReview = getMyReview(selectedReport);
              return myReview ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> 球员自评
                </h4>
                <div className="bg-[#0f1419] rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{myReview.goals ?? 0}</div>
                      <div className="text-xs text-gray-500">进球</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{myReview.assists ?? 0}</div>
                      <div className="text-xs text-gray-500">助攻</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">{selectedReport.status === 'completed' ? '已完成' : selectedReport.status === 'player_submitted' ? '待点评' : '待自评'}</div>
                      <div className="text-xs text-gray-500">状态</div>
                    </div>
                  </div>
                  {myReview.performance && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">本场表现</div>
                      <div className="text-sm text-white">{myReview.performance}</div>
                    </div>
                  )}
                  {myReview.highlights && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">高光时刻</div>
                      <div className="text-sm text-white">{myReview.highlights}</div>
                    </div>
                  )}
                  {myReview.improvements && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">不足与改进</div>
                      <div className="text-sm text-white">{myReview.improvements}</div>
                    </div>
                  )}
                  {myReview.nextGoals && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">下场期待</div>
                      <div className="text-sm text-white">{myReview.nextGoals}</div>
                    </div>
                  )}
                  {/* 教练对我的评价 */}
                  {myReview.coachComment && (
                    <div className="border-t border-gray-700 pt-3">
                      <div className="text-xs text-blue-400 mb-1">教练评语</div>
                      <div className="text-sm text-white">{myReview.coachComment}</div>
                      {myReview.coachRating && myReview.coachRating > 0 && (
                        <div className="flex mt-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= myReview.coachRating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-[#0f1419] rounded-xl text-center text-gray-500 text-sm">
                尚未提交球员自评
              </div>
            );
            })()}

            {/* 教练整体点评 */}
            {selectedReport.coachOverall && (
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 教练整体点评
                </h4>
                <div className="bg-[#0f1419] rounded-xl p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">整体评价</div>
                    <div className="text-sm text-white">{selectedReport.coachOverall}</div>
                  </div>
                  {selectedReport.coachTactic && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">战术分析</div>
                      <div className="text-sm text-white">{selectedReport.coachTactic}</div>
                    </div>
                  )}
                  {selectedReport.coachKeyMoments && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">关键时刻</div>
                      <div className="text-sm text-white">{selectedReport.coachKeyMoments}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedReport.status === 'pending' && (
              <button
                onClick={() => {
                  setSelectedReport(null);
                  handleEdit(selectedReport);
                }}
                className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
              >
                填写自评
              </button>
            )}

            <button
              onClick={() => setSelectedReport(null)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMatchReports;
