import React, { useState, useEffect, Suspense, lazy, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clubApi } from '../../services/api';
import {
  Users, FileText, Calendar, BarChart3, Plus,
  ChevronRight, CheckCircle,
  Shield, Award, Zap, PieChart, CreditCard,
  ClipboardList, Activity, Globe, Trophy, Bell, Edit3,
  Menu, type LucideIcon
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard';
import type { SidebarConfig } from '../../components/dashboard/types';
import { CreatePostModal } from '../ScoutMap/SocialFeed';

// 子组件
const PlayerManagement = lazy(() => import('./PlayerManagement'));
const PlayerDetail = lazy(() => import('./PlayerDetail'));
const CoachManagement = lazy(() => import('./CoachManagement'));
const TeamManagement = lazy(() => import('./TeamManagement'));
const TeamDetail = lazy(() => import('./TeamDetail'));
const BatchOrders = lazy(() => import('./BatchOrders'));
const BatchOrder = lazy(() => import('./BatchOrder'));
const OrderManagement = lazy(() => import('./OrderManagement'));
const Analytics = lazy(() => import('./Analytics'));
const ClubStats = lazy(() => import('./ClubStats'));
const ClubHomeEditor = lazy(() => import('./ClubHomeEditor'));
const ClubHomePage = lazy(() => import('./ClubHomePage'));
const PhysicalTests = lazy(() => import('./PhysicalTests'));
const CreatePhysicalTest = lazy(() => import('./CreatePhysicalTest'));
const PhysicalTestRecord = lazy(() => import('./PhysicalTestRecord'));
const PhysicalTestReport = lazy(() => import('./PhysicalTestReport'));
const WeeklyReports = lazy(() => import('./WeeklyReports'));
const MatchReports = lazy(() => import('./MatchReports'));
const CoachDetail = lazy(() => import('./CoachDetail'));
const PlayerSelection = lazy(() => import('./PlayerSelection'));
const TrainingPlans = lazy(() => import('./TrainingPlans'));
const MatchCalendar = lazy(() => import('./MatchCalendar'));
const AdminOperationLogs = lazy(() => import('./AdminOperationLogs'));
const ClubAnnouncements = lazy(() => import('./ClubAnnouncements'));
const ClubActivities = lazy(() => import('./ClubActivities'));

interface ClubInfo {
  id: string;
  clubName: string;
  clubShortName: string;
  clubLogo?: string;
  clubType: string;
  province: string;
  city: string;
  contactName: string;
  verified: boolean;
  clubRole?: 'admin' | 'coach';
}

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  jerseyNumber: string;
  reportCount: number;
  status: 'active' | 'inactive';
}

interface Notification {
  id: number;
  title: string;
  content?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

interface ApiPlayerItem {
  id: number;
  name: string;
  age?: number;
  positionName?: string;
  position?: string;
  totalReports?: number;
}

const DashboardTabLoader = () => (
  <div className="min-h-[360px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
    <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-slate-400">加载中...</p>
  </div>
);

const FullPageTabLoader = () => (
  <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-6">
    <DashboardTabLoader />
  </div>
);

const LazyTabBoundary = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<DashboardTabLoader />}>{children}</Suspense>
);

const LazyFullPageBoundary = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<FullPageTabLoader />}>{children}</Suspense>
);

const WeeklyReportProgress = ({ value }: { value: number }) => {
  const clampedValue = Math.max(0, Math.min(Math.round(value), 100));
  const color = clampedValue >= 80 ? '#10b981' : clampedValue >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-white tracking-tight">{clampedValue}</span>
        <span className="text-sm font-semibold text-slate-400">%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const ClubDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'team-detail' | 'players' | 'player-detail' | 'coaches' | 'coach-detail' | 'orders' | 'order-create' | 'order-management' | 'analytics' | 'stats' | 'home-editor' | 'home-preview' | 'physical-tests' | 'create-physical-test' | 'physical-test-record' | 'physical-test-report' | 'weekly-reports' | 'match-management' | 'player-selection' | 'training-plans' | 'match-calendar' | 'activities' | 'admin-logs' | 'announcements'>('overview');
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
  const [currentCoachId, setCurrentCoachId] = useState<number | null>(null);
  const [playerDetailBackTab, setPlayerDetailBackTab] = useState<'players' | 'team-detail'>('players');
  const [playerListFilters, setPlayerListFilters] = useState<{ position?: string; ageGroup?: string } | null>(null);
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [stats, setStats] = useState({ totalPlayers: 0, activeOrders: 0, completedReports: 0, monthlySpending: 0 });
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState({
    weeklyReportSubmitRate: 0,
    weeklyReportTotal: 0,
    weeklyReportSubmitted: 0,
    pendingMatchSummaries: 0,
    pendingPhysicalTestRecords: 0,
    pendingOrders: 0,
  });
  const [announcements, setAnnouncements] = useState<{ id: number; title: string; content: string; isPinned: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 切换标签时关闭侧边栏
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  useEffect(() => {
    // 检查 URL 参数是否指定打开 home-preview
    const tabParam = searchParams.get('tab');
    if (tabParam === 'home-preview') {
      handleTabChange('home-preview');
    }
  }, [searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 获取俱乐部资料
      const profileRes = await clubApi.getProfile();
      if (profileRes.data?.success && profileRes.data?.data) {
        const pdata = profileRes.data.data;
        setClubInfo({
          id: String(pdata.id),
          clubName: pdata.name,
          clubShortName: pdata.name.slice(0, 6),
          clubLogo: pdata.logo,
          clubType: 'youth',
          province: pdata.address?.split(' ')[0] || '',
          city: '',
          contactName: pdata.contactName,
          verified: true,
          clubRole: pdata.clubRole || 'admin'
        });
      }

      // 获取工作台数据
      const dashboardRes = await clubApi.getDashboard();
      if (dashboardRes.data?.success && dashboardRes.data?.data) {
        const { overview } = dashboardRes.data.data;
        setStats({
          totalPlayers: overview.totalPlayers || 0,
          activeOrders: overview.pendingOrders || 0,
          completedReports: overview.completedOrders || 0,
          monthlySpending: Number(overview.monthlySpending || 0)
        });

        const ins = overview.insights || {};
        setInsights({
          weeklyReportSubmitRate: ins.weeklyReportSubmitRate || 0,
          weeklyReportTotal: ins.weeklyReportTotal || 0,
          weeklyReportSubmitted: ins.weeklyReportSubmitted || 0,
          pendingMatchSummaries: ins.pendingMatchSummaries || 0,
          pendingPhysicalTestRecords: ins.pendingPhysicalTestRecords || 0,
          pendingOrders: ins.pendingOrders || 0,
        });

        // 获取球员列表
        const playersRes = await clubApi.getPlayers({ pageSize: 5 });
        if (playersRes.data?.success && playersRes.data?.data) {
          setRecentPlayers(
            playersRes.data.data.list.slice(0, 5).map((p: ApiPlayerItem) => ({
              id: String(p.id),
              name: p.name,
              age: p.age || 0,
              position: p.positionName || p.position,
              jerseyNumber: '-',
              reportCount: p.totalReports || 0,
              status: 'active' as const
            }))
          );
        }

        // 获取俱乐部动态通知
        const notifyRes = await clubApi.getClubNotifications();
        if (notifyRes.data?.success && Array.isArray(notifyRes.data?.data)) {
          setNotifications(notifyRes.data.data);
        }

        // 获取公告
        const annRes = await clubApi.getAnnouncements();
        if (annRes.data?.success && Array.isArray(annRes.data?.data)) {
          setAnnouncements(annRes.data.data);
        }
      }
    } catch (error) {
      console.error('加载俱乐部数据失败:', error);
    }
    setLoading(false);
  };

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = {
      '前锋': 'bg-red-500/15 text-red-300 border-red-500/25',
      '中场': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
      '后卫': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
      '门将': 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    };
    return map[pos] || 'bg-slate-500/15 text-slate-300 border-slate-500/25';
  };

  const isAdmin = clubInfo?.clubRole === 'admin';

  // 侧边栏配置
  const clubSidebarConfig: SidebarConfig = {
    roleName: '俱乐部后台',
    themeColor: '#10b981',
    dashboardPath: '/club/dashboard',
    profilePath: clubInfo?.id ? `/clubs/${clubInfo.id}` : undefined,
    profileSubItems: [
      { id: 'club-profile-edit', label: '编辑资料', icon: Edit3, path: '/club/profile' },
    ],
    showCreatePost: true,
    businessGroups: [
      {
        key: 'teams',
        label: '球队与球员',
        icon: Shield,
        items: [
          { id: 'teams', label: '球队管理', icon: Shield },
          { id: 'match-management', label: '比赛管理', icon: Trophy },
          { id: 'weekly-reports', label: '周报管理', icon: ClipboardList },
          { id: 'players', label: '球员管理', icon: Users },
          { id: 'coaches', label: '教练管理', icon: Award },
          { id: 'player-selection', label: '选材决策', icon: Award },
        ],
      },
      {
        key: 'orders',
        label: '订单与数据',
        icon: FileText,
        items: [
          { id: 'orders', label: '批量订单', icon: FileText },
          { id: 'order-management', label: '订单管理', icon: ClipboardList },
          { id: 'analytics', label: '数据分析', icon: BarChart3 },
          { id: 'stats', label: '数据统计', icon: PieChart },
        ],
      },
      {
        key: 'ops',
        label: '运营工具',
        icon: Activity,
        items: [
          { id: 'training-plans', label: '训练计划', icon: Activity },
          { id: 'match-calendar', label: '赛程日历', icon: Calendar },
          { id: 'activities', label: '活动管理', icon: Calendar },
          { id: 'home-editor', label: '主页编辑', icon: Globe },
          { id: 'announcements', label: '公告管理', icon: Bell },
          ...(isAdmin ? [{ id: 'admin-logs', label: '操作日志', icon: FileText }] : []),
        ],
      },
    ],
  };

  // 获取当前激活的分组
  const getActiveGroupKey = (): string | undefined => {
    if (['teams', 'match-management', 'weekly-reports', 'players', 'coaches', 'coach-detail', 'player-selection'].includes(activeTab)) return 'teams';
    if (['orders', 'order-management', 'analytics', 'stats'].includes(activeTab)) return 'orders';
    if (['training-plans', 'match-calendar', 'activities', 'home-editor', 'announcements', 'admin-logs'].includes(activeTab)) return 'ops';
    return undefined;
  };

  // 获取页面标题
  const getPageTitle = (): string => {
    const titles: Record<string, string> = {
      overview: '概览',
      teams: '球队管理',
      'team-detail': '球队详情',
      players: '球员管理',
      'player-detail': '球员详情',
      coaches: '教练管理',
      'coach-detail': '教练详情',
      orders: '批量订单',
      'order-create': '新建订单',
      'order-management': '订单管理',
      analytics: '数据分析',
      stats: '数据统计',
      'home-editor': '主页编辑',
      'home-preview': '主页预览',
      'physical-tests': '体测管理',
      'create-physical-test': '新建体测',
      'physical-test-record': '体测记录',
      'physical-test-report': '体测报告',
      'weekly-reports': '周报管理',
      'match-management': '比赛管理',
      'player-selection': '选材决策',
      'training-plans': '训练计划',
      'match-calendar': '赛程日历',
      activities: '活动管理',
      'admin-logs': '操作日志',
      announcements: '公告管理',

    };
    return titles[activeTab] || '俱乐部后台';
  };

  // 提前返回的子页面（不使用 DashboardLayout）
  if (activeTab === 'team-detail') {
    return (
      <LazyFullPageBoundary>
        <TeamDetail teamId={currentTeamId || 0} onBack={() => handleTabChange('teams')} isAdmin={isAdmin} onViewDetail={(id) => { setCurrentPlayerId(id); setPlayerDetailBackTab('team-detail'); handleTabChange('player-detail'); }} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'player-detail') {
    return (
      <LazyFullPageBoundary>
        <PlayerDetail playerId={currentPlayerId || 0} onBack={() => handleTabChange(playerDetailBackTab)} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'coach-detail') {
    return (
      <LazyFullPageBoundary>
        <CoachDetail coachId={currentCoachId || 0} onBack={() => handleTabChange('coaches')} isAdmin={isAdmin} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'order-create') {
    return (
      <LazyFullPageBoundary>
        <BatchOrder onBack={() => handleTabChange('orders')} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'home-preview') {
    if (!clubInfo) {
      return (
        <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">加载中...</p>
          </div>
        </div>
      );
    }
    return (
      <LazyFullPageBoundary>
        <ClubHomePage clubId={Number(clubInfo.id) || 0} onBack={() => handleTabChange('home-editor')} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'create-physical-test') {
    return (
      <LazyFullPageBoundary>
        <CreatePhysicalTest onBack={() => handleTabChange('physical-tests')} onSuccess={() => handleTabChange('physical-tests')} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'physical-test-record') {
    return (
      <LazyFullPageBoundary>
        <PhysicalTestRecord testId={currentTestId} onBack={() => handleTabChange('physical-tests')} />
      </LazyFullPageBoundary>
    );
  }
  if (activeTab === 'physical-test-report') {
    return (
      <LazyFullPageBoundary>
        <PhysicalTestReport testId={currentTestId} onBack={() => handleTabChange('physical-tests')} />
      </LazyFullPageBoundary>
    );
  }

  // 渲染主内容区域
  const renderMainContent = () => {
    switch (activeTab) {
      case 'teams':
        return <TeamManagement onBack={() => handleTabChange('overview')} onViewTeam={(id) => { setCurrentTeamId(id); handleTabChange('team-detail'); }} isAdmin={isAdmin} clubId={Number(clubInfo?.id) || 0} />;
      case 'players':
        return <PlayerManagement
          onBack={() => { setPlayerListFilters(null); handleTabChange('overview'); }}
          onViewDetail={(id) => { setCurrentPlayerId(id); setPlayerDetailBackTab('players'); handleTabChange('player-detail'); }}
          isAdmin={isAdmin}
          initialPositionFilter={playerListFilters?.position}
          initialAgeGroupFilter={playerListFilters?.ageGroup}
          clubId={Number(clubInfo?.id) || 0}
        />;
      case 'coaches':
        return <CoachManagement
          onBack={() => handleTabChange('overview')}
          onViewDetail={(id) => { setCurrentCoachId(id); handleTabChange('coach-detail'); }}
          isAdmin={isAdmin}
          clubId={Number(clubInfo?.id) || 0}
        />;
      case 'orders':
        return <BatchOrders onBack={() => handleTabChange('overview')} onCreateNew={() => handleTabChange('order-create')} />;
      case 'order-management':
        return <OrderManagement onBack={() => handleTabChange('overview')} />;
      case 'analytics':
        return <Analytics onBack={() => handleTabChange('overview')} onDrillDown={(filters) => { setPlayerListFilters(filters); handleTabChange('players'); }} />;
      case 'stats':
        return <ClubStats onBack={() => handleTabChange('overview')} clubName={clubInfo?.clubName} />;

      case 'home-editor':
        return <ClubHomeEditor clubId={Number(clubInfo?.id) || 0} onBack={() => handleTabChange('overview')} />;
      case 'physical-tests':
        return <PhysicalTests onBack={() => handleTabChange('overview')} onCreateNew={() => handleTabChange('create-physical-test')} onViewRecord={(id) => { setCurrentTestId(id); handleTabChange('physical-test-record'); }} onViewReport={(id) => { setCurrentTestId(id); handleTabChange('physical-test-report'); }} />;
      case 'weekly-reports':
        return <WeeklyReports onBack={() => handleTabChange('overview')} userRole="coach" isAdmin={isAdmin} clubName={clubInfo?.clubName} clubId={Number(clubInfo?.id) || 0} />;
      case 'match-management':
        return <MatchReports onBack={() => handleTabChange('overview')} clubId={Number(clubInfo?.id) || 0} isAdmin={isAdmin} />;
      case 'player-selection':
        return <PlayerSelection onBack={() => handleTabChange('overview')} clubName={clubInfo?.clubName} />;
      case 'training-plans':
        return <TrainingPlans onBack={() => handleTabChange('overview')} />;
      case 'match-calendar':
        return <MatchCalendar onBack={() => handleTabChange('overview')} />;
      case 'activities':
        return <ClubActivities clubId={Number(clubInfo?.id) || 0} onBack={() => handleTabChange('overview')} />;
      case 'announcements':
        return <ClubAnnouncements onBack={() => handleTabChange('overview')} />;
      case 'admin-logs':
        return <AdminOperationLogs onBack={() => handleTabChange('overview')} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      sidebarConfig={clubSidebarConfig}
      activeItemId={activeTab === 'overview' ? undefined : activeTab}
      activeGroupKey={getActiveGroupKey()}
      pageTitle={activeTab === 'overview' ? undefined : getPageTitle()}
      onItemClick={(item) => {
        if (item.id) {
          handleTabChange(item.id as typeof activeTab);
        }
      }}
      onCreatePost={() => setIsCreateOpen(true)}
    >
      {activeTab === 'overview' ? (
        <>
        {/* 移动端头部 */}
        <header className="lg:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-white tracking-tight">俱乐部后台</span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium shadow-lg shadow-emerald-500/20">
            {clubInfo?.contactName?.slice(0, 1) || '俱'}
          </div>
        </header>

        {/* 桌面端头部 */}
        <header className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">欢迎回来，{clubInfo?.contactName || '管理员'}</h1>
            <p className="text-slate-400 mt-1 text-sm">{clubInfo?.clubName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabChange('home-preview')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              俱
            </button>
            {clubInfo?.verified && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                <Shield className="w-3.5 h-3.5" /> 已认证
              </span>
            )}
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 text-[#39ff14] rounded-xl transition-colors">
              <Edit3 className="w-4 h-4" /> 发布动态
            </button>
            <button onClick={() => handleTabChange('orders')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> 新建订单
            </button>
          </div>
        </header>

        {/* 公告栏 */}
        {!loading && announcements.length > 0 && (
          <div className="mb-6 space-y-3">
            {announcements.slice(0, 3).map(a => (
              <div
                key={a.id}
                className={`group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 transition-all hover:border-white/10 ${
                  a.isPinned
                    ? 'bg-gradient-to-r from-amber-500/[0.05] to-transparent border border-amber-500/20'
                    : 'bg-white/[0.02] border border-white/[0.06]'
                }`}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full ${a.isPinned ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{a.title}</span>
                    {a.isPinned && <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/20 rounded text-[10px] font-medium">置顶</span>}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{a.content}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{new Date(a.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* 统计卡片 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <StatCard icon={Users} label="在籍球员" value={stats.totalPlayers} color="blue" />
            <StatCard icon={FileText} label="待支付订单" value={stats.activeOrders} color="amber" />
            <StatCard icon={CheckCircle} label="已完成报告" value={stats.completedReports} color="emerald" />
            <StatCard icon={CreditCard} label="本月支出" value={`¥${stats.monthlySpending.toLocaleString()}`} color="violet" />
          </div>
        )}

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <QuickActionCard
            icon={Shield} title="球队管理" desc="管理球队周报/比赛/体测"
            action="进入管理" onClick={() => handleTabChange('teams')} color="blue"
          />
          <QuickActionCard
            icon={Users} title="球员管理" desc="管理在籍球员"
            action="查看全部" onClick={() => handleTabChange('players')} color="emerald"
          />
          <QuickActionCard
            icon={Zap} title="批量下单" desc="为多名球员同时下单分析"
            action="立即下单" onClick={() => handleTabChange('orders')} color="amber"
          />
          <QuickActionCard
            icon={BarChart3} title="数据报表" desc="查看俱乐部整体数据分析"
            action="查看报表" onClick={() => handleTabChange('stats')} color="violet"
          />
        </div>

        {/* 运营洞察 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white tracking-tight">运营洞察</h3>
            <span className="text-sm text-slate-500">本周关键指标与待办事项</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-36 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => handleTabChange('weekly-reports')}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] p-4 bg-white/[0.02] hover:border-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-slate-400">本周周报提交率</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${insights.weeklyReportSubmitRate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : insights.weeklyReportSubmitRate >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {insights.weeklyReportSubmitRate >= 80 ? '达标' : insights.weeklyReportSubmitRate >= 50 ? '需跟进' : '严重滞后'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <WeeklyReportProgress value={insights.weeklyReportSubmitRate} />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tracking-tight">{insights.weeklyReportSubmitted}</div>
                    <div className="text-xs text-slate-500">/ {insights.weeklyReportTotal} 已提交</div>
                  </div>
                </div>
              </div>
              <InsightCard
                label="待点评比赛总结"
                value={insights.pendingMatchSummaries}
                subtext="场比赛等待教练点评"
                trend={insights.pendingMatchSummaries > 0 ? '需处理' : '已清空'}
                trendUp={insights.pendingMatchSummaries === 0}
                color="amber"
                onClick={() => handleTabChange('match-management')}
              />
              <InsightCard
                label="待完成体测记录"
                value={insights.pendingPhysicalTestRecords}
                subtext="名球员待录入体测数据"
                trend={insights.pendingPhysicalTestRecords > 0 ? '需处理' : '已清空'}
                trendUp={insights.pendingPhysicalTestRecords === 0}
                color="blue"
                onClick={() => handleTabChange('physical-tests')}
              />
              <InsightCard
                label="待支付订单"
                value={insights.pendingOrders}
                subtext="笔订单待支付"
                trend={insights.pendingOrders > 0 ? '待支付' : '无欠款'}
                trendUp={insights.pendingOrders === 0}
                color="violet"
                onClick={() => handleTabChange('order-management')}
              />
            </div>
          )}
        </div>

        {/* 最近球员 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white tracking-tight">最近活跃球员</h3>
            <button onClick={() => handleTabChange('players')} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group">
              查看全部 <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-[72px] bg-white/[0.03] rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {recentPlayers.map(player => (
                  <div
                    key={player.id}
                    className="group flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {player.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{player.name}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPositionColor(player.position)}`}>{player.position}</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {player.age}岁 · 球衣号 {player.jerseyNumber} · {player.reportCount} 份报告
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${player.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {player.status === 'active' ? '在训' : '离队'}
                      </span>
                      <button className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors text-slate-500 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>) : (
        <LazyTabBoundary>{renderMainContent()}</LazyTabBoundary>
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="club"
      />
    </DashboardLayout>
  );
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}

// 统计卡片组件
const StatCard = ({ icon: Icon, label, value, trend, color }: StatCardProps) => {
  const colorMap: Record<string, { iconBg: string; iconText: string; glow: string; border: string }> = {
    blue: {
      iconBg: 'bg-blue-500/15',
      iconText: 'text-blue-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      border: 'group-hover:border-blue-500/20',
    },
    amber: {
      iconBg: 'bg-amber-500/15',
      iconText: 'text-amber-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      border: 'group-hover:border-amber-500/20',
    },
    emerald: {
      iconBg: 'bg-emerald-500/15',
      iconText: 'text-emerald-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      border: 'group-hover:border-emerald-500/20',
    },
    violet: {
      iconBg: 'bg-violet-500/15',
      iconText: 'text-violet-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
      border: 'group-hover:border-violet-500/20',
    },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] transition-all duration-300 hover:-translate-y-0.5 ${c.glow} ${c.border}`}>
      {/* 顶部微光 */}
      <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-${color}-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 ${c.iconBg} rounded-xl border border-white/[0.06]`}>
          <Icon className={`w-5 h-5 ${c.iconText}`} />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-slate-500 bg-white/[0.03] px-2 py-1 rounded-full border border-white/[0.06]">{trend}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
};

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
  color: string;
}

// 快捷操作卡片
const QuickActionCard = ({ icon: Icon, title, desc, action, onClick, color }: QuickActionCardProps) => {
  const colorMap: Record<string, { iconBg: string; iconText: string; glow: string; border: string; arrow: string }> = {
    blue: {
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-400',
      glow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]',
      border: 'hover:border-blue-500/25',
      arrow: 'group-hover:text-blue-400',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10',
      iconText: 'text-emerald-400',
      glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]',
      border: 'hover:border-emerald-500/25',
      arrow: 'group-hover:text-emerald-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-400',
      glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.12)]',
      border: 'hover:border-amber-500/25',
      arrow: 'group-hover:text-amber-400',
    },
    violet: {
      iconBg: 'bg-violet-500/10',
      iconText: 'text-violet-400',
      glow: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]',
      border: 'hover:border-violet-500/25',
      arrow: 'group-hover:text-violet-400',
    },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div onClick={onClick} className={`group relative overflow-hidden rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${c.glow} ${c.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.iconBg} border border-white/[0.06]`}>
          <Icon className={`w-5 h-5 ${c.iconText}`} />
        </div>
        <span className={`text-sm font-medium text-slate-500 flex items-center gap-1 transition-colors ${c.arrow}`}>
          {action} <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
};

interface InsightCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  progress?: number;
  onClick?: () => void;
}

// 运营洞察卡片
const InsightCard = ({ label, value, subtext, trend, trendUp, color, progress, onClick }: InsightCardProps) => {
  const colorMap: Record<string, { bg: string; text: string; bar: string; border: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'hover:border-emerald-500/25', glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500', border: 'hover:border-amber-500/25', glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500', border: 'hover:border-blue-500/25', glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500', border: 'hover:border-violet-500/25', glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]' },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div onClick={onClick} className={`group relative overflow-hidden rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${c.border} ${c.glow}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${trendUp ? `${c.bg} ${c.text} border-${color}-500/20` : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{trend}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-sm text-slate-500">{subtext}</span>
      </div>
      {typeof progress === 'number' && (
        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;
