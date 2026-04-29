import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User,
  LayoutDashboard,
  LogOut,
  Settings,
  Bell,
  Mail,
  Edit3,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { NotificationBadge } from '../social';
import { messageApi } from '../../services/api';
import type { DashboardSidebarProps, MenuGroupDef, MenuItemDef } from './types';

// ============================================================
// 辅助函数
// ============================================================

const getRoleColor = (roleName: string) => {
  const colorMap: Record<string, { primary: string; gradient: string; light: string }> = {
    '用户中心': { primary: '#39ff14', gradient: 'from-[#39ff14] to-[#22c55e]', light: 'bg-[#39ff14]/10 text-[#39ff14]' },
    '分析师工作台': { primary: '#8b5cf6', gradient: 'from-violet-500 to-purple-500', light: 'bg-violet-500/10 text-violet-400' },
    '俱乐部后台': { primary: '#10b981', gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-500/10 text-emerald-400' },
    '教练工作台': { primary: '#f59e0b', gradient: 'from-orange-500 to-amber-600', light: 'bg-orange-500/10 text-orange-400' },
    '球探工作台': { primary: '#a78bfa', gradient: 'from-violet-500 to-purple-500', light: 'bg-violet-500/10 text-violet-400' },
    '管理后台': { primary: '#10b981', gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-500/10 text-emerald-400' },
  };
  return colorMap[roleName] || colorMap['用户中心'];
};

// ============================================================
// 组件：DashboardSidebar
// ============================================================

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  config,
  activeItemId,
  onItemClick,
  mobileOpen = false,
  onMobileClose,
  onCreatePost,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAuth } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const roleColor = getRoleColor(config.roleName);

  // 初始化展开的分组
  useEffect(() => {
    if (config.businessGroups.length > 0 && openGroups.length === 0) {
      setOpenGroups([config.businessGroups[0].key]);
    }
  }, [config.businessGroups, openGroups.length]);

  // 获取私信未读数
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await messageApi.getUnreadCount();
        if (res.data?.success) {
          setMessageUnreadCount(res.data.data?.count || 0);
        }
      } catch {
        // 静默失败
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    onMobileClose?.();
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((g) => g !== groupKey) : [...prev, groupKey]
    );
  };

  const isItemActive = (item: MenuItemDef) => {
    if (activeItemId) return item.id === activeItemId;
    if (item.path) {
      if (item.path === config.dashboardPath) {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    }
    return false;
  };

  const handleItemClick = (item: MenuItemDef) => {
    const usesDirectNavigation = Boolean(item.path || item.onClick);
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    if (!usesDirectNavigation) {
      onItemClick?.(item);
    }
    onMobileClose?.();
  };

  // 核心导航（所有角色统一）
  const CoreNavSection = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={`px-3 pb-2 space-y-0.5 ${mobile ? 'pt-3' : 'pt-20'}`}>
      {/* 个人主页 */}
      {config.profilePath && (
        <>
          <Link
            to={config.profilePath}
            onClick={onMobileClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
          >
            <User className="w-[18px] h-[18px]" />
            <span>个人主页</span>
          </Link>

          {config.profileSubItems?.map((item) => (
            <div key={item.id} className="pl-4">
              <MenuItem item={item} />
            </div>
          ))}
        </>
      )}

      {/* 工作台 */}
      <Link
        to={config.dashboardPath}
        onClick={onMobileClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
          location.pathname === config.dashboardPath
            ? `${roleColor.light} font-medium`
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <LayoutDashboard className="w-[18px] h-[18px]" />
        <span>工作台</span>
      </Link>
    </nav>
  );

  // 菜单项组件
  const MenuItem = ({ item }: { item: MenuItemDef }) => {
    const active = isItemActive(item);
    return (
      <button
        onClick={() => handleItemClick(item)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm relative overflow-hidden ${
          active
            ? `${roleColor.light} font-medium`
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-current opacity-60" />
        )}
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-current' : ''}`} />
        <span className="relative z-10 flex-1 text-left truncate">{item.label}</span>
        {item.badge ? (
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  // 分组头部组件
  const GroupHeader = ({ group }: { group: MenuGroupDef }) => {
    const isOpen = openGroups.includes(group.key);
    return (
      <button
        onClick={() => toggleGroup(group.key)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white transition-all duration-200 group"
      >
        <span className="flex items-center gap-3 text-sm font-medium">
          <group.icon className="w-[18px] h-[18px] group-hover:text-emerald-400 transition-colors" />
          {group.label}
        </span>
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-400' : ''}`}
        />
      </button>
    );
  };

  // 业务菜单区域
  const BusinessSection = () => (
    <div className="px-3 py-2 space-y-1">
      {/* 独立菜单项 */}
      {config.standaloneItems?.map((item) => (
        <MenuItem key={item.id} item={item} />
      ))}

      {/* 分组菜单 */}
      {config.businessGroups.map((group) => (
        <div key={group.key}>
          <GroupHeader group={group} />
          {openGroups.includes(group.key) && (
            <div className="pl-4 space-y-0.5 mt-0.5">
              {group.items.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // 沟通与创作区域
  const CommunicationSection = () => (
    <div className="px-3 py-2 space-y-0.5">
      {config.showCreatePost && onCreatePost && (
        <button
          onClick={() => {
            onCreatePost();
            onMobileClose?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${roleColor.light} text-sm font-medium hover:opacity-80 transition-opacity`}
        >
          <Edit3 className="w-[18px] h-[18px]" />
          <span>发布动态</span>
        </button>
      )}

      <Link
        to="/notifications"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
        onClick={onMobileClose}
      >
        <div className="relative">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-1 -right-1">
            <NotificationBadge />
          </span>
        </div>
        <span>通知中心</span>
      </Link>

      <Link
        to="/messages"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
        onClick={onMobileClose}
      >
        <div className="relative">
          <Mail className="w-[18px] h-[18px]" />
          {messageUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
              {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
            </span>
          )}
        </div>
        <span>私信</span>
      </Link>
    </div>
  );

  // 底部设置区域
  const SettingsSection = () => (
    <div className="p-3 border-t border-white/[0.06]">
      <button
        onClick={() => {
          navigate('/settings');
          onMobileClose?.();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-sm"
      >
        <Settings className="w-[18px] h-[18px]" />
        <span>账号设置</span>
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-all text-sm"
      >
        <LogOut className="w-[18px] h-[18px]" />
        <span>退出登录</span>
      </button>
    </div>
  );

  // 侧边栏内容
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${mobile ? 'w-72 h-full' : 'hidden lg:flex w-64 h-screen fixed left-0 top-0'} flex-col z-50`}
    >
      {/* 玻璃拟态背景 */}
      <div className="absolute inset-0 bg-[#0b0f17]/95 backdrop-blur-xl border-r border-white/[0.06]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="relative flex flex-col h-full overflow-hidden">
        {/* 顶部区域 */}
        <div className="flex-shrink-0">
          {mobile && mobileOpen && (
            <div className="flex justify-end p-3 border-b border-white/[0.06]">
              <button
                onClick={onMobileClose}
                className="p-2 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <CoreNavSection mobile={mobile} />
        </div>

        {/* 可滚动区域 */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-2">
          {/* 自定义头部操作 */}
          {config.headerActions}

          {/* 业务菜单 */}
          <BusinessSection />

          {/* 分隔线 */}
          <div className="mx-3 h-px bg-white/[0.06]" />

          {/* 沟通与创作 */}
          <CommunicationSection />
        </div>

        {/* 底部设置 */}
        <div className="flex-shrink-0">
          <SettingsSection />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <SidebarContent />

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      {/* 移动端侧边栏 */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent mobile />
      </div>
    </>
  );
};

export default DashboardSidebar;
