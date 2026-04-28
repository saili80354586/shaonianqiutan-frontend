import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { Loading } from '../components';
import type { Order } from '../types';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getOrders();
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'uploaded':
      case 'assigned':
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return '待上传';
      case 'uploaded':
        return '待分配';
      case 'assigned':
        return '已派单';
      case 'processing':
        return '分析中';
      case 'completed':
        return '已完成';
      case 'pending':
        return '待支付';
      case 'cancelled':
        return '已取消';
      case 'expired':
        return '已过期';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的订单</h1>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const reportId = order.report?.id || order.report_id;

            return (
            <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.report?.title || `订单 #${order.id.toString().slice(-8)}`}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    创建时间: {new Date(order.created_at).toLocaleString('zh-CN')}
                  </p>
                  {order.report && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {order.report.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[150px]">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">¥{order.amount}</span>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Link
                        to={`/order/${order.id}/payment`}
                        className="btn-primary"
                      >
                        立即支付
                      </Link>
                    )}
                    {order.status === 'paid' && !order.report && (
                      <Link
                        to={`/order/${order.id}/upload`}
                        className="btn-primary"
                      >
                        上传资料
                      </Link>
                    )}
                    {order.status === 'completed' && reportId && (
                      <Link
                        to={`/reports/${reportId}`}
                        className="btn-primary"
                      >
                        查看报告
                      </Link>
                    )}
                    <Link
                      to={`/order/${order.id}`}
                      className="btn-secondary"
                    >
                      详情
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无订单</h3>
          <p className="text-gray-500 mb-6">您还没有购买任何球探报告</p>
          <Link to="/reports" className="btn-primary">
            浏览报告
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
