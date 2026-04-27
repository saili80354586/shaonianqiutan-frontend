import React from 'react';
import VideoUploader from '../components/VideoUploader';

const VideoAnalysis: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary">
      <div className="pt-[72px] pb-10 px-4">
        {/* Page Header */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            专业视频分析服务
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            上传您的比赛视频，由三位资深分析师联合评估，获得专业的球探报告
          </p>
        </div>

        {/* Service Features */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">专业团队</h3>
              <p className="text-white/60 text-sm">亚足联A级教练+留洋球员+退役职业球员</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">7大维度评估</h3>
              <p className="text-white/60 text-sm">技术、战术、身体、心理、位置、建议、潜力</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">24-48小时交付</h3>
              <p className="text-white/60 text-sm">快速响应，专业报告，详细视频分析</p>
            </div>
          </div>
        </div>

        {/* Video Uploader Component */}
        <VideoUploader />

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">常见问题</h2>
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">什么样的视频适合分析？</h3>
              <p className="text-white/70">
                建议选择包含完整比赛片段的视频，时长5-15分钟为宜。视频应清晰展示球员的技术动作、跑位和比赛表现。避免使用过于模糊或抖动严重的视频。
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">分析报告包含哪些内容？</h3>
              <p className="text-white/70">
                报告包含7大维度的专业评估：技术能力（传球、射门、盘带等）、战术意识（跑位、决策等）、身体素质（速度、力量等）、心理状态、位置适配性、针对性提升建议、潜力评级。同时包含关键片段标注和视频解说。
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">分析师的资质如何？</h3>
              <p className="text-white/70">
                我们的分析师团队由三部分组成：亚足联A级教练员负责青训标准制定和训练方向判断；俄罗斯职业俱乐部留洋球员提供实战视角和海外经验；中超退役职业球员+亚足联B级教练员提供国内青训体系洞察和俱乐部资源对接。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;