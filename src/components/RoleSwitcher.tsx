import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import {
  User,
  BarChart3,
  ShieldCheck,
  Building2,
  GraduationCap,
  Search,
  ChevronDown,
  Check,
  Home,
  ArrowRight
} from 'lucide-react';

// 角色配置
const ROLE_CONFIG = {
  player: {
    label: '球员',
    icon: User,
    color: 'blue',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    dashboardPath: '/user-dashboard',
    homePath: (userId: number) => `/personal-homepage/${userId}`,
  },
  analyst: {
    label: '分析师',
    icon: BarChart3,
    color: 'emerald',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    dashboardPath: '/analyst/dashboard',
    homePath: (userId: number) => `/analyst/${userId}`,
  },
  scout: {
    label: '球探',
    icon: Search,
    color: 'cyan',
    bgColor: 'bg-cyan-500',
    lightBg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
    dashboardPath: '/scout/dashboard',
    homePath: (userId: number) => `/scout/${userId}`,
  },
  club: {
    label: '俱乐部',
    icon: Building2,
    color: 'violet',
    bgColor: 'bg-violet-500',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    dashboardPath: '/club/dashboard',
    homePath: (_userId: number) => `/club/dashboard?tab=home-preview`,
  },
  coach: {
    label: '教练',
    icon: GraduationCap,
    color: 'orange',
    bgColor: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    dashboardPath: '/coach/dashboard',
    homePath: (userId: number) => `/coach/${userId}`,
  },
  admin: {
    label: '管理员',
    icon: ShieldCheck,
    color: 'purple',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    dashboardPath: '/admin/dashboard',
    homePath: (userId: number) => `/admin/${userId}`,
  },
};

type RoleKey = keyof typeof ROLE_CONFIG;

interface RoleSwitcherProps {
  compact?: boolean;
  showHomeLink?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ compact = false, showHomeLink = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { user, currentRole, syncCurrentRole } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toRoleKey = (role?: string | null): RoleKey | null => {
    if (!role) return null;
    if (role === 'user') return 'player';
    return role in ROLE_CONFIG ? role as RoleKey : null;
  };

  // 获取用户拥有的所有角色
  const userRoles: RoleKey[] = [];

  // 从 user.currentRole 获取当前角色
  const userCurrentRole = toRoleKey(user?.currentRole);
  if (userCurrentRole) {
    if (!userRoles.includes(userCurrentRole)) {
      userRoles.push(userCurrentRole);
    }
  }

  // 从 user.roles 数组获取多角色
  if (user?.roles && Array.isArray(user.roles)) {
    user.roles.forEach((roleInfo: { type: string; status: string }) => {
      const role = toRoleKey(roleInfo.type);
      if (roleInfo.status === 'active' && role) {
        if (!userRoles.includes(role)) {
          userRoles.push(role);
        }
      }
    });
  }

  // 兜底：如果没有任何角色，默认 player
  if (userRoles.length === 0) {
    userRoles.push('player');
  }

  const activeRole = toRoleKey(currentRole) || userRoles[0];
  const config = ROLE_CONFIG[activeRole];
  const Icon = config.icon;
  const userId = user?.id;

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 如果只有一个角色且不强制显示链接，不显示切换器
  if (userRoles.length <= 1 && !showHomeLink) return null;

  const handleRoleSwitch = async (role: RoleKey) => {
    if (isSwitching || role === activeRole) return;
    setIsSwitching(true);
    const storeRole = role === 'player' ? 'user' : role;
    await syncCurrentRole(storeRole);
    setIsSwitching(false);
    setIsOpen(false);
    // 导航到对应角色的 dashboard
    navigate(ROLE_CONFIG[role].dashboardPath);
  };

  // 如果只有一个角色但需要显示主页链接
  if (userRoles.length === 1 && showHomeLink && userId) {
    const role = userRoles[0];
    const homePath = ROLE_CONFIG[role].homePath(userId);
    return (
      <Link
        to={homePath}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${ROLE_CONFIG[role].lightBg} ${ROLE_CONFIG[role].textColor} text-xs font-medium transition-all duration-200 hover:opacity-80`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>查看主页</span>
      </Link>
    );
  }

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.lightBg} ${config.textColor} text-xs font-medium transition-all duration-200 hover:opacity-80`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn">
            {userRoles.map((role) => {
              const roleConfig = ROLE_CONFIG[role];
              const RoleIcon = roleConfig.icon;
              const isActive = role === activeRole;
              
              return (
                <button
                  key={role}
                  disabled={isSwitching}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive 
                      ? `${roleConfig.lightBg} ${roleConfig.textColor} font-medium` 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <RoleIcon className={`w-4 h-4 ${isActive ? roleConfig.textColor : 'text-gray-400'}`} />
                  <span>{roleConfig.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.lightBg} border ${config.borderColor} transition-all duration-200 hover:shadow-md`}
      >
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <p className={`text-xs font-medium ${config.textColor}`}>当前身份</p>
          <p className="text-sm font-semibold text-gray-900">{config.label}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fadeIn">
          <div className="px-4 pb-2 border-b border-gray-100 mb-2">
            <p className="text-xs text-gray-500">切换身份</p>
          </div>
          
          {userRoles.map((role) => {
            const roleConfig = ROLE_CONFIG[role];
            const RoleIcon = roleConfig.icon;
            const isActive = role === activeRole;

            return (
              <button
                key={role}
                disabled={isSwitching}
                onClick={() => handleRoleSwitch(role)}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? `${roleConfig.lightBg} ${roleConfig.textColor}`
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${isActive ? roleConfig.bgColor : 'bg-gray-100'} flex items-center justify-center transition-colors`}>
                  <RoleIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="text-left flex-1">
                  <p className={`font-medium ${isActive ? roleConfig.textColor : 'text-gray-900'}`}>
                    {roleConfig.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isActive ? '当前使用中' : isSwitching ? '切换中...' : '点击切换'}
                  </p>
                </div>
                {isActive && (
                  <div className={`w-6 h-6 rounded-full ${roleConfig.bgColor} flex items-center justify-center`}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}

          {/* 查看主页链接 */}
          {userId && (
            <div className="px-4 pt-2 border-t border-gray-100 mt-2">
              <p className="text-xs text-gray-500 mb-2">查看我的主页</p>
              <div className="space-y-1">
                {userRoles.map((role) => {
                  const roleConfig = ROLE_CONFIG[role];
                  const homePath = roleConfig.homePath(userId);
                  const isActive = role === activeRole;

                  return (
                    <Link
                      key={`home-${role}`}
                      to={homePath}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      <span>{roleConfig.label}主页</span>
                      <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-4 pt-2 border-t border-gray-100 mt-2">
            <p className="text-xs text-gray-400">
              您拥有 {userRoles.length} 个身份角色
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
