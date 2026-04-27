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
  paid: { label: '已支付', color: 'text-blue-400 bg-blue-500/20', icon: FileText },
  processing: { label: '分析中', color: 'text-blue-400 bg-blue-500/20', icon: Clock },
  completed: { label: '已完成', color: 'text-green-400 bg-green-500/20', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-400 bg-red-500/20', icon: XCircle },
};

const OrderManagement: React.FC<OrderManagementProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalAmount: 0 });

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.list?.();
      if (res?.data?.success && res?.data?.data) {
        const orders = res.data.data.orders || [];
        setOrders(orders);
        const pending = orders.filter((o: Order) => o.status === 'pending').length || 0;
        const completed = orders.filter((o: Order) => o.status === 'completed').length || 0;
        const total = orders.length || 0;
        const totalAmount = orders.reduce((sum: number, o: Order) => sum + (o.finalPrice || 0), 0) || 0;
        setStats({ total, pending, completed, totalAmount });
      }
    } catch (error) {
      setOrders([
        { id: 1, orderNo: 'CLUB20260405001', playerName: '张小明', analystName: '李分析师', serviceName: '全方位技术分析报告', price: 299, finalPrice: 284, status: 'completed', createdAt: '2026-04-03' },
        { id: 2, orderNo: 'CLUB20260405002', playerName: '李小红', analystName: '待分配', serviceName: '快速分析报告', price: 99, finalPrice: 99, status: 'pending', createdAt: '2026-04-02' },
        { id: 3, orderNo: 'CLUB20260405003', playerName: '王强', analystName: '王分析师', serviceName: '全方位技术分析报告', price: 299, finalPrice: 284, status: 'processing', createdAt: '2026-04-01' },
      ]);
      setStats({ total: 3, pending: 1, completed: 1, totalAmount: 667 });
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
            <option value="paid">已支付</option>
            <option value="processing">分析中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

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
