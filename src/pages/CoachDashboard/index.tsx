import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, TrendingUp, Calendar, BarChart3, User, Heart, ClipboardList,
  Home, GraduationCap, Shield, CheckCircle, Clock, ChevronRight, Star,
  Trophy, Activity, Edit3, LayoutDashboard, Inbox, Menu, Settings, Mail, X
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard';
import type { SidebarConfig } from '../../components/dashboard/types';
import { CreatePostModal } from '../ScoutMap/SocialFeed';
import { coachApi } from '../../services/club';
import { clubInvitationApi } from '../../services/api';
import { useAuthStore } from '../../store';
import RoleSwitcher from '../../components/RoleSwitcher';
import ReactECharts from '../../components/charts/ReactECharts';
import WeeklyReports from '../ClubDashboard/WeeklyReports';
import MatchManagement from './MatchManagement';
import FollowedPlayers from './FollowedPlayers';
import TrainingNotes from './TrainingNotes';
import PlayerProgress from './PlayerProgress';
import MyTeams from './MyTeams';
import CoachPhysicalTestEntry from './CoachPhysicalTestEntry';
import CoachProfile from './CoachProfile';

interface CoachInfo {
  id: string;
  name: string;
  avatar?: string;
  licenseType: string;
  licenseNumber: string;
  coachingYears: number;
  specialties: string[];
  verified: boolean;
}

interface PendingWeeklyReport {
  id: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  weekStart: string;
  weekEnd: string;
  status: string;
}

interface PendingMatchSummary {
  id: number;
  teamId: number;
  teamName: string;
  matchName: string;
  matchDate: string;
  opponent: string;
  ourScore: number;
  oppScore: number;
  result: string;
  status: string;
}

interface DashboardStats {
  followedPlayers: number;
  totalReports: number;
  trainingNotes: number;
  monthlyViews: number;
  teamCount: number;
  totalPlayers: number;
  weeklyReportSubmitRate: number;
  weeklyReportTotal: number;
  weeklyReportSubmitted: number;
  pendingWeeklyReports: number;
  pendingMatchSummaries: number;
  recentPendingWeeklyReports: PendingWeeklyReport[];
  recentPendingMatchSummaries: PendingMatchSummary[];
}

interface FollowedPlayer {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  position: string;
  clubName: string;
  reportCount: number;
  lastReportDate?: string;
  overallRating: number;
  isStarred: boolean;
}

interface RecentActivity {
  id: string;
  type: 'view_report' | 'add_note' | 'follow_player';
  playerName: string;
  description: string;
  time: string;
}

interface ClubInvitation {
  id: number;
  invite_code: string;
  club_id: number;
  club_name: string;
  target_role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

type ActiveTab = 'overview' | 'players' | 'notes' | 'progress' | 'teams' | 'physical-tests' | 'weekly-reports' | 'match-reports' | 'profile';

const parseStringArray = (value?: string | string[]) => {
  let parsed: unknown = value;
  for (let i = 0; i < 2 && typeof parsed === 'string'; i += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
};

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    followedPlayers: 0, totalReports: 0, trainingNotes: 0, monthlyViews: 0,
    teamCount: 0, totalPlayers: 0, weeklyReportSubmitRate: 0, weeklyReportTotal: 0, weeklyReportSubmitted: 0,
    pendingWeeklyReports: 0, pendingMatchSummaries: 0,
    recentPendingWeeklyReports: [], recentPendingMatchSummaries: []
  });
  const [followedPlayers, setFollowedPlayers] = useState<FollowedPlayer[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingClubInvitations, setPendingClubInvitations] = useState<ClubInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 切换标签时关闭侧边栏
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const profileRes = await coachApi.getProfile();
      if (profileRes.data?.success && profileRes.data?.data) {
        const p = profileRes.data.data;
        const coach = p.coach || {};
        const profileUser = p.user || p.User || coach.user || coach.User || user || {};
        setCoachInfo({
          id: String(coach.id || profileUser.id || ''),
          name: profileUser.name || profileUser.nickname || '教练',
          avatar: profileUser.avatar,
          licenseType: coach.license_type || coach.licenseType || '',
          licenseNumber: coach.license_number || coach.licenseNumber || '',
          coachingYears: coach.coaching_years || coach.coachingYears || 0,
          specialties: parseStringArray(coach.specialties),
          verified: Boolean(coach.verified)
        });
      }
      const dashboardRes = await coachApi.getDashboard();
      if (dashboardRes.data?.success && dashboardRes.data?.data) {
        const { stats: ds, recentActivities: acts } = dashboardRes.data.data;
        setStats({
          followedPlayers: ds.followedPlayers || 0, totalReports: ds.totalReports || 0,
          trainingNotes: ds.trainingNotes || 0, monthlyViews: ds.monthlyViews || 0,
          teamCount: ds.teamCount || 0, totalPlayers: ds.totalPlayers || 0,
          weeklyReportSubmitRate: ds.weeklyReportSubmitRate || 0,
          weeklyReportTotal: ds.weeklyReportTotal || 0,
          weeklyReportSubmitted: ds.weeklyReportSubmitted || 0,
          pendingWeeklyReports: ds.pendingWeeklyReports || 0, pendingMatchSummaries: ds.pendingMatchSummaries || 0,
          recentPendingWeeklyReports: ds.recentPendingWeeklyReports || [],
          recentPendingMatchSummaries: ds.recentPendingMatchSummaries || []
        });
        setRecentActivities((acts || []).map((a: any) => ({
          id: String(a.id), type: a.type, playerName: a.playerName, description: a.description, time: a.time
        })));
      }
      const playersRes = await coachApi.getFollowedPlayers({ pageSize: 5 });
      if (playersRes.data?.success && playersRes.data?.data) {
        setFollowedPlayers(playersRes.data.data.list.slice(0, 5).map((p: any) => ({
          id: String(p.id), name: p.name, avatar: p.avatar, age: p.age || 0,
          position: p.positionName || p.position, clubName: p.clubName || '',
          reportCount: p.reportCount || 0, lastReportDate: p.lastReportDate,
          overallRating: p.overallRating || 0, isStarred: p.isStarred
        })));
      }
      // 加载待处理的俱乐部邀请
      const inviteRes = await clubInvitationApi.getMyClubInvitations();
      if (inviteRes.data?.success && inviteRes.data?.data) {
        setPendingClubInvitations(inviteRes.data.data || []);
      }
    } catch (error) { console.error('加载教练数据失败:', error); }
    setLoading(false);
  };

  const handleAcceptClubInvitation = async (code: string) => {
    try {
      const res = await clubInvitationApi.acceptClubInvitation(code);
      if (res.data?.success) {
        setPendingClubInvitations(prev => prev.filter(inv => inv.invite_code !== code));
        // 刷新页面以获取更新后的俱乐部关联数据
        loadDashboardData();
      } else {
        alert(res.data?.error?.message || '接受邀请失败');
      }
    } catch (error: any) {
      alert(error?.response?.data?.error?.message || '接受邀请失败，请稍后重试');
    }
  };

  const handleRejectClubInvitation = async (code: string) => {
    try {
      const res = await clubInvitationApi.rejectClubInvitation(code);
      if (res.data?.success) {
        setPendingClubInvitations(prev => prev.filter(inv => inv.invite_code !== code));
      } else {
        alert(res.data?.error?.message || '拒绝邀请失败');
      }
    } catch (error: any) {
      alert(error?.response?.data?.error?.message || '拒绝邀请失败，请稍后重试');
    }
  };

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = { '前锋': 'bg-red-500/20 text-red-300', '中场': 'bg-blue-500/20 text-blue-300', '后卫': 'bg-green-500/20 text-green-300', '门将': 'bg-yellow-500/20 text-yellow-300' };
    return map[pos] || 'bg-gray-500/20 text-gray-300';
  };
  const getRatingColor = (rating: number) => { if (rating >= 85) return 'text-emerald-400'; if (rating >= 75) return 'text-blue-400'; if (rating >= 65) return 'text-yellow-400'; return 'text-gray-400'; };
  const getActivityIcon = (type: string) => { switch (type) { case 'view_report': return FileText; case 'add_note': return ClipboardList; case 'follow_player': return Heart; default: return CheckCircle; } };
  const getMatchResultColor = (result: string) => { switch (result) { case 'win': return 'text-green-400'; case 'lose': return 'text-red-400'; default: return 'text-gray-400'; } };
  const getMatchResultLabel = (result: string) => { switch (result) { case 'win': return '胜'; case 'lose': return '负'; default: return '平'; } };
  const getWeekLabel = (weekStart: string) => { const d = new Date(weekStart); const e = new Date(d); e.setDate(d.getDate() + 6); return `${d.getMonth() + 1}/${d.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`; };

  // 侧边栏配置
  const coachSidebarConfig: SidebarConfig = {
    roleName: '教练工作台',
    themeColor: '#f59e0b',
    dashboardPath: '/coach/dashboard',
    profilePath: user?.id ? `/coach/${user.id}` : undefined,
    showCreatePost: true,
    businessGroups: [
      {
        key: 'teams',
        label: '球队管理',
        icon: Shield,
        items: [
          { id: 'teams', label: '我的球队', icon: Shield },
          { id: 'weekly-reports', label: '周报审核', icon: ClipboardList },
          { id: 'match-reports', label: '比赛点评', icon: Trophy },
        ],
      },
      {
        key: 'players',
        label: '球员相关',
        icon: Users,
        items: [
          { id: 'players', label: '关注球员', icon: Heart },
          { id: 'notes', label: '训练笔记', icon: FileText },
          { id: 'progress', label: '进度跟踪', icon: TrendingUp },
          { id: 'physical-tests', label: '体测数据', icon: BarChart3 },
        ],
      },
    ],
  };

  // 获取当前激活的分组
  const getActiveGroupKey = (): string | undefined => {
    if (['teams', 'weekly-reports', 'match-reports'].includes(activeTab)) return 'teams';
    if (['players', 'notes', 'progress', 'physical-tests'].includes(activeTab)) return 'players';
    return undefined;
  };

  // 获取页面标题
  const getPageTitle = (): string => {
    const titles: Record<string, string> = {
      overview: '概览',
      teams: '我的球队',
      'weekly-reports': '周报审核',
      'match-reports': '比赛点评',
      players: '关注球员',
      notes: '训练笔记',
      progress: '进度跟踪',
      'physical-tests': '体测数据',
      profile: '个人资料',
    };
    return titles[activeTab] || '教练工作台';
  };

  // 渲染主内容
  const renderContent = () => {
    switch (activeTab) {
      case 'players': return <FollowedPlayers onBack={() => handleTabChange('overview')} />;
      case 'notes': return <TrainingNotes onBack={() => handleTabChange('overview')} />;
      case 'progress': return <PlayerProgress onBack={() => handleTabChange('overview')} />;
      case 'teams': return <MyTeams onBack={() => handleTabChange('overview')} />;
      case 'physical-tests': return <CoachPhysicalTestEntry onBack={() => handleTabChange('overview')} />;
      case 'weekly-reports': return <WeeklyReports onBack={() => handleTabChange('overview')} userRole="coach" />;
      case 'match-reports': return <MatchManagement onBack={() => handleTabChange('overview')} />;
      case 'profile': return <CoachProfile onBack={() => handleTabChange('overview')} />;
      default: return null;
    }
  };

  return (
    <DashboardLayout
      sidebarConfig={coachSidebarConfig}
      activeItemId={activeTab === 'overview' ? undefined : activeTab}
      activeGroupKey={getActiveGroupKey()}
      pageTitle={getPageTitle()}
      onItemClick={(item) => {
        if (item.id) {
          handleTabChange(item.id as ActiveTab);
        }
      }}
      onCreatePost={() => setIsCreateOpen(true)}
      headerActions={
        activeTab === 'overview' ? (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/settings')} className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors"><Settings className="w-4 h-4" /> 编辑主页</button>
            <button onClick={() => window.open(`/coach/${user?.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors"><Home className="w-4 h-4" /> 主页预览</button>
          </div>
        ) : undefined
      }
    >
      {activeTab === 'overview' ? (
        <>
        {/* 移动端头部 */}
        <header className="lg:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-white">教练工作台</span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-sm font-medium">
            {coachInfo?.name?.slice(0, 1) || '教'}
          </div>
        </header>

        {/* 桌面端头部 */}
        <header className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">欢迎回来，{coachInfo?.name || '教练'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400">{coachInfo?.licenseType}教练员 · {coachInfo?.coachingYears}年执教经验</p>
              {coachInfo?.verified && <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs"><Shield className="w-3 h-3" /> 已认证</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 text-[#39ff14] rounded-xl transition-colors"><Edit3 className="w-4 h-4" /> 发布动态</button>
            <button onClick={() => navigate('/settings')} className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors"><Settings className="w-4 h-4" /> 编辑主页</button>
            <button onClick={() => window.open(`/coach/${user?.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors"><Home className="w-4 h-4" /> 主页预览</button>
            <button onClick={() => navigate(`/coach/${user?.id}`)} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-medium hover:opacity-90 transition-opacity">{coachInfo?.name?.slice(0, 1) || '教'}</button>
          </div>
        </header>

        {/* 待处理俱乐部邀请 */}
        {!loading && pendingClubInvitations.length > 0 && (
          <div className="mb-6 sm:mb-8 space-y-3">
            {pendingClubInvitations.map(inv => (
              <div key={inv.id} className="bg-[#1a1f2e] rounded-2xl border border-amber-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      <span className="text-amber-400">{inv.club_name}</span> 邀请您加入俱乐部
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      邀请角色：{inv.target_role || '教练'} · 有效期至 {new Date(inv.expires_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRejectClubInvitation(inv.invite_code)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-colors"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleAcceptClubInvitation(inv.invite_code)}
                    className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-xl transition-colors"
                  >
                    接受邀请
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">{[1,2,3,4].map(i => <div key={i} className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 animate-pulse h-28" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard icon={ClipboardList} label="待审核周报" value={stats.pendingWeeklyReports} trend={stats.pendingWeeklyReports > 0 ? '需要处理' : '暂无待审'} color="amber" onClick={() => stats.pendingWeeklyReports > 0 && handleTabChange('weekly-reports')} clickable={stats.pendingWeeklyReports > 0} />
            <StatCard icon={Trophy} label="待点评比赛" value={stats.pendingMatchSummaries} trend={stats.pendingMatchSummaries > 0 ? '需要处理' : '暂无待评'} color="blue" onClick={() => stats.pendingMatchSummaries > 0 && handleTabChange('match-reports')} clickable={stats.pendingMatchSummaries > 0} />
            <StatCard icon={Shield} label="我的球队" value={stats.teamCount} trend="执教中" color="emerald" onClick={() => handleTabChange('teams')} clickable />
            <StatCard icon={Users} label="管理球员" value={stats.totalPlayers} trend="在训" color="purple" onClick={() => handleTabChange('teams')} clickable />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <QuickActionCard icon={Shield} title="我的球队" desc={`管理 ${stats.teamCount} 支执教球队`} action="进入管理" onClick={() => handleTabChange('teams')} color="emerald" />
          <QuickActionCard icon={ClipboardList} title="周报审核" desc={`${stats.pendingWeeklyReports} 份周报待审核`} action="去审核" onClick={() => handleTabChange('weekly-reports')} color="amber" />
          <QuickActionCard icon={Trophy} title="比赛点评" desc={`${stats.pendingMatchSummaries} 场比赛待点评`} action="去点评" onClick={() => handleTabChange('match-reports')} color="blue" />
        </div>

        {/* 周报提交率 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={() => handleTabChange('weekly-reports')}
            className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-4 hover:border-emerald-500/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm text-gray-400">本周周报提交率</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stats.weeklyReportSubmitRate >= 80 ? 'bg-emerald-500/10 text-emerald-400' : stats.weeklyReportSubmitRate >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                {stats.weeklyReportSubmitRate >= 80 ? '达标' : stats.weeklyReportSubmitRate >= 50 ? '需跟进' : '严重滞后'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1" style={{ height: 80 }}>
                <ReactECharts
                  option={{
                    series: [{
                      type: 'gauge',
                      startAngle: 180,
                      endAngle: 0,
                      min: 0,
                      max: 100,
                      radius: '110%',
                      center: ['50%', '70%'],
                      itemStyle: { color: stats.weeklyReportSubmitRate >= 80 ? '#10b981' : stats.weeklyReportSubmitRate >= 50 ? '#f59e0b' : '#ef4444' },
                      progress: { show: true, width: 10, roundCap: true },
                      pointer: { show: false },
                      axisLine: { lineStyle: { width: 10, color: [[1, '#1f2937']] } },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      detail: {
                        valueAnimation: true,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#fff',
                        offsetCenter: [0, '-10%'],
                        formatter: '{value}%',
                      },
                      data: [{ value: Math.round(stats.weeklyReportSubmitRate) }],
                    }],
                  }}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.weeklyReportSubmitted}</div>
                <div className="text-xs text-gray-500">/ {stats.weeklyReportTotal} 已提交</div>
              </div>
            </div>
          </div>
          <InsightCard
            label="待审核周报"
            value={stats.pendingWeeklyReports}
            subtext="份周报待处理"
            trend={stats.pendingWeeklyReports > 0 ? '需处理' : '已清空'}
            trendUp={stats.pendingWeeklyReports === 0}
            color="amber"
            onClick={() => handleTabChange('weekly-reports')}
          />
          <InsightCard
            label="待点评比赛"
            value={stats.pendingMatchSummaries}
            subtext="场比赛待点评"
            trend={stats.pendingMatchSummaries > 0 ? '需处理' : '已清空'}
            trendUp={stats.pendingMatchSummaries === 0}
            color="blue"
            onClick={() => handleTabChange('match-reports')}
          />
          <InsightCard
            label="关注球员"
            value={stats.followedPlayers}
            subtext="名球员已关注"
            trend={stats.followedPlayers > 0 ? '持续跟进' : '暂无关注'}
            trendUp={stats.followedPlayers > 0}
            color="purple"
            onClick={() => handleTabChange('players')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* 待审核周报 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5 text-amber-400" /></div>
                <div><h3 className="text-base font-semibold text-white">待审核周报</h3><p className="text-xs text-gray-400">最近 5 条</p></div>
              </div>
              {stats.pendingWeeklyReports > 0 && <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">{stats.pendingWeeklyReports} 待审</span>}
            </div>
            <div className="p-4">
              {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div> :
              stats.recentPendingWeeklyReports.length === 0 ? (
                <div className="py-8 text-center"><CheckCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 text-sm">暂无待审核周报</p></div>
              ) : (
                <div className="space-y-3">
                  {stats.recentPendingWeeklyReports.map(r => (
                    <div key={r.id} onClick={() => handleTabChange('weekly-reports')} className="p-4 bg-[#0f1419] rounded-xl border border-gray-800 hover:border-amber-500/30 cursor-pointer transition-all">
                      <div className="flex items-center justify-between mb-2"><span className="font-medium text-white">{r.playerName}</span><span className="text-xs text-gray-400">{r.teamName}</span></div>
                      <div className="flex items-center gap-3 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{getWeekLabel(r.weekStart)}</span><span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">待审核</span></div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => handleTabChange('weekly-reports')} className="w-full mt-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-dashed border-gray-700 hover:border-amber-500/30 rounded-xl transition-colors">查看全部周报 →</button>
            </div>
          </div>

          {/* 待点评比赛 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center"><Trophy className="w-5 h-5 text-blue-400" /></div>
                <div><h3 className="text-base font-semibold text-white">待点评比赛</h3><p className="text-xs text-gray-400">最近 5 条</p></div>
              </div>
              {stats.pendingMatchSummaries > 0 && <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">{stats.pendingMatchSummaries} 待评</span>}
            </div>
            <div className="p-4">
              {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div> :
              stats.recentPendingMatchSummaries.length === 0 ? (
                <div className="py-8 text-center"><CheckCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 text-sm">暂无待点评比赛</p></div>
              ) : (
                <div className="space-y-3">
                  {stats.recentPendingMatchSummaries.map(m => (
                    <div key={m.id} onClick={() => handleTabChange('match-reports')} className="p-4 bg-[#0f1419] rounded-xl border border-gray-800 hover:border-blue-500/30 cursor-pointer transition-all">
                      <div className="flex items-center justify-between mb-2"><span className="font-medium text-white">{m.matchName}</span><span className={`text-xs font-medium ${getMatchResultColor(m.result)}`}>{getMatchResultLabel(m.result)}</span></div>
                      <div className="flex items-center gap-3 text-xs text-gray-500"><span>{m.teamName} vs {m.opponent}</span><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">待点评</span></div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => handleTabChange('match-reports')} className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-dashed border-gray-700 hover:border-blue-500/30 rounded-xl transition-colors">查看全部比赛 →</button>
            </div>
          </div>

          {/* 最近动态 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800">
            <div className="p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-purple-400" /></div>
                <div><h3 className="text-base font-semibold text-white">最近动态</h3><p className="text-xs text-gray-400">个人操作记录</p></div>
              </div>
            </div>
            <div className="p-4">
              {loading ? <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}</div> :
              recentActivities.length === 0 ? (
                <div className="py-8 text-center"><Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 text-sm">暂无动态</p></div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map(a => { const Icon = getActivityIcon(a.type); return (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-400" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm text-white"><span className="font-medium">{a.playerName}</span><span className="text-gray-400"> · {a.description}</span></p><p className="text-xs text-gray-500 mt-1">{a.time}</p></div>
                    </div>
                  ); })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 关注球员 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><Heart className="w-5 h-5 text-red-400" /></div>
              <div><h3 className="text-lg font-semibold text-white">关注球员</h3><p className="text-xs text-gray-400">重点关注的人才库</p></div>
            </div>
            <button onClick={() => handleTabChange('players')} className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1">查看全部 <ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="p-6">
            {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div> :
            followedPlayers.length === 0 ? (
              <div className="py-8 text-center"><Heart className="w-10 h-10 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 text-sm">暂无关注球员</p></div>
            ) : (
              <div className="space-y-3">
                {followedPlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-[#0f1419] rounded-xl hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">{p.name[0]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{p.name}</span>
                          {p.isStarred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                          <span className={`px-2 py-0.5 rounded text-xs ${getPositionColor(p.position)}`}>{p.position}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">{p.age}岁 · {p.clubName || '未知俱乐部'} · {p.reportCount} 份报告</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><div className={`text-lg font-bold ${getRatingColor(p.overallRating)}`}>{p.overallRating}</div><div className="text-xs text-gray-500">综合评分</div></div>
                      <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>) : (
        renderContent()
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="coach"
      />
    </DashboardLayout>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ icon: Icon, label, value, trend, color, onClick, clickable }: any) => {
  const colors: Record<string, string> = {
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400',
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
  };
  return (
    <div onClick={onClick} className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 border border-gray-800 ${clickable ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/10 rounded-xl"><Icon className="w-6 h-6" /></div>
        <span className="text-xs text-gray-400">{trend}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};

const QuickActionCard = ({ icon: Icon, title, desc, action, onClick, color }: any) => {
  const borderMap: Record<string, string> = {
    emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
    amber: 'hover:border-amber-500/50 hover:shadow-amber-500/20',
    blue: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
  };
  return (
    <div onClick={onClick} className={`bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 cursor-pointer transition-all hover:shadow-lg ${borderMap[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/20`}><Icon className={`w-6 h-6 text-${color}-400`} /></div>
        <span className="text-orange-400 text-sm font-medium">{action} →</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
};

const InsightCard = ({ label, value, subtext, trend, trendUp, color, onClick }: any) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'hover:border-emerald-500/30' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'hover:border-amber-500/30' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'hover:border-blue-500/30' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'hover:border-purple-500/30' },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div onClick={onClick} className={`bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800 cursor-pointer transition-all hover:shadow-lg ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${trendUp ? c.bg : 'bg-red-500/10'} ${trendUp ? c.text : 'text-red-400'}`}>{trend}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-sm text-gray-500">{subtext}</span>
      </div>
    </div>
  );
};

export default CoachDashboard;
