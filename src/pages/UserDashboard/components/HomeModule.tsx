import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Play,
  FileText,
  User,
  Clock,
  CheckCircle,
  Video,
  Download,
  ArrowRight,
  Award,
  Target,
  Flame,
  Trophy,
  Star,
  BarChart3,
  Zap,
  ChevronRight,
  AlertCircle,
  Activity,
  Bell,
  Building2,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../../store';
import { ListItemSkeleton } from "../../../components/ui/loading";
import {
  orderApi, reportApi, videoAnalysisApi, notificationApi, playerApi,
  matchSummaryApi, weeklyReportApi,
} from '../../../services/api';
import type { Order, Report, Notification, VideoAnalysis } from '../../../types';

// 内联类型定义
type OrderStatus = Order['status'];
type ReportStatus = 'processing' | 'completed';
type DashboardTab = 'home' | 'orders' | 'profile' | 'growth' | 'weekly_reports' | 'match_reports';

interface HomeModuleProps {
  onTabChange?: (tab: DashboardTab) => void;
}

interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  totalReports: number;
  avgScore: number;
  pendingOrders: number;
  processingOrders: number;
  totalAnalyses: number;
  unreadNotifications: number;
  growthRecordCount: number;
  weeklyReportCount: number;
  pendingWeeklyReports: number;
  matchCount: number;
  pendingMatchReviews: number;
  followerCount: number;
}

interface TimelineItem {
  date: string;
  title: string;
  description: string;
  type: 'report' | 'order' | 'physical' | 'analysis' | 'notification';
  score?: number;
  status?: string;
  icon: React.ReactNode;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: DashboardTab | (() => void);
  icon: React.ReactNode;
  done?: boolean;
}

// 数字递增动画 hook
const useCountUp = (target: number, duration = 1000, start = 0) => {
  const [value, setValue] = useState(start);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const startTime = performance.now();
    const from = value;
    const to = target;
    const diff = to - from;

    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(from + diff * ease));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

export const HomeModule: React.FC<HomeModuleProps> = ({ onTabChange }) => {
  const { user } = useAuthStore();
  const displayName = user?.nickname || user?.name || '球员';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    completedOrders: 0,
    totalReports: 0,
    avgScore: 0,
    pendingOrders: 0,
    processingOrders: 0,
    totalAnalyses: 0,
    unreadNotifications: 0,
    growthRecordCount: 0,
    weeklyReportCount: 0,
    pendingWeeklyReports: 0,
    matchCount: 0,
    pendingMatchReviews: 0,
    followerCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<VideoAnalysis[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [growthRecords, setGrowthRecords] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  // 数字递增动画值
  const animTotalOrders = useCountUp(stats.totalOrders, 800);
  const animTotalAnalyses = useCountUp(stats.totalAnalyses, 800);
  const animWeeklyCount = useCountUp(stats.weeklyReportCount, 800);
  const animMatchCount = useCountUp(stats.matchCount, 800);

  // 加载真实数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 判断俱乐部状态
        const clubFlag = !!user?.club;
        setHasClub(clubFlag);

        // 并行加载所有数据
        const [
          ordersRes,
          reportsRes,
          analysesRes,
          notificationsRes,
          growthRes,
          matchesRes,
          weeklyRes,
        ] = await Promise.allSettled([
          orderApi.getOrders({ page: 1, pageSize: 3 }),
          reportApi.getMyReports({ page: 1, pageSize: 3 }),
          videoAnalysisApi.getMyVideoAnalyses({ page: 1, pageSize: 3 }),
          notificationApi.getNotifications({ page: 1, pageSize: 5 }),
          playerApi.getPhysicalTests(),
          // 球员端比赛列表（需要 user.id）
          user?.id ? matchSummaryApi.getPlayerMatchSummaries(user.id, { page: 1, pageSize: 100 }) : Promise.resolve({ data: { success: true, data: { list: [], total: 0 } } } as any),
          // 球员端周报列表（需要 user.id）
          user?.id ? weeklyReportApi.getPlayerReports(user.id, { page: 1, pageSize: 100 }) : Promise.resolve({ data: { success: true, data: { list: [], total: 0 } } } as any),
        ]);

        // 处理订单数据
        let orders: Order[] = [];
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
          orders = ordersRes.value.data.data?.list || [];
          setRecentOrders(orders);
        }

        // 处理报告数据
        let reports: Report[] = [];
        if (reportsRes.status === 'fulfilled' && reportsRes.value.data?.success) {
          const result = reportsRes.value.data.data?.data || reportsRes.value.data.data || {};
          reports = result.list || [];
          setRecentReports(reports);
        }

        // 处理视频分析数据
        let analyses: VideoAnalysis[] = [];
        if (analysesRes.status === 'fulfilled' && analysesRes.value.data?.success) {
          analyses = analysesRes.value.data.data?.list || [];
          setRecentAnalyses(analyses);
        }

        // 处理通知数据
        let notifications: Notification[] = [];
        if (notificationsRes.status === 'fulfilled' && notificationsRes.value.data?.success) {
          notifications = notificationsRes.value.data.data?.list || [];
          setRecentNotifications(notifications);
        }

        // 处理成长记录（体测数据）
        let growths: any[] = [];
        if (growthRes.status === 'fulfilled' && growthRes.value.data?.success) {
          growths = growthRes.value.data.data?.records || [];
          setGrowthRecords(growths);
        }

        // 处理比赛数据
        let matches: any[] = [];
        let matchTotal = 0;
        if (matchesRes.status === 'fulfilled' && matchesRes.value.data?.success) {
          matches = matchesRes.value.data.data?.list || [];
          matchTotal = matchesRes.value.data.data?.total || matches.length;
        } else if (matchesRes.status === 'rejected') {
          const errMsg = (matchesRes.reason as any)?.response?.data?.message || '';
          if (errMsg.includes('俱乐部') || errMsg.includes('球队') || errMsg.includes('未加入')) {
            setHasClub(false);
          }
        }

        // 处理周报数据
        let weeklyReports: any[] = [];
        let weeklyTotal = 0;
        if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data?.success) {
          weeklyReports = weeklyRes.value.data.data?.list || [];
          weeklyTotal = weeklyRes.value.data.data?.total || weeklyReports.length;
        } else if (weeklyRes.status === 'rejected') {
          const errMsg = (weeklyRes.reason as any)?.response?.data?.message || '';
          if (errMsg.includes('俱乐部') || errMsg.includes('球队') || errMsg.includes('未加入')) {
            setHasClub(false);
          }
        }

        // 计算统计数据
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => ['paid', 'assigned', 'accepted', 'submitted'].includes(o.status)).length;
        const avgScore = reports.length > 0
          ? reports.reduce((sum, r) => sum + (r.rating || 0), 0) / reports.length
          : 0;
        const unreadCount = notifications.filter(n => !n.is_read).length;

        // 待自评比赛数（状态为 pending 且球员在 playerIds 中）
        const pendingMatchReviews = matches.filter((m: any) => m.status === 'pending').length;
        // 待提交周报数（状态为 pending）
        const pendingWeeklyReports = weeklyReports.filter((r: any) => r.status === 'pending').length;

        setStats({
          totalOrders: orders.length,
          completedOrders,
          totalReports: reports.length,
          avgScore: Number(avgScore.toFixed(1)),
          pendingOrders,
          processingOrders,
          totalAnalyses: analyses.length,
          unreadNotifications: unreadCount,
          growthRecordCount: growths.length,
          weeklyReportCount: weeklyTotal,
          pendingWeeklyReports,
          matchCount: matchTotal,
          pendingMatchReviews,
          followerCount: (user as any)?.followers_count || 0,
        });

        // 构建任务列表（基于真实数据）
        const taskItems: TaskItem[] = [];
        if (pendingOrders > 0) {
          taskItems.push({
            id: 'pending-orders',
            title: '待支付订单',
            description: `您有 ${pendingOrders} 个订单等待支付`,
            priority: 'high',
            action: 'orders',
            icon: <AlertCircle size={18} className="text-red-400" />,
          });
        }
        if (processingOrders > 0) {
          taskItems.push({
            id: 'processing-orders',
            title: '进行中的订单',
            description: `您有 ${processingOrders} 个订单正在处理中`,
            priority: 'medium',
            action: 'orders',
            icon: <Clock size={18} className="text-blue-400" />,
          });
        }
        if (pendingMatchReviews > 0 && hasClub !== false) {
          taskItems.push({
            id: 'pending-match-reviews',
            title: '比赛自评待提交',
            description: `您有 ${pendingMatchReviews} 场比赛自评待提交`,
            priority: 'high',
            action: 'match_reports',
            icon: <Target size={18} className="text-orange-400" />,
          });
        }
        if (pendingWeeklyReports > 0 && hasClub !== false) {
          taskItems.push({
            id: 'pending-weekly-reports',
            title: '本周周报待提交',
            description: `您有 ${pendingWeeklyReports} 份周报待提交`,
            priority: 'high',
            action: 'weekly_reports',
            icon: <FileText size={18} className="text-yellow-400" />,
          });
        }
        if (unreadCount > 0) {
          taskItems.push({
            id: 'unread-notifications',
            title: '未读通知',
            description: `您有 ${unreadCount} 条未读通知`,
            priority: 'low',
            action: () => {}, // 通知没有独立 tab，点击不跳转
            icon: <Bell size={18} className="text-purple-400" />,
          });
        }
        if (growths.length === 0) {
          taskItems.push({
            id: 'first-growth',
            title: '记录成长数据',
            description: '完善您的第一条体测记录',
            priority: 'low',
            action: 'growth',
            icon: <Activity size={18} className="text-emerald-400" />,
          });
        }
        if (!clubFlag) {
          taskItems.push({
            id: 'join-club',
            title: '加入俱乐部',
            description: '加入俱乐部后可使用周报、比赛等功能',
            priority: 'medium',
            action: () => {}, // 后面可以跳转俱乐部推荐
            icon: <Building2 size={18} className="text-cyan-400" />,
          });
        }
        setTasks(taskItems);

        // 构建时间轴数据（基于真实数据）
        const timelineItems: TimelineItem[] = [];
        
        // 添加订单到时间轴
        orders.slice(0, 2).forEach(order => {
          timelineItems.push({
            date: order.created_at?.split('T')[0] || '',
            title: order.match_name || '订单创建',
            description: `状态: ${getOrderStatusText(order.status)} · ¥${order.amount}`,
            type: 'order',
            status: order.status,
            icon: <Video size={20} className="text-blue-400" />,
          });
        });

        // 添加报告到时间轴
        reports.slice(0, 2).forEach(report => {
          timelineItems.push({
            date: report.created_at?.split('T')[0] || '',
            title: report.title || '分析报告',
            description: `综合评分 ${report.rating || '-'} 分`,
            type: 'report',
            score: report.rating,
            icon: <Award size={20} className="text-yellow-400" />,
          });
        });

        // 添加视频分析到时间轴
        analyses.slice(0, 1).forEach(analysis => {
          timelineItems.push({
            date: analysis.created_at?.split('T')[0] || '',
            title: analysis.match_name || '视频分析',
            description: `潜力评级: ${analysis.potential_level || '-'} · 综合评分: ${analysis.overall_score || '-'}`,
            type: 'analysis',
            icon: <Target size={20} className="text-green-400" />,
          });
        });

        // 添加成长记录到时间轴
        growths.slice(0, 2).forEach(growth => {
          timelineItems.push({
            date: growth.date,
            title: growth.title || '成长记录',
            description: growth.content?.substring(0, 50) + (growth.content && growth.content.length > 50 ? '...' : '') || '',
            type: 'physical',
            icon: <Activity size={20} className="text-emerald-400" />,
          });
        });

        // 添加通知到时间轴
        notifications.slice(0, 2).forEach(n => {
          timelineItems.push({
            date: n.created_at?.split('T')[0] || '',
            title: n.title || '通知',
            description: n.content?.substring(0, 50) + (n.content && n.content.length > 50 ? '...' : '') || '',
            type: 'notification',
            icon: <Bell size={20} className="text-purple-400" />,
          });
        });

        // 按日期排序
        timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTimeline(timelineItems.slice(0, 6));
      } catch (err) {
        console.error('加载仪表盘数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.club]);

  const handleQuickAction = (action: DashboardTab) => {
    if (onTabChange) {
      onTabChange(action);
    }
  };

  const getOrderStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待支付',
      paid: '待上传',
      assigned: '已派发',
      accepted: '分析中',
      submitted: '待审核',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getOrderStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'text-yellow-400 bg-yellow-500/10',
      paid: 'text-blue-400 bg-blue-500/10',
      assigned: 'text-purple-400 bg-purple-500/10',
      accepted: 'text-purple-400 bg-purple-500/10',
      submitted: 'text-amber-400 bg-amber-500/10',
      completed: 'text-green-400 bg-green-500/10',
      cancelled: 'text-red-400 bg-red-500/10'
    };
    return map[status] || 'text-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 欢迎语 */}
      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#252b3d] rounded-2xl border border-gray-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#39ff14]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-2">
            欢迎回来，{displayName}！
          </h1>
          <p className="text-gray-400">
            今天也是充满活力的一天，继续加油！💪
          </p>
          {stats.pendingOrders > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400">
              <AlertCircle size={16} />
              <span>您有 {stats.pendingOrders} 个待支付订单</span>
              <button
                onClick={() => handleQuickAction('orders')}
                className="text-[#39ff14] hover:underline ml-2"
              >
                去查看 →
              </button>
            </div>
          )}
          {stats.unreadNotifications > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
              <Bell size={16} />
              <span>您有 {stats.unreadNotifications} 条未读通知</span>
            </div>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 全部订单 */}
        <div
          onClick={() => handleQuickAction('orders')}
          className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5 hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={24} className="text-blue-400" />
              </div>
              <div className="px-2 py-1 bg-green-500/10 rounded-lg">
                <TrendingUp size={14} className="text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">全部订单</p>
            <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
              {loading ? '-' : animTotalOrders}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.pendingOrders > 0 ? (
                <span className="text-yellow-400">{stats.pendingOrders} 个待支付</span>
              ) : stats.processingOrders > 0 ? (
                `${stats.processingOrders} 个进行中`
              ) : (
                '无进行中的订单'
              )}
            </p>
          </div>
        </div>

        {/* 视频分析 */}
        <div
          onClick={() => handleQuickAction('orders')}
          className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Video size={24} className="text-purple-400" />
              </div>
              <div className="px-2 py-1 bg-purple-500/10 rounded-lg">
                <Target size={14} className="text-purple-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">视频分析</p>
            <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
              {loading ? '-' : animTotalAnalyses}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.totalAnalyses > 0 ? '已生成分析报告' : '暂无分析记录'}
            </p>
          </div>
        </div>

        {/* 周报 */}
        <div
          onClick={() => hasClub !== false && handleQuickAction('weekly_reports')}
          className={`bg-[#1a1f2e] rounded-xl border p-5 transition-all duration-300 group relative overflow-hidden ${
            hasClub === false
              ? 'opacity-60 cursor-not-allowed border-gray-800/50'
              : 'border-gray-800 cursor-pointer hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]'
          }`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors ${hasClub === false ? 'bg-gray-500/5' : 'bg-yellow-500/5 group-hover:bg-yellow-500/10'}`} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center transition-transform duration-300 ${hasClub !== false && 'group-hover:scale-110'}`}>
                <FileText size={24} className="text-yellow-400" />
              </div>
              <div className="px-2 py-1 bg-yellow-500/10 rounded-lg">
                <Calendar size={14} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">周报</p>
            <p className={`text-3xl font-bold transition-colors duration-300 ${hasClub === false ? 'text-gray-500' : 'text-white group-hover:text-yellow-400'}`}>
              {loading ? '-' : animWeeklyCount}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {hasClub === false ? (
                <span className="text-gray-500">加入俱乐部后可用</span>
              ) : stats.pendingWeeklyReports > 0 ? (
                <span className="text-orange-400">{stats.pendingWeeklyReports} 份待提交</span>
              ) : (
                '本周已提交'
              )}
            </p>
          </div>
        </div>

        {/* 比赛 */}
        <div
          onClick={() => hasClub !== false && handleQuickAction('match_reports')}
          className={`bg-[#1a1f2e] rounded-xl border p-5 transition-all duration-300 group relative overflow-hidden ${
            hasClub === false
              ? 'opacity-60 cursor-not-allowed border-gray-800/50'
              : 'border-gray-800 cursor-pointer hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.12)]'
          }`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors ${hasClub === false ? 'bg-gray-500/5' : 'bg-red-500/5 group-hover:bg-red-500/10'}`} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center transition-transform duration-300 ${hasClub !== false && 'group-hover:scale-110'}`}>
                <Shield size={24} className="text-red-400" />
              </div>
              <div className="px-2 py-1 bg-red-500/10 rounded-lg">
                <Trophy size={14} className="text-red-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">比赛</p>
            <p className={`text-3xl font-bold transition-colors duration-300 ${hasClub === false ? 'text-gray-500' : 'text-white group-hover:text-red-400'}`}>
              {loading ? '-' : animMatchCount}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {hasClub === false ? (
                <span className="text-gray-500">加入俱乐部后可用</span>
              ) : stats.pendingMatchReviews > 0 ? (
                <span className="text-orange-400">{stats.pendingMatchReviews} 场待自评</span>
              ) : (
                '暂无待评比赛'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 快捷入口 - 动态根据数据状态 */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap size={24} className="text-[#39ff14]" />
          快捷入口
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              id: 'upload',
              title: '上传视频',
              description: stats.totalAnalyses > 0 ? `已有 ${stats.totalAnalyses} 个分析` : '开始新的视频分析',
              icon: <Play size={24} className="text-[#39ff14]" />,
              color: 'from-green-500/20 to-green-600/20',
              borderColor: 'border-green-500/30',
              action: 'orders' as DashboardTab
            },
            {
              id: 'reports',
              title: '查看报告',
              description: stats.totalReports > 0 ? `已有 ${stats.totalReports} 份报告` : '浏览所有分析报告',
              icon: <FileText size={24} className="text-blue-400" />,
              color: 'from-blue-500/20 to-blue-600/20',
              borderColor: 'border-blue-500/30',
              action: 'orders' as DashboardTab
            },
            {
              id: hasClub === false ? 'join-club' : 'profile',
              title: hasClub === false ? '加入俱乐部' : '编辑资料',
              description: hasClub === false
                ? '解锁周报、比赛等功能'
                : user?.club
                  ? `所属: ${user.club}`
                  : '完善个人信息',
              icon: hasClub === false
                ? <Building2 size={24} className="text-cyan-400" />
                : <User size={24} className="text-purple-400" />,
              color: hasClub === false ? 'from-cyan-500/20 to-cyan-600/20' : 'from-purple-500/20 to-purple-600/20',
              borderColor: hasClub === false ? 'border-cyan-500/30' : 'border-purple-500/30',
              action: hasClub === false ? 'profile' as DashboardTab : 'profile' as DashboardTab
            },
            {
              id: 'growth',
              title: '成长记录',
              description: stats.growthRecordCount > 0 ? `已记录 ${stats.growthRecordCount} 次` : '查看成长轨迹',
              icon: <TrendingUp size={24} className="text-yellow-400" />,
              color: 'from-yellow-500/20 to-yellow-600/20',
              borderColor: 'border-yellow-500/30',
              action: 'growth' as DashboardTab
            }
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className={`bg-gradient-to-br ${action.color} rounded-xl border ${action.borderColor} p-5 text-left hover:scale-105 transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
                  {action.icon}
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">{action.title}</h3>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 待办任务 */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={24} className="text-[#39ff14]" />
            待办任务
            <span className="px-2 py-0.5 bg-[#39ff14]/10 text-[#39ff14] rounded-full text-xs">
              {tasks.length}
            </span>
          </h2>
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    if (typeof task.action === 'function') {
                      (task.action as () => void)();
                    } else {
                      handleQuickAction(task.action as DashboardTab);
                    }
                  }}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                    task.priority === 'high'
                      ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/10'
                      : task.priority === 'medium'
                        ? 'bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10'
                        : 'bg-gray-500/5 hover:bg-gray-500/10 border border-gray-500/10'
                  }`}
                >
                  <div className="flex-shrink-0">{task.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white text-sm font-medium">{task.title}</h4>
                      {task.priority === 'high' && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">紧急</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{task.description}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 最近订单和报告 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-[#39ff14]" />
              最近订单
            </h2>
            <button
              onClick={() => handleQuickAction('orders')}
              className="text-sm text-[#39ff14] hover:text-[#39ff14]/80 transition-colors flex items-center gap-1"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <ListItemSkeleton count={3} />
                </div>
              ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-[#111827] rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{order.match_name || order.player_name || `订单 #${order.id}`}</h4>
                    <p className="text-gray-500 text-xs mt-1">{order.created_at?.split('T')[0]}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`px-2 py-1 rounded text-xs ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                    <span className="text-[#39ff14] text-sm">¥{order.amount}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无订单</p>
                <button
                  onClick={() => handleQuickAction('orders')}
                  className="text-[#39ff14] text-sm mt-2 hover:underline"
                >
                  立即创建订单 →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 最近视频分析 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Video size={20} className="text-[#39ff14]" />
              最近视频分析
            </h2>
            <button
              onClick={() => handleQuickAction('orders')}
              className="text-sm text-[#39ff14] hover:text-[#39ff14]/80 transition-colors flex items-center gap-1"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <ListItemSkeleton count={2} />
              </div>
            ) : recentAnalyses.length > 0 ? (
              recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-3 bg-[#111827] rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{analysis.match_name || '视频分析'}</h4>
                    <p className="text-gray-500 text-xs mt-1">{analysis.created_at?.split('T')[0]}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {analysis.overall_score > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded text-yellow-400 text-xs">
                        <Star size={12} /> {analysis.overall_score}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      analysis.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                      analysis.status === 'scoring' ? 'text-purple-400 bg-purple-500/10' :
                      'text-gray-400 bg-gray-500/10'
                    }`}>
                      {analysis.status === 'completed' ? '已完成' :
                       analysis.status === 'scoring' ? '评分中' :
                       analysis.status === 'draft' ? '草稿' :
                       analysis.status === 'generating' ? '生成中' : analysis.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Video size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无视频分析</p>
                <button
                  onClick={() => handleQuickAction('orders')}
                  className="text-[#39ff14] text-sm mt-2 hover:underline"
                >
                  上传视频开始分析 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 成长档案时间轴 - 基于真实数据 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={24} className="text-[#39ff14]" />
            成长档案
          </h2>
          <button
            onClick={() => handleQuickAction('growth')}
            className="text-sm text-[#39ff14] hover:text-[#39ff14]/80 transition-colors flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          {loading ? (
            <div className="space-y-3">
              <ListItemSkeleton count={4} />
            </div>
          ) : timeline.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="relative pl-6">
                  {index !== timeline.length - 1 && index !== Math.floor(timeline.length / 2) - 1 && (
                    <div className="absolute left-2 top-6 w-0.5 h-full bg-gray-800 hidden lg:block" />
                  )}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#39ff14] border-2 border-[#1a1f2e]" />
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500 text-sm">{item.date}</span>
                    {item.score && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs font-medium">
                        {item.score}分
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs font-medium">
                        进行中
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    {item.icon}
                    <div>
                      <h3 className="text-white font-medium mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p>暂无成长记录</p>
              <button
                onClick={() => handleQuickAction('growth')}
                className="text-[#39ff14] text-sm mt-2 hover:underline"
              >
                记录第一条数据 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeModule;
