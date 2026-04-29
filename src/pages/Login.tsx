import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

type UserRole = 'user' | 'analyst' | 'admin' | 'club' | 'coach' | 'scout';

// 演示账号配置 - 与后端 cmd/seed_demo_v2 和当前演示库保持一致
// 密码统一为 123456
// 最后更新: 2026-04-28

const TEST_ACCOUNTS = {
  // 管理员
  admin: {
    phone: '13800000001',
    password: '123456',
    name: '平台管理员',
    role: 'admin' as UserRole,
    avatar: 'https://ui-avatars.com/api/?name=管理员&background=34495E&color=fff&size=200'
  },
  // 俱乐部 (2个)
  clubs: [
    { phone: '13800000010', password: '123456', name: '上海绿地青训俱乐部', role: 'club' as UserRole, subtitle: '主演示俱乐部', avatar: 'https://ui-avatars.com/api/?name=绿地青训&background=2ECC71&color=fff&size=200' },
    { phone: '13800000011', password: '123456', name: '北京晨星足球学院', role: 'club' as UserRole, subtitle: '跨区域对照俱乐部', avatar: 'https://ui-avatars.com/api/?name=晨星足球&background=27AE60&color=fff&size=200' },
  ],
  // 教练 (3个)
  coaches: [
    { phone: '13800000020', password: '123456', name: '王振宇', role: 'coach' as UserRole, teams: 'U12精英队', license: 'B级', avatar: 'https://ui-avatars.com/api/?name=王振宇&background=E74C3C&color=fff&size=200' },
    { phone: '13800000021', password: '123456', name: '李明轩', role: 'coach' as UserRole, teams: 'U12精英队', license: 'C级', avatar: 'https://ui-avatars.com/api/?name=李明轩&background=3498DB&color=fff&size=200' },
    { phone: '13800000022', password: '123456', name: '张凯', role: 'coach' as UserRole, teams: 'U14梯队', license: 'B级', avatar: 'https://ui-avatars.com/api/?name=张凯&background=F39C12&color=fff&size=200' },
  ],
  // 分析师 (4个)
  analysts: [
    { phone: '13800000030', password: '123456', name: '陈知远', role: 'analyst' as UserRole, specialty: '已分配/处理中订单', completed: 2, avatar: 'https://ui-avatars.com/api/?name=陈知远&background=667EEA&color=fff&size=200' },
    { phone: '13800000031', password: '123456', name: '林若然', role: 'analyst' as UserRole, specialty: '战术分析', completed: 1, avatar: 'https://ui-avatars.com/api/?name=林若然&background=764BA2&color=fff&size=200' },
    { phone: '13800000032', password: '123456', name: '周启航', role: 'analyst' as UserRole, specialty: '视频分析', completed: 0, avatar: 'https://ui-avatars.com/api/?name=周启航&background=F093FB&color=fff&size=200' },
    { phone: '13800000033', password: '123456', name: '吴嘉宁', role: 'analyst' as UserRole, specialty: '潜力评估', completed: 1, avatar: 'https://ui-avatars.com/api/?name=吴嘉宁&background=4FACFE&color=fff&size=200' },
  ],
  // 球探 (2个)
  scouts: [
    { phone: '13800000024', password: '123456', name: '赵云帆', role: 'scout' as UserRole, region: '华东', reports: 3, following: 3, avatar: 'https://ui-avatars.com/api/?name=赵云帆&background=11998E&color=fff&size=200' },
    { phone: '13800000025', password: '123456', name: '陈立青', role: 'scout' as UserRole, region: '华北', reports: 1, following: 1, avatar: 'https://ui-avatars.com/api/?name=陈立青&background=38EF7D&color=fff&size=200' },
  ],
  // 球员 (12个)
  players: [
    { phone: '13800002001', password: '123456', name: '林子墨', role: 'user' as UserRole, team: 'U12精英队', position: '边锋', jersey: 7, avatar: 'https://ui-avatars.com/api/?name=林子墨&background=FF6B6B&color=fff&size=200' },
    { phone: '13800002002', password: '123456', name: '周宇航', role: 'user' as UserRole, team: 'U12精英队', position: '中场', jersey: 10, avatar: 'https://ui-avatars.com/api/?name=周宇航&background=4ECDC4&color=fff&size=200' },
    { phone: '13800002003', password: '123456', name: '陈奕辰', role: 'user' as UserRole, team: 'U12精英队', position: '前锋', jersey: 9, avatar: 'https://ui-avatars.com/api/?name=陈奕辰&background=45B7D1&color=fff&size=200' },
    { phone: '13800002004', password: '123456', name: '王浩然', role: 'user' as UserRole, team: 'U12精英队', position: '后卫', jersey: 5, avatar: 'https://ui-avatars.com/api/?name=王浩然&background=96CEB4&color=fff&size=200' },
    { phone: '13800002005', password: '123456', name: '赵一诺', role: 'user' as UserRole, team: 'U12精英队', position: '中场', jersey: 8, avatar: 'https://ui-avatars.com/api/?name=赵一诺&background=FFEAA7&color=333&size=200' },
    { phone: '13800002006', password: '123456', name: '刘景行', role: 'user' as UserRole, team: 'U12精英队', position: '门将', jersey: 1, avatar: 'https://ui-avatars.com/api/?name=刘景行&background=DDA0DD&color=fff&size=200' },
    { phone: '13800002007', password: '123456', name: '孙嘉树', role: 'user' as UserRole, team: 'U14梯队', position: '中后卫', jersey: 4, avatar: 'https://ui-avatars.com/api/?name=孙嘉树&background=98D8C8&color=fff&size=200' },
    { phone: '13800002008', password: '123456', name: '吴承泽', role: 'user' as UserRole, team: 'U14梯队', position: '边后卫', jersey: 3, avatar: 'https://ui-avatars.com/api/?name=吴承泽&background=F7DC6F&color=333&size=200' },
    { phone: '13800002009', password: '123456', name: '黄睿哲', role: 'user' as UserRole, team: 'U14梯队', position: '后腰', jersey: 6, avatar: 'https://ui-avatars.com/api/?name=黄睿哲&background=A29BFE&color=fff&size=200' },
    { phone: '13800002010', password: '123456', name: '郑思远', role: 'user' as UserRole, team: 'U14梯队', position: '前锋', jersey: 11, avatar: 'https://ui-avatars.com/api/?name=郑思远&background=55EFC4&color=333&size=200' },
    { phone: '13800002011', password: '123456', name: '马若琳', role: 'user' as UserRole, team: 'U14梯队', position: '前腰', jersey: 18, avatar: 'https://ui-avatars.com/api/?name=马若琳&background=FAB1A0&color=333&size=200' },
    { phone: '13800002012', password: '123456', name: '何景天', role: 'user' as UserRole, team: 'U14梯队', position: '门将', jersey: 12, avatar: 'https://ui-avatars.com/api/?name=何景天&background=74B9FF&color=fff&size=200' },
  ],
};

const DEMO_ACCOUNT_COUNT =
  1 +
  TEST_ACCOUNTS.clubs.length +
  TEST_ACCOUNTS.coaches.length +
  TEST_ACCOUNTS.analysts.length +
  TEST_ACCOUNTS.scouts.length +
  TEST_ACCOUNTS.players.length;

type LoginErrorBody = {
  error?: string | { message?: string };
  message?: string;
};

const getLoginErrorMessage = (err: unknown, fallback = '登录失败') => {
  const responseData = (err as { response?: { data?: LoginErrorBody } })?.response?.data;
  if (typeof responseData?.error === 'string') return responseData.error;
  if (typeof responseData?.error?.message === 'string') return responseData.error.message;
  if (typeof responseData?.message === 'string') return responseData.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const Login: React.FC = () => {
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
  const quickLogin = async (phone: string, pwd: string) => {
    setLoadingDemo(phone);
    setError('');
    try {
      // 调用后端API登录
      const response = await authApi.login({ phone, password: pwd });
      const resData = response.data;
      if (resData && resData.success && resData.data) {
        const { token, user } = resData.data;
        setAuth(user, token);
        navigate(getRoleRedirectPath(user.current_role || user.currentRole || user.role));
      } else {
        const message = typeof resData?.error === 'string' ? resData.error : resData?.error?.message;
        throw new Error(message || '登录失败');
      }
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err, '演示账号登录失败，请确认后端服务和演示数据可用'));
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
        const message = typeof resData?.error === 'string' ? resData.error : resData?.error?.message;
        throw new Error(message || '登录失败');
      }

      const { token, user } = resData.data;
      setAuth(user, token);

      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
        return;
      }

      navigate(getRoleRedirectPath(user.role || 'user'));
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
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
              {showAllAccounts ? '收起' : '展开'}测试账号（共{DEMO_ACCOUNT_COUNT}个）
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
                    onClick={() => quickLogin(TEST_ACCOUNTS.admin.phone, TEST_ACCOUNTS.admin.password)}
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
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.clubs.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-sm font-medium">{acc.name}</div>
                          <div className="text-slate-400 text-[11px]">{acc.subtitle}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{acc.phone.slice(-4)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 教练 */}
                <div className="bg-orange-50 rounded-xl p-3">
                  <h4 className="text-orange-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">教</span>
                    教练 ({TEST_ACCOUNTS.coaches.length}人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.coaches.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password)}
                        disabled={loadingDemo === acc.phone}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-white rounded-lg border border-slate-200 hover:border-orange-400 transition-all disabled:opacity-60"
                      >
                        <img src={acc.avatar} alt="" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 text-left">
                          <div className="text-[#5f6368] text-xs font-medium">{acc.name}</div>
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
                    分析师 ({TEST_ACCOUNTS.analysts.length}人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.analysts.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password)}
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
                    球探 ({TEST_ACCOUNTS.scouts.length}人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.scouts.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password)}
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
                    球员 ({TEST_ACCOUNTS.players.length}人)
                  </h4>
                  <div className="space-y-1.5">
                    {TEST_ACCOUNTS.players.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => quickLogin(acc.phone, acc.password)}
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
