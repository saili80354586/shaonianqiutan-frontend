import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { CheckCircle, FileText, Clock, ArrowRight, Home, Loader2, Upload, UserCheck } from 'lucide-react';
import { orderApi } from '../services/api';

function AnimatedCheck() {
  const canvasRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = canvasRef.current;
    if (!svg) return;
    const circle = svg.querySelector('.check-circle') as SVGCircleElement;
    const check = svg.querySelector('.check-path') as SVGPathElement;
    if (!circle || !check) return;

    // Circle stroke animation
    circle.style.strokeDasharray = '200';
    circle.style.strokeDashoffset = '200';
    circle.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.2s';

    // Check draw animation
    check.style.strokeDasharray = '50';
    check.style.strokeDashoffset = '50';
    check.style.transition = 'stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.9s';

    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = '0';
      check.style.strokeDashoffset = '0';
    });
  }, []);

  return (
    <svg ref={canvasRef} className="w-24 h-24" viewBox="0 0 100 100">
      {/* Outer ring */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="2" />
      {/* Animated circle */}
      <circle
        className="check-circle"
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      {/* Check mark */}
      <path
        className="check-path"
        d="M30 52 L45 67 L72 37"
        fill="none"
        stroke="#34d399"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseRing({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
      style={{
        animation: `pulse-expand 2s ease-out ${delay}ms infinite`,
      }}
    />
  );
}

function FadeInUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
      transition: `opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`,
    }}>
      {children}
    </div>
  );
}

const OrderSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams<{ id: string }>();
  const orderId = searchParams.get('orderId') || routeOrderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderApi.getOrderDetail(Number(orderId));
      const loadedOrder = res.data?.data?.order || res.data?.order;
      if (!res.data?.success || !loadedOrder?.id) {
        throw new Error(res.data?.error?.message || '订单加载失败');
      }
      setOrder(loadedOrder);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error?.message || error?.message || '订单加载失败，请返回用户中心查看');
    }
    setLoading(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1a1f2e] rounded-2xl border border-white/10 p-6 text-center">
          <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">订单加载失败</h1>
          <p className="text-gray-400 mb-6">{loadError}</p>
          <Link
            to="/user-dashboard"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium transition-all flex items-center justify-center"
          >
            返回用户中心
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const packageName =
    order.order_type === 'pro'
      ? '视频解析版'
      : order.order_type === 'basic'
      ? '专业文字版'
      : '专业分析服务';

  const timelineSteps = [
    { icon: CheckCircle, label: '已支付', color: 'text-emerald-400', done: true },
    { icon: Upload, label: '待上传', color: 'text-amber-400', done: false },
    { icon: UserCheck, label: '分析中', color: 'text-gray-400', done: false },
    { icon: FileText, label: '报告生成', color: 'text-gray-400', done: false },
  ];

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Animated check + rings */}
        <FadeInUp delay={0} className="flex justify-center mb-6 relative">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <PulseRing delay={0} />
            <PulseRing delay={600} />
            <PulseRing delay={1200} />
            <AnimatedCheck />
          </div>
        </FadeInUp>

        {/* Text content */}
        <FadeInUp delay={200}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">支付成功！</h1>
            <p className="text-gray-400">订单已确认，请上传需要分析的比赛视频</p>
          </div>
        </FadeInUp>

        {/* Order info card */}
        <FadeInUp delay={300}>
          <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 p-5 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">订单编号</span>
              <span className="text-white font-mono">{order.order_no || order.orderNo}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">服务套餐</span>
              <span className="text-white">{packageName}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-400">支付金额</span>
              <span className="text-emerald-400 font-bold text-lg">¥{order.amount}</span>
            </div>
          </div>
        </FadeInUp>

        {/* Timeline */}
        <FadeInUp delay={400}>
          <div className="flex items-center justify-between mb-8 px-2">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                      step.done
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'bg-white/5 border-2 border-white/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                    <span className={`text-xs font-medium ${step.done ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition-colors duration-700 ${
                      step.done ? 'bg-emerald-400/50' : 'bg-white/10'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </FadeInUp>

        {/* Action buttons */}
        <FadeInUp delay={500}>
          <div className="space-y-3">
            <Link
              to={`/order/${orderId}/upload`}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              立即上传视频
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              to={`/order/${orderId}`}
              className="w-full py-3 bg-[#1a1f2e] hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:border-white/20"
            >
              查看订单详情
            </Link>
            <Link
              to="/"
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:text-white"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </div>
        </FadeInUp>

        <FadeInUp delay={600}>
          <p className="mt-6 text-xs text-gray-500 text-center">
            分析师将在您上传视频后开始分析，{order.order_type === 'pro' ? '5-7' : '3-5'}个工作日内交付报告
          </p>
        </FadeInUp>
      </div>

      <style>{`
        @keyframes pulse-expand {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;
