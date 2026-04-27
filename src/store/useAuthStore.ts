import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { userApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  currentRole: UserRole | null; // 当前激活的角色
  
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  setCurrentRole: (role: UserRole) => void;
  syncCurrentRole: (role: UserRole) => Promise<void>;
}

const getStoredRole = (): UserRole | null => {
  try {
    return localStorage.getItem('currentRole') as UserRole | null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  currentRole: getStoredRole(),

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    // 只存储必要的最小用户信息，避免敏感字段泄露
    const minimalUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      roles: user.roles?.map((r: any) => ({ type: r.type, status: r.status })),
      current_role: user.current_role,
      currentRole: user.currentRole,
      role: user.role,
    };
    localStorage.setItem('user', JSON.stringify(minimalUser));
    // 优先使用后端返回的 current_role / currentRole（后端 GetUserByID 已确保有默认值）
    let defaultRole: UserRole | null = user.current_role || user.currentRole || null;
    // 其次从 roles 数组中找第一个 active 的角色
    if (!defaultRole && user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      const activeRole = user.roles.find((r: any) => r.status === 'active');
      if (activeRole) {
        defaultRole = activeRole.type as UserRole;
      }
    }
    // 兜底：使用用户主角色
    if (!defaultRole) {
      defaultRole = (user.role as UserRole) || 'player';
    }
    localStorage.setItem('currentRole', defaultRole);
    set({ user, token, isAuthenticated: true, currentRole: defaultRole });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentRole');
    set({ user: null, token: null, isAuthenticated: false, currentRole: null });
  },

  setLoading: (loading) => set({ loading }),

  updateUser: (updatedUser) => set((state) => {
    const user = state.user ? { ...state.user, ...updatedUser } : null;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return { user };
  }),

  setCurrentRole: (role) => {
    localStorage.setItem('currentRole', role);
    set({ currentRole: role });
  },

  syncCurrentRole: async (role) => {
    try {
      const response = await userApi.updateProfile({ current_role: role });
      localStorage.setItem('currentRole', role);

      // 如果后端返回了更新后的用户数据，优先使用
      const updatedUser = response.data?.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, currentRole: role });
        return;
      }

      // 兜底：本地 patch user 对象
      set((state) => {
        const user = state.user ? { ...state.user, currentRole: role, current_role: role } : null;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { user, currentRole: role };
      });
    } catch (error) {
      console.error('同步当前角色失败:', error);
      // 即使同步失败也更新本地状态，避免阻塞用户操作
      localStorage.setItem('currentRole', role);
      set((state) => {
        const user = state.user ? { ...state.user, currentRole: role, current_role: role } : null;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { user, currentRole: role };
      });
    }
  },
}));
