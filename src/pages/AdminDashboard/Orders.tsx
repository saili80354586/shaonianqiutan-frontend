import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../../services/api';
import type { Order } from '../../types';
import { Loading } from '../../components';
import { ClipboardList, Package, User, CreditCard, Clock, Upload, Video, FileText, CheckCircle } from 'lucide-react';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await adminApi.listOrders();
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'uploaded': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'assigned': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'processing': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'refunded': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return '已支付';
      case 'pending': return '待支付';
      case 'uploaded': return '待分配';
      case 'assigned': return '已派发';
      case 'processing': return '分析中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'refunded': return '已退款';
      default: return status;
    }
  };

  const getOrderTypeName = (type?: string) => {
    if (type === 'basic') return '文字版';
    if (type === 'video') return '视频版';
    if (type === 'pro') return '文字+视频版';
    return '文字版';
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>, orderId: number, reportId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(orderId);
    try {
      await adminApi.uploadAIReport(reportId, file);
      alert('AI 报告上传成功');
      loadOrders();
    } catch (err: any) {
      alert('上传失败: ' + (err?.response?.data?.message || err?.message || '未知错误'));
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>, orderId: number, reportId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(orderId);
    try {
      await adminApi.uploadAIVideo(reportId, file);
      alert('AI 视频分析上传成功');
      loadOrders();
    } catch (err: any) {
      alert('上传失败: ' + (err?.response?.data?.message || err?.message || '未知错误'));
    } finally {
      setUploadingId(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx"
        className="hidden"
        onChange={(e) => {
          if (currentOrderId !== null) {
            const order = orders.find(o => o.id === currentOrderId);
            if (order?.report?.id) handleUploadReport(e, currentOrderId, order.report.id);
          }
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (currentOrderId !== null) {
            const order = orders.find(o => o.id === currentOrderId);
            if (order?.report?.id) handleUploadVideo(e, currentOrderId, order.report.id);
          }
        }}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-400" /> 订单管理
        </h2>
        <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-slate-400 rounded-full text-sm">
          共 {orders.length} 条
        </span>
      </div>

      {orders.length > 0 ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-slate-400">
                  <th className="pb-3 pt-4 px-6">订单号</th>
                  <th className="pb-3 pt-4 px-6">用户</th>
                  <th className="pb-3 pt-4 px-6">类型</th>
                  <th className="pb-3 pt-4 px-6">分析师</th>
                  <th className="pb-3 pt-4 px-6">金额</th>
                  <th className="pb-3 pt-4 px-6">状态</th>
                  <th className="pb-3 pt-4 px-6">创建时间</th>
                  <th className="pb-3 pt-4 px-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono text-sm text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        {order.order_no}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {order.user?.nickname || order.user?.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 text-sm">
                      {getOrderTypeName(order.order_type)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">{order.analyst?.name || '-'}</td>
                    <td className="py-4 px-6 font-medium text-white">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500/50" />
                        ¥{order.amount}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {order.status === 'completed' && order.report?.id ? (
                        <div className="flex flex-col gap-2">
                          {/* 下载 AI 报告（如果有） */}
                          {order.report?.ai_report_url && (
                            <a
                              href={`/api/admin/reports/${order.report.id}/download?type=report`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors text-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              下载分析报告.docx
                            </a>
                          )}
                          {/* 上传 AI 报告 */}
                          <button
                            onClick={() => {
                              setCurrentOrderId(order.id);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploadingId === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors text-xs disabled:opacity-50"
                          >
                            {uploadingId === order.id ? (
                              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            {order.report?.ai_report_url ? '更新报告' : '上传报告'}
                          </button>
                          {/* 上传 AI 视频分析（仅 pro 类型） */}
                          {(order.order_type === 'pro' || order.order_type === 'video') && (
                            <button
                              onClick={() => {
                                setCurrentOrderId(order.id);
                                videoInputRef.current?.click();
                              }}
                              disabled={uploadingId === order.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors text-xs disabled:opacity-50"
                            >
                              {uploadingId === order.id ? (
                                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Video className="w-3.5 h-3.5" />
                              )}
                              {order.report?.ai_video_url ? '更新视频' : '上传视频分析'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl p-12 border border-white/[0.06] text-center">
          <ClipboardList className="w-12 h-12 text-slate-500/30 mx-auto mb-4" />
          <p className="text-slate-400">暂无订单数据</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
