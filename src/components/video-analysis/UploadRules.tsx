import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

const UploadRules: React.FC = () => {
  const rules = [
    {
      icon: <span className="text-emerald-400 font-bold">1</span>,
      text: '一个订单最多可上传5个视频，最好是同一场连续比赛',
      type: 'normal' as const,
    },
    {
      icon: <span className="text-emerald-400 font-bold">2</span>,
      text: '比赛视频总时长不超过60分钟',
      type: 'normal' as const,
    },
    {
      icon: <span className="text-emerald-400 font-bold">3</span>,
      text: '视频必须清晰、稳定，建议高位视角拍摄，设备建议摄像机、Xbot运动云台',
      type: 'normal' as const,
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      text: '拒绝手持拍摄、低角度拍摄、竖屏拍摄的视频',
      type: 'reject' as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-white">上传视频规则</h3>
      </div>

      {/* Rules List */}
      <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/30">
        <ul className="space-y-4">
          {rules.map((rule, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700">
                {rule.icon}
              </div>
              <span
                className={`text-sm leading-relaxed ${
                  rule.type === 'reject'
                    ? 'text-red-300'
                    : 'text-slate-300'
                }`}
              >
                {rule.type === 'reject' && (
                  <strong className="text-red-400 mr-1">拒绝</strong>
                )}
                {rule.text}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Tip */}
        <div className="mt-5 pt-4 border-t border-slate-700/30 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            符合上述要求的视频将获得更准确的分析结果和更快的处理速度
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadRules;
