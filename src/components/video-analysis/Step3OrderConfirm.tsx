import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileVideo,
  User,
  Award,
  CreditCard,
  CheckCircle,
  Shield,
  Lock,
} from 'lucide-react';

interface Step3OrderConfirmProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  orderData: any;
}

const paymentMethods = [
  {
    id: 'wechat',
    name: '微信支付',
    icon: '💚',
    description: '推荐使用微信支付',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'alipay',
    name: '支付宝',
    icon: '💙',
    description: '支付宝快捷支付',
    color: 'from-blue-500 to-blue-600',
  },
];

const Step3OrderConfirm: React.FC<Step3OrderConfirmProps> = ({
  onNext,
  onPrev,
  orderData,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<string>('wechat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPositionLabel = (value: string): string => {
    const positions: Record<string, string> = {
      GK: '门将',
      LB: '左边后卫',
      CB: '中后卫',
      RB: '右边后卫',
      CDM: '防守型中场',
      CM: '中场',
      CAM: '攻击型中场',
      LM: '左边前卫',
      RM: '右边前卫',
      LW: '左边锋',
      RW: '右边锋',
      ST: '前锋',
    };
    return positions[value] || value;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // 模拟支付处理
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const orderResult = {
      orderId: `ORD${Date.now()}`,
      paymentMethod: selectedPayment,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };
    
    setIsSubmitting(false);
    onNext(orderResult);
  };

  const analystInfo = orderData?.analystInfo;
  const playerInfo = orderData?.playerInfo;
  const videos = orderData?.videos || [];
  const totalPrice = analystInfo?.price || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">确认订单信息</h2>
        <p className="text-slate-400">请核对订单详情，选择支付方式完成订单</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Analyst Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              已选择的分析师
            </h3>
            {analystInfo && (
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {analystInfo.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg">{analystInfo.name}</h4>
                  <p className="text-slate-400">{analystInfo.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white">{analystInfo.rating}</span>
                    <span className="text-slate-500">({analystInfo.reviewCount}条评价)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">¥{analystInfo.price}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Video & Player Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileVideo className="w-5 h-5 text-emerald-400" />
              视频与球员信息
            </h3>

            {/* Videos */}
            <div className="space-y-3 mb-5">
              {videos.map((video: any, index: number) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/30"
                >
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-400 font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{video.name}</p>
                    <p className="text-slate-500 text-sm">{formatFileSize(video.size)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Player Info */}
            {playerInfo && (
              <div className="pt-4 border-t border-slate-700/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">球员姓名：</span>
                    <span className="text-white font-medium">{playerInfo.playerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">场上位置：</span>
                    <span className="text-white font-medium">
                      {getPositionLabel(playerInfo.playerPosition)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">球衣颜色：</span>
                    <span className="text-white font-medium">{playerInfo.jerseyColor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">球衣号码：</span>
                    <span className="text-white font-medium">{playerInfo.jerseyNumber}</span>
                  </div>
                  {playerInfo.matchName && (
                    <div className="col-span-2">
                      <span className="text-slate-500">比赛名称：</span>
                      <span className="text-white">{playerInfo.matchName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Payment */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 lg:sticky lg:top-24"
          >
            <h3 className="text-lg font-semibold text-white mb-4">订单金额</h3>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-slate-400">
                <span>分析报告费用</span>
                <span className="text-white">¥{totalPrice}</span>
              </div>
              <div className="border-t border-slate-700/50 pt-3 flex justify-between items-center">
                <span className="text-white font-bold text-lg">应付总额</span>
                <span className="text-2xl font-bold text-emerald-400">¥{totalPrice}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-5">
              <p className="text-sm text-slate-400 font-medium">选择支付方式</p>
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPayment === method.id
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-xl`}
                  >
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{method.name}</p>
                    <p className="text-xs text-slate-500">{method.description}</p>
                  </div>
                  {selectedPayment === method.id && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </label>
              ))}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl mb-5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                支付信息已加密保护
              </span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  确认支付 ¥{totalPrice}
                  <ChevronRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between pt-6 border-t border-slate-700/50 lg:hidden"
      >
        <button
          onClick={onPrev}
          className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          上一步
        </button>
      </motion.div>

      {/* Desktop Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:flex items-center justify-between pt-6 border-t border-slate-700/50"
      >
        <button
          onClick={onPrev}
          className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          上一步
        </button>
      </motion.div>
    </div>
  );
};

export default Step3OrderConfirm;
