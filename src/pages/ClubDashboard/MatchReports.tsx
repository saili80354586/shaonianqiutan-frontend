import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Trophy, Calendar, Users, Search, ChevronRight,
  Loader2, CheckCircle, Clock, AlertCircle, Video,
  MapPin, Shield, X, Play, Eye,
  ChevronDown, ChevronUp, User, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { matchApi } from '../../services/matchApi';
import type { MatchSummaryListItem, MatchSummary, PlayerReviewResponse, MatchResult, MatchStatus, MatchLocation, MatchFormat } from '../../services/matchApi';
import { teamApi, clubApi } from '../../services/club';
import { CardGridSkeleton, ListItemSkeleton } from '../../components/ui/loading';
import { LazyImage } from '../../components';

interface MatchReportsProps {
  onBack: () => void;
  clubId?: number;
  teamId?: number; // 若直接传入则跳过球队选择步骤
  isAdmin?: boolean;
}

interface TeamOption {
  id: number;
  name: string;
  ageGroup?: string;
  playerCount?: number;
}

interface ClubTeamStat {
  teamId: number;
  teamName: string;
  total: number;
  pending: number;
  playerSubmitted: number;
  completed: number;
}

// ─── 辅助组件 ─────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  const config: Record<MatchStatus, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    pending:          { bg: 'bg-amber-500/20',  text: 'text-amber-400',  icon: Clock,        label: '待自评' },
    player_submitted: { bg: 'bg-blue-500/20',   text: 'text-blue-400',   icon: AlertCircle,  label: '待点评' },
    completed:        { bg: 'bg-green-500/20',  text: 'text-green-400',  icon: CheckCircle,  label: '已完成' },
  };
  const s = config[status] ?? config.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
};

const ResultBadge: React.FC<{ result: MatchResult }> = ({ result }) => {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    win:     { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: '胜' },
    draw:    { bg: 'bg-gray-500/20',  text: 'text-gray-400',  border: 'border-gray-500/30',  label: '平' },
    lose:    { bg: 'bg-red-500/20',   text: 'text-red-400',   border: 'border-red-500/30',   label: '负' },
    pending: { bg: 'bg-gray-700/40',  text: 'text-gray-500',  border: 'border-gray-600/30',  label: '—' },
  };
  const s = config[result] ?? config.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-bold ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

const FormatBadge: React.FC<{ format: MatchFormat }> = ({ format }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30">
    <Shield className="w-3 h-3 mr-1" />{format}
  </span>
);

const LocationBadge: React.FC<{ location: MatchLocation }> = ({ location }) => {
  const config: Record<MatchLocation, { label: string; color: string }> = {
    home:    { label: '主场', color: 'text-emerald-400' },
    away:    { label: '客场', color: 'text-orange-400' },
    neutral: { label: '中立', color: 'text-gray-400' },
  };
  const c = config[location] ?? config.neutral;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${c.color}`}>
      <MapPin className="w-3 h-3" />{c.label}
    </span>
  );
};

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`${sz} ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
};

const SubmissionProgress: React.FC<{ submitted: number; total: number }> = ({ submitted, total }) => {
  if (total === 0) return null;
  const pct = Math.round((submitted / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{submitted}/{total} 自评</span>
    </div>
  );
};

const PLATFORM_LABELS: Record<string, string> = {
  baidu:    '百度网盘',
  tencent:  '腾讯视频',
  bilibili: '哔哩哔哩',
  other:    '其他链接',
};

// ─── 比赛详情弹窗 ──────────────────────────────────────────────────────────────

interface MatchDetailModalProps {
  matchId: number;
  onClose: () => void;
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ matchId, onClose }) => {
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await matchApi.getMatchDetail(matchId);
        if (res.data?.success) setMatch(res.data.data);
      } catch (e) {
        console.error('加载比赛详情失败:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  const handleRemind = async () => {
    if (!match) return;
    setReminding(true);
    try {
      const res = await matchApi.remindMatchSummary(match.id);
      if (res.data?.success) {
        toast.success(`催办成功，已通知 ${res.data.data?.sent || 0} 位球员`);
      } else {
        toast.error(res.data?.message || '催办失败');
      }
    } catch (error) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || '催办失败，请稍后重试');
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1a1f2e] rounded-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-6 border-b border-gray-800 sticky top-0 bg-[#1a1f2e] z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#39ff14]" />
              <h2 className="text-lg font-bold text-white">比赛详情</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">仅查看</span>
            </div>
            <div className="flex items-center gap-2">
              {match && match.status === 'pending' && match.submittedCount < match.playerCount && (
                <button
                  onClick={handleRemind}
                  disabled={reminding}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {reminding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  一键催办
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-tertiary rounded w-1/2" />
                <div className="h-4 bg-tertiary rounded w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-tertiary rounded-xl" />
              <div className="h-20 bg-tertiary rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-tertiary rounded w-full" />
              <div className="h-4 bg-tertiary rounded w-5/6" />
              <div className="h-4 bg-tertiary rounded w-4/6" />
            </div>
          </div>
        ) : !match ? (
          <div className="py-20 text-center text-gray-400">加载失败，请关闭重试</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* 比赛头部 */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                match.result === 'win' ? 'bg-green-500/20 text-green-400' :
                match.result === 'lose' ? 'bg-red-500/20 text-red-400' :
                match.result === 'draw' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-700/30 text-gray-600'
              }`}>
                <Trophy className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{match.matchName}</h3>
                  <ResultBadge result={match.result} />
                  <StatusBadge status={match.status} />
                  <FormatBadge format={match.matchFormat} />
                  <LocationBadge location={match.location} />
                </div>
                <p className="text-gray-400">
                  <span className="text-white">{match.teamName}</span>
                  <span className="mx-2 text-gray-600">vs</span>
                  <span className="text-white">{match.opponent}</span>
                  <span className="mx-3 text-gray-600">·</span>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {match.matchDate}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-4xl font-black tracking-tight">
                  <span className={match.ourScore > match.oppScore ? 'text-green-400' : match.ourScore < match.oppScore ? 'text-red-400' : 'text-white'}>
                    {match.ourScore}
                  </span>
                  <span className="text-gray-600 mx-2">:</span>
                  <span className={match.ourScore < match.oppScore ? 'text-green-400' : match.ourScore > match.oppScore ? 'text-red-400' : 'text-white'}>
                    {match.oppScore}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">最终比分</div>
              </div>
            </div>

            {/* 封面图 */}
            {match.coverImage && (
              <div className="rounded-xl overflow-hidden border border-gray-800">
                <LazyImage src={match.coverImage} alt="比赛封面" className="w-full max-h-48 object-cover" containerClassName="w-full" />
              </div>
            )}

            {/* 视频集锦 */}
            {match.videos && match.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-5 h-5 text-blue-400" />
                  <h4 className="font-semibold text-white">视频集锦</h4>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{match.videos.length} 个</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {match.videos.map((v, i) => (
                    <a
                      key={i}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-xl border border-gray-800 hover:border-blue-500/40 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{v.name || '视频链接'}</div>
                        <div className="text-xs text-gray-500">{PLATFORM_LABELS[v.platform] ?? v.platform}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 球员自评汇总 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-white">球员自评</h4>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {match.submittedCount}/{match.playerCount} 已提交
                </span>
              </div>
              {(!match.playerReviews || match.playerReviews.length === 0) ? (
                <div className="bg-[#0f1419] rounded-xl p-6 text-center text-gray-500">
                  暂无球员自评数据
                </div>
              ) : (
                <div className="space-y-2">
                  {match.playerReviews.map((review) => (
                    <PlayerReviewCard
                      key={review.id}
                      review={review}
                      expanded={expandedReview === review.id}
                      onToggle={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 教练整体点评 */}
            {(match.coachOverall || match.coachTactic || match.coachKeyMoments) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h4 className="font-semibold text-white">教练整体点评</h4>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-4 space-y-4 border border-gray-800">
                  {match.coachOverall && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">整体评价</div>
                      <p className="text-white text-sm leading-relaxed">{match.coachOverall}</p>
                    </div>
                  )}
                  {match.coachTactic && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">战术分析</div>
                      <p className="text-white text-sm leading-relaxed">{match.coachTactic}</p>
                    </div>
                  )}
                  {match.coachKeyMoments && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">关键时刻</div>
                      <p className="text-white text-sm leading-relaxed">{match.coachKeyMoments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 球员自评卡片（可展开）
const PlayerReviewCard: React.FC<{
  review: PlayerReviewResponse;
  expanded: boolean;
  onToggle: () => void;
}> = ({ review, expanded, onToggle }) => {
  const hasSubmitted = review.status === 'submitted' || review.status === 'coach_reviewed';
  const hasCoachReview = review.coachRating > 0 || !!review.coachComment;

  return (
    <div className="bg-[#0f1419] rounded-xl border border-gray-800 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
        onClick={onToggle}
      >
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{review.playerName}</span>
            {hasCoachReview && <StarRating rating={review.coachRating} />}
          </div>
          {hasSubmitted && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {review.goals > 0 && <span>{review.goals} 球</span>}
              {review.assists > 0 && <span>{review.assists} 助</span>}
              {review.saves > 0 && <span>{review.saves} 扑</span>}
              {review.performance && <span className="text-gray-400">{review.performance}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasSubmitted ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">已提交</span>
          ) : (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">待提交</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && hasSubmitted && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1a1f2e] rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{review.goals}</div>
              <div className="text-xs text-gray-500">进球</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{review.assists}</div>
              <div className="text-xs text-gray-500">助攻</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{review.saves}</div>
              <div className="text-xs text-gray-500">扑救</div>
            </div>
          </div>
          {review.highlights && (
            <div>
              <div className="text-xs text-gray-500 mb-1">高光时刻</div>
              <p className="text-sm text-white">{review.highlights}</p>
            </div>
          )}
          {review.improvements && (
            <div>
              <div className="text-xs text-gray-500 mb-1">不足与改进</div>
              <p className="text-sm text-white">{review.improvements}</p>
            </div>
          )}
          {review.nextGoals && (
            <div>
              <div className="text-xs text-gray-500 mb-1">下场期待</div>
              <p className="text-sm text-white">{review.nextGoals}</p>
            </div>
          )}
          {hasCoachReview && (
            <div className="mt-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-amber-400 font-medium">教练点评</span>
                <StarRating rating={review.coachRating} size="sm" />
              </div>
              {review.coachComment && <p className="text-sm text-white">{review.coachComment}</p>}
              {review.coachReply && (
                <div className="mt-2 border-t border-amber-500/20 pt-2">
                  <div className="text-xs text-gray-500 mb-1">答疑回复</div>
                  <p className="text-sm text-white">{review.coachReply}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 比赛列表卡片 ──────────────────────────────────────────────────────────────

const MatchListCard: React.FC<{ match: MatchSummaryListItem; onClick: () => void }> = ({ match, onClick }) => {
  const resultBg: Record<string, string> = {
    win:     'bg-green-500/10 border-green-500/20',
    draw:    'bg-gray-500/10 border-gray-500/20',
    lose:    'bg-red-500/10 border-red-500/20',
    pending: 'bg-gray-700/20 border-gray-700/30',
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-[#39ff14]/30 transition-all cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${resultBg[match.result] ?? resultBg.pending}`}>
            <Trophy className={`w-6 h-6 ${
              match.result === 'win' ? 'text-green-400' :
              match.result === 'lose' ? 'text-red-400' :
              match.result === 'draw' ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-semibold text-white group-hover:text-[#39ff14] transition-colors truncate">
                {match.matchName}
              </span>
              <ResultBadge result={match.result} />
              <StatusBadge status={match.status} />
              <FormatBadge format={match.matchFormat} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {match.teamName} vs <span className="text-gray-300 ml-1">{match.opponent}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {match.matchDate}
              </span>
              <LocationBadge location={match.location} />
            </div>
            <SubmissionProgress submitted={match.submittedCount} total={match.playerCount} />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-2xl font-black leading-none tracking-tight">
                <span className={match.ourScore > match.oppScore ? 'text-green-400' : match.ourScore < match.oppScore ? 'text-red-400' : 'text-white'}>
                  {match.ourScore}
                </span>
                <span className="text-gray-600 mx-1.5 text-xl">:</span>
                <span className={match.ourScore < match.oppScore ? 'text-green-400' : match.ourScore > match.oppScore ? 'text-red-400' : 'text-white'}>
                  {match.oppScore}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-0.5 text-right">比分</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#39ff14] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const MatchReports: React.FC<MatchReportsProps> = ({ onBack, clubId, teamId: initialTeamId, isAdmin = true }) => {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(initialTeamId ?? null);
  const [matches, setMatches] = useState<MatchSummaryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | MatchStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [stats, setStats] = useState({
    total: 0, pending: 0, playerSubmitted: 0, completed: 0,
    wins: 0, draws: 0, losses: 0,
  });
  const [clubStats, setClubStats] = useState<ClubTeamStat[]>([]);
  const [clubTotal, setClubTotal] = useState(0);
  const [loadingClubStats, setLoadingClubStats] = useState(false);
  const [clubStatsError, setClubStatsError] = useState<string | null>(null);

  // 加载俱乐部比赛统计
  useEffect(() => {
    if (initialTeamId) return;
    if (!clubId) return;
    (async () => {
      setLoadingClubStats(true);
      setClubStatsError(null);
      try {
        const res = await clubApi.getMatchSummaryStats();
        if (res.data?.success) {
          setClubStats(res.data.data?.teams || []);
          setClubTotal(res.data.data?.clubTotal || 0);
        } else {
          setClubStatsError(res.data?.message || '加载失败');
        }
      } catch (e) {
        console.error('加载俱乐部比赛统计失败:', e);
        setClubStatsError('加载失败，请重试');
      } finally {
        setLoadingClubStats(false);
      }
    })();
  }, [clubId, initialTeamId]);

  // 加载球队列表
  useEffect(() => {
    if (initialTeamId) return;
    if (!clubId) return;
    (async () => {
      setLoadingTeams(true);
      try {
        const res = await teamApi.getTeams(clubId);
        if (res.data?.success) {
          const list = res.data.data?.list || res.data.data || [];
          const opts: TeamOption[] = list.map((t: { id: number; name: string; ageGroup?: string; playerCount?: number; activePlayerCount?: number }) => ({
            id: t.id,
            name: t.name,
            ageGroup: t.ageGroup,
            playerCount: t.playerCount ?? t.activePlayerCount ?? 0,
          }));
          setTeams(opts);
          if (opts.length === 1) setSelectedTeamId(opts[0].id);
        }
      } catch (e) {
        console.error('加载球队列表失败:', e);
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, [clubId, initialTeamId]);

  const loadMatches = useCallback(async () => {
    if (!selectedTeamId) return;
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab as MatchStatus;
      const res = await matchApi.getTeamMatches(selectedTeamId, {
        status,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (res.data?.success && res.data?.data?.list) {
        const list = res.data.data.list;
        setMatches(list);
        setPagination(prev => ({ ...prev, total: res.data.data.total || 0 }));
        setStats({
          total: res.data.data.total || list.length,
          pending:         list.filter(m => m.status === 'pending').length,
          playerSubmitted: list.filter(m => m.status === 'player_submitted').length,
          completed:       list.filter(m => m.status === 'completed').length,
          wins:   list.filter(m => m.result === 'win').length,
          draws:  list.filter(m => m.result === 'draw').length,
          losses: list.filter(m => m.result === 'lose').length,
        });
      } else {
        setMatches([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      console.error('加载比赛列表失败:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, activeTab, pagination.page, pagination.pageSize]);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => { setPagination(prev => ({ ...prev, page: 1 })); }, [activeTab, selectedTeamId]);

  const filteredMatches = matches.filter(m =>
    !searchQuery ||
    m.matchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.opponent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'all',              label: '全部',   count: stats.total },
    { id: 'pending',          label: '待自评', count: stats.pending },
    { id: 'player_submitted', label: '待点评', count: stats.playerSubmitted },
    { id: 'completed',        label: '已完成', count: stats.completed },
  ] as const;

  // 俱乐部概览页
  if (!selectedTeamId && !initialTeamId) {
    const totalPending = clubStats.reduce((sum, s) => sum + s.pending, 0);
    const totalPlayerSubmitted = clubStats.reduce((sum, s) => sum + s.playerSubmitted, 0);
    const totalCompleted = clubStats.reduce((sum, s) => sum + s.completed, 0);

    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="p-8 max-w-6xl mx-auto">
          {/* 头部 */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#39ff14]" /> 比赛管理
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">一览所有球队的比赛总结情况</p>
            </div>
          </div>

          {/* 俱乐部统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-gray-400 text-sm">总比赛数</span>
              </div>
              <div className="text-2xl font-bold text-white">{clubTotal}</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-gray-400 text-sm">待自评</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalPending}</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-gray-400 text-sm">待点评</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalPlayerSubmitted}</div>
            </div>
            <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-gray-400 text-sm">已完成</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalCompleted}</div>
            </div>
          </div>

          {/* 错误提示 */}
          {clubStatsError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{clubStatsError}</p>
              <button
                onClick={() => {
                  setLoadingClubStats(true);
                  setClubStatsError(null);
                  clubApi.getMatchSummaryStats().then(res => {
                    if (res.data?.success) {
                      setClubStats(res.data.data?.teams || []);
                      setClubTotal(res.data.data?.clubTotal || 0);
                    } else {
                      setClubStatsError(res.data?.message || '加载失败');
                    }
                  }).catch(() => setClubStatsError('加载失败，请重试')).finally(() => setLoadingClubStats(false));
                }}
                className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
              >
                点击重试
              </button>
            </div>
          )}

          {/* 球队列表 */}
          {loadingTeams || loadingClubStats ? (
            <CardGridSkeleton count={3} columns={1} />
          ) : teams.length === 0 ? (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-16 text-center">
              <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">暂无球队数据</p>
              <p className="text-gray-600 text-sm mt-2">请先在球队管理中创建球队</p>
            </div>
          ) : clubStats.length === 0 ? (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-16 text-center">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">暂无任何比赛记录</p>
              <p className="text-gray-600 text-sm mt-2">教练创建比赛后将在此显示</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clubStats.map(team => {
                const teamMeta = teams.find(t => t.id === team.teamId);
                return (
                  <div
                    key={team.teamId}
                    onClick={() => setSelectedTeamId(team.teamId)}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{team.teamName}</h3>
                          <p className="text-sm text-gray-400">
                            共 {team.total} 场比赛
                            {teamMeta?.playerCount !== undefined && (
                              <span className="ml-3">{teamMeta.playerCount} 名球员</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span className="text-sm">管理比赛</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-white">{team.total}</div>
                        <div className="text-xs text-gray-500 mt-1">总比赛</div>
                      </div>
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-amber-400">{team.pending}</div>
                        <div className="text-xs text-gray-500 mt-1">待自评</div>
                      </div>
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">{team.playerSubmitted}</div>
                        <div className="text-xs text-gray-500 mt-1">待点评</div>
                      </div>
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-400">{team.completed}</div>
                        <div className="text-xs text-gray-500 mt-1">已完成</div>
                      </div>
                    </div>

                    {/* 进度条 */}
                    {team.total > 0 && (
                      <div className="mt-4">
                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                          <div className="bg-amber-500" style={{ width: `${(team.pending / team.total) * 100}%` }} />
                          <div className="bg-blue-500" style={{ width: `${(team.playerSubmitted / team.total) * 100}%` }} />
                          <div className="bg-green-500" style={{ width: `${(team.completed / team.total) * 100}%` }} />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 待自评</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 待点评</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 已完成</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentTeamName = teams.find(t => t.id === selectedTeamId)?.name || '球队';

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8 max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (initialTeamId) { onBack(); } else { setSelectedTeamId(null); setMatches([]); }
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#39ff14]" />
                比赛管理
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {currentTeamName} · 查看比赛记录与球员表现
              </p>
            </div>
          </div>
          {/* 战绩概览 */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="text-xs text-gray-400">胜</span>
              <span className="text-sm font-bold text-green-400">{stats.wins}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded-lg">
              <span className="text-xs text-gray-400">平</span>
              <span className="text-sm font-bold text-gray-400">{stats.draws}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-xs text-gray-400">负</span>
              <span className="text-sm font-bold text-red-400">{stats.losses}</span>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '全部比赛', value: stats.total,           color: 'text-white',      icon: Trophy      },
            { label: '待自评',   value: stats.pending,         color: 'text-amber-400',  icon: Clock       },
            { label: '待点评',   value: stats.playerSubmitted, color: 'text-blue-400',   icon: AlertCircle },
            { label: '已完成',   value: stats.completed,       color: 'text-green-400',  icon: CheckCircle },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color} opacity-60`} />
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tab + 搜索 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 border-b border-gray-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#39ff14] text-[#39ff14]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'bg-gray-800 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索赛事或对手..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14]/50"
            />
          </div>
        </div>

        {/* 比赛列表 */}
        {loading ? (
          <ListItemSkeleton count={4} />
        ) : filteredMatches.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-16 text-center">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">暂无比赛记录</p>
            <p className="text-gray-600 text-sm mt-2">教练创建比赛后将在此显示</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(match => (
              <MatchListCard
                key={match.id}
                match={match}
                onClick={() => setSelectedMatchId(match.id)}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {Math.ceil(pagination.total / pagination.pageSize) > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-sm text-white disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-gray-400">
              {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-sm text-white disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 比赛详情弹窗 */}
      {selectedMatchId !== null && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
};

export default MatchReports;
