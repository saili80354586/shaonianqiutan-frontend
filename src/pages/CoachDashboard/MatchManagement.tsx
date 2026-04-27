import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Calendar, Trophy, Users, Clock, CheckCircle,
  ArrowRight, ArrowLeft, X, Edit, Eye, Loader2
} from 'lucide-react';
import type { MatchSummaryListItem, MatchStatus } from '@/services/matchApi';
import { matchApi } from '@/services/matchApi';
import { MatchDetailView } from '@/components/MATCH/MatchDetailView';
import { CoachReviewPanel } from '@/components/MATCH/CoachReviewPanel';
import { CreateMatchModal } from '@/components/MATCH/CreateMatchModal';

type ViewMode = 'list' | 'detail' | 'review';

export const MatchManagement: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const [matches, setMatches] = useState<MatchSummaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [statusFilter]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await matchApi.getCoachMatches(params);
      if (response.data.success) {
        setMatches(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载比赛列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match =>
    match.matchName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    match.opponent.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const getStatusBadge = (status: MatchStatus) => {
    const config = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400', label: '待自评', icon: Clock },
      player_submitted: { color: 'bg-blue-500/20 text-blue-400', label: '待点评', icon: Edit },
      completed: { color: 'bg-green-500/20 text-green-400', label: '已完成', icon: CheckCircle },
    };
    const { color, label, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${color}`}>
        <Icon size={14} />
        {label}
      </span>
    );
  };

  const getResultBadge = (result: string, ourScore: number, oppScore: number) => {
    if (result === 'pending') {
      return <span className="text-gray-500">-</span>;
    }

    const config = {
      win: { color: 'text-green-400', label: '胜' },
      draw: { color: 'text-yellow-400', label: '平' },
      lose: { color: 'text-red-400', label: '负' },
    };
    const { color, label } = config[result as keyof typeof config] || config.draw;
    return (
      <span className={`text-lg font-bold ${color}`}>
        {label} {ourScore}:{oppScore}
      </span>
    );
  };

  const handleMatchClick = (match: MatchSummaryListItem) => {
    setSelectedMatch(match as any);
    setViewMode('detail');
  };

  const handleCreateMatch = () => {
    setCreateModalOpen(true);
  };

  /** 创建成功后回调 */
  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadMatches(); // 刷新列表
  };

  const handleBack = () => {
    if (viewMode !== 'list') {
      setViewMode('list');
      setSelectedMatch(null);
    } else {
      // 在列表模式时点击返回，回到上一级（教练概览）
      onBack?.();
    }
  };

  const handleRefresh = () => {
    loadMatches();
  };

  // ========== 列表视图 ==========
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* 创建比赛弹窗 */}
        <CreateMatchModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">比赛管理</h1>
            <p className="text-gray-400 text-sm">管理和审核球队的比赛记录</p>
          </div>
          <button
            onClick={handleCreateMatch}
            className="flex items-center gap-2 px-4 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
          >
            <Plus size={20} />
            创建比赛
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '全部', count: matches.length, color: 'border-gray-700' },
            { label: '待自评', count: matches.filter(m => m.status === 'pending').length, color: 'border-yellow-500/30' },
            { label: '待点评', count: matches.filter(m => m.status === 'player_submitted').length, color: 'border-blue-500/30' },
            { label: '已完成', count: matches.filter(m => m.status === 'completed').length, color: 'border-green-500/30' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-[#1a1f2e] border ${stat.color} rounded-lg p-4`}>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索比赛或对手..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-800 rounded-lg text-white focus:border-[#39ff14] focus:outline-none"
          >
            <option value="all">全部状态</option>
            <option value="pending">待自评</option>
            <option value="player_submitted">待点评</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        {/* 比赛列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-[#39ff14] animate-spin" size={32} />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-500">暂无比赛记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => handleMatchClick(match)}
                className="bg-[#1a1f2e] border border-gray-800 rounded-lg p-5 hover:border-[#39ff14] hover:bg-[#1a1f2e]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium">{match.matchName}</h3>
                      {getStatusBadge(match.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(match.matchDate).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        {match.playerCount}人
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy size={16} />
                        {match.matchFormat}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1">
                      {getResultBadge(match.result, match.ourScore, match.oppScore)}
                    </div>
                    <p className="text-gray-500 text-sm">{match.teamName} vs {match.opponent}</p>
                  </div>
                  <ArrowRight className="text-gray-600 group-hover:text-[#39ff14] transition-colors ml-4" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========== 详情视图 ==========
  if (viewMode === 'detail' && selectedMatch) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            返回列表
          </button>
          {selectedMatch.status === 'player_submitted' && (
            <button
              onClick={() => setViewMode('review')}
              className="flex items-center gap-2 px-4 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
            >
              <Edit size={20} />
              教练点评
            </button>
          )}
        </div>
        <MatchDetailView matchId={selectedMatch.id} />
      </div>
    );
  }

  // ========== 教练点评视图 ==========
  if (viewMode === 'review' && selectedMatch) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewMode('detail')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            返回详情
          </button>
        </div>
        <CoachReviewPanel
          match={selectedMatch as any}
          onSubmit={handleRefresh}
          onCancel={handleBack}
        />
      </div>
    );
  }

  return null;
};

export default MatchManagement;
