import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AnalystLogin: React.FC = () => {
  const [contact, setContact] = useState('analyst1');
  const [password, setPassword] = useState('analyst123');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 检查默认分析师账号
    if (contact === 'analyst1' && password === 'analyst123') {
      const user = {
        id: 0,
        username: 'analyst1',
        role: 'analyst' as const,
        roles: [{ type: 'analyst', status: 'active' as const }],
        phone: 'analyst1',
        name: '示例分析师',
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuth(user, 'demo-token-analyst');
      navigate('/analyst/dashboard');
      return;
    }

    // 检查已注册并通过审核的分析师
    const applications = JSON.parse(localStorage.getItem('analystApplications') || '[]');
    const approvedAnalyst = applications.find((a: any) => 
      a.status === 'approved' && 
      a.contact === contact && 
      a.password === password
    );

    if (approvedAnalyst) {
      const user = {
        id: parseInt(approvedAnalyst.id) || 0,
        username: approvedAnalyst.contact,
        role: 'analyst' as const,
        roles: [{ type: 'analyst', status: 'active' as const }],
        phone: approvedAnalyst.contact,
        name: approvedAnalyst.name,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuth(user, 'demo-token-analyst');
      navigate('/analyst/dashboard');
    } else {
      // 检查是否在审核中
      const pendingAnalyst = applications.find((a: any) => 
        a.contact === contact && 
        a.status === 'pending'
      );
      
      if (pendingAnalyst) {
        setError('您的申请正在审核中，请耐心等待');
      } else {
        setError('用户名或密码错误，或账号未通过审核');
      }
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-gradient-to-br from-secondary to-primary min-h-screen flex items-center justify-center pt-[72px] pb-10 px-5">
      <div className="w-full max-w-[420px] bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-8">
          <img 
            src="/images/logo-official.png" 
            alt="少年球探" 
            className="h-[60px] mx-auto mb-4 object-contain"
          />
          <h1 className="text-primary text-2xl font-bold mb-2">分析师登录</h1>
          <p className="text-text-muted text-sm">分析师工作台</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-5">
            <label className="block text-primary font-semibold mb-2 text-sm">联系方式</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="请输入注册时的手机号或邮箱"
              required
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="mb-5">
            <label className="block text-primary font-semibold mb-2 text-sm">密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors pr-14"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-xl text-text-muted p-1 hover:text-primary transition-colors"
              >
                {showPassword ? '👁' : '👁'}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-accent"
              />
              <span>记住我</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-white border-none py-4 rounded-xl text-lg font-semibold cursor-pointer transition-all hover:bg-accent-light mt-2.5"
          >
            登录
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <p className="m-0">默认账号：analyst1 / analyst123</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link to="/" className="text-accent no-underline hover:underline">
            ← 返回首页
          </Link>
          <div className="flex justify-center gap-3">
            <Link to="/analyst/register" className="text-accent no-underline hover:underline">
              申请入驻
            </Link>
            <span className="text-text-muted">|</span>
            <Link to="/admin/login" className="text-accent no-underline hover:underline">
              管理员登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystLogin;
