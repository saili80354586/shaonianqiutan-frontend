import type { UserRole } from '../../../types/auth';

// 注册流程主题配置 - 每个角色有独特的视觉风格
export interface RoleTheme {
  id: UserRole;
  name: string;
  nameEn: string;
  // 主色调
  primary: string;
  primaryLight: string;
  primaryDark: string;
  // 渐变色
  gradient: string;
  gradientHover: string;
  // 背景
  bgGradient: string;
  bgCard: string;
  // 强调色
  accent: string;
  accentLight: string;
  // 文字
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // 边框
  border: string;
  borderActive: string;
  // 阴影
  shadow: string;
  shadowGlow: string;
  // 装饰元素
  decoration: {
    pattern: string;
    icon: string;
    emoji: string;
  };
  // 风格描述
  style: {
    title: string;
    description: string;
    vibe: string;
  };
}

export const roleThemes: Record<string, RoleTheme> = {
  player: {
    id: 'player',
    name: '球员',
    nameEn: 'Player',
    // 运动活力主题 - 绿色+橙色
    primary: 'emerald-500',
    primaryLight: 'emerald-400',
    primaryDark: 'emerald-600',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    gradientHover: 'from-emerald-400 via-green-400 to-teal-400',
    bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
    bgCard: 'bg-emerald-950/30',
    accent: 'orange-500',
    accentLight: 'orange-400',
    textPrimary: 'text-emerald-100',
    textSecondary: 'text-emerald-200/70',
    textMuted: 'text-emerald-200/40',
    border: 'border-emerald-500/20',
    borderActive: 'border-emerald-500',
    shadow: 'shadow-emerald-500/20',
    shadowGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    decoration: {
      pattern: 'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(249,115,22,0.1) 0%, transparent 50%)',
      icon: '⚽',
      emoji: '🏃',
    },
    style: {
      title: '运动活力风格',
      description: '充满能量的绿色与橙色搭配，激发运动热情',
      vibe: '活力、青春、动力',
    },
  },

  analyst: {
    id: 'analyst',
    name: '分析师',
    nameEn: 'Analyst',
    // 科技数据主题 - 深蓝+紫色
    primary: 'indigo-500',
    primaryLight: 'indigo-400',
    primaryDark: 'indigo-600',
    gradient: 'from-indigo-500 via-blue-600 to-violet-500',
    gradientHover: 'from-indigo-400 via-blue-500 to-violet-400',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    bgCard: 'bg-indigo-950/30',
    accent: 'cyan-500',
    accentLight: 'cyan-400',
    textPrimary: 'text-indigo-100',
    textSecondary: 'text-indigo-200/70',
    textMuted: 'text-indigo-200/40',
    border: 'border-indigo-500/20',
    borderActive: 'border-indigo-500',
    shadow: 'shadow-indigo-500/20',
    shadowGlow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]',
    decoration: {
      pattern: 'radial-gradient(circle at 30% 70%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(6,182,212,0.1) 0%, transparent 50%)',
      icon: '📊',
      emoji: '🎯',
    },
    style: {
      title: '科技数据风格',
      description: '深邃的蓝紫色调，展现专业分析气质',
      vibe: '专业、精准、智能',
    },
  },

  club: {
    id: 'club',
    name: '俱乐部',
    nameEn: 'Club',
    // 权威正式主题 - 红色+金色
    primary: 'rose-600',
    primaryLight: 'rose-500',
    primaryDark: 'rose-700',
    gradient: 'from-rose-600 via-red-600 to-amber-500',
    gradientHover: 'from-rose-500 via-red-500 to-amber-400',
    bgGradient: 'from-slate-950 via-rose-950 to-slate-900',
    bgCard: 'bg-rose-950/30',
    accent: 'amber-500',
    accentLight: 'amber-400',
    textPrimary: 'text-rose-100',
    textSecondary: 'text-rose-200/70',
    textMuted: 'text-rose-200/40',
    border: 'border-rose-500/20',
    borderActive: 'border-rose-500',
    shadow: 'shadow-rose-500/20',
    shadowGlow: 'shadow-[0_0_30px_rgba(225,29,72,0.3)]',
    decoration: {
      pattern: 'radial-gradient(circle at 50% 50%, rgba(225,29,72,0.12) 0%, transparent 60%), radial-gradient(circle at 20% 20%, rgba(245,158,11,0.1) 0%, transparent 40%)',
      icon: '🏟️',
      emoji: '🏆',
    },
    style: {
      title: '权威正式风格',
      description: '庄重的红金配色，彰显组织权威感',
      vibe: '权威、专业、荣耀',
    },
  },

  coach: {
    id: 'coach',
    name: '教练',
    nameEn: 'Coach',
    // 亲和指导主题 - 蓝色+青色
    primary: 'sky-500',
    primaryLight: 'sky-400',
    primaryDark: 'sky-600',
    gradient: 'from-sky-500 via-blue-500 to-teal-400',
    gradientHover: 'from-sky-400 via-blue-400 to-teal-300',
    bgGradient: 'from-slate-950 via-sky-950 to-slate-900',
    bgCard: 'bg-sky-950/30',
    accent: 'teal-400',
    accentLight: 'teal-300',
    textPrimary: 'text-sky-100',
    textSecondary: 'text-sky-200/70',
    textMuted: 'text-sky-200/40',
    border: 'border-sky-500/20',
    borderActive: 'border-sky-500',
    shadow: 'shadow-sky-500/20',
    shadowGlow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]',
    decoration: {
      pattern: 'radial-gradient(circle at 25% 75%, rgba(14,165,233,0.12) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(45,212,191,0.1) 0%, transparent 50%)',
      icon: '📋',
      emoji: '👨‍🏫',
    },
    style: {
      title: '亲和指导风格',
      description: '清爽的蓝色调，传递信任与专业指导感',
      vibe: '亲和、专业、指导',
    },
  },

  scout: {
    id: 'scout',
    name: '球探',
    nameEn: 'Scout',
    // 神秘洞察主题 - 紫罗兰+品红色
    primary: 'violet-500',
    primaryLight: 'violet-400',
    primaryDark: 'violet-600',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    gradientHover: 'from-violet-400 via-purple-400 to-fuchsia-400',
    bgGradient: 'from-slate-950 via-violet-950 to-slate-900',
    bgCard: 'bg-violet-950/30',
    accent: 'fuchsia-500',
    accentLight: 'fuchsia-400',
    textPrimary: 'text-violet-100',
    textSecondary: 'text-violet-200/70',
    textMuted: 'text-violet-200/40',
    border: 'border-violet-500/20',
    borderActive: 'border-violet-500',
    shadow: 'shadow-violet-500/20',
    shadowGlow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    decoration: {
      pattern: 'radial-gradient(circle at 20% 80%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(217,70,239,0.1) 0%, transparent 50%)',
      icon: '🔍',
      emoji: '🕵️',
    },
    style: {
      title: '神秘洞察风格',
      description: '深邃的紫罗兰色调，彰显发现人才的洞察力',
      vibe: '洞察、专业、发现',
    },
  },
};

// 通用步骤指示器主题（默认）
export const defaultStepTheme = {
  active: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white',
  completed: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  pending: 'bg-white/10 text-blue-200/50',
  lineActive: 'bg-gradient-to-r from-blue-500 to-purple-500',
  linePending: 'bg-white/10',
};

// 根据角色获取步骤指示器主题
export const getStepTheme = (role: UserRole | null) => {
  if (!role) return defaultStepTheme;
  const theme = roleThemes[role];
  return {
    active: `bg-gradient-to-r ${theme.gradient} text-white`,
    completed: `bg-gradient-to-r ${theme.gradient} text-white`,
    pending: 'bg-white/10 text-white/50',
    lineActive: `bg-gradient-to-r ${theme.gradient}`,
    linePending: 'bg-white/10',
  };
};

// 获取按钮样式
export const getButtonStyles = (role: UserRole | null, variant: 'primary' | 'secondary' = 'primary') => {
  if (!role) {
    if (variant === 'primary') {
      return 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30';
    }
    return 'bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all';
  }

  const theme = roleThemes[role];
  if (variant === 'primary') {
    return `bg-gradient-to-r ${theme.gradient} hover:${theme.gradientHover} text-white font-bold rounded-xl transition-all shadow-lg ${theme.shadow}`;
  }
  return `bg-white/5 border ${theme.border} hover:bg-white/10 ${theme.textPrimary} font-medium rounded-xl transition-all`;
};

// 获取输入框样式
export const getInputStyles = (role: UserRole | null, hasError: boolean = false) => {
  const base = 'w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all';
  if (hasError) {
    return `${base} border-red-500/50`;
  }
  if (!role) {
    return `${base} border-white/10 focus:border-blue-500/50`;
  }
  const theme = roleThemes[role];
  return `${base} ${theme.border} focus:border-${theme.primary}/50`;
};

// 获取卡片样式
export const getCardStyles = (role: UserRole | null, isActive: boolean = false) => {
  const base = 'p-6 rounded-2xl border-2 transition-all duration-300 text-left group';
  if (!role) {
    return isActive
      ? `${base} border-blue-500 bg-blue-500/10`
      : `${base} border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10`;
  }
  const theme = roleThemes[role];
  return isActive
    ? `${base} border-${theme.primary} ${theme.bgCard}`
    : `${base} ${theme.border} bg-white/5 hover:border-${theme.primary}/50 hover:bg-white/10`;
};
