import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, User, Compass, Zap } from 'lucide-react';

interface LocationState {
  role?: 'player' | 'analyst' | 'club' | 'coach';
  nickname?: string;
}

const RegisterSuccess: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const role = state?.role || 'player';
  const nickname = state?.nickname || '新用户';

  const roleConfig = {
    player: {
      icon: '🏃',
      title: '球员',
      welcomeMessage: `欢迎加入少年球探，${nickname}！`,
      description: '您的球员账号已创建成功，可以开始使用平台的所有功能',
    },
    analyst: {
      icon: '📊',
      title: '分析师',
      welcomeMessage: `欢迎加入少年球探，${nickname}！`,
      description: '您的分析师申请已提交，请耐心等待审核',
    },
    club: {
      icon: '🏟️',
      title: '俱乐部',
      welcomeMessage: `欢迎加入少年球探！`,
      description: '您的俱乐部认证已提交，请耐心等待审核',
    },
    coach: {
      icon: '👨‍🏫',
      title: '教练员',
      welcomeMessage: `欢迎加入少年球探，${nickname}！`,
      description: '您的教练认证已提交，请耐心等待审核',
    },
  };

  const config = roleConfig[role];

  // 快捷入口配置
  const quickActions = [
    {
      icon: User,
      title: '完善资料',
      description: '补充更多个人信息',
      link: '/user-dashboard/profile',
      color: 'from-blue-400 to-blue-500',
    },
    {
      icon: Compass,
      title: '探索平台',
      description: '了解平台功能',
      link: '/',
      color: 'from-green-400 to-green-500',
    },
    {
      icon: Zap,
      title: '立即体验',
      description: '开始使用核心功能',
      link: role === 'player' ? '/video-analysis' : '/',
      color: 'from-orange-400 to-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-20 px-4">
      <div className="max-w-[700px] mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d5a3d]/10 rounded-full mb-4">
            <span className="text-2xl">{config.icon}</span>
            <span className="text-[#2d5a3d] font-semibold">{config.title}账号</span>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-3">
            注册成功！
          </h1>
          <p className="text-xl text-[#2d5a3d] font-medium mb-2">
            {config.welcomeMessage}
          </p>
          <p className="text-slate-500 text-lg mb-8">
            {config.description}
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group bg-slate-50 rounded-xl p-5 text-center hover:bg-[#2d5a3d]/5 transition-all hover:shadow-md"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-primary mb-1">{action.title}</h4>
                <p className="text-sm text-slate-500">{action.description}</p>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 my-8"></div>

          {/* Features Preview */}
          <div className="text-left bg-[#2d5a3d]/5 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <span className="text-xl">🎉</span>
              您现在可以：
            </h3>
            <ul className="space-y-3 text-slate-600">
              {role === 'player' && (
                <>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>上传比赛视频，获取专业分析报告</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>查看球探报告，了解自身优劣势</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>建立成长档案，追踪进步轨迹</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>在球探地图上展示自己，获得更多关注</span>
                  </li>
                </>
              )}
              {role === 'analyst' && (
                <>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>审核通过后可在平台上接单</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>使用专业视频分析工具</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>生成标准化球探报告</span>
                  </li>
                </>
              )}
              {role === 'club' && (
                <>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>认证通过后管理旗下球员</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>批量下单视频分析服务</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>查看团队数据分析报告</span>
                  </li>
                </>
              )}
              {role === 'coach' && (
                <>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>认证通过后关注您的球员</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>基于报告给出训练建议</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full"></span>
                    <span>跟踪球员成长进度</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>小贴士：</strong>
                {role === 'player' 
                  ? '完善个人资料可以让分析师更好地了解您，生成更精准的分析报告。' 
                  : '我们会在3-5个工作日内完成审核，请保持手机畅通以便接收通知。'}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/login" 
              className="flex-1 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-all text-center"
            >
              立即登录
            </Link>
            <Link 
              to="/" 
              className="flex-1 py-4 bg-slate-100 text-primary rounded-xl font-semibold hover:bg-slate-200 transition-all text-center"
            >
              返回首页
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>遇到问题？</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/help" className="hover:text-white transition-colors">帮助中心</Link>
            <span>|</span>
            <a href="tel:400-888-8888" className="hover:text-white transition-colors">联系客服</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;
