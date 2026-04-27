import type { LucideIcon } from 'lucide-react';

// ============================================================
// Dashboard 类型定义
// ============================================================

export interface MenuItemDef {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
}

export interface MenuGroupDef {
  key: string;
  label: string;
  icon: LucideIcon;
  items: MenuItemDef[];
}

export interface SidebarConfig {
  /** 角色名称，如"用户中心"、"分析师工作台" */
  roleName: string;
  /** 角色主题色 */
  themeColor?: string;
  /** 业务菜单分组 */
  businessGroups: MenuGroupDef[];
  /** 独立的菜单项（不分组） */
  standaloneItems?: MenuItemDef[];
  /** 个人主页路径 */
  profilePath?: string;
  /** 个人主页下方的子菜单项 */
  profileSubItems?: MenuItemDef[];
  /** 工作台路径 */
  dashboardPath: string;
  /** 是否显示发布动态 */
  showCreatePost?: boolean;
  /** 自定义顶部操作 */
  headerActions?: React.ReactNode;
  /** 顶部导航项 */
  headerNavItems?: { label: string; path: string }[];
}

export interface DashboardLayoutProps {
  /** 侧边栏配置 */
  sidebarConfig: SidebarConfig;
  /** 当前激活的菜单项ID */
  activeItemId?: string;
  /** 当前激活的分组key */
  activeGroupKey?: string;
  /** 菜单项点击回调 */
  onItemClick?: (item: MenuItemDef) => void;
  /** 页面标题 */
  pageTitle?: string;
  /** 页面头部右侧操作 */
  headerActions?: React.ReactNode;
  /** 是否显示移动端菜单按钮 */
  showMobileMenuButton?: boolean;
  /** 子内容 */
  children: React.ReactNode;
  /** 发布动态回调 */
  onCreatePost?: () => void;
  /** 自定义CSS类名 */
  className?: string;
  /** 主内容区域是否使用默认内边距 */
  defaultPadding?: boolean;
}

export interface DashboardSidebarProps {
  config: SidebarConfig;
  /** 当前激活的菜单项ID */
  activeItemId?: string;
  /** 当前激活的分组key */
  activeGroupKey?: string;
  /** 菜单项点击回调 */
  onItemClick?: (item: MenuItemDef) => void;
  /** 移动端是否打开 */
  mobileOpen?: boolean;
  /** 关闭移动端侧边栏 */
  onMobileClose?: () => void;
  /** 发布动态回调 */
  onCreatePost?: () => void;
}
