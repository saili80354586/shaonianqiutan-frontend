import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, FileText, CreditCard, Download, type LucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { clubApi } from '../../services/club';
import ExportComplianceModal from './components/ExportComplianceModal';
import type { ExportPurpose } from './components/ExportComplianceModal';

interface ClubStatsProps {
  onBack: () => void;
  clubName?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatsData {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  completedOrders: number;
  avgOrderValue: number;
  monthlyTrend?: Array<{ name: string; orders: number; amount: number }>;
  reportTypeDistribution?: Array<{ name: string; value: number; amount: number }>;
  topPlayers?: Array<{ name: string; orders: number; totalSpent: number; lastReport: string }>;
}

interface PositionItem {
  name?: string;
  position?: string;
  count?: number;
}

interface AnalyticsData {
  playerDistribution?: {
    byPosition?: PositionItem[];
  };
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const unwrapApiData = <T,>(payload: T | ApiEnvelope<T> | undefined): T | null => {
  if (!payload) return null;
  if (typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return envelope.success !== false && typeof envelope.data !== 'undefined' ? envelope.data : null;
  }
  return payload as T;
};

const ClubStats: React.FC<ClubStatsProps> = ({ onBack, clubName }) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const exportCSV = (purpose: ExportPurpose, note: string) => {
    const purposeMap: Record<ExportPurpose, string> = {
      internal_training: '内部训练分析',
      parent_communication: '家长沟通',
      other: '其他',
    };
    const watermark = `本文件由「${clubName || '本俱乐部'}」于 ${new Date().toLocaleString('zh-CN')} 导出，用途：${purposeMap[purpose]}${note ? `（${note}）` : ''}。包含未成年人个人信息，仅限内部使用，禁止向第三方泄露。`;

    const rows: Record<string, string | number>[] = [
      { 指标: '订单总数', 数值: stats?.totalOrders || 0 },
      { 指标: '总支出', 数值: `¥${(stats?.totalAmount || 0).toLocaleString()}` },
      { 指标: '待处理订单', 数值: stats?.pendingOrders || 0 },
      { 指标: '已完成订单', 数值: stats?.completedOrders || 0 },
      { 指标: '平均订单金额', 数值: `¥${(stats?.avgOrderValue || 0).toLocaleString()}` },
      ...((stats?.topPlayers || []).map((p, i) => ({
        指标: `Top球员-${i + 1}`, 数值: p.name, 订单数: p.orders, 总消费: `¥${p.totalSpent.toLocaleString()}`, 最近报告: p.lastReport
      }))),
    ];
    const headers = Object.keys(rows[0]);
    const csv = [
      watermark,
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? '')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `俱乐部统计报表_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderRes, analyticsRes] = await Promise.all([
          clubApi.getOrderStats(),
          clubApi.getAnalytics()
        ]);
        const orderStats = unwrapApiData<StatsData>(orderRes?.data);
        const analytics = unwrapApiData<AnalyticsData>(analyticsRes?.data);
        if (mounted && orderStats) {
          setStats(orderStats);
        }
        if (mounted && analytics) {
          setAnalyticsData(analytics);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
      if (mounted) setLoading(false);
    };
    fetchData();
    return () => { mounted = false; };
  }, [timeRange]);

  const monthlyData = stats?.monthlyTrend || [];
  const positionRaw = analyticsData?.playerDistribution?.byPosition || [];
  const positionTotal = positionRaw.reduce((sum: number, p: PositionItem) => sum + (p.count || 0), 0) || 1;
  const positionData = positionRaw.map((p: PositionItem) => ({
    name: p.name || p.position,
    count: p.count || 0,
    value: p.count || 0,
  }));
  const reportTypeData = stats?.reportTypeDistribution || [];
  const topPlayers = stats?.topPlayers || [];

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">数据统计</h1>
              <p className="text-gray-400 mt-1">查看俱乐部数据分析报表</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year">本年</option>
            </select>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" /> 导出报表
            </button>
          </div>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard icon={FileText} label="订单总数" value={stats?.totalOrders || 0} subtext="当前累计" color="blue" />
          <StatCard icon={CreditCard} label="总支出" value={`¥${(stats?.totalAmount || 0).toLocaleString()}`} subtext="当前累计" color="emerald" />
          <StatCard icon={Users} label="已完成订单" value={stats?.completedOrders || 0} subtext="当前累计" color="purple" />
          <StatCard icon={TrendingUp} label="平均客单价" value={`¥${Math.round(stats?.avgOrderValue || 0).toLocaleString()}`} subtext="订单均值" color="amber" />
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 订单趋势 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">订单趋势</h3>
            {loading ? (
              <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 支出趋势 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">支出趋势</h3>
            {loading ? (
              <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => `¥${Number(value ?? 0)}`}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 位置分布 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">球员位置分布</h3>
            {loading ? (
              <div className="h-48 bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie
                    data={positionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {positionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 space-y-2">
              {positionData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-white">{item.count}人 ({Math.round((item.count / positionTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* 报告类型分布 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">报告类型分布</h3>
            {loading ? (
              <div className="h-48 bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie
                    data={reportTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 space-y-3">
              {reportTypeData.map((item, i) => (
                <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">{item.name}</span>
                    <span className="text-white font-medium">{item.value}单</span>
                  </div>
                  <div className="text-sm text-emerald-400">¥{Number(item.amount || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 消费排行 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">球员消费排行</h3>
            <div className="space-y-3">
              {topPlayers.map((player, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-gray-700 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.orders} 份报告</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-medium">¥{Math.round(player.totalSpent || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{player.lastReport || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ExportComplianceModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onConfirm={(purpose, note) => {
          setExportModalOpen(false);
          exportCSV(purpose, note);
        }}
        clubName={clubName}
        title="统计报表导出确认"
      />
    </div>
  );
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  subtext?: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const StatCard = ({ icon: Icon, label, value, trend, subtext, color }: StatCardProps) => {
  const colors: Record<StatCardProps['color'], string> = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 border border-gray-800`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/10 rounded-xl">
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className="text-sm text-emerald-400">{trend}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
};

export default ClubStats;
