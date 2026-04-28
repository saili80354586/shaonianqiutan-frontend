import React, { useEffect, useState } from 'react';
import type { Order } from '../types';
import { adminApi, unwrapApiResponse } from '../services/api';
import { Loading } from '../components';
import { Search, Filter, Eye, XCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await adminApi.listOrders({ page: currentPage, pageSize });
      const payload = unwrapApiResponse(response);
      if (payload.success && payload.data) {
        let filteredOrders = payload.data.list;
        
        // 状态筛选
        if (statusFilter !== 'all') {
          filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
        }
        
        // 搜索筛选
        if (searchQuery) {
          filteredOrders = filteredOrders.filter(o => 
            o.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.user?.phone?.includes(searchQuery) ||
            o.user?.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        // 日期筛选
        if (dateRange.start) {
          filteredOrders = filteredOrders.filter(o => 
            new Date(o.created_at) >= new Date(dateRange.start)
          );
        }
        if (dateRange.end) {
          filteredOrders = filteredOrders.filter(o => 
            new Date(o.created_at) <= new Date(dateRange.end)
          );
        }
        
        setOrders(filteredOrders);
        setTotalOrders(payload.data.total);
      }
    } catch (error) {
      console.error('加载订单列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadOrders();
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCancelOrder = async (order: Order) => {
    if (order.status !== 'pending' && order.status !== 'assigned') {
      alert('该订单状态不允许取消');
      return;
    }
    
    if (!window.confirm(`确定要取消订单 "${order.order_no}" 吗？`)) {
      return;
    }

    try {
      await adminApi.cancelOrder(order.id.toString());
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
      alert('订单已取消');
    } catch (error) {
      console.error('取消订单失败', error);
      alert('取消订单失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: '待支付', className: 'bg-yellow-100 text-yellow-800' },
      paid: { text: '已支付', className: 'bg-blue-100 text-blue-800' },
      assigned: { text: '已分配', className: 'bg-purple-100 text-purple-800' },
      processing: { text: '处理中', className: 'bg-indigo-100 text-indigo-800' },
      completed: { text: '已完成', className: 'bg-green-100 text-green-800' },
      cancelled: { text: '已取消', className: 'bg-gray-100 text-gray-800' },
      refunded: { text: '已退款', className: 'bg-red-100 text-red-800' },
    };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${className}`}>{text}</span>;
  };

  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <div className="text-sm text-gray-500">
          共 {totalOrders} 笔订单
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号或用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="assigned">已分配</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分析师</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-600">{order.order_no}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              src={order.user?.avatar || '/images/default-avatar.jpg'}
                              alt={order.user?.nickname || '用户'}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.user?.nickname || '未命名'}</div>
                              <div className="text-xs text-gray-500">{order.user?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.analyst?.name || order.analyst?.nickname || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">¥{order.amount}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(order.status === 'pending' || order.status === 'assigned') && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="取消订单"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        暂无订单数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 订单详情弹窗 */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">订单详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">订单号</span>
                <span className="font-mono">{selectedOrder.order_no}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">订单金额</span>
                <span className="font-semibold text-lg">¥{selectedOrder.amount}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">订单状态</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="py-2 border-b border-gray-100">
                <span className="text-gray-500 block mb-2">用户信息</span>
                <div className="flex items-center">
                  <img
                    src={selectedOrder.user?.avatar || '/images/default-avatar.jpg'}
                    alt={selectedOrder.user?.nickname || '用户'}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <div className="font-medium">{selectedOrder.user?.nickname || '未命名'}</div>
                    <div className="text-sm text-gray-500">{selectedOrder.user?.phone}</div>
                  </div>
                </div>
              </div>
              {selectedOrder.analyst && (
                <div className="py-2 border-b border-gray-100">
                  <span className="text-gray-500 block mb-2">分析师</span>
                  <div className="font-medium">{selectedOrder.analyst.name || selectedOrder.analyst.nickname}</div>
                  {selectedOrder.analyst.title && (
                    <div className="text-sm text-gray-500">{selectedOrder.analyst.title}</div>
                  )}
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">创建时间</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {selectedOrder.paid_at && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">支付时间</span>
                  <span>{new Date(selectedOrder.paid_at).toLocaleString('zh-CN')}</span>
                </div>
              )}
              {selectedOrder.report_id && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">关联报告</span>
                  <span className="text-blue-600">#{selectedOrder.report_id}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'assigned') && (
                <button
                  onClick={() => {
                    handleCancelOrder(selectedOrder);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  取消订单
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
