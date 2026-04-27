import React, { useEffect, useState } from 'react';
import { clubApi } from '../../services/api';
import {
  Crown, Zap, Users, Activity, HardDrive, ChevronLeft,
  Check, AlertCircle, ArrowRight, Shield, BarChart3, FileText,
  type LucideIcon
} from 'lucide-react';

interface MemberCenterProps {
  onBack: () => void;
}

interface ClubProfile {
  id: number;
  name: string;
  logo?: string;
  memberLevel: 'free' | 'basic' | 'professional' | 'enterprise';
  memberExpireDate?: string;
  freePhysicalTestQuota: number;
  playerCount?: number;
}

interface DashboardData {
  overview: {
    totalPlayers: number;
    totalPhysicalTests: number;
  };
  memberInfo: {
    level: string;
    quotaUsed: number;
    quotaLimit: number;
    expireDate?: string;
  };
}

const levelMap: Record<string, { label: string; color: string; bg: string; icon: LucideIcon; desc: string }> = {
  free: {
    label: '免费版',
    color: 'text-gray-300',
    bg: 'from-gray-600 to-gray-700',
    icon: Shield,
    desc: '适合个人或小规模体验'
  },
  basic: {
    label: '基础版',
    color: 'text-blue-400',
    bg: 'from-blue-500 to-blue-700',
    icon: Zap,
    desc: '适合中小型青训俱乐部'
  },
  professional: {
    label: '专业版',
    color: 'text-purple-400',
    bg: 'from-purple-500 to-purple-700',
    icon: Crown,
    desc: '适合专业青训机构'
  },
  enterprise: {
    label: '企业版',
    color: 'text-amber-400',
    bg: 'from-amber-500 to-amber-700',
    icon: Crown,
    desc: '适合大型俱乐部集团'
  },
};

const planConfig = {
  free: {
    price: '¥0',
    playerLimit: 30,
    testQuota: 10,
    storageGB: 5,
    features: ['球员管理', '基础体测', '周报系统', '比赛总结'],
    disabled: ['数据分析', '选材决策台', '训练计划', '财务中心', 'PDF 导出'],
  },
  basic: {
    price: '¥299/月',
    playerLimit: 100,
    testQuota: 50,
    storageGB: 50,
    features: ['球员管理', '基础体测', '周报系统', '比赛总结', '数据分析', '训练计划'],
    disabled: ['选材决策台', '财务中心', 'PDF 导出'],
  },
  professional: {
    price: '¥799/月',
    playerLimit: 300,
    testQuota: 200,
    storageGB: 200,
    features: ['球员管理', '高级体测', '周报系统', '比赛总结', '数据分析', '选材决策台', '训练计划', '赛程日历', 'PDF 导出'],
    disabled: ['财务中心（部分）'],
  },
  enterprise: {
    price: '定制',
    playerLimit: '不限',
    testQuota: '不限',
    storageGB: '不限',
    features: ['全部功能', '专属客服', '定制开发', '数据对接', 'SLA 保障'],
    disabled: [],
  },
};

const MemberCenter: React.FC<MemberCenterProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, dashboardRes] = await Promise.all([
        clubApi.getProfile(),
        clubApi.getDashboard(),
      ]);
      if (profileRes.data?.success && profileRes.data.data) {
        setProfile(profileRes.data.data);
      }
      if (dashboardRes.data?.success && dashboardRes.data.data) {
        setDashboard(dashboardRes.data.data);
      }
    } catch (err) {
      console.error('加载会员中心数据失败:', err);
    }
    setLoading(false);
  };

  const currentLevel = profile?.memberLevel || 'free';
  const levelInfo = levelMap[currentLevel] || levelMap.free;
  const plan = planConfig[currentLevel];

  const totalPlayers = dashboard?.overview?.totalPlayers || profile?.playerCount || 0;
  const totalTests = dashboard?.overview?.totalPhysicalTests || 0;
  const testQuota = dashboard?.memberInfo?.quotaLimit || profile?.freePhysicalTestQuota || plan.testQuota;
  const playerLimit = typeof plan.playerLimit === 'number' ? plan.playerLimit : 99999;

  const playerPercent = Math.min(100, Math.round((totalPlayers / playerLimit) * 100));
  const testPercent = Math.min(100, Math.round((totalTests / testQuota) * 100));
  // 存储空间模拟：按球员数 * 50MB 估算
  const usedStorageMB = totalPlayers * 50 + totalTests * 20;
  const storageLimitGB = typeof plan.storageGB === 'number' ? plan.storageGB : 99999;
  const storagePercent = Math.min(100, Math.round((usedStorageMB / (storageLimitGB * 1024)) * 100));

  const isNearLimit = (percent: number) => percent >= 80;
  const isOverLimit = (percent: number) => percent >= 100;

  const ProgressBar = ({ label, used, limit, percent, icon: Icon, unit }: { label: string; used: number; limit: number; percent: number; icon: LucideIcon; unit: string }) => {
    const near = isNearLimit(percent);
    const over = isOverLimit(percent);
    return (
      <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${near ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-medium">{label}</div>
              <div className="text-sm text-gray-400">{used} / {limit} {unit}</div>
            </div>
          </div>
          {over && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">已超配</span>}
          {near && !over && <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">即将用完</span>}
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <div className="bg-[#1a1f2e] border-b border-gray-800 px-8 py-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">会员中心</h1>
            <p className="text-gray-400 mt-1">管理俱乐部会员等级与使用配额</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {loading ? (
          <div className="space-y-8">
            <div className="h-48 bg-gray-800 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : (
          <>
            {/* 当前等级卡片 */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${levelInfo.bg} p-8 text-white`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <levelInfo.icon className="w-8 h-8" />
                    <span className="text-lg opacity-90">当前等级</span>
                  </div>
                  <div className="text-4xl font-bold mb-2">{levelInfo.label}</div>
                  <p className="text-white/80 max-w-md">{levelInfo.desc}</p>
                  {profile?.memberExpireDate && profile.memberExpireDate !== '0001-01-01' && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl text-sm">
                      <AlertCircle className="w-4 h-4" />
                      有效期至：{profile.memberExpireDate}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  {currentLevel !== 'enterprise' && (
                    <button className="mt-4 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                      升级套餐 <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 配额看板 */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> 配额使用
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressBar
                  label="在籍球员"
                  used={totalPlayers}
                  limit={plan.playerLimit}
                  percent={playerPercent}
                  icon={Users}
                  unit="人"
                />
                <ProgressBar
                  label="体测活动"
                  used={totalTests}
                  limit={testQuota}
                  percent={testPercent}
                  icon={Activity}
                  unit="次"
                />
                <ProgressBar
                  label="存储空间"
                  used={(usedStorageMB / 1024).toFixed(1)}
                  limit={plan.storageGB}
                  percent={storagePercent}
                  icon={HardDrive}
                  unit="GB"
                />
              </div>
            </div>

            {/* 等级对比 */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> 套餐对比
              </h2>
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-800 bg-[#0f1419]">
                        <th className="px-6 py-4 text-left text-gray-400 font-medium">权益</th>
                        {Object.entries(levelMap).map(([key, info]) => (
                          <th key={key} className={`px-6 py-4 text-center font-semibold ${currentLevel === key ? info.color : 'text-gray-300'}`}>
                            <div className="flex flex-col items-center gap-1">
                              <info.icon className="w-5 h-5" />
                              {info.label}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-gray-800">
                        <td className="px-6 py-4 text-gray-400">价格</td>
                        {Object.keys(levelMap).map(key => (
                          <td key={key} className={`px-6 py-4 text-center ${currentLevel === key ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {planConfig[key as keyof typeof planConfig].price}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-6 py-4 text-gray-400">球员上限</td>
                        {Object.keys(levelMap).map(key => (
                          <td key={key} className={`px-6 py-4 text-center ${currentLevel === key ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {planConfig[key as keyof typeof planConfig].playerLimit}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-6 py-4 text-gray-400">体测配额</td>
                        {Object.keys(levelMap).map(key => (
                          <td key={key} className={`px-6 py-4 text-center ${currentLevel === key ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {planConfig[key as keyof typeof planConfig].testQuota}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="px-6 py-4 text-gray-400">存储空间</td>
                        {Object.keys(levelMap).map(key => (
                          <td key={key} className={`px-6 py-4 text-center ${currentLevel === key ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {planConfig[key as keyof typeof planConfig].storageGB} GB
                          </td>
                        ))}
                      </tr>
                      {['球员管理', '基础体测', '周报系统', '比赛总结', '数据分析', '选材决策台', '训练计划', '赛程日历', 'PDF 导出', '财务中心'].map((feature, idx) => (
                        <tr key={feature} className={idx % 2 === 0 ? 'bg-[#0f1419]/30' : ''}>
                          <td className="px-6 py-3 text-gray-300">{feature}</td>
                          {Object.keys(levelMap).map(key => {
                            const cfg = planConfig[key as keyof typeof planConfig];
                            const hasFeature = cfg.features.some(f => feature.includes(f.replace(/高级|基础/g, '')) || f.includes(feature));
                            const disabled = cfg.disabled.some(d => feature.includes(d.replace('（部分）', '')) || d.includes(feature));
                            const included = hasFeature && !disabled;
                            return (
                              <td key={key} className="px-6 py-3 text-center">
                                {included ? (
                                  <Check className={`w-5 h-5 mx-auto ${currentLevel === key ? 'text-emerald-400' : 'text-emerald-500/60'}`} />
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 联系升级 */}
            {currentLevel !== 'enterprise' && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">需要更多配额或定制功能？</h3>
                  <p className="text-gray-400">联系我们获取企业版专属方案，享受一对一实施服务。</p>
                </div>
                <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors whitespace-nowrap">
                  联系销售
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemberCenter;
