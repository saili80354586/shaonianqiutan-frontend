import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Loading } from '../../components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, Package, CreditCard, AlertCircle, TrendingUp, Activity
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalReports: number;
  totalRevenue: number;
  todayNewUsers: number;
  todayOrders: number;
  todayRevenue: number;
  pendingApplications: number;
  pendingReports: number;
  pendingDispatch?: number;
}

interface ChartData {
  date: string;
  users: number;
  orders: number;
  revenue: number;
}

interface PositionData {
  name: string;
  value: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend: string;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
}> = ({ icon: Icon, label, value, trend, color }) => {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20',
    red: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/20',
    violet: 'from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/20',
  };

  return (
    <div className={`bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] hover:border-white/10 transition-all group`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} border flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1" />
        <span className="text-emerald-400 font-medium">{trend}</span>
      </div>
    </div>
  );
};

const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [positionData, setPositionData] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  const loadChartData = async () => {
    try {
      const growthResponse = await adminApi.getGrowthData(30);
      if (growthResponse.data?.success && growthResponse.data?.data) {
        const rawData: { date: string; users?: number; orders?: number; revenue?: number }[] = growthResponse.data.data;
        const formattedData: ChartData[] = rawData.map((item) => ({
          date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          users: item.users || 0,
          orders: item.orders || 0,
          revenue: item.revenue || 0,
        }));
        setChartData(formattedData);
      }
      setPositionData([
        { name: '前锋', value: 35 },
        { name: '中场', value: 30 },
        { name: '后卫', value: 25 },
        { name: '守门员', value: 10 }
      ]);
    } catch (error) {
      console.error('加载图表数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          label="总用户数"
          value={stats?.totalUsers || 0}
          trend={`+${stats?.todayNewUsers || 0} 今日新增`}
          color="blue"
        />
        <StatCard
          icon={Package}
          label="总订单数"
          value={stats?.totalOrders || 0}
          trend={`+${stats?.todayOrders || 0} 今日订单`}
          color="emerald"
        />
        <StatCard
          icon={CreditCard}
          label="总营收"
          value={`¥${(stats?.totalRevenue || 0).toLocaleString()}`}
          trend={`+¥${(stats?.todayRevenue || 0).toLocaleString()} 今日`}
          color="amber"
        />
        <StatCard
          icon={AlertCircle}
          label="待处理"
          value={(stats?.pendingApplications || 0) + (stats?.pendingReports || 0)}
          trend={`${stats?.pendingApplications || 0} 申请 / ${stats?.pendingReports || 0} 报告`}
          color="red"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户增长趋势 */}
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> 用户增长趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1419', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 营收趋势 */}
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> 营收趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(value: number) => `¥${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#0f1419', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 订单趋势 */}
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" /> 订单趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1419', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 球员位置分布 */}
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" /> 球员位置分布
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1419', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Overview;
