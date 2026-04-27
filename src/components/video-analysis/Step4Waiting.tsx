import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Clock, FileText, ChevronRight, Loader2 } from 'lucide-react';

interface Step4WaitingProps {
  onNext: () => void;
  orderData: any;
}

const Step4Waiting: React.FC<Step4WaitingProps> = ({ onNext, orderData }) => {
  const [estimatedTime, setEstimatedTime] = useState(24 * 60 * 60); // 24小时倒计时
  const [progress, setProgress] = useState(0);

  // 模拟进度增长
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + Math.random() * 2;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setEstimatedTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">等待分析</h2>
        <p className="text-slate-400">分析师正在进行专业分析，请耐心等待</p>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center"
      >
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Pulse Animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
          
          {/* Main Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <h3 className="text-xl font-bold text-white mb-2">分析进行中...</h3>
        <p className="text-slate-400 mb-6">分析师正在仔细分析您的比赛视频</p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{Math.round(progress)}%</p>
        </div>

        {/* Estimated Time */}
        <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">预计完成时间</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatTime(estimatedTime)}</p>
        </div>
      </motion.div>

      {/* Order Info Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">订单信息</h3>
        
        <div className="space-y-4">
          {/* Analyst */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold">
                  {orderData?.analystInfo?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{orderData?.analystInfo?.name || '分析师'}</p>
                <p className="text-slate-400 text-sm">{orderData?.analystInfo?.title || ''}</p>
              </div>
            </div>
            <span className="text-emerald-400 font-semibold">
              ¥{orderData?.analystInfo?.price || 0}
            </span>
          </div>

          {/* Videos */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">视频文件</p>
                <p className="text-slate-400 text-sm">
                  {orderData?.videos?.length || 0} 个视频
                </p>
              </div>
            </div>
          </div>

          {/* Player */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {orderData?.playerInfo?.playerName || '球员'}
                </p>
                <p className="text-slate-400 text-sm">
                  号码 {orderData?.playerInfo?.jerseyNumber || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Development Mode Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <button
          onClick={onNext}
          className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-medium transition-colors text-sm"
        >
          开发模式：跳过等待，直接查看报告
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </motion.div>
    </div>
  );
};

export default Step4Waiting;
