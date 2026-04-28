import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Eye, Download, Plus, Filter, type LucideIcon } from 'lucide-react';
import { orderApi } from '../../services/api';
import { TableSkeleton } from '../../components/ui/loading';

interface Order {
  id: number;
  orderNo: string;
  playerName: string;
  analystName: string;
  serviceName: string;
  price: number;
  finalPrice: number;
  status: string;
  createdAt: string;
}

interface OrderManagementProps {
  onBack: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: '待支付', color: 'text-yellow-400 bg-yellow-500/20', icon: Clock },
  paid: { label: '待上传', color: 'text-blue-400 bg-blue-500/20', icon: FileText },
  uploaded: { label: '待分配', color: 'text-purple-400 bg-purple-500/20', icon: FileText },
  assigned: { label: '已派单', color: 'text-cyan-400 bg-cyan-500/20', icon: Clock },
  processing: { label: '分析中', color: 'text-blue-400 bg-blue-500/20', icon: Clock },
  completed: { label: '已完成', color: 'text-green-400 bg-green-500/20', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-400 bg-red-500/20', icon: XCircle },
  refunded: { label: '已退款', color: 'text-gray-400 bg-gray-500/20', icon: XCircle },
};

const OrderManagement: React.FC<OrderManagementProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalAmount: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const [ordersRes, statsRes] = await Promise.all([
        orderApi.getClubOrders(params),
        orderApi.getOrderStats(),
      ]);
      if (!ordersRes.data?.success) {
        throw new Error(ordersRes.data?.error?.message || '获取订单列表失败');
      }
      const loadedOrders = ordersRes.data.data?.orders || [];
      const loadedStats = statsRes.data?.success ? statsRes.data.data || {} : {};
      setOrders(loadedOrders);
      setStats({
        total: Number(loadedStats.totalOrders ?? loadedOrders.length ?? 0),
        pending: Number(loadedStats.pendingOrders ?? loadedOrders.filter((order: Order) => ['pending', 'paid'].includes(order.status)).length ?? 0),
        completed: Number(loadedStats.completedOrders ?? loadedOrders.filter((order: Order) => order.status === 'completed').length ?? 0),
        totalAmount: Number(loadedStats.totalAmount ?? loadedOrders.reduce((sum: number, order: Order) => sum + (order.finalPrice || 0), 0) ?? 0),
      });
    } catch (error: any) {
      console.error('加载俱乐部订单失败:', error);
      setOrders([]);
      setStats({ total: 0, pending: 0, completed: 0, totalAmount: 0 });
      setErrorMsg(error?.response?.data?.error?.message || error?.message || '订单加载失败，请稍后重试');
    }
    setLoading(false);
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">订单管理</h1>
              <p className="text-gray-400 mt-1">管理俱乐部订单和报告</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/club/orders/batch'}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            <Plus className="w-4 h-4" />批量下单
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">总订单数</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">待处理</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400">已完成</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
            <div className="text-2xl font-bold text-emerald-400">¥{stats.totalAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-400">总金额</div>
          </div>
        </div>

        {/* 筛选 */}
        <div className="flex items-center gap-4 mb-6">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">待上传</option>
            <option value="uploaded">待分配</option>
            <option value="assigned">已派单</option>
            <option value="processing">分析中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* 订单列表 */}
        {loading ? (
          <TableSkeleton rows={3} cols={7} />
        ) : (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">订单信息</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">球员/分析师</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">服务</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">金额</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">时间</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无订单</td></tr>
              ) : (
                filteredOrders.map(order => {
                  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{order.orderNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{order.playerName}</div>
                        <div className="text-sm text-gray-400">{order.analystName}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{order.serviceName}</td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">¥{order.finalPrice}</div>
                        {order.finalPrice < order.price && <div className="text-sm text-gray-500 line-through">¥{order.price}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />{config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{order.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                          {order.status === 'completed' && (
                            <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
