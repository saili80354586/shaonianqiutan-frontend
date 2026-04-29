import React, { useState, useEffect } from 'react';
import { analystApi } from '../../services/api';
import type { Order, OrderType } from '../../types';
import { 
  Clock, 
  User, 
  Video,
  FileText,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  RotateCcw
} from 'lucide-react';

interface ActiveOrdersProps {
  onStartAnalysis: (order: Order) => void;
}

const ActiveOrders: React.FC<ActiveOrdersProps> = ({ onStartAnalysis }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveOrders();
  }, []);

  const loadActiveOrders = async () => {
    setLoading(true);
    try {
      const response = await analystApi.getActiveOrders();
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list);
      }
    } catch (error) {
      console.error('加载进行中订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeBadge = (type: OrderType) => {
    if (type === 'pro' || type === 'video') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Video className="w-3 h-3 mr-1" />
          视频解析版
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FileText className="w-3 h-3 mr-1" />
        文字版
      </span>
    );
  };

  const getRemainingTime = (deadline?: string) => {
    if (!deadline) return { text: '-', isUrgent: false };
    const end = new Date(deadline);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return { text: '已逾期', isUrgent: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { 
        text: `${days}天${hours % 24}小时`, 
        isUrgent: days < 2 
      };
    }
    return { 
      text: `${hours}小时${minutes}分`, 
      isUrgent: hours < 12 
    };
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">进行中订单</h3>
        <button
          onClick={loadActiveOrders}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无进行中订单</h3>
          <p className="text-gray-500">前往"待处理"页面接受新订单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const remaining = getRemainingTime(order.deadline);
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* 左侧信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
                      {getOrderTypeBadge(order.order_type)}
                      {remaining.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          即将截止
                        </span>
                      )}
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
                        接单时间: {new Date(order.accepted_at || '').toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">剩余时间</p>
                      <p className={`font-semibold ${
                        remaining.text.includes('逾期') ? 'text-red-600' : 
                        remaining.isUrgent ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {remaining.text}
                      </p>
                    </div>
                    <button
                      onClick={() => onStartAnalysis(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {order.order_type === 'pro' || order.order_type === 'video' ? '开始分析与剪辑' : '开始评分'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveOrders;
