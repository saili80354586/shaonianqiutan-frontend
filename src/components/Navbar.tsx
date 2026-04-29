import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import RoleSwitcher from './RoleSwitcher';
import { NotificationBadge } from './social';
  import {
    Home,
    Video,
    MapPin,
    UserPlus,
    ChevronDown,
    LogOut,
    User,
    Menu,
    X,
    Sparkles,
    BarChart3,
    ShieldCheck,
    Building2,
    GraduationCap,
    Bell,
    Mail,
    Building
  } from 'lucide-react';
import { messageApi } from '../services/api';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 滚动效果 - 使用更平滑的过渡
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      
      // 更平滑的显示/隐藏逻辑
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 获取私信未读数
  useEffect(() => {
    if (!isAuthenticated) return;
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 移动端手势处理
  useEffect(() => {
    if (!isOpen) return;
    
    let touchStartY = 0;
    let touchStartX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const diffY = touchY - touchStartY;
      const diffX = touchX - touchStartX;
      
      // 向下滑动超过80px关闭菜单
      if (diffY > 80 && Math.abs(diffX) < 50) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  // 阻止移动端菜单打开时背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    setActiveDropdown(null);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/video-analysis', label: '视频分析', icon: Video },
    { to: '/scout-map', label: '球探地图', icon: MapPin },
    { to: '/become-analyst', label: '分析师招募', icon: UserPlus },
    { to: '/club-landing', label: '俱乐部招募', icon: Building },
  ];

  // 统一的用户菜单项 —— 所有角色只保留3个入口：主页、工作台、退出登录
  // 其他功能全部移入各角色工作台内部
  const getUserMenuItems = () => {
    const role = user?.currentRole || user?.role;

    // 检查用户是否有特定角色
    const hasRole = (checkRole: string) => {
      if (!user?.roles || !Array.isArray(user.roles)) return false;
      return user.roles.some(r => r.type === checkRole && r.status === 'active');
    };

    // 俱乐部角色
    if (role === 'club' || hasRole('club')) {
      return [
        { to: '/club/dashboard?tab=home-preview', label: '俱乐部主页', icon: Building2 },
        { to: '/club/dashboard', label: '俱乐部后台', icon: BarChart3, highlight: true },
      ];
    }

    // 教练角色
    if (role === 'coach' || hasRole('coach')) {
      return [
        { to: `/coach/${user?.id || ''}`, label: '教练主页', icon: GraduationCap },
        { to: '/coach/dashboard', label: '教练工作台', icon: BarChart3, highlight: true },
      ];
    }

    // 分析师角色
    if (role === 'analyst' || hasRole('analyst')) {
      return [
        { to: `/analyst/${user?.id || ''}`, label: '分析师主页', icon: User },
        { to: '/analyst/dashboard', label: '分析师工作台', icon: BarChart3, highlight: true },
      ];
    }

    // 球探角色
    if (role === 'scout' || hasRole('scout')) {
      return [
        { to: `/personal-homepage/${user?.id || ''}`, label: '球探主页', icon: User },
        { to: '/scout/dashboard', label: '球探工作台', icon: BarChart3, highlight: true },
      ];
    }

    // 管理员角色
    if (role === 'admin' || hasRole('admin')) {
      return [
        { to: '/admin/dashboard', label: '管理后台', icon: ShieldCheck, highlight: true },
      ];
    }

    // 默认球员角色
    return [
      { to: `/personal-homepage/${user?.id || ''}`, label: '个人主页', icon: User },
      { to: '/user-dashboard', label: '用户工作台', icon: BarChart3, highlight: true },
    ];
  };

  const userMenuItems = getUserMenuItems();

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* 主导航栏 - 纯白色背景 */}
        <div 
          className={`transition-all duration-300 ease-out bg-white ${
            isScrolled 
              ? 'shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-slate-100' 
              : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              {/* Logo - 无需背景容器 */}
              <Link to="/" className="flex items-center gap-3 group">
                <img 
                  src="/images/logo-official.png" 
                  alt="少年球探" 
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-lg"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium",
                        "transition-all duration-300 ease-out overflow-hidden",
                        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-accent/0 before:via-accent/5 before:to-accent/0",
                        "before:translate-x-[-100%] before:transition-transform before:duration-500",
                        "hover:before:translate-x-[100%]",
                        active 
                          ? "text-emerald-600 bg-emerald-50 shadow-[inset_0_1px_2px_rgba(16,185,129,0.1)]" 
                          : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-all duration-300",
                        active ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500",
                        "group-hover:rotate-12"
                      )} />
                      <span className="relative z-10">{link.label}</span>
                      {active && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                {!isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    {/* 登录按钮 - 精致描边风格 */}
                    <Link
                      to="/login"
                      className="relative group px-5 py-2.5 text-sm font-medium text-slate-600 
                        border border-slate-200 rounded-full
                        transition-all duration-300 ease-out
                        hover:text-emerald-600 hover:border-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]
                        active:scale-95
                        overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-400 transition-colors duration-300" />
                        登录
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    
                    {/* 注册按钮 - 渐变悬浮效果 */}
                    <Link
                      to="/register"
                      className="relative group px-5 py-2.5 rounded-full font-medium text-sm text-white
                        bg-gradient-to-r from-emerald-500 to-teal-500
                        shadow-[0_4px_14px_rgba(16,185,129,0.35)]
                        transition-all duration-300 ease-out
                        hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5
                        hover:from-emerald-400 hover:to-teal-400
                        active:scale-95 active:translate-y-0
                        overflow-hidden"
                    >
                      {/* 流光效果 */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      {/* 闪光粒子 */}
                      <span className="absolute top-1 right-2 w-1 h-1 bg-white/60 rounded-full animate-ping" />
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        免费注册
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* 角色切换器 */}
                    <RoleSwitcher compact />

                    {/* 通知图标 */}
                    <Link
                      to="/notifications"
                      className="relative p-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-white hover:border-emerald-200 hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)] transition-all duration-300"
                    >
                      <Bell className="w-5 h-5 text-slate-600 hover:text-emerald-500" />
                      <NotificationBadge />
                    </Link>

                    {/* 私信图标 */}
                    <Link
                      to="/messages"
                      className="relative p-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-white hover:border-emerald-200 hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)] transition-all duration-300"
                    >
                      <Mail className="w-5 h-5 text-slate-600 hover:text-emerald-500" />
                      {messageUnreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                          {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === 'user' ? null : 'user');
                        }}
                        className={cn(
                          "flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-300",
                          "bg-slate-50 border border-slate-200",
                          "hover:bg-white hover:border-emerald-200 hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
                          "active:scale-95",
                          activeDropdown === 'user' && "border-emerald-300 bg-emerald-50/50 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                        )}
                      >
                        <div className="relative group">
                          <img
                            src={user?.avatar || '/images/avatar-default.svg'}
                            alt="头像"
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* 在线状态指示 */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-slate-700 text-sm font-medium block max-w-[70px] truncate">
                            {user?.name || user?.nickname || '用户'}
                          </span>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 text-slate-400 transition-all duration-300",
                          activeDropdown === 'user' ? "rotate-180 text-emerald-500" : "group-hover:text-emerald-500"
                        )} />
                      </button>

                      {/* User Dropdown Menu */}
                      {activeDropdown === 'user' && (
                        <div 
                          className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl py-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-scale-in origin-top-right overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 用户头像区域 */}
                          <div className="px-4 py-4 border-b border-slate-100 mb-2 bg-gradient-to-br from-emerald-50/50 to-transparent">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={user?.avatar || '/images/avatar-default.svg'}
                                  alt="头像"
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 font-semibold truncate">{user?.name || user?.nickname}</p>
                                <p className="text-slate-400 text-xs truncate">{user?.email || user?.phone}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* 菜单项 */}
                          {userMenuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isHighlight = (item as any).highlight;
                            return (
                              <Link
                                key={index}
                                to={item.to}
                                onClick={() => setActiveDropdown(null)}
                                className={cn(
                                  "group flex items-center gap-3 mx-2 px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
                                  isHighlight 
                                    ? "text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100 font-medium" 
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                  isHighlight 
                                    ? "bg-emerald-100 text-emerald-600 group-hover:scale-110" 
                                    : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500"
                                )}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span>{item.label}</span>
                                {isHighlight && (
                                  <span className="ml-auto px-2 py-0.5 bg-emerald-200/50 text-emerald-700 text-[10px] rounded-full font-medium">
                                    {(item as any).label.includes('管理') ? '管理员' :
                                     (item as any).label.includes('俱乐部') ? '俱乐部' :
                                     (item as any).label.includes('教练') ? '教练' :
                                     (item as any).label.includes('分析师') ? '分析师' :
                                     (item as any).label.includes('球探') ? '球探' :
                                     (item as any).label.includes('用户') ? '球员' : '工作台'}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                          
                          <div className="h-px bg-slate-100 my-2 mx-4" />
                          
                          {/* 退出登录 */}
                          <button
                            onClick={handleLogout}
                            className="group w-full flex items-center gap-3 mx-2 px-3 py-2.5 text-rose-500 text-sm rounded-xl hover:bg-rose-50 transition-all duration-200"
                          >
                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors duration-200">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span>退出登录</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="relative group inline-flex items-center justify-center p-2.5 rounded-xl 
                    text-slate-600 hover:text-emerald-600 
                    bg-slate-50 hover:bg-emerald-50 
                    border border-slate-200 hover:border-emerald-200
                    transition-all duration-300
                    hover:shadow-[0_4px_15px_rgba(16,185,129,0.15)]
                    active:scale-95"
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={cn(
            "md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-[-1]",
            "transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsOpen(false)}
        />
        
        {/* Mobile Menu */}
        <div 
          className={cn(
            "md:hidden fixed top-[72px] left-4 right-4 bg-white rounded-3xl",
            "shadow-[0_25px_80px_rgba(0,0,0,0.15)] border border-slate-100",
            "transition-all duration-300 ease-out origin-top",
            isOpen 
              ? "opacity-100 visible scale-100 translate-y-0" 
              : "opacity-0 invisible scale-95 -translate-y-4 pointer-events-none"
          )}
        >
          {/* 拖拽指示器 */}
          <div className="flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>
          
          <div className="px-4 pb-6 pt-2 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "group flex items-center gap-3.5 px-4 py-4 rounded-2xl text-base font-medium",
                    "transition-all duration-300 ease-out",
                    "active:scale-[0.96] touch-manipulation",
                    "min-h-[56px]",
                    active 
                      ? "text-emerald-600 bg-emerald-50/80 shadow-[inset_0_2px_4px_rgba(16,185,129,0.08)] border border-emerald-100" 
                      : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50 border border-transparent"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                    active 
                      ? "bg-emerald-100 text-emerald-600 shadow-sm" 
                      : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500 group-hover:scale-105 group-hover:shadow-sm"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className="flex-1">{link.label}</span>
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
            
            <div className="h-px bg-slate-100 my-3" />
            
            {!isAuthenticated ? (
              <div className="space-y-3 pt-4">
                {/* 登录按钮 - 精致描边 */}
                <Link
                  to="/login"
                  className="group flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl 
                    text-base font-medium text-slate-600
                    border-2 border-slate-200 
                    bg-slate-50/50
                    transition-all duration-300
                    hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50
                    active:scale-[0.96] touch-manipulation
                    min-h-[56px]"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-all duration-300 group-hover:scale-105">
                    <User className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                  </div>
                  登录
                </Link>
                
                {/* 注册按钮 - 渐变填充 */}
                <Link
                  to="/register"
                  className="group relative flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl 
                    text-base font-semibold text-white overflow-hidden
                    bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%]
                    shadow-[0_8px_25px_rgba(16,185,129,0.35)]
                    transition-all duration-500
                    hover:shadow-[0_12px_35px_rgba(16,185,129,0.5)] hover:bg-[position:100%_0]
                    active:scale-[0.96] touch-manipulation
                    min-h-[56px]"
                  onClick={() => setIsOpen(false)}
                >
                  {/* 流光效果 */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  免费注册
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 用户信息卡片 */}
                <div className="flex items-center gap-4 px-4 py-4 mb-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="relative">
                    <img
                      src={user?.avatar || '/images/avatar-default.svg'}
                      alt="头像"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold text-lg">{user?.name || user?.nickname}</p>
                    <p className="text-emerald-600 text-sm font-medium">
                      {(() => {
                        const role = user?.currentRole || user?.role;
                        const roleMap: Record<string, string> = {
                          admin: '管理员',
                          analyst: '分析师',
                          club: '俱乐部',
                          coach: '教练',
                          player: '球员',
                          user: '球员'
                        };
                        return roleMap[role || ''] || '球员';
                      })()}
                    </p>
                  </div>
                </div>
                
                {/* 通知与私信快捷入口 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">通知中心</span>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-300 relative"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">私信</span>
                    {messageUnreadCount > 0 && (
                      <span className="absolute top-2 right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                      </span>
                    )}
                  </Link>
                </div>

                {/* 分隔线 */}
                <div className="h-px bg-slate-100 my-4" />

                {/* 用户菜单项 */}
                {userMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-3.5 px-4 py-4 rounded-2xl 
                        text-slate-600 
                        transition-all duration-300
                        hover:text-emerald-600 hover:bg-emerald-50/50
                        active:scale-[0.96] touch-manipulation
                        min-h-[56px]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center 
                        text-slate-400 
                        group-hover:bg-emerald-100 group-hover:text-emerald-500
                        transition-all duration-300 group-hover:scale-105 shadow-sm group-hover:shadow-md">
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <span className="font-medium flex-1">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* 退出登录 */}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="group flex items-center gap-3.5 w-full px-4 py-4 mt-3 rounded-2xl 
                    text-rose-500
                    transition-all duration-300
                    hover:bg-rose-50
                    active:scale-[0.96] touch-manipulation
                    min-h-[56px]"
                >
                  <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center 
                    text-rose-400
                    group-hover:bg-rose-200 group-hover:text-rose-500
                    transition-all duration-300 group-hover:scale-105 shadow-sm">
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className="font-medium flex-1">退出登录</span>
                </button>
              </div>
            )}
          </div>
          
          {/* 底部安全区域占位 */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      {/* CSS动画 */}
      <style>{`
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* 移动端优化 */
        @media (max-width: 768px) {
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* 禁用移动端菜单内的文本选择 */
          .touch-manipulation * {
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* 允许输入框内的文本选择 */
          .touch-manipulation input,
          .touch-manipulation textarea {
            -webkit-user-select: text;
            user-select: text;
          }
        }
        
        /* 安全区域适配 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </>
  );
};

// cn 辅助函数
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Navbar;
