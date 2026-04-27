import React, { createContext, useContext, useState } from 'react';
import { Crown, Lock } from 'lucide-react';

// 权限等级定义
export enum DataLevel {
  PUBLIC = 'public',
  MEMBER = 'member',
  PREMIUM = 'premium',
}

// 模拟用户权限状态
interface UserState {
  isLoggedIn: boolean;
  membership: 'free' | 'member' | 'premium';
}

const defaultUser: UserState = {
  isLoggedIn: false,
  membership: 'free',
};

// 创建权限上下文
const PermissionContext = createContext<{
  user: UserState;
  canView: (level: DataLevel) => boolean;
}>({
  user: defaultUser,
  canView: () => false,
});

// 权限提供者组件
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 模拟当前用户状态（免费用户）
  const [user] = useState<UserState>(defaultUser);

  // 检查是否有权限查看某级别数据
  const canView = (level: DataLevel): boolean => {
    const levelMap = {
      [DataLevel.PUBLIC]: 0,
      [DataLevel.MEMBER]: 1,
      [DataLevel.PREMIUM]: 2,
    };

    const userLevelMap = {
      'free': 0,
      'member': 1,
      'premium': 2,
    };

    return userLevelMap[user.membership] >= levelMap[level];
  };

  return (
    <PermissionContext.Provider value={{ user, canView }}>
      {children}
    </PermissionContext.Provider>
  );
};

// 使用权限的Hook
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
};

// 带权限控制的组件包装器
interface WithPermissionProps {
  children: React.ReactNode;
  requiredLevel: DataLevel;
  fallback?: React.ReactNode;
}

export const WithPermission: React.FC<WithPermissionProps> = ({
  children,
  requiredLevel,
  fallback,
}) => {
  const { canView } = usePermission();

  if (!canView(requiredLevel)) {
    return (
      <>
        {fallback || (
          <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
            <Lock className="w-4 h-4" />
            <span>会员专享</span>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

// 会员徽章组件
export const MemberBadge: React.FC<{ level: 'member' | 'premium' }> = ({ level }) => {
  const colors = {
    member: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${colors[level]}`}>
      <Crown className="w-3 h-3" />
      {level === 'member' ? '会员' : '高级会员'}
    </span>
  );
};
