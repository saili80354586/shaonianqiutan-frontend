import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  PlayCircle,
  DollarSign,
  AlertCircle,
  Video,
  FileText,
  ChevronRight,
  RotateCcw,
  TrendingUp,
  Calendar,
  BarChart3,
  User,
  Award,
  Zap,
  FileSearch,
  X,
  Download,
  LayoutDashboard,
  Inbox,
} from 'lucide-react';
import { analystApi, reportApi } from '../../services/api';
import { useAuthStore } from '../../store';
import type { Order, Report, OrderType } from '../../types';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard';
import type { SidebarConfig } from '../../components/dashboard/types';
import { CreatePostModal } from '../ScoutMap/SocialFeed';
import { StatsGridSkeleton, ListItemSkeleton, CardSkeleton } from '../../components/ui/loading';

// 子组件导入
import PendingOrders from './PendingOrders';
import ActiveOrders from './ActiveOrders';
import VideoAnalysisWorkspace from './components/VideoAnalysisWorkspace';
import HistoryOrders from './HistoryOrders';
import IncomeStats from './IncomeStats';

const AnalystDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'active' | 'history' | 'income' | 'analysis'>('overview');
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeCount: 0,
    todayDeadlineCount: 0,
    monthlyIncome: 0,
    totalCompleted: 0,
    avgRating: 0,
    rankingPercent: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [earliestPendingOrder, setEarliestPendingOrder] = useState<Order | null>(null);
  const [todayDeadlineOrder, setTodayDeadlineOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingReportOrder, setViewingReportOrder] = useState<Order | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, activeResponse, pendingResponse] = await Promise.all([
        analystApi.getDashboardStats(),
        analystApi.getActiveOrders({ page: 1, pageSize: 5 }),
        analystApi.getPendingOrders()
      ]);
      if (statsResponse.data?.success && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }
      if (activeResponse.data?.success && activeResponse.data?.data) {
        setRecentOrders(activeResponse.data.data.list);
        const today = new Date().toISOString().split('T')[0];
        const deadlineOrder = activeResponse.data.data.list.find((o: Order) =>
          o.deadline && o.deadline.startsWith(today)
        );
        setTodayDeadlineOrder(deadlineOrder || null);
      }
      if (pendingResponse.data?.success && pendingResponse.data?.data) {
        const list = pendingResponse.data.data.list || [];
        setEarliestPendingOrder(list[0] || null);
      }
    } catch (error) {
      toast.error('加载工作台数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('analysis');
  };

  const handleAcceptEarliest = async () => {
    if (!earliestPendingOrder) return;
    try {
      const res = await analystApi.acceptOrder(earliestPendingOrder.id.toString());
      if (res.data?.success) {
        toast.success('接单成功！');
        loadDashboardData();
        setActiveTab('active');
      } else {
        toast.error(res.data?.data?.message || '接单失败');
      }
    } catch (error) {
      toast.error('接单失败，请重试');
    }
  };

  const handleAnalysisComplete = () => {
    setSelectedOrder(null);
    setActiveTab('active');
    loadDashboardData();
  };

  const handleViewReport = async (order: Order) => {
    setViewingReportOrder(order);
    setReportLoading(true);
    try {
      if (order.report_id) {
        const res = await reportApi.getReportDetail(order.report_id);
        if (res.data?.success && res.data?.data) {
          setViewingReport(res.data.data.report || res.data.data);
        } else {
          toast.error('加载报告失败');
        }
      } else {
        toast.error('该订单暂无报告');
      }
    } catch (error) {
      toast.error('加载报告失败');
    } finally {
      setReportLoading(false);
    }
  };

  const handleCloseReport = () => {
    setViewingReportOrder(null);
    setViewingReport(null);
  };

  const getOrderTypeBadge = (type: OrderType) => {
    const config = type === 'pro' || type === 'video'
      ? { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', icon: Video, label: '视频解析版' }
      : { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: FileText, label: '文字版' };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {config.label}
      </span>
    );
  };

  const getRemainingTime = (deadline?: string) => {
    if (!deadline) return '-';
    const end = new Date(deadline);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff < 0) return '已逾期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}天${hours % 24}小时`;
    }
    return `${hours}小时${minutes}分`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    return `${Math.floor(seconds / 60)}分钟`;
  };

  const rawRankingPercent = Number(stats.rankingPercent);
  const hasRankingPercent = Number.isFinite(rawRankingPercent) && rawRankingPercent > 0;
  const rankingPercent = Math.max(1, Math.min(100, Math.round(rawRankingPercent)));
  const rankingProgressWidth = hasRankingPercent ? Math.max(5, 100 - rankingPercent) : 0;

  const StatCard = ({ title, value, subtext, icon: Icon, color, onClick, extra, breathing }: any) => {
    const colors: any = {
      yellow: { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/20', text: 'text-yellow-400', ring: 'focus:ring-yellow-500/50' },
      blue: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', ring: 'focus:ring-blue-500/50' },
      red: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20', text: 'text-red-400', ring: 'focus:ring-red-500/50' },
      green: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/20', text: 'text-green-400', ring: 'focus:ring-green-500/50' },
    };
    const c = colors[color];
    return (
      <div 
        onClick={onClick}
        className={`group relative bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 cursor-pointer overflow-hidden transition-all duration-300 hover:border-${color}-500/50 hover:shadow-lg hover:shadow-${color}-500/10 focus:outline-none focus:ring-2 ${c.ring} focus:ring-offset-2 focus:ring-offset-[#0f1419] ${breathing ? 'animate-pulse' : ''}`}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`w-7 h-7 ${c.text}`} />
          </div>
        </div>
        <div className="relative mt-5 flex items-center text-sm">
          <span className={`${c.text} font-medium`}>{subtext}</span>
          <ChevronRight className={`w-4 h-4 ${c.text} ml-1 transition-transform duration-300 group-hover:translate-x-1`} />
        </div>
        {extra && <div className="relative mt-3">{extra}</div>}
      </div>
    );
  };

  const Overview = () => (
    <div className="space-y-8">
      {/* 统计卡片 */}
      {loading ? (
        <StatsGridSkeleton count={4} columns={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <>
            <StatCard
              title="待处理订单"
              value={stats.pendingCount}
              subtext="点击查看"
              icon={Clock}
              color="yellow"
              onClick={() => setActiveTab('pending')}
              extra={stats.pendingCount > 0 && earliestPendingOrder ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAcceptEarliest(); }}
                  className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
                >
                  一键接受最早订单
                </button>
              ) : null}
            />
            <StatCard title="进行中" value={stats.activeCount} subtext="继续分析" icon={PlayCircle} color="blue" onClick={() => setActiveTab('active')} />
            <StatCard
              title="今日截止"
              value={stats.todayDeadlineCount}
              subtext={stats.todayDeadlineCount > 0 ? '⚠️ 请及时处理' : '暂无紧急订单'}
              icon={AlertCircle}
              color="red"
              breathing={stats.todayDeadlineCount > 0}
              onClick={() => {
                if (todayDeadlineOrder) {
                  handleStartAnalysis(todayDeadlineOrder);
                }
              }}
            />
            <StatCard title="本月收益" value={`¥${stats.monthlyIncome.toLocaleString()}`} subtext="查看明细" icon={DollarSign} color="green" onClick={() => setActiveTab('income')} />
        </>
      </div>
    )}

    {/* 最近进行中订单 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">进行中订单</h3>
              <p className="text-sm text-gray-500">需要完成的分析报告</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('active')} className="group flex items-center gap-1 px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200">
            查看全部<ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
        
        {loading ? (
          <div className="p-2">
            <ListItemSkeleton count={2} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">暂无进行中的订单</p>
            <p className="text-sm text-gray-500 mt-1">当有新订单派发给您时会显示在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-800/30 transition-colors duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">{order.order_no}</span>
                      {getOrderTypeBadge(order.order_type)}
                      {order.deadline && new Date(order.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                          <AlertCircle className="w-3 h-3 mr-1.5" />即将截止
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="font-semibold text-white text-lg">{order.player_name}</span>
                      </div>
                      <span className="text-sm text-gray-400">{order.player_age}岁 · {order.player_position}</span>
                      <span className="text-sm text-gray-500">vs {order.opponent}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Video className="w-4 h-4" />{formatDuration(order.video_duration)}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />接单 {new Date(order.accepted_at || '').toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-0.5">剩余时间</p>
                      <p className={`font-semibold text-lg ${getRemainingTime(order.deadline).includes('逾期') ? 'text-red-400' : 'text-blue-400'}`}>
                        {getRemainingTime(order.deadline)}
                      </p>
                    </div>
                    <button onClick={() => handleStartAnalysis(order)} className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 min-h-[44px]">
                      <PlayCircle className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />继续分析
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { to: '/analyst/orders/pending', tab: 'pending', icon: Clock, title: '待处理订单', desc: '查看管理员派发的订单', color: 'blue' },
          { to: '/analyst/orders/active', tab: 'active', icon: PlayCircle, title: '开始分析', desc: '继续未完成的分析报告', color: 'purple' },
        ].map((item) => (
          <Link key={item.tab} to={item.to} onClick={(e) => { e.preventDefault(); setActiveTab(item.tab as any); }}
            className={`group relative bg-gradient-to-br from-${item.color}-600/20 to-${item.color}-700/10 rounded-2xl p-6 border border-${item.color}-500/30 hover:border-${item.color}-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-${item.color}-500/20 focus:outline-none focus:ring-2 focus:ring-${item.color}-500/50 overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/20 border border-${item.color}-400/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <item.icon className={`w-6 h-6 text-${item.color}-400`} />
              </div>
              <h4 className="font-semibold text-lg text-white mb-1">{item.title}</h4>
              <p className={`text-${item.color}-200/70 text-sm`}>{item.desc}</p>
            </div>
          </Link>
        ))}
        <div className="group relative bg-gradient-to-br from-green-600/20 to-green-700/10 rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer overflow-hidden"
          onClick={() => setActiveTab('income')}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="font-semibold text-lg text-white mb-1">我的业绩</h4>
            <div className="flex items-center gap-3 text-sm mb-3">
              <span className="text-green-300 flex items-center gap-1"><Award className="w-4 h-4" />{stats.totalCompleted} 单</span>
              <span className="text-gray-500">·</span>
              <span className="text-yellow-300 flex items-center gap-1"><Zap className="w-4 h-4" />评分 {(stats.avgRating || 0).toFixed(1)}</span>
            </div>
            {/* 本月排名进度条 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">本月排名</span>
                <span className="text-green-300 font-medium">{hasRankingPercent ? `前 ${rankingPercent}%` : '暂无排名数据'}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${rankingProgressWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const analystSidebarConfig: SidebarConfig = {
    roleName: '分析师工作台',
    themeColor: '#8b5cf6',
    dashboardPath: '/analyst/dashboard',
    profilePath: user?.id ? `/analyst/${user.id}` : undefined,
    showCreatePost: true,
    businessGroups: [
      {
        key: 'orders',
        label: '订单管理',
        icon: Inbox,
        items: [
          { id: 'pending', label: '待处理', icon: Clock, badge: stats.pendingCount },
          { id: 'active', label: '进行中', icon: PlayCircle, badge: stats.activeCount },
          { id: 'history', label: '历史订单', icon: Calendar },
        ],
      },
      {
        key: 'stats',
        label: '数据统计',
        icon: BarChart3,
        items: [
          { id: 'income', label: '收益统计', icon: DollarSign },
        ],
      },
    ],
  };

  // 页面标题
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return '工作台首页';
      case 'pending': return '待处理订单';
      case 'active': return '进行中订单';
      case 'history': return '历史订单';
      case 'income': return '收益统计';
      case 'analysis': return '视频分析';
      default: return '工作台';
    }
  };

  return (
    <>
      <DashboardLayout
        sidebarConfig={analystSidebarConfig}
        activeItemId={activeTab === 'overview' ? undefined : activeTab}
        activeGroupKey={['pending','active','history'].includes(activeTab) ? 'orders' : activeTab === 'income' ? 'stats' : undefined}
        pageTitle={getPageTitle()}
        onItemClick={(item) => {
          if (item.id && item.id !== activeTab) {
            setActiveTab(item.id as any);
            if (item.id === 'analysis') setSelectedOrder(null);
          }
        }}
        onCreatePost={() => setIsCreateOpen(true)}
        headerActions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              className="group flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              <span className="hidden sm:inline">刷新</span>
            </button>
          </div>
        }
      >
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'pending' && <PendingOrders onAccept={() => { loadDashboardData(); setActiveTab('active'); }} />}
        {activeTab === 'active' && <ActiveOrders onStartAnalysis={handleStartAnalysis} />}
        {activeTab === 'history' && <HistoryOrders onViewReport={handleViewReport} />}
        {activeTab === 'income' && <IncomeStats />}
        {activeTab === 'analysis' && selectedOrder && <VideoAnalysisWorkspace order={selectedOrder} onComplete={handleAnalysisComplete} onCancel={() => { setSelectedOrder(null); setActiveTab('active'); }} />}
      </DashboardLayout>

      {/* 报告查看模态框 */}
      {viewingReportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">分析报告</h3>
                <p className="text-sm text-gray-400">{viewingReportOrder.order_no}</p>
              </div>
              <button
                onClick={handleCloseReport}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 报告内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {reportLoading ? (
                <div className="space-y-4">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : viewingReport ? (
                <>
                  {/* 球员基本信息 */}
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white">{viewingReportOrder.player_name}</h4>
                        <p className="text-gray-400">
                          {viewingReportOrder.player_age}岁 | {viewingReportOrder.player_position} | {viewingReportOrder.match_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">分析日期</p>
                        <p className="text-white font-medium">
                          {new Date(viewingReportOrder.completed_at || '').toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 结构化评分报告 */}
                    {(viewingReport.overall_rating ?? viewingReport.rating ?? 0) > 0 ? (
                      <>
                        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                          <div className="flex items-center gap-2 mb-4">
                            <FileSearch className="w-5 h-5 text-blue-400" />
                            <h5 className="font-semibold text-white">综合评分</h5>
                          </div>
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-2">
                                <span className="text-3xl font-bold text-white">{(viewingReport.overall_rating ?? viewingReport.rating ?? 0).toFixed(1)}</span>
                              </div>
                              <p className="text-gray-400 text-sm">综合评分</p>
                            </div>
                          </div>
                        </div>

                        {(() => {
                          let strengths: string[] = [];
                          let weaknesses: string[] = [];
                          try {
                            strengths = viewingReport.strengths ? JSON.parse(viewingReport.strengths) : [];
                            weaknesses = viewingReport.weaknesses ? JSON.parse(viewingReport.weaknesses) : [];
                          } catch {}
                          return (
                            <>
                              {strengths.length > 0 && (
                                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                                  <h5 className="font-semibold text-white mb-4">核心优势</h5>
                                  <ul className="space-y-2 text-gray-300">
                                    {strengths.map((s, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>{s}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {weaknesses.length > 0 && (
                                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                                  <h5 className="font-semibold text-white mb-4">待提升领域</h5>
                                  <ul className="space-y-2 text-gray-300">
                                    {weaknesses.map((w, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>{w}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {viewingReport.summary && (
                          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                            <h5 className="font-semibold text-white mb-4">综合评价</h5>
                            <p className="text-gray-300 leading-relaxed">{viewingReport.summary}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      /* 旧版纯文本报告 */
                      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                        <h5 className="font-semibold text-white mb-4">报告内容</h5>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingReport.content}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">无法加载报告</div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={handleCloseReport}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  关闭
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  下载报告
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="analyst"
      />
    </>
  );
};

export default AnalystDashboard;
