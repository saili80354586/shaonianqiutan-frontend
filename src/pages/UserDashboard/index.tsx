import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  BarChart3,
  Calendar,
  Trophy,
  Building2,
  ClipboardList,
  Heart,
  User,
  Mail,
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard';
import { useAuthStore } from '../../store';
import type { SidebarConfig } from '../../components/dashboard/types';
import { CreatePostModal } from '../ScoutMap/SocialFeed';
import { HomeModule } from './components/HomeModule';
import { OrderCenter } from './components/OrderCenter';
import PlayerProfile from './PlayerProfile';
import { GrowthCenter } from './components/GrowthCenter';
import { MyWeeklyReports } from './components/MyWeeklyReports';
import { MyMatchReports } from './components/MyMatchReports';
import { DiscoverClubs } from './components/DiscoverClubs';
import { MyApplications } from './components/MyApplications';
import { MyActivityRegistrations } from './components/MyActivityRegistrations';
import { MyFavorites } from './components/MyFavorites';
import MyInvitations from './MyInvitations';

// 内联类型定义
type DashboardTab =
  | 'home'
  | 'orders'
  | 'profile'
  | 'growth'
  | 'weekly_reports'
  | 'match_reports'
  | 'discover_clubs'
  | 'my_activity_registrations'
  | 'my_applications'
  | 'my_invitations'
  | 'favorites';

const dashboardTabs: DashboardTab[] = [
  'home',
  'orders',
  'profile',
  'growth',
  'weekly_reports',
  'match_reports',
  'discover_clubs',
  'my_activity_registrations',
  'my_applications',
  'my_invitations',
  'favorites',
];

const isDashboardTab = (value: string | null): value is DashboardTab =>
  Boolean(value && dashboardTabs.includes(value as DashboardTab));

const getInitialTab = (): DashboardTab => {
  if (typeof window === 'undefined') return 'home';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return isDashboardTab(tab) ? tab : 'home';
};

// 模块标题映射
const tabTitles: Record<DashboardTab, string> = {
  home: '仪表盘',
  orders: '订单中心',
  profile: '个人资料',
  growth: '成长中心',
  weekly_reports: '我的周报',
  match_reports: '我的比赛',
  discover_clubs: '发现俱乐部',
  my_activity_registrations: '我的报名',
  my_applications: '我的申请',
  my_invitations: '我的邀请',
  favorites: '我的收藏',
};

// 侧边栏配置
const playerSidebarConfig: SidebarConfig = {
  roleName: '用户中心',
  themeColor: '#39ff14',
  dashboardPath: '/user-dashboard',
  showCreatePost: true,
  businessGroups: [
    {
      key: 'business',
      label: '业务中心',
      icon: LayoutDashboard,
      items: [
        { id: 'orders', label: '订单中心', icon: ShoppingCart },
      ],
    },
    {
      key: 'training',
      label: '训练相关',
      icon: Calendar,
      items: [
        { id: 'weekly_reports', label: '我的周报', icon: FileText },
        { id: 'match_reports', label: '我的比赛', icon: Trophy },
      ],
    },
    {
      key: 'growth',
      label: '成长与发现',
      icon: BarChart3,
      items: [
        { id: 'growth', label: '成长中心', icon: BarChart3 },
        { id: 'discover_clubs', label: '发现俱乐部', icon: Building2 },
        { id: 'my_activity_registrations', label: '我的报名', icon: Calendar },
        { id: 'my_applications', label: '我的申请', icon: ClipboardList },
        { id: 'my_invitations', label: '我的邀请', icon: Mail },
        { id: 'favorites', label: '我的收藏', icon: Heart },
      ],
    },
  ],
};

// Main Dashboard Component
export const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getInitialTab());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { user } = useAuthStore();
  const sidebarConfig: SidebarConfig = {
    ...playerSidebarConfig,
    profilePath: user?.id ? `/personal-homepage/${user.id}` : '/personal-homepage',
    profileSubItems: [
      { id: 'profile', label: '个人资料', icon: User },
    ],
  };

  // 获取当前激活的分组key
  const getActiveGroupKey = (): string => {
    if (['orders'].includes(activeTab)) return 'business';
    if (['weekly_reports', 'match_reports'].includes(activeTab)) return 'training';
    if (['growth', 'discover_clubs', 'my_activity_registrations', 'my_applications', 'my_invitations', 'favorites'].includes(activeTab)) return 'growth';
    return '';
  };

  const activateTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (tab === 'home') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeModule onTabChange={(tab) => activateTab(tab as DashboardTab)} />;
      case 'orders':
        return <OrderCenter />;
      case 'profile':
        return <PlayerProfile />;
      case 'growth':
        return <GrowthCenter />;
      case 'weekly_reports':
        return <MyWeeklyReports />;
      case 'match_reports':
        return <MyMatchReports />;
      case 'discover_clubs':
        return <DiscoverClubs />;
      case 'my_activity_registrations':
        return <MyActivityRegistrations />;
      case 'my_applications':
        return <MyApplications />;
      case 'my_invitations':
        return <MyInvitations onBack={() => setActiveTab('home')} />;
      case 'favorites':
        return <MyFavorites />;
      default:
        return <HomeModule onTabChange={(tab) => activateTab(tab as DashboardTab)} />;
    }
  };

  return (
    <>
      <DashboardLayout
        sidebarConfig={sidebarConfig}
        activeItemId={activeTab}
        activeGroupKey={getActiveGroupKey()}
        pageTitle={activeTab === 'home' ? undefined : tabTitles[activeTab]}
        onCreatePost={() => setIsCreateOpen(true)}
        onItemClick={(item) => {
          const nextTab = item.id || null;
          if (isDashboardTab(nextTab)) {
            activateTab(nextTab);
          }
        }}
      >
        <div key={activeTab} className="animate-fadeInSlide">
          {renderContent()}
        </div>
      </DashboardLayout>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="player"
      />
    </>
  );
};

export default UserDashboard;
