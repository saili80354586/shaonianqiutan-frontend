import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, CheckCircle, Clock, XCircle, ArrowRight, Video, FileEdit } from 'lucide-react';

interface Order {
  id: string;
  playerName: string;
  position: string;
  age: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  price: number;
  createdAt: string;
  notes?: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-20240327001',
    playerName: '张明远',
    position: '前锋',
    age: 14,
    status: 'pending',
    price: 299,
    createdAt: '2024-03-27 10:30',
    notes: '需要重点分析射门技术',
  },
  {
    id: 'ORD-20240326002',
    playerName: '李华',
    position: '中场',
    age: 13,
    status: 'processing',
    price: 299,
    createdAt: '2024-03-26 14:20',
  },
  {
    id: 'ORD-20240325003',
    playerName: '王强',
    position: '后卫',
    age: 15,
    status: 'completed',
    price: 199,
    createdAt: '2024-03-25 09:15',
  },
  {
    id: 'ORD-20240324004',
    playerName: '赵敏',
    position: '门将',
    age: 14,
    status: 'cancelled',
    price: 199,
    createdAt: '2024-03-24 16:45',
  },
];

export const OrdersModule: React.FC = () => {
  const navigate = useNavigate();
  const [orders] = useState<Order[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
      pending: { text: '待处理', color: 'bg-blue-500/20 text-blue-400', icon: <Clock size={14} /> },
      processing: { text: '进行中', color: 'bg-yellow-500/20 text-yellow-400', icon: <Eye size={14} /> },
      completed: { text: '已完成', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle size={14} /> },
      cancelled: { text: '已取消', color: 'bg-red-500/20 text-red-400', icon: <XCircle size={14} /> },
    };
    return map[status] || { text: status, color: 'bg-gray-500/20 text-gray-400', icon: null };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">订单管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="搜索订单或球员..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14] w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-800">
                <th className="text-left py-4 px-6">订单号</th>
                <th className="text-left py-4 px-6">球员信息</th>
                <th className="text-left py-4 px-6">状态</th>
                <th className="text-right py-4 px-6">金额</th>
                <th className="text-left py-4 px-6">下单时间</th>
                <th className="text-center py-4 px-6">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const status = getStatusBadge(order.status);
                return (
                  <tr key={order.id} className="text-gray-300 hover:bg-white/5 transition-colors border-b border-gray-800 last:border-0">
                    <td className="py-4 px-6">
                      <span className="font-mono text-[#39ff14]">{order.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">{order.playerName}</p>
                        <p className="text-gray-500 text-sm">{order.position} · {order.age}岁</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-white">
                      ¥{order.price}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {order.createdAt}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-[#39ff14]"
                          title="查看详情"
                        >
                          <Eye size={18} />
                        </button>
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <>
                            <button
                              onClick={() => navigate(`/video-analysis-tool/${order.id}`)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                              title="视频分析"
                            >
                              <Video size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/score-form/${order.id}`)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                              title="评分表单"
                            >
                              <FileEdit size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-400 mb-2">暂无符合条件的订单</p>
            <p className="text-gray-500 text-sm">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersModule;
