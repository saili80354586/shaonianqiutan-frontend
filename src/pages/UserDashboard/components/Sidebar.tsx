import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Upload,
  User,
  TrendingUp,
  LogOut,
  ChevronLeft,
  X,
  FileText as WeeklyIcon,
  Trophy,
  Activity,
  Edit3,
  Search,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

// 内联类型定义
type DashboardTab = 'home' | 'orders' | 'weekly_reports' | 'match_reports' | 'growth' | 'profile' | 'discover_clubs' | 'my_applications' | 'favorites';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  mobile?: boolean;
  onCreatePost?: () => void;
}

const baseNavItems: { id: DashboardTab; label: string; icon: React.ReactNode; requireClub?: boolean }[] = [
  { id: 'home', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
  { id: 'orders', label: '订单中心', icon: <ShoppingCart size={20} /> },
  { id: 'weekly_reports', label: '我的周报', icon: <WeeklyIcon size={20} />, requireClub: true },
  { id: 'match_reports', label: '我的比赛', icon: <Trophy size={20} />, requireClub: true },
  { id: 'growth', label: '成长中心', icon: <TrendingUp size={20} /> },
  { id: 'discover_clubs', label: '发现俱乐部', icon: <Search size={20} /> },
  { id: 'my_applications', label: '我的申请', icon: <FileText size={20} /> },
  { id: 'favorites', label: '我的收藏', icon: <Star size={20} /> },
  { id: 'profile', label: '个人资料', icon: <User size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, mobile, onCreatePost }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAuth, user } = useAuthStore();
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  // 检测用户是否有俱乐部
  useEffect(() => {
    // 优先使用用户资料中的 club 字段
    if (user?.club) {
      setHasClub(true);
      return;
    }
    // 如果没有 club 字段，尝试调用 API 检测
    const checkClub = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHasClub(!!(data.data?.club || data.data?.team_id));
        } else {
          setHasClub(false);
        }
      } catch {
        setHasClub(false);
      }
    };
    checkClub();
  }, [user?.club]);

  // 根据是否有俱乐部过滤菜单项
  const navItems = baseNavItems.filter(item => {
    if (item.requireClub && hasClub === false) return false;
    return true;
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <aside className={`${mobile ? 'w-72 h-full' : 'w-72 h-screen fixed left-0 top-0'} bg-[#111827] border-r border-gray-800 overflow-y-auto z-50`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#39ff14] to-[#22c55e] rounded-lg flex items-center justify-center shadow-lg shadow-[#39ff14]/30 flex-shrink-0">
            <span className="text-white font-bold text-base sm:text-lg">⚽</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-semibold text-base sm:text-lg">少年球探</h1>
            <p className="text-gray-500 text-xs">用户中心</p>
          </div>
          {mobile && (
            <button 
              onClick={() => onTabChange(activeTab)}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Back to Home */}
      <div className="p-3 sm:p-4 border-b border-gray-800">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm w-full py-2 touch-manipulation"
        >
          <ChevronLeft size={16} />
          <span>返回首页</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 sm:p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium touch-manipulation min-h-[48px] ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-[#39ff14]/20 to-transparent text-[#39ff14] border-l-2 border-[#39ff14]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={activeTab === item.id ? 'text-[#39ff14]' : ''}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className={`${mobile ? 'relative mt-4' : 'absolute bottom-0 left-0 right-0'} p-3 sm:p-4 border-t border-gray-800 bg-[#111827]`}>
        {onCreatePost && (
          <button
            onClick={onCreatePost}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-3 rounded-lg bg-[#39ff14]/10 text-[#39ff14] hover:bg-[#39ff14]/20 transition-colors text-sm font-medium touch-manipulation min-h-[44px]"
          >
            <Edit3 size={16} />
            <span>发布动态</span>
          </button>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-medium flex-shrink-0">
            {user?.nickname?.[0] || user?.username?.[0] || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.nickname || user?.username || '用户'}
            </p>
            <p className="text-gray-500 text-xs truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium touch-manipulation min-h-[44px]"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
};
