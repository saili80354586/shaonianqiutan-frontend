import React from 'react';
import { Clock, CreditCard, FileText, CheckCircle, XCircle } from 'lucide-react';
// 内联类型定义
type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  title: string;
  status: OrderStatus;
  price: number;
  createdAt: string;
  analystName?: string;
  videoUrl?: string;
}

interface OrderTimelineProps {
  order: Order;
}

interface TimelineStep {
  status: Order['status'];
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: '待支付',
      description: '订单已创建，等待支付',
      icon: <Clock size={20} />,
      isActive: order.status === 'pending',
      isCompleted: ['paid', 'processing', 'completed'].includes(order.status),
    },
    {
      status: 'paid',
      label: '已支付',
      description: '支付成功，等待分析师接单',
      icon: <CreditCard size={20} />,
      isActive: order.status === 'paid',
      isCompleted: ['processing', 'completed'].includes(order.status),
    },
    {
      status: 'processing',
      label: '分析中',
      description: '分析师正在处理您的视频',
      icon: <FileText size={20} />,
      isActive: order.status === 'processing',
      isCompleted: order.status === 'completed',
    },
    {
      status: 'completed',
      label: '已完成',
      description: '分析报告已生成，可下载查看',
      icon: <CheckCircle size={20} />,
      isActive: order.status === 'completed',
      isCompleted: order.status === 'completed',
    },
  ];

  // 如果是已取消订单，显示特殊状态
  if (order.status === 'cancelled') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle size={24} />
          <div>
            <p className="font-semibold">订单已取消</p>
            <p className="text-sm text-red-400/70">该订单已被取消，无法继续处理</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
        <Clock size={18} className="text-[#39ff14]" />
        订单进度
      </h3>
      
      <div className="relative">
        {/* 连接线 */}
        <div className="absolute left-[19px] top-[30px] bottom-[30px] w-[2px] bg-gray-700"></div>
        
        {/* 步骤 */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.status} className="relative flex items-start gap-4">
              {/* 图标 */}
              <div className={`
                relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${step.isActive 
                  ? 'bg-[#39ff14] border-[#39ff14] text-[#0a0e17] shadow-lg shadow-[#39ff14]/30' 
                  : step.isCompleted 
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-gray-800 border-gray-600 text-gray-500'
                }
              `}>
                {step.isCompleted && !step.isActive ? (
                  <CheckCircle size={20} />
                ) : (
                  step.icon
                )}
              </div>
              
              {/* 内容 */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`
                    font-semibold transition-colors
                    ${step.isActive ? 'text-[#39ff14]' : step.isCompleted ? 'text-green-400' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </h4>
                  {step.isActive && (
                    <span className="px-2 py-0.5 bg-[#39ff14]/20 text-[#39ff14] text-xs rounded-full">
                      当前
                    </span>
                  )}
                </div>
                <p className={`text-sm ${step.isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
