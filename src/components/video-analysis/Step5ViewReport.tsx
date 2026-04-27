import React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  Star,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  Home,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step5ViewReportProps {
  orderData: any;
}

// 模拟报告数据
const mockReportData = {
  overallScore: 82,
  technicalScores: [
    { name: '传球', score: 85, fullMark: 100 },
    { name: '盘带', score: 78, fullMark: 100 },
    { name: '射门', score: 82, fullMark: 100 },
    { name: '防守', score: 75, fullMark: 100 },
    { name: '速度', score: 88, fullMark: 100 },
    { name: '体能', score: 80, fullMark: 100 },
  ],
  strengths: [
    '传球准确率高，视野开阔',
    '速度优势明显，反击中表现突出',
    '跑位意识好，能创造空间',
  ],
  weaknesses: [
    '体能需要加强，比赛后半段表现下降',
    '防守意识有待提高',
    '射门精度需要进一步训练',
  ],
  suggestions: [
    '建议加强核心力量训练，提升身体对抗能力',
    '多参与防守训练，提高整体战术意识',
    '增加射门练习，提高把握机会能力',
    '建议参加更多高水平比赛积累经验',
  ],
  potential: 'A',
  analystComment:
    '该球员展现出良好的技术基础和比赛意识。速度快、传球准确是主要优势。建议重点提升体能储备和防守能力，未来发展潜力巨大。',
};

const Step5ViewReport: React.FC<Step5ViewReportProps> = ({ orderData }) => {
  const navigate = useNavigate();

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
          <Star className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">报告已生成</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">查看报告</h2>
        <p className="text-slate-400">您的专业球探报告已生成</p>
      </motion.div>

      {/* Report Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
      >
        {/* Report Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">球员技术评估报告</h3>
          <p className="text-white/80">
            {orderData?.analystInfo?.name || '分析师'} · {new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Overall Score */}
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-700"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-emerald-500"
                    initial={{ strokeDasharray: '0 351.86' }}
                    animate={{
                      strokeDasharray: `${(mockReportData.overallScore / 100) * 351.86} 351.86`,
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {mockReportData.overallScore}
                  </span>
                  <span className="text-slate-400 text-sm">综合评分</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Scores */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              技术评分
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mockReportData.technicalScores.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700/30"
                >
                  <p className="text-slate-400 text-sm mb-2">{item.name}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${getScoreBg(item.score)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ delay: 0.2 * index, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                优势
              </h4>
              <ul className="space-y-2">
                {mockReportData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
              <h4 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                待提升
              </h4>
              <ul className="space-y-2">
                {mockReportData.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-orange-400 mt-0.5">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Analyst Comment */}
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              分析师点评
            </h4>
            <p className="text-slate-300 leading-relaxed">
              {mockReportData.analystComment}
            </p>
          </div>

          {/* Suggestions */}
          <div>
            <h4 className="text-white font-semibold mb-3">提升建议</h4>
            <div className="space-y-3">
              {mockReportData.suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{suggestion}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Potential Rating */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl border border-emerald-500/20">
            <span className="text-slate-400">潜力评级</span>
            <span className="text-3xl font-bold text-emerald-400">
              {mockReportData.potential}
            </span>
            <span className="text-slate-400">级</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-slate-900/30 border-t border-slate-700/30">
          <button
            onClick={() => {}}
            className="flex-1 px-6 py-3 border border-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载 PDF
          </button>
          <button
            onClick={() => {}}
            className="flex-1 px-6 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            分享报告
          </button>
        </div>
      </motion.div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-4 pt-6"
      >
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          返回首页
        </button>
      </motion.div>
    </div>
  );
};

export default Step5ViewReport;
