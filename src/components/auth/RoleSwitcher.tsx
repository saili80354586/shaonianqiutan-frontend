import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_CONFIG, RoleInfo } from '../../types/auth';
import { Users, BarChart3, Building2, GraduationCap, Search, ChevronDown, Plus, Check } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  roles: { type: UserRole; status: string }[];
  onRoleChange: (role: UserRole) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Users,
  BarChart3,
  Building2,
  GraduationCap,
  Search,
};

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, roles, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取角色配置
  const getRoleConfig = (roleType: UserRole): RoleInfo => ROLE_CONFIG[roleType];

  // 获取角色图标
  const getRoleIcon = (roleType: UserRole) => {
    const config = getRoleConfig(roleType);
    const Icon = iconMap[config.icon] || Users;
    return <Icon className="w-4 h-4" />;
  };

  // 处理角色切换
  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    setIsOpen(false);

    // 根据角色跳转
    const rolePaths: Record<UserRole, string> = {
      player: '/dashboard',
      analyst: '/analyst/dashboard',
      club: '/club/dashboard',
      coach: '/coach/dashboard',
      scout: '/scout/dashboard',
    };
    navigate(rolePaths[role]);
  };

  // 处理申请新角色
  const handleApplyNewRole = () => {
    setIsOpen(false);
    navigate('/apply-role');
  };

  // 如果只激活了一个角色，不显示切换器
  if (roles.filter(r => r.status === 'active').length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
        {getRoleIcon(currentRole)}
        <span className="text-sm text-white font-medium">
          {getRoleConfig(currentRole).label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 当前角色按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        {getRoleIcon(currentRole)}
        <span className="text-sm text-white font-medium">
          {getRoleConfig(currentRole).label}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-blue-200/50 uppercase tracking-wider">
              切换角色
            </div>
            
            {roles
              .filter(r => r.status === 'active')
              .map((role) => {
                const config = getRoleConfig(role.type);
                const isCurrent = currentRole === role.type;
                const Icon = iconMap[config.icon] || Users;
                
                return (
                  <button
                    key={role.type}
                    onClick={() => handleRoleSelect(role.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isCurrent
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-white/40">{config.description}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                );
              })}

            {/* 审核中的角色 */}
            {roles
              .filter(r => r.status === 'pending')
              .map((role) => {
                const config = getRoleConfig(role.type);
                const Icon = iconMap[config.icon] || Users;
                
                return (
                  <div
                    key={role.type}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left opacity-50 cursor-not-allowed"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-amber-400">审核中...</div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* 申请新角色 */}
          <div className="border-t border-white/10 p-2">
            <button
              onClick={handleApplyNewRole}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-sm font-medium">申请新角色</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
