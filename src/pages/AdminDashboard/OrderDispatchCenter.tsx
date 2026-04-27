import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import type { Order, OrderType, AnalystWorkload } from '../../types';
import { 
  Clock, 
  User, 
  Video, 
  FileText, 
  Send, 
  RotateCcw, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  Filter,
  Search
} from 'lucide-react';

const OrderDispatchCenter: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<OrderType | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAnalystSelector, setShowAnalystSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPendingDispatchOrders();
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载待派发订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = (order: Order) => {
    setSelectedOrder(order);
    setShowAnalystSelector(true);
  };

  const handleDispatchSuccess = () => {
    setShowAnalystSelector(false);
    setSelectedOrder(null);
    loadPendingOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filterType !== 'all' && order.order_type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_no.toLowerCase().includes(query) ||
        order.player_name?.toLowerCase().includes(query) ||
        order.user?.nickname?.toLowerCase().includes(query) ||
        order.user?.phone?.includes(query)
      );
    }
    return true;
  });

  const getOrderTypeBadge = (type: OrderType) => {
    if (type === 'video') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Video className="w-3 h-3 mr-1" />
          视频版
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

  const getWaitingTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}天${hours % 24}小时`;
    }
    return `${hours}小时${minutes}分钟`;
  };

  const getUrgencyLevel = (createdAt: string) => {
    const hours = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours > 24) return { level: 'high', color: 'text-red-600 bg-red-50', label: '紧急' };
    if (hours > 12) return { level: 'medium', color: 'text-orange-600 bg-orange-50', label: '优先' };
    return { level: 'normal', color: 'text-green-600 bg-green-50', label: '正常' };
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
      {/* 头部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待派发订单</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">视频版订单</p>
              <p className="text-2xl font-bold text-purple-600">
                {orders.filter(o => o.order_type === 'video' || o.order_type === 'pro').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">文字版订单</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.order_type === 'text').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">紧急订单</p>
              <p className="text-2xl font-bold text-red-600">
                {orders.filter(o => getUrgencyLevel(o.created_at).level === 'high').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">筛选:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as OrderType | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类型</option>
              <option value="video">视频版</option>
              <option value="text">文字版</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索订单号、球员姓名或用户..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={loadPendingOrders}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => navigate('/admin/orders/assignments')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            查看派发记录
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待派发订单</h3>
            <p className="text-gray-500">所有已支付订单都已派发完毕</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const urgency = getUrgencyLevel(order.created_at);
            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* 左侧：订单信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
                      {getOrderTypeBadge(order.order_type)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${urgency.color}`}>
                        {urgency.label}
                      </span>
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
                        vs {order.opponent}
                      </div>
                      <div className="text-sm text-gray-500">
                        视频时长: {formatDuration(order.video_duration)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <User className="w-3 h-3" />
                        用户: {order.user?.nickname || order.user?.phone}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        下单: {new Date(order.created_at).toLocaleString('zh-CN')}
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="w-3 h-3" />
                        等待: {getWaitingTime(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">¥{order.amount}</p>
                      <p className="text-xs text-gray-500">订单金额</p>
                    </div>
                    <button
                      onClick={() => handleDispatch(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      派发订单
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分析师选择器弹窗 */}
      {showAnalystSelector && selectedOrder && (
        <AnalystSelectorModal
          order={selectedOrder}
          onClose={() => setShowAnalystSelector(false)}
          onSuccess={handleDispatchSuccess}
        />
      )}
    </div>
  );
};

// 分析师选择器弹窗组件
interface AnalystSelectorModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const AnalystSelectorModal: React.FC<AnalystSelectorModalProps> = ({ order, onClose, onSuccess }) => {
  const [analysts, setAnalysts] = useState<AnalystWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyst, setSelectedAnalyst] = useState<AnalystWorkload | null>(null);
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    loadAnalysts();
    // 设置默认截止时间(3天后)
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 3);
    defaultDeadline.setHours(18, 0, 0, 0);
    setDeadline(defaultDeadline.toISOString().slice(0, 16));
  }, []);

  const loadAnalysts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAvailableAnalysts({
        position: order.player_position,
        date: new Date().toISOString().split('T')[0]
      });
      if (response.data?.success && response.data?.data) {
        setAnalysts(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载分析师列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedAnalyst) return;
    
    setDispatching(true);
    try {
      const response = await adminApi.assignOrder(order.id.toString(), {
        analyst_id: selectedAnalyst.analyst_id,
        deadline: new Date(deadline).toISOString(),
        note
      });
      
      if (response.data?.success) {
        alert('订单派发成功！');
        onSuccess();
      } else {
        alert(response.data?.error?.message || '派发失败');
      }
    } catch (error) {
      console.error('派发订单失败', error);
      alert('派发失败，请重试');
    } finally {
      setDispatching(false);
    }
  };

  const getAvailabilityColor = (workload: AnalystWorkload) => {
    const ratio = workload.accepted_orders / workload.max_orders;
    if (ratio >= 1) return 'text-red-600';
    if (ratio >= 0.7) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">选择分析师</h3>
            <p className="text-sm text-gray-500 mt-1">
              订单: {order.order_no} | 球员: {order.player_name} ({order.player_position})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 分析师列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysts.map((workload) => (
                  <div
                    key={workload.analyst_id}
                    onClick={() => workload.is_available && setSelectedAnalyst(workload)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAnalyst?.analyst_id === workload.analyst_id
                        ? 'border-blue-500 bg-blue-50'
                        : workload.is_available
                        ? 'border-gray-200 hover:border-blue-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {workload.analyst?.nickname?.[0] || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{workload.analyst?.nickname}</h4>
                          <span className="text-yellow-500 text-sm">★ {workload.avg_rating}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          已完成 {workload.total_completed} 单
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workload.specialties?.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            工作时间: {workload.working_hours}
                          </span>
                          <span className={getAvailabilityColor(workload)}>
                            今日: {workload.accepted_orders}/{workload.max_orders}
                          </span>
                        </div>
                        {!workload.is_available && (
                          <p className="text-xs text-red-500 mt-1">今日已满负荷</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 派发信息设置 */}
              {selectedAnalyst && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900">派发信息设置</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        分析截止时间 *
                      </label>
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        派发备注
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="可选：给分析师的备注信息"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
          >
            取消
          </button>
          <button
            onClick={handleDispatch}
            disabled={!selectedAnalyst || dispatching}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            {dispatching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                派发中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                确认派发
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDispatchCenter;
