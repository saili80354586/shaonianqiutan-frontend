import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, FileText, Mail } from 'lucide-react';

const AnalystApplySuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-20 px-4">
      <div className="max-w-[600px] mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-primary mb-3">
            申请提交成功！
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            感谢您的申请，我们已收到您的分析师入驻申请
          </p>

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

          {/* Next Steps */}
          <div className="text-left bg-[#2d5a3d]/5 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-primary mb-4">接下来会发生什么？</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">1</span>
                <span>我们的审核团队将仔细审查您的申请资料</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">2</span>
                <span>审核通过后，您将收到通知并可以登录分析师工作台</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#2d5a3d] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">3</span>
                <span>完成平台培训后即可开始接单</span>
              </li>
            </ol>
          </div>

          {/* Contact */}
          <p className="text-sm text-slate-500 mb-8">
            如有疑问，请联系客服：<span className="text-[#4ade80] font-semibold">400-888-8888</span>
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/" 
              className="flex-1 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-all text-center"
            >
              返回首页
            </Link>
            <Link 
              to="/become-analyst" 
              className="flex-1 py-4 bg-slate-100 text-primary rounded-xl font-semibold hover:bg-slate-200 transition-all text-center"
            >
              了解更多
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystApplySuccess;
