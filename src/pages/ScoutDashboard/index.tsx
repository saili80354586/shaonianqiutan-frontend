import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  Users,
  Award,
  MapPin,
  Calendar,
  ChevronRight,
  Eye,
  Heart,
  BarChart3,
  Clock,
  Target,
  Plus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatePostModal } from '../ScoutMap/SocialFeed';
import { StatsGridSkeleton, ListItemSkeleton } from '../../components/ui/loading';
import ScoutPlayers from './ScoutPlayers';
import ScoutReportEditor from './ScoutReportEditor';
import type { ScoutReportData } from './ScoutReportEditor';
import { scoutApi, unwrapApiResponse } from '../../services/api';
import { DashboardLayout } from '../../components/dashboard';
import type { SidebarConfig, MenuItemDef } from '../../components/dashboard/types';
import { useAuthStore } from '../../store';

// 类型定义
interface DashboardStats {
  totalDiscovered: number;
  totalReports: number;
  publishedReports: number;
  adoptedReports: number;
  followedPlayers: number;
}

interface RecentReport {
  id: number;
  playerId: number;
  playerName: string;
  overallRating: number;
  potentialRating: 'S' | 'A' | 'B' | 'C' | 'D';
  status: 'draft' | 'published' | 'adopted';
  createdAt: string;
  views: number;
  likes: number;
}

interface ScoutTask {
  id: number;
  title: string;
  region: string;
  ageGroup: string;
  deadline: string;
  reward: number;
  status: 'available' | 'accepted' | 'completed';
}

interface ApiScoutPlayer {
  nickname?: string;
  real_name?: string;
  name?: string;
}

interface ApiScoutReport {
  id: number;
  player_id: number;
  player?: ApiScoutPlayer;
  overall_rating?: number;
  potential_rating?: string;
  status?: string;
  created_at: string;
  views?: number;
  likes?: number;
}

interface ApiScoutTask {
  id: number;
  title: string;
  region?: string;
  age_group?: string;
  deadline: string;
  reward?: number;
  status?: string;
}

interface ScoutDashboardPayload {
  total_discovered?: number;
  total_reports?: number;
  published_reports?: number;
  adopted_reports?: number;
  followed_players?: number;
  recent_reports?: ApiScoutReport[];
  available_tasks?: ApiScoutTask[];
}

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  region?: string;
  team?: string;
  avatar?: string;
  potential?: 'S' | 'A' | 'B' | 'C' | 'D';
  isFollowed?: boolean;
}

interface ScoutReportRouteState {
  activeTab?: 'editor';
  reportPlayer?: Partial<Player> & { userId?: number };
}

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  fuchsia: { bg: 'bg-fuchsia-500/10', icon: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  pink: { bg: 'bg-pink-500/10', icon: 'text-pink-400', border: 'border-pink-500/20' },
};

const getErrorMessage = (err: unknown, fallback: string) => (
  err instanceof Error ? err.message : fallback
);

const mapScoutReport = (report: ApiScoutReport): RecentReport => ({
  id: report.id,
  playerId: report.player_id,
  playerName: report.player?.nickname || report.player?.real_name || report.player?.name || '未知球员',
  overallRating: report.overall_rating || 0,
  potentialRating: (report.potential_rating || 'B') as RecentReport['potentialRating'],
  status: (report.status || 'draft') as RecentReport['status'],
  createdAt: report.created_at,
  views: report.views || 0,
  likes: report.likes || 0,
});

const mapScoutTask = (task: ApiScoutTask): ScoutTask => ({
  id: task.id,
  title: task.title,
  region: task.region || '',
  ageGroup: task.age_group || '',
  deadline: task.deadline,
  reward: task.reward || 0,
  status: (task.status === 'open' ? 'available' : task.status) as ScoutTask['status'],
});

const ScoutDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const entryTab = searchParams.get('tab');
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'players' | 'tasks' | 'editor'>('overview');
  const [reportPlayer, setReportPlayer] = useState<Player | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 数据状态
  const [stats, setStats] = useState<DashboardStats>({
    totalDiscovered: 0,
    totalReports: 0,
    publishedReports: 0,
    adoptedReports: 0,
    followedPlayers: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [allReports, setAllReports] = useState<RecentReport[]>([]);
  const [tasks, setTasks] = useState<ScoutTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const routeState = location.state as ScoutReportRouteState | null;
    let incomingPlayer = routeState?.reportPlayer;

    if (!incomingPlayer) {
      const cached = sessionStorage.getItem('scoutReportDraftPlayer');
      if (cached) {
        try {
          incomingPlayer = JSON.parse(cached) as ScoutReportRouteState['reportPlayer'];
        } catch {
          sessionStorage.removeItem('scoutReportDraftPlayer');
        }
      }
    }

    const shouldOpenEditor = entryTab === 'editor' || routeState?.activeTab === 'editor' || !!incomingPlayer;
    if (!shouldOpenEditor || !incomingPlayer) return;

    const playerId = incomingPlayer.id || incomingPlayer.userId;
    if (!playerId) return;

    setReportPlayer({
      id: String(playerId),
      name: incomingPlayer.name || '未知球员',
      age: Number(incomingPlayer.age || 0),
      position: incomingPlayer.position || '未知',
      team: incomingPlayer.team,
      avatar: incomingPlayer.avatar,
    });
    setActiveTab('editor');
    sessionStorage.removeItem('scoutReportDraftPlayer');

    if (entryTab === 'editor' || routeState?.activeTab) {
      navigate('/scout/dashboard', { replace: true, state: null });
    }
  }, [entryTab, location.state, navigate]);

  // 获取工作台数据
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await scoutApi.getDashboard();
      const body = unwrapApiResponse(res);
      if (body.success && body.data) {
        // 后端返回 snake_case，前端使用 camelCase，需要转换
        const data = body.data as ScoutDashboardPayload;
        setStats({
          totalDiscovered: data.total_discovered || 0,
          totalReports: data.total_reports || 0,
          publishedReports: data.published_reports || 0,
          adoptedReports: data.adopted_reports || 0,
          followedPlayers: data.followed_players || 0,
        });
        // 转换 recentReports: 从后端获取 Player 对象中的 nickname 作为 playerName
        setRecentReports((data.recent_reports || []).map(mapScoutReport));
        // 转换 availableTasks
        setTasks((data.available_tasks || []).map(mapScoutTask));
      } else {
        setError(body.error?.message || '获取数据失败');
      }
    } catch (err: unknown) {
      console.error('获取工作台数据失败:', err);
      setError(getErrorMessage(err, '获取数据失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取所有报告
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scoutApi.getReports({ page_size: 50 });
      const body = unwrapApiResponse(res);
      if (body.success && body.data) {
        const data = body.data as { list?: ApiScoutReport[] };
        setAllReports((data.list || []).map(mapScoutReport));
      } else {
        toast.error(body.error?.message || '获取报告列表失败');
      }
    } catch (err: unknown) {
      console.error('获取报告列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await scoutApi.getTasks({ page_size: 50 });
      const body = unwrapApiResponse(res);
      if (body.success && body.data) {
        const data = body.data as { list?: ApiScoutTask[] };
        setTasks((data.list || []).map(mapScoutTask));
      } else {
        setError(body.error?.message || '获取任务失败');
      }
    } catch (err: unknown) {
      console.error('获取任务列表失败:', err);
      setError(getErrorMessage(err, '获取任务失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboard();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, fetchDashboard, fetchReports, fetchTasks]);

  // 处理写报告
  const handleWriteReport = (player: Player) => {
    setReportPlayer(player);
    setActiveTab('editor');
  };

  // 处理报告保存
  const handleReportSave = async (data: ScoutReportData) => {
    try {
      const playerId = parseInt(reportPlayer?.id || data.playerId || '0');
      if (!playerId) {
        toast.error('请先选择球员');
        return;
      }

      const res = await scoutApi.createReport({
        player_id: playerId,
        overall_rating: data.overallRating,
        potential_rating: data.potentialRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        technical_skills: data.technicalSkills,
        summary: data.summary,
        recommendation: data.recommendation,
        target_club: data.targetClub,
      });
      const body = unwrapApiResponse(res);
      if (!body.success) {
        toast.error(body.error?.message || '保存失败');
        return;
      }
      toast.success('报告已保存');
    } catch (err: unknown) {
      console.error('保存报告失败:', err);
      toast.error(getErrorMessage(err, '保存失败'));
    }
  };

  // 处理报告发布
  const handleReportPublish = async (data: ScoutReportData) => {
    try {
      const playerId = parseInt(reportPlayer?.id || data.playerId || '0');
      if (!playerId) {
        toast.error('请先选择球员');
        return;
      }

      const res = await scoutApi.createReport({
        player_id: playerId,
        overall_rating: data.overallRating,
        potential_rating: data.potentialRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        technical_skills: data.technicalSkills,
        summary: data.summary,
        recommendation: data.recommendation,
        target_club: data.targetClub,
      });
      const body = unwrapApiResponse(res);
      if (body.success && body.data?.id) {
        const publishRes = await scoutApi.publishReport(body.data.id);
        const publishBody = unwrapApiResponse(publishRes);
        if (!publishBody.success) {
          toast.error(publishBody.error?.message || '发布失败');
          return;
        }
      } else {
        toast.error(body.error?.message || '发布失败');
        return;
      }
      toast.success('报告已发布');
      setActiveTab('reports');
      setReportPlayer(null);
      fetchDashboard();
    } catch (err: unknown) {
      console.error('发布报告失败:', err);
      toast.error(getErrorMessage(err, '发布失败'));
    }
  };

  // 返回概览
  const handleBackToOverview = () => {
    setActiveTab('overview');
    setReportPlayer(null);
  };

  const handleAcceptTask = async (taskId: number, refresh: () => void) => {
    try {
      const res = await scoutApi.acceptTask(taskId);
      const body = unwrapApiResponse(res);
      if (!body.success) {
        toast.error(body.error?.message || '接取失败');
        return;
      }
      toast.success('接取成功');
      refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, '接取失败'));
    }
  };

  // 获取当前激活的分组key
  const getActiveGroupKey = () => {
    if (activeTab === 'overview' || activeTab === 'reports' || activeTab === 'editor') return 'reports';
    if (activeTab === 'players' || activeTab === 'tasks') return 'discovery';
    return undefined;
  };

  // 获取当前激活的菜单项ID
  const getActiveItemId = () => {
    if (activeTab === 'editor') return undefined;
    return activeTab;
  };

  // 获取页面标题
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return '球探工作台';
      case 'reports': return '我的球探报告';
      case 'players': return '人才库';
      case 'tasks': return '任务中心';
      case 'editor': return '撰写报告';
      default: return '';
    }
  };

  // 侧边栏配置
  const scoutSidebarConfig: SidebarConfig = {
    roleName: '球探工作台',
    themeColor: '#a78bfa',
    dashboardPath: '/scout/dashboard',
    profilePath: user?.id ? `/scout/${user.id}` : undefined,
    showCreatePost: true,
    businessGroups: [
      {
        key: 'reports',
        label: '报告中心',
        icon: FileText,
        items: [
          { id: 'overview', label: '工作台', icon: BarChart3 },
          { id: 'reports', label: '我的报告', icon: FileText },
        ],
      },
      {
        key: 'discovery',
        label: '发现与任务',
        icon: Search,
        items: [
          { id: 'players', label: '人才库', icon: Users },
          { id: 'tasks', label: '任务中心', icon: Target },
        ],
      },
    ],
  };

  // 处理菜单项点击
  const handleItemClick = (item: MenuItemDef) => {
    const tab = item.id as typeof activeTab;
    if (['overview', 'reports', 'players', 'tasks'].includes(tab)) {
      setActiveTab(tab);
      setReportPlayer(null);
    }
  };

  const getStatusColor = (status: RecentReport['status']) => {
    switch (status) {
      case 'adopted': return 'bg-emerald-500/20 text-emerald-400';
      case 'published': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-amber-500/20 text-amber-400';
    }
  };

  const getStatusText = (status: RecentReport['status']) => {
    switch (status) {
      case 'adopted': return '已采纳';
      case 'published': return '已发布';
      case 'draft': return '草稿';
    }
  };

  const getPotentialColor = (potential: RecentReport['potentialRating']) => {
    switch (potential) {
      case 'S': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'A': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'C': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'D': return 'bg-gray-600/20 text-gray-500 border-gray-600/30';
    }
  };

  const getTaskStatusColor = (status: ScoutTask['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/20 text-emerald-400';
      case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <DashboardLayout
      sidebarConfig={scoutSidebarConfig}
      activeItemId={getActiveItemId()}
      activeGroupKey={getActiveGroupKey()}
      onItemClick={handleItemClick}
      pageTitle={getPageTitle()}
      onCreatePost={() => setIsCreateOpen(true)}
      headerActions={
        activeTab === 'overview' ? (
          <button
            onClick={() => navigate('/scout-map')}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            发现球员
          </button>
        ) : activeTab === 'reports' ? (
          <button
            onClick={() => { setReportPlayer(null); setActiveTab('players'); }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            选择球员写报告
          </button>
        ) : activeTab === 'players' ? (
          <button
            onClick={() => navigate('/scout-map')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <MapPin className="w-4 h-4" />
            球探地图
          </button>
        ) : undefined
      }
    >
        {/* 工作台概览 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 欢迎语 */}
            <div>
              <h1 className="text-2xl font-bold text-white">你好，球探 👋</h1>
              <p className="text-slate-400 text-sm mt-1">发掘下一个足球天才！</p>
            </div>

            {/* 加载状态 */}
            {loading ? (
              <div className="space-y-6">
                <StatsGridSkeleton count={4} columns={4} />
                <ListItemSkeleton count={3} />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
                <button
                  onClick={fetchDashboard}
                  className="mt-4 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg"
                >
                  重试
                </button>
              </div>
            ) : (
              <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '发掘球员', value: stats.totalDiscovered, icon: Users, colorKey: 'violet' },
                { label: '球探报告', value: stats.totalReports, icon: FileText, colorKey: 'purple' },
                { label: '报告采纳', value: stats.adoptedReports, icon: Award, colorKey: 'fuchsia' },
                { label: '关注球员', value: stats.followedPlayers, icon: Heart, colorKey: 'pink' },
              ].map((stat, index) => {
                const colors = colorMap[stat.colorKey];
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl ${colors.bg} border ${colors.border} backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 最近报告 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">最近报告</h2>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    暂无报告
                  </div>
                ) : (
                  recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/scout/report/${report.id}`)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-lg font-bold text-violet-300">
                        {report.playerName?.slice(0, 1) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{report.playerName || '未知球员'}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getPotentialColor(report.potentialRating)}`}>
                            {report.potentialRating}级潜力
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          评分 {report.overallRating} · {report.createdAt?.split('T')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {report.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {report.likes}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 可接任务 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">可接任务</h2>
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  任务中心 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    暂无可接任务
                  </div>
                ) : (
                  tasks.filter(t => t.status === 'available').map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {task.region}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {task.ageGroup}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-violet-400 font-bold">¥{task.reward}</p>
                          <p className="text-[10px] text-slate-500">任务奖励</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptTask(task.id, fetchDashboard)}
                        className="w-full mt-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        立即接取
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* 我的报告 */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {allReports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>暂无报告</p>
                  <button
                    onClick={() => { setReportPlayer(null); setActiveTab('players'); }}
                    className="mt-4 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg"
                  >
                    选择球员写报告
                  </button>
                </div>
              ) : (
                allReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-violet-300">
                        {report.playerName?.slice(0, 1) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-bold">{report.playerName || '未知球员'}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPotentialColor(report.potentialRating)}`}>
                            {report.potentialRating}级潜力
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(report.status)}`}>
                            {getStatusText(report.status)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          评分 {report.overallRating} · {report.createdAt?.split('T')[0]}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {report.views} 次浏览
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> {report.likes} 次点赞
                          </span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">
                        查看详情
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 发现球员 - 使用人才库组件 */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <ScoutPlayers
              onPlayerClick={(player) => console.log('查看球员:', player)}
              onWriteReport={handleWriteReport}
            />
          </div>
        )}

        {/* 报告编辑器 */}
        {activeTab === 'editor' && (
          <ScoutReportEditor
            player={reportPlayer || undefined}
            onSave={handleReportSave}
            onPublish={handleReportPublish}
            onBack={handleBackToOverview}
          />
        )}

        {/* 任务中心 */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">任务中心</h1>
            {loading ? (
              <ListItemSkeleton count={4} />
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
                <button
                  onClick={fetchTasks}
                  className="mt-4 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg"
                >
                  重试
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-4" />
                <p>暂无可接任务</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-bold">{task.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {task.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {task.ageGroup}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {task.deadline?.split('T')[0]}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-violet-400 font-bold text-lg">¥{task.reward}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getTaskStatusColor(task.status)}`}>
                          {task.status === 'available' ? '可接取' : task.status === 'accepted' ? '进行中' : '已完成'}
                        </span>
                      </div>
                    </div>
                    {task.status === 'available' && (
                      <button
                        onClick={() => handleAcceptTask(task.id, fetchTasks)}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-xl transition-all"
                      >
                        接取任务
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="scout"
      />
    </DashboardLayout>
  );
};

export default ScoutDashboard;
