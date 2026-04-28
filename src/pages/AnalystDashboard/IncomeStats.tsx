import React, { useState, useEffect, useMemo } from 'react';
import { analystApi } from '../../services/api';
import type { Order } from '../../types';
import { 
  TrendingUp, 
  Calendar,
  Download,
  FileText,
  Video,
  ChevronDown,
  RotateCcw,
  Wallet,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  StatsGridSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ListItemSkeleton,
} from '../../components/ui/loading';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Line
} from 'recharts';

interface IncomeItem {
  order_id: number;
  order_no: string;
  amount: number;
  commission: number;
  net_income: number;
  completed_at: string;
  order_type?: 'text' | 'video';
  player_name?: string;
}

interface IncomeSummary {
  totalIncome: number;
  totalOrders: number;
  avgIncome: number;
  pendingSettlement?: number;
  textCount?: number;
  videoCount?: number;
  textIncome?: number;
  videoIncome?: number;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const IncomeStats: React.FC = () => {
  const [incomeList, setIncomeList] = useState<IncomeItem[]>([]);
  const [summary, setSummary] = useState<IncomeSummary>({
    totalIncome: 0,
    totalOrders: 0,
    avgIncome: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [trendData, setTrendData] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    loadIncomeData();
    loadActiveOrders();
  }, [timeRange, currentPage]);

  const loadIncomeData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const [detailsResponse, trendResponse, revenueResponse] = await Promise.all([
        analystApi.getIncomeDetails({
          startDate,
          endDate,
          page: currentPage,
          pageSize
        }),
        analystApi.getIncomeTrend(timeRange),
        analystApi.getMyRevenue()
      ]);
      
      if (detailsResponse.data?.success && detailsResponse.data?.data) {
        setIncomeList(detailsResponse.data.data.list);
        setSummary(detailsResponse.data.data.summary);
        setTotal(detailsResponse.data.data.total);
      }
      if (trendResponse.data?.success && trendResponse.data?.data) {
        setTrendData(trendResponse.data.data);
      }
      if (revenueResponse.data?.success && revenueResponse.data?.data) {
        setRevenueData(revenueResponse.data.data.revenue);
      }
    } catch (error) {
      console.error('加载收益数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    setActiveOrdersLoading(true);
    try {
      const res = await analystApi.getActiveOrders({ page: 1, pageSize: 50 });
      if (res.data?.success && res.data?.data) {
        setActiveOrders(res.data.data.list || []);
      }
    } catch (error) {
      console.error('加载待结算订单失败', error);
    } finally {
      setActiveOrdersLoading(false);
    }
  };

  const getDateRange = (range: TimeRange) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    const labels: Record<TimeRange, string> = {
      week: '最近7天',
      month: '本月',
      quarter: '近3个月',
      year: '今年',
      custom: '自定义'
    };
    return labels[range];
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const weekIncome = incomeList
      .filter(item => new Date(item.completed_at) >= weekAgo)
      .reduce((sum, item) => sum + item.net_income, 0);
      
    const monthIncome = incomeList
      .filter(item => new Date(item.completed_at) >= monthAgo)
      .reduce((sum, item) => sum + item.net_income, 0);
    
    // 使用后端返回的真实待结算金额
    const pendingSettlement = summary.pendingSettlement || 0;
    
    return {
      total: summary.totalIncome,
      week: weekIncome,
      month: monthIncome,
      pending: pendingSettlement,
      orderCount: summary.totalOrders,
      avgPerOrder: summary.avgIncome
    };
  }, [incomeList, summary]);

  // 环比增长率：基于后端 getMyRevenue 返回的同期数据计算
  const growthRate = useMemo(() => {
    if (!revenueData) {
      return { total: 0, week: 0, month: 0 };
    }

    const calcRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      total: 0, // 累计收益无环比意义
      week: calcRate(revenueData.week_rev || 0, revenueData.last_week_rev || 0),
      month: calcRate(revenueData.this_month_rev || 0, revenueData.last_month_rev || 0),
    };
  }, [revenueData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 经营洞察数据计算
  const pieData = useMemo(() => {
    // 优先使用后端返回的全量统计数据，避免分页数据导致饼图失真
    const text = summary.textIncome ?? incomeList
      .filter(i => i.order_type === 'basic' || i.order_type === 'text')
      .reduce((sum, i) => sum + i.net_income, 0);
    const video = summary.videoIncome ?? incomeList
      .filter(i => i.order_type === 'video' || i.order_type === 'pro')
      .reduce((sum, i) => sum + i.net_income, 0);
    return [
      { name: '文字版', value: text, color: '#3b82f6' },
      { name: '视频解析版', value: video, color: '#a855f7' }
    ].filter(d => d.value > 0);
  }, [incomeList, summary]);

  // 每日收益 + 订单数双轴图（基于趋势数据，不受分页影响）
  const trendBarData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map((item: any) => ({
      date: item.date,
      income: item.income || 0,
      orders: item.orders || 0,
    }));
  }, [trendData]);

  const pendingSettlementOrders = useMemo(() => {
    return activeOrders.filter((o) => o.status === 'processing' || o.status === 'accepted');
  }, [activeOrders]);

  const getOrderTypeBadge = (type?: OrderType) => {
    if (type === 'video' || type === 'pro') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
          <Video className="w-3 h-3 mr-1" />
          视频解析版
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
        <FileText className="w-3 h-3 mr-1" />
        文字版
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  // 导出 CSV 报表
  const handleExportCSV = () => {
    if (incomeList.length === 0) return;
    const headers = ['订单号', '球员', '订单类型', '订单金额', '佣金比例', '实际收益', '完成时间'];
    const rows = incomeList.map(item => [
      item.order_no,
      item.player_name || '-',
      item.order_type === 'video' || item.order_type === 'pro' ? '视频解析版' : '文字版',
      item.amount.toFixed(2),
      `${(item.commission * 100).toFixed(0)}%`,
      item.net_income.toFixed(2),
      item.completed_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `收益明细_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton count={4} columns={4} />
        <ChartSkeleton height={256} />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">收益统计</h3>
          <p className="text-sm text-gray-400 mt-1">查看您的收益明细和统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 时间筛选 */}
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] border border-gray-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/30"
            >
              <Calendar className="w-4 h-4" />
              {getTimeRangeLabel(timeRange)}
              <ChevronDown className={`w-4 h-4 transition-transform ${showTimeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showTimeDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-[#1a1f2e] rounded-xl shadow-lg border border-gray-800 py-2 z-10">
                {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowTimeDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-800/30 ${
                      timeRange === range ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'
                    }`}
                  >
                    {getTimeRangeLabel(range)}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={loadIncomeData}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            <RotateCcw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 收益概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 累计收益 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/25">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            {growthRate.total !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${growthRate.total >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {growthRate.total >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(growthRate.total)}%
              </div>
            )}
          </div>
          <p className="text-blue-100 text-sm mb-1">累计收益</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          <p className="text-blue-200 text-xs mt-2">{stats.orderCount} 笔订单</p>
        </div>

        {/* 本月收益 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            {growthRate.month !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${growthRate.month >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthRate.month >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(growthRate.month)}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-1">本月收益</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.month)}</p>
          <p className="text-gray-500 text-xs mt-2">较上月</p>
        </div>

        {/* 本周收益 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            {growthRate.week !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${growthRate.week >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthRate.week >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(growthRate.week)}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-1">本周收益</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.week)}</p>
          <p className="text-gray-500 text-xs mt-2">较上周</p>
        </div>

        {/* 待结算 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">进行中</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">待结算</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.pending)}</p>
          <p className="text-gray-500 text-xs mt-2">预计下月结算</p>
        </div>
      </div>

      {/* 收益趋势图表 */}
      <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-white">收益趋势</h4>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>收益金额</span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <BarChart3 className="w-10 h-10 mb-3 text-gray-600" />
              <span>暂无收益趋势数据</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`¥${value}`, '收益']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 经营洞察：饼图 + 柱状图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 订单类型收益对比 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white">订单类型收益对比</h4>
          </div>
          <div className="h-56">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '收益']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', backgroundColor: '#1f2937', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                暂无数据
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {pieData.map(d => (
              <div key={d.name} className="bg-gray-800/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">{d.name}收益</p>
                <p className="text-lg font-bold text-white">{formatCurrency(d.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 每日收益与订单数 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">每日收益与订单数</h4>
          </div>
          <div className="h-56">
            {trendBarData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                暂无趋势数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${v}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === '收益' ? `¥${value.toFixed(2)}` : `${value} 单`,
                      name
                    ]}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', backgroundColor: '#1f2937', color: '#fff' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="income" name="收益" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="订单数" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {trendBarData.length > 0 ? (
              <span>共 <span className="font-medium text-white">{trendBarData.reduce((s, d) => s + d.orders, 0)}</span> 单，收益 <span className="font-medium text-white">{formatCurrency(trendBarData.reduce((s, d) => s + d.income, 0))}</span></span>
            ) : (
              <span>暂无时段数据</span>
            )}
          </div>
        </div>
      </div>

      {/* 待结算明细 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <h4 className="font-semibold text-white">待结算明细</h4>
          </div>
          <span className="text-sm text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
            预计下月结算
          </span>
        </div>
        {activeOrdersLoading ? (
          <div className="space-y-3">
            <ListItemSkeleton count={3} />
          </div>
        ) : pendingSettlementOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            暂无进行中订单，完成后将显示预计收益
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">订单信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">球员</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">订单金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">预计收益</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">剩余时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pendingSettlementOrders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
                        {getOrderTypeBadge(order.order_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{order.player_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{formatCurrency(order.amount || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-orange-400 font-semibold">{formatCurrency((order.amount || 0) * 0.7)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${order.deadline && new Date(order.deadline).getTime() < Date.now() ? 'text-red-400' : 'text-gray-400'}`}>
                        {order.deadline
                          ? new Date(order.deadline).getTime() < Date.now()
                            ? '已逾期'
                            : (() => {
                                const diff = new Date(order.deadline).getTime() - Date.now();
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                return `${hours}小时${mins}分`;
                              })()
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 收益明细列表 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h4 className="font-semibold text-white">收益明细</h4>
          <button
            onClick={handleExportCSV}
            disabled={incomeList.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">订单信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">球员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">订单金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">佣金比例</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">实际收益</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">完成时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {incomeList.map((item) => (
                <tr key={item.order_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">{item.order_no}</span>
                      {getOrderTypeBadge(item.order_type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{item.player_name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{formatCurrency(item.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{(item.commission * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 font-semibold">{formatCurrency(item.net_income)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">{formatDate(item.completed_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800/30"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-700 text-gray-300 hover:bg-gray-800/30'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-700 text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800/30"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">平均单笔收益</p>
          <p className="text-xl font-bold text-white">{formatCurrency(stats.avgPerOrder)}</p>
        </div>
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">文字版订单</p>
          <p className="text-xl font-bold text-white">
            {incomeList.filter(i => i.order_type === 'basic' || i.order_type === 'text').length} 笔
          </p>
        </div>
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">视频解析订单</p>
          <p className="text-xl font-bold text-white">
            {incomeList.filter(i => i.order_type === 'video' || i.order_type === 'pro').length} 笔
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomeStats;
