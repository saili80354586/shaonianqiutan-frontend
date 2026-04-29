import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, QrCode, Wallet, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { orderApi, paymentApi } from '../services/api';

const OrderPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams<{ id: string }>();
  const orderId = searchParams.get('orderId') || routeOrderId;
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'balance'>('wechat');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orderLoadError, setOrderLoadError] = useState('');
  const [countdown, setCountdown] = useState(900); // 15分钟
  const [payStatus, setPayStatus] = useState<'idle' | 'paying' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    loadOrder();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setOrderLoadError('');
      const res = await orderApi.getOrderDetail(Number(orderId));
      const loadedOrder = res.data?.data?.order || res.data?.order;
      if (!res.data?.success || !loadedOrder?.id) {
        throw new Error(res.data?.error?.message || '订单加载失败');
      }
      setOrder(loadedOrder);
    } catch (error: any) {
      setOrderLoadError(error?.response?.data?.error?.message || error?.message || '订单加载失败，请返回订单详情重试');
    }
  };

  useEffect(() => {
    if (payStatus === 'paying') {
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            setPayStatus('failed');
            setErrorMsg('支付超时，请重新发起支付');
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const res = await paymentApi.getOrderPaymentStatus(Number(orderId));
          const status = res.data?.data;
          if (status?.is_paid) setPayStatus('success');
        } catch {
          // 保持等待状态，由倒计时兜底
        }
      }, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payStatus]);

  useEffect(() => {
    if (payStatus === 'success') {
      setTimeout(() => {
        navigate(`/order-success?orderId=${orderId}`);
      }, 1500);
    }
  }, [payStatus, orderId, navigate]);

  const handlePay = async () => {
    setLoading(true);
    setPayStatus('paying');
    try {
      if (!import.meta.env.DEV) {
        throw new Error('生产支付通道尚未接入，请等待平台开通真实支付后继续。');
      }

      // 调用后端模拟支付 API
      const res = await paymentApi.simulatePay({
        order_id: Number(orderId),
        payment_method: paymentMethod,
      });
      if (res.data?.success) {
        setPayStatus('success');
      } else {
        setErrorMsg(res.data?.error?.message || res.data?.message || '支付失败');
        setPayStatus('failed');
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || '支付发起失败，请重试');
      setPayStatus('failed');
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (orderLoadError) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">订单加载失败</h1>
          <p className="text-gray-400 mb-6">{orderLoadError}</p>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            返回用户中心
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 返回
        </button>

        {/* 订单信息卡片 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">订单支付</h1>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span className={countdown < 60 ? 'text-red-400' : ''}>剩余 {formatTime(countdown)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">订单编号</span>
              <span className="text-white font-mono">{order.order_no || order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">分析师</span>
              <span className="text-white">{order.analyst?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">球员姓名</span>
              <span className="text-white">{order.player_name || order.playerName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">服务类型</span>
              <span className="text-white">{order.order_type === 'video' || order.order_type === 'pro' ? '视频解析版' : '专业文字版'}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-400">应付金额</span>
            <span className="text-2xl font-bold text-emerald-400">¥{order.amount}</span>
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">选择支付方式</h2>
          <div className="space-y-3">
            {[
              { key: 'wechat', label: '微信支付', icon: QrCode, desc: '扫码支付，安全快捷' },
              { key: 'alipay', label: '支付宝', icon: CreditCard, desc: '扫码支付，支持花呗' },
              { key: 'balance', label: '余额支付', icon: Wallet, desc: '当前余额 ¥0.00' },
            ].map(({ key, label, icon: Icon, desc }) => (
              <label
                key={key}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === key
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-gray-700 hover:border-gray-600 bg-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={key}
                  checked={paymentMethod === key}
                  onChange={() => setPaymentMethod(key as any)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div className={`p-2 rounded-lg ${paymentMethod === key ? 'bg-emerald-500/20' : 'bg-gray-800'}`}>
                  <Icon className={`w-5 h-5 ${paymentMethod === key ? 'text-emerald-400' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{label}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 二维码 / 支付按钮 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 text-center">
          {payStatus === 'idle' && (
            <>
              {paymentMethod === 'balance' ? (
                <div className="mb-4">
                  <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
                  <p className="text-gray-400">余额不足，请充值或选择其他支付方式</p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="w-48 h-48 mx-auto bg-white rounded-xl p-3 mb-4">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-gray-800" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫一扫</p>
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={loading || paymentMethod === 'balance'}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {paymentMethod === 'balance' ? '余额不足' : `确认支付 ¥${order.amount}`}
              </button>
            </>
          )}

          {payStatus === 'paying' && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-white font-medium">正在等待支付结果...</p>
              <p className="text-gray-400 text-sm mt-1">请勿关闭页面</p>
            </div>
          )}

          {payStatus === 'success' && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-medium">支付成功！</p>
              <p className="text-gray-400 text-sm mt-1">正在跳转...</p>
            </div>
          )}

          {payStatus === 'failed' && (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-medium">支付失败</p>
              <p className="text-red-400 text-sm mt-1">{errorMsg}</p>
              <button
                onClick={() => setPayStatus('idle')}
                className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                重新支付
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPayment;
