import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Loader2 } from 'lucide-react';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  newUsers: number;
  refunds: number;
}

const RevenueReport: React.FC = () => {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, refundRate: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRevenueTrend(Number(range));
      if (res.data?.success) {
        setData(res.data.data?.list || []);
        setSummary(res.data.data?.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, refundRate: 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> 平台收支报表</h2>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${range === r ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/[0.04]'}`}>
              {r === '7' ? '近7天' : r === '30' ? '近30天' : '近90天'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总收入', value: `¥${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, trend: '+12.5%' },
          { label: '总订单', value: summary.totalOrders, icon: ShoppingCart, trend: '+8.3%' },
          { label: '客单价', value: `¥${summary.avgOrderValue.toFixed(2)}`, icon: TrendingUp, trend: '+5.1%' },
          { label: '退款率', value: `${(summary.refundRate * 100).toFixed(1)}%`, icon: TrendingDown, trend: '-2.1%' },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm"><s.icon className="w-4 h-4" /> {s.label}</div>
              <span className={`text-xs ${s.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.trend}</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">收入与订单趋势</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f1419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" name="收入 (¥)" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="orders" name="订单数" stroke="#00d4ff" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">用户增长与退款</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f1419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            <Bar dataKey="newUsers" name="新增用户" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Line type="monotone" dataKey="refunds" name="退款金额" stroke="#ef4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueReport;
