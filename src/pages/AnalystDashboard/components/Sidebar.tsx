import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Star
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export type AnalystTab = 'overview' | 'orders' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: AnalystTab;
  onTabChange: (tab: AnalystTab) => void;
}

const navItems: { id: AnalystTab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'overview', label: '工作台', icon: <LayoutDashboard size={20} /> },
  { id: 'orders', label: '订单管理', icon: <ShoppingCart size={20} />, badge: 3 },
  { id: 'reports', label: '我的报告', icon: <FileText size={20} /> },
  { id: 'settings', label: '账户设置', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <aside className="w-72 bg-[#111827] border-r border-gray-800 h-screen fixed left-0 top-0 overflow-y-auto z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#39ff14] to-[#22c55e] rounded-lg flex items-center justify-center shadow-lg shadow-[#39ff14]/30">
            <span className="text-white font-bold text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">分析师工作台</h1>
            <p className="text-gray-500 text-xs">少年球探</p>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm w-full"
        >
          <ChevronLeft size={16} />
          <span>返回首页</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-[#39ff14]/20 to-transparent text-[#39ff14] border-l-2 border-[#39ff14]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={activeTab === item.id ? 'text-[#39ff14]' : ''}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-[#111827]">
        <button
          onClick={() => navigate(`/personal-homepage/${user?.id}`)}
          className="w-full flex items-center gap-3 mb-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-medium">
            {user?.nickname?.[0] || user?.username?.[0] || '👤'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-sm font-medium truncate">
              {user?.nickname || user?.username || '分析师'}
            </p>
            <p className="text-gray-500 text-xs truncate">认证分析师</p>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
};
