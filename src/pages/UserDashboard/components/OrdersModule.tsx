import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  FileText,
  Video,
  ChevronRight as ArrowRight,
  Filter,
  Search,
  Loader2
} from 'lucide-react';
import api, { orderApi } from '../../../services/api';

// 内联类型定义
type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  numericId: number;
  title: string;
  status: OrderStatus;
  price: number;
  createdAt: string;
  analystName?: string;
  videoUrl?: string;
  reportId?: number;
  aiReportUrl?: string;
  aiVideoUrl?: string;
  ratingReportMD?: string;
  playerInfoMD?: string;
}

// 后端订单数据类型
interface BackendOrder {
  id: number;
  order_no: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  analyst?: {
    name: string;
  };
  video_url?: string;
  report?: {
    id: number;
    ai_report_url?: string;
    ai_video_url?: string;
    rating_report_md?: string;
    player_info_md?: string;
  };
}

// 订单状态映射
const statusMap: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: '待支付', 
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    icon: <Clock size={14} />
  },
  paid: { 
    label: '已支付', 
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: <CreditCard size={14} />
  },
  processing: { 
    label: '分析中', 
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    icon: <FileText size={14} />
  },
  completed: { 
    label: '已完成', 
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: <CheckCircle size={14} />
  },
  cancelled: { 
    label: '已取消', 
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: <XCircle size={14} />
  },
};



export const OrdersModule: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // 从后端获取订单列表
  const fetchOrders = async (page: number, keyword: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/orders/?page=${page}&pageSize=${itemsPerPage}&keyword=${encodeURIComponent(keyword)}`);
      if (response.data.success) {
        const backendOrders: BackendOrder[] = response.data.data.list || [];
        const mappedOrders: Order[] = backendOrders.map((order) => ({
          id: order.order_no || String(order.id),
          numericId: order.id,
          title: `订单 #${order.order_no || order.id}`,
          status: order.status,
          price: order.amount,
          createdAt: order.created_at,
          analystName: order.analyst?.name,
          videoUrl: order.video_url,
          reportId: order.report?.id,
          aiReportUrl: order.report?.ai_report_url,
          aiVideoUrl: order.report?.ai_video_url,
          ratingReportMD: order.report?.rating_report_md,
          playerInfoMD: order.report?.player_info_md,
        }));
        setOrders(mappedOrders);
        setTotal(response.data.data.total || 0);
      } else {
        setError(response.data.error || '获取订单列表失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '获取订单列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, searchKeyword);
  }, [currentPage, searchKeyword]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchKeyword) {
        setSearchKeyword(searchQuery);
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 本地状态筛选（搜索已交给后端，这里只做状态过滤）
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  // 分页计算（基于后端 total）
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders;

  // 重置页码当筛选变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // 查看订单详情
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  // 支付订单
  const handlePayOrder = (orderId: string) => {
    // TODO: 调用支付API
    console.log('支付订单:', orderId);
  };

  // 取消/移除订单
  const handleRemoveOrder = async (order: Order) => {
    if (order.status === 'pending') {
      try {
        await orderApi.cancelOrder(order.numericId);
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o
        ));
        setToast('订单已取消');
        setTimeout(() => setToast(null), 3000);
      } catch {
        setToast('取消订单失败，请重试');
        setTimeout(() => setToast(null), 3000);
      }
    } else {
      setOrders(prev => prev.filter(o => o.id !== order.id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 shadow-lg flex items-center gap-2 animate-fadeIn">
          <span className="text-white text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">全部订单</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">待支付</p>
              <p className="text-2xl font-bold text-yellow-400">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">分析中</p>
              <p className="text-2xl font-bold text-purple-400">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <FileText className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">已完成</p>
              <p className="text-2xl font-bold text-green-400">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#111827] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="processing">分析中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索订单标题或订单号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14]"
            />
          </div>
          <button
            onClick={() => navigate('/video-analysis')}
            className="px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden md:inline">去下单</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-12 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#39ff14] mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-[#1a1f2e] rounded-xl border border-red-800/50 p-6 text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && (
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
        {paginatedOrders.length > 0 ? (
          <>
            <div className="divide-y divide-gray-800">
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-[#252b3d] transition-colors cursor-pointer group"
                  onClick={() => handleViewDetail(order)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#39ff14] transition-colors">
                          {order.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusMap[order.status].color}`}>
                          <span className="flex items-center gap-1">
                            {statusMap[order.status].icon}
                            {statusMap[order.status].label}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>订单号: {order.id}</span>
                        <span>•</span>
                        <span>创建时间: {new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                        {order.analystName && (
                          <>
                            <span>•</span>
                            <span>分析师: {order.analystName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#39ff14]">¥{order.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayOrder(order.id);
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all"
                          >
                            立即支付
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: 下载报告
                            }}
                            className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-all flex items-center gap-1"
                          >
                            <Download size={14} />
                            下载报告
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(order);
                          }}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-all flex items-center gap-1"
                        >
                          <Eye size={14} />
                          查看详情
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('确定要取消这个订单吗？')) {
                                handleRemoveOrder(order);
                              }
                            }}
                            className="px-3 py-1 text-red-400 hover:text-red-300 transition-colors"
                            title="取消订单"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {order.status === 'cancelled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('确定要从列表中移除这个已取消的订单吗？')) {
                                handleRemoveOrder(order);
                              }
                            }}
                            className="px-3 py-1 text-gray-500 hover:text-gray-400 transition-colors"
                            title="移除订单"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  显示 {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} 条，共 {total} 条
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    上一页
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-[#39ff14] text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors flex items-center gap-1"
                  >
                    下一页
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || filterStatus !== 'all' ? '没有找到匹配的订单' : '暂无订单'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? '请尝试调整搜索条件或筛选条件' 
                : '开始你的第一次视频分析吧！'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button className="px-6 py-3 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2">
                <Plus size={20} />
                去上传视频
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* 订单详情弹窗 */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">订单详情</h2>
                <p className="text-gray-500 text-sm mt-1">订单号: {selectedOrder.id}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusMap[selectedOrder.status].color}`}>
                  <span className="flex items-center gap-2">
                    {statusMap[selectedOrder.status].icon}
                    {statusMap[selectedOrder.status].label}
                  </span>
                </span>
              </div>

              {/* Order Info */}
              <div className="bg-[#111827] rounded-xl p-4 space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-[#39ff14]" />
                  订单信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">视频标题</span>
                    <p className="text-white mt-1">{selectedOrder.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">订单金额</span>
                    <p className="text-[#39ff14] text-lg font-bold mt-1">¥{selectedOrder.price}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">创建时间</span>
                    <p className="text-white mt-1">{new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  {selectedOrder.analystName && (
                    <div>
                      <span className="text-gray-500">分析师</span>
                      <p className="text-white mt-1">{selectedOrder.analystName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              {selectedOrder.videoUrl && (
                <div className="bg-[#111827] rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Eye size={18} className="text-[#39ff14]" />
                    视频预览
                  </h3>
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <video
                      src={selectedOrder.videoUrl}
                      controls
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* 视频分析报告下载 */}
              {selectedOrder.status === 'completed' && (selectedOrder.aiReportUrl || selectedOrder.aiVideoUrl) && (
                <div className="bg-[#111827] rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Download size={18} className="text-orange-400" />
                    视频分析报告
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedOrder.aiReportUrl && (
                      <button
                        onClick={() => orderApi.downloadAIReport(selectedOrder.numericId, 'report').catch(() => alert('下载失败，请稍后重试'))}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors"
                      >
                        <FileText size={16} />
                        文字报告
                      </button>
                    )}
                    {selectedOrder.aiVideoUrl && (
                      <button
                        onClick={() => orderApi.downloadAIReport(selectedOrder.numericId, 'video').catch(() => alert('下载失败，请稍后重试'))}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                      >
                        <Video size={16} />
                        视频分析
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                关闭
              </button>
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    handlePayOrder(selectedOrder.id);
                    handleCloseDetail();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2"
                >
                  <CreditCard size={18} />
                  立即支付
                </button>
              )}
              {selectedOrder.status === 'completed' && (
                <button
                  className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-medium hover:bg-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  下载报告
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
