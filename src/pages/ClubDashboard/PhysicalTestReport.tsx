import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, BarChart3, TrendingUp, Award, Target, Loader2 } from 'lucide-react';

interface Report {
  playerName: string;
  age: number;
  position: string;
  testDate: string;
  overallRating: string;
  percentile: number;
  testData: Record<string, { value: number; unit: string; percentile: number; rating: string }>;
  strengths: string[];
  improvements: string[];
  trainingSuggestions: string[];
}

interface PhysicalTestReportProps {
  testId: number | null;
  onBack: () => void;
}

const PhysicalTestReport: React.FC<PhysicalTestReportProps> = ({ testId, onBack }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 体测个人报告 API 待对接，当前显示空状态
    setLoading(false);
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">体测报告</h2>
          <p className="text-gray-400">体测个人报告功能正在开发中，敬请期待</p>
          <button onClick={onBack} className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="max-w-4xl mx-auto p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />返回
        </button>

        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">青少年体能评估报告</h1>
                <p className="opacity-80">少年球探 × 上海绿地青训俱乐部</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{report.percentile}%</div>
                <div className="opacity-80">综合百分位</div>
              </div>
            </div>
          </div>

          {/* 球员信息 */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {report.playerName[0]}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{report.playerName}</div>
                <div className="text-gray-400">U12梯队 · {report.position} · {report.age}岁</div>
                <div className="text-gray-400 text-sm">体测日期：{report.testDate}</div>
              </div>
              <div className="ml-auto">
                <span className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-lg font-semibold">
                  {report.overallRating}
                </span>
              </div>
            </div>
          </div>

          {/* 体测数据 */}
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />本次体测数据
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(report.testData).map(([key, data]) => (
                <div key={key} className="bg-[#0f1419] rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">{key === 'sprint30m' ? '30米跑' : key === 'shuttleRun' ? '折返跑' : key === 'standingLongJump' ? '立定跳远' : key === 'sitAndReach' ? '坐位体前屈' : key}</div>
                  <div className="text-2xl font-bold text-white">{data.value}<span className="text-sm text-gray-400 ml-1">{data.unit}</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${data.percentile >= 75 ? 'text-emerald-400' : data.percentile >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
                      前{data.percentile}%
                    </span>
                    <span className="text-xs text-gray-500">|</span>
                    <span className={`text-xs ${data.rating === '优秀' ? 'text-emerald-400' : data.rating === '良好' ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {data.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 优势与待提升 */}
          <div className="p-6 border-b border-gray-800">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2"><Award className="w-5 h-5" />优势项目</h4>
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-emerald-400">•</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2"><Target className="w-5 h-5" />待提升项目</h4>
                <ul className="space-y-2">
                  {report.improvements.map((s, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-yellow-400">•</span>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* 训练建议 */}
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />个性化训练建议</h3>
            <div className="space-y-3">
              {report.trainingSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#0f1419] rounded-xl">
                  <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">{i + 1}</span>
                  <span className="text-gray-300">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">报告生成时间：{report.testDate}</div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">
                <Share2 className="w-4 h-4" />分享
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
                <Download className="w-4 h-4" />导出PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicalTestReport;
