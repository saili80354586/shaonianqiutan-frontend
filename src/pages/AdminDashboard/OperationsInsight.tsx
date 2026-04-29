import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, Eye, Loader2 } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
    </div>
  </div>
);

const OperationsInsight: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any>({});
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [topData, setTopData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [growthRes, funnelRes, retentionRes, topRes] = await Promise.all([
          adminApi.getGrowthData(30),
          adminApi.getFunnelData(),
          adminApi.getRetentionData(30),
          adminApi.getTopData(),
        ]);
        if (growthRes.data?.success) setGrowthData(growthRes.data.data || []);
        if (funnelRes.data?.success) setFunnelData(funnelRes.data.data || {});
        if (retentionRes.data?.success) setRetentionData(retentionRes.data.data || []);
        if (topRes.data?.success) setTopData(topRes.data.data || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const funnelChartData = [
    { name: '访问', value: funnelData.visitors || 0 },
    { name: '注册', value: funnelData.registrations || 0 },
    { name: '下单', value: funnelData.orders || 0 },
    { name: '支付', value: funnelData.payments || 0 },
    { name: '完成', value: funnelData.completed || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">运营洞察</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="总注册用户" value={funnelData.registrations || 0} icon={<Users className="w-5 h-5 text-white" />} color="bg-emerald-500/20" />
        <StatCard title="总订单数" value={funnelData.orders || 0} icon={<ShoppingCart className="w-5 h-5 text-white" />} color="bg-blue-500/20" />
        <StatCard title="支付转化" value={`${funnelData.orders > 0 ? ((funnelData.payments / funnelData.orders) * 100).toFixed(1) : 0}%`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-amber-500/20" />
        <StatCard title="完成订单" value={funnelData.completed || 0} icon={<Eye className="w-5 h-5 text-white" />} color="bg-purple-500/20" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">增长趋势 (30天)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" name="新增用户" />
              <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" name="订单数" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel Chart */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">转化漏斗</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={60} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Chart */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">留存分析</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="new_users" stroke="#10b981" name="新增用户" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="active_users" stroke="#f59e0b" name="活跃用户" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">收入趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `¥${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(v: unknown) => [`¥${String(v ?? '-')}`, '收入']} />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRevenue)" name="收入" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['top_players', 'top_analysts', 'top_clubs'].map((key, idx) => {
          const list = topData[key] || [];
          const titles = ['活跃球员 TOP10', '高产分析师 TOP10', '活跃俱乐部 TOP10'];
          return (
            <div key={key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">{titles[idx]}</h3>
              <div className="space-y-2">
                {list.length === 0 && <p className="text-slate-500 text-sm text-center py-4">暂无数据</p>}
                {list.slice(0, 10).map((item: any, i: number) => (
                  <div key={item.id || i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-slate-400'}`}>{i + 1}</span>
                    <span className="text-white text-sm flex-1 truncate">{item.nickname || item.name || `用户${item.id}`}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperationsInsight;
