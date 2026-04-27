import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import {
  LayoutDashboard, FileText, Users, Settings,
  Shield, BarChart3, ClipboardList, CheckCircle,
  Send, RotateCcw, TrendingUp, Flag, ShieldAlert, Wallet, Receipt, ScrollText,
  Megaphone, ImageIcon, HelpCircle, Activity, BookOpen, LogOut, X, Menu
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard';
import type { SidebarConfig, MenuGroupDef, MenuItemDef } from '../../components/dashboard/types';

// 菜单分组配置
const menuGroups: MenuGroupDef[] = [
  {
    key: 'business',
    label: '业务管理',
    icon: BarChart3,
    items: [
      { id: 'orders-dispatch', label: '订单派发', icon: Send },
      { id: 'orders-assignments', label: '派发记录', icon: RotateCcw },
      { id: 'orders', label: '订单管理', icon: ClipboardList },
      { id: 'applications', label: '分析师申请', icon: FileText },
      { id: 'reports', label: '报告审核', icon: CheckCircle },
      { id: 'users', label: '用户管理', icon: Users },
    ],
  },
  {
    key: 'governance',
    label: '内容治理',
    icon: ShieldAlert,
    items: [
      { id: 'content-reports', label: '举报处理', icon: Flag },
      { id: 'sensitive-words', label: '敏感词配置', icon: Shield },
    ],
  },
  {
    key: 'finance',
    label: '订单与财务',
    icon: Wallet,
    items: [
      { id: 'settlements', label: '分析师结算', icon: Receipt },
      { id: 'revenue', label: '平台收支报表', icon: TrendingUp },
    ],
  },
  {
    key: 'compliance',
    label: '风控合规',
    icon: ScrollText,
    items: [
      { id: 'audit-logs', label: '操作审计', icon: BookOpen },
      { id: 'login-logs', label: '登录日志', icon: Activity },
    ],
  },
  {
    key: 'platform',
    label: '平台运营',
    icon: Megaphone,
    items: [
      { id: 'announcements', label: '平台公告', icon: Megaphone },
      { id: 'banners', label: '轮播图', icon: ImageIcon },
      { id: 'faqs', label: '常见问题', icon: HelpCircle },
    ],
  },
];

// 独立菜单项
const standaloneItems: MenuItemDef[] = [
  { id: 'dashboard', label: '数据看板', icon: LayoutDashboard },
  { id: 'operations', label: '运营洞察', icon: TrendingUp },
  { id: 'settings', label: '系统设置', icon: Settings },
];

// 路由映射表
const routeMapping: Record<string, string> = {
  'dashboard': '/admin/dashboard',
  'operations': '/admin/operations',
  'settings': '/admin/settings',
  'orders-dispatch': '/admin/orders/dispatch',
  'orders-assignments': '/admin/orders/assignments',
  'orders': '/admin/orders',
  'applications': '/admin/applications',
  'reports': '/admin/reports',
  'users': '/admin/users',
  'content-reports': '/admin/content-reports',
  'sensitive-words': '/admin/sensitive-words',
  'settlements': '/admin/settlements',
  'revenue': '/admin/revenue',
  'audit-logs': '/admin/audit-logs',
  'login-logs': '/admin/login-logs',
  'announcements': '/admin/announcements',
  'banners': '/admin/banners',
  'faqs': '/admin/faqs',
};

// 反向路由映射，用于确定当前激活项
const reverseRouteMapping: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/dashboard': 'dashboard',
  '/admin/operations': 'operations',
  '/admin/settings': 'settings',
  '/admin/orders/dispatch': 'orders-dispatch',
  '/admin/orders/assignments': 'orders-assignments',
  '/admin/orders': 'orders',
  '/admin/applications': 'applications',
  '/admin/reports': 'reports',
  '/admin/users': 'users',
  '/admin/content-reports': 'content-reports',
  '/admin/sensitive-words': 'sensitive-words',
  '/admin/settlements': 'settlements',
  '/admin/revenue': 'revenue',
  '/admin/audit-logs': 'audit-logs',
  '/admin/login-logs': 'login-logs',
  '/admin/announcements': 'announcements',
  '/admin/banners': 'banners',
  '/admin/faqs': 'faqs',
};

// 分组映射
const groupMapping: Record<string, string> = {
  'orders-dispatch': 'business',
  'orders-assignments': 'business',
  'orders': 'business',
  'applications': 'business',
  'reports': 'business',
  'users': 'business',
  'content-reports': 'governance',
  'sensitive-words': 'governance',
  'settlements': 'finance',
  'revenue': 'finance',
  'audit-logs': 'compliance',
  'login-logs': 'compliance',
  'announcements': 'platform',
  'banners': 'platform',
  'faqs': 'platform',
};

const AdminDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 侧边栏配置
  const sidebarConfig: SidebarConfig = useMemo(() => ({
    roleName: '管理后台',
    themeColor: '#10b981',
    dashboardPath: '/admin/dashboard',
    businessGroups: menuGroups,
    standaloneItems,
    showCreatePost: false,
  }), []);

  // 获取当前激活的菜单项 ID
  const activeItemId = useMemo(() => {
    const path = location.pathname;
    // 精确匹配
    if (reverseRouteMapping[path]) {
      return reverseRouteMapping[path];
    }
    // 前缀匹配
    for (const [route, id] of Object.entries(reverseRouteMapping)) {
      if (path.startsWith(route) && route !== '/admin') {
        return id;
      }
    }
    return 'dashboard';
  }, [location.pathname]);

  // 获取当前激活的分组
  const activeGroupKey = useMemo(() => {
    return groupMapping[activeItemId] || '';
  }, [activeItemId]);

  // 处理菜单点击
  const handleItemClick = (item: MenuItemDef) => {
    const path = routeMapping[item.id];
    if (path) {
      navigate(path);
    }
  };

  // 处理登出
  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // 获取页面标题
  const getPageTitle = () => {
    const item = [...standaloneItems, ...menuGroups.flatMap(g => g.items)].find(i => i.id === activeItemId);
    return item?.label || '管理后台';
  };

  // 自定义头部操作 - 用户头像和退出
  const headerActions = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium hover:scale-105 transition-transform">
        {user?.nickname?.slice(0, 1) || '管'}
      </div>
      <button
        onClick={handleLogout}
        className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] rounded-lg transition-all text-sm"
      >
        <LogOut className="w-[18px] h-[18px]" />
        退出
      </button>
    </div>
  );

  return (
    <DashboardLayout
      sidebarConfig={sidebarConfig}
      activeItemId={activeItemId}
      activeGroupKey={activeGroupKey}
      onItemClick={handleItemClick}
      pageTitle={getPageTitle()}
      headerActions={headerActions}
      className="admin-dashboard"
      defaultPadding={false}
    >
      {/* 移动端头部 */}
      <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold text-white tracking-tight">管理后台</span>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium shadow-lg shadow-emerald-500/20">
          {user?.nickname?.slice(0, 1) || '管'}
        </div>
      </header>

      {/* 桌面端头部 */}
      <header className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">欢迎回来，{user?.nickname || '管理员'}</h1>
          <p className="text-slate-400 mt-1 text-sm">少年球探平台管理后台</p>
        </div>
        {headerActions}
      </header>

      {/* 页面内容 */}
      <div className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardLayout;
