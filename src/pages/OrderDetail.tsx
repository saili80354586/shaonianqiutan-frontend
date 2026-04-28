import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Video,
  Download,
  MessageCircle,
  RefreshCw,
  ChevronLeft,
  Star,
  User,
  Calendar,
  DollarSign,
  FileVideo,
  Play
} from 'lucide-react';
import { orderApi, reportApi } from '../services/api';
import { Loading } from '../components';
import type { Order, Report } from '../types';
import { useAuthStore } from '../store';

// 扩展订单类型以支持更多字段
interface ExtendedOrder extends Order {
  video_url?: string;
  video_filename?: string;
  analyst?: {
    id: number;
    name: string;
    avatar?: string;
    title?: string;
    rating?: number;
  };
  payment_method?: string;
  payment_time?: string;
  completed_at?: string;
}

// 订单状态配置
const statusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode
}> = {
  pending: {
    label: '待支付',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    icon: <Clock size={16} />
  },
  paid: {
    label: '已支付',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    icon: <CreditCard size={16} />
  },
  processing: {
    label: '分析中',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    icon: <FileText size={16} />
  },
  completed: {
    label: '已完成',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    icon: <CheckCircle size={16} />
  },
  cancelled: {
    label: '已取消',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    icon: <XCircle size={16} />
  }
};

// 时间轴步骤配置
const timelineSteps = [
  { status: 'pending', label: '待支付', description: '订单已创建,等待支付' },
  { status: 'paid', label: '已支付', description: '支付成功,等待分析师接单' },
  { status: 'processing', label: '分析中', description: '分析师正在处理您的视频' },
  { status: 'completed', label: '已完成', description: '分析报告已生成,可下载查看' }
];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderDetail(Number(orderId));
      if (response.data?.success && response.data?.data) {
        setOrder(response.data.data.order as ExtendedOrder);
      }
    } catch (error) {
      console.error('加载订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('确定要取消此订单吗?')) return;

    try {
      setCancelling(true);
      await orderApi.cancelOrder(order.id);

      // 刷新订单数据
      await loadOrder(order.id.toString());
      alert('订单已取消');
    } catch (error: any) {
      console.error('取消订单失败', error);
      alert(error?.response?.data?.error?.message || '取消订单失败,请重试');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactAnalyst = () => {
    // 联系分析师功能 - 跳转到消息页面或打开对话框
    if (order?.analyst?.id) {
      // TODO: 实现联系分析师功能
      alert(`联系分析师: ${order.analyst.name}`);
    }
  };

  const handleReorder = () => {
    // 重新下单功能
    navigate('/video-analysis');
  };

  const handleDownloadReport = async () => {
    const reportId = order?.report?.id || order?.report_id;
    if (!reportId) return;

    try {
      const response = await reportApi.downloadReport(reportId);
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `球探报告_${order?.report?.title || reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载报告失败', error);
      alert('下载报告失败,请重试');
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取当前步骤索引
  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusIndex = timelineSteps.findIndex(s => s.status === order.status);
    return statusIndex >= 0 ? statusIndex : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-10">
        <div className="max-w-5xl mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-white mb-4">订单不存在</h2>
            <Link to="/user-dashboard" className="text-accent hover:underline">
              返回我的订单
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const status = statusConfig[order.status] || statusConfig.pending;
  const reportId = order.report?.id || order.report_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            to="/user-dashboard"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            返回订单列表
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">订单详情</h1>
          <p className="text-white/60 mt-2">查看订单详细信息和进度</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 主要信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 订单基本信息卡片 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">订单信息</h2>
                  <p className="text-white/60 text-sm">订单号: {order.order_no || `ORD-${order.id}`}</p>
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor}/20 ${status.color} font-medium`}>
                  {status.icon}
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 分析师信息 */}
                <div className="col-span-2 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center">
                      {order.analyst?.avatar ? (
                        <img
                          src={order.analyst.avatar}
                          alt={order.analyst.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{order.analyst?.name || '待分配分析师'}</p>
                      <p className="text-white/60 text-sm">{order.analyst?.title || '专业足球分析师'}</p>
                      {order.analyst?.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white/80 text-sm">{order.analyst.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 订单金额 */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white/60 text-sm">订单金额</p>
                      <p className="text-2xl font-bold text-green-400">¥{order.amount}</p>
                    </div>
                  </div>
                </div>

                {/* 下单时间 */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white/60 text-sm">下单时间</p>
                      <p className="text-white font-medium">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* 支付时间 */}
                {order.paid_at && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white/60 text-sm">支付时间</p>
                        <p className="text-white font-medium">{formatDateTime(order.paid_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 完成时间 */}
                {order.completed_at && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white/60 text-sm">完成时间</p>
                        <p className="text-white font-medium">{formatDateTime(order.completed_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 视频信息卡片 */}
            {(order.video_url || order.video_filename) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-accent" />
                  视频信息
                </h2>

                <div className="space-y-4">
                  {order.video_filename && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <Video className="w-5 h-5 text-white/60" />
                      <span className="text-white">{order.video_filename}</span>
                    </div>
                  )}

                  {order.video_url && (
                    <div>
                      <button
                        onClick={() => setShowVideo(!showVideo)}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <Play className="w-5 h-5 text-accent" />
                        <span className="text-white">{showVideo ? '关闭预览' : '预览视频'}</span>
                      </button>

                      {showVideo && (
                        <div className="mt-4 aspect-video bg-black rounded-xl overflow-hidden">
                          <video
                            src={order.video_url}
                            controls
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 报告预览卡片 - 订单完成后显示 */}
            {order.status === 'completed' && reportId && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  球探报告
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl border border-accent/20">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {order.report?.title || `${order.player_name || '球员'} 的技术分析报告`}
                    </h3>
                    <p className="text-white/70 text-sm line-clamp-2">
                      {order.report?.description || order.report?.content?.substring(0, 200) || '分析报告已完成，可查看完整报告。'}
                    </p>
                  </div>

                  {order.report?.rating && (
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-accent">{order.report.rating}</p>
                        <p className="text-white/60 text-sm">综合评分</p>
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {(order.report?.player_position || order.player_position) && (
                            <div className="text-white/80">
                              <span className="text-white/60">位置: </span>
                              {order.report?.player_position || order.player_position}
                            </div>
                          )}
                          {(order.report?.player_name || order.player_name) && (
                            <div className="text-white/80">
                              <span className="text-white/60">球员: </span>
                              {order.report?.player_name || order.player_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link
                      to={`/reports/${reportId}`}
                      className="flex-1 py-3 bg-accent text-white rounded-xl font-medium text-center hover:bg-accent-light transition-colors"
                    >
                      查看完整报告
                    </Link>
                    <button
                      onClick={handleDownloadReport}
                      disabled={!order.report?.pdf_url}
                      className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={18} />
                      {order.report?.pdf_url ? '下载PDF' : '暂无PDF文件'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧 - 时间轴和操作 */}
          <div className="space-y-6">
            {/* 订单状态时间轴 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                订单进度
              </h2>

              {order.status === 'cancelled' ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-3 text-red-400">
                    <XCircle size={24} />
                    <div>
                      <p className="font-semibold">订单已取消</p>
                      <p className="text-sm text-red-400/70">该订单已被取消,无法继续处理</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* 连接线 */}
                  <div className="absolute left-[19px] top-[30px] bottom-[30px] w-[2px] bg-white/20"></div>

                  <div className="space-y-6">
                    {timelineSteps.map((step, index) => {
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      const isPending = index > currentStep;

                      return (
                        <div key={step.status} className="relative flex items-start gap-4">
                          {/* 图标 */}
                          <div className={`
                            relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                            ${isActive
                              ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30'
                              : isCompleted
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : 'bg-white/10 border-white/30 text-white/50'
                            }
                          `}>
                            {isCompleted ? (
                              <CheckCircle size={20} />
                            ) : isActive ? (
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            ) : (
                              <Clock size={20} />
                            )}
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`
                                font-semibold transition-colors
                                ${isActive ? 'text-accent' : isCompleted ? 'text-green-400' : 'text-white/50'}
                              `}>
                                {step.label}
                              </h4>
                              {isActive && (
                                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                                  当前
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${isActive ? 'text-white/80' : 'text-white/50'}`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-white mb-4">操作</h2>

              {/* 待支付状态 */}
              {order.status === 'pending' && (
                <>
                  <Link
                    to={`/order/${order.id}/payment`}
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-medium hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} />
                    立即支付
                  </Link>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} />
                    {cancelling ? '取消中...' : '取消订单'}
                  </button>
                </>
              )}

              {/* 已支付/分析中状态 */}
              {(order.status === 'paid' || order.status === 'processing') && (
                <button
                  onClick={handleContactAnalyst}
                  className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  联系分析师
                </button>
              )}

              {/* 已完成状态 */}
              {order.status === 'completed' && (
                <>
                  {reportId && (
                    <Link
                      to={`/reports/${reportId}`}
                      className="w-full py-3 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-medium hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      查看报告
                    </Link>
                  )}
                  <button
                    onClick={handleReorder}
                    className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    重新下单
                  </button>
                </>
              )}

              {/* 已取消状态 */}
              {order.status === 'cancelled' && (
                <button
                  onClick={handleReorder}
                  className="w-full py-3 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-medium hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  重新下单
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
