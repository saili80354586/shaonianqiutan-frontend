import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

type UserRole = 'user' | 'analyst' | 'admin' | 'club' | 'coach' | 'scout';

// 测试账号配置 - 与后端 seed_v3_*.sql 保持一致
// 密码统一为 123456
// 最后更新: 2026-04-11

const TEST_ACCOUNTS = {
  // 管理员
  admin: {
    phone: '13800000001',
    password: '123456',
    name: '系统管理员',
    id: 1,
    role: 'admin' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=管理员&background=34495E&color=fff&size=200'
  },
  // 俱乐部
  club: {
    phone: '13800000010',
    password: '123456',
    name: '上海绿地管理员',
    id: 10,
    role: 'club' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=管理员&background=2ECC71&color=fff&size=200'
  },
  // 教练 (2个)
  coaches: [
    { phone: '13800000020', password: '123456', name: '王教练', id: 20, role: 'coach' as UserRole, teams: 'U12一队/U12二队', license: 'A级', avatar: 'https://ui-avatars.com/api/?name=王教练&background=E74C3C&color=fff&size=200' },
    { phone: '13800000021', password: '123456', name: '李教练', id: 21, role: 'coach' as UserRole, teams: 'U12二队', license: 'B级', avatar: 'https://ui-avatars.com/api/?name=李教练&background=3498DB&color=fff&size=200' },
  ],
  // 分析师 (4个)
  analysts: [
    { phone: '13800000030', password: '123456', name: '陈分析师', id: 30, role: 'analyst' as UserRole, specialty: '进攻分析', completed: 2, pending: 1, avatar: 'https://ui-avatars.com/api/?name=陈分析师&background=667EEA&color=fff&size=200' },
    { phone: '13800000031', password: '123456', name: '林分析师', id: 31, role: 'analyst' as UserRole, specialty: '防守分析', completed: 0, pending: 1, avatar: 'https://ui-avatars.com/api/?name=林分析师&background=764BA2&color=fff&size=200' },
    { phone: '13800000032', password: '123456', name: '周分析师', id: 32, role: 'analyst' as UserRole, specialty: '门将专项', completed: 0, pending: 0, avatar: 'https://ui-avatars.com/api/?name=周分析师&background=F093FB&color=fff&size=200' },
    { phone: '13800000033', password: '123456', name: '吴分析师', id: 33, role: 'analyst' as UserRole, specialty: '综合评估', completed: 1, pending: 0, avatar: 'https://ui-avatars.com/api/?name=吴分析师&background=4FACFE&color=fff&size=200' },
  ],
  // 球探 (2个)
  scouts: [
    { phone: '13800000024', password: '123456', name: '赵球探', id: 24, role: 'scout' as UserRole, region: '华东', reports: 3, following: 3, avatar: 'https://ui-avatars.com/api/?name=赵球探&background=11998E&color=fff&size=200' },
    { phone: '13800000025', password: '123456', name: '陈球探', id: 25, role: 'scout' as UserRole, region: '华北', reports: 1, following: 1, avatar: 'https://ui-avatars.com/api/?name=陈球探&background=38EF7D&color=fff&size=200' },
  ],
  // 球员 (8个) - U12一队4人 + U12二队4人
  players: [
    { phone: '13800002001', password: '123456', name: '王小明', id: 2001, role: 'user' as UserRole, team: 'U12一队', position: '前锋', jersey: 9, avatar: 'https://ui-avatars.com/api/?name=王小明&background=FF6B6B&color=fff&size=200' },
    { phone: '13800002002', password: '123456', name: '李小强', id: 2002, role: 'user' as UserRole, team: 'U12一队', position: '中场', jersey: 8, avatar: 'https://ui-avatars.com/api/?name=李小强&background=4ECDC4&color=fff&size=200' },
    { phone: '13800002003', password: '123456', name: '张小刚', id: 2003, role: 'user' as UserRole, team: 'U12一队', position: '后卫', jersey: 4, avatar: 'https://ui-avatars.com/api/?name=张小刚&background=45B7D1&color=fff&size=200' },
    { phone: '13800002004', password: '123456', name: '刘小军', id: 2004, role: 'user' as UserRole, team: 'U12一队', position: '门将', jersey: 1, avatar: 'https://ui-avatars.com/api/?name=刘小军&background=96CEB4&color=fff&size=200' },
    { phone: '13800002005', password: '123456', name: '陈小龙', id: 2005, role: 'user' as UserRole, team: 'U12二队', position: '前锋', jersey: 11, avatar: 'https://ui-avatars.com/api/?name=陈小龙&background=FFEAA7&color=333&size=200' },
    { phone: '13800002006', password: '123456', name: '赵小虎', id: 2006, role: 'user' as UserRole, team: 'U12二队', position: '中场', jersey: 6, avatar: 'https://ui-avatars.com/api/?name=赵小虎&background=DDA0DD&color=fff&size=200' },
    { phone: '13800002007', password: '123456', name: '孙小杰', id: 2007, role: 'user' as UserRole, team: 'U12二队', position: '后卫', jersey: 3, avatar: 'https://ui-avatars.com/api/?name=孙小杰&background=98D8C8&color=fff&size=200' },
    { phone: '13800002008', password: '123456', name: '周小鹏', id: 2008, role: 'user' as UserRole, team: 'U12二队', position: '门将', jersey: 22, avatar: 'https://ui-avatars.com/api/?name=周小鹏&background=F7DC6F&color=333&size=200' },
  ],
};

const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // 检查是否有重定向
  useEffect(() => {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      // 保留重定向信息
    }
  }, []);

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
  };

  // 获取角色跳转路径
  const getRoleRedirectPath = (userRole: string) => {
    switch (userRole) {
      case 'admin': return '/admin/dashboard';
      case 'analyst': return '/analyst/dashboard';
      case 'club': return '/club/dashboard';
      case 'coach': return '/coach/dashboard';
      case 'scout': return '/scout/dashboard';
      default: return '/user-dashboard';
    }
  };

  // 点击演示账号一键登录
  const quickLogin = async (phone: string, pwd: string, userId: number, name: string, userRole: string) => {
    setLoadingDemo(phone);
    setError('');
    try {
      // 调用后端API登录
      const response = await authApi.login({ phone, password: pwd });
      const resData = response.data;
      if (resData && resData.success && resData.data) {
        const { token, user } = resData.data;
        localStorage.setItem('token', token);
        setAuth(user, token);
        localStorage.setItem('currentUser', JSON.stringify({
          username: user.nickname || user.name,
          role: user.role,
          userId: user.id,
          token: token,
          name: user.name || user.nickname,
          phone: user.phone,
          loginTime: new Date().toISOString()
        }));
        navigate(getRoleRedirectPath(user.role));
      } else {
        throw new Error(resData?.error?.message || resData?.error || '登录失败');
      }
    } catch (err: any) {
      // 后端登录失败，使用本地mock登录
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockToken = `mock_token_${userRole}_${Date.now()}`;
      const user = { id: userId, name, nickname: name, phone, role: userRole, roles: [{ type: userRole, status: 'active' as const }] };
      localStorage.setItem('token', mockToken);
      setAuth(user, mockToken);
      localStorage.setItem('currentUser', JSON.stringify({
        username: name,
        role: userRole,
        userId: userId,
        token: mockToken,
        name: name,
        phone: phone,
        loginTime: new Date().toISOString()
      }));
      navigate(getRoleRedirectPath(userRole));
    } finally {
      setLoadingDemo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ phone: username, password });
      const resData = response.data;
      if (!resData?.success || !resData?.data) {
        throw new Error(resData?.error || '登录失败');
      }

      const { token, user } = resData.data;
      localStorage.setItem('token', token);
      setAuth(user, token);
      localStorage.setItem('currentUser', JSON.stringify({
        username: user.nickname || user.name,
        role: user.role || role,
        userId: user.id,
        token: token,
        name: user.name || user.nickname,
        phone: user.phone,
        loginTime: new Date().toISOString()
      }));

      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
        return;
      }

      navigate(getRoleRedirectPath(user.role || role));
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-[72px] pb-10 px-5"
      style={{ background: 'linear-gradient(135deg, #1a2332 0%, #0f1419 100%)' }}
    >
      <div className="w-full max-w-[480px] bg-white rounded-[20px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-6">
          <img 
            src="/images/logo-official.png" 
            alt="少年球探" 
            className="h-[50px] mx-auto mb-3 object-contain"
          />
          <h1 className="text-[#0f1419] text-xl font-bold mb-1">欢迎回来</h1>
          <p className="text-[#9aa0a6] text-xs">点击下方账号即可快速登录测试</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label className="block text-[#0f1419] font-semibold mb-1.5 text-sm">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-[#0f1419] placeholder:text-slate-400 focus:outline-none focus:border-[#4a90d9] transition-colors"
            />
          </div>
          <div className="mb-3">
            <label className="block text-[#0f1419] font-semibold mb-1.5 text-sm">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-[#0f1419] placeholder:text-slate-400 focus:outline-none focus:border-[#4a90d9] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4a90d9] text-white border-none py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-[#6ba3e0] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4a90d9]/30"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="flex justify-between text-xs mb-4">
          <Link to="/register" className="text-[#4a90d9] no-underline hover:underline">注册新账号</Link>
          <Link to="/forgot-password" className="text-[#4a90d9] no-underline hover:underline">忘记密码？</Link>
        </div>

        {/* 测试账号区域 */}
        {import.meta.env.DEV && (
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowAllAccounts(!showAllAccounts)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllAccounts ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {showAllAccounts ? '收起' : '展开'}测试账号（共18个）
            </button>

            {showAllAccounts && (
              <div className="space-y-3 max-h-[450px] overflow-y-auto mt-2 pr-1">
                {/* 管理员 */}
                <div className="bg-slate-100 rounded-xl p-3">
                  <h4 className="text-slate-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-600 text-white text-[10px] flex items-center justify-center">管</span>
                    管理员
                  </h4>
                  <button
                    onClick={() => quickLogin(TEST_ACCOUNTS.admin.phone, TEST_ACCOUNTS.admin.password, TEST_ACCOUNTS.admin.id, TEST_ACCOUNTS.admin.name, TEST_ACCOUNTS.admin.role)}
                    disabled={loadingDemo === TEST_ACCOUNTS.admin.phone}
                    className="w-full flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-all disabled:opacity-60"
                  >
                    <img src={TEST_ACCOUNTS.admin.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 text-left">
                      <div className="text-[#5f6368] text-sm font-medium">{TEST_ACCOUNTS.admin.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{TEST_ACCOUNTS.admin.phone}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">123456</span>
                  </button>
                </div>

                {/* 俱乐部 */}
                <div className="bg-green-50 rounded-xl p-3">
                  <h4 className="text-green-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">俱</span>
                    俱乐部
                  </h4>
                  <button
                    onClick={() => quickLogin(TEST_ACCOUNTS.club.phone, TEST_ACCOUNTS.club.password, TEST_ACCOUNTS.club.id, TEST_ACCOUNTS.club.name, TEST_ACCOUNTS.club.role)}
                    disabled={loadingDemo === TEST_ACCOUNTS.club.phone}
                    className="w-full flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-all disabled:opacity-60"
                  >
                    <img src={TEST_ACCOUNTS.club.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 text-left">
                      <div className="text-[#5f6368] text-sm font-medium">{TEST_ACCOUNTS.club.name}</div>
                      <div className="text-slate-400 text-[11px]">上海绿地青训俱乐部</div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">123456</span>
                  </button>
                </div>

                {/* 教练 */}
                <div className="bg-orange-50 rounded-xl p-3">
                  <h4 className="text-orange-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">教</span>
                    教练 (2人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.coaches.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password, acc.id, acc.name, acc.role)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-white rounded-lg border border-slate-200 hover:border-orange-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-xs font-medium">{acc.name} <span className="text-slate-400 text-[10px] ml-1">#{acc.id}</span></div>
                          <div className="text-slate-400 text-[10px]">{acc.teams} · {acc.license}级执照</div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{acc.phone.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分析师 */}
                <div className="bg-purple-50 rounded-xl p-3">
                  <h4 className="text-purple-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center">析</span>
                    分析师 (4人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.analysts.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password, acc.id, acc.name, acc.role)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-white rounded-lg border border-slate-200 hover:border-purple-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-xs font-medium">{acc.name}</div>
                          <div className="text-slate-400 text-[10px]">{acc.specialty} · 已完成{acc.completed}单</div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{acc.phone.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 球探 */}
                <div className="bg-teal-50 rounded-xl p-3">
                  <h4 className="text-teal-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center">探</span>
                    球探 (2人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.scouts.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password, acc.id, acc.name, acc.role)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-white rounded-lg border border-slate-200 hover:border-teal-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-xs font-medium">{acc.name}</div>
                          <div className="text-slate-400 text-[10px]">{acc.region} · {acc.reports}份报告</div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{acc.phone.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 球员 */}
                <div className="bg-rose-50 rounded-xl p-3">
                  <h4 className="text-rose-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">球</span>
                    球员 (8人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.players.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password, acc.id, acc.name, acc.role)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-white rounded-lg border border-slate-200 hover:border-rose-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-xs font-medium">{acc.name}</div>
                          <div className="text-slate-400 text-[10px]">{acc.team} · {acc.position} · #{acc.jersey}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{acc.phone.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
