import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, Calendar, Ruler, Weight, Footprints, Star, FileText, Phone, Lock, BarChart3, Trophy, ExternalLink, Heart, Eye, Plus, Check, Edit3, Send, Bookmark, Share2, LogIn, UserCog } from 'lucide-react';
import { LazyImage } from '../../components';
import { toast } from 'sonner';
import ReactECharts from 'echarts-for-react';
import type { Player } from './data';
import type { MapProfileData } from './store';
import { useScoutMapStore } from './store';
import { useAuthStore } from '../../store/useAuthStore';
import { scoutApi, clubApi, http } from '../../services/api';
import ScoutReportEditor from '../ScoutDashboard/ScoutReportEditor';
import { TrialInviteModal } from './TrialInviteModal';
import { PhysicalTestTooltip } from '../../components/ui/PhysicalTestTooltip';

type TabKey = 'overview' | 'timeline' | 'reports';

interface PlayerDetailDrawerProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

const buildMockProfile = (player: Player): MapProfileData => ({
  id: Number(player.id), name: player.name, avatar: player.avatar, city: player.city, province: player.province,
  age: player.age, position: player.position, club: '深圳少年队',
  tags: player.tags?.length ? player.tags : ['速度型', '突破强'],
  score: player.score ?? player.rating ?? 0, potential: player.potential || 'B',
  heat: { views7d: 23, followers: 2 },
  radar: { visible: true, dimensions: ['速度', '技术', '身体', '战术', '心理', '潜力'], values: [85, 78, 80, 75, 82, 88] },
  physical: { visible: true, items: [{ name: '30m冲刺', value: '4.8s', percentile: 78 }, { name: '立定跳远', value: '1.95m', percentile: 85 }, { name: '俯卧撑', value: '32个', percentile: 72 }] },
  timeline: [{ date: '2026-04-10', type: 'match', title: '春季联赛 vs 广州青训', summary: '打进1球，获评全场最佳' }, { date: '2026-03-28', type: 'test', title: '月度体测更新', summary: '30m冲刺提升0.2s' }, { date: '2026-03-15', type: 'honor', title: 'U12最佳射手', summary: '单月打入12球' }],
  reports: player.hasReport ? [{ id: 101, type: 'ai', author: 'AI分析师', score: 82, summary: '突破能力强，建议加强逆足训练' }] : [],
  permissions: { canViewRadar: false, canViewPhysical: false, canViewReports: false, canContact: false },
});

const buildRadarOption = (profile: MapProfileData | null) => {
  if (!profile?.radar?.visible) return {};
  return {
    color: ['#39ff14'],
    radar: {
      indicator: profile.radar.dimensions.map((d) => ({ name: d, max: 100 })),
      axisName: { color: '#94a3b8' },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
      splitLine: { lineStyle: { color: '#2d3748' } },
      axisLine: { lineStyle: { color: '#2d3748' } },
    },
    series: [{ type: 'radar', data: [{ value: profile.radar.values, name: profile.name, areaStyle: { color: 'rgba(57,255,20,0.2)' }, lineStyle: { color: '#39ff14', width: 2 }, itemStyle: { color: '#39ff14' } }] }],
  };
};

const LockedOverlay: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e17]/70 backdrop-blur-[1px] rounded-xl">
    <div className="w-12 h-12 rounded-full bg-[#1a2332] border border-[#2d3748] flex items-center justify-center mb-3">
      <Lock className="w-5 h-5 text-[#fbbf24]" />
    </div>
    <div className="text-sm font-medium text-[#f8fafc] mb-1">{title}</div>
    {subtitle && <div className="text-xs text-[#94a3b8]">{subtitle}</div>}
  </div>
);

const PlayerDetailDrawer: React.FC<PlayerDetailDrawerProps> = ({ player, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [profile, setProfile] = useState<MapProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const { currentRole, isAuthenticated } = useAuthStore();
  const { addPlayerToCompare, isPlayerInBasket } = useScoutMapStore();
  const [isFollowing, setIsFollowing] = useState(false);

  const role = isAuthenticated ? currentRole : null;
  const inBasket = player ? isPlayerInBasket(player.id) : false;
  const radarOption = useMemo(() => buildRadarOption(profile), [profile]);

  useEffect(() => {
    if (isOpen && player) {
      queueMicrotask(() => {
        setActiveTab('overview');
        setLoading(true);
      });
      http.get(`/scout/players/${player.userId}/map-profile`)
        .then((res) => { const d = res.data?.success ? (res.data.data as MapProfileData) : buildMockProfile(player); setProfile(d); })
        .catch(() => setProfile(buildMockProfile(player)))
        .finally(() => setLoading(false));
    } else { queueMicrotask(() => setProfile(null)); }
  }, [isOpen, player]);

  const handleAddToShortlist = async () => {
    if (!player) return;
    try { await clubApi.addToShortlist({ playerIds: [Number(player.id)], note: '' }); toast.success(`${player.name} 已加入选材池`); }
    catch { toast.error('加入选材池失败'); }
  };

  const handleFollow = async () => {
    if (!player) return;
    try { await scoutApi.followPlayer(Number(player.id)); setIsFollowing(true); toast.success('已关注该球员'); }
    catch { toast.error('关注失败'); }
  };

  const handleCompare = () => {
    if (!player) return;
    const ok = addPlayerToCompare(player);
    if (!ok) toast.error('对比篮已满（最多4人），请先移除一名球员');
    else toast.success('已加入对比篮');
  };

  const actions = (() => {
    const common = { key: 'compare', label: inBasket ? '已加入对比' : '加入对比', icon: inBasket ? Check : Plus, variant: 'secondary' as const, onClick: handleCompare, disabled: inBasket };
    if (!role) return [
      { key: 'login', label: '登录查看详情', icon: LogIn, variant: 'primary' as const, onClick: () => { window.location.href = '/login'; } },
      common,
    ];
    if (role === 'user') return [
      { key: 'homepage', label: '查看完整主页', icon: ExternalLink, variant: 'primary' as const, onClick: () => { if (player) window.open(`/players/${player.id}`, '_blank'); } },
      { key: 'share', label: '分享卡片', icon: Share2, variant: 'secondary' as const, onClick: () => toast('分享功能开发中') },
      common,
    ];
    if (role === 'coach' || role === 'club') return [
      { key: 'shortlist', label: '加入选材池', icon: Bookmark, variant: 'primary' as const, onClick: handleAddToShortlist },
      { key: 'trial', label: '发送试训邀请', icon: Send, variant: 'secondary' as const, onClick: () => setTrialModalOpen(true) },
      { key: 'follow', label: isFollowing ? '已关注' : '关注', icon: Heart, variant: isFollowing ? 'ghost' : 'secondary' as const, onClick: handleFollow, disabled: isFollowing },
      common,
    ];
    if (role === 'scout' || role === 'analyst') return [
      { key: 'report', label: '写报告', icon: Edit3, variant: 'primary' as const, onClick: () => setReportModalOpen(true) },
      { key: 'follow', label: isFollowing ? '已关注' : '关注', icon: Heart, variant: isFollowing ? 'ghost' : 'secondary' as const, onClick: handleFollow, disabled: isFollowing },
      { key: 'track', label: '追踪', icon: Eye, variant: 'secondary' as const, onClick: () => toast('已加入追踪列表') },
      common,
    ];
    if (role === 'admin') return [
      { key: 'admin', label: '查看后台档案', icon: UserCog, variant: 'primary' as const, onClick: () => { window.location.href = '/admin/dashboard'; } },
      { key: 'tags', label: '编辑标签', icon: Edit3, variant: 'secondary' as const, onClick: () => toast('标签编辑开发中') },
      common,
    ];
    return [common];
  })();

  if (!isOpen || !player) return null;
  const initial = player.name ? player.name.charAt(0) : '?';
  const dp = profile || buildMockProfile(player);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div data-testid="player-detail-drawer" className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#111827] border-l border-[#2d3748] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3748]">
          <h3 className="text-lg font-semibold text-[#f8fafc]">球员详情</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1a2332] transition-colors"><X className="w-5 h-5 text-[#94a3b8]" /></button>
        </div>
        {loading ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 头像 + 信息骨架 */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#1a2332] border-2 border-[#2d3748] animate-pulse flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-[#1a2332] rounded w-32 animate-pulse" />
                <div className="h-4 bg-[#1a2332] rounded w-48 animate-pulse" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 bg-[#1a2332] rounded-full w-16 animate-pulse" />
                  <div className="h-5 bg-[#1a2332] rounded-full w-16 animate-pulse" />
                </div>
              </div>
            </div>
            {/* 统计卡片骨架 */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4 space-y-2">
                  <div className="h-3 bg-[#0f1419] rounded w-12 animate-pulse" />
                  <div className="h-6 bg-[#0f1419] rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
            {/* 评分卡片骨架 */}
            <div className="bg-gradient-to-br from-[rgba(57,255,20,0.08)] to-transparent border border-[#2d3748] rounded-xl p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-5 bg-[#1a2332] rounded w-24 animate-pulse" />
                <div className="h-8 bg-[#1a2332] rounded w-16 animate-pulse" />
              </div>
              <div className="h-4 bg-[#1a2332] rounded w-32 animate-pulse" />
            </div>
            {/* 标签页骨架 */}
            <div className="border-b border-[#2d3748] pb-2">
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-[#1a2332] rounded w-20 animate-pulse" />
                ))}
              </div>
            </div>
            {/* 内容区域骨架 */}
            <div className="space-y-4">
              <div className="h-56 bg-[#1a2332] border border-[#2d3748] rounded-xl animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="space-y-1">
                      <div className="h-4 bg-[#1a2332] rounded w-24 animate-pulse" />
                      <div className="h-3 bg-[#1a2332] rounded w-32 animate-pulse" />
                    </div>
                    <div className="h-6 bg-[#1a2332] rounded w-12 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#1a2332] border-2 border-[#39ff14] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(57,255,20,0.2)] flex-shrink-0 overflow-hidden">
                  {player.avatar ? <LazyImage src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" containerClassName="w-full h-full" /> : <span className="text-[#f8fafc] font-semibold">{initial}</span>}
                </div>
                <div>
                  <div className="text-xl font-bold text-[#f8fafc]">{player.name}</div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-[#94a3b8]"><MapPin className="w-3.5 h-3.5" /><span>{player.province} · {player.city}</span></div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2.5 py-0.5 bg-[rgba(57,255,20,0.1)] text-[#39ff14] text-xs rounded-full font-medium">{player.position}</span>
                    {dp.tags?.slice(0, 3).map((tag) => <span key={tag} className="px-2.5 py-0.5 bg-[#1a2332] text-[#94a3b8] text-xs rounded-full border border-[#2d3748]">{tag}</span>)}
                  </div>
                  {role !== 'user' && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#64748b]">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 本周 {dp.heat.views7d} 次查看</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {dp.heat.followers} 人关注</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4"><div className="flex items-center gap-2 text-[#94a3b8] text-xs mb-1"><Calendar className="w-3.5 h-3.5" />年龄</div><div className="text-lg font-semibold text-[#f8fafc]">{player.age} 岁</div></div>
                <div className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4"><div className="flex items-center gap-2 text-[#94a3b8] text-xs mb-1"><Footprints className="w-3.5 h-3.5" />惯用脚</div><div className="text-lg font-semibold text-[#f8fafc]">{player.foot || player.preferredFoot || '—'}</div></div>
                <div className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4"><div className="flex items-center gap-2 text-[#94a3b8] text-xs mb-1"><Ruler className="w-3.5 h-3.5" />身高</div><div className="text-lg font-semibold text-[#f8fafc]">{player.height ? `${player.height} cm` : '—'}</div></div>
                <div className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4"><div className="flex items-center gap-2 text-[#94a3b8] text-xs mb-1"><Weight className="w-3.5 h-3.5" />体重</div><div className="text-lg font-semibold text-[#f8fafc]">{player.weight ? `${player.weight} kg` : '—'}</div></div>
              </div>

              <div className="bg-gradient-to-br from-[rgba(57,255,20,0.08)] to-transparent border border-[#2d3748] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-[#f8fafc] font-medium"><Star className="w-4 h-4 text-[#fbbf24]" />综合能力</div><div className="text-2xl font-bold text-[#39ff14]">{player.score ?? player.rating ?? '—'}</div></div>
                <div className="flex items-center gap-2 text-sm text-[#94a3b8]"><span>潜力评级</span><span className="px-2 py-0.5 bg-[rgba(0,212,255,0.1)] text-[#00d4ff] rounded text-xs font-semibold">{player.potential || 'B'}</span></div>
              </div>

              <div className="border-b border-[#2d3748]">
                <div className="flex gap-1">
                  {[{ key: 'overview', label: '能力概览' }, { key: 'timeline', label: '成长轨迹' }, { key: 'reports', label: '球探报告' }].map((t) => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as TabKey)} className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === t.key ? 'text-[#39ff14]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                      {t.label}
                      {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#39ff14] rounded-t" />}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="relative bg-[#1a2332] border border-[#2d3748] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#f8fafc] font-medium mb-3"><BarChart3 className="w-4 h-4 text-[#94a3b8]" />能力雷达图</div>
                    <div className="h-56"><ReactECharts option={radarOption} style={{ height: '100%' }} /></div>
                    {!dp.permissions.canViewRadar && <LockedOverlay title="开通会员查看完整雷达图" subtitle="包含6大维度深度分析" />}
                  </div>
                  <div className="relative bg-[#1a2332] border border-[#2d3748] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#f8fafc] font-medium mb-3"><Trophy className="w-4 h-4 text-[#94a3b8]" />体测数据</div>
                    <div className="space-y-3">
                      {dp.physical.items.map((item) => {
                        // 体测项名称 → API key 映射
                        const nameToKey: Record<string, string> = {
                          '30m冲刺': 'sprint_30m',
                          '50m冲刺': 'sprint_50m',
                          '立定跳远': 'standing_long_jump',
                          '纵跳': 'vertical_jump',
                          '俯卧撑': 'push_up',
                          '仰卧起坐': 'sit_up',
                          '平板支撑': 'plank',
                          '敏捷梯': 'agility_ladder',
                          'T型跑': 't_test',
                          '折返跑': 'shuttle_run',
                          '坐位体前屈': 'sit_and_reach',
                        };
                        const apiKey = nameToKey[item.name] || '';
                        return (
                          <div key={item.name} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-[#f8fafc] inline-flex items-center gap-1">
                                {item.name}
                                {apiKey && <PhysicalTestTooltip itemKey={apiKey} compact />}
                              </div>
                              <div className="text-xs text-[#64748b]">超过同龄 {item.percentile}% 球员</div>
                            </div>
                            <div className="text-lg font-semibold text-[#39ff14]">{item.value}</div>
                          </div>
                        );
                      })}
                    </div>
                    {!dp.permissions.canViewPhysical && <LockedOverlay title="开通会员查看完整体测数据" subtitle="包含同龄百分位对比" />}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {dp.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${item.type === 'match' ? 'bg-[#39ff14]' : item.type === 'test' ? 'bg-[#00d4ff]' : 'bg-[#fbbf24]'}`} />
                        {idx < dp.timeline.length - 1 && <div className="w-px flex-1 bg-[#2d3748] mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-xs text-[#64748b] mb-0.5">{item.date}</div>
                        <div className="text-sm font-medium text-[#f8fafc]">{item.title}</div>
                        <div className="text-xs text-[#94a3b8]">{item.summary}</div>
                      </div>
                    </div>
                  ))}
                  <Link to={`/players/${player.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-[#39ff14] hover:underline">查看完整主页 <ExternalLink className="w-3.5 h-3.5" /></Link>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {!dp.permissions.canViewReports ? (
                    <div className="relative bg-[#1a2332] border border-[#2d3748] rounded-xl p-8 text-center overflow-hidden">
                      <LockedOverlay title="高阶权限可见" subtitle="开通会员或申请认证角色查看" />
                      <div className="blur-sm">
                        <div className="text-left space-y-3">
                          <div className="p-3 bg-[#111827] rounded-lg border border-[#2d3748]">
                            <div className="text-sm font-medium text-[#f8fafc]">AI分析师 · 评分 82</div>
                            <div className="text-xs text-[#94a3b8] mt-1">突破能力强，建议加强逆足训练</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : dp.reports.length === 0 ? (
                    <div className="text-center py-8 text-[#94a3b8]">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-[#64748b]" />
                      <p>暂无报告，你是第一个发现他的人</p>
                      {(role === 'scout' || role === 'analyst') && <button onClick={() => setReportModalOpen(true)} className="mt-3 px-4 py-2 bg-[#39ff14] text-[#0a0e17] rounded-lg text-sm font-medium">写报告</button>}
                    </div>
                  ) : (
                    dp.reports.map((report) => (
                      <div key={report.id} className="p-4 bg-[#1a2332] border border-[#2d3748] rounded-xl">
                        <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-[#f8fafc]">{report.author}</span><span className="text-xs px-2 py-0.5 bg-[rgba(57,255,20,0.1)] text-[#39ff14] rounded">{report.type === 'ai' ? 'AI报告' : '人工报告'}</span></div>
                        <div className="text-xs text-[#94a3b8] mb-2">评分: <span className="text-[#fbbf24] font-semibold">{report.score}</span></div>
                        <p className="text-sm text-[#94a3b8]">{report.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="relative overflow-hidden rounded-xl border border-[#2d3748] bg-[#1a2332]">
                <div className="p-5"><div className="flex items-center gap-2 text-[#f8fafc] font-medium mb-3"><Phone className="w-4 h-4 text-[#94a3b8]" />联系方式</div><p className="text-sm text-[#94a3b8]">家长电话：{player.phone || '138****8888'}</p></div>
                {!dp.permissions.canContact && <LockedOverlay title="会员专享" subtitle="升级后即可获取联系方式" />}
              </div>
            </div>

            <div className="p-4 border-t border-[#2d3748] bg-[#111827]">
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button key={action.key} onClick={action.onClick} disabled={action.disabled} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${action.variant === 'primary' ? 'bg-[#39ff14] text-[#0a0e17] hover:opacity-90' : action.variant === 'secondary' ? 'bg-[#2d3748] text-[#f8fafc] hover:bg-[#3d4758]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                    <action.icon className="w-4 h-4" />{action.label}
                  </button>
                ))}
              </div>
              {!role && (
                <button className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#0a0e17] rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                  开通会员解锁全部信息
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {reportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setReportModalOpen(false)}>
          <div className="bg-[#111827] border border-[#2d3748] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#2d3748] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#f8fafc]">撰写球探报告</h3>
              <button onClick={() => setReportModalOpen(false)}><X className="w-5 h-5 text-[#94a3b8]" /></button>
            </div>
            <div className="p-4">
              <ScoutReportEditor
                player={{ id: player.id, name: player.name, age: player.age, position: player.position, avatar: player.avatar }}
                onPublish={() => { setReportModalOpen(false); toast.success('报告已发布'); http.get(`/scout/players/${player.userId}/map-profile`).then((res) => { if (res.data?.success) setProfile(res.data.data as MapProfileData); }).catch(() => {}); }}
                onBack={() => setReportModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {trialModalOpen && player && (
        <TrialInviteModal
          playerId={player.userId}
          playerName={player.name}
          onClose={() => setTrialModalOpen(false)}
        />
      )}
    </>
  );
};

export default PlayerDetailDrawer;
