import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { CreditCard, CheckCircle, Loader2, DollarSign, Calendar, User } from 'lucide-react';

interface SettlementOrder {
  id: number;
  analyst_name: string;
  analyst_id: number;
  amount: number;
  platform_fee: number;
  settlement_amount: number;
  status: string;
  created_at: string;
  completed_at: string;
}

const Settlements: React.FC = () => {
  const [orders, setOrders] = useState<SettlementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, settled: 0, amount: 0 });

  const fetchOrders = async () => {
    try {
      const res = await adminApi.getSettlementList();
      if (res.data?.success) {
        setOrders(res.data.data?.list || []);
        setStats(res.data.data?.stats || { total: 0, pending: 0, settled: 0, amount: 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pendingIds = orders.filter(o => o.status === 'completed').map(o => o.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const handleSettlement = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定对选中的 ${selectedIds.length} 笔订单进行结算？`)) return;
    setProcessing(true);
    try {
      await adminApi.processSettlement({ order_ids: selectedIds });
      setSelectedIds([]);
      fetchOrders();
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-400" /> 分析师结算</h2>
        {selectedIds.length > 0 && (
          <button onClick={handleSettlement} disabled={processing} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            结算选中 ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待结算订单', value: stats.pending, icon: Calendar },
          { label: '已结算订单', value: stats.settled, icon: CheckCircle },
          { label: '总结算金额', value: `¥${stats.amount.toFixed(2)}`, icon: DollarSign },
          { label: '订单总数', value: stats.total, icon: CreditCard },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1"><s.icon className="w-4 h-4" /> {s.label}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3 w-10">
                <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === orders.filter(o => o.status === 'completed').length} onChange={toggleSelectAll} className="rounded border-white/[0.2] bg-white/[0.03]" />
              </th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">订单ID</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">分析师</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">订单金额</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">平台抽成</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">结算金额</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">状态</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">完成时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-12">暂无结算数据</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  {o.status === 'completed' && (
                    <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} className="rounded border-white/[0.2] bg-white/[0.03]" />
                  )}
                </td>
                <td className="px-4 py-3 text-white">#{o.id}</td>
                <td className="px-4 py-3 text-slate-300 flex items-center gap-2"><User className="w-3 h-3 text-slate-500" />{o.analyst_name || `分析师${o.analyst_id}`}</td>
                <td className="px-4 py-3 text-slate-300">¥{o.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-400">¥{o.platform_fee?.toFixed(2)}</td>
                <td className="px-4 py-3 text-emerald-400 font-medium">¥{o.settlement_amount?.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${o.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400' : o.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {o.status === 'settled' ? '已结算' : o.status === 'completed' ? '待结算' : o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{o.completed_at ? new Date(o.completed_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settlements;
