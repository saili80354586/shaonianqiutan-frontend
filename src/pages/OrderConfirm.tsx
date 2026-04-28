import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Shield,
  CreditCard,
  Gift,
  ChevronRight,
  AlertCircle,
  Lock,
  FileText,
  Video,
  Clock,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { orderApi, paymentApi } from '../services/api';

interface PackageInfo {
  code: 'basic' | 'pro';
  name: string;
  price: number;
  features: string[];
  deliveryDays: string;
  hasVideoEdit: boolean;
}

const packages: PackageInfo[] = [
  {
    code: 'basic',
    name: '专业文字版',
    price: 299,
    features: ['5000字专业分析报告', '20项维度逐项评分', '技术特点深度解析', '同龄对比与发展潜力评估', '个性化训练建议方案', 'PDF格式专业报告'],
    deliveryDays: '3-5个工作日',
    hasVideoEdit: false,
  },
  {
    code: 'pro',
    name: '视频解析版',
    price: 799,
    features: ['包含文字版全部内容', '5-10分钟专业分析视频', '画面标注与战术标线', '高光时刻精选剪辑', '关键镜头逐帧解析', '专家画外音专业讲解'],
    deliveryDays: '5-7个工作日',
    hasVideoEdit: true,
  },
];

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: '/icons/wechat-pay.svg', description: '推荐使用微信支付' },
  { id: 'alipay', name: '支付宝', icon: '/icons/alipay.svg', description: '支付宝快捷支付' },
];

function FadeInUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
    }}>
      {children}
    </div>
  );
}

const OrderConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const packageCode = searchParams.get('package') as 'basic' | 'pro' | null;
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('wechat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/order-confirm?package=${packageCode || ''}`);
      navigate('/login');
      return;
    }
    if (!packageCode || !packages.some((p) => p.code === packageCode)) {
      navigate('/package-select');
      return;
    }
    setPkg(packages.find((p) => p.code === packageCode) || null);
  }, [isAuthenticated, packageCode, navigate]);

  const handleSubmitOrder = async () => {
    if (!agreedToTerms) {
      alert('请先同意服务条款和隐私政策');
      return;
    }
    if (!selectedPayment) {
      alert('请选择支付方式');
      return;
    }
    if (!pkg) {
      alert('套餐信息不完整，请返回重试');
      return;
    }

    setIsSubmitting(true);
    try {
      const createRes: any = await orderApi.createOrder({
        amount: pkg.price,
        payment_method: selectedPayment,
        order_type: pkg.code,
        video_url: '',
        video_filename: '',
        player_name: '',
        player_age: 0,
        player_position: '',
        match_name: '',
        video_duration: 0,
        remark: '',
      });

      if (!createRes.data?.success || !createRes.data?.data) {
        throw new Error(createRes.data?.error?.message || createRes.data?.message || '订单创建失败');
      }

      const createdOrder = createRes.data?.data?.order || createRes.data?.data;
      const orderId = createdOrder?.id;

      if (!orderId) {
        throw new Error('未获取到订单ID');
      }

      if (!import.meta.env.DEV) {
        alert('订单已创建，生产支付通道尚未接入，请等待平台开通真实支付后继续。');
        navigate(`/order/${orderId}`);
        return;
      }

      const payRes: any = await paymentApi.simulatePay({
        order_id: Number(orderId),
        payment_method: selectedPayment,
      });

      if (!payRes.data?.success) {
        throw new Error(payRes.data?.message || '支付失败');
      }

      navigate(`/order-success?orderId=${orderId}`);
    } catch (error: any) {
      console.error('Order creation error:', error);
      const backendMsg = error?.response?.data?.error?.message || error?.response?.data?.message;
      alert(backendMsg || error?.message || '订单创建或支付失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] to-[#0a0e17] pt-[72px] pb-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#39ff14] animate-spin mx-auto mb-4" />
          <p className="text-white">加载套餐信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pt-[80px] pb-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <FadeInUp className="text-center mb-8" delay={0}>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">确认订单信息</h1>
          <p className="text-white/60 text-lg">请核对订单详情，选择支付方式完成订单</p>
        </FadeInUp>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Package Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Card */}
            <FadeInUp delay={100}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors duration-300 overflow-hidden relative">
                {/* Gradient top border on card */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${pkg.code === 'pro' ? 'via-amber-400' : 'via-[#39ff14]' } to-transparent transition-opacity duration-500`} />

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{pkg.name}</h2>
                    <p className="text-white/50 text-sm">
                      {pkg.hasVideoEdit ? '视频+文字双维度深度分析' : '5000字专业文字分析报告'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#39ff14]">¥{pkg.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 animate-pulse" style={{ animationDuration: '3s' }} />
                    <span>{pkg.deliveryDays}交付</span>
                  </div>
                  {pkg.hasVideoEdit && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Video className="w-4 h-4" />
                      <span>含分析视频</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/10 mb-4" />

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.code === 'pro' ? 'text-amber-400' : 'text-[#39ff14]'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInUp>

            {/* Notice */}
            <FadeInUp delay={200}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors duration-300">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#39ff14]" />
                  下单须知
                </h3>
                <ul className="space-y-2 text-sm text-white/70">
                  {[
                    '支付成功后，请尽快上传需要分析的比赛视频并填写球员信息。',
                    '分析师由平台统一分配，分配后将在约定时间内完成分析。',
                    '报告生成后将推送通知，您可在用户中心随时查看和下载。',
                    '支付后未上传视频可申请取消订单，具体退款规则请咨询客服。',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#39ff14] mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInUp>
          </div>

          {/* Right Column: Price Summary & Payment */}
          <div className="space-y-6">
            <FadeInUp delay={150}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24 transition-all duration-300 hover:bg-white/[0.05]">
                <h2 className="text-lg font-bold text-white mb-4">订单金额</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-white/70">
                    <span>{pkg.name}</span>
                    <span className="font-medium">¥{pkg.price}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">应付总额</span>
                    <span className="text-2xl font-bold text-[#39ff14]">¥{pkg.price}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-white/50 font-medium">选择支付方式</p>
                  {paymentMethods.map((method, idx) => {
                    const isSelected = selectedPayment === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-[#39ff14] bg-[#39ff14]/5 scale-[1.02] shadow-[0_0_16px_rgba(57,255,20,0.15)]'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/[0.03]'
                        }`}
                        style={{ transitionDelay: `${idx * 80}ms` }}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'border-[#39ff14] bg-[#39ff14]' : 'border-white/30'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-700"
                        >
                          <span className="text-xs font-bold text-white">{method.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{method.name}</p>
                          <p className="text-xs text-white/50">{method.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-[#39ff14]" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Terms */}
                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`flex items-start gap-3 mb-4 cursor-pointer group transition-all duration-200 ${
                    agreedToTerms ? 'text-[#39ff14]/80' : 'text-white/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
                    agreedToTerms
                      ? 'bg-[#39ff14] border-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.3)]'
                      : 'border-white/30 group-hover:border-white/50'
                  }`}>
                    {agreedToTerms && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-xs leading-relaxed">
                    我已阅读并同意
                    <a href="/terms" className="text-[#39ff14] hover:underline ml-0.5">《服务条款》</a>
                    和
                    <a href="/privacy" className="text-[#39ff14] hover:underline">《隐私政策》</a>
                  </span>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 mb-6 border border-emerald-500/20">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">支付信息已加密保护</span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={!agreedToTerms || isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative ${
                    agreedToTerms && !isSubmitting
                      ? 'bg-[#39ff14] text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] active:scale-[0.98]'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {/* Shimmer on enabled */}
                  {agreedToTerms && !isSubmitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
                  )}
                  <span className="relative flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        确认支付 ¥{pkg.price}
                        {agreedToTerms && <ChevronRight className="w-5 h-5" />}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </FadeInUp>
          </div>
        </div>
      </div>

      {/* Shimmer keyframe injected via style tag */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default OrderConfirm;
