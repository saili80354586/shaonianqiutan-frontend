import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CreatePostModal } from '../ScoutMap/SocialFeed';
import { StatsGridSkeleton, ListItemSkeleton } from '../../components/ui/loading';
import ScoutPlayers from './ScoutPlayers';
import ScoutReportEditor from './ScoutReportEditor';
import type { ScoutReportData } from './ScoutReportEditor';
import { scoutApi } from '../../services/api';
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

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  region?: string;
  team?: string;
  potential?: 'S' | 'A' | 'B' | 'C' | 'D';
  isFollowed?: boolean;
}

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  fuchsia: { bg: 'bg-fuchsia-500/10', icon: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  pink: { bg: 'bg-pink-500/10', icon: 'text-pink-400', border: 'border-pink-500/20' },
};

const ScoutDashboard: React.FC = () => {
  const navigate = useNavigate();
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

  // 获取工作台数据
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await scoutApi.getDashboard();
      if (res.success && res.data) {
        // 后端返回 snake_case，前端使用 camelCase，需要转换
        const data = res.data;
        setStats({
          totalDiscovered: data.total_discovered || 0,
          totalReports: data.total_reports || 0,
          publishedReports: data.published_reports || 0,
          adoptedReports: data.adopted_reports || 0,
          followedPlayers: data.followed_players || 0,
        });
        // 转换 recentReports: 从后端获取 Player 对象中的 nickname 作为 playerName
        setRecentReports((data.recent_reports || []).map((r: any) => ({
          id: r.id,
          playerId: r.player_id,
          playerName: r.player?.nickname || r.player?.real_name || '未知球员',
          overallRating: r.overall_rating || 0,
          potentialRating: (r.potential_rating || 'B') as RecentReport['potentialRating'],
          status: (r.status || 'draft') as RecentReport['status'],
          createdAt: r.created_at,
          views: r.views || 0,
          likes: r.likes || 0,
        })));
        // 转换 availableTasks
        setTasks((data.available_tasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          region: t.region || '',
          ageGroup: t.age_group || '',
          deadline: t.deadline,
          reward: t.reward || 0,
          status: (t.status === 'open' ? 'available' : t.status) as ScoutTask['status'],
        })));
      }
    } catch (err: any) {
      console.error('获取工作台数据失败:', err);
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取所有报告
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scoutApi.getReports({ page_size: 50 });
      if (res.success && res.data) {
        setAllReports((res.data.list || []).map((r: any) => ({
          id: r.id,
          playerId: r.player_id,
          playerName: r.player?.nickname || r.player?.real_name || '未知球员',
          overallRating: r.overall_rating || 0,
          potentialRating: (r.potential_rating || 'B') as RecentReport['potentialRating'],
          status: (r.status || 'draft') as RecentReport['status'],
          createdAt: r.created_at,
          views: r.views || 0,
          likes: r.likes || 0,
        })));
      }
    } catch (err: any) {
      console.error('获取报告列表失败:', err);
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
      fetchDashboard();
    }
  }, [activeTab, fetchDashboard, fetchReports]);

  // 处理写报告
  const handleWriteReport = (player: Player) => {
    setReportPlayer(player);
    setActiveTab('editor');
  };

  // 处理报告保存
  const handleReportSave = async (data: ScoutReportData) => {
    try {
      await scoutApi.createReport({
        player_id: parseInt(reportPlayer?.id || '0'),
        overall_rating: data.overallRating,
        potential_rating: data.potentialRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        technical_skills: data.technicalSkills,
        summary: data.summary,
        recommendation: data.recommendation,
        target_club: data.targetClub,
      });
      alert('报告已保存');
    } catch (err: any) {
      console.error('保存报告失败:', err);
      alert(err.message || '保存失败');
    }
  };

  // 处理报告发布
  const handleReportPublish = async (data: ScoutReportData) => {
    try {
      const res = await scoutApi.createReport({
        player_id: parseInt(reportPlayer?.id || '0'),
        overall_rating: data.overallRating,
        potential_rating: data.potentialRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        technical_skills: data.technicalSkills,
        summary: data.summary,
        recommendation: data.recommendation,
        target_club: data.targetClub,
      });
      if (res.success && res.data?.id) {
        await scoutApi.publishReport(res.data.id);
      }
      alert('报告已发布');
      setActiveTab('reports');
      setReportPlayer(null);
      fetchDashboard();
    } catch (err: any) {
      console.error('发布报告失败:', err);
      alert(err.message || '发布失败');
    }
  };

  // 返回概览
  const handleBackToOverview = () => {
    setActiveTab('overview');
    setReportPlayer(null);
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
            onClick={() => { setReportPlayer(null); setActiveTab('editor'); }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            撰写新报告
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
                        onClick={async () => {
                          try {
                            await scoutApi.acceptTask(task.id);
                            alert('接取成功');
                            fetchDashboard();
                          } catch (err: any) {
                            alert(err.message || '接取失败');
                          }
                        }}
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
                    onClick={() => { setReportPlayer(null); setActiveTab('editor'); }}
                    className="mt-4 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg"
                  >
                    撰写第一份报告
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
                  onClick={fetchDashboard}
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
                        onClick={async () => {
                          try {
                            await scoutApi.acceptTask(task.id);
                            alert('接取成功');
                            fetchDashboard();
                          } catch (err: any) {
                            alert(err.message || '接取失败');
                          }
                        }}
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
      </main>

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
