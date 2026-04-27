import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Trophy, Users, FileText, CheckCircle, Clock,
  Loader2, Star, Edit2, Save, X, Video, MessageSquare,
  MapPin, ChevronDown, ChevronUp, Plus, Trash2, Link
} from 'lucide-react';
import { matchSummaryApi } from '../../services/api';
import { CardGridSkeleton } from '../../components/ui/loading';

// ===================== 类型定义 =====================
interface PlayerReview {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  performance: string;
  goals: number;
  assists: number;
  saves: number;
  highlights: string;
  improvements: string;
  nextGoals: string;
  coachRating: number;
  coachComment: string;
  coachReply: string;
  status: string;
  submittedAt: string;
  createdAt: string;
}

interface MatchVideo {
  id: number;
  matchId: number;
  platform: string;
  url: string;
  code: string;
  name: string;
  note: string;
  sortOrder: number;
}

interface MatchSummary {
  id: number;
  teamId: number;
  coachId: number;
  coachName: string;
  status: string;
  matchName: string;
  matchDate: string;
  opponent: string;
  location: string;
  matchFormat: string;
  ourScore: number;
  oppScore: number;
  result: string;
  coverImage: string;
  videos: MatchVideo[];
  playerIds: number[];
  playerCount: number;
  coachOverall: string;
  coachTactic: string;
  coachKeyMoments: string;
  playerReviews: PlayerReview[];
  submittedCount: number;
  createdAt: string;
}

// ===================== 状态配置 =====================
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待自评', color: 'text-amber-400 bg-amber-500/10 border border-amber-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
  player_submitted: { label: '待教练点评', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/30', icon: <FileText className="w-3.5 h-3.5" /> },
  completed: { label: '已完成', color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const RESULT_CONFIG: Record<string, { label: string; color: string }> = {
  win: { label: '胜', color: 'text-emerald-400 bg-emerald-500/15' },
  draw: { label: '平', color: 'text-amber-400 bg-amber-500/15' },
  lose: { label: '负', color: 'text-red-400 bg-red-500/15' },
  pending: { label: '-', color: 'text-gray-400 bg-gray-500/15' },
};

const LOCATION_LABELS: Record<string, string> = {
  home: '主场',
  away: '客场',
  neutral: '中立场',
};

const PLATFORM_LABELS: Record<string, string> = {
  baidu: '百度网盘',
  aliyun: '阿里云盘',
  weiyun: '微云',
  bilibili: 'B站',
  douyin: '抖音',
  other: '其他',
};

// ===================== 子组件：教练整体点评表单 =====================
const CoachReviewForm: React.FC<{
  matchId: number;
  initial: { coachOverall: string; coachTactic: string; coachKeyMoments: string };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ matchId, initial, onSuccess, onCancel }) => {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.coachOverall.trim()) {
      alert('请填写整体评价');
      return;
    }
    setSubmitting(true);
    try {
      const res = await matchSummaryApi.submitCoachReview(matchId, form);
      if (res.data?.success) {
        onSuccess();
      } else {
        alert(res.data?.error || '提交失败');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">整体评价 <span className="text-red-400">*</span></label>
        <textarea
          rows={4}
          value={form.coachOverall}
          onChange={e => setForm({ ...form, coachOverall: e.target.value })}
          placeholder="对本场比赛整体表现的评价..."
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">战术分析（可选）</label>
        <textarea
          rows={3}
          value={form.coachTactic}
          onChange={e => setForm({ ...form, coachTactic: e.target.value })}
          placeholder="本场战术执行情况、阵型变化..."
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">关键时刻（可选）</label>
        <textarea
          rows={3}
          value={form.coachKeyMoments}
          onChange={e => setForm({ ...form, coachKeyMoments: e.target.value })}
          placeholder="进球、失球、重要转折点..."
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitting ? '提交中...' : '保存点评'}
        </button>
      </div>
    </div>
  );
};

// ===================== 子组件：球员点评卡片 =====================
const PlayerReviewCard: React.FC<{
  review: PlayerReview;
  matchId: number;
  onUpdated: () => void;
}> = ({ review, matchId, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    playerId: review.playerId,
    rating: review.coachRating || 0,
    coachComment: review.coachComment || '',
    coachReply: review.coachReply || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await matchSummaryApi.submitCoachPlayerReview(matchId, form);
      if (res.data?.success) {
        setEditing(false);
        onUpdated();
      } else {
        alert(res.data?.error || '提交失败');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const performanceColor: Record<string, string> = {
    '优秀': 'text-emerald-400',
    '良好': 'text-blue-400',
    '一般': 'text-amber-400',
    '需改进': 'text-red-400',
  };

  return (
    <div className="bg-[#0f1419] rounded-xl border border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300">
            {review.playerName?.[0] || '?'}
          </div>
          <div className="text-left">
            <p className="text-white font-medium">{review.playerName}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className={performanceColor[review.performance] || 'text-gray-400'}>
                {review.performance || '待评'}
              </span>
              <span>进球 {review.goals} · 助攻 {review.assists}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {review.coachRating > 0 && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= review.coachRating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
              ))}
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
          {/* 球员自评内容 */}
          <div className="space-y-2">
            {review.highlights && (
              <div>
                <p className="text-xs text-emerald-400 mb-1">亮点表现</p>
                <p className="text-sm text-gray-300">{review.highlights}</p>
              </div>
            )}
            {review.improvements && (
              <div>
                <p className="text-xs text-amber-400 mb-1">需要改进</p>
                <p className="text-sm text-gray-300">{review.improvements}</p>
              </div>
            )}
            {review.nextGoals && (
              <div>
                <p className="text-xs text-blue-400 mb-1">下场目标</p>
                <p className="text-sm text-gray-300">{review.nextGoals}</p>
              </div>
            )}
          </div>

          {/* 教练点评区 */}
          {editing ? (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <p className="text-sm font-medium text-white">教练点评</p>
              <div>
                <p className="text-xs text-gray-400 mb-2">综合评分</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm({ ...form, rating: i })}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 transition-colors ${i <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600 hover:text-amber-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={3}
                value={form.coachComment}
                onChange={e => setForm({ ...form, coachComment: e.target.value })}
                placeholder="对该球员本场表现的点评..."
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              {review.nextGoals && (
                <textarea
                  rows={2}
                  value={form.coachReply}
                  onChange={e => setForm({ ...form, coachReply: e.target.value })}
                  placeholder={`回复球员的下场目标：「${review.nextGoals}」`}
                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">取消</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-500 text-black font-bold rounded-lg text-sm hover:bg-emerald-400 disabled:bg-gray-700 flex items-center justify-center gap-1"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-4">
              {review.coachComment ? (
                <div className="space-y-1">
                  <p className="text-xs text-emerald-400">教练评语</p>
                  <p className="text-sm text-gray-300">{review.coachComment}</p>
                  {review.coachReply && (
                    <p className="text-sm text-blue-300 mt-2">回复：{review.coachReply}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">尚未对该球员进行点评</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="mt-3 flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {review.coachComment ? '修改点评' : '添加点评'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===================== 子组件：视频管理 =====================
const VideoManager: React.FC<{
  matchId: number;
  videos: MatchVideo[];
  onUpdated: () => void;
}> = ({ matchId, videos, onUpdated }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ platform: 'baidu', url: '', code: '', name: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!form.url || !form.name) {
      alert('请填写链接地址和名称');
      return;
    }
    setSubmitting(true);
    try {
      const res = await matchSummaryApi.addVideo(matchId, form);
      if (res.data?.success) {
        setShowAdd(false);
        setForm({ platform: 'baidu', url: '', code: '', name: '', note: '' });
        onUpdated();
      } else {
        alert(res.data?.error || '添加失败');
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (!confirm('确认删除该视频链接？')) return;
    try {
      await matchSummaryApi.deleteVideo(matchId, videoId);
      onUpdated();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="space-y-3">
      {videos.length === 0 && !showAdd && (
        <p className="text-sm text-gray-500">暂未上传视频链接</p>
      )}
      {videos.map(v => (
        <div key={v.id} className="flex items-center justify-between p-3 bg-[#0f1419] rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{v.name}</p>
              <p className="text-xs text-gray-400">{PLATFORM_LABELS[v.platform] || v.platform}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {v.code && <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">码: {v.code}</span>}
            <a href={v.url} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300">
              <Link className="w-4 h-4" />
            </a>
            <button onClick={() => handleDelete(v.id)} className="text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div className="bg-[#0f1419] rounded-xl border border-gray-700 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">平台</label>
              <select
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              >
                {Object.entries(PLATFORM_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">提取码（可选）</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="如：abcd"
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">名称 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="如：上半场精彩集锦"
              className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">链接地址 <span className="text-red-400">*</span></label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">取消</button>
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="flex-1 py-2 bg-blue-500 text-white font-bold rounded-lg text-sm hover:bg-blue-400 disabled:bg-gray-700 flex items-center justify-center gap-1"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              添加
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> 添加视频链接
        </button>
      )}
    </div>
  );
};

// ===================== 主组件 =====================
interface MatchSummaryReviewProps {
  teamId: number;
  onBack: () => void;
}

const MatchSummaryReview: React.FC<MatchSummaryReviewProps> = ({ teamId, onBack }) => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const [editingCoachReview, setEditingCoachReview] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadMatches();
  }, [teamId, filterStatus, pagination.page]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      // teamId=0 时使用教练维度API（加载自己创建的所有比赛），否则按球队加载
      const res = teamId > 0
        ? await matchSummaryApi.getTeamMatchSummaries(teamId, {
            status: filterStatus || undefined,
            page: pagination.page,
            pageSize: pagination.pageSize,
          })
        : await matchSummaryApi.getCoachSummaries({
            status: filterStatus || undefined,
            page: pagination.page,
            pageSize: pagination.pageSize,
          });
      if (res.data?.success) {
        setMatches(res.data.data?.list || []);
        setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
      }
    } catch (err) {
      console.error('加载比赛列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchDetail = async (id: number) => {
    try {
      const res = await matchSummaryApi.getSummary(id);
      if (res.data?.success) {
        setSelectedMatch(res.data.data);
        setEditingCoachReview(false);
      }
    } catch (err) {
      console.error('加载比赛详情失败:', err);
    }
  };

  const handleDeleteMatch = async (id: number) => {
    if (!confirm('确认删除该比赛记录？此操作不可恢复。')) return;
    try {
      await matchSummaryApi.deleteMatchSummary(id);
      setSelectedMatch(null);
      loadMatches();
    } catch (err: any) {
      alert(err?.response?.data?.error || '删除失败');
    }
  };

  // 比赛详情视图
  if (selectedMatch) {
    const oppScore = selectedMatch.oppScore;
    const result = RESULT_CONFIG[selectedMatch.result] || RESULT_CONFIG.pending;
    const statusCfg = STATUS_CONFIG[selectedMatch.status] || STATUS_CONFIG.pending;

    return (
      <div className="min-h-screen bg-[#0f1419] p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {/* 返回 */}
          <button
            onClick={() => setSelectedMatch(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>

          {/* 比赛概览卡 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden mb-4">
            {selectedMatch.coverImage && (
              <img src={selectedMatch.coverImage} alt="封面" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedMatch.matchName}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                    <span>{selectedMatch.matchDate}</span>
                    {selectedMatch.matchFormat && (
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">{selectedMatch.matchFormat}</span>
                    )}
                    {selectedMatch.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{LOCATION_LABELS[selectedMatch.location] || selectedMatch.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${statusCfg.color}`}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </div>
              </div>

              {/* 比分 */}
              <div className="flex items-center justify-center gap-6 py-4 bg-[#0f1419] rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">我方</p>
                  <p className="text-4xl font-bold text-white">{selectedMatch.ourScore}</p>
                </div>
                <div className="text-center">
                  <span className={`px-4 py-2 rounded-xl text-xl font-bold ${result.color}`}>{result.label}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">vs {selectedMatch.opponent}</p>
                  <p className="text-4xl font-bold text-white">{oppScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 球员自评进度 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> 球员自评
              </h3>
              <span className="text-sm text-gray-400">
                {selectedMatch.submittedCount || selectedMatch.playerReviews?.length || 0} / {selectedMatch.playerCount} 人已提交
              </span>
            </div>

            {/* 进度条 */}
            {selectedMatch.playerCount > 0 && (
              <div className="mb-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                  style={{ width: `${((selectedMatch.submittedCount || selectedMatch.playerReviews?.length || 0) / selectedMatch.playerCount) * 100}%` }}
                />
              </div>
            )}

            {selectedMatch.playerReviews && selectedMatch.playerReviews.length > 0 ? (
              <div className="space-y-2">
                {selectedMatch.playerReviews.map(review => (
                  <PlayerReviewCard
                    key={review.id}
                    review={review}
                    matchId={selectedMatch.id}
                    onUpdated={() => loadMatchDetail(selectedMatch.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">暂无球员提交自评</p>
            )}
          </div>

          {/* 教练整体点评 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> 教练整体点评
              </h3>
              {!editingCoachReview && (
                <button
                  onClick={() => setEditingCoachReview(true)}
                  className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {selectedMatch.coachOverall ? '编辑' : '添加'}
                </button>
              )}
            </div>

            {editingCoachReview ? (
              <CoachReviewForm
                matchId={selectedMatch.id}
                initial={{
                  coachOverall: selectedMatch.coachOverall || '',
                  coachTactic: selectedMatch.coachTactic || '',
                  coachKeyMoments: selectedMatch.coachKeyMoments || '',
                }}
                onSuccess={() => {
                  setEditingCoachReview(false);
                  loadMatchDetail(selectedMatch.id);
                }}
                onCancel={() => setEditingCoachReview(false)}
              />
            ) : selectedMatch.coachOverall ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-emerald-400 mb-1">整体评价</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedMatch.coachOverall}</p>
                </div>
                {selectedMatch.coachTactic && (
                  <div>
                    <p className="text-xs text-blue-400 mb-1">战术分析</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedMatch.coachTactic}</p>
                  </div>
                )}
                {selectedMatch.coachKeyMoments && (
                  <div>
                    <p className="text-xs text-amber-400 mb-1">关键时刻</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedMatch.coachKeyMoments}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">尚未添加整体点评</p>
            )}
          </div>

          {/* 视频管理 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <Video className="w-4 h-4 text-purple-400" /> 比赛视频
            </h3>
            <VideoManager
              matchId={selectedMatch.id}
              videos={selectedMatch.videos || []}
              onUpdated={() => loadMatchDetail(selectedMatch.id)}
            />
          </div>

          {/* 危险操作 */}
          <div className="flex justify-end">
            <button
              onClick={() => handleDeleteMatch(selectedMatch.id)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> 删除比赛记录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> 比赛记录
          </h1>
          <div className="flex gap-2">
            {['', 'pending', 'player_submitted', 'completed'].map(s => (
              <button
                key={s}
                onClick={() => {
                  setFilterStatus(s);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {s === '' ? '全部' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} columns={1} />
        ) : matches.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>暂无比赛记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => {
              const oppScore = match.oppScore;
              const result = RESULT_CONFIG[match.result] || RESULT_CONFIG.pending;
              const statusCfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending;
              return (
                <button
                  key={match.id}
                  onClick={() => loadMatchDetail(match.id)}
                  className="w-full bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 text-left hover:border-gray-600 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-white group-hover:text-amber-300 transition-colors">{match.matchName}</p>
                      <p className="text-sm text-gray-400">{match.matchDate} · vs {match.opponent}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${statusCfg.color}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{match.ourScore}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${result.color}`}>{result.label}</span>
                      <span className="text-2xl font-bold text-white">{oppScore}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {match.matchFormat && <span>{match.matchFormat}</span>}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {(match as any).submittedCount ?? 0}/{match.playerCount}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {Math.ceil(pagination.total / pagination.pageSize) > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-40 hover:bg-gray-700 transition-colors text-sm"
            >上一页</button>
            <span className="text-gray-400 text-sm">
              {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-40 hover:bg-gray-700 transition-colors text-sm"
            >下一页</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSummaryReview;
