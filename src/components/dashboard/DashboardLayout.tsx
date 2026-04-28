import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Menu } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import type { DashboardLayoutProps } from './types';

// ============================================================
// 组件：DashboardLayout
// ============================================================

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebarConfig,
  activeItemId,
  activeGroupKey,
  onItemClick,
  pageTitle,
  headerActions,
  showMobileMenuButton = true,
  children,
  onCreatePost,
  className = '',
  defaultPadding = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // 阻止背景滚动当侧边栏打开时
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // 计算页面标题
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    // 可以从当前路由或菜单配置中自动获取
    return '';
  };

  const currentPageTitle = getPageTitle();

  return (
    <div className={`min-h-screen bg-[#0a0d12] ${className}`}>
      {/* 侧边栏 */}
      <DashboardSidebar
        config={sidebarConfig}
        activeItemId={activeItemId}
        activeGroupKey={activeGroupKey}
        onItemClick={onItemClick}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onCreatePost={onCreatePost}
      />

      {/* 主内容区域 */}
      <main className="lg:ml-64 min-h-screen">
        {/* 顶部头部 */}
        <header className="sticky top-0 z-30 bg-[#0a0d12]/80 backdrop-blur-sm border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* 左侧：菜单按钮 + 顶部导航 + 标题 */}
            <div className="flex items-center gap-3 min-w-0">
              {showMobileMenuButton && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <Link
                to="/"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex-shrink-0"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">少年球探首页</span>
                <span className="sm:hidden">首页</span>
              </Link>

              {currentPageTitle && (
                <>
                  <span className="hidden sm:block h-5 w-px bg-white/[0.08]" />
                  <h1 className="min-w-0 truncate text-lg sm:text-xl font-semibold text-white tracking-tight">
                    {currentPageTitle}
                  </h1>
                </>
              )}

              {sidebarConfig.headerNavItems && sidebarConfig.headerNavItems.length > 0 && (
                <nav className="hidden md:flex items-center gap-1 ml-2">
                  {sidebarConfig.headerNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'text-white bg-white/[0.06]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>

            {/* 右侧：自定义操作 */}
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* 内容区域 */}
        <div className={defaultPadding ? 'p-4 sm:p-6 lg:p-8' : ''}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
