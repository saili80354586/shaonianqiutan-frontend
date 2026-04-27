import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Star, FileText,
  ShoppingCart, Clock, CheckCircle2, Users, ArrowRight
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { analystApi } from '../../../services/api';

// 统计数据接口
interface AnalystStats {
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  monthlyIncome: number;
  averageRating: number;
  avgResponseTime: number;
  completionRate: number;
  satisfaction: number;
  todayIncome: number;
  weekIncome: number;
}

// 订单接口
interface Order {
  id: string;
  playerName: string;
  position: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  price: number;
  createdAt: string;
  completedAt?: string;
}

// 收益趋势数据接口
interface IncomeTrendData {
  date: string;
  income: number;
  orders: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon, color }) => (
  <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
            {' '}{trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} flex-shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

export const OverviewModule: React.FC = () => {
  const [stats, setStats] = useState<AnalystStats>({
    newOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    monthlyIncome: 0,
    averageRating: 0,
    avgResponseTime: 0,
    completionRate: 0,
    satisfaction: 0,
    todayIncome: 0,
    weekIncome: 0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [incomeTrend, setIncomeTrend] = useState<IncomeTrendData[]>([]);

  // 加载统计数据
  useEffect(() => {
    loadStats();
    loadRecentOrders();
    loadIncomeTrend();
  }, []);

  const loadStats = async () => {
    try {
      const response = await analystApi.getDashboardStats();
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setStats({
          newOrders: data.pendingCount || 0,
          processingOrders: data.activeCount || 0,
          completedOrders: data.totalCompleted || 0,
          monthlyIncome: data.monthlyIncome || 0,
          averageRating: data.avgRating || 0,
          avgResponseTime: 0,
          completionRate: 0,
          satisfaction: 0,
          todayIncome: 0,
          weekIncome: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await analystApi.getPendingOrders({ page: 1, pageSize: 5 });
      if (response.data?.success && response.data?.data) {
        const list = (response.data.data.list || []).slice(0, 5).map((o: any) => ({
          id: o.order_no || o.id,
          playerName: o.player_name || '-',
          position: o.player_position || '-',
          status: o.status || 'pending',
          price: o.amount || 0,
          createdAt: o.created_at || '-',
          completedAt: o.completed_at
        }));
        setRecentOrders(list);
      }
    } catch (error) {
      console.error('Failed to load recent orders:', error);
    }
  };

  const loadIncomeTrend = async () => {
    try {
      const response = await analystApi.getIncomeTrend('month');
      if (response.data?.success && response.data?.data) {
        const trend = (response.data.data || []).map((item: any) => ({
          date: item.date,
          income: item.income || 0,
          orders: item.orders || 0,
        }));
        setIncomeTrend(trend);
      }
    } catch (error) {
      console.error('Failed to load income trend:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'bg-blue-500/20 text-blue-400' },
      processing: { text: '进行中', color: 'bg-yellow-500/20 text-yellow-400' },
      completed: { text: '已完成', color: 'bg-green-500/20 text-green-400' },
      rejected: { text: '已拒绝', color: 'bg-red-500/20 text-red-400' },
    };
    const { text, color } = map[status] || { text: status, color: 'bg-gray-500/20 text-gray-400' };
    return <span className={`px-2 py-1 rounded text-xs ${color}`}>{text}</span>;
  };

  // ECharts图表配置
  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: incomeTrend.map(item => item.date),
      axisLine: {
        lineStyle: {
          color: '#4b5563',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 12,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '收益(元)',
        position: 'left',
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 12,
          formatter: '{value}',
        },
        splitLine: {
          lineStyle: {
            color: '#1f2937',
          },
        },
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right',
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 12,
          formatter: '{value}',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '收益',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: incomeTrend.map(item => item.income),
        itemStyle: {
          color: '#39ff14',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(57, 255, 20, 0.3)' },
              { offset: 1, color: 'rgba(57, 255, 20, 0.05)' },
            ],
          },
        },
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: incomeTrend.map(item => item.orders),
        itemStyle: {
          color: 'rgba(59, 130, 246, 0.6)',
        },
      },
    ],
  };

  const navigate = useNavigate();

  const quickActions = [
    { label: '查看订单', icon: <ShoppingCart size={18} />, color: 'bg-blue-500/20 text-blue-400', action: 'orders' },
    { label: '新建报告', icon: <FileText size={18} />, color: 'bg-green-500/20 text-green-400', action: 'reports' },
    { label: '账户设置', icon: <Star size={18} />, color: 'bg-purple-500/20 text-purple-400', action: 'settings', onClick: () => navigate('/settings') },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 8个数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="新订单"
          value={stats.newOrders}
          trend="↑ 12% 较上月"
          trendUp={true}
          icon={<ShoppingCart className="w-6 h-6 text-blue-400" />}
          color="bg-blue-500/10"
        />
        <StatsCard
          title="分析中"
          value={stats.processingOrders}
          trend="→ 持平"
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
          color="bg-yellow-500/10"
        />
        <StatsCard
          title="已完成"
          value={stats.completedOrders}
          trend="↑ 25% 较上月"
          trendUp={true}
          icon={<CheckCircle2 className="w-6 h-6 text-green-400" />}
          color="bg-green-500/10"
        />
        <StatsCard
          title="本月收入"
          value={`¥${stats.monthlyIncome.toLocaleString()}`}
          trend="↑ 18% 较上月"
          trendUp={true}
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
          color="bg-green-500/10"
        />
        <StatsCard
          title="今日收入"
          value={`¥${stats.todayIncome.toLocaleString()}`}
          trend="↑ 8% 较昨日"
          trendUp={true}
          icon={<DollarSign className="w-6 h-6 text-blue-400" />}
          color="bg-blue-500/10"
        />
        <StatsCard
          title="本周收入"
          value={`¥${stats.weekIncome.toLocaleString()}`}
          trend="↑ 15% 较上周"
          trendUp={true}
          icon={<DollarSign className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500/10"
        />
        <StatsCard
          title="平均评分"
          value={stats.averageRating.toFixed(1)}
          trend="+0.2"
          trendUp={true}
          icon={<Star className="w-6 h-6 text-yellow-400" />}
          color="bg-yellow-500/10"
        />
        <StatsCard
          title="完成率"
          value={`${stats.completionRate}%`}
          trend="↑ 5% 较上月"
          trendUp={true}
          icon={<CheckCircle2 className="w-6 h-6 text-green-400" />}
          color="bg-green-500/10"
        />
      </div>

      {/* 快捷操作 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold mb-4">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${action.color} hover:opacity-80 transition-opacity`}
            >
              {action.icon}
              <span className="font-medium text-white">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 收益趋势图 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">近30天收入趋势</h3>
          <div className="flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#39ff14] rounded"></div>
              <span>收益(元)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>订单数</span>
            </div>
          </div>
        </div>
        <div className="h-[300px]">
          {incomeTrend.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: '100%' }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              数据加载中...
            </div>
          )}
        </div>
      </div>

      {/* 最近订单 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">最近订单动态</h3>
          <button className="text-[#39ff14] text-sm flex items-center gap-1 hover:underline">
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-800">
                <th className="text-left py-3 px-4">订单号</th>
                <th className="text-left py-3 px-4">球员姓名</th>
                <th className="text-left py-3 px-4">位置</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-right py-3 px-4">金额</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="text-gray-300 hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0">
                    <td className="py-3 px-4 font-medium">{order.id}</td>
                    <td className="py-3 px-4">{order.playerName}</td>
                    <td className="py-3 px-4">{order.position}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-right font-medium">¥{order.price}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewModule;
