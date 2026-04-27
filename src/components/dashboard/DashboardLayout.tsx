import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import type { DashboardLayoutProps } from './types';
import { useAuthStore } from '../../store';

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
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  // 路由变化时关闭移动端侧边栏
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // 计算页面标题
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    // 可以从当前路由或菜单配置中自动获取
    return '';
  };

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
            {/* 左侧：菜单按钮 + 标题 */}
            <div className="flex items-center gap-4">
              {showMobileMenuButton && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              {pageTitle && (
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  {pageTitle}
                </h1>
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
