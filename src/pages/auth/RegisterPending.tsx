import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, CheckCircle, FileText, Mail, Phone, Shield, AlertCircle } from 'lucide-react';

interface LocationState {
  role?: 'analyst' | 'club' | 'coach';
  nickname?: string;
  applicationId?: string;
}

const RegisterPending: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const role = state?.role || 'analyst';
  const nickname = state?.nickname || '申请者';
  const [fallbackApplicationId] = useState(() => 'SA' + Date.now().toString().slice(-8));
  const applicationId = state?.applicationId || fallbackApplicationId;

  const roleConfig = {
    analyst: {
      icon: '📊',
      title: '视频分析师',
      applicationType: '分析师入驻申请',
      checkItems: [
        '职业背景与从业经历',
        '足球专业知识水平',
        '案例分析能力',
        '联系方式真实性',
      ],
      requirements: [
        '具备足球教练证书或相关资质',
        '有青少年足球培训或分析经验',
        '能够使用平台分析工具',
        '保持良好的职业操守',
      ],
    },
    club: {
      icon: '🏟️',
      title: '足球俱乐部',
      applicationType: '俱乐部认证申请',
      checkItems: [
        '营业执照真实性',
        '俱乐部运营资质',
        '联系人身份验证',
        '球队规模与实力评估',
      ],
      requirements: [
        '具备合法注册的企业资质',
        '拥有稳定的球员梯队',
        '有专业的教练团队',
        '遵守平台合作协议',
      ],
    },
    coach: {
      icon: '👨‍🏫',
      title: '教练员',
      applicationType: '教练员认证申请',
      checkItems: [
        '执教资格证书',
        '执教经历验证',
        '专业背景审核',
        '联系方式真实性',
      ],
      requirements: [
        '持有有效的教练资格证书',
        '具备一定的执教经验',
        '熟悉青少年足球培训',
        '能够定期跟踪球员进展',
      ],
    },
  };

  const config = roleConfig[role];

  // 审核进度步骤
  const progressSteps = [
    { status: 'completed', label: '提交申请', time: '刚刚' },
    { status: 'active', label: '资料审核', time: '预计1-2天' },
    { status: 'pending', label: '资质验证', time: '预计2-3天' },
    { status: 'pending', label: '审核完成', time: '预计3-5天' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-20 px-4">
      <div className="max-w-[700px] mx-auto">
        {/* Pending Card */}
        <div className="bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center">
          {/* Pending Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="w-12 h-12 text-white" />
          </div>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full mb-4">
            <span className="text-2xl">{config.icon}</span>
            <span className="text-orange-600 font-semibold">{config.title}</span>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-3">
            申请已提交，等待审核
          </h1>
          <p className="text-xl text-[#2d5a3d] font-medium mb-2">
            感谢您的申请，{nickname}！
          </p>
          <p className="text-slate-500 text-lg mb-6">
            我们正在认真审核您的{config.title}入驻申请
          </p>

          {/* Application ID */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg mb-8">
            <span className="text-slate-500">申请编号：</span>
            <span className="font-mono font-semibold text-primary">{applicationId}</span>
          </div>

          {/* Progress Timeline */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-primary mb-4 text-left">审核进度</h3>
            <div className="flex justify-between items-start">
              {progressSteps.map((step, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : step.status === 'active'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === 'active' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  {/* Step Label */}
                  <span className={`text-sm font-medium ${
                    step.status === 'pending' ? 'text-slate-400' : 'text-primary'
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">{step.time}</span>
                  {/* Connector Line */}
                  {index < progressSteps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      step.status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                    }`} style={{ transform: 'translateX(50%)' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-[#4ade80]" />
              </div>
              <h4 className="font-semibold text-primary mb-1">审核周期</h4>
              <p className="text-sm text-slate-500">3-5个工作日</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#4ade80]" />
              </div>
              <h4 className="font-semibold text-primary mb-1">审核内容</h4>
              <p className="text-sm text-slate-500">资质与经验验证</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-[#4ade80]" />
              </div>
              <h4 className="font-semibold text-primary mb-1">结果通知</h4>
              <p className="text-sm text-slate-500">短信/邮件通知</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 my-8"></div>

          {/* What We Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-[#2d5a3d]/5 rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#4ade80]" />
                审核要点
              </h3>
              <ul className="space-y-2">
                {config.checkItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#2d5a3d]/5 rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#4ade80]" />
                入驻要求
              </h3>
              <ul className="space-y-2">
                {config.requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              接下来会发生什么？
            </h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">1</span>
                <span>我们的审核团队将在1-2个工作日内进行初步资料审查</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">2</span>
                <span>资质验证阶段可能需要您提供补充材料，请保持电话畅通</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">3</span>
                <span>审核通过后，您将收到短信通知并可以登录对应工作台</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">4</span>
                <span>首次登录请完成平台培训，即可正式开始使用</span>
              </li>
            </ol>
          </div>

          {/* Contact */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-primary mb-4">需要帮助？</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a href="tel:400-888-8888" className="flex items-center gap-2 text-slate-600 hover:text-[#4ade80] transition-colors">
                <Phone className="w-5 h-5" />
                <span>客服热线：400-888-8888</span>
              </a>
              <a href="mailto:support@shaonianqiutan.com" className="flex items-center gap-2 text-slate-600 hover:text-[#4ade80] transition-colors">
                <Mail className="w-5 h-5" />
                <span>邮箱：support@shaonianqiutan.com</span>
              </a>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              工作时间：周一至周五 9:00-18:00
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/" 
              className="flex-1 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-all text-center"
            >
              返回首页
            </Link>
            <Link 
              to="/login" 
              className="flex-1 py-4 bg-slate-100 text-primary rounded-xl font-semibold hover:bg-slate-200 transition-all text-center"
            >
              去登录
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>申请编号：{applicationId} | 提交时间：{new Date().toLocaleString('zh-CN')}</p>
          <p className="mt-2">请保存好申请编号以便查询进度</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPending;
