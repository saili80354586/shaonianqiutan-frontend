import React, { useState, useEffect } from 'react';
import { analystApi } from '../../services/api';
import type { Order, OrderType } from '../../types';
import { toast } from 'sonner';
import { 
  Clock, 
  User, 
  Video,
  FileText,
  CheckCircle,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import OrderDetailModal from './components/OrderDetailModal';

interface PendingOrdersProps {
  onAccept: () => void;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ onAccept }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await analystApi.getPendingOrders();
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list);
      }
    } catch (error) {
      console.error('加载待处理订单失败', error);
      toast.error('加载待处理订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      const response = await analystApi.acceptOrder(orderId.toString());
      if (response.data?.success) {
        toast.success('接单成功！');
        onAccept();
      } else {
        toast.error(response.data?.error?.message || response.data?.data?.message || '接单失败');
      }
    } catch (error: any) {
      console.error('接单失败', error);
      toast.error(error?.response?.data?.error?.message || '接单失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: number) => {
    if (!rejectReason.trim()) {
      toast.error('请填写拒绝原因');
      return;
    }
    
    setProcessingId(orderId);
    try {
      const response = await analystApi.rejectOrder(orderId.toString(), rejectReason);
      if (response.data?.success) {
        toast.success('已拒绝订单');
        setRejectingId(null);
        setRejectReason('');
        loadPendingOrders();
      } else {
        toast.error(response.data?.error?.message || response.data?.message || '操作失败');
      }
    } catch (error: any) {
      console.error('拒绝订单失败', error);
      toast.error(error?.response?.data?.error?.message || '操作失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const getOrderTypeBadge = (type: OrderType) => {
    if (type === 'pro' || type === 'video') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Video className="w-3 h-3 mr-1" />
          视频解析版 ¥799
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FileText className="w-3 h-3 mr-1" />
        文字版 ¥299
      </span>
    );
  };

  const getRemainingTime = (deadline?: string) => {
    if (!deadline) return { text: '-', color: 'text-gray-500' };
    const end = new Date(deadline);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff < 0) return { text: '已逾期', color: 'text-red-600' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let color = 'text-green-600';
    if (hours <= 6) color = 'text-red-600';
    else if (hours <= 24) color = 'text-yellow-600';
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}天${hours % 24}小时`, color };
    }
    return { text: `${hours}小时${minutes}分钟`, color };
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无待处理订单</h3>
          <p className="text-gray-500">管理员派发的新订单将显示在这里</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">待处理订单提醒</p>
              <p className="text-sm text-blue-700 mt-1">
                您有 {orders.length} 个待处理订单，请及时响应。若无法接受，请填写拒绝原因以便管理员重新派发。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* 左侧信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
                      {getOrderTypeBadge(order.order_type)}
                    </div>
                    
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{order.player_name}</span>
                        <span className="text-sm text-gray-500">
                          ({order.player_age}岁 | {order.player_position})
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.match_name} vs {order.opponent}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Video className="w-3 h-3" />
                        视频时长: {formatDuration(order.video_duration)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        截止时间: {new Date(order.deadline || '').toLocaleString('zh-CN')}
                      </div>
                      <div className={`flex items-center gap-1 ${getRemainingTime(order.deadline).color}`}>
                        <Clock className="w-3 h-3" />
                        剩余时间: {getRemainingTime(order.deadline).text}
                      </div>
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">¥{order.amount}</p>
                      <p className="text-xs text-gray-500">预计收益</p>
                    </div>
                    
                    {rejectingId === order.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="填写拒绝原因..."
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg w-48"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={processingId === order.id}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm rounded-lg"
                          >
                            {processingId === order.id ? '处理中...' : '确认拒绝'}
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="px-3 py-1.5 text-gray-600 text-sm"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                        <button
                          onClick={() => setRejectingId(order.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                          拒绝
                        </button>
                        <button
                          onClick={() => handleAccept(order.id)}
                          disabled={processingId === order.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                        >
                          {processingId === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              处理中...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              接受订单
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};

export default PendingOrders;
