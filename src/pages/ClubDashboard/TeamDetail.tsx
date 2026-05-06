import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Users, Edit2, Trash2, Eye, FileText,
  Shield, UserPlus, GraduationCap, Search, Activity,
  Settings, Home, ChevronRight, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import CoachModal from './components/CoachModal';
import WeeklyPeriodList from './components/WeeklyPeriodList';
import { matchSummaryApi, teamApi } from '../../services/club';
import { clubApi } from '../../services/api';
import TeamHomeEditor from '../CoachDashboard/TeamHomeEditor';
import MatchSummaryReview from '../CoachDashboard/MatchSummaryReview';
import CoachPhysicalTests from '../CoachDashboard/CoachPhysicalTests';
import { TableSkeleton, CardGridSkeleton } from '../../components/ui/loading';
import { type Player, type Coach, type CoachRole, COACH_ROLE_LABELS } from './types';
import { StatCard } from './components/StatCard';
import { InvitePlayerModal } from './components/InvitePlayerModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { CreateWeeklyModal } from './components/CreateWeeklyModal';
import { CreateMatchModal } from './components/CreateMatchModal';
import { TeamSettingModal } from './components/TeamSettingModal';
import { SeasonArchiveModal } from './components/SeasonArchiveModal';

interface TeamDetailProps {
  teamId: number;
  onBack: () => void;
  isAdmin?: boolean;
  canManageCoaches?: boolean;
  showCoachSwitchHint?: boolean;
  onViewDetail?: (playerId: number) => void;
}

interface MatchSummaryItem {
  id: number;
  status: 'pending' | 'player_submitted' | 'completed';
  result?: 'win' | 'draw' | 'lose';
  matchName: string;
  opponent: string;
  ourScore: number;
  oppScore: number;
}

interface SeasonArchiveItem {
  id: number;
  seasonName: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  matchCount?: number;
  weeklyCount?: number;
  testCount?: number;
}

const TeamDetail: React.FC<TeamDetailProps> = ({
  teamId,
  onBack,
  isAdmin = true,
  canManageCoaches = isAdmin,
  showCoachSwitchHint = isAdmin,
  onViewDetail,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAlsoCoach = user?.role === 'coach' || user?.roles?.some(role => role.type === 'coach');

  const [team, setTeam] = useState<{ id: number; name: string; ageGroup: string; coachName?: string; description?: string } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'players' | 'coaches' | 'weekly-reports' | 'match-reports' | 'physical-tests' | 'season-archives' | 'applications'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // 比赛总结和赛季档案状态
  const [matchReports, setMatchReports] = useState<MatchSummaryItem[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  // 发起周报弹窗状态
  const [showCreateWeekly, setShowCreateWeekly] = useState(false);
  // 创建比赛弹窗状态
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  // 球队设置弹窗状态
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  // 主页编辑弹窗状态
  const [showTeamHomeEdit, setShowTeamHomeEdit] = useState(false);
  // 比赛总结管理页面
  const [showMatchReview, setShowMatchReview] = useState(false);

  // 赛季档案状态
  const [seasonArchives, setSeasonArchives] = useState<SeasonArchiveItem[]>([]);
  const [seasonArchivesLoading, setSeasonArchivesLoading] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingArchive, setEditingArchive] = useState<SeasonArchiveItem | null>(null);

  // 入队申请状态
  interface ApplicationItem {
    id: number;
    playerId: number;
    playerName: string;
    playerPhone?: string;
    type: 'join' | 'trial';
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    responseNote?: string;
    createdAt: string;
  }
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [reviewingApp, setReviewingApp] = useState<ApplicationItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  // 加载比赛总结列表
  const loadMatchReports = useCallback(async () => {
    setMatchLoading(true);
    try {
      const res = await matchSummaryApi.getTeamMatchSummaries(teamId, {});
      if (res.data?.success && res.data?.data?.list) {
        setMatchReports(res.data.data.list);
      } else {
        setMatchReports([]);
      }
    } catch (error) {
      console.error('加载比赛总结失败:', error);
      setMatchReports([]);
    } finally {
      setMatchLoading(false);
    }
  }, [teamId]);

  // 加载赛季档案列表
  const loadSeasonArchives = useCallback(async () => {
    setSeasonArchivesLoading(true);
    try {
      const res = await clubApi.getTeamSeasonArchives(teamId);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setSeasonArchives(res.data.data);
      } else {
        setSeasonArchives([]);
      }
    } catch (error) {
      console.error('加载赛季档案失败:', error);
      setSeasonArchives([]);
    } finally {
      setSeasonArchivesLoading(false);
    }
  }, [teamId]);

  // 加载入队申请列表
  const loadApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const res = await teamApi.getTeamApplications(teamId);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const list = res.data.data.map((item: any) => ({
          id: item.id,
          playerId: item.player_id,
          playerName: item.player?.name || item.player_name || '未知球员',
          playerPhone: item.player?.phone || item.player_phone,
          type: item.type,
          status: item.status,
          reason: item.reason,
          responseNote: item.response_note,
          createdAt: item.created_at,
        }));
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('加载入队申请失败:', error);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    queueMicrotask(() => setLoading(true));
    try {
      // 并行加载球队详情、球员和教练；单个接口失败不应拖垮整个详情页
      const [teamResult, playersResult, coachesResult] = await Promise.allSettled([
        teamApi.getTeamDetail(teamId),
        teamApi.getTeamPlayers(teamId),
        teamApi.getTeamCoaches(teamId),
      ]);

      if (teamResult.status === 'fulfilled' && teamResult.value.data?.success) {
        setTeam(teamResult.value.data.data);
      } else if (teamResult.status === 'rejected') {
        console.error('加载球队详情失败:', teamResult.reason);
      }

      if (playersResult.status === 'fulfilled' && playersResult.value.data?.success) {
        // 后端返回数组格式 [{...}]，兼容处理
        const playersData = playersResult.value.data.data;
        setPlayers(Array.isArray(playersData) ? playersData : (playersData?.list || []));
      } else {
        setPlayers([]);
        if (playersResult.status === 'rejected') {
          console.error('加载球队球员失败:', playersResult.reason);
        }
      }

      if (coachesResult.status === 'fulfilled' && coachesResult.value.data?.success) {
        // 后端返回数组格式 [{...}]，兼容处理
        const coachesData = coachesResult.value.data.data;
        setCoaches(Array.isArray(coachesData) ? coachesData : (coachesData?.list || []));
      } else {
        setCoaches([]);
        if (coachesResult.status === 'rejected') {
          console.error('加载球队教练失败:', coachesResult.reason);
        }
      }
    } catch (error) {
      console.error('加载球队数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jerseyNumber.includes(searchQuery);
    const matchPosition = positionFilter === 'all' || p.position === positionFilter;
    return matchSearch && matchPosition;
  });

  // 计算球员年龄：优先使用 age 字段，若为空则根据 birthDate 计算
  const getPlayerAge = (player: Player): number => {
    if (player.age && player.age > 0) return player.age;
    if (player.birthDate) {
      const birth = new Date(player.birthDate);
      if (!isNaN(birth.getTime())) {
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      }
    }
    return 0;
  };

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = {
      '前锋': 'bg-red-500/20 text-red-300',
      '中场': 'bg-blue-500/20 text-blue-300',
      '后卫': 'bg-green-500/20 text-green-300',
      '门将': 'bg-yellow-500/20 text-yellow-300',
    };
    return map[pos] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', label: '在训' },
      inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '暂停' },
      transferred: { bg: 'bg-red-500/20', text: 'text-red-400', label: '已转会' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '待激活' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const registeredCount = players.filter(p => p.isRegistered).length;
  const pendingCount = players.filter(p => !p.isRegistered).length;

  // 如果显示主页编辑
  if (showTeamHomeEdit) {
    return (
      <TeamHomeEditor
        teamId={teamId}
        teamName={team?.name || '球队'}
        onBack={() => setShowTeamHomeEdit(false)}
      />
    );
  }

  // 如果显示比赛总结管理
  if (showMatchReview) {
    return (
      <MatchSummaryReview
        teamId={teamId}
        onBack={() => setShowMatchReview(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 教练身份切换提示（仅管理员视角下显示） */}
        {showCoachSwitchHint && isAlsoCoach && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400 text-sm">
                您同时是该球队教练，可切换至教练视角进行管理
              </p>
            </div>
            <button
              onClick={() => navigate(`/coach/dashboard?teamId=${teamId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
            >
              以教练身份进入 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{team?.name || '加载中...'}</h1>
                {team?.ageGroup && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm">
                    {team.ageGroup}
                  </span>
                )}
              </div>
              <p className="text-gray-400 mt-1">{team?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowTeamSettings(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4" /> 球队设置
                </button>
                <button
                  onClick={() => setShowTeamHomeEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-colors"
                >
                  <Home className="w-4 h-4" /> 主页编辑
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> 邀请球员
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'players'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />球员列表 ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('coaches')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'coaches'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />教练组 ({coaches.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly-reports')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'weekly-reports'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />周报
          </button>
          <button
            onClick={() => { setActiveTab('match-reports'); loadMatchReports(); }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'match-reports'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />比赛
          </button>
          <button
            onClick={() => { setActiveTab('physical-tests'); }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'physical-tests'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />体测
          </button>
          <button
            onClick={() => { setActiveTab('season-archives'); loadSeasonArchives(); }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'season-archives'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />赛季档案
          </button>
          <button
            onClick={() => { setActiveTab('applications'); loadApplications(); }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors relative ${
              activeTab === 'applications'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            入队申请
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* 球员Tab内容 */}
        {activeTab === 'players' && (
          <>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">{players.length}</div>
            <div className="text-sm text-gray-400">球队球员</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-green-400">{registeredCount}</div>
            <div className="text-sm text-gray-400">已注册</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-sm text-gray-400">待注册</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-emerald-400">
              {(players.reduce((sum, p) => sum + (p.avgScore || 0), 0) / (players.length || 1)).toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">平均评分</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球员姓名或球衣号..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">所有位置</option>
            <option value="前锋">前锋</option>
            <option value="中场">中场</option>
            <option value="后卫">后卫</option>
            <option value="门将">门将</option>
          </select>
        </div>

        {/* 球员列表 */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">球员信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">位置/号码</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">入队时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">分析报告</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">状态</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPlayers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">暂无符合条件的球员</td></tr>
                ) : (
                  filteredPlayers.map(player => (
                    <tr key={player.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {player.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-sm text-gray-500">{getPlayerAge(player)}岁 · {player.gender === 'male' ? '男' : player.gender === 'female' ? '女' : '未知'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${getPositionColor(player.position)}`}>{player.position}</span>
                        <span className="ml-2 text-gray-400">#{player.jerseyNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{player.joinDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-white">{player.reportCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(player.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewDetail ? onViewDetail(player.userId || player.id) : setSelectedPlayer(player)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* 教练Tab内容 */}
        {activeTab === 'coaches' && (
          <>
          {canManageCoaches && (
            <div className="mb-6">
              <button
                onClick={() => setShowCoachModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
              >
                <GraduationCap className="w-4 h-4" /> 添加教练
              </button>
            </div>
          )}

          {/* 教练列表 */}
          {loading ? (
            <TableSkeleton rows={3} cols={6} />
          ) : (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">教练信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">角色</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">手机号</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">加入时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">状态</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {coaches.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">暂无教练</td></tr>
                ) : (
                  coaches.map(coach => (
                    <tr key={coach.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full flex items-center justify-center text-white font-semibold">
                            {coach.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{coach.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          coach.role === 'head_coach'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {coach.roleLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{coach.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-400">{coach.joinedAt}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          coach.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {coach.status === 'active' ? '在任' : '已离任'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canManageCoaches ? (
                            <>
                              <select
                                value={coach.role}
                                onChange={(e) => {
                                  const newRole = e.target.value as CoachRole;
                                  setCoaches(coaches.map(c =>
                                    c.id === coach.id
                                      ? { ...c, role: newRole, roleLabel: COACH_ROLE_LABELS[newRole as CoachRole] }
                                      : c
                                  ));
                                }}
                                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              >
                                {Object.entries(COACH_ROLE_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              <button
                                onClick={async () => {
                                  if (!confirm(`确定要移除教练 ${coach.name} 吗？`)) return;
                                  try {
                                    const res = await teamApi.removeCoach(teamId, coach.id);
                                    if (res.data?.success) {
                                      setCoaches(coaches.filter(c => c.id !== coach.id));
                                      toast.success('教练已移除');
                                    } else {
                                      toast.error(res.data?.message || '移除失败');
                                    }
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.message || '移除失败，请稍后重试');
                                  }
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-sm">{coach.roleLabel}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
          </>
        )}

        {/* 周报Tab内容 */}
        {activeTab === 'weekly-reports' && (
          <div className="space-y-4">
            {/* 操作栏 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">周报周期管理</h2>
              <button
                onClick={() => setShowCreateWeekly(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> 发起周报
              </button>
            </div>

            {/* 周报周期列表组件 */}
            <WeeklyPeriodList
              teamId={teamId}
              players={players.map(p => ({
                id: p.id,
                name: p.name,
                jerseyNumber: p.jerseyNumber,
                position: p.position,
                avatar: p.avatar,
              }))}
            />
          </div>
        )}

        {/* 比赛Tab内容 */}
        {activeTab === 'match-reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="全部" value={matchReports.length} color="white" />
                <StatCard label="待自评" value={matchReports.filter(r => r.status === 'pending').length} color="amber" />
                <StatCard label="待点评" value={matchReports.filter(r => r.status === 'player_submitted').length} color="blue" />
                <StatCard label="已完成" value={matchReports.filter(r => r.status === 'completed').length} color="green" />
              </div>
              <button onClick={() => setShowCreateMatch(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                <Plus className="w-4 h-4" />创建比赛
              </button>
            </div>
            {matchLoading ? (
              <CardGridSkeleton count={3} columns={1} />
            ) : matchReports.length === 0 ? (
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无比赛记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matchReports.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setShowMatchReview(true)}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 cursor-pointer hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${r.result === 'win' ? 'bg-green-500/20' : r.result === 'draw' ? 'bg-gray-500/20' : 'bg-red-500/20'}`}>
                          <Trophy className={`w-7 h-7 ${r.result === 'win' ? 'text-green-400' : r.result === 'draw' ? 'text-gray-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{r.matchName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${r.result === 'win' ? 'bg-green-500/20 text-green-400' : r.result === 'draw' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>
                              {r.result === 'win' ? '胜' : r.result === 'draw' ? '平' : r.result === 'lose' ? '负' : '-'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : r.status === 'player_submitted' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {r.status === 'pending' ? '待自评' : r.status === 'player_submitted' ? '待点评' : '已完成'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">{team?.name} vs {r.opponent}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="text-3xl font-bold">
                          <span className={r.ourScore > r.oppScore ? 'text-green-400' : 'text-white'}>{r.ourScore}</span>
                          <span className="text-gray-500 mx-2">:</span>
                          <span className={r.ourScore < r.oppScore ? 'text-green-400' : 'text-white'}>{r.oppScore}</span>
                        </div>
                        <button
                          onClick={() => setShowMatchReview(true)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {r.status === 'player_submitted' ? '去点评' : '查看'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 体测Tab内容 */}
        {activeTab === 'physical-tests' && (
          <CoachPhysicalTests teamId={teamId} teamName={team?.name || ''} onBack={() => setActiveTab('players')} />
        )}

        {/* 赛季档案Tab内容 */}
        {activeTab === 'season-archives' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">赛季档案</h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingArchive(null);
                    setShowArchiveModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" /> 新建赛季档案
                </button>
              )}
            </div>

            {seasonArchivesLoading ? (
              <CardGridSkeleton count={4} columns={2} />
            ) : seasonArchives.length === 0 ? (
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无赛季档案</p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingArchive(null);
                      setShowArchiveModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                  >
                    创建第一个赛季档案
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasonArchives.map((archive) => (
                  <div
                    key={archive.id}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{archive.seasonName}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {archive.startDate && archive.endDate
                            ? `${archive.startDate} ~ ${archive.endDate}`
                            : archive.startDate || archive.endDate || '未设置时间范围'}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingArchive(archive);
                              setShowArchiveModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('确定删除该赛季档案？')) return;
                              try {
                                await clubApi.deleteTeamSeasonArchive(teamId, archive.id);
                                toast.success('删除成功');
                                loadSeasonArchives();
                              } catch (error) {
                                toast.error('删除失败');
                              }
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">{archive.matchCount || 0}</div>
                        <div className="text-xs text-gray-500">比赛</div>
                      </div>
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">{archive.weeklyCount || 0}</div>
                        <div className="text-xs text-gray-500">周报</div>
                      </div>
                      <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-amber-400">{archive.testCount || 0}</div>
                        <div className="text-xs text-gray-500">体测</div>
                      </div>
                    </div>

                    {archive.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">{archive.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 入队申请Tab内容 */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">入队申请</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                  待处理 {applications.filter(a => a.status === 'pending').length}
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  已通过 {applications.filter(a => a.status === 'approved').length}
                </span>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                  已拒绝 {applications.filter(a => a.status === 'rejected').length}
                </span>
              </div>
            </div>

            {applicationsLoading ? (
              <TableSkeleton count={5} />
            ) : applications.length === 0 ? (
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
                <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无入队申请</p>
                <p className="text-sm text-gray-500 mt-2">球员可在「发现俱乐部」中搜索并申请加入您的球队</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          app.type === 'trial' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                        }`}>
                          <UserPlus className={`w-6 h-6 ${app.type === 'trial' ? 'text-purple-400' : 'text-blue-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">{app.playerName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              app.type === 'trial'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {app.type === 'trial' ? '试训申请' : '入队申请'}
                            </span>
                            {app.status === 'pending' && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">待审核</span>
                            )}
                            {app.status === 'approved' && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">已通过</span>
                            )}
                            {app.status === 'rejected' && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">已拒绝</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{app.playerPhone}</p>
                          {app.reason && (
                            <p className="text-sm text-gray-500 mt-1">申请理由：{app.reason}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">
                            申请时间：{new Date(app.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                          {app.responseNote && (
                            <p className="text-xs text-gray-500 mt-1">审核备注：{app.responseNote}</p>
                          )}
                        </div>
                      </div>

                      {app.status === 'pending' && isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReviewingApp(app);
                              setReviewAction('reject');
                              setReviewNote('');
                            }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                          >
                            拒绝
                          </button>
                          <button
                            onClick={() => {
                              setReviewingApp(app);
                              setReviewAction('approve');
                              setReviewNote('');
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                          >
                            通过
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 审核弹窗 */}
        {reviewingApp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">
                  {reviewAction === 'approve' ? '通过申请' : '拒绝申请'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {reviewAction === 'approve'
                    ? `确认通过 ${reviewingApp.playerName} 的${reviewingApp.type === 'trial' ? '试训' : '入队'}申请？`
                    : `确认拒绝 ${reviewingApp.playerName} 的申请？`}
                </p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {reviewAction === 'approve' ? '通过备注（可选）' : '拒绝原因（可选）'}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder={reviewAction === 'approve' ? '请输入通过备注...' : '请输入拒绝原因...'}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                <button
                  onClick={() => { setReviewingApp(null); setReviewAction(null); }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    try {
                      const status = reviewAction === 'approve' ? 'approved' : 'rejected';
                      await teamApi.reviewApplication(teamId, reviewingApp.id, { status, responseNote: reviewNote });
                      toast.success(reviewAction === 'approve' ? '已通过申请' : '已拒绝申请');
                      setReviewingApp(null);
                      setReviewAction(null);
                      loadApplications();
                    } catch (error) {
                      toast.error('操作失败，请重试');
                    }
                  }}
                  className={`px-6 py-2 rounded-xl flex items-center gap-2 ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 邀请球员弹窗 */}
      {showInviteModal && (
        <InvitePlayerModal
          teamId={teamId}
          teamName={team?.name || ''}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => setShowInviteModal(false)}
        />
      )}

      {/* 教练管理弹窗 */}
      {showCoachModal && canManageCoaches && (
        <CoachModal
          teamId={teamId}
          teamName={team?.name || ''}
          onClose={() => setShowCoachModal(false)}
          onSuccess={() => {
            setShowCoachModal(false);
          }}
        />
      )}

      {/* 球员详情弹窗 */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* 发起周报弹窗 */}
      {showCreateWeekly && (
        <CreateWeeklyModal
          teamId={teamId}
          players={players}
          onClose={() => setShowCreateWeekly(false)}
          onSuccess={() => {
            setShowCreateWeekly(false);
          }}
        />
      )}

      {/* 创建比赛弹窗 */}
      {showCreateMatch && (
        <CreateMatchModal
          teamId={teamId}
          teamName={team?.name || ''}
          players={players}
          onClose={() => setShowCreateMatch(false)}
          onSuccess={() => {
            setShowCreateMatch(false);
            loadMatchReports();
          }}
        />
      )}

      {/* 球队设置弹窗 */}
      {showTeamSettings && (
        <TeamSettingModal
          teamId={teamId}
          team={team}
          onClose={() => setShowTeamSettings(false)}
          onSaved={(updated) => setTeam(updated)}
        />
      )}

      {/* 赛季档案编辑弹窗 */}
      {showArchiveModal && (
        <SeasonArchiveModal
          teamId={teamId}
          editingArchive={editingArchive}
          onClose={() => setShowArchiveModal(false)}
          onSuccess={() => {
            setShowArchiveModal(false);
            loadSeasonArchives();
          }}
        />
      )}
    </div>
  );
};
export default TeamDetail;
