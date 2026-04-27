import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 检查默认管理员账号
    if (username === 'admin' && password === 'admin123') {
      const user = {
        id: 1,
        username: 'admin',
        role: 'admin' as const,
        phone: 'admin',
        name: '管理员',
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuth(user, 'demo-token-admin');
      navigate('/admin/dashboard');
      return;
    }

    setError('用户名或密码错误');
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
          <h1 className="text-primary text-2xl font-bold mb-2">管理员登录</h1>
          <p className="text-text-muted text-sm">管理后台系统</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-5">
            <label className="block text-primary font-semibold mb-2 text-sm">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入管理员账号"
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
          <p className="m-0">默认账号：admin / admin123</p>
        </div>

        <div className="mt-6 flex justify-between text-sm">
          <Link to="/" className="text-accent no-underline hover:underline">
            ← 返回首页
          </Link>
          <Link to="/analyst/login" className="text-accent no-underline hover:underline">
            分析师登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
