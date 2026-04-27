import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coachApi } from '../services/club';
import { Loading } from '../components/ui/loading';
import { LazyImage } from '../components';
import SocialFeed, { CreatePostModal } from './ScoutMap/SocialFeed';
import { FollowButton, MessageModal, FavoriteButton, LikeButton } from '../components/social';
import { useAuthStore } from '../store';
import {
  ArrowLeft,
  GraduationCap,
  Shield,
  Clock,
  Users,
  FileText,
  Award,
  MapPin,
  Calendar,
  CheckCircle,
  Share2,
  Copy,
  CheckCircle as CheckCircleIcon,
  ChevronRight,
  Edit3,
  Mail,
} from 'lucide-react';

interface CoachProfile {
  id: number;
  license_type: string;
  license_number: string;
  specialties: string[];
  style: string[];
  age_groups: string[];
  bio: string;
  coaching_years: number;
  current_club: string;
  city: string;
  verified: boolean;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
}

interface CoachStats {
  followed_players: number;
  training_notes: number;
  coaching_years: number;
  team_count: number;
}

interface CoachPublicNote {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

interface FootballExperience {
  id: number;
  stage: string;
  stage_name: string;
  team_name: string;
  position: string;
  start_year: number;
  end_year: number;
  level: string;
  honors: string;
}

interface CoachPublicProfile {
  coach: CoachProfile;
  stats: CoachStats;
  sample_notes: CoachPublicNote[];
  coaching_teams: Array<{ id: number; name: string; logo: string }>;
  football_experiences: FootballExperience[];
}

const CoachHomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CoachPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'about'>('home');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.id && id && String(currentUser.id) === String(id);

  useEffect(() => {
    if (id) {
      loadProfile(parseInt(id));
    }
  }, [id]);

  const loadProfile = async (coachIdOrUserId: number) => {
    try {
      setLoading(true);
      setError(null);
      // 优先通过 user_id 查询（因为 RoleSwitcher 传入的是 user.id）
      let res = await coachApi.getPublicProfileByUser(coachIdOrUserId);
      // 如果失败，尝试通过 coach_id 查询
      if (!res.data?.success) {
        res = await coachApi.getPublicProfile(coachIdOrUserId);
      }
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setError('获取教练信息失败');
      }
    } catch (err: any) {
      console.error('获取教练主页失败:', err);
      setError(err.message || '获取教练信息失败');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '技术': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case '战术': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case '体能': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case '心理': return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '技术': return '⚽';
      case '战术': return '📋';
      case '体能': return '💪';
      case '心理': return '🧠';
      default: return '📝';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'primary': return '🏃';
      case 'middle': return '🏃';
      case 'high': return '🎓';
      case 'university': return '🎓';
      case 'professional': return '⚽';
      default: return '⚽';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-24">
        <div className="max-w-[900px] mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-24">
        <div className="max-w-[900px] mx-auto px-4 text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">教练不存在</h2>
          <p className="text-slate-400 mb-6">{error || '无法找到该教练'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { coach, stats, sample_notes } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12]">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(251,191,36,0.08)_0%,transparent_70%)] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-[900px] mx-auto">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
            <Link
              to="/"
              className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 to-amber-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center">
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                <span className="text-white text-xs sm:text-sm font-medium">返回</span>
              </div>
            </Link>

            <button
              onClick={copyLink}
              className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center">
                    {shareCopied ? (
                      <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                <span className="text-white text-xs sm:text-sm font-medium">{shareCopied ? '已复制' : '分享'}</span>
              </div>
            </button>
          </div>

          {/* 品牌展示区域 */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img
                src="/logo2.png"
                alt="少年球探"
                className="h-40 sm:h-48 mx-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-breathe"
              />
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              <span className="text-lg sm:text-xl font-bold tracking-[0.15em] text-orange-400"
                style={{ textShadow: '0 0 10px rgba(249,115,22,0.8), 0 0 20px rgba(249,115,22,0.5)' }}>
                专业教练
              </span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent via-orange-500 to-transparent" />
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { key: 'home', label: '主页', icon: '🏠' },
              { key: 'activity', label: '动态', icon: '📝' },
              { key: 'about', label: '关于', icon: 'ℹ️' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                    : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 主页 Tab */}
          {activeTab === 'home' && (
            <>
          {/* 教练资料卡 */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-orange-500/20">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* 头像 */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-full overflow-hidden border-3 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:scale-105 transition-transform duration-500">
                {coach.user?.avatar ? (
                  <LazyImage src={coach.user.avatar} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                    👤
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {coach.user?.nickname || coach.current_club || '教练'}
                </h1>
                <p className="text-orange-400/60 text-sm mb-4 flex items-center justify-center md:justify-start gap-1.5">
                  <span className="w-4 h-px bg-orange-400/30" />
                  {coach.license_type || '教练'}
                  {coach.city && <><span className="w-4 h-px bg-orange-400/30" />{coach.city}</>}
                  <span className="w-4 h-px bg-orange-400/30" />
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  {coach.verified && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <Shield className="w-3 h-3 inline mr-1" />已认证
                    </span>
                  )}
                  {coach.license_type && (
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium">
                      {coach.license_type}
                    </span>
                  )}
                  {coach.coaching_years > 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                      {coach.coaching_years}年执教经验
                    </span>
                  )}
                </div>

                {/* 简介 */}
                {coach.bio && (
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {coach.bio}
                  </p>
                )}

                {/* 社交操作 */}
                {!isOwnProfile && coach.user?.id && (
                  <div className="flex items-center gap-3 mb-4">
                    <FollowButton
                      userId={coach.user.id}
                      size="md"
                      showCount={false}
                    />
                    <LikeButton
                      targetType="coach_homepage"
                      targetId={coach.user.id}
                      size="md"
                      showCount={false}
                    />
                    <FavoriteButton
                      targetType="coach_homepage"
                      targetId={coach.user.id}
                      size="md"
                      showText={false}
                    />
                    <button
                      onClick={() => setIsMessageOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a2332] hover:bg-[#2d3748] text-slate-300 text-sm font-medium rounded-xl border border-[#2d3748] hover:border-[#39ff14]/30 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      私信
                    </button>
                  </div>
                )}

                {/* 专长 */}
                {coach.specialties && coach.specialties.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    {coach.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* 执教风格 */}
                {coach.style && coach.style.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    {coach.style.map((s, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* 擅长年龄段 */}
                {coach.age_groups && coach.age_groups.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {coach.age_groups.map((ag, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs">
                        {ag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: '关注球员',
                value: stats.followed_players,
                icon: Users,
                color: 'orange',
                gradient: 'from-orange-500/20 to-amber-500/20',
                border: 'border-orange-500/30',
                textColor: 'text-orange-400',
              },
              {
                label: '训练笔记',
                value: stats.training_notes,
                icon: FileText,
                color: 'blue',
                gradient: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-500/30',
                textColor: 'text-blue-400',
              },
              {
                label: '执教年限',
                value: stats.coaching_years > 0 ? `${stats.coaching_years}年` : '-',
                icon: Clock,
                color: 'emerald',
                gradient: 'from-emerald-500/20 to-teal-500/20',
                border: 'border-emerald-500/30',
                textColor: 'text-emerald-400',
              },
              {
                label: '执教球队',
                value: stats.team_count > 0 ? stats.team_count : '-',
                icon: Award,
                color: 'violet',
                gradient: 'from-violet-500/20 to-purple-500/20',
                border: 'border-violet-500/30',
                textColor: 'text-violet-400',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.border} backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
          )}

          {/* 动态 Tab */}
          {activeTab === 'activity' && (
            <>
            {/* 社区动态 */}
            <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-white/10">
              {isOwnProfile && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(57,255,20,0.08)] hover:bg-[rgba(57,255,20,0.15)] border border-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)] rounded-xl transition-all text-[#39ff14] text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>分享你的训练日常、选材见闻...</span>
                  </button>
                </div>
              )}
              <SocialFeed
                userId={Number(id) || undefined}
                hideCreate
                title="TA的动态"
                maxPosts={6}
              />
            </div>

            {/* 代表训练笔记 */}
            {sample_notes && sample_notes.length > 0 && (
              <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-white/10">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                  <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-400" />
                  </span>
                  代表训练笔记
                  <span className="text-sm font-normal text-slate-400 ml-2">({sample_notes.length}篇)</span>
                </h3>

                <div className="space-y-4">
                  {sample_notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-[rgba(10,14,23,0.6)] border border-[rgba(249,115,22,0.1)] hover:border-orange-500/30 hover:bg-[rgba(10,14,23,0.8)] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getCategoryIcon(note.category)}</span>
                          <div>
                            <h4 className="font-medium text-white text-sm">{note.title}</h4>
                            <p className="text-xs text-slate-400">{note.created_at}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(note.category)}`}>
                          {note.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}

          {/* 关于 Tab */}
          {activeTab === 'about' && (
            <>
            {/* 足球经历时间线 ⭐ */}
            {profile.football_experiences && profile.football_experiences.length > 0 && (
              <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-white/10">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-lg">⚽</span>
                  </span>
                  足球经历
                  <span className="text-sm font-normal text-slate-400 ml-2">({profile.football_experiences.length}段)</span>
                </h3>

                <div className="relative">
                  {/* 时间线连接线 */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500 via-orange-500 to-amber-500" />

                  <div className="space-y-6 pl-10">
                    {profile.football_experiences.map((exp, index) => (
                      <div key={exp.id} className="relative">
                        {/* 时间线节点 */}
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-[#0f1419] shadow-lg shadow-emerald-500/30" />

                        <div className="p-4 rounded-xl bg-[rgba(10,14,23,0.6)] border border-[rgba(249,115,22,0.1)] hover:border-emerald-500/30 transition-all duration-300">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getStageIcon(exp.stage)}</span>
                              <div>
                                <h4 className="font-semibold text-white">{exp.team_name}</h4>
                                <p className="text-sm text-emerald-400">{exp.stage_name}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                              {exp.start_year}{exp.end_year ? `-${exp.end_year}` : '-至今'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm">
                            {exp.position && (
                              <span className="text-slate-400">
                                <span className="text-slate-500">位置：</span>{exp.position}
                              </span>
                            )}
                            {exp.level && (
                              <span className="text-slate-400">
                                <span className="text-slate-500">级别：</span>{exp.level}
                              </span>
                            )}
                          </div>

                          {exp.honors && (
                            <div className="mt-3 pt-3 border-t border-[rgba(249,115,22,0.1)]">
                              <p className="text-sm text-amber-400">
                                <span className="text-slate-500">🏆 </span>{exp.honors}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(!profile.football_experiences || profile.football_experiences.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-4">⚽</div>
                <p>暂无足球经历记录</p>
              </div>
            )}
            </>
          )}

          {/* 足球经历时间线 ⭐ */}
          {profile.football_experiences && profile.football_experiences.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-white/10">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-lg">⚽</span>
                </span>
                足球经历
                <span className="text-sm font-normal text-slate-400 ml-2">({profile.football_experiences.length}段)</span>
              </h3>

              <div className="relative">
                {/* 时间线连接线 */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500 via-orange-500 to-amber-500" />

                <div className="space-y-6 pl-10">
                  {profile.football_experiences.map((exp, index) => (
                    <div key={exp.id} className="relative">
                      {/* 时间线节点 */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-[#0f1419] shadow-lg shadow-emerald-500/30" />

                      <div className="p-4 rounded-xl bg-[rgba(10,14,23,0.6)] border border-[rgba(249,115,22,0.1)] hover:border-emerald-500/30 transition-all duration-300">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getStageIcon(exp.stage)}</span>
                            <div>
                              <h4 className="font-semibold text-white">{exp.team_name}</h4>
                              <p className="text-sm text-emerald-400">{exp.stage_name}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                            {exp.start_year}{exp.end_year ? `-${exp.end_year}` : '-至今'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                          {exp.position && (
                            <span className="text-slate-400">
                              <span className="text-slate-500">位置：</span>{exp.position}
                            </span>
                          )}
                          {exp.level && (
                            <span className="text-slate-400">
                              <span className="text-slate-500">级别：</span>{exp.level}
                            </span>
                          )}
                        </div>

                        {exp.honors && (
                          <div className="mt-3 pt-3 border-t border-[rgba(249,115,22,0.1)]">
                            <p className="text-sm text-amber-400">
                              <span className="text-slate-500">🏆 </span>{exp.honors}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 品牌标识 */}
          <div className="rounded-2xl p-6 text-center backdrop-blur-xl bg-gradient-to-br from-[rgba(30,24,20,0.95)] to-[rgba(24,20,14,0.98)] border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg flex items-center justify-center">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent">少年球探</h3>
                <p className="text-xs text-slate-400">Youth Scout</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-3">发现下一个足球之星</p>
            <div className="pt-3 border-t border-[rgba(249,115,22,0.1)]">
              <p className="text-xs text-slate-500">www.shaonianqiutan.com</p>
            </div>
          </div>

          {/* 页脚 */}
          <div className="text-center pt-8 mt-8 border-t border-[rgba(249,115,22,0.1)]">
            <p className="text-slate-500 text-sm">少年球探 Youth Scout - 发现下一个足球之星</p>
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(249,115,22,0.5)) drop-shadow(0 0 60px rgba(251,191,36,0.3));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 50px rgba(249,115,22,0.8)) drop-shadow(0 0 80px rgba(251,191,36,0.5));
          }
        }

        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="coach"
      />

      {isMessageOpen && coach.user && (
        <MessageModal
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          userId={coach.user.id}
          userName={coach.user.nickname || '教练'}
          userAvatar={coach.user.avatar}
        />
      )}
    </div>
  );
};

export default CoachHomePage;
